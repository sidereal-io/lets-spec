// The help text of lets backlog, run as a program. The stand-in gh answers
// nothing: help runs no gh command.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import { backlog, type BacklogFiles } from './github.ts';

// The standard output of lets backlog <args>, after checking it exited 0.
async function help(t: TestContext, args: string[], files: BacklogFiles = {}) {
  const b = backlog(t, [], files);
  const result = await b.lets(...args);
  assert.equal(result.code, 0, result.output);
  return { stdout: result.stdout, b };
}

test('the help text names the backlog provider in use', async (t) => {
  const { stdout } = await help(t, ['--help']);
  assert.match(stdout, /backlog provider is github/i);
  assert.doesNotMatch(stdout, /gh-failed/);
  assert.match(stdout, /backend-failed/);
  assert.match(stdout, /unknown-backlog-provider/);
});

test('lets backlog ready --help names --met-blockers with an example', async (t) => {
  const { stdout } = await help(t, ['ready', '--help']);
  assert.match(stdout, /--met-blockers <keys>.*279,280/);
});

test('the command list names ready --met-blockers with an example', async (t) => {
  const { stdout } = await help(t, ['--help']);
  assert.match(stdout, /ready \[--met-blockers <keys>\][^]*?such as 279,280/);
});

test('lets backlog ready --help names --started with an example', async (t) => {
  const { stdout } = await help(t, ['ready', '--help']);
  assert.match(stdout, /--started <keys>[^]*?281,282/);
});

test('the command list names ready --started with an example', async (t) => {
  const { stdout } = await help(t, ['--help']);
  assert.match(stdout, /ready \[--started <keys>\][^]*?such as 281,282/);
});

test('lets backlog --help lists complete and its results, and says it reads, claims and completes work', async (t) => {
  const { stdout } = await help(t, ['--help']);
  assert.match(stdout, /Read, claim and complete work/);
  assert.match(stdout, /^ {2}complete <i> +\{ result: completed \} \| \{ result: failed, message \}$/m);
});

test('lets backlog --help lists waves and its result', async (t) => {
  const { stdout } = await help(t, ['--help']);
  assert.match(stdout, /^ {2}waves --only <keys>\n +\{ waves: \[\{ stories: \[\{ key, label, waitsFor, reason \}\] \}\] \}$/m);
});

test('lets backlog --help names the repository\'s lets config when it sets the backlog provider', async (t) => {
  const { stdout, b } = await help(t, ['--help'], { repoConfig: 'version: 3\nbacklog:\n  provider: github\n' });
  assert.ok(stdout.includes(`The backlog provider is github, set in ${b.repoConfigFile}`), stdout);
});

test('lets backlog --help says both files set the backlog provider, and the repository\'s wins', async (t) => {
  const { stdout, b } = await help(t, ['--help']);
  assert.match(stdout, /\$XDG_CONFIG_HOME\/lets\/config\.yaml/);
  assert.match(stdout, /\.lets\/config\.yaml/);
  assert.match(stdout, /repository's value wins/);
  assert.doesNotMatch(stdout, /cannot set it/);
  assert.deepEqual(b.calls(), []);
});
