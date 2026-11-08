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
export function submittedPr(operation: 'pull-request.create' | 'pull-request.update' | 'pull-request.ready' = 'pull-request.create') {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const step = operation.slice('pull-request.'.length);
  const input = operation === 'pull-request.create'
    ? { title: 'Draft', bodyFile: '/repo/body.md', base: 'main', head: 'feature', headRepository: 'R1' }
    : { pullRequest: 'PR1', ...(operation === 'pull-request.update' ? { bodyFile: '/repo/body.md' } : {}) };
  const preparedBody = operation === 'pull-request.ready' ? undefined : { path: '/repo/body.md', body: 'Closes #1', digest: 'fixture-digest' };
  const context = { cwd: '/repo', provider: 'github', repository: 'R1', actor: 'actor', session: 'original-worker' };
  const mapping = definition.definition.operations[operation].actions[step].bindings.gh;
  return issueAction({ contractVersion: 1, operation, context, input }, definition,
    { name: 'local', binding: 'gh', options: {} }, {
      step, preparedBody, toolArguments: projectArguments(mapping.arguments, input, { ...context, prepared: preparedBody }),
      allowedEffects: [operation], requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
}
