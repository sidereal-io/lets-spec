## Why

When a delegated session runs past its time limit, `lets` stops only the CLI's own process. A child the CLI started, such as a build, a test run or a background write, can keep running, and its open pipes can delay the exit 6. Since #156, a `cli` step runs with no sandbox and with the user's own rights. So a surviving child can keep changing the repository after the caller has moved on, or retried the step.

## What Changes

- The kit's `execFile` starts each command in a process group of its own (D1, D8).
- When the command runs past its time limit, `execFile` sends `SIGTERM` to the whole group, and `SIGKILL` to it 5 seconds later if any process in it is still alive (D4).
- After a timeout, `execFile` returns once the group is gone or `SIGKILL` is sent, without waiting for the output pipes to close. `lets delegate review run` and `step run` exit 6 at most about 5 seconds after the limit (D5).
- This reaches every kit command that has a time limit: `cli` reviews, steps and model listings, and the `t3` resolver's token request. No resolver code changes (D2).
- **Added to the story:** while a command runs, a `SIGINT`, `SIGTERM` or `SIGHUP` that `lets` gets is passed on to the command's group. Ctrl-C then still stops the whole session, as it does today (D7).
- `docs/resolvers.md` says what a timeout stops, and what it cannot (D11).
- Unchanged: a command that ends in time (D6), a process that moves itself to a new group or session (D1), and the `execFile` in `lets/src/io.ts` (D3).
- #221's longer review limits and #102's `waiting` fix change nothing this relies on (D9).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: two new requirements, *A timed-out cli session stops every process it started* and *A signal to lets reaches every process a cli session started*.

## Impact

- Code: `lets/src/resolvers/kit/io.ts` (`realIo().execFile`).
- Tests: `tests/lets/resolvers/kit/io.test.ts`.
- Docs: `docs/resolvers.md`.
- Output: none changes. A timed-out session exits 6 as before, now within a few seconds of its limit.
- This repository gets the fix only at the next release, when its `lets` pin moves past 0.7.0.
