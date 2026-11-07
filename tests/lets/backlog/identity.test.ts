import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { bind, resume } from '../../../lets/src/backlog/identity.ts';
import { acquireSession } from '../../../lets/src/backlog/sessions.ts';
import { withGithub, context, item } from './fixtures/github.ts';
test('bound identity survives archive without private claim data', () => withGithub(async ({ call, cwd }) => {
  const connect = (session: string) => (op: string, input?: any, key?: string) => call(op, input, key, { session });
  const ctx = { ...context, cwd }; const { handle } = await acquireSession(ctx, item, connect);
  const change = join(cwd, 'openspec/changes/work'); mkdirSync(change, { recursive: true });
  const packet = (await call('item.read', { item })).item;
  await bind(ctx, change, handle, packet, connect);
  const identity = JSON.parse(readFileSync(join(change, 'backlog.json'), 'utf8'));
  assert.equal(identity.version, 1); assert.deepEqual(identity.item, item);
  assert.equal(JSON.stringify(identity).includes(handle), false);
  const archive = join(cwd, 'openspec/changes/2026-11-04-work'); renameSync(change, archive);
  assert.deepEqual((await resume(ctx, archive, handle, connect)).identity, identity);
}));
test('second caller cannot adopt a session from shared storage', () => withGithub(async ({ call, cwd }) => {
  const connect = (session: string) => (op: string, input?: any, key?: string) => call(op, input, key, { session });
  const ctx = { ...context, cwd }; const { handle } = await acquireSession(ctx, item, connect);
  const change = join(cwd, 'openspec/changes/work'); mkdirSync(change, { recursive: true });
  await bind(ctx, change, handle, (await call('item.read', { item })).item, connect);
  await assert.rejects(call('claim.read', { item }), /conflict/);
  await assert.rejects(resume(ctx, change, '', connect), /explicit original continuation handle/);
  await assert.rejects(resume({ ...ctx, backlog: 'other' }, change, handle, connect), /differs/);
  await assert.rejects(bind(ctx, change, handle, { ...(await call('item.read', { item })).item, reference: '#other' }, connect), /immutable/);
}));
test('legacy change cannot infer item identity', () => withGithub(async ({ cwd }) => {
  const change = join(cwd, 'openspec/changes/legacy'); mkdirSync(change, { recursive: true });
  await assert.rejects(resume({ ...context, cwd }, change, '', () => async () => { throw new Error('must not call adapter'); }), /legacy change/);
}));
