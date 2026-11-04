import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withGithub, item } from './fixtures/github.ts';
const reference = 'https://github.com/owner/repo/pull/7';
test('unmerged completion leaves In Progress', () => withGithub(async ({ call }) => {
  await call('claim.acquire', { item }, 'acquire');
  await call('reference.write', { item, reference }, 'reference');
  await assert.rejects(call('completion.write', { item, merge: { reference, merged: false, commit: '' } }, 'complete'), /conflict/);
  assert.equal((await call('claim.read', { item })).claim.status, 'In Progress');
}));
test('completion requires the recorded PR reference', () => withGithub(async ({ call }) => {
  await call('claim.acquire', { item }, 'acquire'); await call('reference.write', { item, reference }, 'reference');
  await assert.rejects(call('completion.write', { item, merge: { reference: 'https://github.com/owner/repo/pull/8', merged: true, commit: 'merge' } }, 'complete'), /different PR/);
}));
test('lost completion response reconciles Done without duplicate effects', () => withGithub(async ({ call, set, state }) => {
  await call('claim.acquire', { item }, 'acquire'); await call('reference.write', { item, reference }, 'reference');
  set('_fault', 'after:FieldStatus');
  const input = { item, merge: { reference, merged: true, commit: 'merge' } };
  await assert.rejects(call('completion.write', input, 'complete'), /unknown_outcome/);
  set('_fault', null);
  assert.deepEqual(await call('mutation.read', { mutationId: 'complete' }), { state: 'applied', result: { status: 'Done' } });
  const writes = state().calls.filter((call: any) => call.name === 'FieldStatus').length;
  assert.deepEqual(await call('completion.write', input, 'complete'), { status: 'Done' });
  assert.equal(state().calls.filter((call: any) => call.name === 'FieldStatus').length, writes);
}));
import { referenceChange, completeChange } from '../../../lets/src/backlog/host.ts';
import { bind } from '../../../lets/src/backlog/identity.ts';
import { acquireSession } from '../../../lets/src/backlog/sessions.ts';
import { context } from './fixtures/github.ts';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
test('code-host caller verifies merge before requesting completion', () => withGithub(async ({ call, cwd, state }) => {
  const ctx = { ...context, cwd };
  const connect = (session: string) => (op: string, input?: any, key?: string) => call(op, input, key, { session });
  const { handle } = await acquireSession(ctx, item, connect);
  const change = join(cwd, 'openspec/changes/work'); mkdirSync(change, { recursive: true });
  await bind(ctx, change, handle, (await call('item.read', { item })).item, connect);
  let merged = false; let body = 'Closes #20';
  const host = async (name: string, variables: any) => {
    if (name === 'PullRequest') return { repository: { pullRequest: { id: 'PR', url: reference, body, merged, mergeCommit: merged ? { oid: 'merge' } : null, repository: { nameWithOwner: 'owner/repo' } } } };
    if (name === 'UpdatePRBody') { body = variables.body; return {}; }
    throw new Error(name);
  };
  await referenceChange(ctx, change, handle, reference, connect, host);
  assert.match(body, /^Closes #2$/m);
  const before = state().calls.filter((call: any) => call.name === 'FieldStatus').length;
  await assert.rejects(completeChange(ctx, change, handle, reference, connect, host), /not merged/);
  assert.equal(state().calls.filter((call: any) => call.name === 'FieldStatus').length, before);
  merged = true;
  assert.deepEqual(await completeChange(ctx, change, handle, reference, connect, host), { status: 'Done' });
}));
