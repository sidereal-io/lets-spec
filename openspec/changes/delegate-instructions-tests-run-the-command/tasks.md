<!-- Build order follows the lets-verify-contracts skill, not test-first:
     contracts and types, then the implementation, then black-box tests
     through `lets` run as a program. design.md's Decisions say what
     each export does, and decision 6 says which test covers each
     deleted one. -->

## 1. Contracts

- [ ] 1.1 [medium] `tests/support/lets.ts` declares the additions from design decisions 1, 2 and 3, with their types and a doc comment on each that states its preconditions, its result and how it fails: `RunLetsOptions.onlyStandIns`, `StandInRow.hang`, the `logEnv` option of `standIn`, `StandIn.envs()`, `CodexModel`, `ListingFailure`, `FamilyOptions`, and the functions `codex`, `agy` and `claude`. Each new function body throws `not built yet`, and the existing exports behave as before (verify: `pnpm check`)

## 2. Implementation [depends-on: 1]

- [ ] 2.1 [medium] `runLets` with `onlyStandIns: true` gives `lets` a `PATH` of the stand-ins folder, then a folder that holds only a link to `git`, and rejects with a message when no `git` is on this process's `PATH`. A `standIn` row with `hang` logs the call, waits, and exits by itself after 60 seconds. `standIn` logs only the variables named in `logEnv`, and `envs()` returns them per call. The `lets sync` tests still pass (verify: `node --test "tests/sync/*.test.ts"`)
- [ ] 2.2 [medium] `codex`, `agy` and `claude` write stand-ins as design decision 2 says: `codex debug models` and `agy models` print the listing given, in the format `lets` reads, or fail as `signed-out`, `unreadable`, `cannot-start` or `hangs` say; `claude` answers no call (verify: `pnpm check`)

## 3. Black-box tests [depends-on: 2]

Every new test is in `tests/delegate/instructions.test.ts`, runs `lets`
with `onlyStandIns: true`, and makes its own folders as design decision
4 says. Delete each old test in the task that adds its cover (design
decision 6), never before. The tasks share files, so they run in order.

- [ ] 3.1 [complex] Black-box tests show which resolver answers and what it prints: the one JSON line for a review and for a step from `cli`; `[cli, subagent]` with no CLI on `PATH` answering `subagent`; `[subagent, cli]` answering `subagent` without calling `codex`; `[subagent]` with every CLI on `PATH` listing no options and calling none; an instructions run calling only the model listings; and exit 2, naming the right config file, when every resolver declines, in the user's config, in the repository's config, and with an empty chain. The covered tests are deleted from `tests/lets/delegate/instructions.test.ts`, the 9 chain tests from `tests/lets/delegate/lookup.test.ts`, and the first test from `tests/lets/resolvers/subagent/subagent.test.ts` (verify: `node --test tests/delegate/instructions.test.ts tests/lets/delegate/lookup.test.ts tests/lets/resolvers/subagent/subagent.test.ts`)
- [ ] 3.2 [complex] Black-box tests show the models `cli` lists: the order `gpt`, `claude`, `gemini`; only codex slugs with `visibility` `list`; each gemini model once without its effort; `claude` bare with no listing run; `cli` answering inside another harness with `T3CODE_HOME` set; no `CLAUDECODE` in a listing's environment; and the bare family with one `lets delegate: ` line on stderr naming the CLI when a listing is `signed-out`, `unreadable` or `cannot-start`, for a review and for a step. The 7 `options` tests are deleted from `tests/lets/resolvers/cli/cli.test.ts`, and the 7 instructions tests from `tests/lets/resolvers/cli/delegate.test.ts` (verify: `node --test tests/delegate/instructions.test.ts tests/lets/resolvers/cli/cli.test.ts tests/lets/resolvers/cli/delegate.test.ts`)
- [ ] 3.3 [medium] One black-box test, with stand-in `codex` and `agy` both set to `hangs` and a run time limit of 35 seconds, shows that both families are listed bare and that stderr has one line naming `codex` and one naming `agy` (D11, design decision 5) (verify: `node --test --test-name-pattern="hang" tests/delegate/instructions.test.ts`)
- [ ] 3.4 [medium] Black-box tests show where the guidance comes from: the intent's entry in the user's config; `null` for another intent or another strategy; a multi-line block kept whole; `delegate.step` and `delegate.step.story`, neither reaching the other; the repository's entry winning for one intent while the user's stays for another; only the user's config outside a Git repository; and exit 2 naming the file and the key for a number as guidance, for `review: code`, and for a bad entry in the repository's config, with no listing run. A bad entry for another intent or strategy still exits 0. The covered tests are deleted from `tests/lets/delegate/instructions.test.ts`, rewritten without handoff as design decision 6 says (verify: `node --test tests/delegate/instructions.test.ts tests/lets/delegate/instructions.test.ts`)
- [ ] 3.5 [easy] A `describe('handoff instructions')` block whose comment names #306 holds the 2 tests of D9: `[cli, subagent]` with every CLI on `PATH` answers a review with `cli` and a handoff with `subagent`, calling no CLI for the handoff; and the handoff's guidance comes from `delegate.handoff`. The last handoff tests in `tests/lets/delegate/instructions.test.ts` are deleted, and so is `tests/lets/delegate/strategies.test.ts` (D7) (verify: `node --test tests/delegate/instructions.test.ts tests/lets/delegate/instructions.test.ts`)
- [ ] 3.6 [easy] `tests/lets/delegate/instructions.test.ts` holds only the 3 fake-adapter tests of D10, under a top comment that says why each needs a fake: a step skips a resolver that runs no step; an `options` call that fails unexpectedly exits 4; a `detect` that throws exits 4, moved from `lookup.test.ts` and written through the command's `run`. `tests/lets/delegate/lookup.test.ts` holds only the 6 `withModels` and `inAdapter` tests of D8 (verify: `node --test tests/lets/delegate/instructions.test.ts tests/lets/delegate/lookup.test.ts`)

## 4. Integration [depends-on: 3]

- [ ] 4.1 [easy] The `tests/` row of the README's *Development* table says that `delegate/` holds the black-box tests of the `lets delegate` instructions commands (verify: `git grep -n 'delegate/.: black-box' README.md`)
- [ ] 4.2 [medium] Every check passes: `pnpm test`, `mise run check`, and `nix flake check`, whose `node-tests` check runs the new file in the Nix sandbox. The pull request lists the unit and fake-adapter tests this story kept, each with its reason (D8, D10), and the tests it deleted with the test that now covers each (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
