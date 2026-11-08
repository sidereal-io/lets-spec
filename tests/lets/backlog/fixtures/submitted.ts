import { issueAction } from '../../../../lets/src/backlog/actions.ts';
import { loadDefinition } from '../../../../lets/src/backlog/definitions.ts';
export function submittedRead() {
  const definition = loadDefinition([{ source: 'fixture:github', value: {
    schemaVersion: 1, name: 'github', version: '1', contractVersions: [1],
    backend: { name: 'github', versions: ['graphql-v4'] },
    bindings: { gh: { kind: 'cli', tool: 'gh', versions: ['>=2'] } }, operations: { 'backlog.check': { actions: { read: { bindings: {
      gh: { arguments: ['api', 'graphql'], projection: { op: 'path', path: ['data'] } },
    } } } } },
  } }]);
  const action = issueAction({ contractVersion: 1, operation: 'backlog.check', context: {
    cwd: '/repo', provider: 'github', repository: 'R1', backlog: 'P1', actor: 'me', session: 'worker',
  }, input: {} }, definition, { name: 'local', binding: 'gh', options: {} }, {
    toolArguments: ['api', 'graphql'], allowedEffects: [], requiredCapabilities: [],
    timeoutMs: 1000, maxOutputBytes: 4096, acceptanceMs: 5000,
  }, 100);
  const submission = {
    contractVersion: 1, operationId: action.operationId, actionId: action.actionId, attemptId: action.attemptId,
    inputDigest: action.inputDigest, definitionDigest: definition.digest,
    connectionDigest: action.connection.digest,
    context: structuredClone(action.request.context), tool: structuredClone(action.tool),
    execution: { outcome: 'success', exitCode: 0 },
    output: { data: { valid: true, gaps: [] } },
  };
  return { action, submission, projection: { op: 'path' as const, path: ['data'] } };
}
export function submittedClaim() {
  const { action: read } = submittedRead();
  const definition = loadDefinition([{ source: 'fixture:github', value: {
    ...read.definition.definition,
    operations: { 'claim.acquire': { actions: { assign: { bindings: { gh: { arguments: ['api', 'graphql', 'assign'], projection: { op: 'path', path: ['data'] } } } } } }, 'claim.read': { actions: { read: { bindings: {
      gh: { arguments: ['api', 'graphql', 'read-ownership'], projection: { op: 'path', path: ['data'] } },
    } } } } },
  } }]);
  const action = issueAction({ contractVersion: 1, operation: 'claim.acquire', context: read.request.context,
    input: { item: { provider: 'github', backlog: 'P1', id: 'I1' } } }, definition, read.connection, {
    step: 'assign', toolArguments: ['api', 'graphql', 'assign'], allowedEffects: ['assignment'],
    requiredCapabilities: ['claims'], timeoutMs: 1000, maxOutputBytes: 4096, acceptanceMs: 5000,
  }, 100);
  return { action };
}
export function submissionFor(action: ReturnType<typeof issueAction>, output: unknown) {
  return { contractVersion: 1, operationId: action.operationId, actionId: action.actionId,
    attemptId: action.attemptId, inputDigest: action.inputDigest, definitionDigest: action.definition.digest,
    connectionDigest: action.connection.digest, context: action.request.context, tool: action.tool,
    execution: { outcome: 'success', exitCode: 0 }, output };
}

import { githubDefinition } from '../../../../lets/src/backlog/config.ts';
import { projectArguments } from '../../../../lets/src/backlog/projections.ts';
export function submittedPr(operation: 'pull-request.create' | 'pull-request.update' | 'pull-request.ready' = 'pull-request.create', options: { body?: string; session?: string; cwd?: string } = {}) {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const step = operation.slice('pull-request.'.length);
  const input = operation === 'pull-request.create'
    ? { title: 'Draft', bodyFile: '/repo/body.md', base: 'main', head: 'feature', headRepository: 'R1' }
    : { pullRequest: 'PR1', ...(operation === 'pull-request.update' ? { bodyFile: '/repo/body.md' } : {}) };
  const preparedBody = operation === 'pull-request.ready' ? undefined : { path: '/repo/body.md', body: options.body ?? 'Closes #1', digest: 'fixture-digest' };
  const context = { cwd: options.cwd ?? '/repo', provider: 'github', repository: 'R1', actor: 'actor', session: options.session ?? 'original-worker' };
  const mapping = definition.definition.operations[operation].actions[step].bindings.gh;
  return issueAction({ contractVersion: 1, operation, context, input }, definition,
    { name: 'local', binding: 'gh', options: {} }, {
      step, preparedBody, toolArguments: projectArguments(mapping.arguments, input, { ...context, prepared: preparedBody }),
      allowedEffects: [operation], requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
}

import type { OperationStore } from '../../../../lets/src/backlog/operation-store.ts';
export function nativeClaimFixture() {
  const base = submittedRead().action;
  const steps = ['preflight', 'assign', 'read-assignment', 'status', 'verify', 'reset-status', 'read-before-unassign', 'unassign', 'verify-release'];
  const definition = loadDefinition([{ source: 'fixture:native-claim', value: {
    ...base.definition.definition, operations: { 'claim.acquire': { actions: Object.fromEntries(steps.map((step) => [step, {
      bindings: { gh: { arguments: ['api', step], projection: { op: 'path', path: ['data'] } } },
    }])) }, 'claim.release': { actions: Object.fromEntries(steps.map((step) => [step, {
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

export function acquiredClaim(store: OperationStore) {
  const { response, item, operationId } = pendingClaimVerification(store);
  store.submit(response.continuation, submissionFor(response.action, { data: {
    item: { ...item, owners: ['me'], metadata: { ...item.metadata, Status: 'In Progress' } },
  } }), 103);
  const release = issueAction({ ...response.action.request, operation: 'claim.release', input: { item: item.identity, token: operationId } },
    response.action.definition, response.action.connection, { step: 'preflight', validationOperation: 'item.read',
      toolArguments: [], allowedEffects: [], requiredCapabilities: ['claims'], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 200);
  return { item, release, operationId };
}

export function submittedReference() {
  const base = submittedRead().action;
  const definition = loadDefinition([{ source: 'fixture:submitted-reference', value: {
    ...base.definition.definition, operations: { 'reference.write': { actions: { read: { bindings: { gh: {
      arguments: ['read-association'], projection: { op: 'path', path: ['data'] },
    } } } } } },
  } }]);
  const action = issueAction({ contractVersion: 1, operation: 'reference.write', context: base.request.context,
    input: { item: { provider: 'github', backlog: 'P1', id: 'I1' }, reference: 'PR1' } }, definition, base.connection, {
    step: 'read', validationOperation: 'item.read', toolArguments: ['read-association'], allowedEffects: [], requiredCapabilities: [],
    timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
  }, 100);
  const item = { identity: { provider: 'github', backlog: 'P1', id: 'I1' }, reference: '#1', title: 'Story', body: '', owners: [],
    metadata: { Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'In Progress' }, pullRequestObservation: {
      source: { provider: 'github', repository: 'R1' },
      pullRequest: { id: 'PR1', repository: 'R1', headRepository: 'R1', number: 1,
        url: 'https://github.com/fixture/repo/pull/1', state: 'OPEN', isDraft: true, body: 'Closes #1',
        createdAt: '2026-11-08T00:00:00Z', baseRef: 'main', headRef: 'feature', baseSha: null, headSha: null,
        mergeCommit: null, mergeRef: null },
      closingIssues: { items: [{ provider: 'github', backlog: 'P1', id: 'I1' }], complete: true, nextCursor: null },
    } };
  return { action, item };
}

export function pendingClaimVerification(store: OperationStore) {
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
