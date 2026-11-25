<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

`lets sync` is tested twice. The 94 tests under `tests/lets/sync/` call
its functions with a fake file system, and break when `lets/src/sync/`
is reorganized with no change in behavior. The program tests in
`tests/sync/`, which #322 wrote, already run `lets sync` as a command
and check most of the same behavior. This story is the first command
group of epic #308 to do without fakes, and the cheapest one.

## What Changes

- **New program tests in `tests/sync/`** for each behavior that only a
  fake-file test checks today (D5). They run `lets sync` as a command,
  through the helper module `tests/support/lets.ts` (D2, D4).
- **The helper module grows** what those tests need: a stand-in that
  records the folder it ran in, a `PATH` without the OpenSpec CLI, and a
  copy of the `lets` package with its own `release.json` and
  `releases/<flow>` (D4, D8).
- **Removed:** 90 of the 94 tests under `tests/lets/sync/`, and
  `tests/lets/sync/fixtures/fake-io.ts`, which only they import (D1,
  D9).
- **Kept:** the 4 `compareVersions` tests, in their own file, because
  `compareVersions` is a pure function whose branches would each need a
  package copy and a full sync run (D7). The pull request description
  lists them, with that reason (D12).
- **Moved:** `config-0.7.0.yaml` stays in use by
  `tests/sync/setup.test.ts`, so it moves out of the folder of the
  retired tests (D9).

`lets` does not change (D3), and no spec requirement changes (D11). The
change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `lets-sync` spec describes what `lets sync` does, and that
stays the same (D11).

## Impact

- **Tests:** new and extended tests in `tests/sync/*.test.ts`; new
  functions in `tests/support/lets.ts` and `tests/sync/project.ts`;
  every file under `tests/lets/sync/` deleted except the kept
  `compareVersions` tests and the moved fixture.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the
  same commands. The program tests take a little longer, because each
  new one runs `lets sync`.
- **Unchanged:** `lets`, the specs, the tests of other commands, the
  bats files, and `openspec/glossary.md` (D10).
