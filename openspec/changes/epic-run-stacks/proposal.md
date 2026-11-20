<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

An epic run stops at nearly every epic's second story. Most stories in an
epic are blocked by an earlier one, the user owns the merge, so the
blocker stays open, and `lets backlog ready` never lists a blocked story.
The repository rule already says a dependent change stacks on its
blocker's branch; the epic run should do that itself, instead of leaving
the story `not built, blocked by #<blocker>` for the user to stack by
hand.

## What Changes

- An epic run builds a story whose open blockers are all *met*: each is a
  story of the same epic whose pull request is open and ready for review,
  built in this run or an earlier one (D6). Blockers are still built
  first (D1).
- The story's branch is created off its blocker's branch, not the
  default branch, and its draft pull request targets that branch. With
  several met blockers, the story stacks on the one whose branch already
  contains every other blocker's branch (D7).
- The stacked pull request's body says `Stacked on #<blocker-pr>; merge that first.`
  beside `Closes #<i>` (D8).
- The epic run prints `Stacks on #<blocker>: <blocker-branch>, pull request #<blocker-pr>.`
  when it picks a stacked story, and a built stacked story's line ends
  with `, stacked on #<blocker>` (D9).
- New `not built` reason: `blocked by #<a> and #<b>, on different branches`,
  for a story whose met blockers sit on separate branches (D7).
- `lets backlog ready` gains `--met-blockers <keys>`: an issue whose only
  open blockers are named there counts as ready. The epic run passes the
  met stories, so a stacked story ranks with the other ready stories.
- Unchanged: a blocker outside the epic, or one whose pull request is a
  draft or missing, still leaves the story `not built, blocked by #<blocker>`
  (D2, D6). A run on a single story outside an epic run does not stack
  (D3). Nothing restacks a branch after review (D4). The review steps
  already review against the pull request's base (D5).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: an epic run stacks a story on a met blocker. This changes
  how it picks a story, how it creates the story's branch, what it
  prints, what its step prompt tells the step that opens the pull
  request, and the `not built` reasons.
- `lets-backlog`: `lets backlog ready` takes `--met-blockers <keys>`, and
  lists an issue whose open blockers are all named there.

## Impact

- `skills/lets-go/SKILL.md`: *Check the issue* (the open-blocker
  decision), *Claim* (the branch's start point and the glossary
  preflight's proposed base), the step prompt's stack section.
- `skills/lets-go/references/epic-run.md`: *Pick the next story* finds
  the met stories and passes them; *Settle a story* gains the stacked
  line and the new reason.
- `skills/lets-go/references/step-prompt.md`: a section a stacked
  story's steps get, naming the base branch and the merge-first line.
- `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`:
  the brainstorm instruction that opens the draft pull request follows
  that section when the prompt has it.
- `lets/src/backlog/` (`policy.ts`, `adapter.ts`, `github.ts`,
  `commands.ts`): the `--met-blockers` option, and each blocked
  candidate's open blockers.
- Tests: `tests/lets/backlog/` for the option, `tests/skill-interfaces.bats`
  for the skill text.
- `README.md`: the epic-run paragraph says a blocked story in the epic
  stacks.
- No new dependency. `gh` already returns `blockedBy` for `gh issue list`.
