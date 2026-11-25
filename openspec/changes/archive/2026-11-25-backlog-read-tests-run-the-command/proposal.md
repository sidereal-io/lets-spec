## Why

Of the 157 tests of the `lets backlog` commands that only read, 8 run
`lets` as a program (D1). The rest call internal functions with a fake
`gh` inside the process, so a reorganization of `lets/src/backlog/` that
changes no behavior breaks them. The epic #308 moves the tests to the
command, and this story also writes the stand-in `gh` that #316 needs
for the commands that write.

## What Changes

- **The helper module learns to stand in for `gh`.** `standIn` in
  `tests/support/lets.ts` can answer a call by the start of its argument
  list, as well as by the whole list, so a test need not copy the
  GraphQL query `lets` sends. It still logs each call (D4).
- **New black-box tests** in `tests/backlog/` run `lets backlog` as a
  program for `ready`, `item`, `find`, `key`, `waves`, `--help`, the
  rules every backlog command shares, and the choice of backlog
  provider (D2, D10). Each checks only stdout, the exit code and the
  calls the stand-in `gh` logged.
- **The 8 tests in `tests/lets/backlog/cli.test.ts` move** onto the
  helper module, and the file and its own fake `gh` go (D6).
- **Tests the black-box tests cover are deleted:** all of
  `policy.test.ts` (D8), `config.test.ts` (D9) and `find.test.ts`, and
  every test in `ready.test.ts`, `item.test.ts`, `key.test.ts`,
  `commands.test.ts` and `waves.test.ts` except those kept below.
- **Kept as they are, and listed with their reasons in the pull
  request** (D11):
  - the 34 tests of the pure functions in `waves.ts` (D7);
  - the 4 tests that use the fake backlog provider with Jira-style keys
    (D13);
  - the 2 tests of the `gh` timeout, narrowed to the timeout (D14).
- **README:** the `tests/` row of the *Development* table names
  `backlog/`.

`lets` does not change (D3), and no spec requirement changes. The
change sets `skip_specs: true`. `fixtures/fake-gh.ts` and
`fixtures/fake-provider.ts` stay for #316 (D5).

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `lets-backlog` spec describes what `lets backlog` does, and
that stays the same (D3).

## Impact

- **Tests:** `tests/support/lets.ts` extended; new
  `tests/backlog/*.test.ts` files; `tests/lets/backlog/cli.test.ts`,
  `policy.test.ts`, `config.test.ts` and `find.test.ts` deleted;
  `ready.test.ts`, `item.test.ts`, `key.test.ts`, `commands.test.ts` and
  `waves.test.ts` cut down to the tests they keep.
- **Checks:** `pnpm test` and the flake's `node-tests` check find the
  new files with their existing glob. The `test:backlog` script in
  `package.json` also runs `tests/backlog/`. No bats test is added or
  changed.
- **Docs:** one row of the README's *Development* table.
- **Unchanged:** `lets`, the tests of `claim`, `release`, `complete`,
  `race` and `reclaim` (#316), both fixtures, and
  `openspec/glossary.md` (D12).
