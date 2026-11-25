// Kept in process: no command can load a second backlog provider, so the
// black-box tests in tests/backlog/key.test.ts cannot reach Jira-style keys.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, lookup } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG } from './fixtures/fake-provider.ts';

const key = async (args: string[], options: Parameters<typeof backlogDeps>[1] = {}, providers = PROVIDERS) => {
  const t = backlogDeps([lookup([])], options);
  const code = await run(['key', ...args], t.deps, providers);
  return { code, out: code === 0 ? t.json() : null, t };
};

test('key asks the selected backlog provider, and builds no adapter', async () => {
  const jira = fakeProvider();
  const providers = { ...PROVIDERS, jira: jira.provider };
  assert.deepEqual((await key(['PROJ-12'], { config: JIRA_CONFIG }, providers)).out, { key: 'PROJ-12', label: 'PROJ-12' });
  assert.deepEqual((await key(['149'], { config: JIRA_CONFIG }, providers)).out, { key: null, label: null });
  assert.deepEqual(jira.calls(), []);
});
