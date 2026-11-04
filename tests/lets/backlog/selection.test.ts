import { test } from 'node:test';
import assert from 'node:assert/strict';
import { select } from '../../../lets/src/backlog/selection.ts';
import { withGithub, item, page } from './fixtures/github.ts';
test('named selection rejects an assigned item', () => withGithub(async ({ call }) => {
  await assert.rejects(select(call, 'owner/repo', '#2'), /owned/);
}, { IssueOwners: { node: { assignees: page([{ login: 'other' }]) } } }));
import { data } from './fixtures/github.ts';
test('named selection rejects open blockers', () => withGithub(async ({ call }) => {
  await assert.rejects(select(call, 'owner/repo', '#2'), /open blockers/);
}, { IssueBlockers: { node: { blockedBy: page([{ id: 'B', closed: false }]) } } }));
test('next ranks numeric GitHub references after exclusions', async () => {
  const overrides: Record<string, any> = { ProjectItems: { node: { items: page(['I10', 'I2', 'I1', 'I3'].map(id => ({ content: { id, repository: { nameWithOwner: 'owner/repo' } } }))) } } };
  for (const number of [10, 2, 1, 3]) {
    overrides[`Issue:I${number}`] = { node: { ...data().Issue.node, id: `I${number}`, number } };
  }
  overrides['IssueOwners:I1'] = { node: { assignees: page([{ login: 'other' }]) } };
  overrides['IssueBlockers:I3'] = { node: { blockedBy: page([{ id: 'B', closed: false }]) } };
  await withGithub(async ({ call }) => {
    const result = await select(call, 'owner/repo');
    assert.equal(result.item.reference, '#2');
    assert.deepEqual(result.candidates.map(item => item.reference), ['#2', '#10']);
  }, overrides);
});
test('incomplete blocker enumeration rejects selection', () => withGithub(async ({ call }) => {
  await assert.rejects(select(call, 'owner/repo'), /repeated/);
}, { IssueBlockers: { node: { blockedBy: page([], true, 'loop') } } }));
test('named Epic remains readable for the skill to route to its stories', () => withGithub(async ({ call }) => {
  const result = await select(call, 'owner/repo', '#2');
  assert.equal(result.item.metadata.Kind, 'Epic');
}, { ItemValues: { node: { fieldValues: page(data().ItemValues.node.fieldValues.nodes.map(value => value.field.id === 'F-Kind' ? { ...value, optionId: 'V-Epic' } : value)) } } }));
test('next ignores obsolete machine-state Project text', () => withGithub(async ({ call }) => {
  const result = await select(call, 'owner/repo');
  assert.equal(result.item.reference, '#1');
}, {
  ProjectItems: { node: { items: page([{ id: 'PI1', content: { id: 'I1', repository: { nameWithOwner: 'owner/repo' } } }, { id: 'PI', content: { id: 'I', repository: { nameWithOwner: 'owner/repo' } } }]) } },
  'Issue:I1': { node: { ...data().Issue.node, id: 'I1', number: 1 } },
  'IssueProjects:I1': { node: { projectItems: page([{ id: 'PI1', project: { id: 'P' } }]) } },
  'ItemValues:PI1': { node: { fieldValues: page([...data().ItemValues.node.fieldValues.nodes, { field: { id: 'F-claim' }, text: JSON.stringify({ version: 1, state: 'active', actor: 'me', session: 'partial', token: 'token' }) }]) } },
}));
