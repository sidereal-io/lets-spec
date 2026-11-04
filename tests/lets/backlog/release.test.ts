import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store, mutationName } from '../../../lets/src/backlog/store.ts';
import { context } from './fixtures/github.ts';
import { withGithub, item } from './fixtures/github.ts';
test('branch failure release restores Todo for the current session', () => withGithub(async ({ call }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  assert.deepEqual(await call('claim.release', { item, token: claim.token }, 'release'), { released: true });
  const current = (await call('claim.read', { item })).claim;
  assert.equal(current.actor, null); assert.equal(current.status, 'Todo');
}));
test('another session cannot release the first session claim', () => withGithub(async ({ call }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  await assert.rejects(call('claim.release', { item, token: claim.token }, 'release', { session: 'other' }), /conflict/);
  assert.equal((await call('claim.read', { item })).claim.status, 'In Progress');
}));
test('partial release preserves replacement ownership', () => withGithub(async ({ call, set, state }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  set('_replaceAfterUnassign', true);
  await assert.rejects(call('claim.release', { item, token: claim.token }, 'release'), /conflict/);
  const values = state().responses.ItemValues.node.fieldValues.nodes;
  assert.equal(values.find((value: any) => value.field.id === 'F-Status').optionId, 'V-In Progress');

}));
test('released acquire replay cannot authorize work', () => withGithub(async ({ call }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  await call('claim.release', { item, token: claim.token }, 'release');
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), /conflict/);
}));
test('provenance-only partial acquire can be safely released', () => withGithub(async ({ call, set, state, cwd }) => {
  set('_fault', 'before:Assign');
  await assert.rejects(call('claim.acquire', { item }, 'acquire'));
  set('_fault', null);
  const record = new Store(cwd).read(mutationName({ context: { ...context, cwd }, mutationId: 'acquire' })).intent;
  assert.deepEqual(await call('claim.release', { item, token: record.token }, 'release'), { released: true });
  assert.equal((await call('claim.read', { item })).claim.actor, null);
}));
test('conclusive no-effect release permits original-key retry', () => withGithub(async ({ call, set }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  set('_fault', 'before:Unassign');
  await assert.rejects(call('claim.release', { item, token: claim.token }, 'release'), (error: any) => error.effects === 'none');
  set('_fault', null);
  assert.deepEqual(await call('mutation.read', { mutationId: 'release' }), { state: 'absent' });
  assert.deepEqual(await call('claim.release', { item, token: claim.token }, 'release'), { released: true });
}));
