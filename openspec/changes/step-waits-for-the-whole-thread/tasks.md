<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- Build test-first, with the lets-test-first skill. The spec delta in
     specs/delegate-resolvers/spec.md is already written: archive applies
     it, and no task edits openspec/specs/. design.md's Decisions 1 to 5
     say where each piece goes. All code is in lets/src/resolvers/t3/t3.ts;
     the unit tests are in tests/lets/resolvers/t3/t3.test.ts, driven by
     its running(db, steps) helper, where each fake sleep applies the next
     change to the in-memory database. No task touches the prompts or the
     skills (ledger D9). -->

## 1. Read a thread's awaited background tasks

- [x] 1.1 [medium] An exported `awaitedTasks(db, threadId)` in `t3.ts` returns how many `pendingBackgroundTasks` entries have `awaited: true`, summed over every row of `orchestration_v2_projection_provider_threads` whose `thread_id` matches, by design.md's Decision 1. An entry with `awaited: false`, an empty list, another thread's row and no row at all each count 0. First copy T3's `CREATE TABLE orchestration_v2_projection_provider_threads` from design.md's Decision 5 into `tests/lets/resolvers/t3/fixtures/t3-schema.sql`, noting 2026-11-28 in its header comment, and add a test helper that writes a provider-thread row with given tasks (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [x] 1.2 [easy] `awaitedTasks` returns 0, and does not throw, when the provider-threads table does not exist, when a row's `payload_json` does not parse, and when `pendingBackgroundTasks` is missing or not a list, by design.md's Decision 2 (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)

## 2. Wait for awaited work before reading the final message [depends-on: 1]

- [x] 2.1 [medium] The adapter's `run` and `step` keep polling while the thread's newest run is `completed` and `awaitedTasks` is above 0. Test the case from ledger D8: run 1 completes with the message `The review is running; waiting for it to finish.` while one awaited task is pending; the task is then cleared, and run 2 completes with a final message that ends with a `done` step report. Both `run` and `step` return run 2's text, not run 1's. The new check sits after the `completed` status check and before the proposed-plan check, by design.md's Decision 3 (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [x] 2.2 [easy] A completed run whose thread has only a task with `awaited: false` is read on the first poll, with no extra sleep: the test's steps list is still unused when `run` returns, by design.md's Goals (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [x] 2.3 [complex] After the awaited work clears while the newest run is still the held run, the one seen completed while the work was pending, `waitForText` keeps polling for up to `WAKE_GRACE_MS`, 30 seconds, from the first poll that saw the work cleared. A later run that completes within that time is read instead. With no later run after 30 seconds, the held run's final message is returned. A session that never had awaited work gets no grace period. When a later poll sees awaited work pending again, the grace clock is cleared and that run becomes the held run, so a second clearance gets a fresh 30 seconds: test run 1 with task A, A cleared, run 2 completing with task B more than 30 seconds later, B cleared, then run 3 read within the new grace period. Test with a fake clock that advances on each sleep, by design.md's Decision 4 (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [x] 2.4 [easy] While a completed run waits on an awaited task, a pending request for the thread still ends the session with `SessionFailed` and the message `the session stopped to ask (thread T)`, by ledger D6. This guards the order of checks: the pending-request check stays first (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [ ] 2.5 [easy] When the awaited task is still pending at the time limit, `run` rejects with `TimeoutError` naming thread T, and T3 is asked for `thread.stop` and not `thread.archive`, by ledger D2 (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`)

## 3. Integration [depends-on: 2]

- [ ] 3.1 [medium] In `tests/lets/resolvers/t3/delegate.test.ts`, `lets delegate step run` through the real `t3` adapter, on a thread whose run 1 completes with an early `failed` step report while an awaited task is pending and whose run 2 completes with a `done` report, exits 0, prints `"outcome":"done"` and archives the thread. Add the provider-thread row through `onLaunch` or a sleep hook, as that file's helpers allow (verify: `node --test tests/lets/resolvers/t3/delegate.test.ts`)
- [ ] 3.2 [medium] Every check passes: `pnpm test`, `nix flake check` and `mise run check`. The pull request says that a T3 step or review now waits for awaited background work, names the 30-second grace period, and says that missing or unreadable T3 data falls back to today's behavior (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->

- 2026-11-27, task 2.2: the test passed on its first run, because 1.1's `awaitedTasks` already counts only `awaited: true`. It fails when the reader counts every task, so it guards the behavior. Committed as `test:`.
- 2026-11-27, task 2.4: the guard test passed on its first run, as a guard of an existing order should. It fails when the pending-request check moves below the awaited-work check. Committed as `test:`.
