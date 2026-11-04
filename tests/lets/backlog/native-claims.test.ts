import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withGithub, item, data, page } from './fixtures/github.ts';
test('native acquire needs no machine-state Project fields', () => withGithub(async ({ call, state }) => {
  const { claim } = await call('claim.acquire', { item }, 'acquire');
  assert.equal(claim.status, 'In Progress');
  assert.equal(state().calls.some((call: any) => call.name === 'FieldText'), false);
}, { ProjectFields: { node: { fields: page(data().ProjectFields.node.fields.nodes.filter(field => field.dataType !== 'TEXT')) } } }));
test('native ownership changes invalidate local acquire intent', () => withGithub(async ({ call, set }) => {
  await call('claim.acquire', { item }, 'acquire');
  set('IssueOwners', { node: { assignees: page([{ login: 'replacement' }]) } });
  await assert.rejects(call('mutation.read', { mutationId: 'acquire' }), /conflict/);
}));
test('new local session cannot replace unresolved local acquire intent', () => withGithub(async ({ call, set }) => {
  set('_fault', 'before:Assign');
  await assert.rejects(call('claim.acquire', { item }, 'first'));
  set('_fault', null);
  await assert.rejects(call('claim.acquire', { item }, 'second', { session: 'second' }), /conflict/);
}));
