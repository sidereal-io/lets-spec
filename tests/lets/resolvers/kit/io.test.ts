import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { parentPid, realIo } from '../../../../lets/src/resolvers/kit/io.ts';

test('execFile writes its input to the command\'s stdin', async () => {
  const { stdout, code } = await realIo().execFile('cat', [], { input: 'Say "hi".\nIt\'s fine.' });
  assert.deepEqual([stdout, code], ['Say "hi".\nIt\'s fine.', 0]);
});

test('execFile stops a command that runs past its timeout, and says it timed out', async () => {
  const started = Date.now();
  const result = await realIo().execFile('sleep', ['30'], { timeoutMs: 100 });
  assert.equal(result.timedOut, true);
  assert.ok(Date.now() - started < 10000, 'the command was stopped');
});

test('a command that ends in time has not timed out', async () => {
  const result = await realIo().execFile('true', [], { timeoutMs: 10000 });
  assert.deepEqual(result, { stdout: '', stderr: '', code: 0, timedOut: false });
});

test('execFile gives a command\'s output, and its exit code', async () => {
  const result = await realIo().execFile('sh', ['-c', 'echo out; echo err >&2; exit 3']);
  assert.deepEqual(result, { stdout: 'out\n', stderr: 'err\n', code: 3, timedOut: false });
});

test('execFile rejects a command that cannot start', async () => {
  await assert.rejects(realIo().execFile('lets-no-such-command', []), /^Error: cannot run lets-no-such-command: spawn lets-no-such-command ENOENT$/);
});

test('execFile rejects a command whose output passes 64 MiB', async () => {
  await assert.rejects(realIo().execFile('head', ['-c', String(64 * 1024 * 1024 + 1), '/dev/zero']), /^Error: cannot run head: stdout maxBuffer length exceeded$/);
});

// The shell prints its process ID, then its process group's.
const PRINT_GROUP = 'if [ -r /proc/$$/stat ]; then s=$(cat /proc/$$/stat); set -- ${s##*) }; echo "$$ $3"; else echo "$$ $(ps -o pgid= -p $$)"; fi';

test('execFile starts a command in a process group of its own', async () => {
  const { stdout } = await realIo().execFile('sh', ['-c', PRINT_GROUP]);
  const [pid, group] = stdout.trim().split(/\s+/);
  assert.equal(group, pid);
});

// A folder for the process ID files a test's commands write. The test's
// end removes it, and kills every process named in pids or pids.held, so a
// failed test leaves none behind.
function pidsDir(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'lets-io-'));
  const pids = join(dir, 'pids');
  t.after(() => {
    for (const pid of [...readPids(pids), ...readPids(`${pids}.held`)]) try { process.kill(pid, 'SIGKILL'); } catch {}
    rmSync(dir, { recursive: true, force: true });
  });
  return pids;
}

function readPids(file: string): number[] {
  return existsSync(file) ? readFileSync(file, 'utf8').split(/\s+/).filter(Boolean).map(Number) : [];
}

// A process is gone when it no longer exists, or is a zombie: an orphan's
// zombie waits for whatever adopted it to reap it. The node-tests sandbox
// has no ps, so this reads /proc where there is one.
function gone(pid: number): boolean {
  try {
    process.kill(pid, 0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return true;
  }
  let state: string | undefined;
  if (existsSync('/proc/self')) {
    try {
      state = readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1]?.[0];
    } catch {
      return true;
    }
  } else {
    state = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim()[0];
  }
  return state === undefined || state === 'Z';
}

test('after its time limit, execFile stops every process the command started', { timeout: 30000 }, async (t) => {
  const pids = pidsDir(t);
  const script = `sleep 600 & echo $! >> '${pids}'; sleep 600 & echo $! >> '${pids}'; echo $$ >> '${pids}'; wait`;
  const started = Date.now();
  const result = await realIo().execFile('sh', ['-c', script], { timeoutMs: 1000 });
  assert.equal(result.timedOut, true);
  assert.ok(Date.now() - started < 1000 + 10000, 'it returned within 10 seconds of the limit');
  assert.equal(readPids(pids).length, 3);
  assert.deepEqual(readPids(pids).filter((pid) => !gone(pid)), []);
});

test('a group that ignores SIGTERM is stopped 5 seconds after its time limit', { timeout: 30000 }, async (t) => {
  const pids = pidsDir(t);
  // A signal the shell ignores stays ignored in what it starts.
  const script = `trap '' TERM; sleep 600 & echo $! >> '${pids}'; echo $$ >> '${pids}'; wait`;
  const started = Date.now();
  const result = await realIo().execFile('sh', ['-c', script], { timeoutMs: 1000 });
  const waited = Date.now() - started - 1000;
  assert.equal(result.timedOut, true);
  assert.ok(waited >= 5000 && waited < 10000, `it returned ${waited} ms after the limit`);
  assert.equal(readPids(pids).length, 2);
  assert.deepEqual(readPids(pids).filter((pid) => !gone(pid)), []);
});

// Node starts a sleep in a new session, which holds Node's stdout, and
// writes its process ID to the file named in argv[1]. Then Node runs on.
const HOLD_STDOUT = `
  const { spawn } = require('node:child_process');
  const sleep = spawn('sleep', ['600'], { detached: true, stdio: ['ignore', 'inherit', 'ignore'] });
  require('node:fs').writeFileSync(process.argv[1], sleep.pid + '\\n');
  setInterval(() => {}, 1000);
`;

test('a process outside the group that holds stdout does not delay a timed-out execFile', { timeout: 30000 }, async (t) => {
  const pids = pidsDir(t);
  const started = Date.now();
  const result = await realIo().execFile(process.execPath, ['-e', HOLD_STDOUT, pids], { timeoutMs: 1000 });
  assert.equal(result.timedOut, true);
  assert.ok(Date.now() - started < 1000 + 10000, 'it returned within 10 seconds of the limit');
  assert.equal(readPids(pids).length, 1);
});

test('execFile leaves the background child of a command that ends in time running', async (t) => {
  const pids = pidsDir(t);
  const result = await realIo().execFile('sh', ['-c', `sleep 600 > /dev/null 2>&1 & echo $! > '${pids}'`], { timeoutMs: 10000 });
  assert.equal(result.timedOut, false);
  assert.equal(readPids(pids).length, 1);
  assert.equal(gone(readPids(pids)[0]), false);
});

const EXEC_AND_WAIT = join(import.meta.dirname, 'fixtures', 'exec-and-wait.ts');

async function waitFor(check: () => boolean, what: string, ms = 10000) {
  for (const deadline = Date.now() + ms; !check(); await new Promise((resolve) => setTimeout(resolve, 50))) {
    if (Date.now() > deadline) throw new Error(`still waiting for ${what}`);
  }
}

// Starts exec-and-wait with args, waits until its file names count
// processes, then sends it signal. Gives how it ended.
async function signalExecAndWait(t: TestContext, pids: string, args: string[], count: number, signal: NodeJS.Signals) {
  const fixture = spawn(process.execPath, [EXEC_AND_WAIT, pids, ...args], { stdio: 'inherit' });
  t.after(() => { if (fixture.exitCode === null && fixture.signalCode === null) fixture.kill('SIGKILL'); });
  const ended = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => fixture.on('exit', (code, signal) => resolve({ code, signal })));
  await waitFor(() => readPids(pids).length >= count, 'the process IDs');
  fixture.kill(signal);
  return ended;
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test(`a ${signal} to lets reaches the group of a command it runs`, { timeout: 30000 }, async (t) => {
    const pids = pidsDir(t);
    const ended = await signalExecAndWait(t, pids, [], 2, signal);
    assert.deepEqual(ended, { code: null, signal });
    await waitFor(() => readPids(pids).every(gone), 'the shell and its child to end', 2000);
  });
}

test('a signal to lets reaches a group after another command\'s group has ended', { timeout: 30000 }, async (t) => {
  const pids = pidsDir(t);
  const ended = await signalExecAndWait(t, pids, ['ended-group'], 2, 'SIGINT');
  assert.deepEqual(ended, { code: null, signal: 'SIGINT' });
  await waitFor(() => readPids(pids).every(gone), 'the shell and its child to end', 2000);
});

// A fake system for parentPid: files maps a path to its text, and ps is
// what `ps` prints. calls records each command it runs.
function fakeSys({ files = {}, ps = '' }: { files?: Record<string, string>; ps?: string }) {
  const calls: string[][] = [];
  return {
    calls,
    readFileSync(path: string) {
      if (!(path in files)) throw new Error(`ENOENT: ${path}`);
      return files[path];
    },
    existsSync: (path: string) => path in files,
    spawnSync(cmd: string, args: string[]) {
      calls.push([cmd, ...args]);
      return { stdout: ps };
    },
  };
}

test('parentPid reads the PPid from /proc, and runs no ps', () => {
  const sys = fakeSys({ files: { '/proc/self': '', '/proc/42/status': 'Name:\tnode\nPPid:\t7\n' } });
  assert.equal(parentPid(42, sys), 7);
  assert.deepEqual(sys.calls, []);
});

test('with no /proc, parentPid asks ps, and trims what it prints', () => {
  const sys = fakeSys({ ps: '   7\n' });
  assert.equal(parentPid(42, sys), 7);
  assert.deepEqual(sys.calls, [['ps', '-o', 'ppid=', '-p', '42']]);
});

test('with /proc, parentPid gives null for a process that has exited, and runs no ps', () => {
  const sys = fakeSys({ files: { '/proc/self': '' }, ps: '7\n' });
  assert.equal(parentPid(42, sys), null);
  assert.deepEqual(sys.calls, []);
});

test('parentPid gives null when ps prints nothing, or something that is not a number', () => {
  for (const ps of ['', '\n', 'ppid\n', '7 8\n', '-1\n']) assert.equal(parentPid(42, fakeSys({ ps })), null, JSON.stringify(ps));
});

test('realIo finds this process\'s parent', () => {
  assert.equal(realIo().parentPid(process.pid), process.ppid);
});
