import { randomUUID } from 'node:crypto';
import { digest } from './definitions.ts';
import type { LoadedDefinition } from './definitions.ts';
import type { BacklogRequest } from './types.ts';

export type ActionRequest = Omit<BacklogRequest, 'protocol'> & { contractVersion: 1 };
export type Connection = { name: string; binding: string; options: Record<string, unknown> };
export type ActionParameters = {
  toolArguments: unknown;
  allowedEffects: string[];
  requiredCapabilities: string[];
  timeoutMs: number;
  maxOutputBytes: number;
  acceptanceMs: number;
};
export type IssuedAction<R extends ActionRequest = ActionRequest> = {
  contractVersion: 1;
  operationId: string;
  workerId: string;
  actionId: string;
  attemptId: string;
  mutationId?: string;
  request: R;
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
  return structuredClone({
    contractVersion: 1, operationId: identity.operationId ?? randomUUID(),
    workerId: request.context.session, actionId: randomUUID(), attemptId: randomUUID(),
    ...(parameters.allowedEffects.length ? { mutationId: identity.mutationId ?? randomUUID() } : {}),
    request, inputDigest: digest(request), definition,
    connection: { ...connection, digest: digest(connection) },
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
    validateRequest({ protocol: 1, operation: value.operation, context, input: value.input,
      ...(MUTATIONS.includes(value.operation as string) ? { mutationId: 'core-allocated' } : {}) });
    return value as ActionRequest;
  } catch (error) { throw new AdapterFailure('invalid_request', 'none', String(error)); }
}
