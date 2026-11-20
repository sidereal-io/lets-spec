## Why

Today one failed or stopped story ends the whole epic run: every story not
built yet gets `not built, the epic run stopped at #<stopped-story>`, even
the stories that do not depend on it. Now that an epic run stacks a story
on its met blocker (#280), the stories that depend on a failed story are a
clear set, so the epic run can skip only those and build the rest.

## What Changes

- When a story run fails or stops, the epic run goes on with the next pick,
  instead of ending. This holds for every stop a story run reaches, the same
  way (D1). A stop between stories, such as a `lets backlog` error during the
  pick, still ends the epic run, and a lost claim is unchanged (D2).
- Before it goes on, the epic run checks the checkout. When it holds
  uncommitted changes outside `.workspace/`, the epic run still ends at that
  story, as today (D3). Otherwise it switches back to the default branch and
  picks again.
- Each story of the epic that depends on the failed or stopped story is
  skipped. A story depends on it when its open blockers include that story,
  or a story that depends on it in turn, following "blocked by" links
  between the epic's own unsettled stories at any depth (D4).
- Each skipped story is settled right after the failed story's line, in the
  epic's order, with
  `#<story> <story-name>: not built, it depends on #<failed>, which did not finish`.
  The line names the failed or stopped story itself (D5). Every dependent
  settles at that stop, so a line never names two stories, and the
  `#<a> and #<b>` form D5 allows does not arise (design D-D).
- The failed or stopped story's own line is unchanged:
  `failed at <step name>: <reason>` or `stopped: <reason>` (D6).
- The end of the run prints the per-story lines, as today, and no count
  line (D7). Nothing retries a failed step in the same run (D8).

No change is breaking: a run that is not an epic run behaves as before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the requirement *A failure or a stop ends the epic run at that
  story* changes, so a stop in a story run ends only that story, skips its
  dependents and lets the epic run go on, unless the checkout is not clean.
  *An epic run ends with one line per story* gains the `not built, it
  depends on #<failed>, which did not finish` reason.

## Impact

- `skills/lets-go/references/epic-run.md`: *A stop in an epic run* is
  rewritten. *Run the epic* and *Settle a story* gain the skipped story's
  line and the return to the next pick.
- `skills/lets-go/SKILL.md`: the overview's sentence on stops in an epic
  run, and the *Next* column of the parts table, say that the epic run goes
  on. The links to *A stop in an epic run* stay where they are.
- `tests/skill-interfaces.bats`: the checks on *A stop in an epic run*
  follow the new lines.
- `openspec/specs/lets-go/spec.md`: the delta for the two requirements above.
- No dependency, schema or `lets` CLI change: `lets backlog item` already
  prints each story's `blockedBy`.
