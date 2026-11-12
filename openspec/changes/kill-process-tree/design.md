## Context

`realIo().execFile` in `lets/src/resolvers/kit/io.ts` runs a command with Node's `execFile`, in the process group of `lets` itself. With a time limit, a timer calls `child.kill()`, which sends `SIGTERM` to the command's own process only. The promise settles in `execFile`'s callback, which Node runs only after the command has exited *and* its stdout and stderr have closed. So a child that holds a pipe keeps the promise open. The result is `{ stdout, stderr, code, timedOut }`. It rejects only when the command cannot start, or when its output passes the 64 MiB `maxBuffer`. Node then kills the command, and the result is the same `cannot run <cmd>: …` error.

Four callers pass a time limit, and none needs to change:

- `cli`'s `execute`, for a review and for a step. It throws `TimeoutError` on `timedOut`, and the kit maps that to exit 6.
- `cli`'s model listings, with 20 seconds each.
- `t3`'s `issueToken`, when its caller gives a limit.

Node's `execFile` typings have no `detached` option, though `spawn` has one. With `detached: true` on Linux and macOS, the child leads a new process group and a new session. Then `process.kill(-pid, signal)` reaches every process still in that group, and `process.kill(-pid, 0)` tells whether any is left. A process in a new session has no controlling terminal, so the terminal's Ctrl-C no longer reaches it (D7). `lets` installs no signal handlers today.

This change stacks on #102 (`t3-review-waiting-is-transient`), which stacks on #221 (`t3-review-session-fit`). Neither touches `kit/io.ts`. #221 raises the default review limits to 30 and 45 minutes, and adds `checkout` to the result of `cli`'s `execute`. That changes when a timeout fires and what `execute` returns, but not how `execFile` stops a command, so nothing here depends on it (D9). #102 changes only `t3.ts`.

## Goals / Non-Goals

**Goals:**

- Keep `execFile`'s signature, its result and its errors as they are, so no caller and no fake changes.
- Bound how long `execFile` takes to return after a time limit, whatever holds the pipes.

**Non-Goals:**

- Stopping a process that has left the group, such as one started with `setsid`. That needs cgroups or a job object (D1).
- Stopping what a command leaves behind when it ends in time (D6).
- The `execFile` in `lets/src/io.ts` (D3).
- Stopping the group when `lets` itself is killed with `SIGKILL`, or exits through an uncaught error. Nothing can catch `SIGKILL`.

## Test Seams

- **Primary test seam:** the real `realIo().execFile`, in `tests/lets/resolvers/kit/io.test.ts`, with real processes. It already holds the timeout tests. Each new test has the shell write the process IDs it starts to a file in a temporary folder, then checks those processes after `execFile` returns.
- **Existing seams reused:** `cli`'s mapping of `timedOut` to exit 6 is already covered with the kit's fake io, in `tests/lets/resolvers/cli/cli.test.ts` and `delegate.test.ts`. The spec's `cli` scenarios hold because the kit stops the group, and `cli` maps the result as before. No `cli` test changes.
- **New tests** in `io.test.ts`:
  - `sh -c 'sleep 600 & echo $! > pids; sleep 600'` with `timeoutMs: 1000`: `timedOut` is `true`, the shell and both sleeps are gone, and it returns within 10 seconds.
  - The same with `trap '' TERM` in the shell, so the shell and its sleeps ignore `SIGTERM`: it returns after at least 5 seconds and within 10, and every process is gone.
  - A child started in a new session, which holds stdout open: `execFile` returns within 10 seconds. The test then stops that child itself.
  - A command that ends in time leaves its background child running. The child sends its output to `/dev/null`, so it holds no pipe. This pins D6. The test stops the child.
  - A signal reaches the group. A small fixture script, `tests/lets/resolvers/kit/fixtures/exec-and-wait.ts`, runs `realIo().execFile` on a shell that starts a child, with no time limit. The test starts the fixture with `node`, waits for the process ID file, and sends it `SIGINT`. Then the fixture ends by `SIGINT`, and the shell and its child are gone. A second case sends `SIGTERM`.
- **Fixture rule:** a process counts as gone when `process.kill(pid, 0)` throws `ESRCH`, or when `ps -o stat= -p <pid>` shows `Z`. An orphan's zombie can wait a moment for whatever adopted it to reap it.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `realIo().execFile` in `lets/src/resolvers/kit/io.ts`, which runs every command of the `cli` and `t3` resolvers. It now starts each command in a new session, and installs signal handlers while one runs. Its signature, result and errors do not change. The rest is tests and the `cli` section of `docs/resolvers.md`. No config, stored data or other resolver changes.

## Decisions

1. **`execFile` uses `spawn` with `detached: true`, for every command.** It collects stdout and stderr as UTF-8 strings, settles on `close` with the exit code, and rejects on `error` with `cannot run <cmd>: …`, as now. When the output passes 64 MiB, it stops the group as in decision 2 and rejects with the same error that `maxBuffer` gives today. It does not call `unref()`, so `lets` still waits for the command. Every command gets a group, not only those with a time limit, because the same handler (decision 4) then covers them all. *Alternatives:* keep `execFile` and pass `detached` through a cast. That relies on an option Node does not document for `execFile`. Or keep one group and find the command's descendants through `/proc` or `ps` at the time limit. A child whose parent has died is adopted by another process, so that search misses exactly the processes this change is for.
2. **At the time limit, the group gets `SIGTERM`, then `SIGKILL`.** `execFile` sets `timedOut`, sends `SIGTERM` to `-pid`, and checks `process.kill(-pid, 0)` every 100 ms. When the group is gone, it settles. After 5 seconds (`KILL_GRACE_MS`), it sends `SIGKILL` to `-pid` and settles at once (D4, D5). `ESRCH` from any of these means the group is gone. *Alternative:* `SIGKILL` at once. That gives a CLI no chance to save its session or stop its own children.
3. **After the time limit, only the group check settles the promise.** A `close` after the limit does not settle it, because the CLI can exit and close its pipes while a child that ignores `SIGTERM` still runs. When it settles, `execFile` destroys the stdout and stderr streams, so a process outside the group cannot hold `lets` open. The result keeps the output read so far, `code` is the exit code if the command has exited and `1` if not, and `timedOut` is `true`.
4. **While a command runs, `SIGINT`, `SIGTERM` and `SIGHUP` are passed on to its group.** The module keeps a set of running groups. The first command to start adds one handler for each signal, and the last to settle removes them. The handler sends the signal to every group in the set. Then it removes its handlers and sends the same signal to `lets` itself, so `lets` ends by that signal, as it would with no handler (D7). *Alternative:* a handler on `exit` only. Node runs no `exit` handler when a signal ends the process, so that would not cover Ctrl-C.
5. **Docs.** In the `cli` section of `docs/resolvers.md`, the sentence *A review that runs past its time limit is stopped* becomes: the CLI and every process it started are sent `SIGTERM`, and `SIGKILL` 5 seconds later, and the command exits 6. A process that moves itself out of the CLI's process group, such as a daemon, is not stopped. Ctrl-C reaches the CLI and every process it started. The step section already says a step past its limit is exit 6, and that stays as it is (D11).

No decision here is costly to reverse: each stays inside one function and its tests.

## Risks / Trade-offs

- [A CLI in a new session has no controlling terminal. A CLI that opens `/dev/tty` fails.] → `cli` runs each CLI in its print mode, with stdin and stdout piped, so none should read the terminal. `t3 auth` and `git` do not either. A CLI that did would fail at once with an error, not hang, and the error reaches the user as a refusal or a failed session.
- [A handler on `SIGINT` changes how `lets` ends.] → The handler re-sends the signal to `lets` after removing itself, so the exit status is the signal's, as before. It is installed only while a command runs.
- [Zombies make the group look alive.] → Node reaps the command itself. An orphan's zombie is reaped by whatever adopted it. If that is slow, `execFile` still settles when it sends `SIGKILL`, at 5 seconds.
- [A test that waits 5 seconds for `SIGKILL` slows `pnpm test`.] → One test waits the full grace period. The others settle as soon as the group is gone.
- [A process that leaves the group keeps running, with the user's rights.] → The docs say so. A sandbox or allow-list for steps is out of scope in epic #227.

## Migration & Rollback

N/A. Nothing changes shape. To roll back, revert the change: `execFile` then stops only the command's own process again.
