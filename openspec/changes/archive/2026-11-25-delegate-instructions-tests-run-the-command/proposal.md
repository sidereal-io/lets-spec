## Why

The tests of `lets delegate review instructions`, `handoff instructions`
and `step instructions` pass fake adapters into the command's function,
which no caller can do. A refactor inside `lets/src/delegate/` or
`lets/src/resolvers/` that changes no behavior can break them. The epic
#308 moves each `lets` behavior to a black-box test. This story comes
first among the delegate stories because the instructions commands
start no session, so they are the smallest place to prove the stand-in
`codex`, `claude` and `agy` that the later stories need.

## What Changes

- **New stand-ins** for `codex`, `claude` and `agy` in
  `tests/support/lets.ts`, built on its `standIn`. They answer the model
  listings `codex debug models` and `agy models`, or fail them. Later
  delegate stories extend them (D5).
- **New black-box tests** of the three instructions commands. They run
  `lets/bin/lets` as a program, with the `cli` and `subagent` resolvers
  chosen by a real lets config, and with no real `codex`, `claude` or
  `agy` on `PATH` (D2). They cover what each moved test checks: the JSON
  line, the guidance from the user's and the repository's config, the
  resolver chain, the models `cli` lists, and the warnings on stderr.
- **One black-box test of the listing's time limit:** stand-in `codex`
  and `agy` both hang, and the run still ends with both families listed
  bare, in well under 40 seconds (D11).
- **Removed:** `tests/lets/delegate/strategies.test.ts` (D7). The tests
  that the new tests cover are deleted from
  `tests/lets/delegate/instructions.test.ts`,
  `tests/lets/delegate/lookup.test.ts`,
  `tests/lets/resolvers/cli/cli.test.ts`,
  `tests/lets/resolvers/cli/delegate.test.ts` and
  `tests/lets/resolvers/subagent/subagent.test.ts` (D1).
- **Kept:** the 6 `withModels` and `inAdapter` tests in `lookup.test.ts`,
  for #318 and #319 (D8), and 3 tests with fake adapters, in one file,
  for behaviors that no `cli` or `subagent` resolver reaches (D10). The
  pull request lists each kept test with its reason.
- **Handoff:** the `handoff instructions` tests move as the fewest
  black-box tests. Whichever of this story and #306 merges second
  deletes them (D9).

`lets` does not change (D4), and no spec requirement changes. The change
sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `delegate-instructions` and `delegate-resolvers` specs say what
the instructions commands and the `cli` and `subagent` resolvers do, and
that stays the same (D4).

## Impact

- **Tests:** new stand-ins in `tests/support/lets.ts`; a new black-box
  test file for the instructions commands; fewer tests in the five
  files named above; `strategies.test.ts` deleted.
- **Unchanged:** `lets`; the T3 resolver's tests under
  `tests/lets/resolvers/t3/` (D3); `tests/lets/delegate/fixtures/command-deps.ts`,
  which later delegate stories still import (D6); the tests of `run`,
  `start` and `wait`, which #318 and #319 move.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the new
  file with no change to their commands. The time-limit test adds about
  20 seconds (D11).
