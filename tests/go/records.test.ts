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
  /** The stand-in `gh`, as the last `answer` left it. */
  gh: StandIn;
  /** Replaces the stand-in `gh`'s table with `rows`, for a body that names a commit made after the repository. */
  answer(rows: StandInRow[]): void;
  /** Writes `files`, and commits them, authored on `author` and committed on `committer` (the author date when absent). Returns the short hash. */
  commit(message: string, files: Record<string, string>, author: string, committer?: string): string;
  /** Moves `from` to `to` with `git mv`, and commits it on `date`. Returns the short hash. */
  move(message: string, from: string, to: string, date: string): string;
  /** Runs `lets go records <args>`, `NAME` when absent. */
  records(...args: string[]): Promise<LetsResult>;
  /** Runs `lets <args>` in the repository, with the stand-in `gh`. */
  lets(...args: string[]): Promise<LetsResult>;
}

/**
 * A new repository with one commit that touches no change, and a stand-in
 * `gh` that answers from `rows`.
 */
function repo(t: TestContext, rows: StandInRow[]): Repo {
  const root = tempDir(t);
  const bin = tempDir(t);
  let gh = standIn(bin, 'gh', rows);
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
    get gh() { return gh; },
    answer(next) { gh = standIn(bin, 'gh', next); },
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
    lets: (...args) => runLets(args, { cwd: root, standIns: bin }),
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

describe('a change merged in after archive', () => {
  test('the plan and build records come through the second parent of a merge', async (t) => {
    const r = repo(t, [noPr()]);
    const g = (...args: string[]) => {
      const result = git(r.root, ...args);
      assert.equal(result.code, 0, `git ${args.join(' ')}: ${result.stderr}`);
    };
    g('checkout', '--quiet', '-b', 'upstream');
    const plan = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    const build = r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-05');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    g('checkout', '--quiet', NAME);
    r.commit('chore: early', { 'notes.md': 'n\n' }, '2026-11-02');
    g('merge', '--quiet', '--no-edit', 'upstream');
    const records = printed(await r.records());
    assert.deepEqual(records.plan, { commit: plan, date: '2026-11-03' });
    assert.deepEqual(records.build, { commit: build, date: '2026-11-05' });
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

describe('review-plan record', () => {
  /** A body with a summary, then a `## Plan review` section that holds `lines`. */
  const planReview = (...lines: string[]) => ['## Summary', '', 'Closes #265', '', '## Plan review', '', ...lines, ''].join('\n');

  /**
   * A repository with one planned change, whose tasks.md commit is
   * authored 2026-11-04 and committed 2026-11-20, and whose pull request
   * #167 has the body `body(sha)`. Returns the review-plan record it prints.
   */
  async function reviewPlan(t: TestContext, body: (sha: string) => string): Promise<{ record: unknown; sha: string }> {
    const r = repo(t, []);
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-04', '2026-11-20');
    r.answer([pr(167, body(sha))]);
    return { record: printed(await r.records())['review-plan'], sha };
  }

  test('the review-plan record holds the reviewed commit, its author date, the pull request and the verdict', async (t) => {
    const { record, sha } = await reviewPlan(t, (sha) => planReview(`Reviewed: ${sha}`, '- **Verdict:** APPROVE'));
    assert.deepEqual(record, { commit: sha, date: '2026-11-04', pr: 167, verdict: 'APPROVE' });
  });

  test('the review-plan record keeps a full hash as written', async (t) => {
    const r = repo(t, []);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-04');
    const full = git(r.root, 'rev-parse', 'HEAD').stdout.trim();
    r.answer([pr(167, planReview(`Reviewed: ${full}`, '- **Verdict:** APPROVE'))]);
    assert.equal((printed(await r.records())['review-plan'] as { commit: string }).commit, full);
  });

  test('the review-plan record trims the spaces around each value', async (t) => {
    const { record, sha } = await reviewPlan(t, (sha) => planReview(`Reviewed:  ${sha}  `, '- **Verdict:**  REQUEST_CHANGES '));
    assert.deepEqual(record, { commit: sha, date: '2026-11-04', pr: 167, verdict: 'REQUEST_CHANGES' });
  });

  test('the review-plan record reads the Plan review section, not a Code review section before it', async (t) => {
    const { record, sha } = await reviewPlan(t, (sha) => ['## Code review', '', 'Reviewed: 9f00ba1', '- **Verdict:** REJECT', '',
      '## Plan review', '', `Reviewed: ${sha}`, '- **Verdict:** APPROVE', ''].join('\n'));
    assert.deepEqual(record, { commit: sha, date: '2026-11-04', pr: 167, verdict: 'APPROVE' });
  });

  test('the review-plan record is null when only a Code review section follows an empty Plan review section', async (t) => {
    const { record } = await reviewPlan(t, (sha) => ['## Plan review', '', 'Pending.', '',
      '## Code review', '', `Reviewed: ${sha}`, '- **Verdict:** APPROVE', ''].join('\n'));
    assert.equal(record, null);
  });

  test('the review-plan record is null when the body has only a Code review section', async (t) => {
    const { record } = await reviewPlan(t, (sha) => ['## Code review', '', `Reviewed: ${sha}`, '- **Verdict:** APPROVE', ''].join('\n'));
    assert.equal(record, null);
  });

  test('the review-plan record is null with no pull request', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-04');
    assert.equal(printed(await r.records())['review-plan'], null);
  });

  test('the review-plan record is null when the section has no verdict line', async (t) => {
    const { record } = await reviewPlan(t, (sha) => planReview(`Reviewed: ${sha}`));
    assert.equal(record, null);
  });

  test('the review-plan record is null when the section has no Reviewed line', async (t) => {
    const { record } = await reviewPlan(t, () => planReview('- **Verdict:** APPROVE'));
    assert.equal(record, null);
  });

  test('the review-plan record is null when a line holds nothing after its start', async (t) => {
    const { record } = await reviewPlan(t, () => planReview('Reviewed:  ', '- **Verdict:** APPROVE'));
    assert.equal(record, null);
  });

  for (const value of ['HEAD', '--all', '0000000']) {
    test(`the review-plan record is null for Reviewed: ${value}`, async (t) => {
      const { record } = await reviewPlan(t, () => planReview(`Reviewed: ${value}`, '- **Verdict:** APPROVE'));
      assert.equal(record, null);
    });
  }
});

describe('the command fails', () => {
  /** Asserts exit `code`, an empty stdout and one stderr line that starts `lets go: ` and holds each of `named`. */
  function failed(result: LetsResult, code: number, ...named: string[]): void {
    assert.equal(result.code, code, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^lets go: [^\n]*\n$/, `one lets go: line: ${result.stderr}`);
    for (const text of named) assert.ok(result.stderr.includes(text), `${text} in ${result.stderr}`);
  }

  test('a missing name fails with a usage error that names the argument', async (t) => {
    const r = repo(t, [noPr()]);
    const result = await r.lets('go', 'records');
    assert.equal(result.code, 2, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /missing required argument 'name'/);
  });

  test('a name that is not kebab-case fails before any git or gh call', async (t) => {
    const r = repo(t, [noPr()]);
    failed(await r.records('../lets-go-chore'), 2, '../lets-go-chore');
    assert.deepEqual(r.gh.calls(), []);
  });

  test('a gh failure other than no pull request fails with gh\'s error', async (t) => {
    const r = repo(t, [{ args: ['pr', 'view'], prefix: true, stderr: 'To get started with GitHub CLI, please run:  gh auth login\nAlternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token.\n', code: 1 }]);
    failed(await r.records(), 4, 'gh pr view', 'gh auth login');
  });

  test('gh output that is not JSON fails', async (t) => {
    const r = repo(t, [{ args: ['pr', 'view'], prefix: true, stdout: 'not json\n' }]);
    failed(await r.records(), 4, 'gh pr view');
  });

  test('gh JSON without a whole-number number and a string body fails', async (t) => {
    for (const value of [{ number: '167', body: '' }, { number: 1.5, body: '' }, { number: 167 }, null]) {
      const r = repo(t, [{ args: ['pr', 'view'], prefix: true, stdout: `${JSON.stringify(value)}\n` }]);
      failed(await r.records(), 4, 'gh pr view');
    }
  });

  test('a folder outside any Git repository fails, naming git', async (t) => {
    const outside = tempDir(t);
    // Stops git looking above the folder, in case the temporary folder is inside a repository.
    const result = await runLets(['go', 'records', NAME], { cwd: outside, env: { GIT_CEILING_DIRECTORIES: dirname(outside) } });
    failed(result, 4, 'git');
  });
});

describe('help', () => {
  test('lets go --help names both commands, and says the group reads settings and records', async (t) => {
    const result = await runLets(['go', '--help'], { cwd: tempDir(t) });
    assert.equal(result.code, 0, result.output);
    for (const text of ['questions', 'records', 'Read the settings and records the lets-go skill uses.']) assert.ok(result.stdout.includes(text), `${text} in ${result.stdout}`);
  });

  test('lets go records --help names each record, its fields and the exit codes', async (t) => {
    const result = await runLets(['go', 'records', '--help'], { cwd: tempDir(t) });
    assert.equal(result.code, 0, result.output);
    for (const text of ['plan', 'review-plan', 'build', 'review-build', 'commit', 'date', 'pr', 'verdict', 'null', 'tasks.md', 'Plan review']) {
      assert.ok(result.stdout.includes(text), `${text} in ${result.stdout}`);
    }
    for (const code of ['0', '2', '4']) assert.match(result.stdout, new RegExp(`^ {2}${code} {2}`, 'm'), `exit code ${code}`);
  });
});
