import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withGithub, item } from './fixtures/github.ts';
test('acquire establishes verified session provenance', () => withGithub(async ({ call }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  assert.equal(claim.session, 's');
  assert.equal(claim.actor, 'me');
  assert.equal(claim.status, 'In Progress');
  assert.equal(claim.guarantee, 'best-effort');
  assert.ok(claim.token);
  assert.deepEqual((await call('claim.read', { item })).claim, claim);
}));
test('same-account competing session cannot acquire', () => withGithub(async ({ call, state }) => {
  await call('claim.acquire', { item }, 'acquire');
  const before = state().calls.filter((call: any) => call.name === 'FieldText').length;
  await assert.rejects(call('claim.acquire', { item }, 'other-acquire', { session: 'other' }), /conflict/);
  assert.equal(state().calls.filter((call: any) => call.name === 'FieldText').length, before);
}));
test('assignment-only progress does not authorize claim', () => withGithub(async ({ call, set }) => {
  set('_fault', 'before:FieldStatus');
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), (error: any) => error.effects === 'partial');
  const { claim } = await call('claim.read', { item });
  assert.equal(claim.status, 'Todo');
}));
test('claim replay rechecks current provenance', () => withGithub(async ({ call, state, set }) => {
  await call('claim.acquire', { item }, 'acquire');
  const values = state().responses.ItemValues;
  const record = values.node.fieldValues.nodes.find((value: any) => value.field.id === 'F-claim');
  record.text = JSON.stringify({ ...JSON.parse(record.text), session: 'replacement' });
  set('ItemValues', values);
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), /conflict/);
}));
import { acquireSession } from '../../../lets/src/backlog/sessions.ts';
import { context } from './fixtures/github.ts';
test('caller receives an explicit fresh continuation handle', () => withGithub(async ({ call, cwd }) => {
  const result = await acquireSession({ ...context, cwd }, item, session => (op, input, key) => call(op, input, key, { session }));
  assert.match(result.handle, /^[0-9a-f-]{36}$/);
  assert.equal(result.claim.session, result.handle);
}));
