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

const CHANGE = `openspec/changes/${NAME}`;
const ARCHIVE = `openspec/changes/archive/2026-11-06-${NAME}`;

describe('plan record', () => {
  test('the plan record is the commit that added tasks.md, with its date', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: brainstorm', { [`${CHANGE}/brainstorm.md`]: 'b\n' }, '2026-11-02');
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    assert.deepEqual(printed(await r.records()).plan, { commit: sha, date: '2026-11-03' });
  });

  test('the plan record is dated by the author date, not the committer date', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03', '2026-11-20');
    assert.equal((printed(await r.records()).plan as { date: string }).date, '2026-11-03');
  });

  test('the plan record is null when no commit added tasks.md', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: brainstorm', { [`${CHANGE}/brainstorm.md`]: 'b\n', [`${CHANGE}/proposal.md`]: 'p\n' }, '2026-11-02');
    assert.equal(printed(await r.records()).plan, null);
  });

  test('the plan record stays on the commit that added tasks.md after archive', async (t) => {
    const r = repo(t, [noPr()]);
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    assert.deepEqual(printed(await r.records()).plan, { commit: sha, date: '2026-11-03' });
  });
});

describe('build record', () => {
  test('the build record is the last commit that changed tasks.md', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n' }, '2026-11-03');
    r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [ ] 1.2 b\n' }, '2026-11-04');
    const sha = r.commit('feat: b', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [x] 1.2 b\n' }, '2026-11-05');
    assert.deepEqual(printed(await r.records()).build, { commit: sha, date: '2026-11-05' });
  });

  test('the build record is null when no commit changed tasks.md after adding it', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    const records = printed(await r.records());
    assert.equal(records.build, null);
    assert.notEqual(records.plan, null);
  });

  test('the build record is not the archive move', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    const sha = r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-05');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    assert.deepEqual(printed(await r.records()).build, { commit: sha, date: '2026-11-05' });
  });
});

describe('review-build record', () => {
  /** A repository whose change was planned, built and archived into `ARCHIVE`. Returns it and the archive commit. */
  function archived(t: TestContext, rows: StandInRow[]): { r: Repo; sha: string } {
    const r = repo(t, rows);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-05');
    return { r, sha: r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06') };
  }

  test('the review-build record is the archive commit, with the pull request number', async (t) => {
    const { r, sha } = archived(t, [pr(167, '')]);
    assert.deepEqual(printed(await r.records())['review-build'], { commit: sha, date: '2026-11-06', pr: 167 });
  });

  test('the review-build record has a null pr when gh finds no pull request', async (t) => {
    const { r, sha } = archived(t, [noPr()]);
    assert.deepEqual(printed(await r.records())['review-build'], { commit: sha, date: '2026-11-06', pr: null });
  });

  test('the review-build record is null for a folder that only ends in the name', async (t) => {
    const r = repo(t, [noPr('go-chore')]);
    r.commit('chore: archive', { [`${ARCHIVE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-06');
    assert.equal(printed(await r.records('go-chore'))['review-build'], null);
  });

  test('the review-build record is null for two matching folders', async (t) => {
    const { r } = archived(t, [pr(167, '')]);
    r.commit('chore: archive again', { [`openspec/changes/archive/2026-11-09-${NAME}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-09');
    assert.equal(printed(await r.records())['review-build'], null);
  });

  test('the review-build record is null for a folder no commit added', async (t) => {
    const r = repo(t, [pr(167, '')]);
    mkdirSync(join(r.root, ARCHIVE), { recursive: true });
    writeFileSync(join(r.root, ARCHIVE, 'tasks.md'), '- [x] 1.1 a\n');
    assert.equal(printed(await r.records())['review-build'], null);
  });
});
