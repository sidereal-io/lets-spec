## Why

The epic #308 removes bats, and bats cannot go until its tests have
moved. The 68 `lets sync` tests that bats runs come first: they already
run `lets` as a program, so moving them changes no check, and the helper
module they need is the one every later story of the epic uses (D5).

## What Changes

- **New helper module** in `tests/support/`, in TypeScript. It runs
  `lets/bin/lets` as a program with a time limit, makes a temporary git
  repository, builds a test release with `build/build-release.mjs`,
  makes stand-in programs on `PATH` and pins the environment (D3, D5,
  D6, D8).
- **New Node test files** that hold the `lets sync` tests from
  `tests/sync-rules.bats`, `tests/sync-setup.bats` and
  `tests/sync-skills.bats`. Each test keeps the check it has today
  (D1, D3). Each file builds one release and gives each test a fresh
  repository (D7). The tests use neither `yq` nor `jq` (D9).
- **Two tests are dropped**, because they only look for phrases in the
  release's rules text. The test of the rules text that guards the
  regression fixed in pull request #32 stays, and names it. So 68 of
  the 69 bats tests move (D12).
- **Removed:** the three sync bats files and `tests/support/project.bash`
  (D1, D13). `common.bash` and `release.bash` stay until #310 (D10).
- **README:** the `tests/` row of the *Development* table stops saying
  the bats files test `lets sync` (D14).

`lets` does not change (D4), and no spec requirement changes. The
change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `lets-sync` spec describes what `lets sync` does, and that
stays the same (D4).

## Impact

- **Tests:** new `tests/support/*.ts` and `tests/sync/*.test.ts` files;
  `tests/sync-rules.bats`, `tests/sync-setup.bats`,
  `tests/sync-skills.bats` and `tests/support/project.bash` deleted.
- **Checks:** `pnpm test` and the flake's `node-tests` and `commands`
  checks run the new tests and the remaining bats files without change
  to their commands (D11). The `node-tests` check has no OpenSpec CLI,
  which the stand-in `openspec` covers (D8).
- **Docs:** one row of the README's *Development* table.
- **Unchanged:** `lets`, the Node tests under `tests/lets/sync/` (D2),
  the other bats files, and `openspec/glossary.md` (D15).
