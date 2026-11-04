import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withGithub, item, data } from './fixtures/github.ts';
test('targeted glossary update preserves the rest of the packet', () => withGithub(async ({ call }) => {
  await call('claim.acquire', { item }, 'acquire');
  const body = 'Scope stays.\n\n## Glossary handoff\n\nDestination: branch\n';
  const result = await call('item.update', { item, patch: { body } }, 'glossary');
  assert.equal(result.item.body, body);
}, { Issue: { node: { ...data().Issue.node, body: 'Scope stays.\n\n## Glossary handoff\n\nDestination: pending\n' } } }));
test('packet edits outside Glossary handoff are rejected', () => withGithub(async ({ call, state }) => {
  await call('claim.acquire', { item }, 'acquire');
  const before = state().calls.filter((call: any) => call.name === 'UpdateIssueBody').length;
  await assert.rejects(call('item.update', { item, patch: { body: 'Changed scope.\n\n## Glossary handoff\n\nDestination: branch\n' } }, 'glossary'), /only the Glossary/);
  assert.equal(state().calls.filter((call: any) => call.name === 'UpdateIssueBody').length, before);
}, { Issue: { node: { ...data().Issue.node, body: 'Scope stays.\n\n## Glossary handoff\n\nDestination: pending\n' } } }));
test('conclusive glossary rejection permits the original desired patch', () => withGithub(async ({ call, set }) => {
  await call('claim.acquire', { item }, 'acquire');
  const body = 'Scope stays.\n\n## Glossary handoff\n\nDestination: branch\n';
  set('_fault', 'before:UpdateIssueBody');
  await assert.rejects(call('item.update', { item, patch: { body } }, 'glossary'), (error: any) => error.effects === 'none');
  set('_fault', null);
  assert.deepEqual(await call('mutation.read', { mutationId: 'glossary' }), { state: 'absent' });
  assert.equal((await call('item.update', { item, patch: { body } }, 'glossary')).item.body, body);
}, { Issue: { node: { ...data().Issue.node, body: 'Scope stays.\n\n## Glossary handoff\n\nDestination: pending\n' } } }));
test('glossary verification failure preserves possible write effects', () => withGithub(async ({ call, set, state }) => {
  await call('claim.acquire', { item }, 'acquire');
  set('_clearSizeAfterBody', true);
  const body = 'Scope stays.\n\n## Glossary handoff\n\nDestination: branch\n';
  await assert.rejects(call('item.update', { item, patch: { body } }, 'glossary'), (error: any) => error.effects === 'partial');
  assert.equal(state().responses.Issue.node.body, body);
}, { Issue: { node: { ...data().Issue.node, body: 'Scope stays.\n\n## Glossary handoff\n\nDestination: pending\n' } } }));
