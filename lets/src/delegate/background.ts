// lets delegate step start and step wait: run lets delegate step run in the
// background, and wait for the next of several such steps to end. Each run
// is kept in files under .workspace/lets-delegate/ in the repository root
// where step start ran: <name>.run.json says where the step runs and where
// its output goes, and <name>.exit.json, which step run writes once it
// ends, holds its exit code. No process access here; everything comes
// through deps.
import { dirname, join, resolve } from 'node:path';
import type { Deps, Io } from '../io.ts';
import { SpawnError, UsageError } from '../resolvers/kit/errors.ts';
import { normalizeName } from '../resolvers/kit/adapter.ts';
import { repoRoot } from './git.ts';
import { guarded } from './guarded.ts';
import { checkModels } from './lookup.ts';
import { readPromptFile } from './prompt-file.ts';
import { readAnswersFile } from './step.ts';
import type { StepOptions } from './step.ts';

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
  const name = normalizeName(options.name);
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
  // An old exit file would say the new run has ended.
  io.remove(exitFile);
  const pid = io.spawnDetached(cmd, [...letsArgs, ...args], { cwd: runRoot, env: deps.env, ...outputs });
  if (pid === null) throw new SpawnError(`the background step ${name} could not start.`);

  const record: RunRecord = { name, pid, checkout: runRoot, reportFile: outputs.stdoutFile, metaFile: outputs.stderrFile, exitFile, startedAt: io.now() };
  io.writeFile(runFile, `${JSON.stringify(record)}\n`);
  deps.stdout(`${JSON.stringify({ name, pid })}\n`);
  return 0;
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
