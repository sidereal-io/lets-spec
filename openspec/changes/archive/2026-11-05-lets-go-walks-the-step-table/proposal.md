## Why

`lets-go` carries its steps in three places: a list of names, a table of prompt rows with two rows for build, and a section of skip lines. Review plan is the special case: it has no session of its own and runs inside build. Epic #148 promised five steps, each in a fresh session with a report, and a dated line for each one skipped. The five step skills are in place now. So one table can say, for each step, its skill, when it is done and where its record is, and review plan can be a step like the others.

## What Changes

- `lets-go` holds one step table: shape, plan, review plan, build and review build, each with its skill, when it is done, its record and its skip line. The two build rows and the *What to run* table go (D1).
- `lets-go` walks the table from the top. A done step prints its `Skipped` line. An unfinished step runs in its own session, and prints its `Done` line. The walk stops at a failed step or at the end of the table (D2, D12).
- Review plan is a step of its own, with `--for review-plan`, a prompt, a report and a relay. Its session runs the `lets-review-plan` skill (D4). The build step runs `lets-build` alone (D5).
- Review plan is done when the pull request's **Plan review** section covers the plan, as `lets-review-plan`'s *Check an earlier review* decides. A `ready` change with no covering review goes to review plan, not build (D3).
- Every step prompt says to invoke the row's skill and stop where it stops, and carries the route line in its frame (D6).
- The skip lines keep their records (D7). Plan reads the `tasks.md` add commit. Review plan reads the reviewed commit. Build reads the last `tasks.md` commit. Review build reads the archive commit and the ready pull request. The review build line no longer names a **Code review** section, which only the `lets-standard` flow writes (D8).
- Two disagreement rows change (D9). The archive row asks for a **Code review** section only on the `lets-standard` flow. The row for a built change with no plan review goes.
- `lets-review-plan` gains a *Start* for a fresh session: it checks an earlier review before it reviews, and finds the author from the plan commits' trailers (D17). It, the README and the glossary stop saying that review plan runs inside build (D13).
- The walk reads the change state at the plan row and the build row, so a review round that adds a task is built (D18).
- The `lets-go` spec and the pinned test strings follow (D14, D15).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the steps run from one table, walked from the top (D1, D2, D18). Review plan runs as a step, or is not in the route (D3, D4). The step prompt names the row's skill and the route (D5, D6). The skip lines, the review build line and the disagreements change (D7, D8, D9). The fixed strings follow (D14, D15, D19).

## Impact

- `skills/lets-go/SKILL.md`; `skills/lets-review-plan/SKILL.md`, its description, *When to apply*, a new *Start* and *Find the author*.
- `README.md`, its `lets-go` section; `openspec/glossary.md`, already committed on this branch.
- `openspec/specs/lets-go/spec.md`; `tests/skill-interfaces.bats`.
- Projects on either flow. After `lets sync`, `lets-go` runs review plan in a session of its own on `lets-standard`. It resumes a `ready` change at review plan when no review covers the plan. `lets delegate step` already takes `--for review-plan`. The schemas, `lets` and the resolvers do not change.
