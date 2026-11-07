## Why

Today the last step of a change is a section of `lets-build`. It follows a rule in the project's config to run `lets-review-code`, then verifies, archives and marks the pull request ready. Nobody can run "review build" by name, and epic #148 wants one skill per step. With the plan review out of the schema, this change gives the second review the same shape as the first: a skill that `lets-build` invokes, not a config rule.

## What Changes

- A new skill, `lets-review-build`, ends a change. It holds `lets-review-code`'s content: with no **Code review** section in the pull request it reviews the code, and with one it checks the earlier review and reviews again only when the check says to. Then it follows the project's archive guidance, runs `openspec-verify-change`, archives with `openspec-archive-change`, commits the archive alone as `chore:`, and marks the pull request ready (D1, D4).
- **BREAKING** `lets-review-code` goes from `skills/` and `flows.json`. `lets-review-build` ships in its place, in the `standard` flow only (D2). A project that calls `lets-review-code` by name calls `lets-review-build` instead.
- **BREAKING** The `operations.archive` rule goes from the standard flow's config overlay. A new project starts with no rule, and no config switch turns the code review off: the `standard` flow reviews the code and the `minimal` flow does not (D5).
- `lets sync` reports a project whose `openspec/config.yaml` still names `lets-review-code`, as one problem to fix, and still exits 0 (D6).
- `lets-build`'s *Finish the change* reads the flow's schema from `openspec/config.yaml`. On `lets-standard` it invokes `lets-review-build`. On any other schema it finishes as today (D3).
- The README's flows table names `lets-review-build`, and its *Turning the code review off* section goes (D5, D12).
- The tests pin the new names and the removed rule (D9). `lets-go`, `lets delegate review` and the dated records do not change (D10, D11, D13).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-sync`: a new requirement. A config that still names `lets-review-code` is a problem to fix, reported on stderr with exit 0, and ignored when the name sits in a comment (D6).

## Impact

- `skills/lets-review-build/SKILL.md`, new; `skills/lets-review-code/`, removed; `skills/lets-build/SKILL.md`; `flows.json`.
- `overlays/openspec/config.d/lets-standard.yaml`.
- `lets/src/sync/config.ts`, `docs/lets-sync.md`, `README.md`.
- `tests/skill-interfaces.bats`, `tests/release-build.bats`, `tests/openspec-compat.bats`, `tests/sync-setup.bats`, `tests/support/release.bash`, `tests/lets/sync/config.test.ts`.
- Projects on the `standard` flow. After `lets sync`, `lets-review-code` is gone from `.agents/skills/`, and `lets sync` names the stale rule in their config until they delete it. This repository's own copies and config change at the next release.
