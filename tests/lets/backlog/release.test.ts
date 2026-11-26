// What tests/backlog/release.test.ts cannot check through lets: a second
// backlog provider.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

test('a backlog provider with Jira-style keys answers release PROJ-12 --claim <token>', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const providers = { ...PROVIDERS, jira: jira.provider };
  const claimed = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['claim', 'PROJ-12'], claimed.deps, providers), 0);
  const token = claimed.json().claim;
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['release', 'PROJ-12', '--claim', token], t.deps, providers), 0);
  assert.deepEqual(t.json(), { result: 'released' });
  assert.deepEqual(jira.item('PROJ-12')!.assignees, []);
  assert.equal(jira.item('PROJ-12')!.status, 'Todo');
  assert.deepEqual(t.calls(), []);
});
