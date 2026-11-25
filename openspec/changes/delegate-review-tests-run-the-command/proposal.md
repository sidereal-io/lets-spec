## Why

The tests of `lets delegate review run` and `handoff run` pass fake
adapters and a fake io into the command's function, which no caller can
do. A refactor inside `lets/src/delegate/` or `lets/src/resolvers/` that
changes no behavior can break them, and they cannot see what a review
leaves in a real repository. The epic #308 moves each `lets` behavior to
a black-box test. #317 wrote the stand-in `codex`, `claude` and `agy`,
so `review run`, the delegate command that skills call most, can move
now.

## What Changes

- **The stand-ins do more** (D6). A row of a stand-in's table can write
  files, such as the last message `codex` writes to the path after `-o`,
  or a file outside `.workspace/`, and can make a commit. Each call also
  logs its stdin and the folder it ran in. These go in
  `tests/support/lets.ts`, so #319 reuses them for `step run`.
- **New black-box tests of `review run`.** They run `lets/bin/lets` as a
  program in a real Git repository, with the `cli` and `subagent`
  resolvers chosen by a real lets config, and with only the stand-ins and
  `git` on `PATH` (D2). They check the final message on stdout, the
  metadata line on stderr, each exit code, the next model after a
  refusal, the tree check after the session, and the exact command
  `lets` gives `codex`, `claude` and `agy`, read from the stand-in's log.
- **One black-box test of the timeout,** about 60 seconds long, in a file
  of its own: stand-in `claude` hangs, and `--timeout-minutes 1` ends
  the run with exit 6 (D7).
- **Handoff:** one `describe('handoff run')` block, naming #306, holds
  the black-box tests of the 4 handoff behaviors that `cli` and
  `subagent` reach. Whichever of this story and #306 merges second
  deletes the handoff tests (D5).
- **Removed:** each fake-adapter or internal test whose behavior a new
  black-box test covers, from `tests/lets/delegate/review.test.ts`,
  `handoff.test.ts`, `guarded.test.ts`, `git.test.ts` and
  `lookup.test.ts`, and from `tests/lets/resolvers/cli/cli.test.ts` and
  `delegate.test.ts` (D1, D10). `lookup.test.ts` is deleted.
- **Kept, each with its reason in the pull request** (D5, D8, D9):
  - 3 fake-adapter tests in `review.test.ts` and 4 in `handoff.test.ts`
    that no `cli` or `subagent` run reaches;
  - "rethrows an error it does not know" in `guarded.test.ts`;
  - the 2 `findRepoRoot` tests in `git.test.ts`, for #320;
  - the step tests and "finish removes nothing for a process handle
    whose id is not a session name" in
    `tests/lets/resolvers/cli/delegate.test.ts`, and the write-mode
    `runCommand` tests in `cli.test.ts`, for #319;
  - `tests/lets/io.test.ts` and `tests/lets/resolvers/kit/io.test.ts`,
    which run real processes and fake nothing.

Every test this change adds is a Node test, and it adds no bats test
(D12). The tests are built by `skills/lets-verify-contracts/SKILL.md`,
not test-first (D11). `lets` does not change (D4), and no spec
requirement changes, so the change sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change moves tests, and adds no behavior.

### Modified Capabilities

None. The `delegate-review` and `delegate-resolvers` specs say what
`review run`, `handoff run` and the `cli` and `subagent` resolvers do,
and that stays the same (D4).

## Impact

- **Tests:** new stand-in abilities in `tests/support/lets.ts`; new
  black-box test files under `tests/delegate/`; fewer tests in six of the
  files named above, and `lookup.test.ts` deleted.
- **Unchanged:** `lets`; the T3 resolver's tests under
  `tests/lets/resolvers/t3/` (D3); `tests/lets/delegate/fixtures/`,
  which the kept tests and the `step` tests still import; the tests of
  `step run`, `start` and `wait`, which #319 moves.
- **Checks:** `pnpm test` and the flake's `node-tests` check run the new
  files with no change to their commands. The timeout test adds about 60
  seconds to its own file, which Node runs beside the others (D7).
