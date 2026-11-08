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
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readdirSync, statSync } from 'node:fs';
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
