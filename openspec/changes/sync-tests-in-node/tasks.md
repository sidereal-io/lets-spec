<!-- Build order follows the lets-verify-contracts skill, not test-first:
     contracts and types, then the implementation, then black-box tests
     through `lets` run as a program. design.md's Decisions say what
     each export does. -->

## 1. Contracts

- [x] 1.1 [medium] `tests/support/lets.ts` declares the helper module's exports from design decision 1 (`pinnedEnv`, `runLets`, `tempDir`, `git`, `buildRelease`, `standIn`, `snapshot`) with their types, and a doc comment on each that states its preconditions, its result and how it fails. Each body throws `not built yet` (verify: `pnpm check`) (✓ `pnpm check` passed)
- [x] 1.2 [easy] `tests/sync/project.ts` declares the sync fixture's exports from design decision 2 (`makeRelease`, `useRelease`, `project`, `rulesIn`, `fragment`, `shippedSkills`, `releaseFiles`, `setSchema`) with their types and doc comments, typed against the helper module. `useRelease` returns `release()`, the release's path. Each body throws `not built yet` (verify: `pnpm check`) (✓ `pnpm check` passed)

## 2. Implementation [depends-on: 1]

- [x] 2.1 [medium] The helper module works as design decisions 1, 4, 5 and 6 say: `runLets` runs `lets/bin/lets` with the pinned environment and `options.standIns` first on `PATH`, and rejects a run that passes its time limit; `tempDir` removes read-only trees; `standIn` answers from its table and logs each call; `snapshot` matches `project.bash`'s output fields (verify: `pnpm check`) (✓ `pnpm check` passed)
- [x] 2.2 [medium] The sync fixture works as design decision 2 says: one read-only release per test file with the four fixture skills and the 755 script, removed after the file and reached through `release()`, and a fresh git repository per test with `schema: lets-standard` and a stand-in `openspec` that prints a version (verify: `pnpm check`) (✓ `pnpm check` passed)

## 3. Black-box tests [depends-on: 2]

Each moved test keeps its bats name and the checks its bats test makes
(design decisions 3, 4 and 7). Delete each bats file in the task that
moves its tests.

- [x] 3.1 [parallel] [medium] `tests/sync/rules.test.ts` holds the 16 kept tests of `tests/sync-rules.bats`, and the bats file is deleted. "the rules say lets sync rewrites the copies, in both skills modes" keeps its phrase checks and its both-modes comparison, under a comment that names pull request #32. "the rules block names only plain things a project owner knows" and "the rules block says lets-go picks, claims and routes" are not moved (D12) (verify: `node --test tests/sync/rules.test.ts`) (✓ `node --test tests/sync/rules.test.ts` passed, 16 tests)
- [x] 3.2 [parallel] [medium] `tests/sync/setup.test.ts` holds the 22 tests of `tests/sync-setup.bats`, editing `openspec/config.yaml` as text with `setSchema` instead of `yq`, and the bats file is deleted (verify: `node --test tests/sync/setup.test.ts`) (✓ `node --test tests/sync/setup.test.ts` passed, 22 tests)
- [ ] 3.3 [parallel] [complex] `tests/sync/skills.test.ts` holds the 29 tests of `tests/sync-skills.bats`, reading `flows.json` with `JSON.parse` instead of `jq`, and the bats file is deleted (verify: `node --test tests/sync/skills.test.ts`)

## 4. Integration [depends-on: 3]

- [ ] 4.1 [easy] `tests/support/project.bash` is deleted, and the remaining bats files still pass with `common.bash` and `release.bash` (D10, D13) (verify: `bats tests`)
- [ ] 4.2 [easy] The `tests/` row of the README's *Development* table says that `tests/sync/` holds the black-box tests of `lets sync`, and no longer says the `*.bats` files test `lets sync` (D14) (verify: `! git grep -n 'end-to-end tests of .lets sync' README.md`)
- [ ] 4.3 [medium] Every check passes: `pnpm test`, `mise run check`, and `nix flake check`, whose `node-tests` check runs the 67 moved tests with no OpenSpec CLI and whose `commands` check runs the remaining bats files. The pull request says this story kept no unit test and deleted no Node test (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
