// The helper module for black-box tests of lets: it runs lets/bin/lets as
// a program, in temporary folders, with stand-ins for outside programs on
// PATH. Command-specific fixtures live beside their tests, not here.
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

/** The root of this repository. */
export const repo = fileURLToPath(new URL('../..', import.meta.url));

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

/** One answer of a stand-in, given to the call whose arguments equal `args`. */
export interface StandInRow {
  args: string[];
  stdout?: string;
  stderr?: string;
  /** The exit code. 0 when absent. */
  code?: number;
}

export interface StandIn {
  /** Each call's argument list, in the order the calls came. Empty before the first call. */
  calls(): string[][];
}

/**
 * The environment for one run: `process.env` without `WORKFLOW_RELEASE`,
 * `LETS_SPEC_SKILLS` and `LETS_SPEC_FLOW`, with the locale, git config,
 * author and committer pinned, and `XDG_CONFIG_HOME` set to an empty
 * folder that this process removes when it exits. `extra` is applied
 * last; a key set to `undefined` is removed. Never fails.
 */
export function pinnedEnv(extra?: EnvChanges): NodeJS.ProcessEnv {
  throw new Error('not built yet');
}

/**
 * Runs `lets/bin/lets <args>` with this Node, in `options.cwd`, with the
 * pinned environment, `options.standIns` first on `PATH` and `options.env`
 * on top. Resolves with the exit code and both streams whatever the exit
 * code. Rejects when lets cannot be started, or when the run passes its
 * time limit; the message then names the command and the folder.
 */
export function runLets(args: string[], options: RunLetsOptions): Promise<LetsResult> {
  throw new Error('not built yet');
}

/**
 * Makes an empty temporary folder and returns its real path. With `t`,
 * the folder is removed after that test; without, when this process
 * exits, which is after the test file. Removal makes the tree writable
 * first, so a read-only release inside it is removed too.
 */
export function tempDir(t?: TestContext): string {
  throw new Error('not built yet');
}

/**
 * Runs git in `cwd` with the pinned environment. Returns the exit code and
 * both streams, and never throws on a non-zero exit, so a test can check
 * one such as `git check-ignore`'s. Throws only when git cannot be started.
 */
export function git(cwd: string, ...args: string[]): RunResult {
  throw new Error('not built yet');
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
  throw new Error('not built yet');
}

/**
 * Writes an executable program called `name` into `dir`, which must
 * exist. Each call logs its arguments, then answers from the first row of
 * `table` whose `args` equals the call's argument list. A call that
 * matches no row exits 127 and says so on standard error. Throws when
 * `dir` cannot be written.
 */
export function standIn(dir: string, name: string, table: StandInRow[]): StandIn {
  throw new Error('not built yet');
}

/**
 * Every path under `dir`, sorted, with its type, its mode and a hash of
 * its content or its link target, then the text of `.git/info/exclude`.
 * Git's other files are left out. Two snapshots differ when anything
 * else in `dir` changed. Throws when `dir` cannot be read.
 */
export function snapshot(dir: string): string {
  throw new Error('not built yet');
}
