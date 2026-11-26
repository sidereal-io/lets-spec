// lets go records, run as a program in a temporary Git repository, with a
// stand-in gh on PATH that answers `pr view` from a table. Each commit sets
// its author and committer dates, and each expected short hash is read back
// from the repository, so no hash is hard-coded.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test, type TestContext } from 'node:test';
import { git, type LetsResult, pinnedEnv, runLets, type StandIn, type StandInRow, standIn, tempDir } from '../support/lets.ts';

const NAME = 'lets-go-chore';

/** gh's answer for a branch with no pull request. */
const noPr = (name = NAME): StandInRow => ({
  args: ['pr', 'view', name], prefix: true,
  stderr: `no pull requests found for branch "${name}"\n`, code: 1,
});

/** gh's answer for a branch whose pull request is `number`, with `body`. */
const pr = (number: number, body: string, name = NAME): StandInRow => ({
  args: ['pr', 'view', name], prefix: true,
  stdout: `${JSON.stringify({ number, body })}\n`,
});

interface Repo {
  root: string;
  gh: StandIn;
  /** Writes `files`, and commits them, authored on `author` and committed on `committer` (the author date when absent). Returns the short hash. */
  commit(message: string, files: Record<string, string>, author: string, committer?: string): string;
  /** Moves `from` to `to` with `git mv`, and commits it on `date`. Returns the short hash. */
  move(message: string, from: string, to: string, date: string): string;
  /** Runs `lets go records <args>`, `NAME` when absent. */
  records(...args: string[]): Promise<LetsResult>;
}

/**
 * A new repository with one commit that touches no change, and a stand-in
 * `gh` that answers from `rows`.
 */
function repo(t: TestContext, rows: StandInRow[]): Repo {
  const root = tempDir(t);
  const bin = tempDir(t);
  const gh = standIn(bin, 'gh', rows);
  const run = (env: Record<string, string>, ...args: string[]) => {
    const result = spawnSync('git', args, { cwd: root, env: pinnedEnv(env), encoding: 'utf8' });
    assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
    return result.stdout.trim();
  };
  const dated = (author: string, committer = author) => ({ GIT_AUTHOR_DATE: `${author}T12:00:00Z`, GIT_COMMITTER_DATE: `${committer}T12:00:00Z` });
  run({}, 'init', '--quiet', '--initial-branch', NAME);
  writeFileSync(join(root, 'README.md'), 'app\n');
  run({}, 'add', '.');
  run(dated('2026-11-01'), 'commit', '--quiet', '-m', 'chore: start');
  return {
    root,
    gh,
    commit(message, files, author, committer) {
      for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        writeFileSync(join(root, path), text);
      }
      run({}, 'add', '.');
      run(dated(author, committer), 'commit', '--quiet', '-m', message);
      return run({}, 'log', '-1', '--format=%h');
    },
    move(message, from, to, date) {
      mkdirSync(dirname(join(root, to)), { recursive: true });
      run({}, 'mv', from, to);
      run(dated(date), 'commit', '--quiet', '-m', message);
      return run({}, 'log', '-1', '--format=%h');
    },
    records: (...args) => runLets(['go', 'records', ...(args.length === 0 ? [NAME] : args)], { cwd: root, standIns: bin }),
  };
}

/** The records a run printed. Asserts exit 0, an empty stderr and exactly one line on stdout. */
function printed(result: LetsResult): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /^[^\n]*\n$/, 'stdout is exactly one line');
  return JSON.parse(result.stdout);
}

describe('a new change', () => {
  test('a change with no commit, no archive and no pull request prints four null records', async (t) => {
    const r = repo(t, [noPr()]);
    const result = await r.records();
    assert.equal(result.code, 0, result.output);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, '{"plan":null,"review-plan":null,"build":null,"review-build":null}\n');
  });

  test('the command leaves the tree, HEAD and the pull request as they were', async (t) => {
    const r = repo(t, [noPr()]);
    const head = git(r.root, 'rev-parse', 'HEAD').stdout;
    printed(await r.records());
    assert.equal(git(r.root, 'status', '--porcelain').stdout, '');
    assert.equal(git(r.root, 'rev-parse', 'HEAD').stdout, head);
    for (const call of r.gh.calls()) assert.deepEqual(call.slice(0, 2), ['pr', 'view']);
  });
});
