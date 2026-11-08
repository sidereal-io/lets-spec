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
};
export type ActionResponse = {
  contractVersion: 1; operationId: string; workerId: string;
  state: 'action'; action: IssuedAction; continuation: Continuation;
};
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
    const held: { path: string; nonce: string }[] = [];
    try {
      for (const key of [...new Set(keys)].sort()) {
        const path = join(this.path, 'locks', `${digest(key)}.lock`);
        const nonce = randomUUID();
        let fd: number;
        try { fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'EEXIST')
            throw new AdapterFailure('conflict', 'none', `local lock busy for ${key}; retry after the current holder finishes`);
          throw error;
        }
        held.push({ path, nonce });
        try { writeFileSync(fd, JSON.stringify({ nonce, pid: process.pid })); fsyncSync(fd); }
        finally { closeSync(fd); }
      }
      return run();
    } finally {
      for (const lock of held.reverse()) {
        const owner = JSON.parse(readFileSync(lock.path, 'utf8'));
        if (owner.nonce === lock.nonce) unlinkSync(lock.path);
      }
    }
  }
  resume(id: string, now: number): ActionResponse {
    const initial = this.get(id);
    return this.locked([`operation:${id}`, ...initial.resourceKeys], () => {
      const record = this.get(id);
      const original = record.originalAction ?? record.action;
      if (record.state === 'complete') throw new AdapterFailure('conflict', 'none', 'operation already resolved');
      if (!['claim.acquire', 'claim.release'].includes(original.request.operation))
        throw new AdapterFailure('unsupported', 'unknown', 'original operation needs a supported bounded reconciliation read');
      const mapping = original.definition.definition.operations['claim.read']?.actions.read?.bindings[original.connection.binding];
      if (!mapping) throw new AdapterFailure('unsupported', 'unknown', 'original definition must provide claim.read for reconciliation');
      const action = issueAction({ ...original.request, operation: 'claim.read', input: { item: (original.request.input as { item: import('./protocol.ts').Identity }).item } },
        original.definition, original.connection, { step: 'read', toolArguments: mapping.arguments,
          allowedEffects: [], requiredCapabilities: original.requiredCapabilities,
          ...original.limits, acceptanceMs: original.expiresAt - original.issuedAt }, now,
        { operationId: original.operationId });
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
  submit(continuation: Continuation, submission: unknown, now: number): CompleteResponse {
    const initial = this.get(continuation.operationId);
    return this.locked([`operation:${continuation.operationId}`, ...initial.resourceKeys], () => {
      const record = this.get(continuation.operationId);
      if (!isDeepStrictEqual(record.continuation, continuation))
        throw new AdapterFailure('invalid_request', 'unknown', 'continuation does not match original operation');
      if (record.state === 'complete') {
        if (!isDeepStrictEqual(record.acceptedSubmission, submission))
          throw new AdapterFailure('conflict', 'unknown', 'conflicting reuse of accepted submission');
      } else {
        const action = record.action;
        const mapping = action.definition.definition.operations[action.request.operation]?.actions[action.step]?.bindings[action.connection.binding];
        if (!mapping) throw new AdapterFailure('unsupported', 'unknown', 'recorded definition mapping unavailable');
        record.result = validateSubmission(action, submission, mapping.projection, now);
        record.attempts.push({ receivedAt: now, submission: structuredClone(submission), accepted: true });
        record.acceptedSubmission = structuredClone(submission);
        if (record.reconciling) {
          const origin = record.originalAction!;
          const claim = record.result.claim as Record<string, unknown>;
          const applied = origin.request.operation === 'claim.acquire' && claim.actor === origin.request.context.actor && claim.status === 'In Progress';
          record.result = { observation: record.result, reconciliation: applied ? 'applied' : 'unresolved', reservationCleared: applied };
          record.state = applied ? 'complete' : 'needs-reconciliation';
          record.pending = !applied;
        } else {
          record.state = 'complete';
          record.pending = false;
        }
        this.write(record);
      }
      return { contractVersion: 1, operationId: record.action.operationId, workerId: record.action.workerId,
        state: record.state === 'complete' ? 'complete' : 'needs-reconciliation', result: record.result!, continuation: record.continuation };
    });
  }
  issue(action: IssuedAction, resourceKeys: string[]): ActionResponse {
    return this.locked([`operation:${action.operationId}`, ...resourceKeys], () => {
      try {
        lstatSync(this.file(action.operationId));
        throw new AdapterFailure('conflict', 'none', 'operation already issued; use its continuation');
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      const record: OperationRecord = {
        journalVersion: 1, action: structuredClone(action), resourceKeys: [...new Set(resourceKeys)].sort(),
        continuation: { operationId: action.operationId, token: randomUUID() },
        state: 'issued', pending: action.allowedEffects.length > 0, attempts: [],
      };
      this.write(record);
      return { contractVersion: 1, operationId: action.operationId, workerId: action.workerId,
        state: 'action', action: structuredClone(action), continuation: record.continuation };
    });
  }
}
