// lets go step-prompt: print the prompt for one step of a lets-go run, or
// for an epic run's story run, from the values lets-go passes as flags. The
// text is the frame the lets-go skill used to copy by hand, so a slip in a
// copy can no longer change what a step does. It only prints: it runs no
// command but git rev-parse, and reads only whether the plain-language
// reference exists. No process access here; everything comes through deps.
import { join } from 'node:path';
import { findRepoRoot } from '../delegate/git.ts';
import { guarded } from '../delegate/guarded.ts';
import { STEP_STRATEGY_INTENTS, type StepStrategyIntent } from '../delegate/strategies.ts';
import type { Deps } from '../io.ts';
import { EXIT, UsageError } from '../resolvers/kit/errors.ts';
import { SKILLS_DST } from '../sync/release.ts';

export const PLAIN_LANGUAGE = join(SKILLS_DST, 'lets-shape', 'references', 'plain-language.md');

// Every flag but --for, in the order help and errors list them.
export const STEP_PROMPT_FLAGS = [
  'name', 'issue', 'issue-url', 'branch', 'idea', 'searched', 'parent', 'checkout',
  'schema', 'route', 'questions', 'blocker', 'blocker-branch', 'blocker-pr',
] as const;
export type StepPromptFlag = (typeof STEP_PROMPT_FLAGS)[number];
export type StepPromptOptions = { for?: string } & Partial<Record<StepPromptFlag, string | boolean>>;

const STACK: StepPromptFlag[] = ['blocker', 'blocker-branch', 'blocker-pr'];
const WALK: StepPromptFlag[] = ['name', 'issue', 'issue-url', 'schema', 'route', 'questions'];

// For each step, the flags it must have and the flags it may have. Shape's
// issue or idea is checked on its own, since it needs exactly one of them.
export const STEP_FLAGS: Record<StepStrategyIntent, { required: StepPromptFlag[]; allowed: StepPromptFlag[] }> = {
  shape: { required: ['branch', 'questions'], allowed: ['branch', 'questions', 'issue', 'issue-url', 'idea', 'searched'] },
  plan: { required: WALK, allowed: [...WALK, ...STACK] },
  'review-plan': { required: WALK, allowed: [...WALK, ...STACK] },
  build: { required: WALK, allowed: [...WALK, ...STACK] },
  'review-build': { required: WALK, allowed: [...WALK, ...STACK] },
  story: { required: [...WALK, 'parent', 'checkout'], allowed: [...WALK, 'parent', 'checkout', ...STACK] },
};

const SKILL: Record<Exclude<StepStrategyIntent, 'shape' | 'story'>, string> = {
  plan: 'lets-plan', 'review-plan': 'lets-review-plan', build: 'lets-build', 'review-build': 'lets-review-build',
};

const MODES = ['ask', 'auto'];

// The exit code: 0 the prompt is on stdout, 2 a usage error.
export function run(options: StepPromptOptions, deps: Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    const step = checkedStep(options);
    const value = (flag: StepPromptFlag) => options[flag] as string;
    const stack = STACK.every((flag) => options[flag] !== undefined)
      ? stackSection(value('name'), value('issue'), value('blocker'), value('blocker-branch'), value('blocker-pr'))
      : null;
    const prompt = step === 'story'
      ? storyPrompt(value, stack)
      : stepPrompt(step, value, stack, await plainLanguagePath(deps));
    deps.stdout(`${prompt}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}

// The step, once the flags fit it. Throws a UsageError that names the flag.
function checkedStep(options: StepPromptOptions): StepStrategyIntent {
  const steps = `give one of ${list(STEP_STRATEGY_INTENTS, 'or')}`;
  if (options.for === undefined) throw new UsageError(`--for is missing: ${steps}.`);
  const step = STEP_STRATEGY_INTENTS.find((name) => name === options.for);
  if (step === undefined) throw new UsageError(`--for ${options.for} is not a step: ${steps}.`);
  const given = STEP_PROMPT_FLAGS.filter((flag) => options[flag] !== undefined);
  const { required, allowed } = STEP_FLAGS[step];
  const extra = given.filter((flag) => !allowed.includes(flag));
  if (extra.length > 0) throw new UsageError(`--for ${step} does not take ${flags(extra, 'or')}.`);
  if (step === 'shape') {
    const issue = options.issue !== undefined;
    const idea = options.idea !== undefined;
    if (issue === idea) throw new UsageError(`--for shape takes exactly one of --issue and --idea, and got ${issue ? 'both' : 'neither'}.`);
    if (issue && options['issue-url'] === undefined) throw new UsageError('--issue needs --issue-url.');
    if (!issue && options['issue-url'] !== undefined) throw new UsageError('--issue-url needs --issue.');
    if (options.searched !== undefined && !idea) throw new UsageError('--searched needs --idea: only an idea is searched for.');
  }
  const missing = required.filter((flag) => options[flag] === undefined);
  if (missing.length > 0) throw new UsageError(`--for ${step} needs ${flags(missing, 'and')}.`);
  const mode = options.questions;
  if (!MODES.includes(mode as string)) throw new UsageError(`--questions ${mode} is not ask or auto.`);
  for (const flag of given) {
    if (flag !== 'idea' && typeof options[flag] === 'string' && /[\r\n]/.test(options[flag])) {
      throw new UsageError(`--${flag} holds a line break: give it on one line.`);
    }
  }
  const stack = STACK.filter((flag) => options[flag] !== undefined);
  if (stack.length > 0 && stack.length < STACK.length) {
    const absent = STACK.filter((flag) => options[flag] === undefined);
    throw new UsageError(`${flags(stack, 'and')} also need ${flags(absent, 'and')}: give all three stack flags, or none.`);
  }
  return step;
}

// The absolute path of the installed plain-language reference.
async function plainLanguagePath(deps: Pick<Deps, 'io' | 'cwd'>): Promise<string> {
  const root = await findRepoRoot(deps.cwd, deps.io);
  if (root === null) throw new UsageError(`${deps.cwd} is not in a git repository. Run lets go step-prompt from the repository.`);
  const path = join(root, PLAIN_LANGUAGE);
  if (!deps.io.exists(path)) throw new UsageError(`${path} is missing. Run lets sync to install the skills.`);
  return path;
}

function stepPrompt(step: Exclude<StepStrategyIntent, 'story'>, value: (flag: StepPromptFlag) => string, stack: string | null, plainLanguage: string): string {
  const parts = step === 'shape' ? shapeHead(value) : walkHead(step, value);
  if (stack !== null) parts.push(stack);
  parts.push(writing(plainLanguage), questions(value('questions')), REPORT);
  return parts.join('\n\n');
}

// The header lines and ## What to run of a walk step.
function walkHead(step: keyof typeof SKILL, value: (flag: StepPromptFlag) => string): string[] {
  const name = value('name');
  const issue = value('issue');
  return [
    `You run one step of a lets-go run: ${step}, for the change ${name}.\n` +
      `Issue: #${issue}, ${value('issue-url')}. Branch: ${name}. Schema: ${value('schema')}. ${value('route')}`,
    `## What to run\n\nInvoke the \`${SKILL[step]}\` skill for the change \`${name}\`, for issue #${issue}, and stop where it stops.`,
  ];
}

// The header lines and ## What to run of the shape step, for an issue or an
// idea. There is no change yet and Route has not run: no schema, no route.
function shapeHead(value: (flag: StepPromptFlag) => string): string[] {
  const branch = value('branch');
  const issue = value('issue');
  if (issue !== undefined) {
    return [
      `You run one step of a lets-go run: shape, for issue #${issue}.\nIssue: #${issue}, ${value('issue-url')}. Branch: ${branch}.`,
      `## What to run\n\nInvoke the \`lets-shape\` skill for issue #${issue}, and stop where it stops.`,
    ];
  }
  // A searched idea tells lets-shape to run no search of its own.
  const searched = (value('searched') as unknown) === true ? ' Open issues were searched, and none is the same work.' : '';
  return [
    `You run one step of a lets-go run: shape, for an idea.\nIssue: none yet. The idea is: ${value('idea')}. Branch: ${branch}.${searched}`,
    '## What to run\n\nInvoke the `lets-shape` skill for the idea above, and stop where it stops.',
  ];
}

function storyPrompt(value: (flag: StepPromptFlag) => string, stack: string | null): string {
  const name = value('name');
  const issue = value('issue');
  const path = value('checkout');
  const parts = [
    `You run a story run of a lets-go epic run: #${issue}, for the change ${name}, under #${value('parent')}.\n` +
      `Issue: #${issue}, ${value('issue-url')}. Branch: ${name}. Schema: ${value('schema')}. ${value('route')}`,
    `## What to run

Invoke the \`lets-go\` skill for this story run, and stop where it
stops. The epic run has already claimed #${issue}, routed it and checked
the branch \`${name}\` out in the worktree \`${path}\`, which is your
checkout and repository root. Claim nothing, route nothing, stay on
\`${name}\`, and work only in \`${path}\`. Walk the step table, and run
each step that is not done.`,
  ];
  if (stack !== null) parts.push(stack);
  parts.push(`## Questions

The question mode is ${value('questions')}. The epic run applies it, so answer no
step's question yourself, at either mode. Pass each question up in
your report, with the step's recommendation. Never ask the user in
this session: nobody here can answer.`, STORY_REPORT);
  return parts.join('\n\n');
}

// The one copy of ## Stack, for every step of a stacked story and its
// story prompt, so a step resumed after needs-input still sees it.
function stackSection(name: string, issue: string, blocker: string, branch: string, pr: string): string {
  return `## Stack

This change is stacked on #${blocker}: its branch starts from
\`${branch}\`, the branch of pull request #${pr}. Open the
draft pull request with \`--base ${branch}\`, and put the line
\`Stacked on #${pr}; merge that first.\` on its own line after
\`Closes #${issue}\` in its description. If the pull request exists with
another base, fix it with \`gh pr edit ${name} --base ${branch}\`.`;
}

function writing(plainLanguage: string): string {
  return `## Writing

Plain-language method: ${plainLanguage}.
Write for the people and agents who need this result. Give them enough
context to find the relevant information, understand it and take the
next action. Preserve exact report keys, markers and allowed values.
Make evidence, reasons and questions clear without changing permissions.`;
}

function questions(mode: string): string {
  return `## Questions

The question mode is ${mode}. At auto, the lets-go session answers each
question that has a recommendation, tells the user what it chose, and
asks the user the rest. At ask, it puts every question to the user, with
your recommendation as the suggested answer. Your rules are the same in
both modes. Never decide a question yourself. Never ask the user in this
session: nobody here can answer.

When you need a decision, stop. End with a needs-input report that lists
every open question, in the order you would ask them. Give a
recommendation where you have one. Give none for a question that asks
the user to confirm something, such as a brainstorm ledger, an issue
packet or a discovery phase.

A resumed step ends with an \`## Answers\` section. Each answer settles its
question, so never ask it again. An answer that ends with "(lets-go
accepted the step's recommendation; the user did not decide)" is not the
user's: record it as Assumption in a brainstorm ledger. Record any other
answer as User. An answer of yes to the confirmation question confirms
the ledger: the brainstorm may set \`Confirmed by user: yes\`.`;
}

const REPORT = `## The report

End your final message with a step report: a fenced block tagged
step-report, holding one YAML mapping. Use one of these three:

\`\`\`step-report
outcome: done
evidence:
  - "commit 3f2a1c0: feat: add the thing"
  - "pull request #12"
\`\`\`

\`\`\`step-report
outcome: needs-input
questions:
  - question: Which schema should the change use?
    recommendation: lets-minimal
  - question: Do you confirm the ledger?
\`\`\`

\`\`\`step-report
outcome: failed
reason: The tests fail on main before any change.
\`\`\`

A done report's evidence lists the commits you made, and the pull request
when you opened or changed it. For shape, its first line is the issue,
as \`issue #<i>: <title>\`, or the parent, as \`epic #<parent>: <title>\`,
with a \`story #<story>: <title>\` line for each story, in the order
discovery created them. When the parent became the one story, use the \`issue\`
form. For review plan,
its first line is the verdict and the commit reviewed, as
\`Plan review: <verdict> for <sha>\`. Write the report last. Quote a line that
holds \`#\` or \`: \`. Put no other step-report block in the message.`;

const STORY_REPORT = `## The report

End your final message with one step report: a fenced block tagged
step-report, holding one YAML mapping, as lets-go says for a story
run's child. Its outcome is done, with the pull request as its first
evidence line; needs-input, with the step's questions; or failed,
with the reason.`;

function flags(names: readonly string[], conjunction: string): string {
  return list(names.map((name) => `--${name}`), conjunction);
}

function list(items: readonly string[], conjunction: string): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`;
}
