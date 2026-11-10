// lets backlog: the commands the skills run on the backlog. Each prints one
// JSON object and a newline. A result exits 0. When the backlog cannot
// answer, it prints { error, message } and exits 1. A usage error exits 2
// and prints nothing on stdout. No process access here; everything comes
// through deps.
import { Command, CommanderError, InvalidArgumentError } from 'commander';
import type { Deps, Io } from '../io.ts';
import type { Adapter } from './adapter.ts';
import { BacklogError } from './adapter.ts';
import { createGithub } from './github.ts';
import { claim, ready, release } from './policy.ts';

export const BACKLOG_HELP = `
lets runs the backlog's commands itself: the backlog is the one open GitHub
Project linked to this repository, and lets calls gh. Run it from the repo.

stdout: one JSON object and a newline.
  ready              { issues: [{ number, title, url, kind, priority, size }] }
  item <i>           { number, title, body, url, state, kind, priority, size,
                       status, assignees, blockedBy, parent, subIssues }
  find <words...>    { issues: [{ number, title }] }
  claim <i>          { result: claimed } | { result: taken, assignees }
                     | { result: failed, write: assign|status, message }
  release <i>        { result: released }
                     | { result: failed, write: unassign|status, message }
On an error: { error, message }, where error is no-backlog,
several-backlogs (with projects: [{ title, url }]), gh-failed or not-found.

Exit codes:
  0  a result, failed included: a failed write is a result to act on
  1  an error: the backlog cannot answer
  2  usage error`;

// An issue number: a whole number above zero.
function issueNumber(value: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) throw new InvalidArgumentError('Give an issue number.');
  return Number(value);
}

// A list of issue numbers, such as 191,192.
function issueList(value: string): number[] {
  return value.split(',').map((part) => issueNumber(part.trim()));
}

type MakeAdapter = (io: Pick<Io, 'execFile'>, cwd: string) => Promise<Adapter>;

// The exit code. argv is what follows lets backlog.
export async function run(argv: string[], deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>, makeAdapter: MakeAdapter = createGithub): Promise<number> {
  const print = (value: unknown) => deps.stdout(`${JSON.stringify(value)}\n`);
  // The command's work, once its arguments parse. Its result is printed.
  let work: ((adapter: Adapter) => Promise<unknown>) | undefined;

  const program = new Command('lets backlog')
    .description('Read and claim work on the repository\'s backlog. Each command prints one JSON object.')
    .addHelpText('after', BACKLOG_HELP)
    .exitOverride()
    .configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });
  const command = (name: string, summary: string) => program.command(name).summary(summary).description(`${summary[0].toUpperCase()}${summary.slice(1)}.`).exitOverride().configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });

  command('ready', 'list the ready issues, best first')
    .option('--only <issues>', 'keep only these issues, such as 191,192', issueList)
    .option('--exclude <issues>', 'leave these issues out, such as 149', issueList)
    .action(({ only, exclude }: { only?: number[]; exclude?: number[] }) => {
      work = async (adapter) => ({ issues: ready(await adapter.listCandidates(), { only, exclude }) });
    });
  command('item', 'read one issue, with its Project fields')
    .argument('<i>', 'the issue number', issueNumber)
    .action((issue: number) => {
      work = (adapter) => adapter.readItem(issue);
    });
  command('find', 'search the open issues\' titles')
    .argument('<words...>', 'the words to search for')
    .action((words: string[]) => {
      work = async (adapter) => ({ issues: await adapter.searchTitles(words.join(' ')) });
    });
  command('claim', 'assign the issue to yourself and set it In Progress, when nobody has it')
    .argument('<i>', 'the issue number', issueNumber)
    .action((issue: number) => {
      work = (adapter) => claim(adapter, issue);
    });
  command('release', 'remove yourself from the issue and set it back to Todo')
    .argument('<i>', 'the issue number', issueNumber)
    .action((issue: number) => {
      work = (adapter) => release(adapter, issue);
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error;
    return error.exitCode === 0 ? 0 : 2;
  }
  if (work === undefined) {
    program.outputHelp({ error: true });
    return 2;
  }

  try {
    print(await work(await makeAdapter(deps.io, deps.cwd)));
    return 0;
  } catch (error) {
    if (!(error instanceof BacklogError)) throw error;
    print({ error: error.code, message: error.message, ...error.extra });
    return 1;
  }
}
