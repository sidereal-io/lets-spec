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
test('claim command explicitly continues an interrupted original session', () => withGithub(async ({ command, set, state }) => {
  set('_fault', 'after:FieldStatus');
  const interrupted = command('claim', { item }); assert.equal(interrupted.status, 1); assert.ok(interrupted.result.handle);
  set('_fault', null);
  const recovered = command('claim', { item, handle: interrupted.result.handle });
  assert.equal(recovered.status, 0); assert.equal(recovered.result.handle, interrupted.result.handle);
  assert.equal(state().calls.filter((call: any) => call.name === 'Assign').length, 1);
}));
test('default GitHub workflow deadline accommodates a full verified claim', () => withGithub(async ({ command }) => {
  const result = command('claim', { item, timeoutMs: undefined });
  assert.equal(result.status, 0, JSON.stringify(result.result));
}, { _delayMs: 160 }));
test('raw mutation cannot adopt published claim correlation values', () => withGithub(async ({ command, cwd }) => {
  const acquired = command('claim', { item }); assert.equal(acquired.status, 0);
  const { claim } = acquired.result;
  const raw = command('request', { protocol: 1, operation: 'claim.release', mutationId: 'unowned-release', context: { cwd, repository: 'owner/repo', actor: 'me', provider: 'github', backlog: 'P', session: claim.session }, input: { item, token: claim.token } });
  assert.equal(raw.status, 1); assert.match(raw.result.error.message, /continuation handle/);
  assert.equal(command('release', { handle: acquired.result.handle }).status, 0);
}));
test('workflow rejects overflowing deadline before claim', () => withGithub(async ({ command, state }) => {
  const result = command('claim', { item, timeoutMs: 3_000_000_000 });
  assert.equal(result.status, 2);
  assert.equal(result.result.error.category, 'invalid_request');
  assert.equal(state().calls.some((call: any) => call.name === 'Assign'), false);
}));
