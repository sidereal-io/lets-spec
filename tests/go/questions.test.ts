// lets go questions, run as a program, with a real user's lets config and a
// real repository's lets config. It reads only version and go, and asks no
// resolver, so it shows where each file is, what a file must be and how the
// two merge with the fewest moving parts.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { delegateRepo } from '../delegate/repo.ts';
import { agy, claude, codex, type LetsResult, tempDir } from '../support/lets.ts';

const ASK = 'version: 4\ngo:\n  questions: ask\n';
const AUTO = 'version: 4\ngo:\n  questions: auto\n';

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
  const start = `lets go: ${file}: `;
  assert.ok(result.stderr.startsWith(start), result.stderr);
  // Only after the file, so a short text such as 7 cannot match the random temporary path.
  const message = result.stderr.slice(start.length);
  for (const text of named) assert.ok(message.includes(text), `${text} in ${result.stderr}`);
}

function write(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

const questions = ['go', 'questions'];

describe('where the user\'s lets config is', () => {
  // Each test sets HOME to a temporary folder, so no test reads or writes
  // the developer's own home.
  test('the file under XDG_CONFIG_HOME is read, and one under $HOME/.config is not', async (t) => {
    const repo = delegateRepo(t, { user: AUTO });
    const home = tempDir(t);
    // Not valid, so a run that read it at all, even under the other file, would exit 2.
    write(join(home, '.config', 'lets', 'config.yaml'), 'version: 2\n');
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
    assert.equal(printed(await none.run(questions, { env: { HOME: tempDir(t) } })), null);
    const json = delegateRepo(t);
    write(join(json.home, 'lets', 'config.json'), '{"version":3,"go":{"questions":"ask"}}');
    assert.equal(printed(await json.run(questions, { env: { HOME: tempDir(t) } })), null);
  });
});

describe('what a file must be', () => {
  test('a file that is not YAML, not a mapping or not version 4 exits 2, naming the user\'s file and the reason', async (t) => {
    const cases: [string, string][] = [
      ['version: 4\ngo: { questions: [unclosed\n', 'is not YAML'],
      ['- just\n- a list\n', 'must be a mapping with version, got ["just","a list"]'],
      ['version: 2\ngo:\n  questions: ask\n', 'version must be 4, got 2'],
      ['version: "4"\n', 'version must be 4, got "4"'],
      ['go:\n  questions: ask\n', 'version must be 4, got undefined'],
    ];
    for (const [user, reason] of cases) {
      const repo = delegateRepo(t, { user });
      rejected(await repo.run(questions), repo.userConfig, reason);
    }
  });

  test('a YAML error ends with where the parser stopped, as one sentence', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 4\ngo: { questions: [/x\n' });
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

  test('a version 3 file exits 2, naming its old guidance keys and their new keys', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ngo:\n  questions: auto\ndelegate:\n  step:\n    story:\n      guidance: Prefer claude.\n' });
    rejected(await repo.run(questions), repo.userConfig, 'version must be 4, got 3', 'delegate.step.story to delegate.story');
  });

  test('a repository\'s lets config with version 2 exits 2, naming it', async (t) => {
    const repo = delegateRepo(t, { user: ASK, repo: 'version: 2\n' });
    rejected(await repo.run(questions), repo.repoConfig, 'version must be 4, got 2');
  });
});

describe('go.questions', () => {
  test('ask and auto each print as one JSON line', async (t) => {
    for (const mode of ['ask', 'auto']) {
      const result = await delegateRepo(t, { user: `version: 4\ngo:\n  questions: ${mode}\n` }).run(questions);
      assert.equal(printed(result), mode);
      assert.equal(result.stdout, `{"questions":"${mode}"}\n`);
    }
  });

  test('a config that sets no question mode prints null', async (t) => {
    const bodies = ['', 'go:\n', 'go: null\n', 'go: {}\n', 'go:\n  questions:\n', 'go:\n  questions: null\n', 'go:\n  verbose: true\n', 'go:\n  level: recommend\n'];
    for (const body of bodies) {
      assert.equal(printed(await delegateRepo(t, { user: `version: 4\n${body}` }).run(questions)), null, body);
    }
  });

  test('the old go.level beside go.questions is ignored', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 4\ngo:\n  level: loud\n  questions: auto\n' });
    assert.equal(printed(await repo.run(questions)), 'auto');
  });

  test('a bad go or go.questions exits 2, naming the file, the key and the value', async (t) => {
    const cases: [string, string][] = [
      ['go: auto\n', 'go must be a mapping, got "auto"'],
      ['go: [ask]\n', 'go must be a mapping, got ["ask"]'],
      ['go:\n  questions: loud\n', 'go.questions must be ask or auto, got "loud"'],
      ['go:\n  questions: [ask]\n', 'go.questions must be ask or auto, got ["ask"]'],
      ['go:\n  questions: Ask\n', 'go.questions must be ask or auto, got "Ask"'],
      ['go:\n  questions: 3\n', 'go.questions must be ask or auto, got 3'],
      ['go:\n  questions: recommend\n', 'go.questions must be ask or auto, got "recommend"'],
    ];
    for (const [body, named] of cases) {
      const repo = delegateRepo(t, { user: `version: 4\n${body}` });
      rejected(await repo.run(questions), repo.userConfig, named);
    }
  });

  test('a delegate section the delegate commands reject, and other top-level keys, do not stop it', async (t) => {
    for (const other of ['delegate:\n  resolvers: [codex]\n', 'delegate: [t3]\n', 'sync: true\nbacklog: 7\n']) {
      const repo = delegateRepo(t, { user: `version: 4\n${other}go:\n  questions: ask\n  verbose: true\n` });
      assert.equal(printed(await repo.run(questions)), 'ask', other);
    }
  });

  test('it asks no resolver: with cli as the chain, no codex, claude or agy is called', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 4\ndelegate:\n  resolvers: [cli]\ngo:\n  questions: auto\n' });
    const clis = { codex: codex(repo.standIns), claude: claude(repo.standIns), agy: agy(repo.standIns) };
    assert.equal(printed(await repo.run(questions)), 'auto');
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });
});

describe('the repository\'s lets config', () => {
  test('the repository\'s go.questions wins over the user\'s', async (t) => {
    assert.equal(printed(await delegateRepo(t, { user: ASK, repo: AUTO }).run(questions)), 'auto');
  });

  test('the user\'s value stays when the repository\'s lets config has no go, or go: null', async (t) => {
    for (const repo of ['version: 4\n', 'version: 4\ngo: null\n']) {
      assert.equal(printed(await delegateRepo(t, { user: ASK, repo }).run(questions)), 'ask', repo);
    }
  });

  test('with only a repository\'s lets config, its value is printed', async (t) => {
    assert.equal(printed(await delegateRepo(t, { repo: AUTO }).run(questions)), 'auto');
  });

  test('run from a subfolder, it reads the lets config at the repository\'s root', async (t) => {
    const repo = delegateRepo(t, { user: ASK, repo: AUTO });
    const docs = join(repo.cwd, 'docs');
    mkdirSync(docs);
    assert.equal(printed(await repo.run(questions, { cwd: docs })), 'auto');
  });

  test('outside a Git repository, it reads only the user\'s lets config', async (t) => {
    const repo = delegateRepo(t, { user: ASK, notInRepo: true });
    write(repo.repoConfig, AUTO);
    assert.equal(printed(await repo.run(questions)), 'ask');
  });

  test('a bad go.questions in the repository\'s lets config exits 2, naming that file, not the user\'s', async (t) => {
    const repo = delegateRepo(t, { user: ASK, repo: 'version: 4\ngo:\n  questions: loud\n' });
    const result = await repo.run(questions);
    rejected(result, repo.repoConfig, 'go.questions', '"loud"');
    assert.ok(!result.stderr.includes(repo.userConfig), result.stderr);
  });

  test('a mapping at go.questions in the repository\'s lets config exits 2, naming that file, alone and over the user\'s ask', async (t) => {
    const alone = delegateRepo(t, { repo: 'version: 4\ngo:\n  questions: {}\n' });
    rejected(await alone.run(questions), alone.repoConfig, 'go.questions must be ask or auto, got {}');
    const over = delegateRepo(t, { user: ASK, repo: 'version: 4\ngo:\n  questions: { a: 1 }\n' });
    rejected(await over.run(questions), over.repoConfig, 'go.questions must be ask or auto, got {"a":1}');
  });

  test('a go that is a number in the repository\'s lets config replaces the user\'s go whole, and exits 2 naming that file', async (t) => {
    const repo = delegateRepo(t, { user: ASK, repo: 'version: 4\ngo: 7\n' });
    rejected(await repo.run(questions), repo.repoConfig, 'go must be a mapping, got 7');
  });

  test('a bad user\'s go.questions under a go: {} the repository merges into names the user\'s file', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 4\ngo:\n  questions: loud\n', repo: 'version: 4\ngo: {}\n' });
    rejected(await repo.run(questions), repo.userConfig, 'go.questions', '"loud"');
  });

  test('a YAML alias that holds itself prints the value in effect, and does not loop', async (t) => {
    const alone = delegateRepo(t, { user: AUTO, repo: 'version: 4\ngo:\n  questions: ask\nunused: &u { self: *u }\n' });
    assert.equal(printed(await alone.run(questions)), 'ask', 'only the repository holds the alias');
    const shared = delegateRepo(t, {
      user: 'version: 4\ngo:\n  questions: auto\nunused: &a { self: *a, x: 1 }\n',
      repo: 'version: 4\nunused: &u { self: *u }\n',
    });
    assert.equal(printed(await shared.run(questions)), 'auto', 'both files hold the key');
  });
});
