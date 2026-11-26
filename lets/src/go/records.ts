// lets go records <name>: print the record each step of a change left in
// Git and in the pull request, whether each step is done, and which records
// disagree, so lets-go walks its step table from one read. Reads only. No
// process access here; everything comes through deps.
import { guarded } from '../delegate/guarded.ts';
import type { Deps, Io } from '../io.ts';
import { EXIT, SpawnError, UsageError } from '../resolvers/kit/errors.ts';
import { type PlanReview, planReview, resolveCommit, reviewPlanDone } from './plan-review.ts';
import { type Exec, exec, failed, oneLine, type Run, runner } from './read.ts';
import { disagreements, done, type Facts } from './walk.ts';

const NO_PR = /no pull requests found/i;

type PullRequest = { number: number; body: string; state: string; isDraft: boolean };

// The branch's pull request, or null when gh finds none.
async function pullRequest(io: Pick<Io, 'execFile'>, cwd: string, name: string): Promise<PullRequest | null> {
  const result = await exec(io, cwd)('gh', ['pr', 'view', name, '--json', 'number,body,state,isDraft']);
  if (result.code !== 0) {
    if (!result.timedOut && NO_PR.test(result.stderr)) return null;
    throw failed('gh pr view', result);
  }
  let value: unknown;
  try {
    value = JSON.parse(result.stdout);
  } catch {
    value = null;
  }
  const { number, body, state, isDraft } = (value ?? {}) as Partial<PullRequest>;
  if (!Number.isInteger(number) || typeof body !== 'string' || typeof state !== 'string' || typeof isDraft !== 'boolean') {
    throw new SpawnError(`gh pr view printed something other than JSON with a whole-number number, a string body, a string state and a boolean isDraft: ${oneLine(result.stdout).slice(0, 200)}`);
  }
  return { number: number as number, body, state, isDraft };
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

// The archive folders whose whole name is <YYYY-MM-DD>-<name>, by name.
function archiveFolders(io: Pick<Io, 'isDir' | 'listDirs'>, root: string, name: string): string[] {
  const dir = `${root}/${ARCHIVE}`;
  if (!io.isDir(dir)) return [];
  let folders: string[];
  try {
    folders = io.listDirs(dir);
  } catch (error) {
    throw new SpawnError(`could not read ${ARCHIVE}: ${(error as Error).message}`);
  }
  return folders.filter((folder) => DATED.test(folder) && folder.slice(11) === name).sort();
}

const STATES = new Set(['blocked', 'ready', 'all_done']);

// The change state that openspec instructions apply prints. A state the
// walk does not know fails, with the CLI's instruction, so lets-go can show it.
async function changeState(openspec: Run, name: string): Promise<string> {
  const command = 'openspec instructions apply';
  const out = await openspec('openspec', ['instructions', 'apply', '--change', name, '--json']);
  let value: unknown;
  try {
    value = JSON.parse(out);
  } catch {
    value = null;
  }
  const { state, instruction } = (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}) as { state?: unknown; instruction?: unknown };
  if (typeof state !== 'string') throw new SpawnError(`${command} printed something other than JSON with a string state: ${oneLine(out).slice(0, 200)}`);
  if (!STATES.has(state)) {
    const how = typeof instruction === 'string' && instruction.trim() !== '' ? `: ${oneLine(instruction)}` : '';
    throw new SpawnError(`${command}: the change state is ${oneLine(state)}${how}`);
  }
  return state;
}

// The value of the first schema: line of the file at path, or null when the
// file does not exist or has no such line. Read as lets-go reads it by hand,
// not as YAML, so a stray character elsewhere in the file fails nothing.
function schemaLine(io: Pick<Io, 'exists' | 'readFile'>, root: string, path: string): string | null {
  const full = `${root}/${path}`;
  if (!io.exists(full)) return null;
  let text: string | null;
  try {
    text = io.readFile(full);
  } catch (error) {
    throw new SpawnError(`could not read ${path}: ${(error as Error).message}`);
  }
  if (text === null) throw new SpawnError(`could not read ${path}`);
  return /^schema:\s*(\S+)/m.exec(text)?.[1] ?? null;
}

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const HASH = /^[0-9a-f]{4,40}$/;

// The review plan record: the reviewed commit as written, its author date,
// the pull request and the verdict, with the commit's full hash, or null
// when the section names no commit git can find. A value that is not a hash
// never reaches git, so HEAD or --all is not read as a revision or an option.
async function reviewPlanRecord(git: Run, read: Exec, pr: PullRequest | null, review: PlanReview | null) {
  if (pr === null || review === null || !HASH.test(review.sha)) return null;
  const oid = await resolveCommit(read, review.sha);
  if (oid === null) return null;
  const date = (await git('git', ['log', '-1', '--format=%as', oid])).trim();
  return { oid, record: { commit: review.sha, date, pr: pr.number, verdict: review.verdict } };
}

// The paths git status lists outside .workspace/. A rename or copy entry
// is followed by its old path. That path is named only for a rename into
// .workspace/: otherwise the new path already names the entry, and a copy
// leaves its old path as it was.
async function dirtyPaths(git: Run): Promise<string[]> {
  const entries = (await git('git', ['status', '--porcelain=v1', '-z'])).split('\0');
  const outside = (path: string) => path !== '.workspace/' && !path.startsWith('.workspace/');
  const paths: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === '') continue;
    const status = entry.slice(0, 2);
    const path = entry.slice(3);
    const old = /[RC]/.test(status) ? entries[++i] : undefined;
    if (outside(path)) paths.push(path);
    else if (old !== undefined && status.includes('R') && outside(old)) paths.push(old);
  }
  return paths;
}

// The body holds a ## Code review line.
function hasCodeReview(body: string): boolean {
  return body.split(/\r?\n/).some((line) => line.trimEnd() === '## Code review');
}

// The paths of HEAD's tree, among paths, that exist.
async function inHead(git: Run, paths: string[]): Promise<Set<string>> {
  const out = await git('git', ['ls-tree', '--name-only', '-z', 'HEAD', '--', ...paths]);
  return new Set(out.split('\0').filter((path) => path !== ''));
}

// The exit code: 0 ok, 2 a bad name, 4 a failed read.
export function run(name: string, deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    // Before any read, so a name such as ../x or --all never reaches a path or gh.
    if (!KEBAB.test(name)) throw new UsageError(`the change's name must be lower-case kebab-case, such as lets-go-chore: ${oneLine(name)}`);
    const root = (await runner(deps.io, deps.cwd)('git', ['rev-parse', '--show-toplevel'])).trim();
    const git = runner(deps.io, root);
    const read = exec(deps.io, root);
    const change = `openspec/changes/${name}`;
    const dirty = await dirtyPaths(git);
    const pr = await pullRequest(deps.io, root, name);
    const archives = archiveFolders(deps.io, root, name);
    const changeFolder = deps.io.isDir(`${root}/${change}`);
    // The change's own file when it exists, so an archived change keeps the schema it was built with.
    const ownSchema = `${change}/.openspec.yaml`;
    const changeSchema = deps.io.exists(`${root}/${ownSchema}`) || archives.length === 0
      ? schemaLine(deps.io, root, ownSchema)
      : schemaLine(deps.io, root, `${ARCHIVE}/${archives[0]}/.openspec.yaml`);
    const flowSchema = schemaLine(deps.io, root, 'openspec/config.yaml');
    const state = changeFolder && archives.length === 0 ? await changeState(runner(deps.io, root), name) : null;
    // The record needs the one archive folder; two leave it null.
    const archived = archives.length === 1 ? await lastCommit(git, 'A', `${ARCHIVE}/${archives[0]}/tasks.md`) : null;
    const review = pr === null ? null : planReview(pr.body);
    const reviewed = await reviewPlanRecord(git, read, pr, review);
    const head = await inHead(git, [`${change}/tasks.md`, `${change}/brainstorm.md`]);
    // Only a change folder with no archive folder, on a schema other than
    // lets-minimal, needs the rules; the walk decides every other case.
    const reviewPlan = changeFolder && archives.length === 0 && changeSchema !== 'lets-minimal'
      && await reviewPlanDone(read, git, { name, review, oid: reviewed?.oid ?? null, tasksInHead: head.has(`${change}/tasks.md`) });
    const records = {
      plan: await lastCommit(git, 'A', `${change}/tasks.md`),
      'review-plan': reviewed?.record ?? null,
      build: await lastCommit(git, 'M', `${change}/tasks.md`),
      'review-build': archived === null ? null : { ...archived, pr: pr?.number ?? null },
    };
    const facts: Facts = {
      name, dirty, archives, changeFolder, state, changeSchema, flowSchema, reviewPlan,
      pr: pr === null ? null : { isDraft: pr.isDraft, codeReview: hasCodeReview(pr.body), planReview: review !== null },
      brainstorm: head.has(`${change}/brainstorm.md`),
      recorded: { plan: records.plan !== null, 'review-plan': records['review-plan'] !== null, build: records.build !== null, 'review-build': records['review-build'] !== null },
    };
    const answers = done(facts);
    const line = { ...records, done: answers, disagreements: disagreements(facts, answers), 'pull-request': pr?.state ?? null };
    deps.stdout(`${JSON.stringify(line)}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
