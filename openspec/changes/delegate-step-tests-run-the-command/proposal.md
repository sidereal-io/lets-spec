## Why

`lets-go` runs every step of a change through `lets delegate step run`,
`step start` and `step wait`. Their tests pass fake adapters, a fake io
and a fake clock into the commands' functions, which no caller can do.
So a refactor inside `lets/src/delegate/` that changes no behavior can
break them, and they cannot see what a real background process leaves
in a real repository. #318 taught the stand-ins to write files, commit
and log their stdin and folder, so these tests can move now. This story
finishes the `lets delegate` commands in the epic #308.

## What Changes

- **New black-box tests of `step run`.** They run `lets/bin/lets` as a
  program in a real Git repository, with the `cli` and `subagent`
  resolvers chosen by a real lets config, and with only the stand-ins
  and `git` on `PATH`, through `tests/delegate/repo.ts` (D2). They check
  the step report on stdout for each outcome, the record line on stderr,
  each exit code, `--answers-file`, `--exit-file`, the time limit each
  intent gets, and the exact write-mode command `lets` gives `codex`,
  `claude` and `agy`, read from the stand-in's log.
- **New black-box tests of `step start` and `step wait`.** A test starts
  a real background step, in the repository or in a Git worktree, and
  reads its run record, report file, meta file and exit file. `step
  wait` is checked on steps that end, steps that still run, and steps
  whose process was stopped before it recorded an exit code.
- **Two timeout tests,** each about 60 seconds, in one file of their
  own whose two tests run at the same time: `step run` with a stand-in
  that hangs, and `step wait` on a step that still runs (D8).
- **Values from the real clock** are checked by their form and by
  falling between the moments just before and just after the run (D7).
- **Removed:** each test whose behavior a new black-box test covers.
  That is every test in `tests/lets/delegate/background.test.ts` and all
  but one in `step.test.ts` (D1); the 12 step tests in
  `tests/lets/resolvers/cli/delegate.test.ts`; the 6 write-mode
  `runCommand` tests in `tests/lets/resolvers/cli/cli.test.ts`, so that
  file goes. `background.test.ts` and `source-tree.test.ts` are deleted
  (D6). The test of a process that cannot start is deleted without a
  direct twin, because the test of a report file that cannot be opened
  shows the same result (D9).
- **Kept, each with its reason in the pull request:**
  - the 19 unit tests in `tests/lets/delegate/report.test.ts` (D5);
  - "a finish that fails is reported, and the report stands" in
    `step.test.ts`, as a fake-adapter test (D9);
  - "finish removes nothing for a process handle whose id is not a
    session name" in `tests/lets/resolvers/cli/delegate.test.ts` (D11);
  - `tests/lets/delegate/fixtures/`, which other tests still import.
    Only the parts no remaining test uses are removed (D10).

Every test this change adds, moves or keeps is a Node test, and it adds
no bats test (D13). The tests are built by
`skills/lets-verify-contracts/SKILL.md`, not test-first (D12). `lets`
does not change (D4), and the T3 resolver's tests do not change (D3).
No spec requirement changes, so the change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `delegate-step` and `delegate-resolvers` specs say what
`step run`, `step start`, `step wait` and the `cli` and `subagent`
resolvers do, and that stays the same (D4).

## Impact

- **Tests:** new black-box test files and a small setup module under
  `tests/delegate/`; fewer tests in `tests/lets/delegate/step.test.ts`
  and `tests/lets/resolvers/cli/delegate.test.ts`;
  `tests/lets/delegate/background.test.ts`, `source-tree.test.ts` and
  `tests/lets/resolvers/cli/cli.test.ts` deleted; unused parts of
  `tests/lets/delegate/fixtures/` removed.
- **Docs:** the `tests/` row of the README's *Development* table names
  the step commands among the black-box tests.
- **Unchanged:** `lets`; the T3 resolver's tests under
  `tests/lets/resolvers/t3/`; `report.test.ts`.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the new
  files with no change to their commands. The timeout file takes about
  60 seconds, which Node runs beside the other files (D8).
