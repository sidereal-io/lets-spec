## Story

#318 delegate-review-tests-run-the-command — `lets delegate review run`
and `handoff run` are tested by running lets with stand-in harness
programs.
https://github.com/sidereal-io/lets-spec/issues/318

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#317 (pull request #327), which wrote the stand-in `codex`, `claude` and
`agy` in `tests/support/lets.ts`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests does this story move? | The `review run` and `handoff run` tests in `tests/lets/delegate/review.test.ts` (40), `handoff.test.ts` (24), `guarded.test.ts` (4) and `git.test.ts` (6); the read-only `runCommand` tests and the 3 adapter tests in `tests/lets/resolvers/cli/cli.test.ts`; the review and handoff tests in `tests/lets/resolvers/cli/delegate.test.ts`. | Evidence: #318 packet, *Scope* and *Relevant code* |
| D2 | Which resolvers do the black-box tests use? | `cli` and `subagent`, chosen by a real lets config, with only the stand-ins and `git` on `PATH`. | Evidence: #317 design, decisions 1 and 4 |
| D3 | Do the T3 resolver's tests change? | No. | Evidence: #308 *Shared decisions*; #318 packet, *Scope: out* |
| D4 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D5 | What happens to the 24 tests in `handoff.test.ts`, though #306 removes handoff? | As #317 did: one `describe('handoff run')` block that names #306 holds what `cli` and `subagent` reach: `cli` declines and runs no CLI, `subagent` saves the prompt under the normalized name and hands it back, an unreadable prompt file is exit 2, a bad chain is exit 2 and saves no prompt. `handoff.test.ts` keeps, with a top comment saying why, the 4 that no `cli` or `subagent` reaches: the handle line, a refused model passing to the next, every model refused is exit 3, any other failure is exit 4. The rest are deleted. Whichever of this story and #306 merges second deletes the handoff tests. | Assumption |
| D6 | Can a stand-in do more than answer and log? | Yes. A row can write a file, such as codex's last message at the path after `-o` or a file outside `.workspace/`, and can make a commit. Each call also logs its stdin. These go in `tests/support/lets.ts`, so #319 reuses them. | Assumption |
| D7 | How is the timeout (exit 6) tested, when `--timeout-minutes` takes nothing under 1? | One test of about 60 seconds, in a file of its own, so Node runs it beside the other files. Stand-in `claude` hangs, the run uses `--timeout-minutes 1`, and the test checks exit 6 and the line `did not finish in 1 minutes`. | Assumption |
| D8 | Do `tests/lets/io.test.ts` (11) and `tests/lets/resolvers/kit/io.test.ts` (21) become `review run` tests? | No. Both stay as they are; the pull request lists them as kept. Through `review run` each case would need a 1-minute timeout, and `tests/lets/io.test.ts` covers the io `review run` uses only for git. | Assumption |
| D9 | Which tests that no `cli` or `subagent` run reaches stay? | In `review.test.ts`, 3 fake-adapter tests: a checkout somewhere else, a null checkout, and a finish that fails is reported. In `guarded.test.ts`, only "rethrows an error it does not know". In `git.test.ts`, the 2 `findRepoRoot` tests, for #320. In `tests/lets/delegate/cli.test.ts`, "finish removes nothing for an id that is not a session name". In `tests/lets/resolvers/cli/delegate.test.ts`, the step tests, and in `cli.test.ts` the write-mode `runCommand` tests, both for #319. The pull request lists each kept test with its reason. | Assumption |
| D10 | What happens to the 6 `withModels` and `inAdapter` tests that #317 left in `lookup.test.ts`? | They are deleted once `review run` black-box tests cover each: the first model only, the next model on a refusal, a stop at a failure that is not a refusal, every model refused is exit 3, an unknown error inside the resolver is exit 4, and a known error keeps its exit code. | Evidence: #308 *Shared decisions*; `lets/src/delegate/lookup.ts` |
| D11 | How are the tests built? | By `skills/lets-verify-contracts/SKILL.md` in this checkout, not test-first. | User |
| D12 | May the change add or move bats tests? | No. Every test it adds, moves or keeps is a Node test, run by `node --test`. | User |

## Changes from the story

- **Kept: some tests with fake adapters.** The story says the
  fake-adapter tests are gone, but no `cli` or `subagent` resolver
  reaches 3 review behaviors, 4 handoff behaviors and one `guarded`
  case. They stay, and the pull request says why (D5, D9).
- **Kept: the two `io.test.ts` files.** They run real processes and
  fake nothing (D8).
- **Left for other stories:** the 2 `findRepoRoot` tests, for #320,
  and the write-mode `runCommand` and step tests, for #319 (D9).
- **Added: the 6 `lookup.test.ts` tests** that #317 left for this story
  and #319 are moved here, because `review run` reaches each (D10).

Confirmed by user: yes
