import { createHash } from 'node:crypto';
import { openSync, closeSync, constants, readSync, fstatSync } from 'node:fs';
import { AdapterFailure } from './errors.ts';
import { projectArguments } from './projections.ts';
import { issueAction } from './actions.ts';
import type { IssuedAction, PreparedBody } from './actions.ts';

export function prepareBody(path: string, limit: number): PreparedBody {
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.size > BigInt(limit)) throw new Error('body must be a bounded regular file');
    const bytes = Buffer.alloc(Number(before.size) + 1);
    let count = 0;
    while (count < bytes.length) {
      const n = readSync(fd, bytes, count, bytes.length - count, null);
      if (!n) break;
      count += n;
    }
    const after = fstatSync(fd, { bigint: true });
    if (BigInt(count) !== before.size || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
      throw new Error('body changed during read');
    const body = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, count));
    return { path, body, digest: createHash('sha256').update(bytes.subarray(0, count)).digest('hex') };
  } catch (error) { throw new AdapterFailure('invalid_request', 'none', `${path}: cannot prepare PR body: ${String(error)}`); }
  finally { if (fd !== undefined) closeSync(fd); }
}
export function prAction(origin: IssuedAction, step: string, now: number, targetPullRequest?: string): IssuedAction {
  const operation = origin.request.operation;
  if (step === 'preflight')
    for (const required of ['preflight', 'read-existing', operation.slice('pull-request.'.length), 'verify'])
      if (!origin.definition.definition.operations[operation]?.actions[required]?.bindings[origin.connection.binding])
        throw new AdapterFailure('unsupported', 'none', `selected definition must map ${operation}/${required} before issuance`);
  const mapping = origin.definition.definition.operations[operation]?.actions[step]?.bindings[origin.connection.binding];
  if (!mapping) throw new AdapterFailure('unsupported', 'none', `selected definition does not map ${operation}/${step}; no write issued`);
  const writing = ['create', 'update', 'ready'].includes(step);
  const validationOperation = step === 'preflight' ? 'repository.read' : writing ? operation : 'pull-request.read';
  const action = issueAction(origin.request, origin.definition, origin.connection, {
    step, validationOperation, preparedBody: origin.preparedBody, targetPullRequest,
    toolArguments: projectArguments(mapping.arguments, origin.request.input, {
      ...origin.request.context, prepared: origin.preparedBody, targetPullRequest,
    }),
    allowedEffects: writing ? [operation] : [], requiredCapabilities: origin.requiredCapabilities,
    ...origin.limits, acceptanceMs: origin.expiresAt - origin.issuedAt,
  }, now, { operationId: origin.operationId, mutationId: origin.mutationId });
  if (origin.mutationId) action.mutationId = origin.mutationId;
  return action;
}
export function nextPrAction(action: IssuedAction, result: Record<string, unknown>, now: number): IssuedAction | null {
  const operation = action.request.operation;
  if (!['pull-request.create', 'pull-request.update', 'pull-request.ready'].includes(operation)) return null;
  if (action.step === 'preflight') return prAction(action, 'read-existing', now);
  if (action.step === 'read-existing') {
    if (operation === 'pull-request.create' && result.pullRequest !== null)
      throw new AdapterFailure('conflict', 'none', 'a qualified branch PR already exists; read and reuse it instead of creating another');
    if (operation !== 'pull-request.create' && result.pullRequest === null)
      throw new AdapterFailure('not_found', 'none', 'the exact PR is absent; no write issued');
    return prAction(action, operation.slice('pull-request.'.length), now);
  }
  if (['create', 'update', 'ready'].includes(action.step)) {
    const pr = result.pullRequest as { id: string };
    return prAction(action, 'verify', now, pr.id);
  }
  if (action.step === 'verify') {
    const pr = result.pullRequest as { id: string; body: string; isDraft: boolean } | null;
    if (!pr || pr.id !== action.targetPullRequest ||
        (operation === 'pull-request.create' && pr.isDraft !== true) ||
        (operation === 'pull-request.ready' && pr.isDraft !== false) ||
        (action.preparedBody !== undefined && pr.body !== action.preparedBody.body))
      throw new AdapterFailure('unknown_outcome', 'partial', 'fresh PR read does not confirm the requested effect; reconcile original operation');
    return null;
  }
  return null;
}

export function reconcilePrCreation(origin: IssuedAction, result: Record<string, unknown>, expectedPullRequest = origin.targetPullRequest): 'applied' | 'absent' | 'partial' | 'unresolved' {
  // These journal stages cannot have issued a remote write.
  if (['preflight', 'read-existing'].includes(origin.step)) return 'absent';
  const pr = result.pullRequest as import('./types.ts').PullRequest | null;
  const input = origin.request.input as { base: string; head: string; headRepository: string };
  if (!pr || !origin.preparedBody || pr.repository !== origin.request.context.repository ||
      pr.headRef !== input.head || pr.baseRef !== input.base || pr.headRepository !== input.headRepository ||
      pr.body !== origin.preparedBody.body || (expectedPullRequest && pr.id !== expectedPullRequest)) return 'unresolved';
  return pr.isDraft === true ? 'applied' : 'partial';
}

export function reconcilePrUpdate(origin: IssuedAction, result: Record<string, unknown>): 'applied' | 'absent' | 'unresolved' {
  if (['preflight', 'read-existing'].includes(origin.step)) return 'absent';
  const pr = result.pullRequest as import('./types.ts').PullRequest | null;
  const input = origin.request.input as { pullRequest: string };
  return pr && origin.preparedBody && pr.id === input.pullRequest &&
    pr.repository === origin.request.context.repository && pr.body === origin.preparedBody.body ? 'applied' : 'unresolved';
}

export function reconcilePrReady(origin: IssuedAction, result: Record<string, unknown>): 'applied' | 'absent' | 'unresolved' {
  if (['preflight', 'read-existing'].includes(origin.step)) return 'absent';
  const pr = result.pullRequest as import('./types.ts').PullRequest | null;
  const input = origin.request.input as { pullRequest: string };
  return pr && pr.id === input.pullRequest && pr.repository === origin.request.context.repository &&
    pr.isDraft === false ? 'applied' : 'unresolved';
}
