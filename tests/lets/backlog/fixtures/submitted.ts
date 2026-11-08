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
