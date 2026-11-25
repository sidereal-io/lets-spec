<!-- Build order follows the lets-verify-contracts skill, not test-first:
     contracts and types, then the implementation, then black-box tests
     that run the real programs. design.md's Decisions say what each
     export does and how each bats check converts. -->

## 1. Contracts

- [x] 1.1 [medium] `tests/support/lets.ts` declares the new exports from design decision 2 (`run` with its options type, `makeReadOnly`, `generatedSkills` and `tree`) with their types, and a doc comment on each that states its preconditions, its result and how it fails. Each new body throws `not built yet`. The existing exports keep their signatures (verify: `pnpm check`) (✓ `pnpm check` passed)
- [ ] 1.2 [easy] The root `package.json` has `yaml` at `^2.9.1` in `devDependencies`, added with `pnpm add -D -w yaml@^2.9.1`, and `pnpm-lock.yaml` changes only in its root importer (D12, design decision 8). If Nix reports a `pnpmDeps` hash mismatch, this commit also puts the reported hash into `flake.nix` (verify: `pnpm install --frozen-lockfile && pnpm check && nix build .#checks.x86_64-linux.node-tests -L`)

## 2. Implementation [depends-on: 1]

- [ ] 2.1 [medium] The helper module works as design decision 2 says: `run` runs a program with the pinned environment, standard input closed and a time limit, and rejects with a message that names the program and says it is not on `PATH` when it cannot be found; `runLets` is built on `run` and keeps its contract; `makeReadOnly` moves here from `tests/sync/project.ts`, which imports it; `buildRelease` calls `generatedSkills`; `tree` lists paths, types and content hashes without modes. The sync tests still pass unchanged (verify: `node --test "tests/sync/*.test.ts" && pnpm check`)

## 3. Black-box tests [depends-on: 2]

Each moved test keeps its bats name and the checks its bats test makes,
converted as design decision 5 says. Delete each bats file in the task
that moves its tests.

- [ ] 3.1 [parallel] [medium] `tests/release/build.test.ts` holds the 16 tests of `tests/release-build.bats`. It runs `build/build-release.mjs` and `lets/build.mjs` through `run`, reads release configs with `yaml` and `flows.json` with `JSON.parse`, and uses no `yq` or `jq`. The bats file is deleted (verify: `node --test tests/release/build.test.ts`)
- [ ] 3.2 [parallel] [complex] `tests/openspec/compat.test.ts` holds the 14 tests of `tests/openspec-compat.bats`. It runs the real `openspec` on `PATH` with `OPENSPEC_TELEMETRY=0` and `OPENSPEC_NO_UPDATE_CHECK=1`, loops over `lets-standard` and `lets-minimal` in each test with the schema named in every failure message, reads `schema.yaml` with `yaml`, and throws from setup steps that fail (design decisions 4 and 6). The bats file is deleted (verify: `node --test tests/openspec/compat.test.ts`)

## 4. Integration [depends-on: 3]

- [ ] 4.1 [easy] With no `openspec` on `PATH`, `tests/openspec/compat.test.ts` fails, not skips, and prints `the OpenSpec CLI is missing from PATH` (D10). If the `before` hook does not fail the run, each test checks for the CLI itself, as design.md's risks say (verify: `out="$(env PATH= "$(command -v node)" --test tests/openspec/compat.test.ts 2>&1)"; test $? -ne 0 && printf '%s' "$out" | grep -qF 'the OpenSpec CLI is missing from PATH'`)
- [ ] 4.2 [easy] The flake's `node-tests` check has `(packagesFor pkgs).openspec` in its `nativeBuildInputs`, and its comment no longer says it runs no real program (D7, design decision 7) (verify: `nix build .#checks.x86_64-linux.node-tests -L`)
- [ ] 4.3 [easy] The `tests/` row of the README's *Development* table names `release/` and `openspec/` as the Node tests of the release build and of each schema under the real OpenSpec CLI, and says `*.bats` holds only the checks of every command, file and skill the prose names (D13) (verify: `` ! git grep -nF 'end-to-end tests of the release build' README.md && git grep -nF '`release/`: ' README.md && git grep -nF '`openspec/`: ' README.md ``)
- [ ] 4.4 [medium] Every check passes: `pnpm test`, `mise run check` and `nix flake check`. `bats tests` runs only `tests/skill-interfaces.bats`, which still loads `tests/support/common.bash` and `tests/support/release.bash` (D6, D8). The pull request description gives the count of moved tests, 16 and 14 (verify: `pnpm test && mise run check && nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
