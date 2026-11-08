import { AdapterFailure } from './errors.ts';
import { issueAction } from './actions.ts';
import type { IssuedAction, ClaimState } from './actions.ts';
import { object, validateResponse } from './protocol.ts';
import { readyWork } from './capabilities.ts';
import type { Candidate } from './capabilities.ts';
import { projectArguments } from './projections.ts';

export function claimAction(origin: IssuedAction, step: string, now: number, claimState = origin.claimState): IssuedAction {
  const operation = origin.request.operation;
  if (step === 'preflight')
    for (const required of operation === 'claim.release'
      ? ['preflight', 'reset-status', 'read-before-unassign', 'unassign', 'verify-release']
      : ['preflight', 'assign', 'read-assignment', 'status', 'verify'])
      if (!origin.definition.definition.operations[operation]?.actions[required]?.bindings[origin.connection.binding])
        throw new AdapterFailure('unsupported', 'none', `selected definition must map ${operation}/${required} before issuance`);
  const mapping = origin.definition.definition.operations[operation]?.actions[step]?.bindings[origin.connection.binding];
  if (!mapping) throw new AdapterFailure('unsupported', 'none', `selected definition does not map ${operation}/${step}`);
  const writing = ['assign', 'status', 'reset-status', 'unassign'].includes(step);
  const action = issueAction(origin.request, origin.definition, origin.connection, {
    step, claimState, validationOperation: writing ? 'backlog.check' : 'item.read',
    toolArguments: projectArguments(mapping.arguments, origin.request.input, { ...origin.request.context, claim: claimState }),
    allowedEffects: writing ? [['assign', 'unassign'].includes(step) ? 'assignment' : 'status'] : [],
    requiredCapabilities: ['claims'], ...origin.limits, acceptanceMs: origin.expiresAt - origin.issuedAt,
  }, now, { operationId: origin.operationId, mutationId: origin.mutationId });
  if (origin.mutationId) action.mutationId = origin.mutationId;
  return action;
}

export function nextClaimAction(action: IssuedAction, result: Record<string, unknown>, now: number): IssuedAction | null {
  if (action.request.operation === 'claim.release') return nextReleaseAction(action, result, now);
  if (action.request.operation !== 'claim.acquire' || !['preflight', 'assign', 'read-assignment', 'status', 'verify'].includes(action.step)) return null;
  if (action.step === 'preflight') {
    const item = object(result.item, 'claim item');
    const context = object(item.claimContext, 'claim context');
    for (const field of ['actorId', 'projectItemId', 'statusFieldId', 'todoOptionId', 'inProgressOptionId'])
      if (typeof context[field] !== 'string' || !context[field])
        throw new AdapterFailure('unsupported', 'none', `claim requires ${field}`);
    if (!Array.isArray(context.linkedBacklogs) || !context.linkedBacklogs.includes(action.request.context.backlog))
      throw new AdapterFailure('invalid_configuration', 'none', 'selected Project is not linked to this repository');
    if (item.state !== 'OPEN' || item.repository !== action.request.context.repository ||
        !item.blockers || object(item.blockers, 'claim blockers').complete !== true ||
        !Array.isArray(object(item.blockers, 'claim blockers').open) ||
        readyWork([item as Candidate], action.request.context.repository).length !== 1)
      throw new AdapterFailure('conflict', 'none', 'fresh claim read is not eligible unassigned Todo work');
    const { actorId, projectItemId, statusFieldId, todoOptionId, inProgressOptionId } = context;
    return claimAction(action, 'assign', now, { actorId, projectItemId, statusFieldId, todoOptionId, inProgressOptionId } as ClaimState);
  }
  if (action.step === 'assign') {
    if (result.valid !== true) throw new AdapterFailure('unknown_outcome', 'unknown', 'assignment response is not confirmed');
    return claimAction(action, 'read-assignment', now, { ...action.claimState!, assigned: true });
  }
  if (action.step === 'read-assignment') {
    const item = object(result.item, 'assigned item');
    const owners = item.owners as string[];
    if (owners.length !== 1 || owners[0] !== action.request.context.actor || object(item.metadata, 'metadata').Status !== 'Todo')
      throw new AdapterFailure('unknown_outcome', 'partial', 'assignment changed before status transition; reconcile original claim');
    return claimAction(action, 'status', now);
  }
  if (action.step === 'status') {
    if (result.valid !== true) throw new AdapterFailure('unknown_outcome', 'partial', 'status response is not confirmed');
    return claimAction(action, 'verify', now);
  }
  const item = object(result.item, 'verified claim item');
  const owners = item.owners as string[];
  if (!action.claimState?.assigned || owners.length !== 1 || owners[0] !== action.request.context.actor ||
      object(item.metadata, 'metadata').Status !== 'In Progress')
    throw new AdapterFailure('unknown_outcome', 'partial', 'fresh read does not confirm sole ownership and In Progress; reconcile original claim');
  const claim = { actor: action.request.context.actor, session: action.workerId, token: action.operationId,
    status: 'In Progress', guarantee: 'best-effort' };
  // This token refers to private local provenance, never a GitHub lease.
  delete result.item;
  result.claim = claim;
  validateResponse({ protocol: 1, ok: true, result }, 0, 'claim.acquire');
  return null;
}

function nextReleaseAction(action: IssuedAction, result: Record<string, unknown>, now: number): IssuedAction | null {
  const changed = action.step !== 'preflight';
  if (!action.claimState)
    throw new AdapterFailure('conflict', 'none', 'release requires recorded acquisition state');
  if (['preflight', 'read-before-unassign'].includes(action.step)) {
    const item = object(result.item, 'release item');
    const owners = item.owners as string[];
    const status = object(item.metadata, 'metadata').Status;
    if (owners.length !== 1 || owners[0] !== action.request.context.actor ||
        !['Todo', 'In Progress'].includes(status as string) || (action.step === 'read-before-unassign' && status !== 'Todo'))
      throw new AdapterFailure('conflict', changed ? 'partial' : 'none', 'release ownership or status changed; no cleanup write authorized');
    return claimAction(action, action.step === 'preflight'
      ? status === 'In Progress' ? 'reset-status' : 'read-before-unassign' : 'unassign', now);
  }
  if (['reset-status', 'unassign'].includes(action.step)) {
    if (result.valid !== true)
      throw new AdapterFailure('unknown_outcome', 'partial', 'release response is unconfirmed; reconcile original release');
    return claimAction(action, action.step === 'reset-status' ? 'read-before-unassign' : 'verify-release', now);
  }
  if (action.step !== 'verify-release')
    throw new AdapterFailure('unsupported', 'unknown', 'unknown release stage');
  const item = object(result.item, 'released item');
  if ((item.owners as string[]).length || object(item.metadata, 'metadata').Status !== 'Todo')
    throw new AdapterFailure('unknown_outcome', 'partial', 'fresh read does not confirm release; reconcile original operation');
  delete result.item;
  result.released = true;
  return null;
}

export function reconcileClaimAcquisition(origin: IssuedAction, result: Record<string, unknown>): 'applied' | 'absent' | 'partial' | 'unresolved' {
  if (origin.step === 'preflight') return 'absent';
  const item = object(result.item, 'claim reconciliation item');
  const owners = item.owners as string[];
  const status = object(item.metadata, 'metadata').Status;
  if (owners.length === 1 && owners[0] === origin.request.context.actor)
    return status === 'In Progress' ? 'applied' : status === 'Todo' ? 'partial' : 'unresolved';
  // An issued mutation cannot be proven absent merely by an empty assignee set.
  return 'unresolved';
}

export function reconcileClaimRelease(origin: IssuedAction, result: Record<string, unknown>): 'applied' | 'absent' | 'partial' | 'unresolved' {
  if (origin.step === 'preflight') return 'absent';
  const item = object(result.item, 'release reconciliation item');
  const owners = item.owners as string[];
  const status = object(item.metadata, 'metadata').Status;
  if (status === 'Todo') {
    if (owners.length === 0) return 'applied';
    if (owners.length === 1 && owners[0] === origin.request.context.actor) return 'partial';
  }
  return 'unresolved';
}
