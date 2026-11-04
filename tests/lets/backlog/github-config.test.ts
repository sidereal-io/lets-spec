import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfiguration } from '../../../lets/src/backlog/repository-config.ts';
test('implicit selection rejects an unavailable default executable', () => {
  assert.throws(() => resolveConfiguration({}, process.cwd(), { PATH: '/nonexistent' }), /executable unavailable/);
});
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { METADATA } from '../../../lets/src/backlog/items.ts';
const mappings = Object.fromEntries(Object.entries(METADATA).map(([field, values]) => [field, { field, cardinality: 'one', values: Object.fromEntries(values.map(value => [value, value])) }]));
function fixture(run: (cwd: string) => void) {
  mkdirSync(join(process.cwd(), '.workspace'), { recursive: true });
  const cwd = mkdtempSync(join(process.cwd(), '.workspace/config-'));
  try {
    mkdirSync(join(cwd, 'bin')); writeFileSync(join(cwd, 'bin/lets-backlog-github'), '#!/bin/sh\nexit 0\n'); chmodSync(join(cwd, 'bin/lets-backlog-github'), 0o700);
    run(cwd);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
test('implicit selection resolves PATH relative to repository cwd', () => fixture(cwd => {
  assert.deepEqual(resolveConfiguration({ schema: 'unrelated' }, cwd, { PATH: 'bin' }), { provider: 'github', executable: join(cwd, 'bin/lets-backlog-github') });
}));
test('explicit selection retains complete mappings', () => fixture(cwd => {
  assert.deepEqual(resolveConfiguration({ lets: { backlog: { provider: 'github', executable: './bin/lets-backlog-github', id: 'P', mappings } } }, cwd), { provider: 'github', executable: join(cwd, 'bin/lets-backlog-github'), backlog: 'P', mappings });
}));
for (const patch of [{ executable: 'missing' }, { executable: 'echo x | sh' }, { mappings: {} }, { id: '' }, { token: 'forbidden' }]) {
  test(`invalid explicit selection rejects ${JSON.stringify(patch)}`, () => fixture(cwd => {
    assert.throws(() => resolveConfiguration({ lets: { backlog: { provider: 'github', executable: './bin/lets-backlog-github', id: 'P', mappings, ...patch } } }, cwd, { PATH: join(cwd, 'bin') }), (error: any) => error.category === 'invalid_configuration' && error.effects === 'none');
  }));
}
test('nonexecutable path is rejected', () => fixture(cwd => {
  chmodSync(join(cwd, 'bin/lets-backlog-github'), 0o600);
  assert.throws(() => resolveConfiguration({}, cwd, { PATH: join(cwd, 'bin') }), /executable unavailable/);
}));
test('directory executable is rejected', () => fixture(cwd => {
  assert.throws(() => resolveConfiguration({ lets: { backlog: { provider: 'github', executable: './bin', id: 'P', mappings } } }, cwd), /executable unavailable/);
}));
