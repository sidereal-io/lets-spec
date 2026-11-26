// lets go records <name>: print the record each step of a change left in
// Git and in the pull request, so lets-go fills its Skip lines from one
// read. Reads only, and decides nothing about whether a step is done. No
// process access here; everything comes through deps.
import { guarded } from '../delegate/guarded.ts';
import type { Deps, Io } from '../io.ts';
import { EXIT, SpawnError } from '../resolvers/kit/errors.ts';

type Run = (cmd: string, args: string[]) => Promise<string>;

const GH_TIMEOUT_MS = 60_000;
const NO_PR = /no pull requests found/i;

// A runner for cmd in cwd: its stdout, or a SpawnError that names it.
function runner(io: Pick<Io, 'execFile'>, cwd: string): Run {
  return async (cmd, args) => {
    const result = await io.execFile(cmd, args, { cwd, timeoutMs: GH_TIMEOUT_MS });
    if (result.code === 0) return result.stdout;
    const command = `${cmd} ${args.slice(0, 2).join(' ')}`;
    throw new SpawnError(`${command}: ${failure(result, command)}`);
  };
}

function failure(result: { stderr: string; code: number | null; timedOut?: boolean }, command: string): string {
  if (result.timedOut) return `timed out after ${GH_TIMEOUT_MS / 1000} seconds`;
  return result.stderr.trim() || (result.code === null ? `${command.split(' ')[0]} could not start` : `exited ${result.code}`);
}

type PullRequest = { number: number; body: string };

// The branch's pull request, or null when gh finds none.
async function pullRequest(io: Pick<Io, 'execFile'>, cwd: string, name: string): Promise<PullRequest | null> {
  const args = ['pr', 'view', name, '--json', 'number,body'];
  const result = await io.execFile('gh', args, { cwd, timeoutMs: GH_TIMEOUT_MS });
  if (result.code !== 0) {
    if (!result.timedOut && NO_PR.test(result.stderr)) return null;
    throw new SpawnError(`gh pr view: ${failure(result, 'gh pr view')}`);
  }
  return JSON.parse(result.stdout) as PullRequest;
}

// The exit code: 0 ok, 2 a bad name, 4 a failed read.
export function run(name: string, deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    const git = runner(deps.io, deps.cwd);
    const root = (await git('git', ['rev-parse', '--show-toplevel'])).trim();
    await pullRequest(deps.io, root, name);
    const records = { plan: null, 'review-plan': null, build: null, 'review-build': null };
    deps.stdout(`${JSON.stringify(records)}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
