import assert from 'node:assert/strict';
import { test } from 'node:test';
import { start } from '../../../lets/src/delegate/background.ts';
import type { StartOptions } from '../../../lets/src/delegate/background.ts';
import { commandDeps, PROMPT_FILE } from './fixtures/command-deps.ts';

const WORKTREE = '/repo/.workspace/lets-go/worktrees/fix-x';
const RUNS = '/repo/.workspace/lets-delegate';

const startOptions = (over: Partial<StartOptions> = {}): StartOptions => ({
  for: 'story', name: 'Fix X', promptFile: 'p.md', reportFile: 'r.json', metaFile: 'm.txt', effort: 'high', models: ['gpt/gpt-6-luna'], ...over,
});
// commandDeps whose worktree is a repository root of its own.
const inRepo = (over: Parameters<typeof commandDeps>[0] = {}) => commandDeps({ roots: { [WORKTREE]: WORKTREE }, ...over });
type T = ReturnType<typeof commandDeps>;
const runRecord = (t: T, name: string) => JSON.parse(t.io.files.get(`${RUNS}/${name}.run.json`) ?? 'null');

// step start

test('a story run in a worktree starts at once, and prints its name and pid', async () => {
  const t = inRepo();
  assert.equal(await start(startOptions({ checkout: '.workspace/lets-go/worktrees/fix-x' }), t.deps), 0);
  assert.equal(t.stdout(), '{"name":"fix-x","pid":101}\n');
  assert.equal(t.io.spawns.length, 1);
  assert.equal(t.io.spawns[0].options.cwd, WORKTREE);
});

test('the background process is this lets running step run, with every path absolute, and no option step run lacks', async () => {
  const t = inRepo();
  await start(startOptions({ checkout: '.workspace/lets-go/worktrees/fix-x' }), t.deps);
  const [{ cmd, args, options }] = t.io.spawns;
  assert.equal(cmd, '/node');
  assert.deepEqual(args, [
    '/pkg/bin/lets', 'delegate', 'step', 'run', '--for', 'story', '--name', 'fix-x', '--prompt-file', PROMPT_FILE,
    '--effort', 'high', '--model', 'gpt/gpt-6-luna', '--exit-file', `${RUNS}/fix-x.exit.json`,
  ]);
  for (const flag of ['--checkout', '--report-file', '--meta-file']) assert.ok(!args.includes(flag), flag);
  assert.deepEqual(options, { cwd: WORKTREE, env: t.deps.env, stdoutFile: '/repo/r.json', stderrFile: '/repo/m.txt' });
});

test('every --model, --timeout-minutes and an absolute --answers-file go to step run', async () => {
  const t = inRepo({ files: { [PROMPT_FILE]: 'PROMPT', '/repo/a.yaml': '- question: Which?\n  answer: this\n' } });
  assert.equal(await start(startOptions({ models: ['gpt/gpt-6-luna', 'claude'], timeoutMinutes: 900, answersFile: 'a.yaml' }), t.deps), 0);
  const { args } = t.io.spawns[0];
  assert.deepEqual(args.slice(10), ['--effort', 'high', '--model', 'gpt/gpt-6-luna', '--model', 'claude', '--timeout-minutes', '900', '--answers-file', '/repo/a.yaml', '--exit-file', `${RUNS}/fix-x.exit.json`]);
});

test('without --checkout, the step runs in the root of the working directory', async () => {
  const t = commandDeps();
  await start(startOptions(), t.deps);
  assert.equal(t.io.spawns[0].options.cwd, '/repo');
});

test('paths are read from the working directory, and the run is kept under .workspace/ in its repository root', async () => {
  const t = commandDeps({ roots: { '/repo/sub': '/repo' }, files: { '/repo/sub/p.md': 'PROMPT' } });
  t.deps.cwd = '/repo/sub';
  assert.equal(await start(startOptions(), t.deps), 0);
  const [{ args, options }] = t.io.spawns;
  assert.ok(args.includes('/repo/sub/p.md'), args.join(' '));
  assert.equal(options.stdoutFile, '/repo/sub/r.json');
  assert.equal(options.stderrFile, '/repo/sub/m.txt');
  assert.equal(runRecord(t, 'fix-x').exitFile, `${RUNS}/fix-x.exit.json`);
});

test('the run record names the step, its pid, its checkout and its files', async () => {
  const t = inRepo();
  t.io.clock = 5000;
  await start(startOptions({ checkout: '.workspace/lets-go/worktrees/fix-x' }), t.deps);
  assert.deepEqual(runRecord(t, 'fix-x'), {
    name: 'fix-x', pid: 101, checkout: WORKTREE, reportFile: '/repo/r.json', metaFile: '/repo/m.txt', exitFile: `${RUNS}/fix-x.exit.json`, startedAt: 5000,
  });
});

for (const [missing, flag] of [['reportFile', '--report-file'], ['metaFile', '--meta-file']] as const) {
  test(`a step start with no ${flag} is exit 2, prints nothing on stdout and starts nothing`, async () => {
    const t = commandDeps();
    assert.equal(await start(startOptions({ [missing]: undefined }), t.deps), 2);
    assert.equal(t.stdout(), '');
    assert.match(t.stderr(), new RegExp(flag));
    assert.deepEqual(t.io.spawns, []);
  });
}

test('a prompt file that cannot be read is exit 2, naming it, and starts nothing', async () => {
  const t = commandDeps({ files: {} });
  assert.equal(await start(startOptions({ promptFile: 'gone.md' }), t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /gone\.md/);
  assert.deepEqual(t.io.spawns, []);
});

test('an answers file that cannot be read is exit 2, naming it, and starts nothing', async () => {
  const t = commandDeps();
  assert.equal(await start(startOptions({ answersFile: 'a.yaml' }), t.deps), 2);
  assert.match(t.stderr(), /--answers-file a\.yaml/);
  assert.deepEqual(t.io.spawns, []);
});

test('a bad --model is exit 2, and starts nothing', async () => {
  const t = commandDeps();
  assert.equal(await start(startOptions({ models: ['llama/llama-4'] }), t.deps), 2);
  assert.match(t.stderr(), /llama\/llama-4/);
  assert.deepEqual(t.io.spawns, []);
});

test('a name that still runs is exit 2, naming the step and its pid, and starts no second process', async () => {
  const t = commandDeps();
  await start(startOptions({ name: 'fix-x-story' }), t.deps);
  assert.equal(await start(startOptions({ name: 'fix-x-story' }), t.deps), 2);
  assert.match(t.stderr(), /fix-x-story.*\b101\b/);
  assert.equal(t.io.spawns.length, 1);
  assert.equal(t.stdout(), '{"name":"fix-x-story","pid":101}\n', 'only the first start printed');
});

test('a name that has ended starts again, and the new run replaces the old one', async () => {
  const t = commandDeps({ files: { [PROMPT_FILE]: 'PROMPT', '/repo/a.yaml': '- question: Which?\n  answer: this\n' } });
  await start(startOptions({ name: 'fix-x-story' }), t.deps);
  t.io.files.set(`${RUNS}/fix-x-story.exit.json`, '{"exit":0,"endedAt":1}\n');
  t.io.alive.delete(101);
  assert.equal(await start(startOptions({ name: 'fix-x-story', answersFile: 'a.yaml' }), t.deps), 0);
  assert.equal(t.io.spawns.length, 2);
  assert.ok(t.io.spawns[1].args.includes('/repo/a.yaml'));
  assert.equal(t.io.files.has(`${RUNS}/fix-x-story.exit.json`), false, 'the old exit file is gone');
  assert.equal(runRecord(t, 'fix-x-story').pid, 102);
});

test('a name whose process is gone with no exit file starts again', async () => {
  const t = commandDeps();
  await start(startOptions({ name: 'fix-x-story' }), t.deps);
  t.io.alive.delete(101);
  assert.equal(await start(startOptions({ name: 'fix-x-story' }), t.deps), 0);
  assert.equal(t.io.spawns.length, 2);
});

test('a process that cannot start is exit 4, and leaves no run record', async () => {
  const t = commandDeps();
  t.io.spawnDetached = () => null;
  assert.equal(await start(startOptions(), t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.equal(runRecord(t, 'fix-x'), null);
});
