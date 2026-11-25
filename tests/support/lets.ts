// The helper module for black-box tests of lets: it runs lets/bin/lets as
// a program, in temporary folders, with stand-ins for outside programs on
// PATH. Command-specific fixtures live beside their tests, not here.
import { execFile, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The root of this repository. */
export const repo = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const ENTRY = join(repo, 'lets', 'bin', 'lets');
const DEFAULT_TIMEOUT_MS = 30_000;

/** What one run of a program left behind. */
export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** What one run of lets left behind. `output` is `stdout` followed by `stderr`. */
export interface LetsResult extends RunResult {
  output: string;
}

/** Variables to add to the pinned environment. `undefined` removes one. */
export type EnvChanges = Record<string, string | undefined>;

export interface RunLetsOptions {
  /** The folder lets runs in. Tests never call `process.chdir`. */
  cwd: string;
  /** Applied last, on top of the pinned environment. */
  env?: EnvChanges;
  /** The folder `standIn` wrote to. It goes first on `PATH`. */
  standIns?: string;
  /** How long the run may take. 30 seconds when absent. */
  timeoutMs?: number;
}

/** What a stand-in prints and how it exits. */
export interface StandInReply {
  stdout?: string;
  stderr?: string;
  /** The exit code. 0 when absent. */
  code?: number;
}

/** A function a module exports, which answers a call in place of a row's fixed reply. */
export interface StandInAnswerer {
  /** The module's absolute path or file URL. The stand-in imports it for each call it answers. */
  module: string;
  /** The name of the exported function, a `StandInAnswer`. */
  name: string;
  /** A JSON value, passed to the function as `data`. */
  data?: unknown;
}

/**
 * The shape of the function a `StandInAnswerer` names. It gets the call's
 * arguments, the state earlier calls left and the row's `data`, and returns
 * the reply. It may change `state` in place; the stand-in saves it once the
 * function returns, and no other call reads or writes the state meanwhile.
 * When it throws, the stand-in exits 127, saves nothing and says why on
 * standard error.
 */
export type StandInAnswer = (call: { args: string[]; state: any; data: unknown }) => StandInReply | Promise<StandInReply>;

/**
 * One answer of a stand-in, given to the call whose arguments equal `args`,
 * or, with `prefix`, start with `args`.
 */
export interface StandInRow extends StandInReply {
  args: string[];
  /**
   * Match a call whose argument list starts with `args`, element by
   * element, so `['issue', 'view', '136']` never matches issue 1360. An
   * exact match when absent.
   */
  prefix?: boolean;
  /** Answer through this function, in place of `stdout`, `stderr` and `code`. */
  answer?: StandInAnswerer;
}

/** State in one folder, for stand-ins to share. */
export interface SharedState {
  /** The folder that holds `state.json`. */
  dir: string;
  /** The state as the stand-ins left it. Throws when `state.json` cannot be read. */
  read(): any;
}

export interface StandInOptions {
  /** The state this stand-in shares with others. Its own, in its folder, when absent. */
  shared?: SharedState;
}

export interface StandIn {
  /** Each call's argument list, in the order the calls came. Empty before the first call. */
  calls(): string[][];
}

/**
 * The environment for one run: `process.env` without `WORKFLOW_RELEASE`,
 * `LETS_SPEC_SKILLS` and `LETS_SPEC_FLOW`, with the locale, git config,
 * author and committer pinned, and `XDG_CONFIG_HOME` set to a new empty
 * folder, so no run sees config another run wrote. This process removes
 * the folder when it exits. `extra` is applied last; a key set to
 * `undefined` is removed. Never fails.
 */
export function pinnedEnv(extra?: EnvChanges): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.WORKFLOW_RELEASE;
  delete env.LETS_SPEC_SKILLS;
  delete env.LETS_SPEC_FLOW;
  Object.assign(env, {
    LC_ALL: 'C',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
    XDG_CONFIG_HOME: tempDir(),
  });
  return applyEnv(env, extra);
}

/**
 * Runs `lets/bin/lets <args>` with this Node, in `options.cwd`, with the
 * pinned environment, `options.standIns` first on `PATH` and `options.env`
 * on top. Resolves with the exit code and both streams whatever the exit
 * code. Rejects when lets cannot be started, or when the run passes its
 * time limit; the message then names the command and the folder.
 */
export function runLets(args: string[], options: RunLetsOptions): Promise<LetsResult> {
  const command = `lets ${args.join(' ')}`;
  const env = pinnedEnv();
  // An empty PATH entry means the current folder, so add none.
  if (options.standIns !== undefined) env.PATH = env.PATH ? `${options.standIns}${delimiter}${env.PATH}` : options.standIns;
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return new Promise((done, fail) => {
    execFile(
      process.execPath,
      [ENTRY, ...args],
      { cwd: options.cwd, env: applyEnv(env, options.env), timeout, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error?.killed) {
          fail(new Error(`${command} in ${options.cwd} passed its time limit of ${timeout} ms`));
        } else if (error && typeof error.code !== 'number') {
          fail(new Error(`${command} in ${options.cwd} could not run: ${error.message}`));
        } else {
          const code = error ? (error.code as number) : 0;
          done({ code, stdout, stderr, output: stdout + stderr });
        }
      },
    );
  });
}

/**
 * Makes an empty temporary folder and returns its real path. With `t`,
 * the folder is removed after that test; without, when this process
 * exits, which is after the test file. Removal makes the tree writable
 * first, so a read-only release inside it is removed too.
 */
export function tempDir(t?: TestContext): string {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'lets-test-'));
  if (t) t.after(() => removeTree(dir));
  else removeAtExit(dir);
  return dir;
}

/**
 * Runs git in `cwd` with the pinned environment. Returns the exit code and
 * both streams, and never throws on a non-zero exit, so a test can check
 * one such as `git check-ignore`'s. Throws only when git cannot be started.
 */
export function git(cwd: string, ...args: string[]): RunResult {
  const result = spawnSync('git', args, { cwd, env: pinnedEnv(), encoding: 'utf8' });
  if (result.error) throw result.error;
  return { code: result.status ?? 1, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Builds a release of this repository into `out` with
 * `build/build-release.mjs`, as the flake does. `schemas` must not be
 * empty; the first is the default. `skills` are names of folders in
 * `skills/`. A folder at `<out>.generated` stands in for the generated
 * `openspec-*` skills. `out` must not exist yet. Throws, with the build's
 * output, when the build fails.
 */
export function buildRelease(out: string, schemas: string[], skills: string[]): void {
  const generated = `${out}.generated`;
  mkdirSync(join(generated, 'openspec-propose'), { recursive: true });
  writeFileSync(join(generated, 'openspec-propose', 'SKILL.md'), 'generated\n');
  const result = spawnSync(
    process.execPath,
    [join(repo, 'build', 'build-release.mjs'), repo, generated, out, schemas.join(','), ...skills],
    { env: pinnedEnv(), encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`build-release.mjs failed for ${out}, exit ${result.status}:\n${result.stdout}${result.stderr}`);
  }
}

/**
 * Makes the folder `dir`, if it is missing, with `initial` as the state,
 * `{}` when absent, in place of any state it held. Throws when `dir`
 * cannot be written.
 */
export function sharedState(dir: string, initial: unknown = {}): SharedState {
  dir = resolve(dir);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'state.json');
  writeFileSync(file, JSON.stringify(initial));
  return {
    dir,
    read: () => JSON.parse(readFileSync(file, 'utf8')),
  };
}

/**
 * Writes an executable program called `name` into `dir`, which must
 * exist. Each call logs its arguments, then answers from the first row of
 * `table` that matches the call's argument list: one whose `args` equals
 * it, or, for a row with `prefix`, starts it. A prefix row shadows every
 * row after it that it matches, so put it after the more specific rows. A
 * call that matches no row exits 127 and says so on standard error.
 *
 * A row with `answer` answers through that function, from the state in
 * `options.shared`, or in a folder of the stand-in's own, which starts as
 * `{}`. The call holds a lock, a folder in the state's folder, while it
 * reads the state, runs the function and saves the state, so calls of
 * several stand-ins never write it at once. A call that finds the lock
 * taken for 10 seconds exits 127 and says so on standard error. A row
 * without `answer` never reads the state. Throws when `dir` cannot be
 * written.
 */
export function standIn(dir: string, name: string, table: StandInRow[], options: StandInOptions = {}): StandIn {
  // The program runs in another folder, so the paths it holds are absolute.
  dir = resolve(dir);
  const tableFile = join(dir, `.${name}.table.json`);
  const log = join(dir, `.${name}.log`);
  writeFileSync(tableFile, JSON.stringify(table));
  // A stand-in that replaces another starts with no calls, and with new
  // state when the state is its own.
  rmSync(log, { force: true });
  const shared = options.shared ?? sharedState(join(dir, `.${name}.state`));
  const program = join(dir, name);
  // A Node script, so the table needs no matching code in shell. It names
  // this Node, because the Nix sandbox may have no /usr/bin/env.
  writeFileSync(program, `#!${process.execPath}
const fs = process.getBuiltinModule('node:fs');
const path = process.getBuiltinModule('node:path');
const { pathToFileURL } = process.getBuiltinModule('node:url');
const name = ${JSON.stringify(name)};
const shared = ${JSON.stringify(shared.dir)};
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
const row = JSON.parse(fs.readFileSync(${JSON.stringify(tableFile)}, 'utf8'))
  .find((row) => (row.prefix ? row.args.length <= args.length : row.args.length === args.length)
    && row.args.every((arg, i) => arg === args[i]));

// A synchronous sleep, so a waiting call needs no timers.
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const giveUp = (message) => {
  process.stderr.write(name + ': stand-in ' + message + '\\n');
  process.exitCode = 127;
};

const reply = (answer) => {
  if (answer.stdout) process.stdout.write(answer.stdout);
  if (answer.stderr) process.stderr.write(answer.stderr);
  process.exitCode = answer.code ?? 0;
};

// mkdir fails when the folder exists, so only one call holds the lock.
function lock(dir) {
  const deadline = Date.now() + 10000;
  for (;;) {
    try {
      fs.mkdirSync(dir);
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        giveUp('could not take the lock ' + dir + ' for ' + JSON.stringify(args) + ': ' + error.message);
        return false;
      }
      if (Date.now() > deadline) {
        giveUp('found the lock ' + dir + ' still taken after 10 seconds, for ' + JSON.stringify(args));
        return false;
      }
      sleep(10);
    }
  }
}

async function answer({ module, name: exported, data }) {
  const held = path.join(shared, 'lock');
  if (!lock(held)) return;
  let result;
  try {
    const file = path.join(shared, 'state.json');
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    const found = await import(module.startsWith('file:') ? module : pathToFileURL(module).href);
    result = await found[exported]({ args, state, data });
    fs.writeFileSync(file + '.new', JSON.stringify(state));
    fs.renameSync(file + '.new', file);
  } catch (error) {
    return giveUp('could not answer ' + JSON.stringify(args) + ' through ' + exported + ' in ' + module + ': ' + (error?.stack ?? error));
  } finally {
    fs.rmSync(held, { recursive: true, force: true });
  }
  reply(result);
}

if (row === undefined) giveUp('has no answer for ' + JSON.stringify(args));
else if (row.answer !== undefined) answer(row.answer);
else reply(row);
`);
  chmodSync(program, 0o755);
  return {
    calls: () => existsSync(log)
      ? readFileSync(log, 'utf8').split('\n').filter((line) => line !== '').map((line) => JSON.parse(line) as string[])
      : [],
  };
}

/**
 * Every path under `dir`, sorted, with its type, its mode and a hash of
 * its content or its link target, then the text of `.git/info/exclude`.
 * Git's other files are left out. Two snapshots differ when anything
 * else in `dir` changed. Throws when `dir` cannot be read.
 */
export function snapshot(dir: string): string {
  const lines: string[] = [];
  for (const path of walk(dir, '.').sort()) {
    const full = join(dir, path);
    const stat = lstatSync(full);
    const mode = (stat.mode & 0o7777).toString(8);
    if (stat.isSymbolicLink()) lines.push(`${path} -> ${readlinkSync(full)}`);
    else if (stat.isFile()) lines.push(`${path} ${mode} ${createHash('sha256').update(readFileSync(full)).digest('hex')}`);
    else lines.push(`${path}/ ${mode}`);
  }
  const exclude = join(dir, '.git', 'info', 'exclude');
  if (existsSync(exclude)) lines.push(readFileSync(exclude, 'utf8'));
  return lines.join('\n');
}

// Each path under dir, from rel, as find prints it: the folder itself, then
// everything inside, without .git.
function walk(dir: string, rel: string): string[] {
  const paths = [rel];
  const full = join(dir, rel);
  if (!lstatSync(full).isDirectory()) return paths;
  for (const entry of readdirSync(full)) {
    if (rel === '.' && entry === '.git') continue;
    paths.push(...walk(dir, `${rel}/${entry}`));
  }
  return paths;
}

function applyEnv(env: NodeJS.ProcessEnv, changes: EnvChanges | undefined): NodeJS.ProcessEnv {
  for (const [key, value] of Object.entries(changes ?? {})) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return env;
}

const atExit: string[] = [];

function removeAtExit(dir: string) {
  if (atExit.length === 0) process.on('exit', () => atExit.forEach(removeTree));
  atExit.push(dir);
}

// A test release is read-only, as in the Nix store, so make the tree
// writable before removing it.
function removeTree(dir: string) {
  if (!existsSync(dir)) return;
  makeWritable(dir);
  rmSync(dir, { recursive: true, force: true });
}

function makeWritable(path: string) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  chmodSync(path, stat.mode | 0o200);
  if (stat.isDirectory()) for (const entry of readdirSync(path)) makeWritable(join(path, entry));
}
