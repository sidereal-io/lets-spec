// Deps for the lets backlog commands, with a fake gh. execFile answers each
// gh call from a table: the first row whose key the call's arguments start
// with, joined by spaces. A call no row answers fails the test. Each gh call
// is recorded, so a test can assert the writes that were not made.
// The user's lets config, CONFIG_FILE, holds config, and the repository's
// lets config, REPO_CONFIG_FILE, holds repoConfig, when given. git answers
// only `git rev-parse --show-toplevel`, with /repo, and is not recorded. No
// other program runs: a test that reaches one fails.
//
//   const t = backlogDeps([...LOOKUP_ONE, ['issue view 7', json({...})]]);
//   await run(['item', '7'], t.deps);
//   t.json(), t.calls()
import type { Deps, ExecOptions, ExecResult } from '../../../../lets/src/io.ts';
import { commandDeps } from '../../delegate/fixtures/command-deps.ts';

export type Answer = ExecResult | ((args: string[]) => ExecResult);
export type Row = [key: string, answer: Answer];

export const REPO = 'acme/app';
export const PROJECT = { number: 7, title: 'Backlog', url: 'https://github.com/users/acme/projects/7', owner: 'acme' };

export const ok = (stdout: string): ExecResult => ({ stdout, stderr: '', code: 0 });
export const json = (value: unknown): ExecResult => ok(`${JSON.stringify(value)}\n`);
export const fail = (stderr: string, code = 1): ExecResult => ({ stdout: '', stderr, code });
export const TIMED_OUT: ExecResult = { stdout: '', stderr: '', code: 1, timedOut: true };

// The Project lookup, answering with these projects.
export const lookup = (projects: unknown[]): Row => ['api graphql', json({ repo: REPO, projects })];
export const LOOKUP_ONE: Row[] = [lookup([PROJECT])];

// Where the user's lets config is, for commandDeps' env and home folder.
export const CONFIG_FILE = '/home/u/.config/lets/config.yaml';
// Where the repository's lets config is, under commandDeps' repository root.
export const REPO_CONFIG_FILE = '/repo/.lets/config.yaml';

export function backlogDeps(rows: Row[], { config, repoConfig, files = {} }: { config?: string; repoConfig?: string; files?: Record<string, string> } = {}) {
  const t = commandDeps();
  if (config !== undefined) t.io.files.set(CONFIG_FILE, config);
  if (repoConfig !== undefined) t.io.files.set(REPO_CONFIG_FILE, repoConfig);
  for (const [path, text] of Object.entries(files)) t.io.files.set(path, text);
  const calls: [string[], ExecOptions][] = [];
  t.io.execFile = async (cmd, args, opts = {}) => {
    if (cmd === 'git' && args.join(' ') === 'rev-parse --show-toplevel') return ok('/repo\n');
    if (cmd !== 'gh') throw new Error(`no program but gh runs here: ${cmd} ${args.join(' ')}`);
    calls.push([args, opts]);
    const joined = args.join(' ');
    const row = rows.find(([key]) => joined.startsWith(key));
    if (row === undefined) throw new Error(`no answer for gh ${joined}`);
    const [, answer] = row;
    return typeof answer === 'function' ? answer(args) : answer;
  };
  return {
    deps: t.deps as Deps,
    stdout: t.stdout,
    stderr: t.stderr,
    // The JSON object printed on stdout.
    json: () => JSON.parse(t.stdout()),
    // The arguments of each gh call, in order; with options when asked.
    calls: () => calls.map(([args]) => args),
    options: () => calls.map(([, opts]) => opts),
    // Whether any call's arguments start with key.
    ran: (key: string) => calls.some(([args]) => args.join(' ').startsWith(key)),
  };
}
