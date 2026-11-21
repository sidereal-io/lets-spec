## Why

An epic run is long, and one can stop before it ends: the user stops it,
the session ends, or a checkout with uncommitted changes ends it. Running
`lets-go` on the epic again today does not go on. `next` skips every story
the earlier run claimed, because each one is assigned and In Progress, so
those stories end as `not built, assigned to <login>`, and the stories that
depend on them end as `not built, blocked by`. The user has to resume each
story by hand, one branch at a time. With stacking in place (#280), Git and
GitHub now hold enough to read the epic's progress back, so a second run
can carry on where the first stopped.

## What Changes

- **Stories already finished are settled at the start.** Before the first
  pick, the epic run reads each story's pull request, in the epic's order:
  - Ready for review: the built line, `#<story> <story-name>: <pr-url>`,
    ending `, stacked on #<blocker>` when its base is an open story's
    branch. No step runs, and the story counts as met, so the stories it
    blocks can stack on it (D2).
  - Ready for review, with its base on the branch of a blocker that has
    since merged: `gh pr edit <name> --base <default>`, with no rebase, and
    the plain built line (D10).
  - Merged: `#<story> <story-name>: merged, <pr-url>` (D3).
  - Closed without merging:
    `#<story> <story-name>: not built, its pull request was closed: <pr-url>`
    (D3).
- **The stories this user started are picked again.** A started story is
  an open story of the epic, in this repository, assigned to the signed-in
  user, whose change's branch exists here or on `origin` (D1). It joins the
  candidates of each pick and ranks like any other story: Must, Should,
  Could, then the oldest first. The met-blocker rule applies to it, as to
  any story (D5). A story assigned to this user with no branch keeps
  `not built, assigned to <login>` (D1).
- **A resumed story says so.** The run prints
  `Resumed #<i>: <title>, started in an earlier run, under #<parent>.` in
  place of the `Picked` line (D6). Its walk then goes on from its first
  unfinished step, as a run on a change's branch does today.
- **A resumed story's base follows its blockers.**
  - Its pull request targets a blocker that has merged: the run moves the
    base to the default branch before the walk, with no rebase, and its
    line has no `, stacked on` (D7).
  - Its pull request targets an open story that is met: the story stays
    stacked. Its step prompts hold the `## Stack` section, and its line
    ends `, stacked on #<blocker>` (D7).
  - It has a branch but no pull request, and its open blockers are met:
    *Stack the story* finds the base, so the plan step opens the pull
    request on that blocker's branch. Blockers on different branches give
    `not built, blocked by #<a> and #<b>, on different branches` (D9).
- **`lets backlog ready` gains `--started <keys>`.** An issue it names that
  is assigned to the signed-in user, with Status Todo or In Progress, is a
  candidate despite its assignee and Status. Every other filter still
  applies. This is how a started story joins the ranked pick (D5).
- Unchanged: a closed sub-issue gets no line (D4); a blocker whose pull
  request merged into another story's branch still blocks, because its
  issue is open (D8); restacking after a lower pull request changes in
  review stays out of scope.

No change is breaking. `--started` is a new option, and a run that is not
an epic run behaves as before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`:
  - *An epic run picks each story as next picks it*: started stories join
    the candidates through `--started`, and a resumed story prints the
    `Resumed` line.
  - *An epic run ends with one line per story*: gains the `merged` line and
    the `its pull request was closed` reason.
  - *An epic run stacks a story on its met blocker*: also runs for a
    started story with a branch and no pull request (D9).
  - *The resume paragraph says what a run started again does*: adds the
    case of an epic's number on the default branch.
  - New requirements: *An epic run settles the stories already ready,
    merged or closed* holds D2, D3 and D10. *An epic run resumes the
    stories this user started* holds D1, D5 and D6. *A resumed story's
    pull request sets its stack* holds D7.
- `lets-backlog`: *ready lists the ready issues in rank order* gains
  `--started`.

## Impact

- `skills/lets-go/references/epic-run.md`: *Run the epic* gains the start
  read of each story's branch and pull request, the settles of D2, D3 and
  D10, `--started` in the pick and the `Resumed` line. *Settle a story*
  gains the new lines. *Stack the story* also runs for a started story
  with no pull request.
- `skills/lets-go/SKILL.md`: *Check the issue* decides a started story's
  stack from its pull request's base, and moves a base on a merged
  blocker's branch. The resume paragraph and the placeholders table follow.
- `lets/src/backlog/`: `policy.ts`, `adapter.ts`, `github.ts` and
  `commands.ts` for `--started`. The GitHub adapter reads the signed-in
  user's open issues, with their blockers and creation times.
- `tests/lets/backlog/`: tests for `--started`. `tests/skill-interfaces.bats`:
  checks on the new lines and parts.
- `README.md`: the `lets-go` section says that running it on the epic again
  goes on with its unfinished stories, and drops the sentence that a failed
  step stops the run at that story, which #281 made untrue.
- `openspec/specs/lets-go/spec.md` and `openspec/specs/lets-backlog/spec.md`:
  the deltas above.
- No new dependency and no schema change.
