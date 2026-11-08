import { openSync, readSync, fstatSync, closeSync, constants } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { keys } from './definitions.ts';
import { object } from './protocol.ts';
import { deriveResult } from './projections.ts';
import type { Projection } from './projections.ts';
import type { IssuedAction } from './actions.ts';

/** Submitted bytes are trusted observations, never independently authenticated. */
export function validateSubmission(action: IssuedAction, value: unknown, projection: Projection,
  receivedAt: number): Record<string, unknown> {
  const submission = object(value, 'submission');
  if (submission.contractVersion !== 1)
    throw new AdapterFailure('unsupported', 'unknown', 'unsupported submission contract version');
  try {
    keys(submission, ['contractVersion', 'operationId', 'actionId', 'attemptId', 'inputDigest',
      'definitionDigest', 'connectionDigest', 'context', 'tool', 'execution', 'output', 'normalized',
      'diagnostics', 'outputFiles', 'observed'], 'submission');
  } catch (error) { throw new AdapterFailure('invalid_request', 'unknown', String(error)); }
  if (submission.observed !== undefined) {
    try {
      const observed = object(submission.observed, 'observed');
      keys(observed, ['startedAt', 'finishedAt', 'toolVersion', 'serverVersion'], 'observed');
      for (const field of ['startedAt', 'finishedAt'])
        if (observed[field] !== undefined && (typeof observed[field] !== 'number' || !Number.isFinite(observed[field])))
          throw new Error(`observed.${field} must be a finite timestamp when supplied`);
      for (const field of ['toolVersion', 'serverVersion'])
        if (observed[field] !== undefined && (typeof observed[field] !== 'string' || !observed[field]))
          throw new Error(`observed.${field} must be text when supplied`);
    } catch (error) { throw new AdapterFailure('invalid_request', 'unknown', String(error)); }
  }
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
  let output = submission.output;
  const diagnosticsBytes = Buffer.byteLength(JSON.stringify(submission.diagnostics) ?? '');
  let outputBytes = 0;
  if (submission.outputFiles !== undefined) {
    if (Object.hasOwn(submission, 'output') || !Array.isArray(submission.outputFiles) ||
        submission.outputFiles.length === 0 || submission.outputFiles.length > 100)
      uncertain('supply inline output or a bounded nonempty outputFiles list');
    const outputs: unknown[] = [];
    for (const path of submission.outputFiles as unknown[]) {
      if (typeof path !== 'string' || !path || /^[a-z]+:\/\//i.test(path))
        uncertain('output file must be an explicit local path');
      let fd: number | undefined;
      try {
        fd = openSync(path as string, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        const before = fstatSync(fd, { bigint: true });
        if (!before.isFile() || before.size > BigInt(action.limits.maxOutputBytes - diagnosticsBytes - outputBytes))
          uncertain('output file exceeds issued bound or is not a regular file');
        const bytes = Buffer.alloc(Number(before.size) + 1);
        let count = 0;
        while (count < bytes.length) {
          const read = readSync(fd, bytes, count, bytes.length - count, null);
          if (!read) break;
          count += read;
        }
        const after = fstatSync(fd, { bigint: true });
        if (BigInt(count) !== before.size || before.size !== after.size ||
            before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
          uncertain('output file changed during read');
        outputBytes += count;
        outputs.push(JSON.parse(bytes.subarray(0, count).toString('utf8')));
      } catch (error) {
        uncertain(`output file ${String(path)} is unreadable, malformed or outside its bound: ${String(error)}`);
      } finally { if (fd !== undefined) closeSync(fd); }
    }
    output = outputs.length === 1 ? outputs[0] : outputs;
  } else outputBytes = Buffer.byteLength(JSON.stringify(output) ?? '');
  if (outputBytes + diagnosticsBytes > action.limits.maxOutputBytes)
    uncertain('submitted output exceeds issued bound');
  const execution = object(submission.execution, 'execution');
  if (execution.outcome !== 'success' || execution.exitCode !== 0 || execution.signal !== undefined ||
      execution.outputLimitExceeded === true || execution.timedOut === true)
    uncertain('tool termination does not establish outcome; reconcile original operation');
  const result = deriveResult(action.request.operation, projection, output,
    action.request.context, submission.normalized);
  const input = action.request.input as Record<string, unknown>;
  if (action.request.operation === 'repository.read' &&
      object(result.repository, 'repository').id !== action.request.context.repository)
    throw new AdapterFailure('invalid_request', 'unknown', 'repository result differs from issued scope');
  if (action.request.operation.startsWith('pull-request.') && result.pullRequest !== null) {
    const pr = object(result.pullRequest, 'pullRequest');
    if (pr.repository !== action.request.context.repository ||
        (input.pullRequest !== undefined && pr.id !== input.pullRequest) ||
        (input.branch !== undefined && pr.headRef !== input.branch) ||
        (input.head !== undefined && pr.headRef !== input.head) ||
        (input.headRepository !== undefined && pr.headRepository !== input.headRepository))
      throw new AdapterFailure('invalid_request', 'unknown', 'pull request result differs from issued scope');
  }
  return result;
}
