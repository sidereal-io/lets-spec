import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
// end removes it, and kills every process named in pids, so a failed test
// leaves none behind.
function pidsDir(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'lets-io-'));
  const pids = join(dir, 'pids');
  t.after(() => {
    for (const pid of readPids(pids)) try { process.kill(pid, 'SIGKILL'); } catch {}
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
