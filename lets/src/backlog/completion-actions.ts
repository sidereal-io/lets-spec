import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { object, validateIdentity, validateResponse } from './protocol.ts';
import type { IssuedAction } from './actions.ts';
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

export function nextCompletionAction(action: IssuedAction, result: Record<string, unknown>): null {
  if (action.request.operation !== 'reference.write') return null;
  if (action.allowedEffects.length)
    throw new AdapterFailure('unsupported', 'none', 'GitHub reference conformance validates an existing association without a remote write');
  associatedPullRequest(action, result);
  delete result.item;
  result.reference = (action.request.input as { reference: string }).reference;
  return null;
}
