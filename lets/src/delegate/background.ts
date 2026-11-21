// lets delegate step start and step wait: run lets delegate step run in the
// background, and wait for the next of several such steps to end. Each run
// is kept in files under .workspace/lets-delegate/ in the repository root
// where step start ran: <name>.run.json says where the step runs and where
// its output goes, and <name>.exit.json, which step run writes once it
// ends, holds its exit code. No process access here; everything comes
// through deps.
import { dirname, join, resolve } from 'node:path';
import type { Deps, Io } from '../io.ts';
import { EXIT, SpawnError, TimeoutError, UsageError } from '../resolvers/kit/errors.ts';
import { normalizeName } from '../resolvers/kit/adapter.ts';
import { repoRoot } from './git.ts';
import { guarded } from './guarded.ts';
import { checkModels } from './lookup.ts';
import { readPromptFile } from './prompt-file.ts';
import { readAnswersFile } from './step.ts';
import type { StepOptions } from './step.ts';

// A background step's name, normalized as a session's but not cut short:
// step wait must name a story's <name>-story as it was started, and two
// long names that share their first 32 characters must not share a run.
// step run cuts the session's own name.
const runName = (raw: string) => normalizeName(raw, Infinity);

// The options of step run, but the exit file, which step start chooses.
// reportFile and metaFile take the step's stdout and stderr. checkout: the
// checkout the step runs in, else the working directory's.
export type StartOptions = Omit<StepOptions, 'exitFile'> & { reportFile: string; metaFile: string; checkout?: string };

// Every path is absolute.
type RunRecord = { name: string; pid: number; checkout: string; reportFile: string; metaFile: string; exitFile: string; startedAt: number };

// The exit code: 0 the step has started, 2 usage, 4 it could not start.
export function start(options: StartOptions, deps: Deps): Promise<number> {
  return guarded(deps, () => startStep(options, deps));
}

async function startStep(options: StartOptions, deps: Deps): Promise<number> {
  const { io, cwd } = deps;
  const { for: intent, promptFile, effort, models, timeoutMinutes, answersFile, reportFile, metaFile, checkout } = options;
  // Every check runs before anything starts, as step run would make them.
  if (!reportFile) throw new UsageError('give --report-file.');
  if (!metaFile) throw new UsageError('give --meta-file.');
  checkModels(models);
  readPromptFile(promptFile, deps);
  if (answersFile !== undefined) readAnswersFile(answersFile, deps);
  const name = runName(options.name);
  const root = await repoRoot(cwd, io);
  const runRoot = await repoRoot(resolve(cwd, checkout ?? '.'), io);
  const { runFile, exitFile } = runFiles(root, name);

  const earlier = readRun(runFile, io);
  if (earlier !== null && !io.exists(exitFile) && io.isAlive(earlier.pid)) {
    throw new UsageError(`the background step ${name} still runs, as process ${earlier.pid}. Wait for it with lets delegate step wait, or stop that process.`);
  }

  const absolute = (path: string) => resolve(cwd, path);
  const args = [
    'delegate', 'step', 'run', '--for', intent, '--name', name, '--prompt-file', absolute(promptFile), '--effort', effort,
    ...models.flatMap((model) => ['--model', model]),
    ...(timeoutMinutes === undefined ? [] : ['--timeout-minutes', String(timeoutMinutes)]),
    ...(answersFile === undefined ? [] : ['--answers-file', absolute(answersFile)]),
    '--exit-file', exitFile,
  ];
  const [cmd, ...letsArgs] = io.letsCommand();
  const outputs = { stdoutFile: absolute(reportFile), stderrFile: absolute(metaFile) };
  for (const path of [dirname(runFile), dirname(outputs.stdoutFile), dirname(outputs.stderrFile)]) io.mkdirp(path);
  // An old exit file would say the new run has ended, and an old run record
  // left behind by a start that fails would say a run was killed.
  io.remove(exitFile);
  io.remove(runFile);
  let pid: number | null;
  try {
    pid = io.spawnDetached(cmd, [...letsArgs, ...args], { cwd: runRoot, env: deps.env, ...outputs });
  } catch (error) {
    throw new SpawnError(`the background step ${name} could not start: ${(error as Error).message}`);
  }
  if (pid === null) throw new SpawnError(`the background step ${name} could not start.`);

  const record: RunRecord = { name, pid, checkout: runRoot, reportFile: outputs.stdoutFile, metaFile: outputs.stderrFile, exitFile, startedAt: io.now() };
  io.writeFile(runFile, `${JSON.stringify(record)}\n`);
  deps.stdout(`${JSON.stringify({ name, pid })}\n`);
  return 0;
}

// names: the steps to wait for, as step start was given them.
// timeoutMinutes: how long to wait; with none, as long as it takes.
export type WaitOptions = { names: string[]; timeoutMinutes?: number };

// How often step wait looks at the run files.
const POLL_MS = 2000;
const KILLED = 'lets delegate: the background step ended without an exit code\n';

// The exit code: 0 a step has ended, and stdout names it, 2 usage, 6 none
// ended in time.
export function wait(options: WaitOptions, deps: Deps): Promise<number> {
  return guarded(deps, () => waitForStep(options, deps));
}

async function waitForStep({ names, timeoutMinutes }: WaitOptions, deps: Deps): Promise<number> {
  const { io } = deps;
  if (names.length === 0) throw new UsageError('give --name at least once.');
  const root = await repoRoot(deps.cwd, io);
  const runs = names.map((given) => {
    const run = readRun(runFiles(root, runName(given)).runFile, io);
    if (run === null) throw new UsageError(`no background step named ${given} was started here.`);
    return run;
  });
  const deadline = timeoutMinutes === undefined ? Infinity : io.now() + timeoutMinutes * 60000;
  for (;;) {
    const ended = runs.map((run) => ({ run, end: endOf(run, io) })).filter(({ end }) => end !== null);
    if (ended.length > 0) {
      const { run, end } = ended.reduce((first, next) => (next.end!.endedAt < first.end!.endedAt ? next : first));
      deps.stdout(`${JSON.stringify({ name: run.name, exit: end!.exit })}\n`);
      return EXIT.ok;
    }
    const left = deadline - io.now();
    if (left <= 0) throw new TimeoutError(`none of ${runs.map(({ name }) => name).join(', ')} ended in ${timeoutMinutes} minutes; each still runs.`);
    await io.sleep(Math.min(POLL_MS, left));
  }
}

// How run ended, or null while it runs. A process that is gone with no exit
// file was killed, or crashed: it counts as exit 4, ended now, with a line in
// its meta file that says so. An exit file records that, so it is said once.
function endOf(run: RunRecord, io: Io): { exit: number; endedAt: number } | null {
  const recorded = readExit(run.exitFile, io);
  if (recorded !== null) return recorded;
  if (io.isAlive(run.pid)) return null;
  // The process may have written its exit file just before it ended.
  const late = readExit(run.exitFile, io);
  if (late !== null) return late;
  const end = { exit: EXIT.spawn, endedAt: io.now() };
  const meta = io.readFile(run.metaFile) ?? '';
  io.writeFile(run.metaFile, `${meta}${meta === '' || meta.endsWith('\n') ? '' : '\n'}${KILLED}`);
  io.writeFile(run.exitFile, `${JSON.stringify(end)}\n`);
  return end;
}

// The exit file at path, or null when there is none yet.
function readExit(path: string, io: Io): { exit: number; endedAt: number } | null {
  const text = io.readFile(path);
  if (text === null) return null;
  try {
    const { exit, endedAt } = JSON.parse(text);
    return typeof exit === 'number' && typeof endedAt === 'number' ? { exit, endedAt } : null;
  } catch {
    // A file step run is still writing.
    return null;
  }
}

// Where the run of the step name, started from root, is kept.
function runFiles(root: string, name: string) {
  const dir = join(root, '.workspace', 'lets-delegate');
  return { runFile: join(dir, `${name}.run.json`), exitFile: join(dir, `${name}.exit.json`) };
}

// The run record at path, or null when there is none or it cannot be read.
function readRun(path: string, io: Io): RunRecord | null {
  const text = io.readFile(path);
  if (text === null) return null;
  try {
    const record = JSON.parse(text);
    return typeof record?.pid === 'number' ? record : null;
  } catch {
    return null;
  }
}
