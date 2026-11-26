**Why:** `lets delegate handoff` lost its last caller when ADR-018 removed the `lets-build` offer, and the README still shows `delegate.handoff.apply.guidance`, so people set a key that nothing uses.

## Story

#306 retire-handoff — lets has no handoff strategy, command or config key,
https://github.com/sidereal-io/lets-spec/issues/306

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Does anything still call `lets delegate handoff`? | No skill does. Only tests, the two smoke checks in `flake.nix`, the README and `docs/resolvers.md` run or show it. | Evidence: `grep -rn handoff skills/ lets/ tests/ flake.nix` |
| D2 | What does a config that still holds `delegate.handoff` do once the strategy is gone? | `checkConfig` copies only the keys it knows, so the key is ignored and the command runs. No config version change is needed. Whether `lets` should also warn is still open. | Evidence: `lets/src/delegate/config.ts:110` |
| D3 | What does `lets delegate handoff` print once the command is gone? | Commander's `error: unknown command 'handoff'`, exit 2, as for any unknown strategy today. Whether to add a pointer to `lets-go` is still open. | Evidence: `lets/bin/lets delegate bogus run` |
| D4 | Do the "glossary handoff" of `lets-shape` and `lets-go`, and the line "offer no handoff" in `lets-plan`, belong to this change? | No. They use the word in another sense and are not the `handoff` strategy. They stay. | Evidence: `skills/lets-shape/SKILL.md`, `skills/lets-go/references/glossary-handoff.md`, `skills/lets-plan/SKILL.md:70` |
| D5 | Does the `null` effort path in the `t3` resolver go with `start`? | Yes. `start` is its only caller (`launchThread(input, { effort: null })`). Without it, every T3 session has an effort, and `StartInput` goes from the adapter contract and the test fixtures. | Evidence: `lets/src/resolvers/t3/t3.ts:142`, `:463`, `:596`; `lets/src/resolvers/kit/adapter.ts:30` |
| D6 | Is the story small enough for one change? | Yes: about eight tasks, covering the command and strategy, the adapter and resolvers, the config and lookup, the tests, the smoke checks, the README, `docs/resolvers.md`, and the spec deltas. | Evidence: the files above |

## Changes from the story

- Added: the two smoke checks in `flake.nix` (lines 262 and 319) run `lets delegate handoff run`. They move to a command that still exists, or `nix flake check` fails. The packet does not list them.
- Added: `tests/lets/delegate/fixtures/command-deps.ts` builds a stand-in adapter with `start`. It loses that method. The packet counts the test files but does not name this one.

Confirmed by user: no
