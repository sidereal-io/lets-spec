// Kept in process: no command can load a second backlog provider, so the
// black-box tests in tests/backlog/ready.test.ts cannot reach Jira-style keys.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraCandidate } from './fixtures/fake-provider.ts';

const keys = (t: ReturnType<typeof backlogDeps>) => t.json().issues.map((i: { key: string }) => i.key);

test('a backlog provider with Jira-style keys ranks the one created first, and takes its keys in --only and --exclude', async () => {
  const jira = fakeProvider({ candidates: [
    jiraCandidate('PROJ-9', '2026-02-01T00:00:00Z'),
    jiraCandidate('PROJ-12', '2026-01-01T00:00:00Z'),
    jiraCandidate('PROJ-3', '2026-03-01T00:00:00Z'),
  ] });
  const providers = { ...PROVIDERS, jira: jira.provider };
  const all = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['ready'], all.deps, providers), 0);
  assert.deepEqual(keys(all), ['PROJ-12', 'PROJ-9', 'PROJ-3']);
  assert.deepEqual(all.json().issues[0], { key: 'PROJ-12', label: 'PROJ-12', title: 'proj-12 — outcome', url: 'https://acme.atlassian.net/browse/PROJ-12', kind: 'Story', priority: 'Must', size: 'S' });
  const only = backlogDeps([], { config: JIRA_CONFIG });
  await run(['ready', '--only', 'PROJ-9,PROJ-12'], only.deps, providers);
  assert.deepEqual(keys(only), ['PROJ-12', 'PROJ-9']);
  const exclude = backlogDeps([], { config: JIRA_CONFIG });
  await run(['ready', '--exclude', 'PROJ-12'], exclude.deps, providers);
  assert.deepEqual(keys(exclude), ['PROJ-9', 'PROJ-3']);
});
