import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { withGithub, item } from './fixtures/github.ts';
test('workflow CLI carries explicit claim authority through bind and resume', () => withGithub(async ({ command, cwd }) => {
  const selected = command('select'); assert.equal(selected.status, 0); assert.equal(selected.result.item.reference, '#2');
  const claimed = command('claim', { item }); assert.equal(claimed.status, 0); const handle = claimed.result.handle; assert.ok(handle);
  const change = join(cwd, 'openspec/changes/work'); mkdirSync(change, { recursive: true });
  assert.equal(command('bind', { change, item, handle }).status, 0);
  assert.equal(command('resume', { change, handle }).status, 0);
  assert.equal(command('resume', { change }).status, 1);
  assert.equal(command('packet', { change }).result.item.body, 'full packet');
  assert.equal(command('release', { handle }).status, 0);
}));
