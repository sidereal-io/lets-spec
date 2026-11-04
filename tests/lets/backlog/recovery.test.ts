import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withGithub, item } from './fixtures/github.ts';
test('lost final status response reconciles the current claim', () => withGithub(async ({ call, set, state }) => {
  set('_fault', 'after:FieldStatus');
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), (error: any) => error.effects === 'unknown');
  set('_fault', null);
  const result = await call('mutation.read', { mutationId: 'acquire' });
  assert.equal(result.state, 'applied');
  assert.equal(result.result.claim.status, 'In Progress');
  const writes = state().calls.filter((call: any) => call.name === 'FieldText').length;
  await call('claim.acquire', { item }, 'acquire');
  assert.equal(state().calls.filter((call: any) => call.name === 'FieldText').length, writes);
}));
test('lost provenance response remains unknown without replay', () => withGithub(async ({ call, set, state }) => {
  set('_fault', 'after:FieldText');
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), /unknown_outcome/);
  set('_fault', null);
  assert.deepEqual(await call('mutation.read', { mutationId: 'acquire' }), { state: 'unknown' });
  await assert.rejects(call('claim.acquire', { item }, 'acquire'), /reconciliation/);
  assert.equal(state().calls.filter((call: any) => call.name === 'FieldText').length, 1);
}));
test('journal history cannot authorize a replaced claim', () => withGithub(async ({ call, state, set }) => {
  await call('claim.acquire', { item }, 'acquire');
  const values = state().responses.ItemValues;
  const record = values.node.fieldValues.nodes.find((value: any) => value.field.id === 'F-claim');
  record.text = JSON.stringify({ ...JSON.parse(record.text), token: 'replacement' }); set('ItemValues', values);
  await assert.rejects(call('mutation.read', { mutationId: 'acquire' }), /conflict/);
}));
import { acquireSession, recoverSession } from '../../../lets/src/backlog/sessions.ts';
import { context } from './fixtures/github.ts';
test('continuation reconciles before recovering a lost claim response', () => withGithub(async ({ call, cwd, set }) => {
  const connect = (session: string) => (op: string, input?: any, key?: string) => call(op, input, key, { session });
  set('_fault', 'after:FieldStatus');
  let handle = '';
  try { await acquireSession({ ...context, cwd }, item, connect); } catch (error: any) { handle = error.continuationHandle; }
  assert.ok(handle);
  set('_fault', null);
  const session = await recoverSession({ ...context, cwd }, handle, connect);
  assert.ok(session.token);
}));
