// lets go questions, run as a program, with a real user's lets config and a
// real repository's lets config. It reads only version and go, and asks no
// resolver, so it shows where each file is, what a file must be and how the
// two merge with the fewest moving parts.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { delegateRepo } from '../delegate/repo.ts';
import { type LetsResult, tempDir } from '../support/lets.ts';

const ASK = 'version: 3\ngo:\n  questions: ask\n';
const AUTO = 'version: 3\ngo:\n  questions: auto\n';

/**
 * The `questions` value of a run that succeeded. Asserts exit 0, an empty
 * stderr and exactly one line on stdout, `{"questions":<value>}`, and
 * returns `<value>`. Fails the test, with the run's output, when any of
 * these does not hold.
 */
function printed(result: LetsResult): unknown {
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /^[^\n]*\n$/, 'stdout is exactly one line');
  const value = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(value), ['questions'], result.stdout);
  return value.questions;
}

/**
 * Asserts that a run was rejected for a bad lets config: exit 2, an empty
 * stdout, and exactly one line on stderr that starts `lets go: <file>: `
 * and holds each of `named`. Returns nothing. Fails the test, with the
 * run's output, when any of these does not hold.
 */
function rejected(result: LetsResult, file: string, ...named: string[]): void {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^[^\n]*\n$/, `stderr is exactly one line: ${result.stderr}`);
  assert.ok(result.stderr.startsWith(`lets go: ${file}: `), result.stderr);
  for (const text of named) assert.ok(result.stderr.includes(text), `${text} in ${result.stderr}`);
}

function write(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

const questions = ['go', 'questions'];

describe('where the user\'s lets config is', () => {
  // Each test writes one file under XDG_CONFIG_HOME and another under a
  // temporary HOME's .config, so each place is seen to win only when it
  // should, and no test reads or writes the developer's own home.
  test('the file under XDG_CONFIG_HOME is read, and one under $HOME/.config is not', async (t) => {
    const repo = delegateRepo(t, { user: AUTO });
    const home = tempDir(t);
    write(join(home, '.config', 'lets', 'config.yaml'), ASK);
    assert.equal(printed(await repo.run(questions, { env: { HOME: home } })), 'auto');
  });

  test('with XDG_CONFIG_HOME unset, and with it empty, the file under $HOME/.config is read', async (t) => {
    const repo = delegateRepo(t, { user: AUTO });
    const home = tempDir(t);
    write(join(home, '.config', 'lets', 'config.yaml'), ASK);
    for (const xdg of [undefined, '']) {
      assert.equal(printed(await repo.run(questions, { env: { XDG_CONFIG_HOME: xdg, HOME: home } })), 'ask', `XDG_CONFIG_HOME ${JSON.stringify(xdg)}`);
    }
  });

  test('with no file, or only a config.json, it prints null', async (t) => {
    const none = delegateRepo(t);
    assert.equal(printed(await none.run(questions)), null);
    const json = delegateRepo(t);
    write(join(json.home, 'lets', 'config.json'), '{"version":3,"go":{"questions":"ask"}}');
    assert.equal(printed(await json.run(questions)), null);
  });
});

describe('what a file must be', () => {
  test('a file that is not YAML, not a mapping or not version 3 exits 2, naming the user\'s file and the reason', async (t) => {
    const cases: [string, string][] = [
      ['version: 3\ngo: { questions: [unclosed\n', 'is not YAML'],
      ['- just\n- a list\n', 'must be a mapping with version, got ["just","a list"]'],
      ['version: 2\ngo:\n  questions: ask\n', 'version must be 3, got 2'],
      ['version: "3"\n', 'version must be 3, got "3"'],
      ['go:\n  questions: ask\n', 'version must be 3, got undefined'],
    ];
    for (const [user, reason] of cases) {
      const repo = delegateRepo(t, { user });
      rejected(await repo.run(questions), repo.userConfig, reason);
    }
  });

  test('a YAML error ends with where the parser stopped, as one sentence', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ngo: { questions: [/x\n' });
    const result = await repo.run(questions);
    rejected(result, repo.userConfig, 'is not YAML');
    assert.match(result.stderr, /line 3, column 1\.\n$/);
  });

  test('a user\'s or a repository\'s lets config that is a folder exits 2, naming that file', async (t) => {
    const user = delegateRepo(t, { repo: ASK });
    mkdirSync(user.userConfig, { recursive: true });
    rejected(await user.run(questions), user.userConfig, 'cannot be read', 'EISDIR');
    const repo = delegateRepo(t, { user: ASK });
    mkdirSync(repo.repoConfig, { recursive: true });
    rejected(await repo.run(questions), repo.repoConfig, 'cannot be read', 'EISDIR');
  });

  test('a repository\'s lets config with version 2 exits 2, naming it', async (t) => {
    const repo = delegateRepo(t, { user: ASK, repo: 'version: 2\n' });
    rejected(await repo.run(questions), repo.repoConfig, 'version must be 3, got 2');
  });
});
