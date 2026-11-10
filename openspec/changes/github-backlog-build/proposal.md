## Why

`lets-go` and `lets-plan` drive the GitHub backlog by running `gh` straight from skill prose, so adding Beads, Linear or Jira Cloud (#52) would mean rewriting those skills for each one. The boundary that #135 and ADR-015 planned has the agent run the provider's commands, and produced a large contract describing how to use `gh`. #136 needs a boundary that stays small and deterministic (D1, D5).

## What Changes

- New `lets backlog` commands: `next`, `item`, `find`, `claim`, `release` and `ref`. Each prints JSON. lets runs the provider's commands itself, through an adapter, and the agent never runs backlog commands (D1).
- A lean adapter interface, with one adapter: GitHub, which calls `gh`. It does exactly what today's `gh` calls do: the same Project lookup, the same ready rule and ranking, and the same claim check, assignment and Status writes (D4). Ranking and the claim check live once, in shared code (D5).
- `claim` returns `claimed`, `taken` or `failed`. `failed` names the write that failed and `gh`'s error, with no undo, retry or journal (D8).
- `lets-go` and `lets-plan` call `lets backlog` in place of their backlog `gh` commands. Pull request calls stay as `gh` (D10). lets writes no completion (D11).
- The provider is always GitHub: no config key yet (D7).
- A new ADR supersedes ADR-015 where it covers backlogs (D2).
- **BREAKING** (unreleased surface only): #135's executable contract is removed: the `backlog-adapter-contract` spec, `docs/backlog-adapter-contract.md`, and the kit in `lets/src/backlog/` with its tests (D6). No production code uses it.

## Capabilities

### New Capabilities

- `lets-backlog`: the `lets backlog` commands, their JSON results, the shared ready, ranking and claim rules, and the GitHub adapter's behavior.

### Modified Capabilities

- `lets-go`: Start, the Project query, finding the issue for a branch, `next`, Confirm the packet, and Claim call `lets backlog` in place of the `gh` commands their requirements name today. `<project>` and `<owner>` placeholders go away.
- `backlog-adapter-contract`: every requirement is removed. `lets-backlog` replaces the executable boundary (D6).

## Impact

- **Code:** new `lets backlog` command group in `lets/src/main.ts`; `lets/src/backlog/` is rewritten as the adapter interface, shared policy and the GitHub adapter; the old kit and `tests/lets/backlog/` are replaced; `contrib/backlog-adapter-kit/` and its flake and package entries go, if still present.
- **Skills:** `skills/lets-go/SKILL.md`, its references, and `skills/lets-plan/SKILL.md`; their checks in `tests/skill-interfaces.bats` and the `lets-go` prose checks.
- **Docs:** a new ADR in `docs/decisions/`; ADR-015 gets a supersession note for backlogs; `docs/backlog-adapter-contract.md` is removed; README mentions are updated.
- **Dependencies:** `gh` stays a runtime requirement, now called by lets instead of by the agent.
- **Backlog:** #180 has no target once this merges; #236 builds config-file adapters on this interface.
