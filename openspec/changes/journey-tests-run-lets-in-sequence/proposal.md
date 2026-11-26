## Why

Every `lets` command now has black-box tests of its own, but none shows
that what one command prints is what the next command takes. A change to
a field name or an exit code can pass every single-command test and still
break a `lets-go` run. This story is the capstone of the epic #308: it
adds journey tests (D1), so a broken join between two commands fails in
the maintainer's checks before it reaches a user.

## What Changes

- **New: two journey tests,** in a file of their own, run by
  `node --test` (D7). Each runs `lets/bin/lets` as a program, several
  times, in one temporary Git repository, with stand-ins on `PATH`. Each
  command takes the values it needs from what the one before printed.
  - **The story journey,** as `lets-go` runs one story (D2): `lets sync`,
    `lets sync --check`, `lets backlog ready`, `lets backlog item`,
    `lets backlog claim`, `lets delegate step instructions --for plan`,
    then `lets delegate step run --for plan` with one `--model` per
    option it listed.
  - **The epic-wave journey,** as `lets-go` runs the first wave of an
    epic (D2): `lets backlog item <parent>`, `lets backlog waves --only`
    with the parent's story keys, `lets delegate step start --for story`
    for each story of the first wave, then `lets delegate step wait`
    until each has ended.
- **What each test checks at the end** is the state the whole journey
  leaves, not each command again (D4). The story journey checks the
  stand-in issue's assignee, Status and claim comment, that each listed
  model reached its stand-in in order, and the report on stdout. The
  epic-wave journey checks each story's exit and report file, and that
  no step process still runs.
- **Left out: `lets backlog complete`.** No path `lets-go` takes runs
  it. Its own tests in `tests/backlog/complete.test.ts` still cover it
  (D3).
- **Possibly new: small parts of the helper module** that a sequence of
  commands needs. No new stand-in (D6).

The tests are built by `skills/lets-verify-contracts/SKILL.md`, not
test-first (D8). `lets` does not change (D5). No spec requirement
changes, so the change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change adds tests, and no behavior.

### Modified Capabilities

None. The `lets-sync`, `lets-backlog`, `delegate-instructions` and
`delegate-step` specs say what each command does, and that stays the
same (D5).

## Impact

- **Tests:** a new journey test file under `tests/`. It reuses the
  fixtures the command groups already have: the test release of
  `tests/sync/`, the stand-in `gh` rows and issue of `tests/backlog/`,
  and the repository and step helpers of `tests/delegate/`.
- **Docs:** the `tests/` row of the README's *Development* table names
  the journey tests.
- **Unchanged:** `lets`; every existing test.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the new
  file with no change to their commands, since both run
  `tests/**/*.test.ts`.
