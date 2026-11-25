// The choice of backlog provider, run as a program: backlog.provider in the
// repository's lets config, .lets/config.yaml, wins over the user's,
// <XDG_CONFIG_HOME>/lets/config.yaml, and GitHub is the default. The
// stand-in gh logs every call, so a test sees that none ran.
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import { backlog, json, LOOKUP_ONE } from './github.ts';

const FIND: StandInRow = { args: ['issue', 'list', '--state', 'open', '--search'], prefix: true, ...json([]) };

test('with no backlog provider in the user\'s lets config, the backlog provider is GitHub', async (t) => {
  const configs = [
    undefined,
    'version: 3\n',
    'version: 3\ndelegate:\n  resolvers: [t3]\n',
    'version: 3\nbacklog:\n',
    'version: 3\nbacklog: {}\n',
    'version: 3\nbacklog:\n  provider:\n',
    'version: 3\nbacklog:\n  provider: github\n',
    'version: 3\nbacklog:\n  provider: github\n  other: 1\n',
  ];
  for (const config of configs) {
    const b = backlog(t, [...LOOKUP_ONE, FIND], { config });
    const result = await b.lets('find', 'fix-typo');
    assert.equal(result.code, 0, `${config}\n${result.output}`);
    assert.deepEqual(b.json(result), { issues: [] });
  }
});

test('an unknown backlog provider is unknown-backlog-provider, names the value, the file and github, and runs no gh command', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: jria\n' });
  const result = await b.lets('item', '136');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.match(out.message, /jria/);
  assert.ok(out.message.includes(b.configFile), out.message);
  assert.match(out.message, /github/);
  assert.deepEqual(b.calls(), []);
});

test('a lets config lets cannot read is unknown-backlog-provider, names the file, and runs no gh command', async (t) => {
  for (const config of ['version: 3\nbacklog:\n  provider: [jira]\n', 'version: 3\nbacklog: jira\n', 'backlog: {provider: [\n', 'backlog:\n  provider: jira\n']) {
    const b = backlog(t, [...LOOKUP_ONE, { args: ['issue'], prefix: true, ...json({}) }], { config });
    const result = await b.lets('claim', '136');
    assert.equal(result.code, 1, `${config}\n${result.output}`);
    const out = b.json(result);
    assert.equal(out.error, 'unknown-backlog-provider', config);
    assert.ok(out.message.includes(b.configFile), out.message);
    assert.deepEqual(b.calls(), [], config);
  }
});

test('a backlog that is not a mapping, or a provider that is not a name, is unknown-backlog-provider, saying which', async (t) => {
  const cases: [string, RegExp][] = [
    ['backlog: jira', /backlog must be a mapping/],
    ['backlog: [jira]', /backlog must be a mapping/],
    ['backlog:\n  provider: [jira]', /backlog\.provider must be a backlog provider's name/],
    ['backlog:\n  provider: 7', /backlog\.provider/],
    ['backlog:\n  provider: \'\'', /backlog\.provider/],
  ];
  for (const [yaml, pattern] of cases) {
    const b = backlog(t, [...LOOKUP_ONE, FIND], { config: `version: 3\n${yaml}\n` });
    const result = await b.lets('find', 'x');
    assert.equal(result.code, 1, `${yaml}\n${result.output}`);
    const out = b.json(result);
    assert.equal(out.error, 'unknown-backlog-provider', yaml);
    assert.ok(out.message.includes(b.configFile), out.message);
    assert.match(out.message, pattern, yaml);
    assert.deepEqual(b.calls(), [], yaml);
  }
});

test('a lets block in openspec/config.yaml is not read', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { files: { 'openspec/config.yaml': 'schema: lets-standard\nlets:\n  backlog:\n    provider: jria\n' } });
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.json(result), { issues: [] });
});

test('a lets config that is a folder is unknown-backlog-provider, names the file, and runs no gh command', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND]);
  mkdirSync(b.configFile, { recursive: true });
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.includes(b.configFile), out.message);
  assert.match(out.message, /EISDIR/);
  assert.deepEqual(b.calls(), []);
});

test('a lets config that lets may not read is unknown-backlog-provider, names the file, and runs no gh command', async (t) => {
  if (process.getuid?.() === 0) {
    t.skip('root reads a file with mode 000, so the file cannot be made unreadable');
    return;
  }
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\n' });
  chmodSync(b.configFile, 0o000);
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.includes(b.configFile), out.message);
  assert.match(out.message, /EACCES/);
  assert.deepEqual(b.calls(), []);
});

test('the repository\'s backlog provider wins over the user\'s, with no error', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: jria\n', repoConfig: 'version: 3\nbacklog:\n  provider: github\n' });
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.json(result), { issues: [] });
});

test('an unknown backlog provider in the repository\'s lets config names that file, and runs no gh command', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: github\n', repoConfig: 'version: 3\nbacklog:\n  provider: jria\n' });
  const result = await b.lets('item', '136');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  for (const named of ['jria', b.repoConfigFile, 'github']) assert.ok(out.message.includes(named), out.message);
  assert.ok(!out.message.includes(b.configFile), out.message);
  assert.deepEqual(b.calls(), []);
});

test('a bad backlog.provider in the repository\'s lets config names that file first', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: github\n', repoConfig: 'version: 3\nbacklog:\n  provider: 7\n' });
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.startsWith(`${b.repoConfigFile}: `), out.message);
  assert.deepEqual(b.calls(), []);
});

test('a bad backlog.provider in the user\'s lets config names that file, even when the repository\'s sets another backlog key', async (t) => {
  // The repository's file sets backlog but not backlog.provider, so naming
  // the file for backlog instead would blame the wrong one.
  const b = backlog(t, [...LOOKUP_ONE, FIND], { config: 'version: 3\nbacklog:\n  provider: 7\n', repoConfig: 'version: 3\nbacklog:\n  other: 1\n' });
  const result = await b.lets('find', 'x');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.startsWith(`${b.configFile}: `), out.message);
  assert.deepEqual(b.calls(), []);
});

test('a repository\'s lets config with the old version is unknown-backlog-provider, naming it', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND], { repoConfig: 'version: 2\nbacklog:\n  provider: github\n' });
  const result = await b.lets('ready');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'unknown-backlog-provider');
  assert.ok(out.message.includes(b.repoConfigFile), out.message);
  assert.match(out.message, /version/);
  assert.deepEqual(b.calls(), []);
});
