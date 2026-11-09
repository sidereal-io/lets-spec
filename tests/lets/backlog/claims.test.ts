import { AdapterFailure } from '../../../lets/src/backlog/errors.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, story } from './fixtures/adapter.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { nativeClaimFixture, pendingClaimVerification, acquiredClaim, submissionFor } from './fixtures/submitted.ts';
import { mkdirSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { githubDefinition } from '../../../lets/src/backlog/config.ts';
import { projectArguments } from '../../../lets/src/backlog/projections.ts';

test('release refreshes ownership before each cleanup write', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/release-native-claim-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { item, release } = acquiredClaim(store);
    const issued = store.issue(release);
    if (issued.state !== 'action') throw new Error('release preflight required');
    let response = store.submit(issued.continuation, submissionFor(issued.action, { data: {
      item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } },
    } }), 201);
    assert.equal(response.state, 'action');
    if (response.state !== 'action') throw new Error('reset action required');
    assert.equal(response.action.step, 'reset-status');
    response = store.submit(response.continuation, submissionFor(response.action, { data: { valid: true, gaps: [] } }), 202);
    if (response.state !== 'action') throw new Error('fresh ownership read required');
    assert.equal(response.action.step, 'read-before-unassign');
    assert.deepEqual(response.action.allowedEffects, []);
    assert.throws(() => store.submit(response.continuation, submissionFor(response.action, { data: {
      item: { ...item, owners: ['other'], metadata: { ...item.metadata, Status: 'Todo' } },
    } }), 203), (error: unknown) => error instanceof AdapterFailure && error.effects === 'partial');
    assert.equal(store.get(release.operationId).action.step, 'read-before-unassign');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('release cannot adopt another worker acquisition', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/adopt-native-claim-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { release } = acquiredClaim(store);
    const other = issueAction({ ...release.request, context: { ...release.request.context, session: 'other-worker' } },
      release.definition, release.connection, { step: 'preflight', validationOperation: 'item.read', toolArguments: [], allowedEffects: [],
        requiredCapabilities: ['claims'], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 200);
    assert.throws(() => store.issue(other), /original.*worker/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('completed release consumes its original acquisition authority', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/complete-native-release-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { item, release } = acquiredClaim(store);
    let response: ReturnType<OperationStore['submit']> = store.issue(release);
    for (const output of [
      { item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } } },
      { valid: true, gaps: [] }, { item: { ...item, owners: ['me'] } }, { valid: true, gaps: [] }, { item },
    ]) {
      if (response.state !== 'action') throw new Error('release action required');
      response = store.submit(response.continuation, submissionFor(response.action, { data: output }), 201);
    }
    assert.equal(response.state, 'complete');
    if (!('result' in response)) throw new Error('release result required');
    assert.deepEqual(response.result, { released: true });
    const repeated = issueAction(release.request, release.definition, release.connection, { step: 'preflight',
      validationOperation: 'item.read', toolArguments: [], allowedEffects: [], requiredCapabilities: ['claims'],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 202);
    assert.throws(() => store.issue(repeated), /already released/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('shipped release targets the recorded actor and Todo option', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const release = definition.definition.operations['claim.release'];
  assert.ok(release, 'shipped release mappings required');
  const scope = { backlog: 'P1', claim: { actorId: 'U1', projectItemId: 'PI1', statusFieldId: 'F1', todoOptionId: 'TODO' } };
  const input = { item: { provider: 'github', backlog: 'P1', id: 'I1' } };
  const reset = projectArguments(release.actions['reset-status'].bindings.gh.arguments, input, scope) as string[];
  const unassign = projectArguments(release.actions.unassign.bindings.gh.arguments, input, scope) as string[];
  assert.ok(reset.includes('option=TODO'));
  assert.ok(reset.includes('item=PI1'));
  assert.ok(unassign.includes('actor=U1'));
  assert.ok(unassign.some((argument) => argument.includes('removeAssigneesFromAssignable')));
});
test('native claim preflight requests a complete executable GraphQL query', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['claim.acquire'].actions.preflight.bindings.gh;
  const args = projectArguments(mapping.arguments, { item: { provider: 'github', backlog: 'P1', id: 'I1' } }, { backlog: 'P1' }) as string[];
  const query = args.find((argument) => argument.startsWith('query='))!;
  assert.ok(query.startsWith('query=query('), 'preflight must issue a GraphQL query operation');
  for (const fragment of ['viewer{id login}', 'node(id:$id)', 'blockedBy(first:100)', 'assignees(first:100)', 'project:node(id:$project)'])
    assert.ok(query.includes(fragment), `required native preflight field: ${fragment}`);
});
test('uncertain release reconciles through reads without repeating cleanup', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/resume-native-release-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { item, release } = acquiredClaim(store);
    const issued = store.issue(release);
    if (issued.state !== 'action') throw new Error('release preflight required');
    const reset = store.submit(issued.continuation, submissionFor(issued.action, { data: {
      item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } },
    } }), 201);
    if (reset.state !== 'action') throw new Error('reset required');
    const resumed = new OperationStore(join(dir, 'private')).resume(release.operationId, 300);
    assert.deepEqual(resumed.action.allowedEffects, []);
    const response = store.submit(resumed.continuation, submissionFor(resumed.action, { data: { item } }), 301);
    assert.equal(response.state, 'complete');
    if (!('result' in response)) throw new Error('release reconciliation required');
    assert.equal(response.result.reconciliation, 'applied');
    assert.equal(response.result.reservationCleared, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('claim authorizes work only after fresh sole-owner In Progress verification', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/verify-native-claim-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { response, item, operationId } = pendingClaimVerification(store);
    assert.equal(response.action.step, 'verify');
    assert.deepEqual(response.action.allowedEffects, []);
    assert.equal(store.get(operationId).pending, true);
    const completed = store.submit(response.continuation, submissionFor(response.action, { data: {
      item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } },
    } }), 103);
    assert.equal(completed.state, 'complete');
    if (!('result' in completed)) throw new Error('claim result required');
    assert.deepEqual(completed.result.claim, { actor: 'me', session: 'worker', token: operationId,
      status: 'In Progress', guarantee: 'best-effort' });
    assert.equal(store.get(operationId).pending, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const [label, owners, status] of [
  ['unassigned', [], 'In Progress'], ['another actor', ['other'], 'In Progress'],
  ['multiple owners', ['me', 'other'], 'In Progress'], ['wrong status', ['me'], 'Todo'],
] as const) {
  test(`final claim verification refuses ${label}`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/conflicting-native-claim-');
    try {
      const store = new OperationStore(join(dir, 'private'));
      const { response, item, operationId } = pendingClaimVerification(store);
      assert.throws(() => store.submit(response.continuation, submissionFor(response.action, { data: {
        item: { ...item, owners, metadata: { ...item.metadata, Status: status } },
      } }), 103), (error: unknown) => error instanceof AdapterFailure && error.effects === 'partial');
      assert.equal(store.get(operationId).pending, true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
test('uncertain native claim resumes with a bounded verification read', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/resume-native-claim-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    const { response, item, operationId } = pendingClaimVerification(store);
    const resumed = new OperationStore(join(dir, 'private')).resume(operationId, 200);
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.operationId, operationId);
    const result = store.submit(response.continuation, submissionFor(resumed.action, { data: {
      item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } },
    } }), 201);
    assert.equal(result.state, 'complete');
    if (!('result' in result)) throw new Error('reconciliation result required');
    assert.equal(result.result.reconciliation, 'applied');
    assert.equal(result.result.reservationCleared, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('status failure after assignment returns partial claim recovery', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/partial-native-claim-');
  try {
    const { action, item } = nativeClaimFixture();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const assignment = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
    assert.equal(assignment.state, 'action');
    if (assignment.state !== 'action') throw new Error('assignment action required');
    assert.equal(assignment.action.step, 'assign');
    const read = store.submit(issued.continuation, submissionFor(assignment.action, { data: { valid: true, gaps: [] } }), 102);
    if (read.state !== 'action') throw new Error('fresh assignment read required');
    const status = store.submit(issued.continuation, submissionFor(read.action, { data: { item: { ...item, owners: ['me'] } } }), 103);
    if (status.state !== 'action') throw new Error('status action required');
    assert.equal(status.action.step, 'status');
    assert.throws(() => store.submit(issued.continuation, { ...submissionFor(status.action, {}),
      execution: { outcome: 'failure', exitCode: 1 } }, 104),
    (error: unknown) => error instanceof AdapterFailure && error.effects === 'partial');
    const record = store.get(action.operationId);
    assert.equal(record.state, 'needs-reconciliation');
    assert.equal(record.pending, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const link of ['repository', 'project', 'neither'] as const) {
test(`shipped GitHub claim preflight binds native assignment identity for a Project linked from the ${link} side`, () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/shipped-native-claim-');
  try {
    const fixture = nativeClaimFixture();
    const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
    const action = issueAction(fixture.action.request, definition, fixture.action.connection, {
      step: 'preflight', validationOperation: 'item.read', toolArguments: [], allowedEffects: [], requiredCapabilities: ['claims'],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
    const output = JSON.parse(readFileSync(new URL('./fixtures/github-issue.json', import.meta.url), 'utf8'));
    output.data.viewer = { id: 'U1', login: 'me' };
    const issue = output.data.node;
    issue.assignees = { nodes: [], totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null } };
    issue.blockedBy = { nodes: [], totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null } };
    issue.repository.projectsV2 = link === 'repository'
      ? { nodes: [{ id: 'P1' }], totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } }
      : { nodes: [], totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null } };
    for (const field of issue.projectItems.nodes[0].fieldValues.nodes)
      if (field.field?.name === 'Status') field.name = 'Todo';
    const repositories = link === 'project'
      ? { nodes: [{ id: 'R1' }], totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } }
      : { nodes: [], totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null } };
    output.data.project = { id: 'P1', repositories, fields: { nodes: [{ __typename: 'ProjectV2SingleSelectField', id: 'F1', name: 'Status',
      options: [{ id: 'TODO', name: 'Todo' }, { id: 'PROGRESS', name: 'In Progress' }] }],
      pageInfo: { hasNextPage: false, endCursor: null } } };
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    if (link === 'neither') {
      assert.throws(() => store.submit(issued.continuation, submissionFor(action, output), 101),
        (error: unknown) => error instanceof AdapterFailure && error.effects === 'none' && /not linked to this repository/.test(error.message));
      return;
    }
    const response = store.submit(issued.continuation, submissionFor(action, output), 101);
    assert.equal(response.state, 'action');
    if (response.state !== 'action') throw new Error('native assignment required');
    assert.equal(response.action.step, 'assign');
    assert.ok((response.action.tool.arguments as string[]).includes('actor=U1'));
    assert.deepEqual(response.action.allowedEffects, ['assignment']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
}
test('lost acquire is reconciled against current ownership', () =>
  withAdapter(async ({ call }) => {
    const item = (await call('item.create', story, 'create')).item.identity;
    await assert.rejects(
      call('claim.acquire', { item }, 'claim', { fault: 'error-unknown_outcome' }),
      /unknown_outcome/,
    );
    assert.equal((await call('mutation.read', { mutationId: 'claim' })).state, 'applied');
    const { claim } = await call('claim.read', { item });
    assert.equal(claim.session, 'worker');
    assert.equal(claim.status, 'In Progress');
    await assert.rejects(
      call('claim.acquire', { item }, 'other', { context: { session: 'other' } }),
      /conflict/,
    );
  }));
test('another session cannot release a partial claim', () =>
  withAdapter(async ({ call }) => {
    const item = (await call('item.create', story, 'create')).item.identity;
    await assert.rejects(
      call('claim.acquire', { item }, 'claim', { fault: 'partial-claim' }),
      (error: unknown) =>
        error instanceof AdapterFailure &&
        error.category === 'unknown_outcome' &&
        error.effects === 'partial',
    );
    assert.equal((await call('mutation.read', { mutationId: 'claim' })).state, 'unknown');
    const { claim } = await call('claim.read', { item });
    assert.equal(claim.status, 'Todo');
    assert.equal(claim.session, 'worker');
    await assert.rejects(
      call('claim.release', { item, token: claim.token }, 'release', {
        context: { session: 'other' },
      }),
      /conflict/,
    );
    assert.equal(
      (await call('claim.release', { item, token: claim.token }, 'release-own')).released,
      true,
    );
  }));

import { validateSubmission } from '../../../lets/src/backlog/submissions.ts';
import { submittedClaim } from './fixtures/submitted.ts';
for (const [label, assignees, status, complete, expected] of [
  ['no assignee', [], 'Todo', true, 'unassigned'],
  ['another actor', ['other'], 'In Progress', true, 'other'],
  ['several actors', ['me', 'other'], 'Todo', true, 'multiple'],
  ['wrong status', ['me'], 'Todo', true, 'status-mismatch'],
  ['missing status', ['me'], null, true, 'unavailable'],
  ['incomplete assignees', ['me'], 'In Progress', false, 'unavailable'],
  ['sole current actor', ['me'], 'In Progress', true, 'sole-actor'],
] as const) {
  test(`read-only ownership verdict identifies ${label}`, () => {
    const base = submittedClaim().action;
    const input = base.request.input;
    const action = issueAction({ ...base.request, operation: 'claim.read' }, base.definition, base.connection, {
      step: 'read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
    const result = validateSubmission(action, submissionFor(action, { data: { claim: {
      item: (input as { item: unknown }).item, actor: 'me', session: 'historic', token: 'historic',
      status, guarantee: 'best-effort', assignees, assigneesComplete: complete,
    } } }), { op: 'path', path: ['data'] }, 101);
    assert.equal((result.claim as { verdict: string }).verdict, expected);
    assert.deepEqual(action.allowedEffects, []);
  });
}
test('pending mutation takes precedence over a fresh ownership read', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pending-ownership-');
  try {
    const base = submittedClaim().action;
    const store = new OperationStore(join(dir, 'private'));
    store.issue(base);
    const action = issueAction({ ...base.request, operation: 'claim.read' }, base.definition, base.connection, {
      step: 'read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 101);
    const response = store.issue(action);
    assert.equal(response.state, 'needs-reconciliation');
    if (response.state !== 'needs-reconciliation') throw new Error('pending verdict required');
    assert.equal(response.reason, 'pending-mutation');
    assert.equal(response.operationId, base.operationId);
    assert.throws(() => store.get(action.operationId), /ENOENT/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
