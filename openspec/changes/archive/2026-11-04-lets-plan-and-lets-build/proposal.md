## Why

Today `lets-build` is a runner. It finds, confirms, routes and claims an issue, plans it, builds it and finishes it, and `lets-go` reuses six of its sections by name. Epic #148 decided that `lets-go` is the only runner, and that each step has one skill of its own name. With the plan review out of the schema and `lets-review-build` in place, the plan and build steps are the two steps without a skill of their own. This change gives them one each, and moves the runner's work into `lets-go`.

## What Changes

- A new skill, `lets-plan`, is the plan step. It runs `openspec-propose` for the change, with the issue and the route line, continues an existing change, and stops when `tasks.md` is committed. It offers no handoff (D1, D2).
- **BREAKING** `lets-build` is the build step only. It runs `openspec-apply-change`, test-first with `lets-test-first`, and stops when every task is ticked. It no longer finds, claims, routes or finishes an issue, and no longer offers to build in a new session (D3).
- *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* move from `lets-build` into `lets-go`'s *Start*, word for word. `lets-go` names its own sections, and sets the Status itself when it claims (D6).
- `lets-go` with no issue number and no idea takes `next`, the next ready issue on the backlog, as `lets-build` did (D7). After a failed step it says to run `lets-go` again on the branch (D8).
- `lets-go`'s step rows name the step skills: `lets-plan` for plan, `lets-build` for build and `lets-review-build` for review build. On `lets-standard`, the build row has the plan reviewed with `lets-review-plan` before `lets-build` runs, until #186 gives review plan a session of its own (D5).
- `lets-review-build` ships in both flows. It reads the flow's schema, reviews the code on `lets-standard`, and finishes the change on every flow. This is the finish `lets-build` had for the `minimal` flow, moved (D4).
- The routing table in `overlays/AGENTS.md` and the README's usage table send "start the next story" and "move the current branch's change on" to `lets-go`. The README describes the four step skills in one short section. `lets-shape`'s handoffs, `lets-setup-backlog`'s intro and the backlog adapter contract name `lets-go` where they named `lets-build` (D9).
- `flows.json` ships `lets-plan` in both flows (D10). Both schemas say a change starts from `lets-go`, that `lets-build` runs the apply step, and that `lets-review-build` finishes it (D11).
- ADR-020 records that `lets-go` is the only runner and `lets-build` is the build step. It supersedes ADR-018, whose status line says so (D12).
- The `lets-go` and `issue-comments` specs name `lets-go`'s sections where they named `lets-build`'s (D13). The bats tests pin the new skill, the trimmed one, the moved sections and the routing rows (D14).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: *Start* holds the find, confirm, route and claim sections instead of naming `lets-build`'s, and reads the default branch itself (D6, D13). With nothing given it takes `next` (D7). Its step prompts name `lets-plan`, `lets-review-plan` with `lets-build`, and `lets-review-build` (D5). A failed step points at `lets-go` (D8). Both flows ship `lets-plan`, and the routing tables send the next story and the current change to `lets-go` (D9, D10).
- `issue-comments`: the thread read before Claim, its watermark, its stop and its remedy belong to `lets-go`'s *Confirm the packet*, and the skill-interfaces test reads `skills/lets-go/SKILL.md` for them (D13).

## Impact

- `skills/lets-plan/SKILL.md`, new; `skills/lets-build/SKILL.md`; `skills/lets-go/SKILL.md`; `skills/lets-review-plan/SKILL.md`; `skills/lets-review-build/SKILL.md`; `skills/lets-shape/SKILL.md`; `skills/lets-setup-backlog/SKILL.md`.
- `schemas/lets-standard/schema.yaml`, `schemas/lets-minimal/schema.yaml`; `flows.json`; `overlays/AGENTS.md`.
- `README.md`; `docs/backlog-adapter-contract.md`; `docs/decisions/ADR-020-*.md`, new; `docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md`, its status line.
- `openspec/specs/lets-go/spec.md`, `openspec/specs/issue-comments/spec.md`; `tests/skill-interfaces.bats`, `tests/sync-rules.bats`.
- Projects on either flow. After `lets sync`, an agent that is told to start the next story or carry a change on runs `lets-go`; `lets-build` on the default branch does nothing but say so. The `handoff` strategy in `lets` keeps working and loses its last caller. This repository's own copies and config change at the next release.
