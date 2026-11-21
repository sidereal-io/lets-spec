<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- **Where an epic goes today.** *Check the issue* in
  `skills/lets-go/SKILL.md` reads `lets backlog item <i>`. *Confirm the
  packet* returns `epic` from the Kind alone, with the open sub-issues.
  The `epic` case goes to *Run the epic* in
  `skills/lets-go/references/epic-run.md`, which stops with
  `lets-go does not shape an empty epic yet` when there are no open
  sub-issues.
- **What `lets backlog item` shows.** The GitHub adapter
  (`lets/src/backlog/github.ts`) already reads every sub-issue with its
  `state`. `itemView` in `lets/src/backlog/policy.ts` drops the closed
  ones. So an empty epic and a finished epic print the same
  `"subIssues": []`.
- **The shape step.** *Run the shape step* in
  `skills/lets-go/references/shape.md` runs `lets-shape` on an idea or
  an issue, at most once per run. A report that names a parent and
  stories goes to *Pick the first ready story*, which builds one story.
  *Find the input's discovery* finds a discovery that stopped, by
  `Input:` line, status line and answers file.
- **Discovery's parent.** `lets-shape`'s *Phase 1: Ingest* always
  creates a new parent titled `Epic: <capability>`. Its stance says
  "The input is read-only". *Locate the discovery* already keeps an
  input issue that is itself a parent.
- **Map commits.** *Commit the discovery map* commits the map on the
  picked story's branch, in the same checkout. In an epic run, *Claim*
  creates each story's branch in its own worktree with
  `git worktree add`, from the committed default branch, so the
  uncommitted map edits stay behind in the epic run's checkout.
- **Constraint from #267.** lets-go must not add another parent query:
  it reuses *Find the input's discovery*.

## Goals / Non-Goals

**Goals:**

- An empty epic goes from `lets-go #<epic>` to an epic run with no
  hand step, and discovery files no second parent.
- `lets-go` tells an empty epic, a finished epic and an epic with a
  stopped discovery apart, using only `lets backlog item` and the
  existing lookup.
- The epic's map edits reach a pull request, and the epic run's
  checkout ends clean.

**Non-Goals:**

- Re-shaping an epic whose discovery finished.
- Building every story of an idea that discovery turns into an epic.
  That is #287.
- Removing lets-go's last copy of the title search or the discovery
  lookup. That is #137.
- Fixing the older scenario *An epic stops the run* under *Each part
  names the action for each result*, which predates the epic run.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. It reads the
  skill text and checks fixed lines, links and order. Every lets-go and
  lets-shape behaviour here is skill text.
- **Existing seams reused:** `tests/lets/backlog/policy.test.ts` and
  `tests/lets/backlog/item.test.ts` for `closedSubIssues`. The bats
  test *an epic run with no open stories points to lets-shape in a text
  block* is replaced, and *lets-shape picks its path from its input,
  first match wins* gets the new item in its order check.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `lets-go`'s epic path and shape step, `lets-shape`'s
  path choice and Ingest, and one additive field of
  `lets backlog item`'s JSON. No other command, schema or config
  changes.

## Decisions

### D1. The epic case of *Check the issue* sorts the epic

*Check the issue*'s `epic` case, on the default branch, reads the
result it already holds and goes one of four ways, in this order:

1. **Empty** (`subIssues` and `closedSubIssues` both empty): run the
   shape step for `#<epic>`. When a shape step already ran in this run,
   say instead that `#<epic>` has no stories after shaping, say to run
   `lets-shape` on it, and stop.
2. **Finished** (no open sub-issue, at least one closed): print
   `#<parent> is finished: every story under it is closed.` in a `text`
   block, and stop.
3. **A stopped discovery**: run *Find the input's discovery* for
   `#<epic>`. When it finds one or more, say so and run the shape step
   for `#<epic>`, under the same once-per-run rule.
4. **Otherwise**: go to *Run the epic*, as today.

*Run the epic* then only ever sees an epic with open stories. Its
empty-epic stop and the sentence "An epic with no open stories is not
shaped yet" in its intro are removed, and the part table's *Stops*
cell for *Run the epic* no longer names an epic with no open stories.

*Alternative:* sort the epic at the top of *Run the epic*. It lost
because *Run the shape step* is reached from *Check the issue* in the
part table, and `epic-run.md` is read only in an epic run. A shape step
started from there would need a new route back.

### D2. After shaping, the run goes back to the blocker read

When the shape report's first line is `epic #<parent>: <title>` and
`<parent>` is the run's issue `<i>`, *Run the shape step* goes on from
the blocker read in *Check the issue* with `<i>`, instead of *Pick the
first ready story*. That reads `lets backlog item <epic>` again, so the
epic run's stories are the new sub-issues, in the order the backlog
gives. The second pass through the `epic` case finds open stories, and
*Find the input's discovery* finds nothing, because Finalize removed the
status line and *Read the report* removed the answers file. So the epic
run starts.

`Done shape` prints in the `epic` case, before *Run the epic*, when a
shape step reported `done` and the run has not printed it. *The step
lines* names that place beside the others.

A report of `issue #<epic>: <title>` needs nothing new: it goes on as
one issue, as today. A report whose parent is some other issue keeps
today's path through *Pick the first ready story*.

*Alternative:* pass the report's `story` lines straight to *Run the
epic*. It lost because *Run the epic* defines its stories as what
`lets backlog item` printed, and would need a second source.

### D3. `closedSubIssues` beside `subIssues`

`itemView` returns `closedSubIssues`: each closed sub-issue's `key`,
`label`, `title` and `url`, the same shape as `subIssues`. The adapter
already reads the state, so only the view and the usage text in
`lets/src/backlog/commands.ts` change.

*Alternatives:* a count lost because a list costs the same and matches
`subIssues`. Adding `state` to `subIssues` lost because every reader
that takes `subIssues` as the open stories would break.

### D4. `lets-shape` reads the epic with `lets backlog item`

The new path item in *Locate the discovery*, after the parent match and
before the answered discovery question, reads `lets backlog item <i>`
for an issue input. When `kind` is `Epic` and both sub-issue lists are
empty, it runs discovery from *Phase 1: Ingest* with the epic as its
parent. It asks no discovery question and does no sizing.

*Alternative:* read the Kind with `lets-shape`'s own Project GraphQL
query, and the sub-issues with `gh issue view`. It lost because it
needs two reads and a field lookup that `lets backlog item` already
does, and the two skills could disagree on what empty means.

### D5. Ingest writes into the epic

For an empty epic, Ingest's checkpoint writes the parent template with
`gh issue edit <epic> --body-file <file>`, not `gh issue create`. It
keeps the title, sets no Kind, and writes `Input: #<epic>`. The body
ends with `## Original description`, holding the old body word for word,
or no such section when the old body was empty. The read-only rule in
`lets-shape`'s stance names this one exception. The parent template in
`skills/lets-shape/templates/issue-template.md` shows the optional
section. Phase 5's one-story case keeps `## Original description` when
it replaces the body, beside the lines it keeps today.

The comment read at Ingest is unchanged: the epic is the input issue,
so its thread is read and its reply is posted on the epic itself.

Recorded as [ADR-030](../../../docs/decisions/ADR-030-an-empty-epic-is-its-own-discovery-parent.md).

### D6. *Find the input's discovery* keeps the input parent

Step 2 of the procedure gains the rule `lets-shape` already has: when
the input is an issue `#<i>` that is itself in the parent list, keep it
too. An epic shaped in place names itself in `Input:`, so the step
already keeps it. The rule also covers an epic made by an idea's
discovery, whose `Input:` holds the idea, when the user runs
`lets-go #<epic>` on it.

### D7. An epic run carries the map into the first claimed story

*Commit the discovery map* gains an epic-run form. It runs in *Enter the
branch*, after *The story's worktree* is prepared, when a shape step ran
in this run:

1. List the changed maps in the epic run's checkout, with the existing
   `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`.
   No path: no commit.
2. For each path that exists, copy it to the same path in `<path>`,
   creating its folder. For a path that no longer exists, a status of
   ` D`, run `git -C <path> rm -q -- <p>`.
3. `git -C <path> add -- <paths>`, then
   `git -C <path> commit -m "docs: the discovery map from #<parent>" -- <paths>`.
4. Return the epic run's checkout to clean: `git restore --source=HEAD
   --staged --worktree -- <tracked paths>` for each path not marked
   `??`, and `rm -- <p>` for each path marked `??`.

Step 4 runs only after the commit succeeds, so the edits are never
lost. The form runs for the first story the epic run claims and for no
later one, so a failed restore never commits the maps twice. It returns
`committed`, `commit-failed` or `restore-failed`, and *Enter the branch*
stops the story's run on either failure. When no story is claimed, or
the claimed story stops before its map commit, the edits stay. Before
*End of the run*, *Report the maps' edits* names them, as the existing
stop message does.

*Alternatives:* leaving the edits in the checkout lost because the next
run stops on them, and they never reach a pull request. Committing on
the default branch lost because `lets-go` never commits there. Using
`git stash` lost because the stash is shared between worktrees and
sessions.

## Risks / Trade-offs

- [Two discoveries run on the same epic: one in place, and one started
  before this change that filed a second parent with `Input: #<epic>`]
  → *Find the input's discovery* finds both, and `lets-shape` asks
  which one, as it does today for several matches.
- [The finished-epic line hides an epic whose last story was closed as
  not planned] → The line says every story is closed, which is true.
  Reopening a story, or adding one, makes the epic buildable again.
- [The restore in D7 removes new map files from the epic run's
  checkout] → It runs only after the commit holding them succeeds, and
  touches only the paths the status command listed.
- [Stories of the first wave, other than the first claimed, branch
  without the map commit] → The map is documentation that no story's
  build reads. It reaches the default branch when the first story
  merges.

## Migration & Rollback

N/A for data. `closedSubIssues` is a new field, and no reader of
`lets backlog item` breaks. Epics shaped in place keep their
`## Original description` if the change is reverted, and still match
by their `Input:` line.
