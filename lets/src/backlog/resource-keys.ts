import type { IssuedAction } from './actions.ts';
import { AdapterFailure } from './errors.ts';
import { validateIdentity } from './protocol.ts';
/** Immutable native scope, never checkout path or worker/session identity. */
export function resourceKeys(action: IssuedAction): string[] {
  const context = action.request.context;
  const input = action.request.input as Record<string, unknown>;
  const endpoint = action.connection.options.endpoint ?? 'https://api.github.com';
  const prefix = [endpoint, context.provider, context.repository];
  const keys: string[] = [];
  if (input.item !== undefined) {
    validateIdentity(input.item);
    if (input.item.provider !== context.provider || input.item.backlog !== context.backlog)
      throw new AdapterFailure('invalid_request', 'none', 'item differs from issued provider/backlog scope');
    keys.push(JSON.stringify(['item', ...prefix, input.item.backlog, input.item.id]));
  }
  if (action.request.operation === 'pull-request.create')
    keys.push(JSON.stringify(['pr-create', ...prefix, input.headRepository, input.head]));
  if (action.request.operation.startsWith('pull-request.'))
    for (const id of [input.pullRequest, action.targetPullRequest])
      if (typeof id === 'string') keys.push(JSON.stringify(['pr', ...prefix, id]));
  return keys;
}

/** Serialize registration of newly learned PR aliases without reserving other PRs. */
export function coordinationKeys(action: IssuedAction): string[] {
  return action.request.operation.startsWith('pull-request.') ? [JSON.stringify([
    'pr-registry', action.connection.options.endpoint ?? 'https://api.github.com',
    action.request.context.provider, action.request.context.repository,
  ])] : [];
}
