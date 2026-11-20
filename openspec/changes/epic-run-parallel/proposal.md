<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

An epic run sorts its stories into waves (#285), but it still builds them
one at a time, so a large epic takes as long as the sum of its stories.
The stories of one wave do not depend on each other and touch different
code (D2), so they can run at the same time. #284 and #285 have put the
pieces in place: each story already runs in a child session of its own.

## What Changes

- Every story run works in a git worktree of its own, at
  `.workspace/lets-go/worktrees/<name>/` in the epic run's checkout, even
  in a wave of one story (D3, D4). The epic run creates the worktree where
  *Enter the branch* used to switch to the story's branch, and runs
  `lets sync` in it when the project ignores its skills (D5).
- The epic run's own checkout stays on the default branch for the whole
  run. The `git switch <default>` after each story goes away (D3).
- Every story of the current wave that is ready and passes the usual
  checks starts at once, with no limit (D6). The next wave starts once
  every story of this one is settled (D1).
- New `lets delegate step start` starts a step session in the background
  and returns at once. New `lets delegate step wait` waits until the next
  of the named background sessions ends, and says which one it was (D7).
  `lets delegate step run` is unchanged for every other caller.
- The epic run takes one child's `needs-input` report at a time, in the
  order the reports arrive, and prefixes each question it asks or answers
  with its story, such as `#286:`. The other children keep running. The
  child that asked starts again once its whole report is answered (D8).
- A built story's worktree is removed and its branch kept. A story that
  stopped or failed keeps its worktree, and its line ends with
  `; its worktree is at <path>` (D9).
- **BREAKING** for the epic run's lines: uncommitted changes no longer end
  the epic run, because they sit in the story's own worktree (D9). The
  line `not built, the epic run stopped at #<stopped-story>` goes away.
- A story whose child session cannot start (exit 3) waits until the
  wave's running children end. The epic run then walks its steps in its
  own session, inside the story's worktree, one story at a time (D10).
- On resume, a story whose branch is already checked out in a worktree
  reuses that worktree when it is clean, and stops with
  `stopped: its worktree at <path> has changes that are not committed`
  when it is not (D11).
- Lines still print in the order the stories settle (D12).
- The glossary entries *Story run* and *Wave* now say this (D13). That
  edit is already committed on this branch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: an epic run builds the stories of a wave at the same time,
  each in a worktree of its own; relays their questions one report at a
  time; removes a built story's worktree; and no longer ends on
  uncommitted changes or switches back to the default branch.
- `delegate-step`: adds `lets delegate step start`, which runs a step
  session in the background, and `lets delegate step wait`, which waits
  for the next background session to end.

## Impact

- `skills/lets-go/references/epic-run.md`: *Run the epic*, *Start the
  story run*, *Relay a story run's questions* and *A stop in an epic run*
  change, and a part that waits for a wave's children is added.
- `skills/lets-go/SKILL.md`: *Enter the branch* and *Claim* create or
  reuse the story's worktree in an epic run; the overview, the
  placeholders and *End of the run* follow.
- `skills/lets-go/references/story-run.md`: the child works in its
  worktree, which is its repository root.
- `lets/src/delegate/`: a new module for `step start` and `step wait`,
  and a hidden option on `step run` that records its exit code;
  `lets/src/io.ts` gains a detached spawn and a process check;
  `lets/src/main.ts` adds the two commands and their help.
- Tests: `tests/lets/delegate/` for the two commands, and
  `tests/skill-interfaces.bats` for the skill's text.
- `README.md` and `docs/resolvers.md`: how an epic run builds a wave, and
  the two new commands.
- The specs and changes of #282, #284 and #285 are not archived yet. This
  change's `lets-go` deltas modify requirements those changes add or
  modify, so it archives after them, bottom-up, as the stack merges.
