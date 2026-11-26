## Why

For every step, `lets-go` copies a 70-line prompt frame from `references/step-prompt.md` and fills its blanks by hand. A slip in that copy changes what the step does. In #308's epic run, `lets-go` wrote twelve prompts this way, and the frame had to be written again when its copy was lost. Epic #263 moves fixed algorithms like this one out of the skill and into `lets`.

## What Changes

- New command `lets go step-prompt`. It prints a step's prompt as plain text on stdout (D2). It covers the four walk steps, the shape step for an issue or an idea, and the epic run's story prompt (D1).
- The command takes every value `lets-go` already holds as flags: the step, the change, the issue and its URL, the schema, the route line, the question mode, the idea and whether the title search ran, and, for a stacked story, the blocker, its branch and its pull request. It finds the installed plain-language reference under the repository root itself. It exits 2 when that file is missing, and it looks nothing up on the backlog (D3).
- The prompts' text does not change; only the place it is written moves (D5). A run looks the same to the user (D6).
- *Run a step* in `skills/lets-go/SKILL.md` runs the command and redirects its output to `.workspace/lets-go/<session>-prompt.md`. *Start the story run* in `references/epic-run.md` does the same for the story prompt.
- `skills/lets-go/references/step-prompt.md` is deleted. The command line and the rule for when a story is stacked fold into *Run a step* (D4).
- The `lets-go` requirements on the prompts are rewritten to check what a run does, not exact sentences (D7). The pull request records `wc -l` for `SKILL.md` and for the whole skill (D8).

## Capabilities

### New Capabilities
- `go-step-prompt`: what `lets go step-prompt` prints for each step, which flags it takes and requires, where it finds the plain-language reference, and its exit codes and help.

### Modified Capabilities
- `lets-go`: the prompt requirements say that `lets-go` gets each step's prompt and the story prompt from `lets go step-prompt`, not from a frame it copies. *lets-go keeps what only some runs need in reference files* lists seven files, without `step-prompt.md`. The scenarios that read `references/step-prompt.md` move to the command or go.

## Impact

- Code: a new `lets/src/go/step-prompt.ts`, and the `go step-prompt` command and its help in `lets/src/main.ts`. New tests in `tests/go/`.
- Skill: `skills/lets-go/SKILL.md` (*Run a step*, the step table's note on shape and the placeholder table), `references/epic-run.md` (*Start the story run*), `references/story-run.md` and `references/shape.md`, whose links to *Write the prompt* change. `references/step-prompt.md` is removed.
- Contract tests: `tests/contracts/commands.test.ts` checks the new command and its flags against `lets go step-prompt --help`. `tests/contracts/links.test.ts` checks that no link points at the deleted file.
- Neighbours: #348 (`lets go shape-name`) and #346 (`lets go records`) also add `lets go` subcommands in `lets/src/main.ts`. Whichever merges second has a small conflict in the command list to resolve. Neither is a dependency.
