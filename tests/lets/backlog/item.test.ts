// Kept in process: no command can load a second backlog provider, so the
// black-box tests in tests/backlog/item.test.ts cannot reach Jira-style keys.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

test('a backlog provider with Jira-style keys answers item PROJ-12', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12', { parent: { key: 'PROJ-1', label: 'PROJ-1', title: 'epic', url: 'u1', body: 'decisions' } })] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['item', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider }), 0);
  const out = t.json();
  assert.equal(out.key, 'PROJ-12');
  assert.equal(out.label, 'PROJ-12');
  assert.equal(out.parent.key, 'PROJ-1');
  assert.deepEqual(jira.calls(), [['create'], ['readItem', 'PROJ-12']]);
  assert.deepEqual(t.calls(), []);
});

test('a key the backlog provider does not use is not-found, and builds no adapter', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['item', '149'], t.deps, { ...PROVIDERS, jira: jira.provider }), 1);
  assert.equal(t.json().error, 'not-found');
  assert.deepEqual(jira.calls(), []);
});
