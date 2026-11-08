import { selectBacklog } from './selection.ts';
import { openSync, readSync, fstatSync, closeSync, constants } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { keys } from './definitions.ts';
import { object } from './protocol.ts';
import { deriveResult, validateObservedScope } from './projections.ts';
import type { Projection } from './projections.ts';
import type { IssuedAction } from './actions.ts';
import { readyWork } from './capabilities.ts';
import type { Candidate } from './capabilities.ts';
import { validateIdentity } from './protocol.ts';

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
  const errors = (Array.isArray(output) ? output : [output]).flatMap((page) =>
    page && typeof page === 'object' && Array.isArray((page as Record<string, unknown>).errors)
      ? (page as { errors: unknown[] }).errors : []);
  if (errors.length) {
    const categories = errors.map((error) => error && typeof error === 'object' && typeof (error as Record<string, unknown>).type === 'string'
      ? action.definition.definition.backend.errorTypes?.[(error as { type: string }).type] : undefined);
    const category = categories.every((entry) => entry !== undefined && entry === categories[0]) ? categories[0]! : 'unknown_outcome';
    throw new AdapterFailure(category, action.allowedEffects.length || category === 'unknown_outcome' ? 'unknown' : 'none', 'structured provider errors require resolution; partial data does not prove no mutation');
  }
  const execution = object(submission.execution, 'execution');
  // An MCP call has no process exit code; a CLI must report exit 0. Either may state signal: null.
  const exited = action.tool.kind === 'mcp' ? execution.exitCode === undefined || execution.exitCode === 0 : execution.exitCode === 0;
  if (execution.outcome !== 'success' || !exited || (execution.signal !== undefined && execution.signal !== null) ||
      execution.outputLimitExceeded === true || execution.timedOut === true)
    uncertain('tool termination does not establish outcome; reconcile original operation');
  const translation = action.definition.definition.operations[action.request.operation]?.actions[action.step]?.bindings[action.connection.binding];
  validateObservedScope(translation?.observations, output, { ...action.request.context, input: action.request.input });
  const operation = action.validationOperation ?? action.request.operation;
  const result = deriveResult(operation, projection, output,
    { ...action.request.context, input: action.request.input }, submission.normalized);
  const input = action.request.input as Record<string, unknown>;
  if (operation === 'claim.read') {
    const claim = object(result.claim, 'ownership observation');
    if (claim.item !== undefined && !isDeepStrictEqual(claim.item, input.item))
      throw new AdapterFailure('invalid_request', 'unknown', 'ownership result differs from issued item');
    if (action.request.context.provider === 'github' && claim.guarantee !== 'best-effort')
      throw new AdapterFailure('invalid_request', 'unknown', 'GitHub ownership reads cannot promise an atomic claim');
    const complete = claim.assigneesComplete === true && Array.isArray(claim.assignees) &&
      claim.assignees.every((actor) => typeof actor === 'string' && actor.length > 0) &&
      new Set(claim.assignees).size === claim.assignees.length && claim.item !== undefined;
    const assignees = complete ? claim.assignees as string[] : [];
    const verdict = !complete || claim.status === null ? 'unavailable'
      : assignees.length === 0 ? 'unassigned'
      : assignees.length > 1 ? 'multiple'
      : assignees[0] !== action.request.context.actor ? 'other'
      : claim.status !== 'In Progress' ? 'status-mismatch' : 'sole-actor';
    if (claim.verdict !== undefined && claim.verdict !== verdict)
      throw new AdapterFailure('invalid_request', 'unknown', 'provider ownership verdict disagrees with core policy');
    claim.verdict = verdict;
    if (complete) claim.actor = assignees.length === 1 ? assignees[0] : null;
    claim.session = null;
    claim.token = null;
  }
  if (operation === 'backlog.list') {
    result.selectedBacklog = selectBacklog(result as unknown as import('./types.ts').Page<import('./types.ts').LinkedBacklog>,
      action.request.context.provider, input.selected as string | undefined);
  }
  if (operation === 'candidate.list') {
    if (result.complete !== true)
      throw new AdapterFailure('unknown_outcome', 'unknown', 'candidate selection requires complete enumeration');
    for (const value of result.items as unknown[]) {
      const item = object(value, 'candidate');
      const blockers = object(item.blockers, 'candidate blockers');
      if (item.repository !== action.request.context.repository || blockers.complete !== true || !Array.isArray(blockers.open))
        throw new AdapterFailure('unknown_outcome', 'unknown', 'candidate repository or complete blocker facts missing');
      for (const blocker of blockers.open) validateIdentity(blocker);
      if (action.request.context.provider === 'github' && !['OPEN', 'CLOSED'].includes(item.state as string))
        throw new AdapterFailure('unknown_outcome', 'unknown', 'candidate issue state is missing or unknown');
    }
    const candidates = result.items as (Candidate & { state?: string })[];
    result.items = readyWork(candidates.filter((item) => action.request.context.provider !== 'github' || item.state === 'OPEN'), action.request.context.repository);
  }
  if (operation === 'item.read') {
    const item = object(result.item, 'item');
    if (!isDeepStrictEqual(item.identity, input.item))
      throw new AdapterFailure('invalid_request', 'unknown', 'item result differs from issued identity');
    if (input.includeThread === true && ['comments', 'createdAt', 'lastEditedAt', 'parent'].some((field) => !Object.hasOwn(item, field)))
      throw new AdapterFailure('unknown_outcome', 'unknown', 'requested thread facts are incomplete');
  }
  if (operation === 'repository.read') {
    const repository = object(result.repository, 'repository');
    if (action.step === 'bootstrap') {
      if (repository.owner !== input.owner || repository.name !== input.name || typeof result.actor !== 'string' || !result.actor)
        throw new AdapterFailure('invalid_request', 'unknown', 'bootstrap result lacks exact repository or authenticated actor');
    } else if (repository.id !== action.request.context.repository)
      throw new AdapterFailure('invalid_request', 'unknown', 'repository result differs from issued scope');
  }
  if (operation.startsWith('pull-request.') && result.pullRequest !== null) {
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
