import { nextPrAction, prAction, reconcilePrCreation, reconcilePrUpdate, reconcilePrReady } from './pr-actions.ts';
import { nextClaimAction, claimAction, reconcileClaimAcquisition, reconcileClaimRelease } from './claim-actions.ts';
import { nextCompletionAction, requireCompletionDefinition, completionAction, reconcileCompletion } from './completion-actions.ts';
import { projectArguments } from './projections.ts';
import { resourceKeys as scopedKeys, coordinationKeys } from './resource-keys.ts';
import { acquireResourceLock } from './resource-lock.ts';
import { object } from './protocol.ts';
import { issueAction } from './actions.ts';
import { isDeepStrictEqual } from 'node:util';
import { validateSubmission } from './submissions.ts';
import { closeSync, constants, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digest } from './definitions.ts';
import { AdapterFailure } from './errors.ts';
import type { IssuedAction } from './actions.ts';
import { preflightStore } from './private-store.ts';

export type Continuation = { operationId: string; token: string };
export type OperationRecord = {
  journalVersion: 1;
  action: IssuedAction;
  originalAction?: IssuedAction;
  reconciling?: boolean;
  resourceKeys: string[];
  continuation: Continuation;
  state: 'issued' | 'complete' | 'failed' | 'needs-reconciliation';
  pending: boolean;
  attempts: unknown[];
  result?: Record<string, unknown>;
  acceptedSubmission?: unknown;
  acknowledgements?: { submission: unknown; response: ActionResponse | CompleteResponse }[];
};
export type ActionResponse = {
  contractVersion: 1; operationId: string; workerId: string;
  state: 'action'; action: IssuedAction; continuation: Continuation;
};
export type BlockedResponse = { contractVersion: 1; operationId: string; workerId: string; state: 'needs-reconciliation'; reason: 'pending-mutation'; effects: 'unknown'; continuation: Continuation };
export type CompleteResponse = { contractVersion: 1; operationId: string; workerId: string; state: 'complete' | 'needs-reconciliation'; result: Record<string, unknown>; continuation: Continuation };
/** Durable per-operation facts coordinate one user's local worktrees. */
export class OperationStore {
  readonly path: string;
  constructor(path: string) {
    preflightStore(path);
    this.path = path;
    for (const name of ['operations', 'locks']) mkdirSync(join(path, name), { recursive: true, mode: 0o700 });
  }
  private file(id: string): string {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new AdapterFailure('invalid_request', 'none', 'invalid operation ID');
    return join(this.path, 'operations', `${id}.json`);
  }
  get(id: string): OperationRecord {
    const path = this.file(id);
    const value = object(JSON.parse(readFileSync(path, 'utf8')), 'recovery record');
    if (value.journalVersion !== 1)
      throw new AdapterFailure('unsupported', 'unknown', `${path}: unsupported private journal version; retain the record and reconcile with its compatible runtime; do not replay or delete it`);
    return value as OperationRecord;
  }
  private write(record: OperationRecord): void {
    const target = this.file(record.action.operationId);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
      try { writeFileSync(fd, JSON.stringify(record)); fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temporary, target);
      const directory = openSync(join(this.path, 'operations'), constants.O_RDONLY | constants.O_DIRECTORY);
      try { fsyncSync(directory); } finally { closeSync(directory); }
    } finally { try { unlinkSync(temporary); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; } }
  }
  private locked<T>(keys: string[], run: () => T): T {
    const release: (() => void)[] = [];
    try {
      for (const key of [...new Set(keys)].sort())
        release.push(acquireResourceLock(join(this.path, 'locks', `${digest(key)}.lock`), key));
      return run();
    } finally { for (const unlock of release.reverse()) unlock(); }
  }
  resume(id: string, now: number): ActionResponse {
    const initial = this.get(id);
    return this.locked([`operation:${id}`, ...initial.resourceKeys, ...coordinationKeys(initial.action)], () => {
      const record = this.get(id);
      const original = record.originalAction ?? record.action;
      if (record.state === 'complete') throw new AdapterFailure('conflict', 'none', 'operation already resolved');
      let action: IssuedAction;
      if (original.request.operation === 'pull-request.create') {
        const target = knownPrIdentity(record, original);
        action = prAction(original, target ? 'verify' : 'read-existing', now, target);
      } else if (['pull-request.update', 'pull-request.ready'].includes(original.request.operation)) {
        action = prAction(original, 'verify', now, (original.request.input as { pullRequest: string }).pullRequest);
      } else if (original.request.operation === 'claim.acquire' &&
          original.definition.definition.operations['claim.acquire']?.actions.preflight) {
        action = claimAction(original, 'verify', now);
      } else if (original.request.operation === 'claim.release' && original.claimState) {
        action = claimAction(original, 'verify-release', now);
      } else if (original.request.operation === 'completion.write') {
        action = completionAction(original, 'verify', now);
      } else {
        if (!['claim.acquire', 'claim.release'].includes(original.request.operation))
          throw new AdapterFailure('unsupported', 'unknown', 'original operation needs a supported bounded reconciliation read');
      const mapping = original.definition.definition.operations['claim.read']?.actions.read?.bindings[original.connection.binding];
      if (!mapping) throw new AdapterFailure('unsupported', 'unknown', 'original definition must provide claim.read for reconciliation');
      action = issueAction({ ...original.request, operation: 'claim.read', input: { item: (original.request.input as { item: import('./protocol.ts').Identity }).item } },
        original.definition, original.connection, { step: 'read', toolArguments: projectArguments(mapping.arguments, original.request.input, original.request.context),
          allowedEffects: [], requiredCapabilities: original.requiredCapabilities,
          ...original.limits, acceptanceMs: original.expiresAt - original.issuedAt }, now,
        { operationId: original.operationId });
      }
      if (original.mutationId) action.mutationId = original.mutationId;
      record.originalAction = original;
      record.reconciling = true;
      record.action = action;
      record.state = 'issued';
      this.write(record);
      return { contractVersion: 1, operationId: id, workerId: action.workerId, state: 'action', action,
        continuation: record.continuation };
    });
  }
  submit(continuation: Continuation, submission: unknown, now: number): CompleteResponse | ActionResponse | BlockedResponse {
    const initial = this.get(continuation.operationId);
    return this.locked([`operation:${continuation.operationId}`, ...initial.resourceKeys, ...coordinationKeys(initial.action)], () => {
      const record = this.get(continuation.operationId);
      if (!isDeepStrictEqual(record.continuation, continuation))
        throw new AdapterFailure('invalid_request', 'unknown', 'continuation does not match original operation');
      const acknowledged = record.acknowledgements?.find((entry) => isDeepStrictEqual(entry.submission, submission));
      if (acknowledged) {
        if (record.state === 'complete') return { contractVersion: 1, operationId: record.action.operationId,
          workerId: record.action.workerId, state: 'complete', result: record.result!, continuation: record.continuation };
        if (acknowledged.response.state === 'action' && acknowledged.response.action.allowedEffects.length)
          return { contractVersion: 1, operationId: record.action.operationId, workerId: record.action.workerId,
            state: 'needs-reconciliation', reason: 'pending-mutation', effects: 'unknown', continuation: record.continuation };
        return structuredClone(acknowledged.response);
      }
      if (record.state === 'complete') {
        if (!isDeepStrictEqual(record.acceptedSubmission, submission))
          throw new AdapterFailure('conflict', 'unknown', 'conflicting reuse of accepted submission');
      } else {
        const action = record.action;
        const mapping = action.definition.definition.operations[action.request.operation]?.actions[action.step]?.bindings[action.connection.binding];
        if (!mapping) throw new AdapterFailure('unsupported', 'unknown', 'recorded definition mapping unavailable');
        const attempts = record.attempts.filter((entry) => (entry as { actionId: string }).actionId === action.actionId).length;
        try {
          // A failed operation holds no reservation, so it must never issue another action.
          if (record.state === 'failed')
            throw new AdapterFailure('invalid_request', 'none', `${!action.allowedEffects.length && attempts >= 3
              ? 'read correction budget exhausted; ' : ''}this operation already failed; request a new operation`);
          if (action.allowedEffects.length && record.state === 'needs-reconciliation')
            throw new AdapterFailure('unknown_outcome', 'unknown', 'original operation reconciliation is required; corrected output cannot reactivate a write');
          if (action.allowedEffects.length === 0 && attempts >= 3)
            throw new AdapterFailure('invalid_request', 'unknown', 'read correction budget exhausted; issue a new read action');
          let value = submission;
          if (typeof submission === 'string') {
            try { value = JSON.parse(submission); }
            catch { throw new AdapterFailure('invalid_request', 'unknown', 'malformed submission JSON'); }
          }
          record.result = validateSubmission(action, value, mapping.projection, now);
        } catch (error) {
          let failure = error instanceof AdapterFailure ? error : new AdapterFailure('invalid_request', 'unknown', String(error));
          if (action.request.operation === 'claim.acquire' && action.claimState?.assigned)
            failure = new AdapterFailure(failure.category, 'partial', `partial claim; reconcile original operation: ${failure.message}`);
          // A read issued before any write in this operation cannot have remote effects.
          const wrote = record.reconciling === true || record.acknowledgements?.some((entry) =>
            entry.response.state === 'action' && entry.response.action.allowedEffects.length > 0) === true;
          if (!action.allowedEffects.length && !wrote && failure.effects === 'unknown') {
            const correctable = attempts < 2 && now <= action.expiresAt;
            failure = new AdapterFailure(failure.category, 'none', `${failure.message}; ${correctable
              ? 'correct the submission for this same action and submit it again'
              : 'no correction remains; request a new read'}`, failure.knownRemoteIds);
          }
          if (failure.knownRemoteIds?.pullRequest)
            record.resourceKeys = [...new Set([...record.resourceKeys, ...scopedKeys({ ...action, targetPullRequest: failure.knownRemoteIds.pullRequest })])].sort();
          record.attempts.push({ actionId: action.actionId, receivedAt: now, submission: structuredClone(submission), accepted: false,
            error: { category: failure.category, effects: failure.effects, message: failure.message, ...(failure.knownRemoteIds ? { knownRemoteIds: failure.knownRemoteIds } : {}) } });
          if (action.allowedEffects.length) record.state = 'needs-reconciliation';
          if (!action.allowedEffects.length && (attempts >= 2 || now > action.expiresAt)) record.state = 'failed';
          if (record.state === 'failed' && !wrote) record.pending = false;
          this.write(record);
          throw failure;
        }
        record.attempts.push({ actionId: action.actionId, receivedAt: now, submission: structuredClone(submission), accepted: true });
        record.acceptedSubmission = structuredClone(submission);
        if (record.reconciling) {
          const origin = record.originalAction!;
          let reconciliation: string;
          if (origin.request.operation === 'pull-request.create') reconciliation = reconcilePrCreation(origin, record.result, action.targetPullRequest);
          else if (origin.request.operation === 'pull-request.update') reconciliation = reconcilePrUpdate(origin, record.result);
          else if (origin.request.operation === 'pull-request.ready') reconciliation = reconcilePrReady(origin, record.result);
          else if (origin.request.operation === 'claim.acquire' && origin.definition.definition.operations['claim.acquire']?.actions.preflight)
            reconciliation = reconcileClaimAcquisition(origin, record.result);
          else if (origin.request.operation === 'claim.release' && origin.claimState)
            reconciliation = reconcileClaimRelease(origin, record.result);
          else if (origin.request.operation === 'completion.write') reconciliation = reconcileCompletion(origin, record.result);
          else {
            const claim = record.result.claim as Record<string, unknown>;
            reconciliation = origin.request.operation === 'claim.acquire' && claim.verdict === 'sole-actor' ? 'applied' : 'unresolved';
          }
          const resolved = ['applied', 'absent'].includes(reconciliation);
          record.result = { observation: record.result, reconciliation, reservationCleared: resolved };
          record.state = resolved ? 'complete' : 'needs-reconciliation';
          record.pending = !resolved;
        } else {
          let next: IssuedAction | null;
          try { next = nextCompletionAction(action, record.result, now) ?? nextClaimAction(action, record.result, now) ?? nextPrAction(action, record.result, now); }
          catch (error) {
            let failure = error instanceof AdapterFailure ? error : new AdapterFailure('unknown_outcome', 'unknown', String(error));
            if (action.request.operation === 'claim.release') {
              const input = action.request.input as { item: { id: string }; token: string };
              failure = new AdapterFailure(failure.category, failure.effects,
                `claim remains unreleased for acquisition ${input.token}; ${failure.message}; inspect current ownership and reconcile with lets backlog resume --operation-id ${action.operationId}; do not repeat cleanup blindly`,
                { item: input.item.id, repository: action.request.context.repository });
            }
            record.state = failure.effects === 'none' ? 'failed' : 'needs-reconciliation';
            record.pending = failure.effects !== 'none';
            this.write(record);
            throw failure;
          }
          if (next) {
            record.action = next;
            record.resourceKeys = [...new Set([...record.resourceKeys, ...scopedKeys(next)])].sort();
            record.state = 'issued';
            record.pending = true;
            const response: ActionResponse = { contractVersion: 1, operationId: next.operationId, workerId: next.workerId,
              state: 'action', action: next, continuation: record.continuation };
            record.acknowledgements = [...(record.acknowledgements ?? []), { submission: structuredClone(submission), response: structuredClone(response) }];
            this.write(record);
            return response;
          }
          record.state = 'complete';
          record.pending = false;
        }
        this.write(record);
      }
      return { contractVersion: 1, operationId: record.action.operationId, workerId: record.action.workerId,
        state: record.state === 'complete' ? 'complete' : 'needs-reconciliation', result: record.result!, continuation: record.continuation };
    });
  }
  issue(action: IssuedAction, aliases: string[] = []): ActionResponse | BlockedResponse {
    if (action.request.operation === 'reference.write' && action.allowedEffects.length)
      throw new AdapterFailure('unsupported', 'none', 'GitHub reference conformance validates an existing association without a remote write');
    if (action.request.operation === 'completion.write') {
      if (action.step !== 'read' || action.allowedEffects.length || action.validationOperation !== 'item.read')
        throw new AdapterFailure('invalid_request', 'none', 'explicit completion must begin with a fresh scoped observation read');
      requireCompletionDefinition(action);
    }
    const resourceKeys = [...new Set([...scopedKeys(action), ...aliases])].sort();
    return this.locked([`operation:${action.operationId}`, ...resourceKeys, ...coordinationKeys(action)], () => {
      if (action.request.operation === 'claim.release') {
        const input = action.request.input as { item: unknown; token: string };
        const acquisition = this.get(input.token);
        const origin = acquisition.originalAction ?? acquisition.action;
        requireOriginalWorker(acquisition, action.request.context);
        if (origin.request.operation !== 'claim.acquire' || acquisition.pending || acquisition.state !== 'complete' ||
            !isDeepStrictEqual((origin.request.input as { item: unknown }).item, input.item) ||
            origin.definition.digest !== action.definition.digest || origin.connection.digest !== action.connection.digest || !origin.claimState)
          throw new AdapterFailure('conflict', 'none', 'release requires a resolved matching original acquisition, definition and connection; reconcile outstanding effects first');
        action = claimAction(action, 'preflight', action.issuedAt, origin.claimState);
      }
      try {
        lstatSync(this.file(action.operationId));
        throw new AdapterFailure('conflict', 'none', 'operation already issued; use its continuation');
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      for (const file of readdirSync(join(this.path, 'operations')).filter((name) => name.endsWith('.json'))) {
        const pending = this.get(file.slice(0, -5));
        if (action.request.operation === 'claim.release' && pending.action.request.operation === 'claim.release' &&
            (pending.action.request.input as { token: string }).token === (action.request.input as { token: string }).token &&
            pending.state === 'complete' && (pending.result?.released === true || pending.result?.reconciliation === 'applied'))
          throw new AdapterFailure('conflict', 'none', 'original acquisition was already released; old release authority cannot be reused');
        if (pending.pending && pending.resourceKeys.some((key) => resourceKeys.includes(key)))
          return { contractVersion: 1, operationId: pending.action.operationId, workerId: pending.action.workerId,
            state: 'needs-reconciliation', reason: 'pending-mutation', effects: 'unknown', continuation: pending.continuation };
      }
      const record: OperationRecord = {
        journalVersion: 1, action: structuredClone(action), resourceKeys: [...new Set(resourceKeys)].sort(),
        continuation: { operationId: action.operationId, token: randomUUID() },
        state: 'issued', pending: action.allowedEffects.length > 0 || ['completion.write', 'claim.acquire', 'claim.release', 'pull-request.create', 'pull-request.update', 'pull-request.ready'].includes(action.request.operation), attempts: [],
      };
      this.write(record);
      return { contractVersion: 1, operationId: action.operationId, workerId: action.workerId,
        state: 'action', action: structuredClone(action), continuation: record.continuation };
    });
  }
}

import type { WorkerContext } from './types.ts';
/** Public native ownership cannot confer the original operation's release right. */
export function requireOriginalWorker(record: OperationRecord, context: Omit<WorkerContext, 'actor'> & { actor?: string }): void {
  const original = (record.originalAction ?? record.action).request.context;
  if (!context.actor || context.session !== original.session || context.actor !== original.actor ||
      context.provider !== original.provider || context.repository !== original.repository ||
      context.backlog !== original.backlog)
    throw new AdapterFailure('conflict', 'none', 'release requires the original operation worker and scoped actor provenance; reconciliation does not transfer it');
}

/** A partial write's learned identity cannot be replaced by a later branch match. */
function knownPrIdentity(record: OperationRecord, original: IssuedAction): string | undefined {
  const ids = new Set<string>(original.targetPullRequest ? [original.targetPullRequest] : []);
  for (const attempt of record.attempts) {
    const known = (attempt as { error?: { knownRemoteIds?: Record<string, string> } }).error?.knownRemoteIds;
    if (!known?.pullRequest) continue;
    if (known.repository !== original.request.context.repository)
      throw new AdapterFailure('invalid_request', 'unknown', 'recorded PR identity differs from original repository; retain operation for reconciliation');
    ids.add(known.pullRequest);
  }
  if (ids.size > 1) throw new AdapterFailure('conflict', 'unknown', 'recorded PR identities disagree; retain operation for reconciliation');
  return [...ids][0];
}
