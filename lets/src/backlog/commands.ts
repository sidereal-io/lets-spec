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
import { claim, complete, itemView, ready, release } from './policy.ts';
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
  key <text>         { key, label } when the text is one of the backlog
                     provider's keys, or { key: null, label: null }; it runs
                     no backend command. Put -- before text that starts with -.
An item's key names it in commands; its label is how the backlog writes it.
  claim <i>          { result: claimed, claim } | { result: taken, assignees }
                     | { result: failed, write: assign|claim|delete-claim|unassign|status, message, claim? }
  release <i> --claim <token>
                     { result: released } | { result: not-found }
                     | { result: failed, write: delete-claim|unassign|status, message }
  complete <i>       { result: completed } | { result: failed, message }
On an error: { error, message }, where error is no-backlog,
several-backlogs (with projects: [{ title, url }]), backend-failed, not-found
or unknown-backlog-provider.

Exit codes:
  0  a result, failed included: a failed write is a result to act on
  1  an error: the backlog cannot answer
  2  usage error`;

const SETTING = `backlog.provider in the lets config, $XDG_CONFIG_HOME/lets/config.yaml
or ~/.config/lets/config.yaml, chooses the backlog provider; it is github
when unset. A repository cannot set it yet.`;

// The help text lets help backlog prints.
export const BACKLOG_HELP = `
lets runs the backlog's commands itself. Run it from the repo.
${SETTING}
${HELP_BODY}`;

function backlogHelp(selection: Selection | BacklogError) {
  const line = selection instanceof BacklogError
    ? `The backlog provider cannot be used: ${selection.message}`
    : `The backlog provider is ${selection.name}, ${selection.set ? `set in ${selection.path}` : 'the default'}: ${selection.provider.description}.`;
  return `
lets runs the backlog's commands itself. Run it from the repo.
${line}
${SETTING}
${HELP_BODY}`;
}

// An item's key, as typed. Any text but the empty string: the backlog
// provider decides whether it is one of its keys.
function itemKey(value: string): string {
  if (value === '') throw new InvalidArgumentError('Give an item key.');
  return value;
}

// A list of item keys, such as 191,192. No backlog provider's key holds a
// comma.
function keyList(value: string): string[] {
  return value.split(',').map((part) => itemKey(part.trim()));
}

// The exit code. argv is what follows lets backlog. providers lists the
// backlog providers lets ships.
export async function run(argv: string[], deps: Pick<Deps, 'env' | 'io' | 'cwd' | 'stdout' | 'stderr'>, providers: Providers = PROVIDERS): Promise<number> {
  const print = (value: unknown) => deps.stdout(`${JSON.stringify(value)}\n`);
  // Read before parsing, so the help can name it; an error waits until a
  // command has parsed, so a usage error still exits 2.
  let selection: Selection | BacklogError;
  try {
    selection = selectProvider(deps, providers);
  } catch (error) {
    if (!(error instanceof BacklogError)) throw error;
    selection = error;
  }
  // The command's work, once its arguments parse. Its result is printed.
  // key is the command's item, once the backlog provider has parsed it.
  // keys parses a list of typed keys, and leaves out text that is not one.
  let work: ((adapter: Adapter, key: string, keys: (typed: string[]) => string[]) => Promise<unknown>) | undefined;
  // The item a command names, as typed, when it names one.
  let typed: string | undefined;
  // A command that needs only the backlog provider, not its adapter.
  let answer: ((selection: Selection) => unknown) | undefined;

  const program = new Command('lets backlog')
    .description('Read, claim and complete work on the repository\'s backlog. Each command prints one JSON object.')
    .addHelpText('after', backlogHelp(selection))
    .exitOverride()
    .configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });
  const command = (name: string, summary: string) => program.command(name).summary(summary).description(`${summary[0].toUpperCase()}${summary.slice(1)}.`).exitOverride().configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr });

  command('ready', 'list the ready issues, best first')
    .option('--only <keys>', 'keep only these items, such as 191,192', keyList)
    .option('--exclude <keys>', 'leave these items out, such as 149', keyList)
    .action(({ only, exclude }: { only?: string[]; exclude?: string[] }) => {
      work = async (adapter, _key, keys) => ({
        issues: ready(await adapter.listCandidates(), { only: only && keys(only), exclude: exclude && keys(exclude) }),
      });
    });
  command('item', 'read one issue, with its Project fields')
    .argument('<i>', 'the item\'s key, such as 136', itemKey)
    .action((text: string) => {
      typed = text;
      work = async (adapter, key) => itemView(await adapter.readItem(key));
    });
  command('find', 'search the open issues\' titles')
    .argument('<words...>', 'the words to search for; a word that starts with -- is a word too')
    .allowUnknownOption()
    .action((words: string[]) => {
      work = async (adapter) => ({ issues: await adapter.searchTitles(words.join(' ')) });
    });
  command('key', 'say whether the text is one of the backlog provider\'s keys')
    .argument('<text>', 'the text, such as 149; put -- before text that starts with -')
    .action((text: string) => {
      answer = ({ provider }) => provider.parseKey(text) ?? { key: null, label: null };
    });
  command('claim', 'assign the issue to yourself and set it In Progress, when nobody has it')
    .argument('<i>', 'the item\'s key, such as 136', itemKey)
    .action((text: string) => {
      typed = text;
      work = (adapter, key) => claim(adapter, key);
    });
  command('release', 'release the session identified by --claim')
    .argument('<i>', 'the item\'s key, such as 136', itemKey)
    .requiredOption('--claim <token>', 'the session token returned by claim')
    .action((text: string, { claim: token }: { claim: string }) => {
      typed = text;
      work = (adapter, key) => release(adapter, key, token);
    });
  command('complete', 'mark the item done on the backlog')
    .argument('<i>', 'the item\'s key, such as 136', itemKey)
    .action((text: string) => {
      typed = text;
      work = (adapter, key) => complete(adapter, key);
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error;
    return error.exitCode === 0 ? 0 : 2;
  }
  if (work === undefined && answer === undefined) {
    program.outputHelp({ error: true });
    return 2;
  }

  try {
    if (selection instanceof BacklogError) throw selection;
    if (answer !== undefined) {
      print(answer(selection));
      return 0;
    }
    // A key the backlog provider does not use names no item: not-found,
    // before the adapter is built, so no backend command runs.
    const { name, provider } = selection;
    const key = typed === undefined ? '' : provider.parseKey(typed)?.key;
    if (key === undefined) throw new BacklogError('not-found', `${typed} is not a key of the ${name} backlog provider, so it names no item.`);
    const keys = (texts: string[]) => texts.flatMap((text) => provider.parseKey(text)?.key ?? []);
    print(await work!(await provider.create(deps.io, deps.cwd), key, keys));
    return 0;
  } catch (error) {
    if (!(error instanceof BacklogError)) throw error;
    print({ error: error.code, message: error.message, ...error.extra });
    return 1;
  }
}
