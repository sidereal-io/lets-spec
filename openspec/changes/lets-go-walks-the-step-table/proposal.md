## Why

`lets-go` carries its steps in three places: a list of names, a table of prompt rows with two rows for build, and a section of skip lines with a special case for review plan, which has no session of its own and runs inside build. Epic #148 promised five steps, each in a fresh session with a report, and a dated line for each one skipped. With the five step skills in place, one table can say, for each step, its skill, when it is done and where its record is, and review plan can be a step like the others.

## What Changes

- `lets-go` holds one step table: shape, plan, review plan, build and review build, each with its skill, when it is done, its record and its skip line. The two build rows and the *What to run* table go (D1).
- `lets-go` walks the table from the top. A done step prints its `Skipped` line. An unfinished step runs in its own session, and prints its `Done` line. The walk stops at a failed step or at the end of the table (D2, D12).
- Review plan is a step of its own, with `--for review-plan`, a prompt, a report and a relay. Its session runs the `lets-review-plan` skill (D4). The build step runs `lets-build` alone (D5).
- Review plan is done when the pull request's **Plan review** section covers the plan, as `lets-review-plan`'s *Check an earlier review* decides. A `ready` change with no covering review goes to review plan, not build (D3).
- Every step prompt says to invoke the row's skill and stop where it stops, and carries the route line in its frame (D6).
- The skip lines keep their records: the `tasks.md` add commit for plan, the reviewed commit for review plan, the last `tasks.md` commit for build, the archive commit and the ready pull request for review build (D7). The review build line no longer names a **Code review** section, which only the `lets-standard` flow writes (D8).
- The records that disagree change in two rows: the archive row asks for a **Code review** section only on the `lets-standard` flow, and the row for a built change with no plan review goes (D9).
- `lets-review-plan`, the README and the glossary stop saying that review plan runs inside build (D13).
- The `lets-go` spec and the pinned test strings follow (D14, D15).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the steps run from one table, walked from the top (D1, D2); review plan runs as a step, or is not in the route (D3, D4); the step prompt names the row's skill and the route (D5, D6); the skip lines, the review build line and the disagreements change (D7, D8, D9); the fixed strings follow (D14, D15).

## Impact

- `skills/lets-go/SKILL.md`; `skills/lets-review-plan/SKILL.md`, its description and *When to apply*.
- `README.md`, its `lets-go` section; `openspec/glossary.md`, already committed on this branch.
- `openspec/specs/lets-go/spec.md`; `tests/skill-interfaces.bats`.
- Projects on either flow. After `lets sync`, `lets-go` runs review plan in a session of its own on `lets-standard`, and resumes a `ready` change at review plan when no review covers the plan. `lets delegate step` already takes `--for review-plan`. The schemas, `lets` and the resolvers do not change.
