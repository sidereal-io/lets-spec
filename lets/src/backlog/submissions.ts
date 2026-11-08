import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { object } from './protocol.ts';
import { deriveResult } from './projections.ts';
import type { Projection } from './projections.ts';
import type { IssuedAction } from './actions.ts';

/** Submitted bytes are trusted observations, never independently authenticated. */
export function validateSubmission(action: IssuedAction, value: unknown, projection: Projection,
  receivedAt: number): Record<string, unknown> {
  const submission = object(value, 'submission');
  const bindings = {
    operationId: action.operationId, actionId: action.actionId, attemptId: action.attemptId,
    inputDigest: action.inputDigest, definitionDigest: action.definition.digest,
    connectionDigest: action.connection.digest, context: action.request.context, tool: action.tool,
  };
  for (const [key, expected] of Object.entries(bindings))
    if (!isDeepStrictEqual(submission[key], expected))
      throw new AdapterFailure('invalid_request', 'unknown', `submission binding differs: ${key}`);
  const uncertain = (reason: string): never => { throw new AdapterFailure('unknown_outcome', 'unknown', reason); };
  if (!Number.isFinite(receivedAt) || receivedAt < action.issuedAt || receivedAt > action.expiresAt)
    uncertain('submission outside its acceptance window; reconcile original operation');
  if (Buffer.byteLength(JSON.stringify(submission.output) ?? '') +
      Buffer.byteLength(JSON.stringify(submission.diagnostics) ?? '') > action.limits.maxOutputBytes)
    uncertain('submitted output exceeds issued bound');
  const execution = object(submission.execution, 'execution');
  if (execution.outcome !== 'success' || execution.exitCode !== 0 || execution.signal !== undefined ||
      execution.outputLimitExceeded === true || execution.timedOut === true)
    uncertain('tool termination does not establish outcome; reconcile original operation');
  return deriveResult(action.request.operation, projection, submission.output,
    action.request.context, submission.normalized);
}
