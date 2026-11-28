<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

When the `t3` resolver runs a step, it reads the step report from the first run of the thread that completes. A step session that starts its own background work, such as a review, ends that first turn to wait for it, as T3 tells it to (D4). So `lets` reads a status line or an early `failed` report, and `lets-go` settles the story as stopped, while the thread goes on to finish the step. This happened five times in #308's epic runs.

## What Changes

- The `t3` resolver treats a session as still running while its thread has background work the session marked as awaited, which T3 records as a pending background task with `awaited: true` (D3, D9, D10). It reads the final message of the thread's newest run once that run has completed and no awaited work is left (D1).
- Background work that the session did not mark as awaited, such as a dev server left running, does not keep the session open (D10).
- The wait counts against the existing time limit. At the limit, the existing timeout applies: T3 is asked to stop the thread, which is kept, and the command exits 6 (D2).
- `lets delegate review run`, when `t3` answers it, waits in the same way (D11). A step started with `lets delegate step start` gets the fix with no change of its own (D5).
- A pending request still ends the session at once as stopped to ask, as today (D6).
- No change to the step prompt or the review skills (D9), to the `cli` or `subagent` resolvers, or to which resolver a started step gets (D7).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: a session that `t3` answers, for a step or a review, ends only when its thread's newest run has completed and the thread has no awaited background work left. Its final message is read from that run.

## Impact

- `lets/src/resolvers/t3/t3.ts`: `readRun` or a new reader also reads the thread's awaited background tasks from T3's state database, `statev2.sqlite`, table `orchestration_v2_projection_provider_threads`. `waitForText` keeps polling while any are left.
- `tests/lets/resolvers/t3/t3.test.ts`: the test fixture's database gains that table, and a test covers a first run that completes while an awaited task is pending, then a second run that ends with the step report (D8).
- Dependency on T3: `lets` reads one more part of T3's state database, `pendingBackgroundTasks` in that table's `payload_json`. A change in T3's layout there would make `lets` stop waiting for background work, as it does today.
