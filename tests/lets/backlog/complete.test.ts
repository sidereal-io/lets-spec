// What tests/backlog/complete.test.ts cannot check through lets: a gh call
// past its 60-second limit, and a second backlog provider.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, json, LOOKUP_ONE, TIMED_OUT } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

test('a close that times out says the write may have happened', async () => {
  const t = backlogDeps([...LOOKUP_ONE, ['issue view 258 --json state', json({ state: 'OPEN' })], ['issue close 258', TIMED_OUT]]);
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', message: 'timed out; the write may have happened' });
});

test('a backlog provider with Jira-style keys gets the key PROJ-12, and returns completed', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['complete', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider }), 0);
  assert.deepEqual(t.json(), { result: 'completed' });
  assert.deepEqual(jira.calls(), [['create'], ['complete', 'PROJ-12']]);
  assert.equal(jira.item('PROJ-12')!.state, 'CLOSED');
  assert.deepEqual(t.calls(), []);
});
