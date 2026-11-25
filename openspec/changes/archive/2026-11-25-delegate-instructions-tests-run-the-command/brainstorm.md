## Story

#317 delegate-instructions-tests-run-the-command — the lets delegate
instructions commands are tested by running lets with stand-in codex,
claude and agy.
https://github.com/sidereal-io/lets-spec/issues/317

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#309 (pull request #322), which wrote `tests/support/lets.ts`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests does this story move? | `tests/lets/delegate/instructions.test.ts` (28), the chain tests in `tests/lets/delegate/lookup.test.ts`, `tests/lets/delegate/strategies.test.ts` (5), the 7 instructions tests in `tests/lets/resolvers/cli/delegate.test.ts`, the 7 `options` tests in `tests/lets/resolvers/cli/cli.test.ts`, and the `detect` and `options` test in `tests/lets/resolvers/subagent/subagent.test.ts`. | Evidence: #317 packet, *Scope* and *Relevant code*; counted in the files |
| D2 | Which resolvers do the black-box tests use? | `cli` and `subagent`, chosen by a real lets config. A test that names a fake `t3` only to fill the chain moves to `cli`. | Evidence: #317 packet, *What the plan needs to know* |
| D3 | Do the T3 resolver's tests change? | No. | Evidence: #308 *Shared decisions*; #317 packet, *Scope: out* |
| D4 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D5 | Where do the stand-in `codex`, `claude` and `agy` live? | In `tests/support/lets.ts`, built on its `standIn`. Later delegate stories extend them. | Evidence: #308 *Shared decisions*; #317 packet, *Scope* |
| D6 | Does `tests/lets/delegate/fixtures/command-deps.ts` go? | No. It stays until the last delegate story no longer imports it. | Evidence: #317 packet; #319 packet, *Scope* |
| D7 | What happens to `strategies.test.ts`? | It is deleted. Its 5 tests compare constants with typed copies. Black-box tests cover each strategy's intents (already in `tests/lets/delegate/cli.test.ts`) and its kind of session (which resolver answers). | Evidence: `tests/lets/delegate/strategies.test.ts`, `tests/lets/delegate/cli.test.ts` |
| D8 | Where do the 6 `withModels` and `inAdapter` tests in `lookup.test.ts` go? | They stay in `lookup.test.ts` for #318 and #319, which test the run commands. This story moves only the chain tests: which resolver answers, in what order, and the error when every resolver declines. | Assumption |
| D9 | Does this story move the `lets delegate handoff instructions` tests, though #306 retires handoff? | Yes, as the fewest black-box tests: `cli` declines a handoff and runs nothing even with `codex` on PATH, `subagent` answers next, and the guidance comes from `delegate.handoff`. Whichever of this story and #306 merges second deletes them. | Assumption |
| D10 | What happens to the tests that the real `cli` and `subagent` resolvers cannot reach: a resolver with no step is skipped, an `options` call that fails unexpectedly exits 4, a `detect` that throws exits 4? | They stay as they are, with fake adapters, in one file. The pull request lists each one with that reason. | Assumption |
| D11 | How is "a model listing past its 20-second limit lists the bare family and exits 0" tested? | One black-box test where stand-in `codex` and `agy` both hang: both families are listed bare, each warning names its CLI, and the run ends well under 40 seconds, which shows the two listings run at once. `lets` gets no way to shorten the limit. | Assumption |

## Changes from the story

- **Cut: how `lets` picks a model from `--model`.** The story's scope includes it, but only the run commands take `--model`. Its 6 tests stay in `lookup.test.ts` for #318 and #319 (D8).
- **Kept: 3 tests with fake adapters.** The story says the fake-adapter tests are gone, but no `cli` or `subagent` resolver reaches these 3 behaviours. They stay, and the pull request says why (D10).

Confirmed by user: yes
