// Deps for the lets backlog commands, with a fake gh. execFile answers each
// gh call from a table: the first row whose key the call's arguments start
// with, joined by spaces. A call no row answers fails the test. Each gh call
// is recorded, so a test can assert the writes that were not made.
// `git rev-parse --show-toplevel` answers root, or fails when root is null,
// and openspec/config.yaml under it holds config, when given.
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

export const ROOT = '/repo';
export const CONFIG_FILE = `${ROOT}/openspec/config.yaml`;

export function backlogDeps(rows: Row[], { config, root = ROOT }: { config?: string; root?: string | null } = {}) {
  const t = commandDeps();
  if (config !== undefined) t.io.files.set(`${root ?? t.deps.cwd}/openspec/config.yaml`, config);
  const calls: [string[], ExecOptions][] = [];
  t.io.execFile = async (cmd, args, opts = {}) => {
    if (cmd === 'git' && args.join(' ') === 'rev-parse --show-toplevel') {
      return root === null ? { stdout: '', stderr: 'fatal: not a git repository', code: 128 } : ok(`${root}\n`);
    }
    if (cmd !== 'gh') throw new Error(`no program but gh and git rev-parse runs here: ${cmd} ${args.join(' ')}`);
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
