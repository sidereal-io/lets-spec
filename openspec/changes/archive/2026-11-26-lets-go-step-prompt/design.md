## Context

- `skills/lets-go/references/step-prompt.md` holds the step prompt frame: one four-backtick block, plus the rules that pick the header lines, the `## What to run` sentence, and the `## Stack` section. `references/epic-run.md`, in *Start the story run*, holds a second frame for the story prompt. It reuses the step prompt's `## Stack` text by a link.
- `lets go` has one subcommand today, `questions`, in `lets/src/go/questions.ts`. Its pattern is the one to follow: a `run(options, deps)` function that takes everything through `Deps`, wrapped in `guarded(deps, fn, 'lets go: ')`, which turns a thrown `UsageError` into exit 2 and one stderr line.
- `lets/src/delegate/strategies.ts` already lists the step names and `story` as `STEP_STRATEGY_INTENTS`. `findRepoRoot` in `lets/src/delegate/git.ts` runs `git rev-parse --show-toplevel` and answers `null` outside a repository.
- `lets sync` installs skills to `.agents/skills`, the `SKILLS_DST` constant in `lets/src/sync/release.ts`. An epic run prepares each story's worktree so that this folder is there too.
- `tests/contracts/commands.test.ts` checks every `lets` command and flag that a skill names against `--help`. `tests/contracts/links.test.ts` checks every link in a skill. Both run on `skills/`, so the skill edits get these checks for free.
- Sibling stories #346 (`lets go records`) and #348 (`lets go shape-name`) add `lets go` subcommands to the same command list in `lets/src/main.ts`. Neither has merged.

## Goals / Non-Goals

**Goals:**
- `lets go step-prompt` prints, for each step and for the story prompt, the same text that a careful hand fill of today's frames gives (D5).
- One copy of each shared part of the text: the `## Stack` section, shared by the step prompts and the story prompt, and `## Writing`, `## Questions` and `## The report`, shared by the step prompts. The story prompt keeps its own, shorter `## Questions` and `## The report`, as in today's *Start the story run* frame.
- `lets-go` calls the command in two places, *Run a step* and *Start the story run*, and holds no frame.

**Non-Goals:**
- Changing any prompt's wording, or what a step does with it.
- Looking up anything the caller already holds: the issue, its URL, the default branch, the route, or the question mode.
- Writing the prompt file. `lets-go` redirects stdout (D2).
- Appending the `## Answers` section. `lets delegate step run --answers-file` does that, as today.

## Test Seams

- **Primary test seam:** `lets` run as a program, through `tests/support/lets.ts`, in a temporary git repository. A new `tests/go/step-prompt.test.ts` drives each `--for` value and each usage error, and reads stdout, stderr and the exit code. The spec's scenarios map onto it one to one.
- **Existing seams reused:** `tests/delegate/repo.ts` (`delegateRepo`, including its `notInRepo` option) for the repository and stand-ins; `tests/contracts/commands.test.ts` and `tests/contracts/links.test.ts` for the skill text. The `lets-go` requirements that read the skill are checked by those contract tests and by review, as today.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. It adds a new command contract that every `lets-go` step depends on, but follows the `lets go questions` pattern and crosses no trust boundary.
- **Blast radius:** `lets/src/go/`, the `go` command list and help in `lets/src/main.ts`, and `skills/lets-go/` (`SKILL.md`, `references/epic-run.md`, `references/story-run.md`, `references/shape.md`; `references/step-prompt.md` removed). Every lets-go run builds its prompts through the new command, so a wrong prompt affects every step.

## Decisions

### The text lives in `lets/src/go/step-prompt.ts` as code

The frames become functions in one module. A header function gives the first two lines for each form: walk step, shape for an issue, shape for an idea, and story. Constants hold the step prompts' `## Writing` (with the path filled in), `## Questions` and `## The report`. Two more constants hold the story prompt's own `## Questions` and `## The report`, from `references/epic-run.md`; the story prompt does not use the step prompts' versions. A single `stackSection()` builds `## Stack` for both the step prompts and the story prompt. So the spec's "same text in every prompt of the story" holds by construction. The `## What to run` sentence comes from a map from step to skill: `plan` to `lets-plan`, `review-plan` to `lets-review-plan`, `build` to `lets-build`, `review-build` to `lets-review-build`.

Alternative: ship the frames as Markdown files in the `lets` package and fill `<...>` at run time. Rejected: a second place for text with its own lookup path, and a placeholder engine for about ten values.

### One table says which flags each step takes

Commander declares every flag once on `go step-prompt`, as an optional string, and `--searched` as a boolean. `run()` then checks the flags against a table in `step-prompt.ts`: for each `--for` value, the flags it requires and the flags it allows. A flag outside the allowed set, a missing required flag, a partial stack, `--issue` without `--issue-url`, `--searched` without `--idea`, both or neither of `--issue` and `--idea` for shape, a `--questions` value other than `ask` or `auto`, or a line break in a value other than `--idea`, each throws a `UsageError` that names the flag. `guarded` prints it as `lets go: <message>` and exits 2. Commander's own errors, such as an unknown flag, already exit 2.

`--for` takes `STEP_STRATEGY_INTENTS`, the same list as `lets delegate step --for`, so the two commands cannot disagree on step names.

Alternative: one subcommand per step, as in `lets go step-prompt plan`, so that commander checks the required flags. Rejected: it breaks the `--for <step>` form that `lets delegate step` uses. It would also need six help texts.

### The plain-language path comes from the repository root

`run()` calls `findRepoRoot(deps.cwd, deps.io)` and joins `.agents/skills/lets-shape/references/plain-language.md`, built from `SKILLS_DST`. When the root is `null`, it throws a `UsageError` saying the folder is not in a git repository. When `deps.io.exists(path)` is false, it throws one that names the path and says to run `lets sync`. It does both only for the prompts that hold `## Writing`, so `--for story` runs without the file. It uses `findRepoRoot`, not `repoRoot`, because `repoRoot`'s message names `lets delegate`.

### Values go in as given

`--issue` is the key as `lets backlog` prints it, and the prompt writes `#<i>`, as the frame does today. ADR-025 keeps keys opaque, so the command does not check the key's form. On a backlog whose label is not `#` and the key, such as `PROJ-12`, the prompt would read `#PROJ-12`. Today's frame does the same, and D5 keeps the text, so this change leaves it. `--route` and `--idea` go in word for word. The command adds nothing to a value except the frame's own text around it.

### The prompt ends with one newline

Stdout is the prompt text and exactly one final newline, so `> <file>` gives the same file a hand copy gave.

### `--questions` names the setting

The flag is `--questions`, after `go.questions` and `lets go questions`, not `--mode`. The value is the same word that `lets go questions` prints.

### The skill keeps the call and the stacking rule, nothing else

*Run a step*, step 1, becomes: create `.workspace/lets-go`, then run `lets go step-prompt --for <step>` with the values for this step, sending stdout to `.workspace/lets-go/<session>-prompt.md` through a `.new` file that moves into place only on exit 0. A failed command then leaves an earlier round's prompt as it was, which the shape step reads to tell one idea from another (code review finding 2). Its text lists which values each kind of step passes, and states the stacking rule that `step-prompt.md` held (D4): pass the three stack flags on every step of a stacked story, and say when a story is stacked. On a non-zero exit, `lets-go` removes the `.new` file, shows stderr, names the step and stops. *Start the story run*, step 1, runs `lets go step-prompt --for story` the same way. Links to *Write the prompt* in `SKILL.md`, `shape.md`, `story-run.md` and `epic-run.md` point at *Run a step* instead: `#run-a-step` within `SKILL.md`, and `../SKILL.md#run-a-step` from the reference files. The placeholder table drops `<skill>`, `<plain-language-path>` and `<the sentence above>`, which only the frame used.

The skill tells `lets-go` to quote each value for the shell. A route line holds `#` and spaces, and an idea can hold any character.

### No decision record

This change applies epic #263's shared decision to move fixed algorithms from the skill into `lets`. It makes no new decision that is costly to reverse: the command is internal to the `lets-go` skill and the `lets` release that ships with it, and a revert restores the frame.

## Risks / Trade-offs

- [The command's text drifts from today's frames in a word or a blank line, which D5 forbids] → The build fills the old frames by hand for a plan prompt, a stacked build prompt, both shape forms and a stacked story prompt, from `git show main:skills/lets-go/references/step-prompt.md` and `references/epic-run.md`, and diffs each against the command's output. The diff must be empty. This is a one-time check in `.workspace/`, not a permanent test, because D7 keeps wording out of the tests.
- [A value with a quote, `$` or a backtick breaks the shell command `lets-go` writes] → The skill says to quote each value for the shell. A line break in any value but the idea exits 2, so a broken quote shows up as an error, not a silent wrong header.
- [This repository's own `lets-go` runs the pinned release, whose skill still holds the frame] → Expected. The skill and `lets` ship in the same release, so a project never has the new skill with an old `lets`.
- [#346 or #348 merges first and conflicts in the `go` command list in `lets/src/main.ts`] → The conflict is a few lines. Resolve it on rebase by keeping every subcommand.

## Migration & Rollback

N/A. Nothing persistent changes shape. Rollback is a revert of the pull request, which restores `references/step-prompt.md` and the story frame.
