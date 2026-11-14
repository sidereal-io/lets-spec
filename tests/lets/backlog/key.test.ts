// lets backlog key: whether text is one of the backlog provider's keys,
// decided from the text alone.
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

test('a GitHub number is a key, labelled with its hash', async () => {
  for (const text of ['149', '#149']) {
    const { code, out } = await key([text]);
    assert.equal(code, 0, text);
    assert.deepEqual(out, { key: '149', label: '#149' }, text);
  }
});

test('words, and numbers GitHub does not use, are not keys', async () => {
  for (const text of ['refactor', 'PROJ-12', '0', '#0', '012', '1.5', '#', '##149', '149#', ' 149', "can't"]) {
    const { code, out } = await key([text]);
    assert.equal(code, 0, text);
    assert.deepEqual(out, { key: null, label: null }, text);
  }
});

test('text after -- is the text, even when it looks like an option', async () => {
  for (const text of ['--help', '-V', '--version', '-149']) {
    const { code, out, t } = await key(['--', text]);
    assert.equal(code, 0, text);
    assert.deepEqual(out, { key: null, label: null }, text);
    assert.doesNotMatch(t.stdout(), /Usage:/, text);
  }
  assert.deepEqual((await key(['--', '#149'])).out, { key: '149', label: '#149' });
});

test('key runs no gh command, so it needs no Project', async () => {
  const { code, out, t } = await key(['149']);
  assert.equal(code, 0);
  assert.deepEqual(out, { key: '149', label: '#149' });
  assert.deepEqual(t.calls(), []);
});

test('key asks the selected backlog provider, and builds no adapter', async () => {
  const jira = fakeProvider();
  const providers = { ...PROVIDERS, jira: jira.provider };
  assert.deepEqual((await key(['PROJ-12'], { config: JIRA_CONFIG }, providers)).out, { key: 'PROJ-12', label: 'PROJ-12' });
  assert.deepEqual((await key(['149'], { config: JIRA_CONFIG }, providers)).out, { key: null, label: null });
  assert.deepEqual(jira.calls(), []);
});

test('key with an unknown backlog provider is unknown-backlog-provider', async () => {
  const t = backlogDeps([], { config: 'version: 3\nbacklog:\n  provider: jria\n' });
  assert.equal(await run(['key', '149'], t.deps), 1);
  assert.equal(t.json().error, 'unknown-backlog-provider');
});

test('key takes exactly one text', async () => {
  for (const args of [[], ['149', '150']]) {
    const { code, t } = await key(args);
    assert.equal(code, 2, args.join(' '));
    assert.equal(t.stdout(), '');
  }
});
