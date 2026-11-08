import { object } from './protocol.ts';
import { deriveResult } from './projections.ts';
import type { Projection } from './projections.ts';
import type { IssuedAction } from './actions.ts';

/** Submitted bytes are trusted observations, never independently authenticated. */
export function validateSubmission(action: IssuedAction, value: unknown, projection: Projection,
  _receivedAt: number): Record<string, unknown> {
  const submission = object(value, 'submission');
  return deriveResult(action.request.operation, projection, submission.output,
    action.request.context, submission.normalized);
}
