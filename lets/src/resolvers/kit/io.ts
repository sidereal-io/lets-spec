// The real world, as the adapters see it. Tests pass fakes with the same
// fields instead.
import { spawn, spawnSync } from 'node:child_process';
import { accessSync, chmodSync, constants, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Where a resolver writes its working files, relative to the request's
// folder: the repo root, whose .workspace/ git ignores.
export const SCRATCH = '.workspace/lets-delegate';

// How much of each output stream execFile keeps before it gives up.
const MAX_BUFFER = 64 * 1024 * 1024;
// How long a group stopped with SIGTERM has before it gets SIGKILL, how
// long execFile then waits for it to end, and how often it checks.
const KILL_GRACE_MS = 5000;
const KILL_WAIT_MS = 1000;
const GROUP_POLL_MS = 100;

// Sends signal to every process in the group that pid leads. false when
// the group is gone.
function signalGroup(pid: number, signal: NodeJS.Signals | 0): boolean {
  try {
    process.kill(-pid, signal);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
    throw error;
  }
}

// Stops the group that pid leads: SIGTERM, then SIGKILL after
// KILL_GRACE_MS. Calls done once the group is gone, or KILL_WAIT_MS after
// SIGKILL, since a process can take a moment to end.
function stopGroup(pid: number, done: () => void) {
  const started = Date.now();
  let killed: number | undefined;
  if (!signalGroup(pid, 'SIGTERM')) return done();
  const poll = setInterval(() => {
    // Timed from SIGKILL, not from the start: a stalled tick must not skip it.
    if (!signalGroup(pid, 0) || (killed !== undefined && Date.now() - killed >= KILL_WAIT_MS)) {
      clearInterval(poll);
      return done();
    }
    if (killed === undefined && Date.now() - started >= KILL_GRACE_MS) {
      killed = Date.now();
      signalGroup(pid, 'SIGKILL');
    }
  }, GROUP_POLL_MS);
}

// timedOut: the command ran past timeoutMs, and was stopped.
export type ExecResult = { stdout: string; stderr: string; code: number; timedOut?: boolean };
// input goes to the command's stdin. timeoutMs stops the command when it
// runs longer.
export type ExecOptions = { cwd?: string; env?: Record<string, string | undefined>; input?: string; timeoutMs?: number };

// The part of a node:sqlite database the adapters use.
export type Db = Pick<DatabaseSync, 'prepare' | 'close'>;

export type Io = {
  execFile(cmd: string, args: string[], options?: ExecOptions): Promise<ExecResult>;
  commandExists(cmd: string): boolean;
  readFile(path: string): string;
  exists(path: string): boolean;
  writeFile(path: string, text: string, options?: { mode?: number }): void;
  removeFile(path: string): void;
  mkdirp(path: string, options?: { mode?: number }): void;
  homedir(): string;
  pid: number;
  parentPid(pid: number): number | null;
  processAlive(pid: number): boolean;
  openDb(path: string): Db;
  fetch: typeof globalThis.fetch;
  WebSocket: typeof globalThis.WebSocket;
  now(): number;
  sleep(ms: number): Promise<void>;
  env: Record<string, string | undefined>;
};

// The parts of the system parentPid reads. Tests pass a fake.
export type ProcessSys = {
  readFileSync(path: string, encoding: 'utf8'): string;
  existsSync(path: string): boolean;
  spawnSync(cmd: string, args: string[], options: { encoding: 'utf8' }): { stdout?: string | null };
};

// The parent of a process, from /proc where there is one, else from ps, as
// on macOS. null when it cannot be found.
export function parentPid(pid: number, sys: ProcessSys = { readFileSync, existsSync, spawnSync }): number | null {
  let status: string | null;
  try {
    status = sys.readFileSync(`/proc/${pid}/status`, 'utf8');
  } catch {
    status = null;
  }
  const text = status !== null ? status.match(/^PPid:\s+(\d+)$/m)?.[1]
    : sys.existsSync('/proc/self') ? undefined : sys.spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8' }).stdout?.trim();
  return text && /^\d+$/.test(text) ? Number(text) : null;
}

// The groups of the commands execFile runs now. A command in a group of
// its own no longer gets the terminal's Ctrl-C, so while any runs, lets
// passes these signals on to every group, then ends by the signal itself.
const running = new Set<number>();
const FORWARDED: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

function forward(signal: NodeJS.Signals) {
  for (const pid of running) {
    try {
      process.kill(-pid, signal);
    } catch (error) {
      // One group must not keep the signal from the rest. A group can end
      // before its command settles, while a process outside it holds the
      // output open (ESRCH), or hold only processes lets may not signal
      // (EPERM).
      if (!['ESRCH', 'EPERM'].includes((error as NodeJS.ErrnoException).code!)) throw error;
    }
  }
  stopForwarding();
  process.kill(process.pid, signal);
}

function startRunning(pid: number) {
  if (running.size === 0) for (const signal of FORWARDED) process.on(signal, forward);
  running.add(pid);
}

function stopRunning(pid: number) {
  if (running.delete(pid) && running.size === 0) stopForwarding();
}

function stopForwarding() {
  for (const signal of FORWARDED) process.off(signal, forward);
}

export function realIo(): Io {
  return {
    // Resolves on any exit code, and on a timeout. Rejects only when the
    // command cannot start, or its output passes MAX_BUFFER.
    execFile(cmd, args, { cwd, env, input, timeoutMs } = {}) {
      return new Promise((resolve, reject) => {
        let timedOut = false;
        let settled = false;
        let stopping = false;
        let code: number | null = null;
        const output = { stdout: '', stderr: '' };
        // detached: the command leads a process group of its own, which a
        // signal to the group reaches with every process it started.
        const child = spawn(cmd, args, { cwd, env, detached: true });
        // A command that cannot start has no pid, and only gets an error.
        if (child.pid !== undefined) startRunning(child.pid);
        const settle = (finish: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (child.pid !== undefined) stopRunning(child.pid);
          finish();
        };
        // A process outside the group can still hold the pipes, so stop
        // reading them rather than wait for them to close.
        const stop = (finish: () => void) => {
          if (stopping) return;
          stopping = true;
          stopGroup(child.pid!, () => {
            child.stdout.destroy();
            child.stderr.destroy();
            settle(finish);
          });
        };
        for (const name of ['stdout', 'stderr'] as const) {
          child[name].setEncoding('utf8');
          child[name].on('data', (chunk: string) => {
            if (output[name].length > MAX_BUFFER) return;
            output[name] += chunk;
            if (output[name].length > MAX_BUFFER) stop(() => reject(new Error(`cannot run ${cmd}: ${name} maxBuffer length exceeded`)));
          });
        }
        child.on('error', (error) => settle(() => reject(new Error(`cannot run ${cmd}: ${error.message}`))));
        child.on('exit', (exitCode) => { code = exitCode ?? 1; });
        // Once the group is being stopped, only its end settles: the command
        // can close its pipes while a process it started still runs.
        child.on('close', (exitCode) => { if (!stopping) settle(() => resolve({ ...output, code: exitCode ?? 1, timedOut })); });
        // Do not leave the command running, and spending tokens, after we stop waiting.
        const timer = timeoutMs === undefined ? undefined : setTimeout(() => {
          timedOut = true;
          stop(() => resolve({ ...output, code: code ?? 1, timedOut }));
        }, timeoutMs);
        // Close stdin after the input, so a command that reads it does not hang.
        child.stdin.on('error', () => {});
        child.stdin.end(input);
      });
    },

    commandExists(cmd) {
      return (process.env.PATH ?? '').split(delimiter).some((dir) => {
        try {
          accessSync(join(dir, cmd), constants.X_OK);
          return true;
        } catch {
          return false;
        }
      });
    },

    readFile: (path) => readFileSync(path, 'utf8'),
    exists: (path) => existsSync(path),
    writeFile(path, text, { mode } = {}) {
      writeFileSync(path, text, { mode });
      // mode applies only when the file is created, so set it again.
      if (mode !== undefined) chmodSync(path, mode);
    },
    removeFile: (path) => rmSync(path),
    mkdirp(path, { mode } = {}) {
      mkdirSync(path, { recursive: true });
      if (mode !== undefined) chmodSync(path, mode);
    },
    homedir: () => homedir(),

    pid: process.pid,
    parentPid: (pid) => parentPid(pid),
    processAlive(pid) {
      try {
        process.kill(pid, 0);
        return true;
      } catch (error) {
        // EPERM: the process exists but belongs to another user.
        return (error as NodeJS.ErrnoException).code === 'EPERM';
      }
    },

    openDb: (path) => new DatabaseSync(path, { readOnly: true }),
    fetch: globalThis.fetch,
    WebSocket: globalThis.WebSocket,
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    env: process.env,
  };
}
