// A fake of the Io in lets/src/io.ts, for the delegate modules. execFile
// records each call and answers from a queue; files live in a Map.
// spawnDetached records each spawn and gives pids from 101, each alive until
// a test takes it out of alive. sleep moves the clock, which now reads.
//
// options:
//   results:     answers for execFile, in order. Each is an ExecResult, a
//                function (cmd, args, opts) returning one, or a promise of
//                one. When the queue is empty, execFile answers code 0.
//   files:       initial files, { path: text }
//   any Io method replaces the default.
import type { DetachedOptions, ExecOptions, ExecResult, Io } from '../../../../lets/src/io.ts';

type Result = ExecResult | Promise<ExecResult> | ((cmd: string, args: string[], opts: ExecOptions) => ExecResult | Promise<ExecResult>);

export type FakeIo = Io & {
  calls: [string, string[], ExecOptions][];
  files: Map<string, string>;
  dirs: string[];
  removed: string[];
  spawns: { cmd: string; args: string[]; options: DetachedOptions; pid: number }[];
  alive: Set<number>;
  clock: number;
};

type Options = { results?: Result[]; files?: Record<string, string> } & Partial<Io>;

const notInFake = (name: string) => () => {
  throw new Error(`${name} is not in this fake`);
};

export function fakeIo({ results = [], files = {}, ...overrides }: Options = {}): FakeIo {
  const io: FakeIo = {
    calls: [],
    files: new Map(Object.entries(files)),
    dirs: [],
    removed: [],
    spawns: [],
    alive: new Set(),
    clock: 0,

    async execFile(cmd, args, opts = {}) {
      io.calls.push([cmd, args, opts]);
      const next = results.shift() ?? { stdout: '', stderr: '', code: 0 };
      return typeof next === 'function' ? next(cmd, args, opts) : next;
    },
    homedir: () => '/home/u',
    now: () => io.clock,
    spawnDetached(cmd, args, options) {
      const pid = 101 + io.spawns.length;
      io.spawns.push({ cmd, args, options, pid });
      io.alive.add(pid);
      io.files.set(options.stdoutFile, '');
      io.files.set(options.stderrFile, '');
      return pid;
    },
    isAlive: (pid) => io.alive.has(pid),
    async sleep(ms) {
      io.clock += ms;
    },
    letsCommand: () => ['/node', '/pkg/bin/lets'],

    readFile: (path) => io.files.get(path) ?? null,
    readBytes: (path) => (io.files.has(path) ? Buffer.from(io.files.get(path)!) : null),
    writeFile: (path, text) => io.files.set(path, text),
    exists: (path) => io.files.has(path),
    remove(path) {
      io.removed.push(path);
      io.files.delete(path);
    },
    mkdirp: (path) => io.dirs.push(path),
    isSymlink: () => false,
    isDir: (path) => io.dirs.includes(path),
    readlink: () => null,
    symlink: notInFake('symlink'),
    stat: notInFake('stat'),
    chmod: notInFake('chmod'),
    copyFile: notInFake('copyFile'),
    listDirs: () => [],
    listNames: () => [],
    listFiles: () => [],
    ...overrides,
  };
  return io;
}
