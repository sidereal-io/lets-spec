import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, CONFIG_FILE, REPO_CONFIG_FILE, json, LOOKUP_ONE, TIMED_OUT } from './fixtures/fake-gh.ts';

const FIND: [string, ReturnType<typeof json>] = ['issue list --state open --search', json([])];

// Kept in process: lets gives gh 60 seconds, so a black-box test would wait
// that long. tests/backlog/shared.test.ts checks a gh that cannot start.
test('gh that times out is backend-failed', async () => {
  const t = backlogDeps([['api graphql', TIMED_OUT]]);
  assert.equal(await run(['ready'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'backend-failed');
  assert.ok(out.message.length > 0);
});

test('every gh call has a finite timeout', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND]);
  await run(['find', 'fix-typo'], t.deps);
  for (const opts of t.options()) assert.ok(Number.isFinite(opts.timeoutMs) && opts.timeoutMs! > 0);
});

test('with no backlog provider in the user\'s lets config, the backlog provider is GitHub', async () => {
  for (const config of [undefined, 'version: 3\n', 'version: 3\ndelegate:\n  resolvers: [t3]\n', 'version: 3\nbacklog:\n  provider:\n', 'version: 3\nbacklog:\n  provider: github\n']) {
    const t = backlogDeps([...LOOKUP_ONE, FIND], { config });
    assert.equal(await run(['find', 'fix-typo'], t.deps), 0, String(config));
    assert.deepEqual(t.json(), { issues: [] });
  }
});

test('an unknown backlog provider is unknown-backlog-provider, names the value, the file and github, and runs no gh command', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: jria\n' });
  assert.equal(await run(['item', '136'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.match(out.message, /jria/);
  assert.ok(out.message.includes(CONFIG_FILE), out.message);
  assert.match(out.message, /github/);
  assert.deepEqual(t.calls(), []);
});

test('a lets config lets cannot read is unknown-backlog-provider, names the file, and runs no gh command', async () => {
  for (const config of ['version: 3\nbacklog:\n  provider: [jira]\n', 'version: 3\nbacklog: jira\n', 'backlog: {provider: [\n', 'backlog:\n  provider: jira\n']) {
    const t = backlogDeps([...LOOKUP_ONE, ['issue', json({})]], { config });
    assert.equal(await run(['claim', '136'], t.deps), 1, config);
    const out = t.json();
    assert.equal(out.error, 'unknown-backlog-provider', config);
    assert.ok(out.message.includes(CONFIG_FILE), out.message);
    assert.deepEqual(t.calls(), [], config);
  }
});

test('a lets block in openspec/config.yaml is not read', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND], { files: { '/repo/openspec/config.yaml': 'schema: lets-standard\nlets:\n  backlog:\n    provider: jria\n' } });
  assert.equal(await run(['find', 'x'], t.deps), 0);
  assert.deepEqual(t.json(), { issues: [] });
});

test('the help text names the backlog provider in use', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['--help'], t.deps), 0);
  assert.match(t.stdout(), /backlog provider is github/i);
  assert.doesNotMatch(t.stdout(), /gh-failed/);
  assert.match(t.stdout(), /backend-failed/);
  assert.match(t.stdout(), /unknown-backlog-provider/);
});

test('a lets config that cannot be read is unknown-backlog-provider, names the file, and runs no gh command', async () => {
  for (const code of ['EACCES', 'EISDIR']) {
    const t = backlogDeps([...LOOKUP_ONE, FIND]);
    const readFile = t.deps.io.readFile;
    t.deps.io.readFile = (path) => {
      if (path === CONFIG_FILE) throw Object.assign(new Error(`${code}: cannot read ${path}`), { code });
      return readFile(path);
    };
    assert.equal(await run(['find', 'x'], t.deps), 1, code);
    const out = t.json();
    assert.equal(out.error, 'unknown-backlog-provider', code);
    assert.ok(out.message.includes(CONFIG_FILE), out.message);
    assert.match(out.message, new RegExp(code));
    assert.deepEqual(t.calls(), [], code);
  }
});

test('the repository\'s backlog provider wins over the user\'s, with no error', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: jria\n', repoConfig: 'version: 3\nbacklog:\n  provider: github\n' });
  assert.equal(await run(['find', 'x'], t.deps), 0);
  assert.deepEqual(t.json(), { issues: [] });
});

test('an unknown backlog provider in the repository\'s lets config names that file, and runs no gh command', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: github\n', repoConfig: 'version: 3\nbacklog:\n  provider: jria\n' });
  assert.equal(await run(['item', '136'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'unknown-backlog-provider');
  for (const named of ['jria', REPO_CONFIG_FILE, 'github']) assert.ok(out.message.includes(named), out.message);
  assert.ok(!out.message.includes(CONFIG_FILE), out.message);
  assert.deepEqual(t.calls(), []);
});

test('a repository\'s lets config with the old version is unknown-backlog-provider, naming it', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND], { repoConfig: 'version: 2\nbacklog:\n  provider: github\n' });
  assert.equal(await run(['ready'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.includes(REPO_CONFIG_FILE), out.message);
  assert.match(out.message, /version/);
  assert.deepEqual(t.calls(), []);
});

test('lets backlog ready --help names --met-blockers with an example', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['ready', '--help'], t.deps), 0);
  assert.match(t.stdout(), /--met-blockers <keys>.*279,280/);
});

test('the command list names ready --met-blockers with an example', async () => {
  const t = backlogDeps([]);
  await run(['--help'], t.deps);
  assert.match(t.stdout(), /ready \[--met-blockers <keys>\][^]*?such as 279,280/);
});

test('lets backlog ready --help names --started with an example', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['ready', '--help'], t.deps), 0);
  assert.match(t.stdout(), /--started <keys>[^]*?281,282/);
});

test('the command list names ready --started with an example', async () => {
  const t = backlogDeps([]);
  await run(['--help'], t.deps);
  assert.match(t.stdout(), /ready \[--started <keys>\][^]*?such as 281,282/);
});
