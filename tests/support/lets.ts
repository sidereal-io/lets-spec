// The helper module for black-box tests: it runs lets/bin/lets and other
// programs, in temporary folders, with stand-ins for outside programs on
// PATH. Command-specific fixtures live beside their tests, not here.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { accessSync, chmodSync, constants, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
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

/** What one run of a program left behind. `output` is `stdout` followed by `stderr`. */
export interface ProgramResult extends RunResult {
  output: string;
}

/** What one run of lets left behind. */
export type LetsResult = ProgramResult;

/** Variables to add to the pinned environment. `undefined` removes one. */
export type EnvChanges = Record<string, string | undefined>;

export interface RunOptions {
  /** The folder the program runs in. Tests never call `process.chdir`. */
  cwd: string;
  /** Applied last, on top of the pinned environment. */
  env?: EnvChanges;
  /** How long the run may take. 30 seconds when absent. */
  timeoutMs?: number;
}

/** What `letsPackage` puts beside the copied package, where lets looks for it. */
export interface LetsPackageOptions {
  /** The text of `release.json`. No file when absent. A string, so a test can write one that is not JSON. */
  releaseJson?: string;
  /** Each flow's release folder, by flow name, linked as `releases/<flow>`. */
  releases?: Record<string, string>;
}

export interface RunLetsOptions extends RunOptions {
  /** The folder `standIn` wrote to. It goes first on `PATH`. */
  standIns?: string;
  /** The folder of the lets package whose `bin/lets` runs, such as one `letsPackage` made. `<repo>/lets` when absent. */
  lets?: string;
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
  /**
   * Hold the call at the gate of this name, a plain file name, until the
   * test opens it with `SharedState.open`. The call waits before it takes
   * the state's lock, so a held call never holds up another. It gives up,
   * exiting 127, after 20 seconds or when the shared folder is gone.
   */
  gate?: string;
}

/** State and gates in one folder, for stand-ins to share. */
export interface SharedState {
  /** The folder that holds `state.json` and the gates. */
  dir: string;
  /** The state as the stand-ins left it. Throws when `state.json` cannot be read. */
  read(): any;
  /**
   * Resolves once `count` calls have come to `gate`, held or let through.
   * Rejects after 10 seconds, naming the gate and how many calls came.
   */
  waiting(gate: string, count: number): Promise<void>;
  /** Lets every call at `gate` go on, now and later. */
  open(gate: string): void;
}

export interface StandInOptions {
  /** The state this stand-in shares with others. Its own, in its folder, when absent. */
  shared?: SharedState;
}

export interface StandIn {
  /** Each call's argument list, in the order the calls came. Empty before the first call. */
  calls(): string[][];
  /** The folder each call ran in, in the order the calls came. Empty before the first call. */
  folders(): string[];
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
 * Runs `program` with `args` in `options.cwd`, which must exist, with the
 * pinned environment, `options.env` on top and standard input closed, as
 * `</dev/null` gives. A `program` without a slash is looked up on the
 * `PATH` of that environment. Resolves with the exit code and both
 * streams whatever the exit code. Rejects when the program cannot be
 * started: the message names it, and says it is not on `PATH` when
 * `options.cwd` exists, or that the folder is missing when it does not.
 * Rejects too when the run passes its time limit.
 */
export function run(program: string, args: string[], options: RunOptions): Promise<ProgramResult> {
  const command = [program, ...args].join(' ');
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return new Promise((done, fail) => {
    // 'ignore' opens /dev/null, so a program that reads standard input sees
    // its end at once instead of waiting.
    const child = spawn(program, args, {
      cwd: options.cwd,
      env: applyEnv(pinnedEnv(), options.env),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeout);
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      // Node reports a missing cwd with the same ENOENT as a missing program.
      if (error.code === 'ENOENT' && !existsSync(options.cwd)) {
        fail(new Error(`${command} could not run: the folder ${options.cwd} is missing`));
      } else if (error.code === 'ENOENT') {
        fail(new Error(`${command} could not run in ${options.cwd}: ${program} is not on PATH`));
      } else {
        fail(new Error(`${command} could not run in ${options.cwd}: ${error.message}`));
      }
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (timedOut) fail(new Error(`${command} in ${options.cwd} passed its time limit of ${timeout} ms`));
      else if (code === null) fail(new Error(`${command} in ${options.cwd} was ended by ${signal}`));
      else done({ code, stdout, stderr, output: stdout + stderr });
    });
  });
}

/** One command of lets, as its `--help` lists it. */
export interface LetsCommand {
  /** The words after `lets`. Empty for `lets` itself. */
  path: string[];
  /** The names of its subcommands, without commander's built-in `help`. */
  subcommands: string[];
  /** Each option's short and long names, such as `-h` and `--help`. */
  options: string[];
}

/** Every command of lets, keyed by its path joined with spaces; `''` is `lets` itself. */
export type LetsCommandTree = Map<string, LetsCommand>;

/**
 * Runs `lets --help`, then `lets <path> --help` for each command it lists,
 * level by level, the commands of a level in parallel. Leaves out
 * commander's built-in `help [command]`, whose help is the root's again.
 * Rejects when a `--help` run exits other than 0, naming the command.
 */
export async function letsCommandTree(): Promise<LetsCommandTree> {
  const tree: LetsCommandTree = new Map();
  let level: string[][] = [[]];
  while (level.length > 0) {
    const commands = await Promise.all(level.map(readLetsCommand));
    for (const command of commands) tree.set(command.path.join(' '), command);
    level = commands.flatMap((command) => command.subcommands.map((name) => [...command.path, name]));
  }
  return tree;
}

async function readLetsCommand(path: string[]): Promise<LetsCommand> {
  const result = await runLets([...path, '--help'], { cwd: repo });
  if (result.code !== 0) throw new Error(`lets ${[...path, '--help'].join(' ')} exited ${result.code}:\n${result.output}`);
  return {
    path,
    subcommands: helpList(result.stdout, 'Commands:')
      .map((term) => term.split(' ')[0])
      .filter((name) => name !== 'help'),
    options: helpList(result.stdout, 'Options:')
      .flatMap((term) => term.split(', ').map((name) => name.split(' ')[0])),
  };
}

// The terms of one list in commander's help: the lines after the heading,
// up to a blank line, that start with two spaces and then a term. A longer
// indent carries on the description above it.
function helpList(help: string, heading: string): string[] {
  const lines = help.split('\n');
  const start = lines.indexOf(heading);
  if (start === -1) return [];
  const terms: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') break;
    const term = /^ {2}(\S.*?)(?: {2,}|$)/.exec(line);
    if (term) terms.push(term[1]);
  }
  return terms;
}

/**
 * Copies the lets package, `lets/bin`, `lets/src` and `lets/package.json`,
 * into a new temporary folder removed after `t`, with `node_modules`
 * linked to `lets/node_modules`. lets reads `release.json` and
 * `releases/<flow>` beside its package, and the source tree has neither,
 * so a test that needs them runs this copy through `RunLetsOptions.lets`.
 * Writes `release.json` when `options.releaseJson` is set, and links each
 * of `options.releases` as `releases/<flow>`. Returns the copy's folder.
 * Throws when `lets/node_modules` is missing, and says to run pnpm install.
 */
export function letsPackage(t: TestContext, options: LetsPackageOptions = {}): string {
  const source = join(repo, 'lets');
  const modules = join(source, 'node_modules');
  if (!existsSync(modules)) throw new Error(`${modules} is missing, so a copy of lets cannot run: run pnpm install`);
  const dir = join(tempDir(t), 'lets');
  for (const part of ['bin', 'src', 'package.json']) cpSync(join(source, part), join(dir, part), { recursive: true });
  // node_modules holds links into the pnpm store, so link it rather than copy it.
  symlinkSync(modules, join(dir, 'node_modules'));
  if (options.releaseJson !== undefined) writeFileSync(join(dir, 'release.json'), options.releaseJson);
  for (const [flow, release] of Object.entries(options.releases ?? {})) {
    mkdirSync(join(dir, 'releases'), { recursive: true });
    symlinkSync(resolve(release), join(dir, 'releases', flow));
  }
  return dir;
}

/**
 * Makes a new folder, removed after `t`, holding a link to each of
 * `programs` as found on this process's `PATH`. Set `PATH` to the folder
 * to run lets with only those programs, so no OpenSpec CLI is found
 * whatever the machine has installed. Returns the folder. Throws, naming
 * the program, when one is not on `PATH`.
 */
export function pathWith(t: TestContext, programs: string[]): string {
  const dir = tempDir(t);
  const folders = (process.env.PATH ?? '').split(delimiter).filter((folder) => folder !== '');
  for (const name of programs) {
    const found = folders.map((folder) => join(folder, name)).find(isExecutable);
    if (found === undefined) throw new Error(`${name} is not on PATH, so pathWith cannot link it`);
    symlinkSync(resolve(found), join(dir, name));
  }
  return dir;
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Runs `lets/bin/lets <args>`, or `<options.lets>/bin/lets` when that is
 * set, with this Node, through `run`, with `options.standIns` first on
 * `PATH` and `options.env` on top. Resolves and rejects as `run` does;
 * the message then names the command and the folder.
 */
export function runLets(args: string[], options: RunLetsOptions): Promise<LetsResult> {
  const env: EnvChanges = {};
  if (options.standIns !== undefined) {
    // An empty PATH entry means the current folder, so add none.
    const path = process.env.PATH;
    env.PATH = path ? `${options.standIns}${delimiter}${path}` : options.standIns;
  }
  const entry = options.lets === undefined ? ENTRY : join(options.lets, 'bin', 'lets');
  return run(process.execPath, [entry, ...args], { cwd: options.cwd, env: { ...env, ...options.env }, timeoutMs: options.timeoutMs });
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
 * Makes `dir` and its `openspec-propose/SKILL.md`, to stand in for the
 * generated `openspec-*` skills, and returns `dir`. Its parent must
 * exist or be creatable. Throws when `dir` cannot be written.
 */
export function generatedSkills(dir: string): string {
  mkdirSync(join(dir, 'openspec-propose'), { recursive: true });
  writeFileSync(join(dir, 'openspec-propose', 'SKILL.md'), 'generated\n');
  return dir;
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
  const generated = generatedSkills(`${out}.generated`);
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
  // Each call at a gate leaves a file in gates/<gate>/; gates/<gate>.open opens it.
  const gates = join(dir, 'gates');
  // Old gates and an old lock are state too: either would let a call pass a
  // closed gate, or make every answer wait for a lock nobody holds.
  rmSync(gates, { recursive: true, force: true });
  rmSync(join(dir, 'lock'), { recursive: true, force: true });
  writeFileSync(file, JSON.stringify(initial));
  const arrived = (gate: string) => existsSync(join(gates, gate)) ? readdirSync(join(gates, gate)).length : 0;
  return {
    dir,
    read: () => JSON.parse(readFileSync(file, 'utf8')),
    waiting: (gate, count) => new Promise((done, fail) => {
      const deadline = Date.now() + 10_000;
      const check = () => {
        const came = arrived(gate);
        if (came >= count) done();
        else if (Date.now() > deadline) fail(new Error(`${count} calls were to wait at the gate ${gate}, but ${came} came in 10 seconds`));
        else setTimeout(check, 10);
      };
      check();
    }),
    open: (gate) => {
      mkdirSync(gates, { recursive: true });
      writeFileSync(join(gates, `${gate}.open`), '');
    },
  };
}

/**
 * Writes an executable program called `name` into `dir`, which must
 * exist. Each call logs its arguments and the folder it ran in, then
 * answers from the first row of `table` that matches the call's argument
 * list: one whose `args` equals it, or, for a row with `prefix`, starts
 * it. A prefix row shadows every row after it that it matches, so put it
 * after the more specific rows. A call that matches no row exits 127 and
 * says so on standard error.
 *
 * A row with `answer` answers through that function, from the state in
 * `options.shared`, or in a folder of the stand-in's own, which starts as
 * `{}`. The call holds a lock, a folder in the state's folder, while it
 * reads the state, runs the function and saves the state, so calls of
 * several stand-ins never write it at once. A call that finds the lock
 * taken for 10 seconds exits 127 and says so on standard error. A row
 * without `answer` never reads the state. A row with `gate` holds its
 * call first, as `StandInRow.gate` says. Throws when `dir` cannot be
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
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, cwd: process.cwd() }) + '\\n');
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

// Wait until the test opens the gate. False, having said why, when it gives up.
function pass(gate) {
  const gates = path.join(shared, 'gates');
  try {
    fs.mkdirSync(path.join(gates, gate), { recursive: true });
    fs.writeFileSync(path.join(gates, gate, String(process.pid)), '');
  } catch (error) {
    giveUp('could not come to the gate ' + gate + ' for ' + JSON.stringify(args) + ': ' + error.message);
    return false;
  }
  const deadline = Date.now() + 20000;
  while (!fs.existsSync(path.join(gates, gate + '.open'))) {
    if (!fs.existsSync(shared)) {
      giveUp('gave up at the gate ' + gate + ' for ' + JSON.stringify(args) + ': the shared folder ' + shared + ' is gone');
      return false;
    }
    if (Date.now() > deadline) {
      giveUp('gave up at the gate ' + gate + ' for ' + JSON.stringify(args) + ': nobody opened it in 20 seconds');
      return false;
    }
    sleep(10);
  }
  return true;
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
else if (row.gate === undefined || pass(row.gate)) {
  if (row.answer !== undefined) answer(row.answer);
  else reply(row);
}
`);
  chmodSync(program, 0o755);
  const logged = (): { args: string[]; cwd: string }[] => existsSync(log)
    ? readFileSync(log, 'utf8').split('\n').filter((line) => line !== '').map((line) => JSON.parse(line))
    : [];
  return {
    calls: () => logged().map((call) => call.args),
    folders: () => logged().map((call) => call.cwd),
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

/**
 * Every path under `dir`, sorted, with its type and a hash of its content
 * or its link target, without modes, `.git` included. Two trees give equal
 * text exactly when `diff -r` finds them equal, as far as paths, types and
 * contents go. Throws when `dir` cannot be read.
 */
export function tree(dir: string): string {
  const lines: string[] = [];
  for (const path of walk(dir, '.', true).sort()) {
    const full = join(dir, path);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) lines.push(`${path} -> ${readlinkSync(full)}`);
    else if (stat.isFile()) lines.push(`${path} ${createHash('sha256').update(readFileSync(full)).digest('hex')}`);
    else lines.push(`${path}/`);
  }
  return lines.join('\n');
}

/**
 * Takes write permission away from `path` and everything under it, for
 * everyone, as the Nix store does. Links are left alone. Throws when
 * `path` is missing or cannot be changed. `tempDir` still removes a
 * read-only tree.
 */
export function makeReadOnly(path: string): void {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) for (const entry of readdirSync(path)) makeReadOnly(join(path, entry));
  chmodSync(path, stat.mode & ~0o222);
}

// Each path under dir, from rel, as find prints it: the folder itself, then
// everything inside, without the top .git unless withGit.
function walk(dir: string, rel: string, withGit = false): string[] {
  const paths = [rel];
  const full = join(dir, rel);
  if (!lstatSync(full).isDirectory()) return paths;
  for (const entry of readdirSync(full)) {
    if (rel === '.' && entry === '.git' && !withGit) continue;
    paths.push(...walk(dir, `${rel}/${entry}`, withGit));
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
