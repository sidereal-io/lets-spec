import assert from 'node:assert/strict';
import { test } from 'node:test';
import { start, wait } from '../../../lets/src/delegate/background.ts';
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

// step wait

const KILLED = 'lets delegate: the background step ended without an exit code\n';

// commandDeps with the background steps names started, each still running.
async function started(...names: string[]) {
  const t = commandDeps();
  for (const name of names) assert.equal(await start(startOptions({ name }), t.deps), 0, name);
  return t;
}
const pidOf = (t: T, name: string) => runRecord(t, name).pid as number;
// The step name ends with exit code at endedAt, as step run would record it.
const ends = (t: T, name: string, exit: number, endedAt: number) => {
  t.io.files.set(`${RUNS}/${name}.exit.json`, `${JSON.stringify({ exit, endedAt })}\n`);
  t.io.alive.delete(pidOf(t, name));
};
// Only what wait printed, once start has printed its lines.
const waitOutput = (t: T, before: string) => t.stdout().slice(before.length);

test('step wait names the first of two steps to end', async () => {
  const t = await started('a-story', 'b-story');
  const before = t.stdout();
  let sleeps = 0;
  t.io.sleep = async (ms) => {
    assert.equal(ms, 2000);
    t.io.clock += ms;
    if (++sleeps === 3) ends(t, 'b-story', 0, t.io.clock);
  };
  assert.equal(await wait({ names: ['a-story', 'b-story'] }, t.deps), 0);
  assert.equal(waitOutput(t, before), '{"name":"b-story","exit":0}\n');
  assert.equal(sleeps, 3);
});

test('step wait names a step that ended before it started at once', async () => {
  const t = await started('a-story');
  ends(t, 'a-story', 3, 0);
  const before = t.stdout();
  t.io.sleep = async () => assert.fail('no wait for a step that has ended');
  assert.equal(await wait({ names: ['a-story'] }, t.deps), 0);
  assert.equal(waitOutput(t, before), '{"name":"a-story","exit":3}\n');
});

test('of two ended steps, step wait names the one that ended first', async () => {
  const t = await started('a-story', 'b-story');
  ends(t, 'a-story', 0, Date.parse('2026-11-20T10:00:00Z'));
  ends(t, 'b-story', 0, Date.parse('2026-11-20T10:05:00Z'));
  const before = t.stdout();
  assert.equal(await wait({ names: ['b-story', 'a-story'] }, t.deps), 0);
  assert.equal(waitOutput(t, before), '{"name":"a-story","exit":0}\n');
});

test('step wait changes neither the report file nor the meta file of a step with an exit code', async () => {
  const t = await started('a-story');
  t.io.files.set('/repo/r.json', '{"outcome":"done"}\n');
  t.io.files.set('/repo/m.txt', '{"for":"story"}\n');
  ends(t, 'a-story', 0, 1);
  await wait({ names: ['a-story'] }, t.deps);
  assert.equal(t.io.files.get('/repo/r.json'), '{"outcome":"done"}\n');
  assert.equal(t.io.files.get('/repo/m.txt'), '{"for":"story"}\n');
});

test('a step whose process is gone with no exit code is exit 4, with a line at the end of its meta file', async () => {
  const t = await started('a-story');
  t.io.files.set('/repo/m.txt', 'lets delegate: no answer\n');
  t.io.alive.delete(pidOf(t, 'a-story'));
  const before = t.stdout();
  assert.equal(await wait({ names: ['a-story'] }, t.deps), 0);
  assert.equal(waitOutput(t, before), '{"name":"a-story","exit":4}\n');
  assert.equal(t.io.files.get('/repo/m.txt'), `lets delegate: no answer\n${KILLED}`);
});

test('a killed step is reported once: a second wait names it with exit 4 and adds no second line', async () => {
  const t = await started('a-story');
  t.io.alive.delete(pidOf(t, 'a-story'));
  await wait({ names: ['a-story'] }, t.deps);
  const before = t.stdout();
  assert.equal(await wait({ names: ['a-story'] }, t.deps), 0);
  assert.equal(waitOutput(t, before), '{"name":"a-story","exit":4}\n');
  assert.equal(t.io.files.get('/repo/m.txt'), KILLED);
});

test('a killed step counts as ended when it was found, after a step that recorded its end', async () => {
  const t = await started('a-story', 'b-story');
  t.io.clock = 9000;
  t.io.alive.delete(pidOf(t, 'a-story'));
  ends(t, 'b-story', 0, 8000);
  const before = t.stdout();
  await wait({ names: ['a-story', 'b-story'] }, t.deps);
  assert.equal(waitOutput(t, before), '{"name":"b-story","exit":0}\n');
});

test('an unknown name is exit 2, with empty stdout and the name on stderr', async () => {
  const t = await started('a-story');
  const before = t.stdout();
  assert.equal(await wait({ names: ['a-story', 'c-story'] }, t.deps), 2);
  assert.equal(waitOutput(t, before), '');
  assert.match(t.stderr(), /c-story/);
});

test('step wait with no name is exit 2', async () => {
  const t = commandDeps();
  assert.equal(await wait({ names: [] }, t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /--name/);
});

test('a time limit that passes is exit 6 at the deadline, with empty stdout, and the step still runs', async () => {
  const t = await started('a-story');
  const before = t.stdout();
  assert.equal(await wait({ names: ['a-story'], timeoutMinutes: 5 }, t.deps), 6);
  assert.equal(t.io.clock, 5 * 60000);
  assert.equal(waitOutput(t, before), '');
  assert.ok(t.io.alive.has(pidOf(t, 'a-story')));
  assert.equal(t.io.files.has(`${RUNS}/a-story.exit.json`), false);
});

test('a step that ends before the time limit is named, at exit 0', async () => {
  const t = await started('a-story');
  t.io.sleep = async (ms) => {
    t.io.clock += ms;
    if (t.io.clock === 60000) ends(t, 'a-story', 0, t.io.clock);
  };
  assert.equal(await wait({ names: ['a-story'], timeoutMinutes: 5 }, t.deps), 0);
  assert.equal(t.io.clock, 60000);
});

// A story's <name>-story can be longer than a session name's 32 characters.
test('a background step keeps a name longer than 32 characters, so step wait names it as it was started', async () => {
  const long = 'openspec-cli-is-the-projects-own-story';
  const t = await started(long, 'openspec-cli-is-the-projects-own-other-story');
  assert.equal(t.stdout().split('\n')[0], `{"name":"${long}","pid":101}`);
  assert.equal(t.io.spawns[0].args[t.io.spawns[0].args.indexOf('--name') + 1], long);
  ends(t, long, 0, 1);
  const before = t.stdout();
  assert.equal(await wait({ names: [long] }, t.deps), 0);
  assert.equal(waitOutput(t, before), `{"name":"${long}","exit":0}\n`);
});

test('the killed line goes on a line of its own after a meta file that ends mid-line', async () => {
  const t = await started('a-story');
  t.io.files.set('/repo/m.txt', 'lets delegate: half a li');
  t.io.alive.delete(pidOf(t, 'a-story'));
  await wait({ names: ['a-story'] }, t.deps);
  assert.equal(t.io.files.get('/repo/m.txt'), `lets delegate: half a li\n${KILLED}`);
});
