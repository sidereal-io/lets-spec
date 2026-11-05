// lets delegate step run: run a prompt in a fresh session that may write
// files, wait for its final message, and print the step report it ends
// with. There is no tree check: a step is meant to change files. No process
// access here; everything comes through deps.
import { resolve } from 'node:path';
import type { Deps } from '../io.ts';
import { readConfig } from './config.ts';
import { EXIT, SessionFailed, UsageError } from '../resolvers/kit/errors.ts';
import { repoRoot } from './git.ts';
import { guarded } from './guarded.ts';
import { checkModels, finishSession, pick, withModels } from './lookup.ts';
import { readPromptFile } from './prompt-file.ts';
import { readAnswers, readReport, withAnswers } from './report.ts';
import type { Report } from './report.ts';
import { normalizeName } from '../resolvers/kit/adapter.ts';
import type { Handle } from '../resolvers/kit/adapter.ts';
import { parseModel } from '../resolvers/kit/families.ts';
import type { Effort } from '../resolvers/kit/families.ts';
import type { StepIntent } from './strategies.ts';

// How long a step may run, in minutes, at every effort. A step such as
// build runs far longer than a review.
export const STEP_TIMEOUT_MINUTES = 120;

// for: the step, recorded in the record line. models: each <family> or
// <family>/<model>, best first, asked for one at a time until one is not
// refused. answersFile: the user's answers to the questions of the last
// needs-input report, which lets appends to the prompt.
export type StepOptions = { for: StepIntent; name: string; promptFile: string; effort: Effort; models: string[]; timeoutMinutes?: number; answersFile?: string };

// The exit code: 0 a report is on stdout, whatever its outcome, 2 usage,
// 3 every model refused, 4 the outcome is unknown, 6 timeout.
export function run(options: StepOptions, deps: Deps): Promise<number> {
  return guarded(deps, () => step(options, deps));
}

async function step({ for: intent, name, promptFile, effort, models, timeoutMinutes, answersFile }: StepOptions, deps: Deps) {
  const { io } = deps;
  const started = io.now();
  checkModels(models);
  const config = readConfig(deps);
  const written = readPromptFile(promptFile, deps);
  const prompt = answersFile === undefined ? written : withAnswers(written, readAnswersFile(answersFile, deps));
  const cwd = await repoRoot(deps.cwd, io);

  const adapter = await pick('step', { ...deps, config });
  const timeoutMs = (timeoutMinutes ?? STEP_TIMEOUT_MINUTES) * 60000;
  // A session the resolver reports failed is a failed report, not an exit
  // code, so the caller reads every outcome in one place. The resolver gives
  // no handle for it, and keeps the session itself.
  const { value: { handle, report }, model: sent } = await withModels(models, async (model): Promise<{ handle: Handle | null; report: Report }> => {
    try {
      const { handle, text } = await adapter.step!({ name: normalizeName(name), prompt, cwd, ...parseModel(model)!, effort }, { timeoutMs });
      return { handle, report: readReport(text) };
    } catch (error) {
      if (!(error instanceof SessionFailed)) throw error;
      return { handle: null, report: { outcome: 'failed', reason: error.message } };
    }
  });
  const { family, model } = parseModel(sent)!;
  // Only a done step is cleaned up. Any other is kept for a person to read.
  if (handle !== null) await finishSession(adapter, handle, { cwd, ok: report.outcome === 'done', deps });

  const printed = report.outcome === 'done' ? { ...report, date: isoSeconds(io.now()) } : report;
  deps.stdout(`${JSON.stringify(printed)}\n`);
  const durationSeconds = Math.round((io.now() - started) / 1000);
  // The model that ran, else the --model value, when it names only a family.
  deps.stderr(`${JSON.stringify({ for: intent, resolver: adapter.name, family, model: model ?? sent, handle, durationSeconds })}\n`);
  return EXIT.ok;
}

// The pairs in answersFile, taken from the working directory.
function readAnswersFile(answersFile: string, { cwd, io }: Pick<Deps, 'cwd' | 'io'>) {
  const text = io.readFile(resolve(cwd, answersFile));
  if (text === null) throw new UsageError(`cannot read --answers-file ${answersFile}`);
  return readAnswers(text, answersFile);
}

// ms as ISO 8601 UTC, to the second, such as 2026-11-04T09:30:00Z.
function isoSeconds(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
