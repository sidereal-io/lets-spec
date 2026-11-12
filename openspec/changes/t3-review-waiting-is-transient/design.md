## Context

This change stacks on `t3-review-session-fit` (#221, pull request #249). That change is planned but not built, so this design builds on `waitForText` as #221's plan leaves it. It relies on these parts of #221's plan (`openspec/changes/t3-review-session-fit/design.md`):

- Decision 3: `waitForText` gains one check in its `completed` branch. After a run is `completed`, `hasProposedPlan(db, run.id)` makes it throw `SessionFailed('the session returned a plan, not a result')`. #221 leaves the `waiting` condition as it is, and does not change `readRun` or the `Run` type.
- Decision 1: every review opens in default mode. Plan mode is where the stray `waiting` status was seen, but this fix does not depend on the mode.
- Decision 7: a review's default limit becomes 30 minutes, or 45 at `--effort high`. That is how long a run that stays `waiting` holds the caller (D3).

So, after #221, `waitForText` in `lets/src/resolvers/t3/t3.ts` checks each poll in this order:

1. No run yet: poll again.
2. `run.pendingRequests > 0 || run.status === 'waiting'`: throw `SessionFailed('the session stopped to ask')`.
3. `failed`: `Refused` or `SessionFailed`. `interrupted`, `cancelled`, `rolled_back`: `SessionFailed`.
4. Any status but `completed`: poll again.
5. `completed`: the proposed-plan check (#221), then the final message.

`readRun` counts the thread's runtime requests whose status is `pending`. `pollUntil` in `lets/src/resolvers/kit/wait.ts` checks at once, then every 5 seconds, and throws `TimeoutError` at the limit. `run` appends ` (thread <id>)` to every kit error.

T3 Code 0.1.7 treats a `waiting` run as still active. When the provider ends a turn as `completed`, T3 stores the run as `waiting` and starts a checkpoint capture (`runtimeLayer-HjrbqSoY.mjs`, line 137423). Its own comment says that `waiting` means the provider has finished and the checkpoint capture is pending (line 139575). The run moves to `completed` once the capture ends. A failed git capture still ends: T3 logs it and records the checkpoint with status `error` (line 5549). T3's own CLI's `waitForRun` reports `needs_input` only when the thread's `pendingRequestCount` is above 0. Its thread status view shows a `waiting` run as running (D1, D2).

## Goals / Non-Goals

**Goals:**

- Change only step 2's condition, so #221's `completed` branch and this change do not overlap.
- Keep the stop-to-ask error, its message and its exit code as they are.

**Non-Goals:**

- A grace period, or a count of polls, for a `waiting` run (D2).
- Reading T3's secret or link request items (D5).
- Changing `readRun`, the `Run` type, the poll interval or the kit's exit codes.

## Test Seams

- **Primary test seam:** the `t3` adapter, through `createAdapter(io).run(...)` in `tests/lets/resolvers/t3/t3.test.ts`, via the `running(db, steps, options)` helper. Its in-memory T3 database (`addRun`, `addMessage`, `addPendingRequest`) holds the run, and each `sleep` runs the next step, so a test can change the run's status between two polls.
- **Existing seams reused:** none other. The kit already maps `SessionFailed` to exit 5 and `TimeoutError` to exit 6, and its own tests cover that.
- **New tests** in `t3.test.ts`:
  - A run that reads `waiting` with no request on one poll, then `completed` with a final message on the next, returns that message.
  - A run that stays `waiting` with no request, with `timeoutMs: 0`, throws `TimeoutError` naming the thread.
- **Fixtures to update:** the test *run fails when the session stops to ask* loops over `waiting` with no request and `running` with one. It becomes two cases that both hold a pending request: one `waiting`, one `running`. A step sets a run's status with one `update` statement, written in the test that needs it.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** one condition in `waitForText` in `lets/src/resolvers/t3/t3.ts`, its tests, and one bullet in `docs/resolvers.md`. Only a `t3` review waits through `waitForText`. No contract, config, stored data or other resolver changes.

## Decisions

1. **Step 2 tests only `run.pendingRequests > 0`.** A `waiting` run with no request then falls through to step 4 and is polled again. Its comment says why: T3 shows `waiting` for a moment near the end of a turn, and a question always leaves a pending request. *Alternatives:* fail when `waiting` lasts for some number of polls, or for some seconds. Either picks a length that cannot tell a slow turn from a stuck one, and T3's own CLI uses the request alone. Or keep step 2 and treat `waiting` as asking only after `completed` is ruled out on a second read. That is the same as polling again, with more code.
2. **A pending request stops the review whatever the run's status.** The condition does not look at the status at all, so a request on a `running` run still exits 5 at once, as today.
3. **A run that stays `waiting` is left to the time limit.** No new error or message. `pollUntil` throws `TimeoutError`, and `run` names the thread, so the command exits 6 with `no result after <ms> ms (thread <id>)`.
4. **Docs.** The `t3` section of `docs/resolvers.md` gets one bullet, after the one on refusals. It says that a review exits 5 when the session asks a question and waits for an answer. The thread stays, so you can answer it in T3 Code. A run T3 shows as `waiting` for a moment does not count. #221 adds its own bullets on default mode and proposed plans to the same section. This bullet stands apart from them, so the two changes do not edit the same lines.

## Risks / Trade-offs

- [A session that waits on the user without a runtime request, such as a secret request, now holds the caller until the time limit.] → It exits 6 and names the thread, so a person can find it. Before this change the same session exited 5 on its first poll. A review has no reason to ask for a secret or a link (D5).
- [T3's run finalization fails some other way, such as a database error after the capture, and the run stays `waiting`.] → The review exits 6 at its limit and names the thread, and the final message stays in the thread. Before this change the same run exited 5 on its first poll. Neither path returns the message, so this change loses nothing.
- [T3 stops writing a runtime request for a question.] → The review would then wait to the time limit, not exit 5. The request query runs against T3's schema fixture, `tests/lets/resolvers/t3/fixtures/t3-schema.sql`, which is refreshed when T3's database changes. T3 0.1.7 writes a runtime request beside each approval and user-input node it marks `waiting`.
- [#221 lands with a different `waitForText` than its plan says.] → The change is one condition. The build reads the code as it is on the base, and the tests pin the behavior, not the line.

## Migration & Rollback

N/A. Nothing stored changes shape. To roll back, revert the change.
