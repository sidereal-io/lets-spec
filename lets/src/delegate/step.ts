// lets delegate step run: run a prompt in a fresh session, wait for its
// final message, and print a report. For a step, the session may write
// files, and the report is the step report its final message ends with;
// there is no tree check, since a step is meant to change files. For a
// reviewer, the session is read-only, the tree is checked after it, and
// its final message comes back whole as the findings. No process access
// here; everything comes through deps.
import { resolve } from 'node:path';
import type { Deps } from '../io.ts';
import { readConfig } from './config.ts';
import { EXIT, SessionFailed, UsageError } from '../resolvers/kit/errors.ts';
import { headCommit, isTreeClean, repoRoot, treeStatus } from './git.ts';
import { guarded } from './guarded.ts';
import { checkModels, finishSession, pick, withModels } from './lookup.ts';
import { readPromptFile } from './prompt-file.ts';
import { readAnswers, readReport, withAnswers } from './report.ts';
import type { Report } from './report.ts';
import { normalizeName } from '../resolvers/kit/adapter.ts';
import type { Adapter, Handle, RunInput } from '../resolvers/kit/adapter.ts';
import { parseModel } from '../resolvers/kit/families.ts';
import type { Effort, Family } from '../resolvers/kit/families.ts';
import { isReviewer, kindFor } from './strategies.ts';
import type { Intent } from './strategies.ts';

// How long a step may run, in minutes, at every effort. A step such as
// build runs far longer than a review.
export const STEP_TIMEOUT_MINUTES = 120;
// How long a story run may take: it runs up to five steps in turn.
export const STORY_TIMEOUT_MINUTES = 600;

// for: the intent, recorded in the record line. models: each <family> or
// <family>/<model>, best first, asked for one at a time until one is not
// refused. sourceFamily: for a reviewer, the family that wrote the work
// under review. answersFile: the user's answers to the questions of the
// last needs-input report, which lets appends to the prompt. exitFile:
// where to record the exit code once it is known, for lets delegate step
// wait; a hidden option, which lets delegate step start gives.
export type StepOptions = { for: Intent; name: string; promptFile: string; effort: Effort; models: string[]; sourceFamily?: Family; timeoutMinutes?: number; answersFile?: string; exitFile?: string };

// The exit code: 0 a report is on stdout, whatever its outcome, 2 usage,
// 3 every model refused, 4 the outcome is unknown, 6 timeout.
export async function run(options: StepOptions, deps: Deps): Promise<number> {
  const code = await guarded(deps, () => step(options, deps));
  // Written after stdout and stderr, so a reader that finds the exit file
  // finds the whole report too.
  if (options.exitFile !== undefined) {
    deps.io.writeFile(resolve(deps.cwd, options.exitFile), `${JSON.stringify({ exit: code, endedAt: deps.io.now() })}\n`);
  }
  return code;
}

// What a session needs: the adapter that answered, the request for each
// model, best first, and where and how long it runs.
type Session = { adapter: Adapter; models: string[]; input: (model: string) => RunInput; cwd: string; timeoutMs: number; deps: Deps };

// What a session gave: the report, the --model that ran it, and the fields
// of the record line between model and durationSeconds.
type Outcome = { report: Report; sent: string; fields: Record<string, unknown> };

async function step(options: StepOptions, deps: Deps) {
  const { for: intent, name, promptFile, effort, models, timeoutMinutes, answersFile } = options;
  const { io } = deps;
  const started = io.now();
  checkModels(models);
  const { config, fileOf } = await readConfig(deps);
  const written = readPromptFile(promptFile, deps);
  const prompt = answersFile === undefined ? written : withAnswers(written, readAnswersFile(answersFile, deps));
  const cwd = await repoRoot(deps.cwd, io);
  // What is already uncommitted is the user's, not the reviewer's.
  const before = isReviewer(intent) ? await treeStatus(cwd, io) : [];

  const adapter = await pick(kindFor(intent), { ...deps, config, fileOf });
  const timeoutMs = (timeoutMinutes ?? (intent === 'story' ? STORY_TIMEOUT_MINUTES : STEP_TIMEOUT_MINUTES)) * 60000;
  const input = (model: string) => ({ name: normalizeName(name), prompt, cwd, ...parseModel(model)!, effort });
  const session: Session = { adapter, models, input, cwd, timeoutMs, deps };
  const { report, sent, fields } = isReviewer(intent)
    ? await reviewerSession(session, options.sourceFamily, before)
    : await stepSession(session);

  const printed = report.outcome === 'done' ? { ...report, date: isoSeconds(io.now()) } : report;
  deps.stdout(`${JSON.stringify(printed)}\n`);
  const durationSeconds = Math.round((io.now() - started) / 1000);
  const { family, model } = parseModel(sent)!;
  // The model that ran, else the --model value, when it names only a family.
  deps.stderr(`${JSON.stringify({ for: intent, resolver: adapter.name, family, model: model ?? sent, ...fields, durationSeconds })}\n`);
  return EXIT.ok;
}

// A session that may write files, whose final message ends with a step
// report. Only a done step is cleaned up. Any other is kept for a person to
// read.
async function stepSession({ adapter, models, input, cwd, timeoutMs, deps }: Session): Promise<Outcome> {
  // A session the resolver reports failed is a failed report, not an exit
  // code, so the caller reads every outcome in one place. The resolver gives
  // no handle for it, and keeps the session itself.
  const { value: { handle, report }, model: sent } = await withModels(models, async (model): Promise<{ handle: Handle | null; report: Report }> => {
    try {
      const { handle, text } = await adapter.step!(input(model), { timeoutMs });
      return { handle, report: readReport(text) };
    } catch (error) {
      if (!(error instanceof SessionFailed)) throw error;
      return { handle: null, report: { outcome: 'failed', reason: error.message } };
    }
  });
  if (handle !== null) await finishSession(adapter, handle, { cwd, ok: report.outcome === 'done', deps });
  return { report, sent, fields: { handle } };
}

// A reviewer: a read-only session, whose final message is the findings.
// before: the tree's entries before the session, which are the user's.
async function reviewerSession({ adapter, models, input, cwd, timeoutMs, deps }: Session, sourceFamily: Family | undefined, before: string[]): Promise<Outcome> {
  const { io } = deps;
  const { value: { handle, text, checkout }, model: sent } = await withModels(models, (model) => adapter.run(input(model), { timeoutMs }));
  // Read after the session, so a commit it made shows.
  const commit = checkout === null ? null : await headCommit(checkout, io);
  const gitClean = await isTreeClean(cwd, io, before);
  const report: Report = { outcome: 'done', findings: text };
  await finishSession(adapter, handle, { cwd, ok: true, deps });
  const independent = parseModel(sent)!.family !== sourceFamily;
  return { report, sent, fields: { independent, handle, checkout, commit, gitClean } };
}

// The pairs in answersFile, taken from the working directory.
export function readAnswersFile(answersFile: string, { cwd, io }: Pick<Deps, 'cwd' | 'io'>) {
  const text = io.readFile(resolve(cwd, answersFile));
  if (text === null) throw new UsageError(`cannot read --answers-file ${answersFile}`);
  return readAnswers(text, answersFile);
}

// ms as ISO 8601 UTC, to the second, such as 2026-11-04T09:30:00Z.
function isoSeconds(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
