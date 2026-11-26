<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

The rules of the lets config are tested by calling `readConfig`,
`parseDocument`, `checkConfig`, `mergeDocuments`, `questionModeFor` and
the `run` of `lets go questions` directly, with a fake file system and a
fake git. No user can call them that way, and a refactor of
`lets/src/delegate/config.ts` that changes nothing a user sees can break
them. A wrong config is the first error a new user meets, so its tests
should show what that user sees. This is the last group of tests, apart
from the T3 resolver's, that fakes files for a command, in the epic #308.

## What Changes

- **New black-box tests of `lets go questions`.** They write a real
  user's lets config and a real repository's lets config,
  `.lets/config.yaml`, and run `lets/bin/lets` as a program (D4). They
  check:
  - where the user's lets config is: under `XDG_CONFIG_HOME` when it is
    set, and under `$HOME/.config` when it is unset or empty, with `HOME`
    pointed at a temporary folder (D5);
  - what a file must be: YAML, a mapping and version 3, and what `lets`
    prints when a file is not, or cannot be read;
  - how the two files merge, and which file an error names;
  - every value of `go.questions`.
- **New black-box tests of the `delegate` section,** through
  `lets delegate <strategy> instructions` (D4): the entries of the chain,
  each bad value and the file it names, keys `lets` does not know, and
  the `review`, `handoff` and `step` entries left unchecked. They join
  the tests of the guidance already in `tests/delegate/instructions.test.ts`.
- **Removed:** every test in `tests/lets/delegate/config.test.ts` (46),
  `tests/lets/go/questions.test.ts` (11) and `tests/lets/config-dir.test.ts`
  (2), so the three files go (D2). Each removed test is covered by a new
  black-box test, or by one already in `tests/delegate/`, except one
  (D6): that `fileOf` names the user's file for a key neither file sets.
  No command shows that, so it goes without cover, and the pull request
  says so.
- **Kept:** no unit test of the lets config (D6).
  `tests/lets/delegate/fixtures/command-deps.ts` and `fake-io.ts` stay,
  because other tests still import them (D9).

Every test this change adds is a Node test, run by `node --test`, and it
adds no bats test. The tests are built by
`skills/lets-verify-contracts/SKILL.md`, not test-first (D1). `lets` and
the config's keys do not change (D7). No spec requirement changes, so
the change sets `skip_specs: true`.

Not in this change: the backlog provider and `lets backlog --help`
(D3), which pull request #330 tests through `lets backlog` on another
stack; the T3 token file (D8); and the `lets go` tests in
`tests/lets/delegate/cli.test.ts`, which already run `lets` as a
program (D10).

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `delegate-config` and `go-questions` specs say what the lets
config does and what `lets go questions` prints, and that stays the
same (D7).

## Impact

- **Tests:** a new black-box test file for `lets go questions`; more
  tests in `tests/delegate/instructions.test.ts`;
  `tests/lets/delegate/config.test.ts`, `tests/lets/go/questions.test.ts`
  and `tests/lets/config-dir.test.ts` deleted.
- **Docs:** the `tests/` row of the README's *Development* table names
  the new black-box tests of `lets go questions`.
- **Unchanged:** `lets`; the T3 resolver's tests; `tests/lets/delegate/fixtures/`.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the new
  file with no change to their commands.
