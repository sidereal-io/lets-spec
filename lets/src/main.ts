// The real entry: the commander program. Builds deps from the real world for
// a command, and exits with its code. Exits 2 on a usage error, such as an
// unknown flag or command.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command, CommanderError, InvalidArgumentError, Option } from 'commander';
import { BACKLOG_HELP, run as backlog } from './backlog/commands.ts';
import { run as handoff } from './delegate/handoff.ts';
import type { HandoffOptions } from './delegate/handoff.ts';
import { run as instructions } from './delegate/instructions.ts';
import { EFFORTS, FAMILIES, parseModel } from './resolvers/kit/families.ts';
import { run as review } from './delegate/review.ts';
import type { ReviewOptions } from './delegate/review.ts';
import { start as stepStart, wait as stepWait } from './delegate/background.ts';
import type { StartOptions } from './delegate/background.ts';
import { run as step, STEP_TIMEOUT_MINUTES, STORY_TIMEOUT_MINUTES } from './delegate/step.ts';
import type { StepOptions } from './delegate/step.ts';
import { STRATEGIES } from './delegate/strategies.ts';
import { run as questions } from './go/questions.ts';
import { run as shapeName } from './go/shape-name.ts';
import type { ShapeNameOptions } from './go/shape-name.ts';
import type { Intent, Strategy } from './delegate/strategies.ts';
import { realIo } from './io.ts';
import type { Deps } from './io.ts';
import { createAdapter as cli } from './resolvers/cli/cli.ts';
import { realIo as realResolverIo } from './resolvers/kit/io.ts';
import { createAdapter as subagent } from './resolvers/subagent/subagent.ts';
import { createAdapter as t3 } from './resolvers/t3/t3.ts';
import { run as sync } from './sync/main.ts';

// The folder above the one that holds this file: lets/ in the repo, and the
// release folder once bundled into bin/lets.
const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const SYNC_HELP = `
Keeps the lets-spec rules in a marked block of AGENTS.md: creates
AGENTS.md with only the block when it is missing, appends the block when
AGENTS.md lacks it, and rewrites the block when it is out of date. The
project owns the rest of the file, and commits the block with it.

Creates each other file the project owns when it is missing:
openspec/config.yaml from the release's template, and the CLAUDE.md and
.claude/skills links. It never edits one that exists, and names each file
it creates or changes.

Copies each skill into .agents/skills, and each schema into openspec/schemas.
With LETS_SPEC_SKILLS=committed, the default, the project commits them.
With LETS_SPEC_SKILLS=ignored, lets sync keeps a block in .gitignore that
ignores them.

Then it warns if:
- the rules block in AGENTS.md has a marker without its pair
- openspec/config.yaml is invalid, or names a schema other than the release's
  default
- CLAUDE.md is not a link to AGENTS.md, or .claude/skills is not a link to
  ../.agents/skills

It prints nothing when all is well, and exits 0 even when it warns, so a
problem never stops the shell from starting.

With --check, it changes nothing, and exits 1 if the rules block in
AGENTS.md is missing or out of date. With LETS_SPEC_SKILLS=committed, it
also exits 1 if a copied skill differs from the release, or .gitignore
still has the skills block. With LETS_SPEC_SKILLS=ignored, it exits 1 if
.gitignore lacks a current skills block. Run it in CI.

WORKFLOW_RELEASE names the release folder. Without it, LETS_SPEC_FLOW
(default standard) picks one of the releases that ship with lets.
The Nix wrapper sets WORKFLOW_RELEASE.`;

const DELEGATE_HELP = `
Each delegation has a strategy and an intent. The strategy is how the
session runs: review runs it read-only and waits for its answer, handoff
starts an interactive session and returns at once, and step runs a session
that may write files and waits for its step report. The intent is what it
is for: plan or code for a review, apply for a handoff, and one of the five
steps, or story for a story run, for a step. Each strategy has two
commands: instructions says what can run and gives the user's guidance,
and run runs it.

A resolver turns each request into a real session. Three are built into
lets: t3 starts sessions in T3 Code, cli runs a family's CLI headless, and
subagent, the default, starts none. lets asks each resolver your config
lists under delegate.resolvers, in order, and stops at the first that does
not decline. Nothing is run from PATH.

The config is two files, which take the same keys. The user's lets config
is $XDG_CONFIG_HOME/lets/config.yaml, or ~/.config/lets/config.yaml when
XDG_CONFIG_HOME is unset or empty. The repository's lets config is
.lets/config.yaml at the repository root. The repository's value wins, leaf
by leaf: mappings merge, and any other value, such as the delegate.resolvers
list, replaces the user's whole. A null or absent key keeps the user's
value. You write both by hand:

  version: 3
  delegate:
    resolvers:
      - t3
      - subagent
    review:
      code:
        guidance: Prefer the strongest gpt model.
    handoff:
      apply:
        guidance: Prefer claude.
    step:
      build:
        guidance: Prefer claude/claude-opus-5-5.

Each entry under delegate.resolvers is t3, cli or subagent. With no
config, or no delegate.resolvers, only subagent is asked. It starts no
session: a review exits 3, a handoff gives back the prompt to carry on by
hand, and a step saves the prompt and exits 3, for a subagent to run it.

review, handoff and step are optional. delegate.<strategy>.<intent>.guidance is
prose that the skill reads to rank the models; only instructions reads it.

Run lets delegate from the repo root.`;

const REVIEW_HELP = `
stdout: the session's final message.
stderr: one JSON line with for, resolver, family, model, independent,
handle, checkout, commit, gitClean and durationSeconds. for is the intent
--for gave. independent is true when the family that answered is not the
source family. checkout is the checkout the session ran in, and commit the
full hash at its HEAD after the session; each is null when lets cannot
tell.

--model may be given more than once, best first. When the resolver
refuses a model, lets asks the same resolver for the next one.

Exit codes:
  0  the final message is on stdout
  2  usage error, or every resolver in the config declined
  3  no fresh session can run here on any model given: the harness or the
     account said no before the model gave any output. The harness is not
     running or not set up, there are no tokens left, it cannot run the
     model, or no resolver started a session. stderr names each model and
     why.
  4  the outcome is unknown, such as no reply from the harness, or the
     resolver failed in a way it could not report
  5  the session failed: an error, it stopped to ask, or an empty message
  6  the session did not finish in time
  7  the session changed files outside .workspace/`;

const HANDOFF_HELP = `
stdout: one JSON line, { resolver, handle }. When no session could be
started, handle is null and instructions holds the text to show the user.

--model may be given more than once, best first. When the resolver
refuses a model, lets asks the same resolver for the next one.

Exit codes:
  0  ok
  2  usage error, or every resolver in the config declined
  3  no fresh session can run here on any model given: the harness or the
     account said no. stderr names each model and why.
  4  the outcome is unknown: the session could not start, or the harness
     did not answer`;

const STEP_STRATEGY_HELP = `
The intents are the five steps: shape, plan, review-plan, build and
review-build. The intent story runs a story run, not a step: a child
lets-go session that walks one story's steps and ends with a step report.`;

const STEP_HELP = `
The session ends its final message with a step report: a fenced block
tagged step-report, holding YAML. outcome is done, with evidence, a list of
lines; needs-input, with questions, each with question, an optional
recommendation and an optional ask: true, which marks a question to put to
the user whatever the question mode; or failed, with reason. lets keeps
"ask":true on the question it prints, and drops ask: false.

stdout: the report as one JSON line, outcome first. lets adds date to a
done report. A final message with no valid report is a failed report whose
reason says what is wrong, and whose message holds the final message.
stderr: one JSON line with for, resolver, family, model, handle and
durationSeconds. handle is null when the session failed before it gave a
final message.

A step has ${STEP_TIMEOUT_MINUTES} minutes and a story ${STORY_TIMEOUT_MINUTES}, unless --timeout-minutes says
otherwise.

--answers-file resumes a step that reported needs-input: a YAML list of
question and answer pairs, which lets appends to the prompt. Give the same
--prompt-file as before.

--model may be given more than once, best first. When the resolver
refuses a model, lets asks the same resolver for the next one.

lets does not check the tree after a step: a step may change files.

Exit codes:
  0  a step report is on stdout, whatever its outcome
  2  usage error, or every resolver in the config declined
  3  no fresh session can run here on any model given: the harness or the
     account said no before the model gave any output, or no resolver
     started a session. stderr names each model and why.
  4  the outcome is unknown, such as no reply from the harness, or the
     resolver failed in a way it could not report
  6  the session did not finish in time`;

const STEP_START_HELP = `
Starts lets delegate step run with the same options in the background, and
returns at once. The step runs in the repository root of --checkout, or of
the working directory when there is no --checkout. Its stdout, the step
report, goes to --report-file, and its stderr, the record line, to
--meta-file. Relative paths are read from the working directory.

stdout: one JSON line, { name, pid }: the normalized --name, and the id of
the background process.

lets delegate step wait --name <name> tells when the step ends, and gives
the exit code lets delegate step run ended with. A name cannot start again
while its step runs.

Exit codes:
  0  the step has started
  2  usage error, such as a missing option, a file that cannot be read, or
     a name whose step still runs. stderr names it. Nothing starts.
  4  the background process could not start`;

const STEP_WAIT_HELP = `
Waits until one of the background steps that --name names has ended. Give
--name once for each step, as lets delegate step start was given it, from
the same repository root.

stdout: one JSON line, { name, exit }: the step that ended first, and the
exit code lets delegate step run ended with. At exit 0, the step's report
is in the report file lets delegate step start was given, and the meta
file holds its record line. At any other code, the meta file says why. A
step whose process ended without an exit code, such as one that was
killed, counts as exit 4.

With no --timeout-minutes, it waits as long as it takes.

Exit codes:
  0  a step has ended, and stdout names it
  2  usage error, such as no --name, or a name that lets delegate step start
     did not start here. stderr names it.
  6  none of the steps ended within --timeout-minutes. Each still runs.`;

const INSTRUCTIONS_HELP = `
stdout: one JSON line with strategy, for, resolver, options and guidance.
resolver and options come from the first resolver that does not decline
this strategy: options are the models it can run now, in its order.
guidance is delegate.<strategy>.<intent>.guidance from the config, or null.
It starts no session.

Exit codes:
  0  ok
  2  usage error, or every resolver in the config declined. A guidance
     that is not a string is a usage error.
  4  the outcome is unknown, such as no reply from the harness`;

const GO_QUESTIONS_HELP = `
Reads go.questions from the lets config, which is two files: the user's
config.yaml, $XDG_CONFIG_HOME/lets/config.yaml, or ~/.config/lets/config.yaml
when XDG_CONFIG_HOME is unset or empty, and the repository's
.lets/config.yaml at the repository root. The repository's value wins, leaf
by leaf. go.questions is ask or auto:

  version: 3
  go:
    questions: auto

lets-go uses it in place of the Kind's default. A question mode named in
the request still wins. lets go questions reads only version and go, and
starts no session.

stdout: one JSON line, { questions }. questions is null when there is no
config, no go or no go.questions.

Exit codes:
  0  ok
  2  the config is not valid, go is not a mapping, or go.questions is not
     ask or auto. stderr names the file and the key.`;

const GO_SHAPE_NAME_HELP = `
Names lets-go's shape step for one input, so the skill builds no name of
its own. Give exactly one of --issue and --idea.

For --issue <i>, the name is issue-<i>, with the key unchanged: only the
backlog provider reads a key.

For --idea <text>, the name is idea-<slug>-<hash>. The idea is cleaned
into words: split on white space, lower-cased, only letters and digits in
any script kept, and empty words dropped. <slug> is the first five words
joined with hyphens, cut to 50 code points. <hash> is the first 8
hexadecimal digits of the SHA-256 of all the words joined with spaces. An
idea retyped in another case or with other punctuation gets the same name.

It reads no file, starts no session and asks no resolver, so the same
input always gives the same line, in any folder.

stdout: one JSON line, { name, answers }. name is the shape step's name.
answers is .workspace/lets-go/<name>-shape-answers.yaml, the step's
answers file, relative to the repository root.

Exit codes:
  0  ok
  2  an idea with no letter or digit in any script`;

// --timeout-minutes: a whole number of minutes.
function wholeMinutes(value: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) throw new InvalidArgumentError('Give a whole number of minutes.');
  return Number(value);
}

// --model: <family> or <family>/<model>, passed to the resolver unchanged.
function modelString(value: string): string {
  if (parseModel(value) === null) throw new InvalidArgumentError(`Give <family> or <family>/<model>, for a family of ${FAMILIES.join(', ')}.`);
  return value;
}
// --model, given one or more times, best first.
const modelOption = () => new Option('--model <family[/model]>', 'a model to run, such as gpt/gpt-6-luna, or a bare family for the harness\'s default; repeat it to rank more, best first')
  .argParser((value: string, previous: string[] = []) => [...previous, modelString(value)]).makeOptionMandatory();

// --for: what the delegation is for, one of the strategy's intents.
const forOption = (strategy: Strategy) => new Option('--for <intent>', 'what the delegation is for')
  .choices(STRATEGIES[strategy].intents).makeOptionMandatory();

// The release's version from its release.json, else 0.0.0-dev.
function version(): string {
  try {
    const release = JSON.parse(readFileSync(join(packageRoot, 'release.json'), 'utf8'));
    return typeof release.version === 'string' ? release.version : '0.0.0-dev';
  } catch {
    return '0.0.0-dev';
  }
}

function realDeps(): Deps {
  // Building an adapter does no I/O, so a command that asks none costs nothing.
  const resolverIo = realResolverIo();
  return {
    env: process.env,
    cwd: process.cwd(),
    packageRoot,
    resolvers: { t3: t3(resolverIo), cli: cli(resolverIo), subagent: subagent(resolverIo) },
    io: realIo(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

const program = new Command()
  .name('lets')
  .description('The lets-spec command.')
  .version(version())
  .exitOverride();

program
  .command('sync')
  .usage('[--check]')
  .summary('set up a project for lets-spec, and keep it set up')
  .description('Set up a project for lets-spec, and keep it set up. The dev shell runs it each time it starts, and it is safe to run any number of times.')
  .option('--check', 'change nothing, and exit 1 if the project is out of date')
  .addHelpText('after', SYNC_HELP)
  .action(async ({ check }: { check?: boolean }) => {
    process.exitCode = await sync({ check: check === true }, realDeps());
  });

const delegate = program
  .command('delegate')
  .summary('run a prompt in a fresh session, through a resolver')
  .description('Run a prompt in a fresh session. A resolver makes the session; lets checks the result.')
  .addHelpText('after', DELEGATE_HELP);

// A strategy: a command that only holds instructions and run.
function strategyCommand(strategy: Strategy, summary: string) {
  const command = delegate.command(strategy).summary(summary).description(`${summary[0].toUpperCase()}${summary.slice(1)}.`);
  command
    .command('instructions')
    .summary('say what can run, and the user\'s guidance')
    .description('Ask the resolvers which models can run now, and give the user\'s guidance for the intent. Starts no session.')
    .addOption(forOption(strategy))
    .addHelpText('after', INSTRUCTIONS_HELP)
    .action(async ({ for: intent }: { for: Intent }) => {
      process.exitCode = await instructions({ strategy, for: intent }, realDeps());
    });
  return command;
}

strategyCommand('review', 'run a prompt in a fresh, read-only session and wait for its answer')
  .command('run')
  .summary('run the review')
  .description('Run a prompt in a fresh, read-only session on the first model --model names that is not refused, and wait for its final message.')
  .addOption(forOption('review'))
  .requiredOption('--name <name>', 'a label for the session, normalized to lowercase kebab-case')
  .requiredOption('--prompt-file <path>', 'the file that holds the prompt')
  .addOption(new Option('--source-family <family>', 'the model family that wrote the work').choices(FAMILIES).makeOptionMandatory())
  .addOption(new Option('--effort <effort>', 'how hard the session thinks').choices(EFFORTS).makeOptionMandatory())
  .addOption(modelOption())
  .option('--timeout-minutes <minutes>', 'how long to wait (default: 30, or 45 with --effort high)', wholeMinutes)
  .addHelpText('after', REVIEW_HELP)
  .action(async ({ model, ...options }: Omit<ReviewOptions, 'models'> & { model: string[] }) => {
    process.exitCode = await review({ ...options, models: model }, realDeps());
  });

strategyCommand('handoff', 'start a fresh, interactive session and return at once')
  .command('run')
  .summary('start the session')
  .description('Start a fresh, interactive session with a prompt, on the first model --model names that is not refused, and return at once.')
  .addOption(forOption('handoff'))
  .requiredOption('--name <name>', 'a label for the session, normalized to lowercase kebab-case')
  .requiredOption('--prompt-file <path>', 'the file that holds the prompt')
  .addOption(modelOption())
  .addHelpText('after', HANDOFF_HELP)
  .action(async ({ model, for: _intent, ...options }: Omit<HandoffOptions, 'models'> & { model: string[]; for: Intent }) => {
    process.exitCode = await handoff({ ...options, models: model }, realDeps());
  });

// The options of step run, which step start takes too.
const stepRunOptions = (command: Command) => command
  .addOption(forOption('step'))
  .requiredOption('--name <name>', 'a label for the session, normalized to lowercase kebab-case')
  .requiredOption('--prompt-file <path>', 'the file that holds the prompt')
  .addOption(new Option('--effort <effort>', 'how hard the session thinks').choices(EFFORTS).makeOptionMandatory())
  .addOption(modelOption())
  .option('--timeout-minutes <minutes>', `how long to wait (default: ${STEP_TIMEOUT_MINUTES} for a step, ${STORY_TIMEOUT_MINUTES} for a story)`, wholeMinutes)
  .option('--answers-file <path>', 'the answers to the last report\'s questions, as a YAML list of question and answer pairs');

const stepCommand = strategyCommand('step', 'run a step in a fresh session that may write files, and read its step report')
  .addHelpText('after', STEP_STRATEGY_HELP);

stepRunOptions(stepCommand
  .command('run')
  .summary('run the step')
  .description('Run a prompt in a fresh session that may write files, on the first model --model names that is not refused, wait for its final message, and print its step report.'))
  // lets delegate step start gives it; a person never needs it.
  .addOption(new Option('--exit-file <path>', 'where to record the exit code').hideHelp())
  .addHelpText('after', STEP_HELP)
  .action(async ({ model, ...options }: Omit<StepOptions, 'models'> & { model: string[] }) => {
    process.exitCode = await step({ ...options, models: model }, realDeps());
  });

stepRunOptions(stepCommand
  .command('start')
  .summary('run the step in the background, and return at once')
  .description('Run lets delegate step run in the background, with the same options, and return at once.'))
  .option('--checkout <path>', 'the checkout to run the step in (default: the working directory\'s)')
  .requiredOption('--report-file <path>', 'the file that takes the step\'s report, its stdout')
  .requiredOption('--meta-file <path>', 'the file that takes the step\'s record line, its stderr')
  .addHelpText('after', STEP_START_HELP)
  .action(async ({ model, ...options }: Omit<StartOptions, 'models'> & { model: string[] }) => {
    process.exitCode = await stepStart({ ...options, models: model }, realDeps());
  });

stepCommand
  .command('wait')
  .summary('wait for the next background step to end')
  .description('Wait until the next of the background steps --name names ends, and say which one it was.')
  .addOption(new Option('--name <name>', 'a background step lets delegate step start started; repeat it for each step')
    .argParser((value: string, previous: string[] = []) => [...previous, value]).makeOptionMandatory())
  .option('--timeout-minutes <minutes>', 'how long to wait (default: no limit)', wholeMinutes)
  .addHelpText('after', STEP_WAIT_HELP)
  .action(async ({ name, timeoutMinutes }: { name: string[]; timeoutMinutes?: number }) => {
    process.exitCode = await stepWait({ names: name, timeoutMinutes }, realDeps());
  });

const go = program
  .command('go')
  .summary('settings for the lets-go skill')
  .description('Read the settings the lets-go skill uses.');

go
  .command('questions')
  .summary('print the default question mode')
  .description('Print the default question mode, from go.questions in the lets config.')
  .addHelpText('after', GO_QUESTIONS_HELP)
  .action(async () => {
    process.exitCode = await questions(realDeps());
  });

go
  .command('shape-name')
  .usage('--issue <i> | --idea <text>')
  .summary('print the shape step\'s name and answers file')
  .description('Print the name of lets-go\'s shape step for an issue or an idea, and the path of its answers file.')
  .option('--issue <i>', 'the issue\'s key, as lets backlog prints it')
  .option('--idea <text>', 'the idea in the user\'s words')
  .addHelpText('after', GO_SHAPE_NAME_HELP)
  .action(async (options: ShapeNameOptions) => {
    process.exitCode = await shapeName(options, realDeps());
  });

// lets backlog parses its own arguments, so its help and usage errors come
// from the same place its tests drive. The entry below hands it every word
// after backlog before the root parser runs, so a word such as --version or
// -- is a search word; this registration only lists it in lets --help.
program
  .command('backlog')
  .summary('read and claim work on the repository\'s backlog')
  .description('Read, claim and complete work on the repository\'s backlog: ready, item, find, key, claim, release and complete. Each prints one JSON object.')
  .usage('<ready|item|find|key|claim|release> [args]')
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .argument('[args...]')
  .addHelpText('after', BACKLOG_HELP)
  .action(async () => {
    process.exitCode = await backlog(process.argv.slice(3), realDeps());
  });

if (process.argv[2] === 'backlog') {
  process.exitCode = await backlog(process.argv.slice(3), realDeps());
} else {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error;
    process.exitCode = error.exitCode === 0 ? 0 : 2;
  }
}

// The command has answered, so exit once its output is written. A WebSocket
// closed while its server stays silent would otherwise hold the process open
// until the server answers the close.
await Promise.all([process.stdout, process.stderr].map((stream) => new Promise((written) => stream.write('', written))));
process.exit();
