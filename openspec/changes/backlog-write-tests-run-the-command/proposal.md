## Why

The 40 tests of `lets backlog claim`, `release` and `complete`, and of
two claims racing (D1), call `run()` inside the process with a fake
`gh`. A reorganization of `lets/src/backlog/` that changes no behavior
can break them, and they are the backlog tests that matter most: a claim
that goes wrong leaves an issue half taken. The epic #308 moves the
tests to the command, and this story finishes the backlog group after
#315.

## What Changes

- **The stand-in can keep state.** `standIn` in `tests/support/lets.ts`
  gains a row whose answer comes from a function in a module, given the
  call and a state that earlier calls kept in a file (D6). Stand-ins can
  share that state, and a row can hold its call at a named gate until
  the test opens it, so a test sets the order of two runs of `lets`
  without sleeps (D11). Rows without these options work as they do now.
- **A stand-in GitHub issue** in `tests/backlog/` keeps one issue's
  assignees, comments, Status and state, and answers the `gh` calls of
  `claim`, `release` and `complete` from them.
- **New black-box tests** in `tests/backlog/` run `lets backlog claim`,
  `release` and `complete` as a program (D2). They check stdout, the
  exit code, the calls the stand-in `gh` logged and the state it kept.
  A claim token is checked by its shape, or read back from what the
  stand-in logged or kept (D7).
- **Race tests run two `lets backlog` processes** against one shared
  stand-in state. The clean-up case runs a real
  `lets backlog release` while the loser is held at a gate (D11).
- **Cases that relied on a timeout move with a failing `gh` call
  instead:** the recovery token kept after a failed claim comment, a
  failed state read, and a close that is not retried (D8).
- **Tests the black-box tests cover are deleted:** all of
  `race.test.ts` and `reclaim.test.ts`, and every test in
  `claim.test.ts`, `complete.test.ts` and `release.test.ts` except
  those kept below.
- **Kept in process, and listed with their reasons in the pull
  request** (D12):
  - the result "timed out; the write may have happened" for `claim` and
    `complete`, and the finite timeout on every write (D8);
  - the three tests that use the fake backlog provider with Jira-style
    keys (D9).

`lets` does not change, and no spec requirement changes (D3). The change
sets `skip_specs: true`. `tests/lets/backlog/fixtures/` stays, because
kept tests import it (D10). No bats test is added (D5).

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `lets-backlog` spec describes what `lets backlog` does, and
that stays the same (D3).

## Impact

- **Tests:** `tests/support/lets.ts` extended; a new stand-in issue
  module and new `tests/backlog/*.test.ts` files;
  `tests/lets/backlog/race.test.ts` and `reclaim.test.ts` deleted;
  `claim.test.ts`, `complete.test.ts` and `release.test.ts` cut down
  to the tests they keep.
- **Checks:** `pnpm test`, `pnpm run test:backlog` and the flake's
  `node-tests` check find the new files with their existing globs.
  No bats test is added or changed.
- **Unchanged:** `lets`, the specs, both fixtures in
  `tests/lets/backlog/fixtures/`, the tests of the read commands, and
  `openspec/glossary.md` (D13).
