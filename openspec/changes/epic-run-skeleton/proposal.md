## Why

Given an epic, `lets-go` lists the epic's open sub-issues and stops, so Mo's Build stage ends at every epic. This change is the walking skeleton of epic #278: an epic run that builds each ready story with the parts `lets-go` already has, so that the later stories of #278 have a run to extend.

## What Changes

- **An epic run.** On the default branch, `lets-go #<parent>` on an epic with open stories starts an epic run instead of stopping (D3). The run claims no epic, only each story it builds (D7).
- **Each story is picked as `next` picks.** The candidates are the epic's open sub-issues, ranked with `lets backlog ready --only <keys>`. Each candidate gets *Check the prerequisite* and *Confirm the packet*, as `next` does. After each story the run ranks the rest again (D1).
- **Each story run walks in the epic run's own session.** It goes through *Check the issue*, *Route*, *Enter the branch*, *Set the question mode* and *Walk the step table*, as a story the user named does. Between stories the run goes back to the default branch. Child sessions are #284 (D4).
- **A blocked story is not built.** `lets backlog ready` leaves it out, and its line names the blocker. Stacking a story on its blocker's branch is #280 (D2).
- **One line per story at the end.** Every open sub-issue the epic had at the start gets one line, in the order the run settled it: its pull request's URL, or `not built` with the reason (D5).
- **A failure or a stop ends the epic run.** The story gets `failed at <step>` or `stopped`, with the reason. Each story the run never reached gets `not built, the epic run stopped at #<stopped-story>`, naming the story the run stopped at. Every section that holds a stop a story can reach links that rule (D6). Going on past a failure is #281.
- **A lost claim does not end the epic run.** The story gets `not built, taken by <login>`, and the run picks again. The three-lost-claims stop does not apply inside an epic run (D8).
- **The checks on the epic itself.** An open blocker on the epic still stops the run. *Check the prerequisite* does not run on the epic: each story's own check runs when the run ranks it (D9).
- **An epic with no open stories** gets a message that says `lets-go` does not shape an empty epic yet, and to run `lets-shape` on it. Shaping an empty epic is #283 (D10).
- The glossary's *Epic run* and *Story run* entries stay as they are. They describe the end state of #278; the spec says which parts this change leaves to #283 and #284 (D4).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: adds the epic run (how it starts, picks, walks, records and ends) and changes the requirements that say an epic stops the run, the list of parts, the list of reference files, the lost-claim rule and the end of the run.

## Impact

- **Skill:** `skills/lets-go/SKILL.md` (*Check the issue*, *Enter the branch*, *Walk the step table*, *End of the run*, *Run a step*, *Read the report*, *Relay the questions*, the overview and the Placeholders table), *Records that disagree* in `skills/lets-go/references/records.md`, and a new reference file, `skills/lets-go/references/epic-run.md`, for what only an epic run needs.
- **Tests:** `tests/skill-interfaces.bats`, whose checks read the parts, the reference files, the placeholders and the fixed lines of `lets-go`.
- **Docs:** the `lets-go` section of `README.md`.
- **Code:** none. `lets backlog item` already prints an epic's open sub-issues, and `lets backlog ready` already takes `--only` and `--exclude`.
- **Dependencies:** #280 to #287 build on this change; #280 (`epic-run-stacks`) stacks on this branch.
