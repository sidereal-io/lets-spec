import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('GitHub stdin rejects unsupported protocol versions explicitly', () => {
  const entry = fileURLToPath(new URL('../../../lets/src/backlog/github-entry.ts', import.meta.url));
  const result = spawnSync(process.execPath, [entry], { input: JSON.stringify({ protocol: 2 }), encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).error.category, 'unsupported');
  assert.equal(JSON.parse(result.stdout).error.effects, 'none');
});
