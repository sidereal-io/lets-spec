// Helpers for the black-box tests of lets delegate step run, step start and
// step wait: the arguments each command and each CLI gets, waits on a
// stand-in or a background process, and the check of a value from the real
// clock. Not a *.test.ts file, so the test runner does not run it.
import type { TestContext } from 'node:test';
import type { StandIn } from '../support/lets.ts';

export type Effort = 'low' | 'medium' | 'high';

/** What `stepRun` may change. Each field absent keeps its default. */
export interface StepArgs {
  /** `--for`. `build` when absent. */
  for?: string;
  /** `--name`. `Build X` when absent. */
  name?: string;
  /** `--prompt-file`. `p.md` when absent. */
  promptFile?: string;
  /** `--effort`. `high` when absent. */
  effort?: Effort;
  /** One `--model` for each, in order. `['claude']` when absent. */
  models?: readonly string[];
  /** `--timeout-minutes`. None when absent. */
  timeoutMinutes?: number;
  /** `--answers-file`. None when absent. */
  answersFile?: string;
  /** `--exit-file`. None when absent. */
  exitFile?: string;
}

/** What `stepStart` may change: `stepRun`'s fields but `exitFile`, then its own. */
export interface StartArgs extends Omit<StepArgs, 'exitFile'> {
  /** `--report-file`. `r.json` when absent; `null` leaves the option out. */
  reportFile?: string | null;
  /** `--meta-file`. `m.txt` when absent; `null` leaves the option out. */
  metaFile?: string | null;
  /** `--checkout`. None when absent. */
  checkout?: string;
}

/** What `codexWrite` may change. */
export interface CodexWriteArgs {
  /** `high` when absent. */
  effort?: Effort;
  /** The model after `-m`. No `-m` when absent or null. */
  model?: string | null;
  /** The session name the last-message file is named for. `build-x` when absent. */
  name?: string;
}

/**
 * The arguments of `lets delegate step run`: a build step named Build X,
 * on p.md, at high effort, on claude, unless `over` says otherwise. Never
 * fails.
 */
export function stepRun(over?: StepArgs): string[] {
  throw new Error('not built yet');
}

/**
 * The arguments of `lets delegate step start`: `stepRun`'s, with `start`
 * for `run`, then `--report-file r.json` and `--meta-file m.txt`, and
 * `--checkout` when given, unless `over` says otherwise. Never fails.
 */
export function stepStart(over?: StartArgs): string[] {
  throw new Error('not built yet');
}

/** A final message: a line of prose, then a step-report block holding `yaml`, which must end with a newline. Never fails. */
export function ending(yaml: string): string {
  throw new Error('not built yet');
}

/**
 * The write-mode arguments lets gives codex for a step run in `cwd`, the
 * repository root: no sandbox, the effort, `-m` when a model is given,
 * and the last message in `<cwd>/.workspace/lets-delegate/<name>.last-message.md`.
 * Never fails.
 */
export function codexWrite(cwd: string, over?: CodexWriteArgs): string[] {
  throw new Error('not built yet');
}

/** The write-mode arguments lets gives claude for a step: bypassPermissions, the effort (`high` when absent), and `--model` when given. Never fails. */
export function claudeWrite(effort?: Effort, model?: string): string[] {
  throw new Error('not built yet');
}

/**
 * The write-mode arguments lets gives agy for a step: accept-edits with
 * permissions skipped, the effort, `--model` when given (with the effort
 * already added, such as `gemini-3.8-flash-high`), `--print-timeout`
 * `timeout` (such as `120m`), and `prompt` as the argument of `-p`.
 * Never fails.
 */
export function agyWrite(effort: Effort, timeout: string, prompt: string, model?: string): string[] {
  throw new Error('not built yet');
}

/**
 * Resolves once `stand` has logged at least `count` calls (1 when absent).
 * Rejects after `ms` milliseconds (10 seconds when absent), saying how
 * many calls it saw.
 */
export function untilCalled(stand: StandIn, count?: number, ms?: number): Promise<void> {
  throw new Error('not built yet');
}

/**
 * Resolves once no process has the id `pid`. Rejects after `ms`
 * milliseconds (10 seconds when absent), naming the pid.
 */
export function untilGone(pid: number, ms?: number): Promise<void> {
  throw new Error('not built yet');
}

/**
 * Registers a `t.after` that sends SIGTERM to the background step `pid`
 * when it still runs at the end of the test, so a test that fails half-way
 * leaves no process behind. Call it as soon as `step start` prints the pid.
 * Never fails, and the hook never fails either.
 */
export function cleanUpStep(t: TestContext, pid: number): void {
  throw new Error('not built yet');
}

/**
 * Sends SIGTERM to the background step `pid` now. lets passes it on to the
 * CLI, then ends by the signal with no exit file: a killed step. Follow it
 * with `untilGone(pid)`. Throws when no process has the id `pid`.
 */
export function stopStep(pid: number): void {
  throw new Error('not built yet');
}

/**
 * Checks a value from lets's real clock, taken between `before` and
 * `after` (both `Date.now()`): a string must be an ISO 8601 UTC date to
 * the second, no earlier than `before` rounded down to the second and no
 * later than `after`; a number must be whole milliseconds between
 * `before` and `after`. Throws an assertion error that names the value
 * when it does not hold.
 */
export function assertClock(value: string | number, before: number, after: number): void {
  throw new Error('not built yet');
}
