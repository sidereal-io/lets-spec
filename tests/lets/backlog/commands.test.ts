import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, CONFIG_FILE, fail, json, lookup, LOOKUP_ONE, PROJECT, TIMED_OUT } from './fixtures/fake-gh.ts';

const FIND: [string, ReturnType<typeof json>] = ['issue list --state open --search', json([])];

test('a result is one JSON object and a newline, and exits 0', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND]);
  assert.equal(await run(['find', 'fix-typo'], t.deps), 0);
  assert.match(t.stdout(), /^\{.*\}\n$/);
  assert.deepEqual(t.json(), { issues: [] });
});

test('the Project lookup runs first, as the skills ran it', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND]);
  await run(['find', 'fix-typo'], t.deps);
  const [first] = t.calls();
  assert.deepEqual(first.slice(0, 6), ['api', 'graphql', '-F', 'owner={owner}', '-F', 'name={repo}']);
  const query = first[first.indexOf('-f') + 1];
  assert.ok(query.startsWith('query=query($owner: String!, $name: String!) {'));
  assert.ok(query.includes('projectsV2(first: 100) { nodes { number title url closed'));
  assert.ok(query.includes('repositories(first: 100) { nodes { nameWithOwner } }'));
  const jq = first[first.indexOf('--jq') + 1];
  assert.ok(jq.includes('select(.closed | not)'));
  assert.ok(jq.includes('unique_by(.owner, .number)'));
});

test('no Project is no-backlog, names lets-setup-backlog, and exits 1', async () => {
  const t = backlogDeps([lookup([]), FIND]);
  assert.equal(await run(['find', 'fix-typo'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'no-backlog');
  assert.match(out.message, /lets-setup-backlog/);
  assert.equal(t.calls().length, 1);
});

test('two Projects are several-backlogs, with each title and URL, and nothing else runs', async () => {
  const other = { number: 9, title: 'Roadmap', url: 'https://github.com/orgs/acme/projects/9', owner: 'acme' };
  const t = backlogDeps([lookup([PROJECT, other]), ['issue', json({})]]);
  assert.equal(await run(['claim', '136'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'several-backlogs');
  assert.deepEqual(out.projects, [
    { title: 'Backlog', url: PROJECT.url },
    { title: 'Roadmap', url: other.url },
  ]);
  assert.match(out.message, /unlink/i);
  assert.equal(t.calls().length, 1);
});

test('gh failing is backend-failed with gh\'s error, and exits 1', async () => {
  const t = backlogDeps([['api graphql', fail('To get started with GitHub CLI, please run:  gh auth login')]]);
  assert.equal(await run(['ready'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'backend-failed');
  assert.match(out.message, /gh auth login/);
});

test('gh that cannot start or times out is backend-failed', async () => {
  for (const answer of [{ stdout: '', stderr: 'spawn gh ENOENT', code: null }, TIMED_OUT]) {
    const t = backlogDeps([['api graphql', answer]]);
    assert.equal(await run(['ready'], t.deps), 1);
    const out = t.json();
    assert.equal(out.error, 'backend-failed');
    assert.ok(out.message.length > 0);
  }
});

test('a read that gh answers with something other than JSON is backend-failed', async () => {
  const t = backlogDeps([['api graphql', { stdout: 'not json', stderr: '', code: 0 }]]);
  assert.equal(await run(['ready'], t.deps), 1);
  assert.equal(t.json().error, 'backend-failed');
});

test('every gh call has a finite timeout', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND]);
  await run(['find', 'fix-typo'], t.deps);
  for (const opts of t.options()) assert.ok(Number.isFinite(opts.timeoutMs) && opts.timeoutMs! > 0);
});

test('a usage error exits 2 and prints nothing on stdout', async () => {
  const cases = [
    ['item'],
    ['item', ''],
    ['claim', ''],
    ['claim'],
    ['release', '149'],
    ['release', '1.5'],
    ['find'],
    ['ready', '--bogus'],
    ['ready', '--only', ''],
    ['ready', '--exclude', '1,,2'],
    ['ready', 'extra'],
    ['frobnicate'],
    [],
  ];
  for (const args of cases) {
    const t = backlogDeps([...LOOKUP_ONE]);
    assert.equal(await run(args, t.deps), 2, args.join(' '));
    assert.equal(t.stdout(), '', args.join(' '));
    assert.deepEqual(t.calls(), [], args.join(' '));
  }
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
