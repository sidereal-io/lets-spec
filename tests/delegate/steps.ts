// Helpers for the black-box tests of lets delegate step run, step start and
// step wait: the arguments each command and each CLI gets, waits on a
// stand-in or a background process, and the check of a value from the real
// clock. Not a *.test.ts file, so the test runner does not run it.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import type { TestContext } from 'node:test';
import type { StandIn } from '../support/lets.ts';
import { beforeRemoval } from './repo.ts';

// How long untilCalled and untilGone wait, unless told, and how often they look.
const UNTIL_MS = 10_000;
const POLL_MS = 50;

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
export function stepRun(over: StepArgs = {}): string[] {
  const { for: intent = 'build', name = 'Build X', promptFile = 'p.md', effort = 'high', models = ['claude'], timeoutMinutes, answersFile, exitFile } = over;
  return ['delegate', 'step', 'run', '--for', intent, '--name', name, '--prompt-file', promptFile, '--effort', effort,
    ...models.flatMap((model) => ['--model', model]),
    ...optional('--timeout-minutes', timeoutMinutes === undefined ? undefined : String(timeoutMinutes)),
    ...optional('--answers-file', answersFile), ...optional('--exit-file', exitFile)];
}

/**
 * The arguments of `lets delegate step start`: `stepRun`'s, with `start`
 * for `run`, then `--report-file r.json` and `--meta-file m.txt`, and
 * `--checkout` when given, unless `over` says otherwise. Never fails.
 */
export function stepStart(over: StartArgs = {}): string[] {
  const { reportFile = 'r.json', metaFile = 'm.txt', checkout, ...run } = over;
  const args = stepRun(run);
  args[2] = 'start';
  return [...args, ...optional('--report-file', reportFile ?? undefined), ...optional('--meta-file', metaFile ?? undefined), ...optional('--checkout', checkout)];
}

/** A final message: a line of prose, then a step-report block holding `yaml`, which must end with a newline. Never fails. */
export function ending(yaml: string): string {
  return `Prose.\n\n\`\`\`step-report\n${yaml}\`\`\`\n`;
}

/**
 * The write-mode arguments lets gives codex for a step run in `cwd`, the
 * repository root: no sandbox, the effort, `-m` when a model is given,
 * and the last message in `<cwd>/.workspace/lets-delegate/<name>.last-message.md`.
 * Never fails.
 */
export function codexWrite(cwd: string, over: CodexWriteArgs = {}): string[] {
  const { effort = 'high', model = null, name = 'build-x' } = over;
  return ['exec', '--dangerously-bypass-approvals-and-sandbox', '-c', `model_reasoning_effort="${effort}"`, ...optional('-m', model ?? undefined),
    '-o', join(cwd, '.workspace', 'lets-delegate', `${name}.last-message.md`), '-'];
}

/** The write-mode arguments lets gives claude for a step: bypassPermissions, the effort (`high` when absent), and `--model` when given. Never fails. */
export function claudeWrite(effort: Effort = 'high', model?: string): string[] {
  return ['-p', '--permission-mode', 'bypassPermissions', '--effort', effort, ...optional('--model', model)];
}

/**
 * The write-mode arguments lets gives agy for a step: accept-edits with
 * permissions skipped, the effort, `--model` when given (with the effort
 * already added, such as `gemini-3.8-flash-high`), `--print-timeout`
 * `timeout` (such as `120m`), and `prompt` as the argument of `-p`.
 * Never fails.
 */
export function agyWrite(effort: Effort, timeout: string, prompt: string, model?: string): string[] {
  return ['--mode', 'accept-edits', '--dangerously-skip-permissions', '--effort', effort, ...optional('--model', model), '--print-timeout', timeout, '-p', prompt];
}

/**
 * Resolves once `stand` has logged at least `count` calls (1 when absent).
 * Rejects after `ms` milliseconds (10 seconds when absent), saying how
 * many calls it saw.
 */
export function untilCalled(stand: StandIn, count = 1, ms = UNTIL_MS): Promise<void> {
  return until(() => stand.calls().length >= count, ms, () => `the stand-in logged ${stand.calls().length} of ${count} calls in ${ms} ms`);
}

/**
 * Resolves once no process has the id `pid`. Rejects after `ms`
 * milliseconds (10 seconds when absent), naming the pid.
 */
export function untilGone(pid: number, ms = UNTIL_MS): Promise<void> {
  return until(() => !alive(pid), ms, () => `process ${pid} still runs after ${ms} ms`);
}

/**
 * At the end of the test, sends SIGTERM to the background step `pid` when
 * it still runs, and waits for it to end, before the test's folders are
 * removed. A test that fails half-way then leaves no process behind, and
 * no process writes to a folder being removed. Call it as soon as
 * `step start` prints the pid. Never fails. The hook fails only when the
 * step still runs 10 seconds after SIGTERM.
 */
export function cleanUpStep(t: TestContext, pid: number): void {
  beforeRemoval(t, async () => {
    try {
      stopStep(pid);
    } catch {
      // It has ended already.
    }
    await untilGone(pid);
  });
}

/**
 * Sends SIGTERM to the background step `pid` now. lets passes it on to the
 * CLI, then ends by the signal with no exit file: a killed step. Follow it
 * with `untilGone(pid)`. Throws when no process has the id `pid`.
 */
export function stopStep(pid: number): void {
  process.kill(pid, 'SIGTERM');
}

/**
 * Checks a date from lets's real clock, taken between `before` and `after`
 * (both `Date.now()`): an ISO 8601 UTC date to the second, no earlier than
 * `before` rounded down to the second and no later than `after`. Throws an
 * assertion error that names the value when it does not hold, or when it
 * is not a string.
 */
export function assertClockDate(value: unknown, before: number, after: number): void {
  assert.equal(typeof value, 'string', `${value} is not a date string`);
  assert.match(value as string, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/, `${value} is not an ISO 8601 UTC date to the second`);
  const ms = Date.parse(value as string);
  assert.ok(ms >= Math.floor(before / 1000) * 1000 && ms <= after, `${value} is not between ${new Date(before).toISOString()} and ${new Date(after).toISOString()}`);
}

/**
 * Checks a time from lets's real clock, taken between `before` and `after`
 * (both `Date.now()`): whole milliseconds from `before` to `after`. Throws
 * an assertion error that names the value when it does not hold, or when
 * it is not a number.
 */
export function assertClockMs(value: unknown, before: number, after: number): void {
  assert.ok(Number.isInteger(value), `${value} is not a whole number of milliseconds`);
  assert.ok((value as number) >= before && (value as number) <= after, `${value} is not between ${before} and ${after}`);
}

// [flag, value], or nothing when value is absent.
const optional = (flag: string, value: string | undefined) => (value === undefined ? [] : [flag, value]);

// Whether a process has the id pid. EPERM means one does, of another user.
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

// Resolves once done() holds, looking every POLL_MS; rejects with why()
// after ms.
function until(done: () => boolean, ms: number, why: () => string): Promise<void> {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    const look = () => {
      if (done()) resolve();
      else if (Date.now() >= deadline) reject(new Error(why()));
      else setTimeout(look, POLL_MS);
    };
    look();
  });
}
