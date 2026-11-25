## Why

The epic #308 removes bats, and bats cannot go until its tests have
moved. The release build tests and the OpenSpec CLI tests come next
after #309: they guard the release every project installs and each
schema the OpenSpec CLI reads, and they already run a program and check
what it leaves behind. Only the runner changes.

## What Changes

- **New Node test files** in two folders beside `tests/sync/`:
  `tests/release/` holds the 16 tests from `tests/release-build.bats`,
  and `tests/openspec/` the 14 from `tests/openspec-compat.bats`. Each
  test keeps the check it has today (D1).
- **The OpenSpec tests run the real CLI:** whichever `openspec` is on
  `PATH`, with no version check (D2, D11). When none is on `PATH`, they
  fail and say the OpenSpec CLI is missing (D10). Each run of a program
  has a time limit, and the environment is the helper's pinned one plus
  `OPENSPEC_TELEMETRY=0` and `OPENSPEC_NO_UPDATE_CHECK=1` (D5).
- **The helper module grows:** `tests/support/lets.ts`, which #309
  wrote, gains what these tests share. No test copies it (D4).
- **New devDependency:** the root `package.json` adds `yaml` at
  `^2.9.1`, the version `lets` already uses, to read each schema's
  artifact list (D12).
- **The flake's `node-tests` check gets the OpenSpec CLI:** the flake's
  pinned `openspec` package, as the `commands` check has (D7).
- **Removed:** `tests/release-build.bats` and
  `tests/openspec-compat.bats` (D1). `tests/support/common.bash` and
  `tests/support/release.bash` stay, because
  `tests/skill-interfaces.bats` still loads them (D6).
- **README:** the `tests/` row of the *Development* table names the new
  folders, and says `*.bats` now holds only the prose checks (D13).

`build/build-release.mjs`, the schemas and `lets` do not change (D3),
and no spec requirement changes. The change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. No spec describes the release build or the schemas' behavior
under the OpenSpec CLI as a requirement, and this change alters neither
(D3).

## Impact

- **Tests:** new `tests/release/*.test.ts` and `tests/openspec/*.test.ts`
  files and additions to `tests/support/lets.ts`;
  `tests/release-build.bats` and `tests/openspec-compat.bats` deleted.
- **Checks:** `pnpm test` and the flake's `commands` check still run
  `bats tests`, now for `tests/skill-interfaces.bats` only, and keep
  `bats`, `jq` and `yq` (D8). The `node-tests` check adds the
  `openspec` package to its inputs.
- **Dependencies:** `yaml` in the root `package.json` and the root
  importer of `pnpm-lock.yaml`. No new package enters the lockfile.
- **Docs:** one row of the README's *Development* table.
- **Unchanged:** `lets`, `build/build-release.mjs`, `schemas/`,
  `tests/skill-interfaces.bats`, `tests/support/*.bash`, `mise.toml`'s
  OpenSpec pin, and `openspec/glossary.md` (D3, D6, D9, D11).
