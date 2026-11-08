import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { object, validateIdentity, validateResponse } from './protocol.ts';
import type { IssuedAction } from './actions.ts';
import { issueAction } from './actions.ts';
import { projectArguments } from './projections.ts';
import type { PullRequest } from './types.ts';

/** Shared explicit-operation conformance; no runner association/completion caller. */
export function associatedPullRequest(action: IssuedAction, result: Record<string, unknown>): PullRequest {
  const item = object(result.item, 'observed association item');
  const observation = object(item.pullRequestObservation, 'attributed PR observation');
  const source = object(observation.source, 'PR observation source');
  if (source.provider !== 'github' || source.repository !== action.request.context.repository)
    throw new AdapterFailure('invalid_request', 'none', 'PR facts must be attributed to the scoped GitHub repository');
  validateResponse({ protocol: 1, ok: true, result: { pullRequest: observation.pullRequest } }, 0, 'pull-request.read');
  const pr = observation.pullRequest as PullRequest | null;
  const input = action.request.input as { item: unknown; reference?: string; merge?: { reference: string } };
  const reference = input.reference ?? input.merge?.reference;
  if (!pr || pr.repository !== action.request.context.repository || ![pr.id, pr.url].includes(reference!))
    throw new AdapterFailure('invalid_request', 'none', 'exact supplied PR reference is not associated');
  const closing = object(observation.closingIssues, 'native closing issues');
  if (closing.complete !== true || closing.nextCursor !== null || !Array.isArray(closing.items))
    throw new AdapterFailure('unknown_outcome', 'unknown', 'native closing relationship coverage is incomplete');
  for (const identity of closing.items) validateIdentity(identity);
  if (!closing.items.some((identity) => isDeepStrictEqual(identity, input.item)))
    throw new AdapterFailure('invalid_request', 'none', 'native closing relationship does not associate the exact issue');
  return pr;
}

export function nextCompletionAction(action: IssuedAction, result: Record<string, unknown>, now: number): IssuedAction | null {
  if (action.request.operation === 'completion.write') {
    try { validateExactMerge(action, result); }
    catch (error) {
      if (action.step === 'read') throw error;
      throw new AdapterFailure('unknown_outcome', 'partial', `completion proof is unavailable after issuance: ${String(error)}`);
    }
    if (action.step === 'read') {
      if (object(object(result.item, 'completion item').metadata, 'metadata').Status === 'Done') {
        delete result.item;
        result.status = 'Done';
        return null;
      }
      return completionAction(action, 'complete', now);
    }
    if (action.step === 'complete') return completionAction(action, 'verify', now);
    if (action.step !== 'verify') throw new AdapterFailure('unsupported', 'unknown', 'unknown explicit completion stage');
    if (object(object(result.item, 'completed item').metadata, 'metadata').Status !== 'Done')
      throw new AdapterFailure('unknown_outcome', 'partial', 'fresh read does not confirm completion; reconcile original operation');
    delete result.item;
    result.status = 'Done';
    return null;
  }
  if (action.request.operation !== 'reference.write') return null;
  if (action.allowedEffects.length)
    throw new AdapterFailure('unsupported', 'none', 'GitHub reference conformance validates an existing association without a remote write');
  associatedPullRequest(action, result);
  delete result.item;
  result.reference = (action.request.input as { reference: string }).reference;
  return null;
}

export function requireCompletionDefinition(action: IssuedAction): void {
  for (const step of ['read', 'complete', 'verify'])
    if (!action.definition.definition.operations['completion.write']?.actions[step]?.bindings[action.connection.binding])
      throw new AdapterFailure('unsupported', 'none', `explicit completion requires completion.write/${step}`);
}

export function completionAction(origin: IssuedAction, step: string, now: number): IssuedAction {
  requireCompletionDefinition(origin);
  const mapping = origin.definition.definition.operations['completion.write'].actions[step]?.bindings[origin.connection.binding];
  if (!mapping) throw new AdapterFailure('unsupported', 'none', `unknown completion mapping ${step}`);
  const action = issueAction(origin.request, origin.definition, origin.connection, { step, validationOperation: 'item.read',
    toolArguments: projectArguments(mapping.arguments, origin.request.input, origin.request.context),
    allowedEffects: step === 'complete' ? ['completion.write'] : [], requiredCapabilities: origin.requiredCapabilities,
    ...origin.limits, acceptanceMs: origin.expiresAt - origin.issuedAt,
  }, now, { operationId: origin.operationId, mutationId: origin.mutationId });
  if (origin.mutationId) action.mutationId = origin.mutationId;
  return action;
}

export function validateExactMerge(action: IssuedAction, result: Record<string, unknown>): void {
  const pr = associatedPullRequest(action, result);
  const merge = (action.request.input as { merge: { reference: string; merged: boolean; commit: string } }).merge;
  if (merge.merged !== true || pr.state !== 'MERGED' || !pr.mergeCommit || pr.mergeCommit !== merge.commit)
    throw new AdapterFailure('invalid_request', 'none', 'exact associated native PR merge and commit are required before completion');
}

export function reconcileCompletion(origin: IssuedAction, result: Record<string, unknown>): 'applied' | 'absent' | 'unresolved' {
  if (origin.step === 'read') return 'absent';
  try { validateExactMerge(origin, result); }
  catch { return 'unresolved'; }
  return object(object(result.item, 'completion reconciliation item').metadata, 'metadata').Status === 'Done' ? 'applied' : 'unresolved';
}
