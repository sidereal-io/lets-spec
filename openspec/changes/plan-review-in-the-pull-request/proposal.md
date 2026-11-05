## Why

Let's Spec has two independent reviews, and they work differently. The code review is a rule that records in the pull request. The plan review is a `review` artifact that `openspec-propose` writes in the middle of the plan, before the tasks, and that the `tasks` step reads. Epic #148 makes review plan a step of its own, which it cannot be while it sits inside the plan. This change takes the review out of the schema, gives both reviews one shape, and lets `openspec-propose` build the whole plan untouched.

## What Changes

- **BREAKING** `lets-standard` ends at `tasks`. The `review` artifact and `templates/review.md` go, and `tasks` requires `adr` and `specs` (D1). A change in flight that has no `review.md` yet loses nothing; one that has it keeps the file as an untracked artifact.
- `lets-review-plan` reviews brainstorm through tasks (D2), and records the review in the pull request description under **Plan review**: `Reviewed: <sha>`, the reviewer and round, the verdict, the findings and the rebuttals (D3). The schema's extra checks move into the skill (D8). A new *Check an earlier review* section says when a changed plan needs a new round (D5). The author fixes a `REVISE` plan with `openspec-update-change` and runs a new round (D7).
- `lets-build`'s *Apply* has the plan reviewed before it invokes `openspec-apply-change` on a `lets-standard` change, and skips the review on any other schema (D6). It builds only when the review is finished (D4).
- The schema's `tasks` step stops reading a verdict, its `design` step names the plan review, and its `apply` step says `lets-build` reviews first (D9, D12). `lets-write-tasks` turns a plan, not an approved plan, into tasks (D9).
- `lets-go` runs review plan inside build until #186, counts it done when build is done, and reads its lines from the pull request's **Plan review** section, dated by the reviewed commit (D10, D11).
- The README's flows table moves the plan review after `tasks`, with the section as its output (D13).
- The tests pin the new strings and the removed ones (D14). Archived changes keep their `review.md` (D16).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: review plan runs inside build and counts as done with it; its lines read the pull request's **Plan review** section; the fixed lines the tests check change with them (D10, D11, D14).

## Impact

- `schemas/lets-standard/schema.yaml` and `schemas/lets-standard/templates/review.md`.
- `skills/lets-review-plan/SKILL.md`, `skills/lets-build/SKILL.md`, `skills/lets-go/SKILL.md`, `skills/lets-write-tasks/SKILL.md`.
- `README.md` and `tests/skill-interfaces.bats`.
- Projects on `lets-standard` with a change in flight: after `lets sync`, `openspec status` no longer lists `review`, and `lets-build` reviews the plan before it builds. This repository's own copies in `.agents/skills/` and `openspec/schemas/` change at the next release.
