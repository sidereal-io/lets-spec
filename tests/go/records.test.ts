// lets go records, run as a program in a temporary Git repository, with a
// stand-in gh on PATH that answers `pr view` from a table, and a stand-in
// openspec that answers `instructions apply` with a fixed state. Each commit sets
// its author and committer dates, and each expected short hash is read back
// from the repository, so no hash is hard-coded.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test, type TestContext } from 'node:test';
import { git, type LetsResult, pinnedEnv, runLets, type StandIn, type StandInRow, standIn, tempDir, unstartable } from '../support/lets.ts';

const NAME = 'lets-go-chore';

/** gh's answer for a branch with no pull request. */
const noPr = (name = NAME): StandInRow => ({
  args: ['pr', 'view', name], prefix: true,
  stderr: `no pull requests found for branch "${name}"\n`, code: 1,
});

/** gh's answer for a branch whose pull request is `number`, with `body`: open and ready for review, unless `more` says otherwise. */
const pr = (number: number, body: string, name = NAME, more: { state?: string; isDraft?: boolean } = {}): StandInRow => ({
  args: ['pr', 'view', name], prefix: true,
  stdout: `${JSON.stringify({ number, body, state: 'OPEN', isDraft: false, ...more })}\n`,
});

/** openspec's answer to `instructions apply`: the change state `state`. */
const changeState = (state: string, more: Record<string, unknown> = {}): StandInRow => ({
  args: ['instructions', 'apply'], prefix: true,
  stdout: `${JSON.stringify({ state, ...more })}\n`,
});

interface Repo {
  root: string;
  /** The folder of the stand-ins, first on `PATH`. */
  bin: string;
  /** The stand-in `gh`, as the last `answer` left it. */
  gh: StandIn;
  /** Replaces the stand-in `gh`'s table with `rows`, for a body that names a commit made after the repository. */
  answer(rows: StandInRow[]): void;
  /** The stand-in `openspec`, as the last `state` left it. It says `ready` until then. */
  openspec: StandIn;
  /** Replaces the stand-in `openspec`'s table with `rows`. */
  state(rows: StandInRow[]): void;
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
  let openspec = standIn(bin, 'openspec', [changeState('ready')]);
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
    bin,
    get gh() { return gh; },
    answer(next) { gh = standIn(bin, 'gh', next); },
    get openspec() { return openspec; },
    state(next) { openspec = standIn(bin, 'openspec', next); },
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
  test('a new change with no commit, no archive and no pull request prints four null records, nothing done and no disagreement', async (t) => {
    const r = repo(t, [noPr()]);
    const result = await r.records();
    assert.equal(result.code, 0, result.output);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, '{"plan":null,"review-plan":null,"build":null,"review-build":null,'
      + '"done":{"plan":false,"review-plan":false,"build":false,"review-build":false},"disagreements":[],"pull-request":null}\n');
  });

  test('a new change: the command leaves the tree, HEAD and the pull request as they were', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: brainstorm', { [`openspec/changes/${NAME}/proposal.md`]: 'p\n' }, '2026-11-02');
    const head = git(r.root, 'rev-parse', 'HEAD').stdout;
    printed(await r.records());
    assert.equal(git(r.root, 'status', '--porcelain').stdout, '');
    assert.equal(git(r.root, 'rev-parse', 'HEAD').stdout, head);
    assert.equal(r.gh.calls().length, 1);
    for (const call of r.gh.calls()) assert.deepEqual(call.slice(0, 2), ['pr', 'view']);
    for (const call of r.openspec.calls()) assert.deepEqual(call.slice(0, 2), ['instructions', 'apply']);
  });

  test('a new change: gh is asked for the number, body, state and draft flag in one call', async (t) => {
    const r = repo(t, [noPr()]);
    printed(await r.records());
    assert.deepEqual(r.gh.calls(), [['pr', 'view', NAME, '--json', 'number,body,state,isDraft']]);
  });
});

describe('pull-request key', () => {
  for (const state of ['OPEN', 'MERGED', 'CLOSED']) {
    test(`the pull-request key is ${state} when gh says the state is ${state}`, async (t) => {
      const r = repo(t, [pr(167, '', NAME, { state })]);
      const records = printed(await r.records());
      assert.equal(records['pull-request'], state);
      assert.deepEqual(Object.keys(records), ['plan', 'review-plan', 'build', 'review-build', 'done', 'disagreements', 'pull-request']);
    });
  }

  test('the pull-request key is null when gh finds no pull request', async (t) => {
    const r = repo(t, [noPr()]);
    assert.equal(printed(await r.records())['pull-request'], null);
  });

  test('the pull-request key: gh JSON without a string state or a boolean isDraft fails', async (t) => {
    for (const value of [{ number: 167, body: '', isDraft: false }, { number: 167, body: '', state: 'OPEN', isDraft: 'no' }]) {
      const r = repo(t, [{ args: ['pr', 'view'], prefix: true, stdout: `${JSON.stringify(value)}\n` }]);
      const result = await r.records();
      assert.equal(result.code, 4, result.output);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /^lets go: gh pr view[^\n]*\n$/);
    }
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

describe('done answer', () => {
  const ALL = { plan: true, 'review-plan': true, build: true, 'review-build': true };
  const NONE = { plan: false, 'review-plan': false, build: false, 'review-build': false };

  test('the done answer is false for every step with no change folder, and openspec is not called', async (t) => {
    const r = repo(t, [noPr()]);
    assert.deepEqual(printed(await r.records()).done, NONE);
    assert.deepEqual(r.openspec.calls(), []);
  });

  test('the done answer reads the change state once, with openspec instructions apply', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    printed(await r.records());
    assert.deepEqual(r.openspec.calls(), [['instructions', 'apply', '--change', NAME, '--json']]);
  });

  const cases: [string, { plan: boolean; build: boolean }][] = [
    ['blocked', { plan: false, build: false }],
    ['ready', { plan: true, build: false }],
    ['all_done', { plan: true, build: true }],
  ];
  for (const [state, want] of cases) {
    test(`the done answer for a change state of ${state}`, async (t) => {
      const r = repo(t, [pr(167, '')]);
      r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
      r.state([changeState(state)]);
      const answers = printed(await r.records()).done as Record<string, boolean>;
      assert.equal(answers.plan, want.plan);
      assert.equal(answers.build, want.build);
      assert.equal(answers['review-build'], false);
    });
  }

  test('the done answer is true for every step once the change is archived, and openspec is not called', async (t) => {
    const r = repo(t, [pr(167, '')]);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-05');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    assert.deepEqual(printed(await r.records()).done, ALL);
    assert.deepEqual(r.openspec.calls(), []);
  });

  test('the done answer is true for every step with two archive folders', async (t) => {
    const r = repo(t, [pr(167, '')]);
    r.commit('chore: archive', { [`${ARCHIVE}/tasks.md`]: '- [x] 1.1 a\n', [`openspec/changes/archive/2026-11-09-${NAME}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-09');
    assert.deepEqual(printed(await r.records()).done, ALL);
  });

  test('the done answer: a folder that only ends in the name is not an archive folder', async (t) => {
    const r = repo(t, [noPr('go-chore')]);
    r.commit('chore: archive', { [`${ARCHIVE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-06');
    assert.deepEqual(printed(await r.records('go-chore')).done, NONE);
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

describe('the archive folder', () => {
  test('the review-build record is null when openspec/changes/archive is a file', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('chore: odd', { 'openspec/changes/archive': 'not a folder\n' }, '2026-11-06');
    assert.equal(printed(await r.records())['review-build'], null);
  });

  test('an archive folder that cannot be read fails, naming it', { skip: process.getuid?.() === 0 && 'root reads any folder' }, async (t) => {
    const r = repo(t, [noPr()]);
    const dir = join(r.root, 'openspec/changes/archive');
    mkdirSync(dir, { recursive: true });
    chmodSync(dir, 0o000);
    let result: LetsResult;
    // Restored here, not in t.after, because the temporary folder's own cleanup runs first.
    try {
      result = await r.records();
    } finally {
      chmodSync(dir, 0o755);
    }
    assert.equal(result.code, 4, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^lets go: could not read openspec\/changes\/archive: [^\n]*\n$/);
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

/** A pull request body whose `## Plan review` section says `Reviewed: <sha>` and `- **Verdict:** <verdict>`, then holds `lines`. */
const reviewBody = (sha: string, verdict: string, ...lines: string[]) => ['Closes #268', '', '## Plan review', '', `Reviewed: ${sha}`, '',
  '- **Reviewer:** codex/gpt-5, fresh session, independent: yes', `- **Verdict:** ${verdict}`, ...lines, '', '## Code review', '', 'Pending.', ''].join('\n');

/**
 * A repository whose change, on `schema`, was planned in one commit that
 * added its .openspec.yaml, design.md and tasks.md, with the change state
 * `state`. Returns it and that commit, the one a review saw.
 */
function reviewed(t: TestContext, { schema = 'lets-standard', state = 'ready' } = {}): { r: Repo; sha: string } {
  const r = repo(t, [noPr()]);
  const sha = r.commit('docs: plan', {
    [`${CHANGE}/.openspec.yaml`]: `schema: ${schema}\ncreated: 2026-11-03\n`,
    [`${CHANGE}/design.md`]: 'd\n',
    [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n',
  }, '2026-11-03');
  r.state([changeState(state)]);
  return { r, sha };
}

/** The review-plan answer under `done`. */
const reviewPlanDone = async (r: Repo) => (printed(await r.records()).done as Record<string, boolean>)['review-plan'];

describe('review plan answer', () => {
  test('the review plan answer is true for a lets-minimal change, with a null record and no disagreement', async (t) => {
    const { r } = reviewed(t, { schema: 'lets-minimal' });
    const records = printed(await r.records());
    assert.equal((records.done as Record<string, boolean>)['review-plan'], true);
    assert.equal(records['review-plan'], null);
    assert.deepEqual(records.disagreements, []);
  });

  test('the review plan answer is false with no Plan review section', async (t) => {
    const { r } = reviewed(t);
    r.answer([pr(167, 'Closes #268\n\n## Code review\n\nPending.\n')]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false with no pull request', async (t) => {
    const { r } = reviewed(t);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false for a REVISE verdict', async (t) => {
    const { r, sha } = reviewed(t);
    r.answer([pr(167, reviewBody(sha, 'REVISE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false for a verdict it does not know', async (t) => {
    const { r, sha } = reviewed(t);
    r.answer([pr(167, reviewBody(sha, 'LGTM'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is true for APPROVE with no plan commit after the review', async (t) => {
    const { r, sha } = reviewed(t);
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('the review plan answer is true for APPROVE when later commits change code and tick tasks.md', async (t) => {
    const { r, sha } = reviewed(t, { state: 'all_done' });
    r.commit('feat: a', { 'lets/src/a.ts': 'a\n', [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [ ] 1.2 b\n' }, '2026-11-04');
    r.commit('feat: b', { 'lets/src/b.ts': 'b\n', [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [x] 1.2 b\n' }, '2026-11-05');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('the review plan answer is false when the reviewed commit is not an ancestor of HEAD', async (t) => {
    const { r } = reviewed(t);
    const g = (...args: string[]) => assert.equal(git(r.root, ...args).code, 0, args.join(' '));
    g('checkout', '--quiet', '-b', 'old');
    const gone = r.commit('docs: old plan', { [`${CHANGE}/design.md`]: 'old\n' }, '2026-11-02');
    g('checkout', '--quiet', NAME);
    r.answer([pr(167, reviewBody(gone, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false when a later commit changes design.md and no fix item names it', async (t) => {
    const { r, sha } = reviewed(t);
    r.commit('docs: rework the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false when a later commit adds an ADR and no fix item names it', async (t) => {
    const { r, sha } = reviewed(t);
    r.commit('docs: ADR', { 'docs/decisions/ADR-099-x.md': 'x\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is true when the one later plan commit is a fix a rebuttal names', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE', '- **Rebuttals:**', `  1. Fixed in ${fix}: design.md decision 2`))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('the review plan answer is false when the commit a rebuttal names also changes code', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n', 'lets/src/a.ts': 'a\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE', '- **Rebuttals:**', `  1. Fixed in ${fix}: design.md decision 2`))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false for a tick before any task is built: a later commit changes only tasks.md, and no task is ticked', async (t) => {
    const { r, sha } = reviewed(t);
    r.commit('docs: one more task', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is false when tasks.md was edited in planning and again after the review, with no task ticked', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: plan', { [`${CHANGE}/.openspec.yaml`]: 'schema: lets-standard\n', [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n' }, '2026-11-03');
    r.commit('docs: one more task', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    const records = printed(await r.records());
    assert.notEqual(records.build, null);
    assert.equal((records.done as Record<string, boolean>)['review-plan'], false);
  });

  test('the review plan answer reads the ticks from HEAD, not from the working tree', async (t) => {
    const { r, sha } = reviewed(t);
    r.commit('docs: one more task', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n' }, '2026-11-04');
    writeFileSync(join(r.root, CHANGE, 'tasks.md'), '- [x] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n');
    r.answer([pr(167, reviewBody(sha, 'APPROVE'))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('the review plan answer is true for an archived change, whatever the section says', async (t) => {
    const { r, sha } = reviewed(t);
    r.commit('docs: rework the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    r.answer([pr(167, reviewBody(sha, 'REVISE'))]);
    assert.equal(await reviewPlanDone(r), true);
  });
});

describe('required changes', () => {
  const AWC = 'APPROVE_WITH_CHANGES';
  /** The section's lists after the verdict: findings, then the required changes, then the rebuttals. */
  const lists = (findings: string[], required: string[], rebuttals: string[]) => [
    '- **Findings:**', ...findings.map((text, i) => `  ${i + 1}. ${text}`),
    `- **Required changes:**${required.length === 0 ? ' none' : ''}`, ...required.map((text, i) => `  ${i + 1}. ${text}`),
    '- **Rebuttals:**', ...rebuttals.map((text, i) => `  ${i + 1}. ${text}`),
  ];

  test('required changes with their fixes: true when each required change has a fix commit after the review', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x. CONFIRMED.', '**b** y. CONFIRMED.'], ['design.md decision 2'],
      ['Rebutted: the spec says so.', `Fixed in ${fix}: design.md decision 2`])))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('required changes: a fix item numbered differently from its required change counts', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.', '**b** y.', '**c** z.'], ['design.md decision 2'],
      ['Rebutted: no.', 'Rebutted: no.', `Fixed in ${fix}: design.md decision 2`])))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('required changes: true with none required and no fix', async (t) => {
    const { r, sha } = reviewed(t);
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], [], ['Rebutted: no.'])))]);
    assert.equal(await reviewPlanDone(r), true);
  });

  test('required changes: false when two required changes have one fix item', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.', '**b** y.'], ['design.md decision 2', 'tasks.md task 1.2'],
      [`Fixed in ${fix}: design.md decision 2`, 'Rebutted: no.'])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: a Fixed in line under Findings is not a fix item', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists([`Fixed in ${fix}: x.`], ['design.md decision 2'], ['Rebutted: no.'])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: false when the fix commit also changes code', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix the design', { [`${CHANGE}/design.md`]: 'd2\n', 'lets/src/go/records.ts': 'x\n' }, '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], ['design.md decision 2'], [`Fixed in ${fix}: design.md decision 2`])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: false when the fix commit moves a plan file out of the plan folders', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.move('docs: move the design', `${CHANGE}/design.md`, 'notes/design.md', '2026-11-04');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], ['design.md decision 2'], [`Fixed in ${fix}: design.md decision 2`])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: false when the fix item names a commit from before the review', async (t) => {
    const r = repo(t, [noPr()]);
    const early = r.commit('docs: plan', { [`${CHANGE}/.openspec.yaml`]: 'schema: lets-standard\n', [`${CHANGE}/design.md`]: 'd\n' }, '2026-11-02');
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], ['design.md decision 2'], [`Fixed in ${early}: design.md decision 2`])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: false when the fix item names a commit git cannot find', async (t) => {
    const { r, sha } = reviewed(t);
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], ['design.md decision 2'], ['Fixed in 0000000: design.md decision 2'])))]);
    assert.equal(await reviewPlanDone(r), false);
  });

  test('required changes: a fix that only changes tasks.md after a task is ticked still counts', async (t) => {
    const { r, sha } = reviewed(t);
    const fix = r.commit('docs: fix task 1.2', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n- [ ] 1.2 b2\n' }, '2026-11-04');
    r.commit('feat: a', { 'lets/src/a.ts': 'a\n', [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [ ] 1.2 b2\n' }, '2026-11-05');
    r.answer([pr(167, reviewBody(sha, AWC, ...lists(['**a** x.'], ['tasks.md task 1.2'], [`Fixed in ${fix}: task 1.2`])))]);
    assert.equal(await reviewPlanDone(r), true);
  });
});

describe('disagreements', () => {
  /** The disagreements a run printed. */
  const found = async (r: Repo, name = NAME) => printed(await r.records(name)).disagreements as { row: string; found: string }[];
  const rows = (list: { row: string }[]) => list.map((entry) => entry.row);

  /**
   * A repository whose change, on `schema`, was planned, built and
   * archived into `ARCHIVE`, with `config` as the schema of
   * openspec/config.yaml, or no such file when absent.
   */
  function archived(t: TestContext, rowsOfGh: StandInRow[], { schema = 'lets-standard', config }: { schema?: string; config?: string } = {}): Repo {
    const r = repo(t, rowsOfGh);
    if (config !== undefined) r.commit('chore: config', { 'openspec/config.yaml': `schema: ${config}\ncontext: |\n  x\n` }, '2026-11-02');
    r.commit('docs: plan', { [`${CHANGE}/.openspec.yaml`]: `schema: ${schema}\n`, [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-05');
    r.move('chore: archive', CHANGE, ARCHIVE, '2026-11-06');
    return r;
  }

  /** A ready pull request #167 whose body holds a Plan review section, then a Code review section unless `codeReview` is false. */
  const finished = (r: Repo, { codeReview = true, isDraft = false } = {}) => {
    const sha = git(r.root, 'log', '-1', '--format=%h', '--', `${ARCHIVE}/tasks.md`).stdout.trim();
    const body = ['## Plan review', '', `Reviewed: ${sha}`, '- **Verdict:** APPROVE', '', ...(codeReview ? ['## Code review', '', 'Reviewed: x', ''] : [])].join('\n');
    r.answer([pr(167, body, NAME, { isDraft })]);
  };

  test('no disagreement for a clean change whose draft pull request has no Plan review section', async (t) => {
    const { r } = reviewed(t);
    r.answer([pr(167, 'Closes #268\n', NAME, { isDraft: true })]);
    assert.deepEqual(await found(r), []);
  });

  test('a dirty-tree disagreement names each changed path outside .workspace/', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: skill', { 'skills/lets-go/SKILL.md': 's\n' }, '2026-11-02');
    writeFileSync(join(r.root, 'skills/lets-go/SKILL.md'), 's2\n');
    mkdirSync(join(r.root, '.workspace'));
    writeFileSync(join(r.root, '.workspace/notes.md'), 'n\n');
    assert.deepEqual(await found(r), [{ row: 'dirty-tree', found: 'skills/lets-go/SKILL.md' }]);
  });

  test('no dirty-tree disagreement when only .workspace/ is untracked', async (t) => {
    const r = repo(t, [noPr()]);
    mkdirSync(join(r.root, '.workspace'));
    writeFileSync(join(r.root, '.workspace/notes.md'), 'n\n');
    assert.deepEqual(await found(r), []);
  });

  test('a dirty-tree disagreement joins several paths, and names a rename by its new path', async (t) => {
    const r = repo(t, [noPr()]);
    assert.equal(git(r.root, 'mv', 'README.md', 'READ.md').code, 0);
    writeFileSync(join(r.root, 'new.md'), 'n\n');
    assert.deepEqual(await found(r), [{ row: 'dirty-tree', found: 'READ.md, new.md' }]);
  });

  test('a change-and-archive disagreement names the change folder and each archive folder', async (t) => {
    const r = archived(t, [pr(167, '')]);
    r.commit('docs: again', { [`${CHANGE}/proposal.md`]: 'p\n' }, '2026-11-07');
    const list = await found(r);
    assert.deepEqual(list.find((entry) => entry.row === 'change-and-archive'),
      { row: 'change-and-archive', found: `${CHANGE}/, ${ARCHIVE}/` });
  });

  test('disagreement rows come in order: dirty-tree before change-and-archive', async (t) => {
    const r = archived(t, [pr(167, '')]);
    r.commit('docs: again', { [`${CHANGE}/proposal.md`]: 'p\n' }, '2026-11-07');
    writeFileSync(join(r.root, 'README.md'), 'changed\n');
    assert.deepEqual(rows(await found(r)).slice(0, 2), ['dirty-tree', 'change-and-archive']);
  });

  test('an archive-not-ready disagreement for an archived change whose pull request is a draft', async (t) => {
    const r = archived(t, [], { config: 'lets-standard' });
    finished(r, { isDraft: true });
    assert.deepEqual(await found(r), [{ row: 'archive-not-ready', found: 'isDraft: true' }]);
  });

  test('an archive-not-ready disagreement on the standard flow with no Code review section', async (t) => {
    const r = archived(t, [], { config: 'lets-standard' });
    finished(r, { codeReview: false });
    assert.deepEqual(await found(r), [{ row: 'archive-not-ready', found: 'no Code review section' }]);
  });

  test('an archive-not-ready disagreement joins a draft and a missing Code review section', async (t) => {
    const r = archived(t, [], { config: 'lets-standard' });
    finished(r, { codeReview: false, isDraft: true });
    assert.deepEqual(await found(r), [{ row: 'archive-not-ready', found: 'isDraft: true, no Code review section' }]);
  });

  test('no disagreement on the minimal flow with no Code review section', async (t) => {
    const r = archived(t, [], { schema: 'lets-minimal', config: 'lets-minimal' });
    r.answer([pr(167, 'Closes #268\n')]);
    assert.deepEqual(await found(r), []);
  });

  test('a lets-minimal change archived in a lets-standard repository: archive-not-ready disagreement, and no archive-without-plan-review', async (t) => {
    const r = archived(t, [], { schema: 'lets-minimal', config: 'lets-standard' });
    r.answer([pr(167, 'Closes #268\n')]);
    assert.deepEqual(await found(r), [{ row: 'archive-not-ready', found: 'no Code review section' }]);
  });

  test('disagreements for an archived change with no pull request: archive-not-ready, then archive-without-plan-review, and no null-record for review-plan', async (t) => {
    const r = archived(t, [noPr()]);
    assert.deepEqual(await found(r), [
      { row: 'archive-not-ready', found: 'no pull request' },
      { row: 'archive-without-plan-review', found: 'no Plan review section' },
    ]);
  });

  test('an archive-without-plan-review disagreement when the ready pull request has a Code review section and no Plan review section', async (t) => {
    const r = archived(t, [pr(167, 'Closes #268\n\n## Code review\n\nReviewed: x\n')]);
    assert.deepEqual(await found(r), [{ row: 'archive-without-plan-review', found: 'no Plan review section' }]);
  });

  test('a null-record disagreement, not archive-without-plan-review, when the archived Plan review names no commit git can find', async (t) => {
    const r = archived(t, [pr(167, '## Plan review\n\nReviewed: 0000000\n- **Verdict:** APPROVE\n\n## Code review\n\nx\n')]);
    assert.deepEqual(await found(r), [{ row: 'null-record', found: 'review-plan' }]);
  });

  test('a brainstorm-without-pull-request disagreement for a committed brainstorm and no pull request', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: brainstorm', { [`${CHANGE}/brainstorm.md`]: 'b\n' }, '2026-11-02');
    r.state([changeState('blocked')]);
    assert.deepEqual(await found(r), [{ row: 'brainstorm-without-pull-request', found: `${CHANGE}/brainstorm.md` }]);
  });

  test('a brainstorm not yet committed is a dirty-tree disagreement, not brainstorm-without-pull-request', async (t) => {
    const r = repo(t, [noPr()]);
    r.commit('docs: proposal', { [`${CHANGE}/proposal.md`]: 'p\n' }, '2026-11-02');
    writeFileSync(join(r.root, CHANGE, 'brainstorm.md'), 'b\n');
    r.state([changeState('blocked')]);
    assert.deepEqual(rows(await found(r)), ['dirty-tree']);
  });

  test('a null-record disagreement for a done step whose record is null', async (t) => {
    const r = repo(t, [pr(167, 'Closes #268\n')]);
    // As in a shallow clone whose history starts after the commit that added tasks.md: no commit added it.
    r.commit('docs: proposal', { [`${CHANGE}/proposal.md`]: 'p\n' }, '2026-11-02');
    r.state([changeState('ready')]);
    assert.deepEqual(await found(r), [{ row: 'null-record', found: 'plan' }]);
  });

  test('a null-record disagreement names review-build for two archive folders', async (t) => {
    const r = archived(t, [], { config: 'lets-standard' });
    r.commit('chore: archive again', { [`openspec/changes/archive/2026-11-09-${NAME}/tasks.md`]: '- [x] 1.1 a\n' }, '2026-11-09');
    finished(r);
    const records = printed(await r.records());
    assert.equal(records['review-build'], null);
    const nulls = (records.disagreements as { row: string; found: string }[]).find((entry) => entry.row === 'null-record');
    assert.ok(nulls?.found.split(', ').includes('review-build'), JSON.stringify(records.disagreements));
  });

  test('no disagreement for a built change with no plan review: review plan is not done, and build is', async (t) => {
    const { r } = reviewed(t, { state: 'all_done' });
    r.commit('feat: a', { [`${CHANGE}/tasks.md`]: '- [x] 1.1 a\n- [x] 1.2 b\n' }, '2026-11-05');
    r.answer([pr(167, 'Closes #268\n')]);
    const records = printed(await r.records());
    assert.deepEqual(records.disagreements, []);
    assert.deepEqual(records.done, { plan: true, 'review-plan': false, build: true, 'review-build': false });
  });
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

  test('a name that holds a line break fails on one stderr line', async (t) => {
    const r = repo(t, [noPr()]);
    failed(await r.records('lets-go\nchore'), 2, 'lets-go chore');
  });

  test('gh output over several lines fails on one stderr line', async (t) => {
    const r = repo(t, [{ args: ['pr', 'view'], prefix: true, stdout: '{\n  "number": 167\n}\n' }]);
    failed(await r.records(), 4, 'gh pr view', '{ "number": 167 }');
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

  test('a git rev-parse killed by a signal fails, and is not read as a missing commit', async (t) => {
    const r = repo(t, []);
    const sha = r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-04');
    const bin = tempDir(t);
    standIn(bin, 'gh', [pr(167, `## Plan review\n\nReviewed: ${sha}\n- **Verdict:** APPROVE\n`)]);
    standIn(bin, 'openspec', [changeState('ready')]);
    const real = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
    // The stand-in kills itself for the commit lookup, and hands every other call to the real git.
    writeFileSync(join(bin, 'git'), `#!/bin/sh\nif [ "$1" = rev-parse ] && [ "$2" = --verify ]; then kill -KILL $$; fi\nexec '${real}' "$@"\n`, { mode: 0o755 });
    failed(await runLets(['go', 'records', NAME], { cwd: r.root, standIns: bin }), 4, 'git rev-parse', 'SIGKILL');
  });

  /** A repository whose change folder holds a committed tasks.md, so lets go records reads the change state. */
  function planned(t: TestContext, rows: StandInRow[] = [noPr()]): Repo {
    const r = repo(t, rows);
    r.commit('docs: tasks', { [`${CHANGE}/tasks.md`]: '- [ ] 1.1 a\n' }, '2026-11-03');
    return r;
  }

  test('openspec fails: a non-zero exit fails with its error', async (t) => {
    const r = planned(t);
    r.state([{ args: ['instructions', 'apply'], prefix: true, stderr: 'Change not found\n', code: 1 }]);
    failed(await r.records(), 4, 'openspec instructions', 'Change not found');
  });

  test('openspec fails: an openspec that cannot start fails, naming openspec', async (t) => {
    const r = planned(t);
    unstartable(r.bin, 'openspec');
    // Only the stand-ins and git on PATH, so no real openspec is found after the one that cannot start.
    failed(await runLets(['go', 'records', NAME], { cwd: r.root, standIns: r.bin, onlyStandIns: true }), 4, 'openspec');
  });

  for (const stdout of ['not json\n', '{"state":3}\n', 'null\n', '["ready"]\n']) {
    test(`openspec fails: output that is not JSON with a string state fails: ${stdout.trim()}`, async (t) => {
      const r = planned(t);
      r.state([{ args: ['instructions', 'apply'], prefix: true, stdout }]);
      failed(await r.records(), 4, 'openspec instructions apply');
    });
  }

  test('openspec fails: a change state it does not know fails, naming the state and the instruction on one line', async (t) => {
    const r = planned(t);
    r.state([changeState('no_tasks', { instruction: 'Run openspec status\nfirst.' })]);
    failed(await r.records(), 4, 'no_tasks', 'Run openspec status first.');
  });

  const unreadable = { skip: process.getuid?.() === 0 && 'root reads any file' };
  for (const path of [`${CHANGE}/.openspec.yaml`, 'openspec/config.yaml']) {
    test(`a ${path} that exists but cannot be read fails, naming it`, unreadable, async (t) => {
      const r = planned(t);
      r.commit('docs: schema', { [path]: 'schema: lets-standard\n' }, '2026-11-03');
      const file = join(r.root, path);
      chmodSync(file, 0o000);
      let result: LetsResult;
      try {
        result = await r.records();
      } finally {
        chmodSync(file, 0o644);
      }
      failed(result, 4, path);
    });
  }

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

  test('lets go records --help names the done, disagreements and pull-request keys, each row, and the rule review plan applies', async (t) => {
    const result = await runLets(['go', 'records', '--help'], { cwd: tempDir(t) });
    assert.equal(result.code, 0, result.output);
    const text = result.stdout.replace(/\s+/g, ' ');
    for (const name of ['done', 'disagreements', 'pull-request', 'row', 'found', 'true', 'false', 'dirty-tree', 'change-and-archive', 'archive-not-ready',
      'brainstorm-without-pull-request', 'archive-without-plan-review', 'null-record', 'Check an earlier review', 'lets-review-plan', 'openspec', 'MERGED']) {
      assert.ok(text.includes(name), `${name} in ${result.stdout}`);
    }
    for (const gone of ['does not read the change\'s schema', 'not say whether a step is done']) assert.ok(!text.includes(gone), `no ${gone} in ${result.stdout}`);
  });
});
