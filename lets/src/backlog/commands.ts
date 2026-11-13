// lets backlog: the commands the skills run on the backlog. Each prints one
// JSON object and a newline. A result exits 0. When the backlog cannot
// answer, it prints { error, message } and exits 1. A usage error exits 2
// and prints nothing on stdout. No process access here; everything comes
// through deps.
import { Command, CommanderError, InvalidArgumentError } from 'commander';
import type { Deps } from '../io.ts';
import type { Adapter } from './adapter.ts';
import { BacklogError } from './adapter.ts';
import type { Selection } from './config.ts';
import { selectProvider } from './config.ts';
import { claim, itemView, ready, release } from './policy.ts';
import type { Providers } from './providers.ts';
import { PROVIDERS } from './providers.ts';

// The help text, after a first paragraph that says which backlog provider
// is in use.
const HELP_BODY = `
stdout: one JSON object and a newline.
  ready              { issues: [{ key, label, title, url, kind, priority, size }] }
  item <i>           { key, label, title, body, url, state, kind, priority, size,
                       status, assignees, blockedBy, parent, subIssues }
  find <words...>    { issues: [{ key, label, title }] }
An item's key names it in commands; its label is how the backlog writes it.
  claim <i>          { result: claimed, claim } | { result: taken, assignees }
                     | { result: failed, write: assign|claim|delete-claim|unassign|status, message, claim? }
  release <i> --claim <token>
                     { result: released } | { result: not-found }
                     | { result: failed, write: delete-claim|unassign|status, message }
On an error: { error, message }, where error is no-backlog,
several-backlogs (with projects: [{ title, url }]), backend-failed, not-found
or unknown-backlog-provider.

Exit codes:
  0  a result, failed included: a failed write is a result to act on
  1  an error: the backlog cannot answer
  2  usage error`;

const SETTING = 'lets.backlog.provider in openspec/config.yaml chooses the backlog provider; it is github when unset.';

// The help text lets help backlog prints, outside a repository.
export const BACKLOG_HELP = `
lets runs the backlog's commands itself. ${SETTING} Run it from the repo.
${HELP_BODY}`;

function backlogHelp(selection: Selection | BacklogError) {
  const line = selection instanceof BacklogError
    ? `The backlog provider cannot be used: ${selection.message}`
    : `The backlog provider is ${selection.name}: ${selection.provider.description}.`;
  return `
lets runs the backlog's commands itself. ${line}
${SETTING} Run it from the repo.
${HELP_BODY}`;
}

// An issue number: a whole number above zero, kept as the issue's key.
function issueNumber(value: string): string {
  if (!/^[1-9][0-9]*$/.test(value)) throw new InvalidArgumentError('Give an issue number.');
  return value;
}

// A list of issue numbers, such as 191,192.
function issueList(value: string): string[] {
  return value.split(',').map((part) => issueNumber(part.trim()));
}

// The exit code. argv is what follows lets backlog. providers lists the
// backlog providers lets ships.
export async function run(argv: string[], deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>, providers: Providers = PROVIDERS): Promise<number> {
  const print = (value: unknown) => deps.stdout(`${JSON.stringify(value)}\n`);
  // Read before parsing, so the help can name it; an error waits until a
  // command has parsed, so a usage error still exits 2.
  let selection: Selection | BacklogError;
  try {
    selection = await selectProvider(deps.io, deps.cwd, providers);
  } catch (error) {
    if (!(error instanceof BacklogError)) throw error;
    selection = error;
  }
  // The command's work, once its arguments parse. Its result is printed.
  let work: ((adapter: Adapter) => Promise<unknown>) | undefined;

  const program = new Command('lets backlog')
    .description('Read and claim work on the repository\'s backlog. Each command prints one JSON object.')
    .addHelpText('after', backlogHelp(selection))
    .exitOverride()
    .configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });
  const command = (name: string, summary: string) => program.command(name).summary(summary).description(`${summary[0].toUpperCase()}${summary.slice(1)}.`).exitOverride().configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });

  command('ready', 'list the ready issues, best first')
    .option('--only <issues>', 'keep only these issues, such as 191,192', issueList)
    .option('--exclude <issues>', 'leave these issues out, such as 149', issueList)
    .action(({ only, exclude }: { only?: string[]; exclude?: string[] }) => {
      work = async (adapter) => ({ issues: ready(await adapter.listCandidates(), { only, exclude }) });
    });
  command('item', 'read one issue, with its Project fields')
    .argument('<i>', 'the issue number', issueNumber)
    .action((issue: string) => {
      work = async (adapter) => itemView(await adapter.readItem(issue));
    });
  command('find', 'search the open issues\' titles')
    .argument('<words...>', 'the words to search for; a word that starts with -- is a word too')
    .allowUnknownOption()
    .action((words: string[]) => {
      work = async (adapter) => ({ issues: await adapter.searchTitles(words.join(' ')) });
    });
  command('claim', 'assign the issue to yourself and set it In Progress, when nobody has it')
    .argument('<i>', 'the issue number', issueNumber)
    .action((issue: string) => {
      work = (adapter) => claim(adapter, issue);
    });
  command('release', 'release the session identified by --claim')
    .argument('<i>', 'the issue number', issueNumber)
    .requiredOption('--claim <token>', 'the session token returned by claim')
    .action((issue: string, { claim: token }: { claim: string }) => {
      work = (adapter) => release(adapter, issue, token);
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
    if (selection instanceof BacklogError) throw selection;
    print(await work(await selection.provider.create(deps.io, deps.cwd)));
    return 0;
  } catch (error) {
    if (!(error instanceof BacklogError)) throw error;
    print({ error: error.code, message: error.message, ...error.extra });
    return 1;
  }
}
