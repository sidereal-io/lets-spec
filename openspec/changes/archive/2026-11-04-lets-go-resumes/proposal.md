## Why

`lets-go` runs only from the default branch, for a chore nobody has started. An interruption at any step leaves a branch that only `lets-build` can carry on, and the user loses the one-command run. The epic requires that a skip prints its reason and the date the step was completed, and that the same command can be restarted after any interruption (D1, D6).

## What Changes

- `lets-go` starts on the default branch or on a change's branch (D1). On a change's branch it finds the issue from the branch name when it is given none (D2). On the default branch it switches to the change's branch when that branch already exists (D4).
- Start runs `lets-build`'s *Find the source of demand*, *Confirm the packet* and *Route* on every run, and *Claim* only when the branch is new (D3). The schema in the prompts comes from the change's `.openspec.yaml` when the change exists (D5).
- A new section finds the first unfinished step from the change state and the archive folder, as `lets-build`'s *Find where you are* reads them (D6). The run goes on from that step.
- Each skipped step prints one line with its evidence and date (D12): the commit that added `tasks.md` for propose (D7), the last commit of `review.md` for propose review on a schema with a review (D8), the last commit that modified `tasks.md` for apply (D9), and the archive commit with the pull request's state for apply review (D10). Dates are author dates (D11).
- When the records disagree, `lets-go` prints what it found and stops, with no repair (D13). A closed pull request ends the run with a message (D14).
- A step whose answers file is left from an interrupted run starts with `--answers-file` (D15).
- When every step is done, `lets-go` prints the five lines and the pull request URL (D16).
- The line that said #150 adds resuming goes (D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the branch requirement, Start's reuse of `lets-build`, the propose review line, the step order, the fixed lines the tests check, and a new requirement for finding the first unfinished step and its skip lines.

## Impact

- `skills/lets-go/SKILL.md`: the description, Start, a new section that finds the first unfinished step, and the end-of-run lines (D17).
- `tests/skill-interfaces.bats`: one new test for the fixed strings (D17).
- `README.md`: the `lets-go` section says it resumes (D17).
- No code, no dependency, no change to `lets-build`, `flows.json` or the routing rows (D17). The pinned `lets` cannot run the skill here yet (D19).
