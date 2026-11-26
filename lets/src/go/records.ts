// lets go records <name>: print the record each step of a change left in
// Git and in the pull request, so lets-go fills its Skip lines from one
// read. Reads only, and decides nothing about whether a step is done. No
// process access here; everything comes through deps.
import { guarded } from '../delegate/guarded.ts';
import type { Deps, Io } from '../io.ts';
import { EXIT, SpawnError, UsageError } from '../resolvers/kit/errors.ts';

type Run = (cmd: string, args: string[]) => Promise<string>;

const READ_TIMEOUT_MS = 60_000;
const NO_PR = /no pull requests found/i;

// A runner for cmd in cwd: its stdout, or a SpawnError that names it.
function runner(io: Pick<Io, 'execFile'>, cwd: string): Run {
  return async (cmd, args) => {
    const result = await io.execFile(cmd, args, { cwd, timeoutMs: READ_TIMEOUT_MS });
    if (result.code === 0) return result.stdout;
    const command = `${cmd} ${args.slice(0, 2).join(' ')}`;
    throw new SpawnError(`${command}: ${failure(result, command)}`);
  };
}

function failure(result: { stderr: string; code: number | null; timedOut?: boolean; signal?: string }, command: string): string {
  if (result.timedOut) return `timed out after ${READ_TIMEOUT_MS / 1000} seconds`;
  if (result.signal) return `killed by ${result.signal}`;
  // One line, so guarded prints one line on stderr.
  const message = result.stderr.trim().replace(/\s*\n\s*/g, ' ');
  return message || (result.code === null ? `${command.split(' ')[0]} could not start` : `exited ${result.code}`);
}

type PullRequest = { number: number; body: string };

// The branch's pull request, or null when gh finds none.
async function pullRequest(io: Pick<Io, 'execFile'>, cwd: string, name: string): Promise<PullRequest | null> {
  const args = ['pr', 'view', name, '--json', 'number,body'];
  const result = await io.execFile('gh', args, { cwd, timeoutMs: READ_TIMEOUT_MS });
  if (result.code !== 0) {
    if (!result.timedOut && NO_PR.test(result.stderr)) return null;
    throw new SpawnError(`gh pr view: ${failure(result, 'gh pr view')}`);
  }
  let value: unknown;
  try {
    value = JSON.parse(result.stdout);
  } catch {
    value = null;
  }
  const { number, body } = (value ?? {}) as Partial<PullRequest>;
  if (!Number.isInteger(number) || typeof body !== 'string') {
    throw new SpawnError(`gh pr view printed something other than JSON with a whole-number number and a string body: ${result.stdout.trim().slice(0, 200)}`);
  }
  return { number: number as number, body };
}

type StepRecord = { commit: string; date: string };

// The most recent commit, reachable from HEAD, that made a change of kind
// filter (A added, M modified) to path, or null when none did.
// --full-history, because after archive path is absent on both sides of a
// merge, and git's default simplification would follow only the first
// parent, losing a change that came in through the second.
async function lastCommit(git: Run, filter: 'A' | 'M', path: string): Promise<StepRecord | null> {
  const out = await git('git', ['log', '-1', '--full-history', `--diff-filter=${filter}`, '--format=%h%x00%as', '--', path]);
  const line = out.trim();
  if (line === '') return null;
  const [commit, date] = line.split('\0');
  return { commit, date };
}

const ARCHIVE = 'openspec/changes/archive';
const DATED = /^\d{4}-\d{2}-\d{2}-/;

// The archive folder whose whole name is <YYYY-MM-DD>-<name>, or null when
// there is none, or more than one.
function archiveFolder(io: Pick<Io, 'isDir' | 'listDirs'>, root: string, name: string): string | null {
  const dir = `${root}/${ARCHIVE}`;
  if (!io.isDir(dir)) return null;
  let folders: string[];
  try {
    folders = io.listDirs(dir);
  } catch (error) {
    throw new SpawnError(`could not read ${ARCHIVE}: ${(error as Error).message}`);
  }
  const found = folders.filter((folder) => DATED.test(folder) && folder.slice(11) === name);
  return found.length === 1 ? found[0] : null;
}

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const HASH = /^[0-9a-f]{4,40}$/;

// The reviewed commit and verdict in the body's ## Plan review section, up
// to the next ## line, or null when either is missing or empty. These are
// the rules of lets-review-plan's Check an earlier review, which writes the
// section. A Reviewed: line in any other section is never read.
function planReview(body: string): { sha: string; verdict: string } | null {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === '## Plan review');
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  const section = lines.slice(start + 1, end === -1 ? undefined : end);
  const value = (prefix: string) => section.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim() || null;
  const sha = value('Reviewed: ');
  const verdict = value('- **Verdict:** ');
  return sha === null || verdict === null ? null : { sha, verdict };
}

// The review plan record: the reviewed commit as written, its author date,
// the pull request and the verdict, or null when the section names no
// commit git can find. A value that is not a hash never reaches git, so
// HEAD or --all is not read as a revision or an option.
async function reviewPlanRecord(io: Pick<Io, 'execFile'>, git: Run, root: string, pr: PullRequest | null) {
  if (pr === null) return null;
  const review = planReview(pr.body);
  if (review === null || !HASH.test(review.sha)) return null;
  const found = await io.execFile('git', ['rev-parse', '--verify', '--quiet', '--end-of-options', `${review.sha}^{commit}`], { cwd: root, timeoutMs: READ_TIMEOUT_MS });
  // --quiet makes a missing commit exit 1 with no output; a timeout or a
  // signal also exits 1, and is a failed read, not a missing commit.
  const missing = found.code === 1 && !found.timedOut && !found.signal && found.stdout.trim() === '' && found.stderr.trim() === '';
  if (missing) return null;
  if (found.code !== 0) throw new SpawnError(`git rev-parse: ${failure(found, 'git rev-parse')}`);
  const date = (await git('git', ['log', '-1', '--format=%as', found.stdout.trim()])).trim();
  return { commit: review.sha, date, pr: pr.number, verdict: review.verdict };
}

// The exit code: 0 ok, 2 a bad name, 4 a failed read.
export function run(name: string, deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    // Before any read, so a name such as ../x or --all never reaches a path or gh.
    if (!KEBAB.test(name)) throw new UsageError(`the change's name must be lower-case kebab-case, such as lets-go-chore: ${name}`);
    const root = (await runner(deps.io, deps.cwd)('git', ['rev-parse', '--show-toplevel'])).trim();
    const git = runner(deps.io, root);
    const change = `openspec/changes/${name}`;
    const pr = await pullRequest(deps.io, root, name);
    const folder = archiveFolder(deps.io, root, name);
    const archived = folder === null ? null : await lastCommit(git, 'A', `${ARCHIVE}/${folder}/tasks.md`);
    const records = {
      plan: await lastCommit(git, 'A', `${change}/tasks.md`),
      'review-plan': await reviewPlanRecord(deps.io, git, root, pr),
      build: await lastCommit(git, 'M', `${change}/tasks.md`),
      'review-build': archived === null ? null : { ...archived, pr: pr?.number ?? null },
    };
    deps.stdout(`${JSON.stringify(records)}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
