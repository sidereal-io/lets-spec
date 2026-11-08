import { AdapterFailure } from '../../../lets/src/backlog/errors.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, story } from './fixtures/adapter.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submittedRead, submissionFor } from './fixtures/submitted.ts';
import { mkdirSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { githubDefinition } from '../../../lets/src/backlog/config.ts';

function nativeClaimFixture() {
  const base = submittedRead().action;
  const steps = ['preflight', 'assign', 'read-assignment', 'status', 'verify'];
  const definition = loadDefinition([{ source: 'fixture:native-claim', value: {
    ...base.definition.definition, operations: { 'claim.acquire': { actions: Object.fromEntries(steps.map((step) => [step, {
      bindings: { gh: { arguments: ['api', step], projection: { op: 'path', path: ['data'] } } },
    }])) } },
  } }]);
  const action = issueAction({ contractVersion: 1, operation: 'claim.acquire', context: base.request.context,
    input: { item: { provider: 'github', backlog: 'P1', id: 'I1' } } }, definition, base.connection, {
    step: 'preflight', validationOperation: 'item.read', toolArguments: [], allowedEffects: [], requiredCapabilities: ['claims'],
    timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
  }, 100);
  const item = { identity: { provider: 'github', backlog: 'P1', id: 'I1' }, reference: '#1', title: 'Story', body: '',
    metadata: { Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' }, owners: [], repository: 'R1',
    blockers: { complete: true, open: [] }, state: 'OPEN', claimContext: {
      actorId: 'U1', projectItemId: 'PI1', statusFieldId: 'F1', todoOptionId: 'TODO', inProgressOptionId: 'PROGRESS',
      linkedBacklogs: ['P1'],
    } };
  return { action, item };
}
function pendingClaimVerification(store: OperationStore) {
  const { action, item } = nativeClaimFixture();
  const issued = store.issue(action);
  let response = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
  for (const output of [{ valid: true, gaps: [] }, { item: { ...item, owners: ['me'] } }, { valid: true, gaps: [] }]) {
    if (response.state !== 'action') throw new Error('claim action required');
    response = store.submit(issued.continuation, submissionFor(response.action, { data: output }), 102);
  }
  if (response.state !== 'action') throw new Error('verification action required');
  return { response, item, operationId: action.operationId };
}
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
test('shipped GitHub claim preflight binds native assignment identity', () => {
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
    issue.repository.projectsV2 = { nodes: [{ id: 'P1' }], totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } };
    for (const field of issue.projectItems.nodes[0].fieldValues.nodes)
      if (field.field?.name === 'Status') field.name = 'Todo';
    output.data.project = { id: 'P1', fields: { nodes: [{ __typename: 'ProjectV2SingleSelectField', id: 'F1', name: 'Status',
      options: [{ id: 'TODO', name: 'Todo' }, { id: 'PROGRESS', name: 'In Progress' }] }],
      pageInfo: { hasNextPage: false, endCursor: null } } };
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const response = store.submit(issued.continuation, submissionFor(action, output), 101);
    assert.equal(response.state, 'action');
    if (response.state !== 'action') throw new Error('native assignment required');
    assert.equal(response.action.step, 'assign');
    assert.ok((response.action.tool.arguments as string[]).includes('actor=U1'));
    assert.deepEqual(response.action.allowedEffects, ['assignment']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
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
