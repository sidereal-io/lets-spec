## 1. Stop the whole process group

- [x] 1.1 [medium] The kit's `realIo().execFile` starts each command with `spawn` and `detached: true`, and keeps today's results: input on stdin, stdout, stderr and the exit code as strings, `cannot run <cmd>: …` for a command that cannot start, and the same rejection when the output passes 64 MiB. A new test covers the missing command; the existing tests stay green (verify: node --test tests/lets/resolvers/kit/io.test.ts) (✓ node --test tests/lets/resolvers/kit/io.test.ts passed, 12 tests)
- [x] 1.2 [medium] After its time limit, `execFile` stops a grandchild too: `sh -c 'sleep 600 & echo $! > pids; sleep 600'` with `timeoutMs: 1000` returns `timedOut: true` within 10 seconds, and the shell and both sleeps are gone. The test's "gone" check reads `/proc/<pid>/stat` on Linux and runs `ps` only where there is no `/proc` (verify: node --test tests/lets/resolvers/kit/io.test.ts) (✓ node --test tests/lets/resolvers/kit/io.test.ts passed, 13 tests)
- [x] 1.3 [medium] A group that ignores `SIGTERM` (`trap '' TERM` in the shell) gets `SIGKILL` 5 seconds after `SIGTERM`. `execFile` returns no sooner than 5 seconds and no later than 10 seconds after the limit, and every process in the group is gone (verify: node --test tests/lets/resolvers/kit/io.test.ts) (✓ node --test tests/lets/resolvers/kit/io.test.ts passed, 14 tests)
- [ ] 1.4 [easy] A process in a new session that holds the command's stdout open does not delay a timed-out `execFile`: it returns within 10 seconds of the limit. The test stops that process itself (verify: node --test tests/lets/resolvers/kit/io.test.ts)
- [ ] 1.5 [easy] A command that ends in time is not signalled: a background child that sends its output to `/dev/null` is still running after `execFile` returns. The test stops the child itself (verify: node --test tests/lets/resolvers/kit/io.test.ts)

## 2. Pass signals on to running groups [depends-on: 1]

- [ ] 2.1 [complex] While a command runs, a `SIGINT` or `SIGTERM` to `lets` reaches the command's group, and `lets` then ends by that signal. A fixture, `tests/lets/resolvers/kit/fixtures/exec-and-wait.ts`, runs `realIo().execFile` on a shell that starts a child, with no time limit. The test starts it with `node`, waits for its process ID file, sends the signal, and checks that the fixture ended by that signal and that the shell and its child are gone (verify: node --test tests/lets/resolvers/kit/io.test.ts)
- [ ] 2.2 [medium] A signal still reaches every running group when another command's group has already ended but its command has not settled, because a process in a new session holds its stdout. The handler ignores `ESRCH` and `EPERM` for that group. The fixture gains this case (verify: node --test tests/lets/resolvers/kit/io.test.ts)
- [ ] 2.3 [easy] `execFile` leaves no signal handler behind: `process.listenerCount` for `SIGINT`, `SIGTERM` and `SIGHUP` is back to its starting value after a command settles, after a timeout, and after a command that cannot start (verify: node --test tests/lets/resolvers/kit/io.test.ts)

## 3. Docs [parallel]

- [ ] 3.1 [easy] The `cli` section of `docs/resolvers.md` replaces *A review that runs past its time limit is stopped*. The new text says that `lets` sends `SIGTERM` to the CLI and every process it started, then `SIGKILL` 5 seconds later, and exits 6. It says that `lets` cannot stop a process that moves itself out of the CLI's process group, such as a daemon, and that Ctrl-C reaches the CLI and every process it started (verify: grep -n "SIGKILL" docs/resolvers.md)

## 4. Integration [depends-on: 1, 2, 3]

- [ ] 4.1 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger

- 1.3: task 1.2 built the whole of design.md decision 2, `SIGKILL` included, so the new test passed when it was written. To show that it tests the `SIGKILL`, it was run once with that line removed, and it failed: the group was still alive.
