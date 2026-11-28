<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

`lets/src/resolvers/t3/t3.ts` runs a step or a review in a T3 thread and polls T3's state database, `statev2.sqlite`, every 5 seconds (`POLL_MS`). `waitForText` reads the thread's newest run with `readRun`. It returns that run's final message as soon as the run is `completed` and the message has stopped streaming. Both `run` (a review) and `step` go through the same `session` and `waitForText`, so one fix covers both (D11).

T3 records a session's background work on its provider thread, not on the run. The table `orchestration_v2_projection_provider_threads` has one row per provider thread, keyed by `provider_thread_id`, with a `thread_id` column. Its `payload_json` holds `pendingBackgroundTasks`, a list of entries with `command`, `taskId`, `kind` and `awaited` (D3). On 2026-11-28, this step's own parent `lets-go` thread showed exactly this state while it waited: provider thread `idle`, newest run completed, one entry with `awaited: true`. Every thread in that database had one provider thread.

When the awaited task ends, T3 wakes the session, and a new run starts on the same thread with a higher `ordinal` (D1, D8). T3's event table was empty, so the order in which T3 drops the finished task and records the new run could not be observed.

The test fixture `tests/lets/resolvers/t3/fixtures/t3-schema.sql` was copied from T3 on 2026-10-17 and has no provider-threads table.

## Goals / Non-Goals

**Goals:**

- A completed run does not end the session while the thread has awaited background work.
- A session with no awaited work ends exactly as fast as today.
- A change in T3's layout of this data makes `lets` behave as it does today, not fail.

**Non-Goals:**

- Telling a session to wait in the same turn. The prompts stay as they are (D9).
- Waiting for background work the session did not mark as awaited (D10).
- Watching T3 over its WebSocket instead of polling the database.

## Test Seams

- **Primary test seam:** the adapter's `run` and `step`, driven by the `running(db, steps)` helper in `tests/lets/resolvers/t3/t3.test.ts`. Each fake sleep applies the next change to an in-memory database built from the fixture schema, so a test can complete run 1 with an awaited task, drop the task, then add run 2 (D8).
- **Existing seams reused:** the fixture schema `t3-schema.sql`, which gains the provider-threads table, and the `step` command tests in `tests/lets/resolvers/t3/delegate.test.ts` for one end-to-end check that `lets delegate step run` prints run 2's report.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. The change is in one module, but it adds a requirement to `delegate-resolvers` and reads one more part of T3's private database.
- **Blast radius:** `waitForText` in `lets/src/resolvers/t3/t3.ts`, which every T3 review, step and story run passes through. The `cli` and `subagent` resolvers, `lets delegate step start` and `wait`, and the report parser do not change (D5, D7).

## Decisions

### 1. Read awaited tasks from the provider threads, beside the run

Add an exported reader, `awaitedTasks(db, threadId): number`, next to `readRun`. It reads `payload_json` from every row of `orchestration_v2_projection_provider_threads` whose `thread_id` matches, and counts the `pendingBackgroundTasks` entries whose `awaited` is exactly `true`. Reading every row, not one, covers a thread that has more than one provider thread, such as after a handoff to another provider.

`waitForText` reads this count in the same database connection as the run, on each poll.

*Alternatives:* add the count to `Run` inside `readRun`. That mixes a provider-thread fact into the run record and changes the shape that existing `readRun` tests assert. A separate reader keeps each test narrow.

### 2. Missing or unreadable data counts as no awaited work

When the table does not exist, or a row's `payload_json` does not parse, or `pendingBackgroundTasks` is not a list, the reader returns 0 for that row. The session then ends as it does today.

*Why:* T3 can change its private schema in any release. Failing open keeps every step and review working, with only today's bug back. Failing closed would turn a schema change into a timeout on every run. The cost is silence: a broken read is not reported. Risks names the mitigation.

### 3. A completed run with awaited work keeps the poll going

In `waitForText`, the order of checks stays as it is. A pending request still ends the session first (D6), and failed, interrupted, cancelled and rolled-back runs still end it. The new check comes after `run.status === 'completed'` and before the proposed-plan check. When the count of awaited tasks is above 0, the check returns `undefined`, so `pollUntil` polls again. The wait counts against the same `timeoutMs`, so the existing timeout, stop and exit 6 apply unchanged (D2).

### 4. After awaited work clears, wait briefly for the run it wakes

`waitForText` remembers the id of the newest run it saw completed while awaited work was pending, the held run. When that work has cleared:

- If the newest run is a later run, the check reads it as usual.
- If the newest run is still the held run, the check keeps polling for up to 30 seconds, `WAKE_GRACE_MS`, from the first poll that saw the work cleared. After that, it reads the held run's final message.

*Why:* T3 may drop a finished task from `pendingBackgroundTasks` a moment before it records the run that the task's exit starts. Without the grace period, a poll that lands in that gap reads the held run's status line, which is the bug this change fixes. With 5-second polls, 30 seconds gives T3 six chances to record the new run. The grace period applies only to a session that waited on background work, so a session with none ends as fast as today.

*Alternatives:* never read the held run, and wait for a later one until the time limit. A task that ends without waking the session, such as one that T3 or the user stops, would then hold the step until it times out and exits 6. A fixed delay after every completed run would slow every session.

### 5. Add the provider-threads table to the test fixture

Copy T3's `CREATE TABLE orchestration_v2_projection_provider_threads` statement into `t3-schema.sql`, with its columns as T3 has them on 2026-11-28, and note that date in the file's header comment. Add a test helper, such as `addBackgroundTask(db, threadId, { awaited })`, that writes a provider-thread row with one `pendingBackgroundTasks` entry, and a way to clear it.

None of these decisions is costly to reverse: each sits inside one function and its tests.

## Risks / Trade-offs

- [T3 renames the table or the `awaited` field, and the fix stops working without any error] → The fixture records the shape and date it was copied from. The reader has a unit test for a missing table and for a payload that does not parse, so the fallback is deliberate and tested. A recurrence would show the same symptom as #326, which names the table to check.
- [T3 takes more than 30 seconds to record the woken run, and `lets` reads the held run] → The result is today's behavior, not worse. The constant is named, so it can be raised if a recurrence shows a longer gap.
- [The awaited work runs longer than the step's time limit] → The existing timeout applies: T3 is asked to stop the thread, which is kept, and the command exits 6 (D2). `lets-go` already handles exit 6.
- [A session marks a task as awaited and then forgets it, so it never ends] → Same as the line above: the time limit ends it.
- [Run 1 completes and its awaited task ends within one 5-second poll, so `lets` never sees the work and reads run 1] → Accepted. The cases in #326 waited on reviews that ran for minutes. This narrow gap remains, and it fails the way it does today.

## Migration & Rollback

N/A. No data or configuration changes shape. Rolling back is reverting the commit, which restores reading the first completed run.
