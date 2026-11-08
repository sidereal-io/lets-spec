import { randomUUID } from 'node:crypto';
import { digest } from './definitions.ts';
import type { LoadedDefinition } from './definitions.ts';
import type { BacklogRequest, WorkerContext } from './types.ts';

export type ActionRequest = Omit<BacklogRequest, 'protocol' | 'context'> & { contractVersion: 1; context: Omit<WorkerContext, 'session' | 'actor'> & { session?: string; actor?: string } };
export type Connection = { name: string; binding: string; options: Record<string, unknown> };
export type PreparedBody = { path: string; body: string; digest: string };
export type ClaimState = {
  actorId: string; projectItemId: string; statusFieldId: string;
  todoOptionId: string; inProgressOptionId: string; assigned?: boolean;
};
export type ActionParameters = {
  claimState?: ClaimState;
  validationOperation?: string;
  preparedBody?: PreparedBody;
  targetPullRequest?: string;
  step?: string;
  toolArguments: unknown;
  allowedEffects: string[];
  requiredCapabilities: string[];
  timeoutMs: number;
  maxOutputBytes: number;
  acceptanceMs: number;
};
export type IssuedAction<R extends ActionRequest = ActionRequest> = {
  claimState?: ClaimState;
  contractVersion: 1;
  operationId: string;
  workerId: string;
  step: string;
  validationOperation?: string;
  preparedBody?: PreparedBody;
  targetPullRequest?: string;
  actionId: string;
  attemptId: string;
  mutationId?: string;
  request: R & { context: Omit<WorkerContext, 'actor'> & { actor?: string } };
  inputDigest: string;
  definition: LoadedDefinition;
  connection: Connection & { digest: string };
  tool: { kind: 'cli' | 'mcp'; name: string; arguments: unknown };
  allowedEffects: string[];
  requiredCapabilities: string[];
  issuedAt: number;
  expiresAt: number;
  limits: { timeoutMs: number; maxOutputBytes: number };
};
/** Build an envelope only. The runtime must persist it before handing it out. */
export function issueAction<R extends ActionRequest>(request: R, definition: LoadedDefinition,
  connection: Connection, parameters: ActionParameters, now: number,
  identity: { operationId?: string; mutationId?: string } = {}): IssuedAction<R> {
  const binding = definition.definition.bindings[connection.binding];
  if (!binding) throw new Error('invalid_configuration: connection binding is absent from selected definition');
  const workerId = request.context.session ?? randomUUID();
  return structuredClone({
    contractVersion: 1, operationId: identity.operationId ?? randomUUID(),
    workerId, step: parameters.step ?? 'read',
    ...(parameters.claimState ? { claimState: parameters.claimState } : {}),
    ...(parameters.validationOperation ? { validationOperation: parameters.validationOperation } : {}),
    ...(parameters.preparedBody ? { preparedBody: parameters.preparedBody } : {}),
    ...(parameters.targetPullRequest ? { targetPullRequest: parameters.targetPullRequest } : {}), actionId: randomUUID(), attemptId: randomUUID(),
    ...(parameters.allowedEffects.length ? { mutationId: identity.mutationId ?? randomUUID() } : {}),
    request: { ...request, context: { ...request.context, session: workerId } },
    inputDigest: digest({ ...request, context: { ...request.context, session: workerId }, ...(parameters.preparedBody ? { preparedBody: parameters.preparedBody } : {}), ...(parameters.claimState ? { claimState: parameters.claimState } : {}) }), definition,
    connection: { name: connection.name, binding: connection.binding, options: connection.options,
      digest: digest({ name: connection.name, binding: connection.binding, options: connection.options }) },
    tool: { kind: binding.kind, name: binding.tool, arguments: parameters.toolArguments },
    allowedEffects: parameters.allowedEffects, requiredCapabilities: parameters.requiredCapabilities,
    issuedAt: now, expiresAt: now + parameters.acceptanceMs,
    limits: { timeoutMs: parameters.timeoutMs, maxOutputBytes: parameters.maxOutputBytes },
  });
}

import { AdapterFailure } from './errors.ts';
import { object, MUTATIONS, validateRequest } from './protocol.ts';
import { keys } from './definitions.ts';
export function parseActionRequest(json: string): ActionRequest {
  let value: Record<string, unknown>;
  try { value = object(JSON.parse(json), 'request'); }
  catch { throw new AdapterFailure('invalid_request', 'none', 'malformed request JSON object'); }
  if (value.contractVersion !== 1) throw new AdapterFailure('unsupported', 'none', 'unsupported operation contract version');
  try {
    keys(value, ['contractVersion', 'operation', 'context', 'input'], 'request');
    const context = object(value.context, 'context');
    keys(context, ['cwd', 'provider', 'repository', 'backlog', 'actor', 'session'], 'context');
    validateRequest({ protocol: 1, operation: value.operation, context: { ...context, session: context.session === undefined ? 'core-allocated' : context.session }, input: value.input,
      ...(MUTATIONS.includes(value.operation as string) ? { mutationId: 'core-allocated' } : {}) });
    return value as ActionRequest;
  } catch (error) { throw new AdapterFailure('invalid_request', 'none', String(error)); }
}
