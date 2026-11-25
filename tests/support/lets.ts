// The helper module for black-box tests of lets: it runs lets/bin/lets as
// a program, in temporary folders, with stand-ins for outside programs on
// PATH. Command-specific fixtures live beside their tests, not here.
import { execFile, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { accessSync, chmodSync, constants, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The root of this repository. */
export const repo = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const ENTRY = join(repo, 'lets', 'bin', 'lets');
const DEFAULT_TIMEOUT_MS = 30_000;
// How long a hanging stand-in waits before it ends by itself.
const HANG_MS = 60_000;

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
  /**
   * When true, `PATH` is `standIns`, when given, then a folder that holds
   * only a link named `git` to the `git` on this process's `PATH`, so no
   * real `codex`, `claude` or `agy` is found. The run rejects, and says
   * so, when this process has no `git` on its `PATH`.
   */
  onlyStandIns?: boolean;
}

/** One answer of a stand-in, given to the call whose arguments equal `args`. */
export interface StandInRow {
  args: string[];
  stdout?: string;
  stderr?: string;
  /** The exit code. 0 when absent. */
  code?: number;
  /**
   * When true, the call is logged, then never answered: the program
   * prints nothing and waits, until a signal ends it or, at the latest,
   * 60 seconds pass, so a stand-in that nothing stops is soon gone.
   */
  hang?: boolean;
}

export interface StandInOptions {
  /**
   * The variables each call logs, by name. A stand-in logs no others, so
   * no token from the developer's environment is written to disk.
   */
  logEnv?: string[];
}

export interface StandIn {
  /** Each call's argument list, in the order the calls came. Empty before the first call. */
  calls(): string[][];
  /**
   * For each call, in order, the value of each variable named in
   * `logEnv`, or `undefined` when it was not set. Each record is empty
   * when no `logEnv` was given.
   */
  envs(): Record<string, string | undefined>[];
}

/** One model in what `codex debug models` prints. `lets` shows only `list`. */
export interface CodexModel {
  slug: string;
  visibility: 'list' | 'hide';
}

/**
 * How a model listing fails:
 * - `signed-out`: exits 1 with `not logged in` on stderr;
 * - `unreadable`: exits 0 and prints `not json`;
 * - `cannot-start`: the program is on `PATH`, but its `#!` line names an
 *   interpreter that does not exist, so starting it fails with `ENOENT`;
 * - `hangs`: logs the call and waits, as a `hang` row does.
 */
export type ListingFailure = 'signed-out' | 'unreadable' | 'cannot-start' | 'hangs';

/** Options for `codex`, `agy` and `claude`, passed on to `standIn`. */
export type FamilyOptions = StandInOptions;

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
 * on top. With `options.onlyStandIns`, `PATH` holds only the stand-ins and
 * `git`. Resolves with the exit code and both streams whatever the exit
 * code. Rejects when lets cannot be started, or when the run passes its
 * time limit; the message then names the command and the folder. Also
 * rejects, before running, when `onlyStandIns` is set and this process
 * has no `git` on its `PATH`.
 */
export function runLets(args: string[], options: RunLetsOptions): Promise<LetsResult> {
  const command = `lets ${args.join(' ')}`;
  const env = pinnedEnv();
  if (options.onlyStandIns) {
    const gitDir = gitOnlyDir();
    if (gitDir === null) return Promise.reject(new Error(`${command} in ${options.cwd} needs git on PATH, and this process has none: ${process.env.PATH ?? '(PATH unset)'}`));
    env.PATH = options.standIns === undefined ? gitDir : `${options.standIns}${delimiter}${gitDir}`;
  } else if (options.standIns !== undefined) {
    // An empty PATH entry means the current folder, so add none.
    env.PATH = env.PATH ? `${options.standIns}${delimiter}${env.PATH}` : options.standIns;
  }
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
 * Writes an executable program called `name` into `dir`, which must
 * exist. Each call logs its arguments, then answers from the first row of
 * `table` whose `args` equals the call's argument list. A call that
 * matches no row exits 127 and says so on standard error. Each call also
 * logs the variables `options.logEnv` names, and no others. Throws when
 * `dir` cannot be written.
 */
export function standIn(dir: string, name: string, table: StandInRow[], options?: StandInOptions): StandIn {
  const logEnv = options?.logEnv ?? [];
  // The program runs in another folder, so the paths it holds are absolute.
  dir = resolve(dir);
  const tableFile = join(dir, `.${name}.table.json`);
  const log = join(dir, `.${name}.log`);
  writeFileSync(tableFile, JSON.stringify(table));
  // A stand-in that replaces another starts with no calls.
  rmSync(log, { force: true });
  const program = join(dir, name);
  // A Node script, so the table needs no matching code in shell. It names
  // this Node, because the Nix sandbox may have no /usr/bin/env.
  writeFileSync(program, `#!${process.execPath}
const fs = process.getBuiltinModule('node:fs');
const args = process.argv.slice(2);
const env = {};
for (const name of ${JSON.stringify(logEnv)}) if (process.env[name] !== undefined) env[name] = process.env[name];
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, env }) + '\\n');
const row = JSON.parse(fs.readFileSync(${JSON.stringify(tableFile)}, 'utf8'))
  .find((row) => row.args.length === args.length && row.args.every((arg, i) => arg === args[i]));
if (row === undefined) {
  process.stderr.write(${JSON.stringify(name)} + ': stand-in has no answer for ' + JSON.stringify(args) + '\\n');
  process.exitCode = 127;
} else if (row.hang) {
  // Ends at a signal, as Node does by default, or by itself.
  setTimeout(() => {}, ${HANG_MS});
} else {
  if (row.stdout) process.stdout.write(row.stdout);
  if (row.stderr) process.stderr.write(row.stderr);
  process.exitCode = row.code ?? 0;
}
`);
  chmodSync(program, 0o755);
  const entries = (): { args: string[]; env: Record<string, string> }[] => existsSync(log)
    ? readFileSync(log, 'utf8').split('\n').filter((line) => line !== '').map((line) => JSON.parse(line))
    : [];
  return {
    calls: () => entries().map(({ args }) => args),
    envs: () => entries().map(({ env }) => Object.fromEntries(logEnv.map((key) => [key, env[key]]))),
  };
}

/**
 * Writes a stand-in `codex` into `dir`, which must exist. It answers
 * `codex debug models` with `{"models":[{"slug","visibility"}…]}`, in the
 * order of `listing`, or fails as the `ListingFailure` says. The default
 * listing is empty. It answers no other call. Throws when `dir` cannot be
 * written.
 */
export function codex(dir: string, listing: CodexModel[] | ListingFailure = [], options?: FamilyOptions): StandIn {
  const answer = typeof listing === 'string' ? listing : { stdout: JSON.stringify({ models: listing.map(({ slug, visibility }) => ({ slug, visibility })) }) };
  return harnessCli(dir, 'codex', ['debug', 'models'], answer, options);
}

/**
 * Writes a stand-in `agy` into `dir`, which must exist. It answers
 * `agy models` with the line `Fetching available models...`, then one
 * line per id of `listing`, `<id>\t<label>`, or fails as the
 * `ListingFailure` says. The default listing is empty. It answers no
 * other call. `lets` reads only the lines that start `gemini-`, so an
 * `unreadable` listing gives no gemini model and no warning. Throws when
 * `dir` cannot be written.
 */
export function agy(dir: string, listing: string[] | ListingFailure = [], options?: FamilyOptions): StandIn {
  const answer = typeof listing === 'string' ? listing : { stdout: `Fetching available models...\n${listing.map((id) => `${id}\t${id.toUpperCase()}\n`).join('')}` };
  return harnessCli(dir, 'agy', ['models'], answer, options);
}

/**
 * Writes a stand-in `claude` into `dir`, which must exist. `claude` has
 * no model listing, so it answers no call. Throws when `dir` cannot be
 * written.
 */
export function claude(dir: string, options?: FamilyOptions): StandIn {
  return standIn(dir, 'claude', [], options);
}

// What a failing listing answers, by how it fails. cannot-start has no row:
// its program never runs.
const FAILURES: Record<Exclude<ListingFailure, 'cannot-start'>, Omit<StandInRow, 'args'>> = {
  'signed-out': { stderr: 'not logged in\n', code: 1 },
  unreadable: { stdout: 'not json' },
  hangs: { hang: true },
};

// A stand-in harness CLI called name, whose model listing is the call args,
// answered as answer says.
function harnessCli(dir: string, name: string, args: string[], answer: Omit<StandInRow, 'args'> | ListingFailure, options?: FamilyOptions): StandIn {
  if (answer === 'cannot-start') return unstartable(dir, name);
  return standIn(dir, name, [{ args, ...(typeof answer === 'string' ? FAILURES[answer] : answer) }], options);
}

// A program called name in dir that the system cannot start, because the
// interpreter its #! line names does not exist. It never runs, so it logs
// no call.
function unstartable(dir: string, name: string): StandIn {
  dir = resolve(dir);
  rmSync(join(dir, `.${name}.log`), { force: true });
  const program = join(dir, name);
  writeFileSync(program, `#!${join(dir, '.no-such-interpreter')}\n`);
  chmodSync(program, 0o755);
  return { calls: () => [], envs: () => [] };
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

let gitOnly: string | null | undefined;

// A folder that holds only a link named git to the git on this process's
// PATH, made once per process, or null when there is no git.
function gitOnlyDir(): string | null {
  if (gitOnly !== undefined) return gitOnly;
  const found = (process.env.PATH ?? '').split(delimiter).filter((dir) => dir !== '').map((dir) => resolve(dir, 'git')).find((path) => {
    try {
      accessSync(path, constants.X_OK);
      // A folder named git is executable too, but it is not the program.
      return statSync(path).isFile();
    } catch {
      return false;
    }
  });
  if (found === undefined) return (gitOnly = null);
  const dir = tempDir();
  symlinkSync(found, join(dir, 'git'));
  return (gitOnly = dir);
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
