// lets delegate step start and step wait, run as a program in a real Git
// repository, with real background processes. The cli resolver is chosen
// by a real lets config, and PATH holds only the stand-ins and git. A test
// reads the files the commands share: the run record, the report file, the
// meta file and the exit file. Every step a test starts is stopped by the
// end of that test, even when it fails.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test, type TestContext } from 'node:test';
import { claude, codex, agy, git, type LetsResult } from '../support/lets.ts';
import { type DelegateRepo, delegateRepo, PROMPT } from './repo.ts';
import { agyWrite, assertClock, claudeWrite, cleanUpStep, codexWrite, ending, stepStart, type StartArgs, stopStep, untilCalled, untilGone } from './steps.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
const DONE = ending('outcome: done\nevidence:\n  - "commit 3f2a1c0"\n');
const ANSWERS = '- question: Which schema?\n  answer: lets-minimal\n';
// The prompt lets composes from PROMPT and ANSWERS.
const ANSWERED = `${PROMPT}\n## Answers\n\nThese questions from the last step report are settled. Do not ask them again.\n\n- Q: Which schema?\n  A: lets-minimal\n`;
const KILLED = 'lets delegate: the background step ended without an exit code\n';
// A claude whose step on the bare family answers done, and whose step on
// claude/claude-slow hangs.
const SLOW = ['claude/claude-slow'];
const answersAndHangs = (repo: DelegateRepo) =>
  claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }, { args: claudeWrite('high', 'claude-slow'), hang: true }] });
const RECORD_KEYS = ['name', 'pid', 'checkout', 'reportFile', 'metaFile', 'exitFile', 'startedAt'];

// Where lets keeps the runs of the repository whose root is root.
const runs = (root: string) => join(root, '.workspace', 'lets-delegate');
const runRecordFile = (root: string, name = 'build-x') => join(runs(root), `${name}.run.json`);
const exitFile = (root: string, name = 'build-x') => join(runs(root), `${name}.exit.json`);
const runRecord = (root: string, name = 'build-x') => JSON.parse(readFileSync(runRecordFile(root, name), 'utf8'));

// Starts a step with stepStart's arguments and over, and checks that it
// started: exit 0 and one line, {name, pid}. Stops the step at the end of
// the test.
async function started(t: TestContext, repo: DelegateRepo, over: StartArgs = {}, cwd?: string): Promise<{ name: string; pid: number }> {
  const result = await repo.run(stepStart(over), { cwd });
  assert.equal(result.code, 0, result.output);
  const printed = JSON.parse(result.stdout);
  assert.equal(typeof printed.pid, 'number', result.stdout);
  cleanUpStep(t, printed.pid);
  assert.equal(result.stdout, `${JSON.stringify({ name: printed.name, pid: printed.pid })}\n`);
  return printed;
}

// Runs lets delegate step wait for names.
const waitFor = (repo: DelegateRepo, names: string[], { timeoutMinutes, cwd }: { timeoutMinutes?: number; cwd?: string } = {}) =>
  repo.run(['delegate', 'step', 'wait', ...names.flatMap((name) => ['--name', name]),
    ...(timeoutMinutes === undefined ? [] : ['--timeout-minutes', String(timeoutMinutes)])], { cwd });

// What step wait printed when a step ended: exit 0 and one line, {name, exit}.
function ended(result: LetsResult): { name: string; exit: number } {
  assert.equal(result.code, 0, result.output);
  assert.match(result.stdout, /^[^\n]+\n$/, 'stdout is exactly one line');
  return JSON.parse(result.stdout);
}

// A start that failed with code: nothing on stdout, and no run record.
function notStarted(repo: DelegateRepo, result: LetsResult, code: number) {
  assert.equal(result.code, code, result.output);
  assert.equal(result.stdout, '');
  assert.equal(existsSync(runRecordFile(repo.cwd)), false, 'no run record');
}

describe('step start', () => {
  test('a story in a worktree starts at once, prints its name and pid, and runs there', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const worktree = join(repo.cwd, '.workspace', 'lets-go', 'worktrees', 'fix-x');
    assert.equal(git(repo.cwd, 'worktree', 'add', '-q', '-b', 'fix-x', worktree).code, 0);
    const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    const { name } = await started(t, repo, { for: 'story', name: 'Fix X', checkout: '.workspace/lets-go/worktrees/fix-x' });
    assert.equal(name, 'fix-x');
    assert.deepEqual(ended(await waitFor(repo, ['fix-x'])), { name: 'fix-x', exit: 0 });
    assert.deepEqual(stand.cwds(), [worktree]);
    assert.equal(JSON.parse(readFileSync(join(repo.cwd, 'r.json'), 'utf8')).outcome, 'done');
  });

  test('from a subfolder, every --model, --timeout-minutes and --answers-file reach step run, which runs in the root', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const docs = join(repo.cwd, 'docs');
    mkdirSync(docs);
    writeFileSync(join(docs, 'a.yaml'), ANSWERS);
    const clis = {
      // codex refuses the first model, so agy runs the second.
      codex: codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'model not available\n', code: 1 }] }),
      agy: agy(repo.standIns, [], { rows: [{ args: agyWrite('high', '900m', ANSWERED), stdout: DONE }] }),
    };
    await started(t, repo, { promptFile: '../p.md', models: ['gpt/gpt-6-astra', 'gemini'], timeoutMinutes: 900, answersFile: 'a.yaml' }, docs);
    assert.deepEqual(ended(await waitFor(repo, ['build-x'], { cwd: docs })), { name: 'build-x', exit: 0 });
    assert.equal(clis.codex.calls().length, 1);
    assert.deepEqual(clis.agy.calls(), [agyWrite('high', '900m', ANSWERED)]);
    assert.deepEqual(clis.agy.cwds(), [repo.cwd]);
    // The report and meta files are where the working directory says; the
    // run is kept under the root.
    assert.equal(JSON.parse(readFileSync(join(docs, 'r.json'), 'utf8')).outcome, 'done');
    assert.equal(JSON.parse(readFileSync(join(docs, 'm.txt'), 'utf8').trim().split('\n').at(-1)!).family, 'gemini');
    assert.equal(existsSync(join(docs, '.workspace')), false);
    assert.equal(existsSync(runRecordFile(repo.cwd)), true);
  });

  test('the run record names the step, its pid, its checkout and its files, and when it started', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    const before = Date.now();
    const { pid } = await started(t, repo);
    const after = Date.now();
    const record = runRecord(repo.cwd);
    assert.deepEqual(Object.keys(record), RECORD_KEYS);
    const { startedAt, ...rest } = record;
    assert.deepEqual(rest, {
      name: 'build-x', pid, checkout: repo.cwd, reportFile: join(repo.cwd, 'r.json'), metaFile: join(repo.cwd, 'm.txt'), exitFile: exitFile(repo.cwd),
    });
    assertClock(startedAt, before, after);
  });

  test('a missing --report-file or --meta-file, an unreadable prompt or answers file, and a bad --model are each exit 2, and start nothing', async (t) => {
    const cases: [StartArgs, RegExp][] = [
      [{ reportFile: null }, /--report-file/],
      [{ metaFile: null }, /--meta-file/],
      [{ promptFile: 'gone.md' }, /gone\.md/],
      [{ answersFile: 'a.yaml' }, /--answers-file a\.yaml/],
      [{ models: ['llama/llama-4'] }, /llama\/llama-4/],
    ];
    for (const [over, named] of cases) {
      const repo = delegateRepo(t, { user: CLI });
      const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
      const result = await repo.run(stepStart(over));
      notStarted(repo, result, 2);
      assert.match(result.stderr, named, JSON.stringify(over));
      assert.deepEqual(stand.calls(), [], JSON.stringify(over));
    }
  });

  test('a name that still runs is exit 2, naming the step and its pid, and starts no second process', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), hang: true }] });
    const { pid } = await started(t, repo);
    await untilCalled(stand);
    const result = await repo.run(stepStart());
    assert.equal(result.code, 2, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`build-x.*\\b${pid}\\b`));
    assert.equal(runRecord(repo.cwd).pid, pid);
    assert.equal(stand.calls().length, 1);
  });

  test('a name that has ended starts again, and the new run replaces the old one', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    writeFileSync(join(repo.cwd, 'a.yaml'), ANSWERS);
    // Rows match by arguments, so the second start names another model to hang.
    const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }, { args: claudeWrite('high', 'claude-slow'), hang: true }] });
    const first = await started(t, repo);
    assert.equal(ended(await waitFor(repo, ['build-x'])).exit, 0);
    const second = await started(t, repo, { models: ['claude/claude-slow'], answersFile: 'a.yaml' });
    assert.notEqual(second.pid, first.pid);
    assert.equal(runRecord(repo.cwd).pid, second.pid);
    assert.equal(existsSync(exitFile(repo.cwd)), false, 'the old exit file is gone');
    await untilCalled(stand, 2);
    assert.deepEqual(stand.inputs(), [PROMPT, ANSWERED]);
  });

  test('a name whose process is gone with no exit file starts again', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = claude(repo.standIns, { rows: [{ args: claudeWrite('high', 'claude-slow'), hang: true }, { args: claudeWrite(), stdout: DONE }] });
    const first = await started(t, repo, { models: ['claude/claude-slow'] });
    await untilCalled(stand);
    stopStep(first.pid);
    await untilGone(first.pid);
    assert.equal(existsSync(exitFile(repo.cwd)), false);
    const second = await started(t, repo);
    assert.equal(runRecord(repo.cwd).pid, second.pid);
    assert.deepEqual(ended(await waitFor(repo, ['build-x'])), { name: 'build-x', exit: 0 });
  });

  test('a report or meta file that cannot be opened is exit 4, naming the step, and leaves no run record', async (t) => {
    for (const file of ['r.json', 'm.txt']) {
      const repo = delegateRepo(t, { user: CLI });
      mkdirSync(join(repo.cwd, file));
      const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
      const result = await repo.run(stepStart());
      notStarted(repo, result, 4);
      assert.match(result.stderr, /^lets delegate: the background step build-x could not start: EISDIR/m, file);
      assert.deepEqual(stand.calls(), [], file);
    }
  });

  test('a step that ended, and cannot start again, leaves no run record, so step wait does not know it', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    await started(t, repo);
    assert.equal(ended(await waitFor(repo, ['build-x'])).exit, 0);
    rmSync(join(repo.cwd, 'r.json'));
    mkdirSync(join(repo.cwd, 'r.json'));
    notStarted(repo, await repo.run(stepStart()), 4);
    const result = await waitFor(repo, ['build-x']);
    assert.equal(result.code, 2, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /build-x/);
  });
});

describe('step wait', () => {
  // The start of a step called name, with report and meta files of its
  // own, on SLOW when it hangs.
  const named = (name: string, hangs = false): StartArgs =>
    ({ name, reportFile: `${name}.r.json`, metaFile: `${name}.m.txt`, ...(hangs ? { models: SLOW } : {}) });
  const metaOf = (repo: DelegateRepo, name: string) => join(repo.cwd, `${name}.m.txt`);

  // Starts the step name, whose stand-in hangs, and stops it once the
  // stand-in has its call: a killed step, gone with no exit file. Then its
  // meta file holds meta, when given.
  async function killed(t: TestContext, repo: DelegateRepo, stand: ReturnType<typeof answersAndHangs>, name: string, meta?: string) {
    const calls = stand.calls().length;
    const { pid } = await started(t, repo, named(name, true));
    await untilCalled(stand, calls + 1);
    stopStep(pid);
    await untilGone(pid);
    if (meta !== undefined) writeFileSync(metaOf(repo, name), meta);
  }

  // Starts the step name, whose stand-in answers, and waits for it to end.
  async function done(t: TestContext, repo: DelegateRepo, name: string) {
    await started(t, repo, named(name));
    assert.deepEqual(ended(await waitFor(repo, [name])), { name, exit: 0 });
  }

  test('of a step that runs and one that answers, step wait names the one that answers', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = answersAndHangs(repo);
    await started(t, repo, named('a', true));
    await untilCalled(stand);
    await started(t, repo, named('b'));
    assert.deepEqual(ended(await waitFor(repo, ['a', 'b'])), { name: 'b', exit: 0 });
  });

  test('a step that has ended is named at once, and its report and meta files stay as they were', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    answersAndHangs(repo);
    await done(t, repo, 'a');
    const files = () => [readFileSync(join(repo.cwd, 'a.r.json'), 'utf8'), readFileSync(metaOf(repo, 'a'), 'utf8')];
    const before = files();
    const begun = performance.now();
    assert.deepEqual(ended(await waitFor(repo, ['a'])), { name: 'a', exit: 0 });
    // step wait looks every 2 seconds, so a run this short did not wait.
    const elapsed = performance.now() - begun;
    assert.ok(elapsed < 2000, `step wait took ${elapsed} ms`);
    assert.deepEqual(files(), before);
  });

  test('of two ended steps, step wait names the one that ended first', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    answersAndHangs(repo);
    await done(t, repo, 'a');
    await done(t, repo, 'b');
    assert.deepEqual(ended(await waitFor(repo, ['b', 'a'])), { name: 'a', exit: 0 });
  });

  test('a killed step is exit 4, once, with a line after the text of its meta file', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = answersAndHangs(repo);
    await killed(t, repo, stand, 'a', 'lets delegate: no answer\n');
    for (const wait of ['first', 'second']) {
      assert.deepEqual(ended(await waitFor(repo, ['a'])), { name: 'a', exit: 4 }, wait);
      assert.equal(readFileSync(metaOf(repo, 'a'), 'utf8'), `lets delegate: no answer\n${KILLED}`, wait);
    }
  });

  test('the killed line goes on a line of its own after a meta file that ends mid-line', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = answersAndHangs(repo);
    await killed(t, repo, stand, 'a', 'lets delegate: half a li');
    assert.equal(ended(await waitFor(repo, ['a'])).exit, 4);
    assert.equal(readFileSync(metaOf(repo, 'a'), 'utf8'), `lets delegate: half a li\n${KILLED}`);
  });

  test('a killed step counts as ended when it is found, after a step that recorded its end', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = answersAndHangs(repo);
    await done(t, repo, 'b');
    await killed(t, repo, stand, 'a');
    assert.deepEqual(ended(await waitFor(repo, ['a', 'b'])), { name: 'b', exit: 0 });
  });

  test('an unknown name, and no name, are exit 2, naming what is wrong', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    answersAndHangs(repo);
    await done(t, repo, 'a');
    const unknown = await waitFor(repo, ['a', 'c-story']);
    assert.equal(unknown.code, 2, unknown.output);
    assert.equal(unknown.stdout, '');
    assert.match(unknown.stderr, /c-story/);
    const none = await waitFor(repo, []);
    assert.equal(none.code, 2, none.output);
    assert.equal(none.stdout, '');
    assert.match(none.stderr, /--name/);
  });

  test('a step that ends before the time limit is named at exit 0, well inside it', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    answersAndHangs(repo);
    await started(t, repo, named('a'));
    const begun = performance.now();
    assert.deepEqual(ended(await waitFor(repo, ['a'], { timeoutMinutes: 1 })), { name: 'a', exit: 0 });
    const elapsed = performance.now() - begun;
    assert.ok(elapsed < 30_000, `step wait took ${elapsed} ms`);
  });

  // A story's <name>-story can be longer than a session name's 32 characters.
  test('two names longer than 32 characters that share their first 32 each start, and are named as they were started', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    answersAndHangs(repo);
    const names = ['openspec-cli-is-the-projects-own-story', 'openspec-cli-is-the-projects-own-other-story'];
    for (const name of names) assert.equal((await started(t, repo, named(name))).name, name);
    for (const name of names) assert.deepEqual(ended(await waitFor(repo, [name])), { name, exit: 0 });
  });
});
