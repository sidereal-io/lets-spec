import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, readState } from '../../../lets/src/backlog/state.ts';

test('simulation storage validates an empty state', () => {
  assert.deepEqual(readState(emptyState()), emptyState());
});
for (const [field, invalid] of [
  ['count', -1],
  ['items', []],
  ['edges', {}],
  ['claims', { x: {} }],
  ['journal', { x: { fingerprint: '{' } }],
  ['backlogs', [{}]],
] as const) {
  test(`simulation storage rejects invalid ${field}`, () => {
    assert.throws(() => readState({ ...emptyState(), [field]: invalid }));
  });
}

import { preflightStore } from '../../../lets/src/backlog/private-store.ts';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
test('private store preflight fails with the configured path remedy', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/store-');
  try {
    const path = join(dir, 'not-a-directory');
    writeFileSync(path, 'occupied');
    assert.throws(() => preflightStore(path),
      new RegExp(`${path}.*backlog.stateDir.*access`));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('private store preflight proves durable private replacement', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/store-');
  try {
    const path = join(dir, 'private');
    preflightStore(path);
    assert.equal(statSync(path).mode & 0o777, 0o700);
    assert.deepEqual(readdirSync(path), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submittedRead } from './fixtures/submitted.ts';
test('issued action survives reopening its private store', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/issued-');
  try {
    const { action } = submittedRead();
    const store = new OperationStore(join(dir, 'private'));
    const response = store.issue(action, ['item:R1:P1:I1']);
    assert.equal(response.state, 'action');
    const reopened = new OperationStore(join(dir, 'private'));
    const record = reopened.get(action.operationId);
    assert.equal(record.action.actionId, action.actionId);
    assert.equal(record.state, 'issued');
    assert.equal(statSync(join(dir, 'private', 'operations', `${action.operationId}.json`)).mode & 0o777, 0o600);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('an issued operation cannot be overwritten by another issuance', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/issued-');
  try {
    const { action } = submittedRead();
    const store = new OperationStore(join(dir, 'private'));
    store.issue(action, ['item:R1:P1:I1']);
    assert.throws(() => store.issue(action, ['other']), /already issued/);
    assert.deepEqual(store.get(action.operationId).resourceKeys, ['item:R1:P1:I1']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('accepted submission is acknowledged identically after restart', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/accepted-');
  try {
    const { action, submission } = submittedRead();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action, []);
    const first = store.submit(issued.continuation, submission, 200);
    const reopened = new OperationStore(join(dir, 'private'));
    assert.deepEqual(reopened.submit(issued.continuation, submission, 300), first);
    assert.equal(reopened.get(action.operationId).attempts.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unsupported journal version remains untouched', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/version-');
  try {
    const { action } = submittedRead();
    const store = new OperationStore(join(dir, 'private'));
    store.issue(action, []);
    const path = join(dir, 'private', 'operations', `${action.operationId}.json`);
    const original = { ...store.get(action.operationId), journalVersion: 99 };
    writeFileSync(path, JSON.stringify(original));
    assert.throws(() => store.get(action.operationId), /unsupported.*journal.*retain/);
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).journalVersion, 99);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { digest } from '../../../lets/src/backlog/definitions.ts';
import { hostname } from 'node:os';
for (const [name, owner, succeeds] of [
  ['proven dead holder', { pid: 2147483647, processStart: '1' }, true],
  ['reused PID', { pid: process.pid, processStart: 'old-process-start' }, true],
  ['live holder', { pid: process.pid, processStart: process.platform === 'linux' ? readFileSync(`/proc/${process.pid}/stat`, 'utf8').split(') ').at(-1)!.split(' ')[19] : '' }, false],
  ['ambiguous holder', { pid: process.pid }, false],
] as const) {
  test(`resource lock handles ${name} conservatively`, { skip: process.platform !== 'linux' }, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/lock-');
    try {
      const { action } = submittedRead();
      const store = new OperationStore(join(dir, 'private'));
      const lockPath = join(dir, 'private', 'locks', `${digest('item:R1:P1:I1')}.lock`);
      writeFileSync(lockPath, JSON.stringify({ nonce: 'original', host: hostname(),
        bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(), ...owner }), { mode: 0o600 });
      if (succeeds) assert.equal(store.issue(action, ['item:R1:P1:I1']).state, 'action');
      else {
        assert.throws(() => store.issue(action, ['item:R1:P1:I1']), /lock busy/);
        assert.equal(JSON.parse(readFileSync(lockPath, 'utf8')).nonce, 'original');
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

import { submittedClaim } from './fixtures/submitted.ts';
test('pending item mutation blocks a different worker in another worktree', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/shared-');
  try {
    const { action } = submittedClaim();
    const store = new OperationStore(join(dir, 'private'));
    const original = store.issue(action, []);
    const { action: another } = submittedClaim();
    another.request.context.cwd = '/another-worktree';
    another.request.context.session = 'another-worker';
    another.workerId = 'another-worker';
    const blocked = new OperationStore(join(dir, 'private')).issue(another, []);
    assert.equal(blocked.state, 'needs-reconciliation');
    assert.equal(blocked.operationId, action.operationId);
    assert.deepEqual(blocked.continuation, original.continuation);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
