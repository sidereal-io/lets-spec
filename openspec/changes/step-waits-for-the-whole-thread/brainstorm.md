<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#326 step-waits-for-the-whole-thread — a step whose session ends a turn while its work still runs is not read as failed.
https://github.com/sidereal-io/lets-spec/issues/326

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which message holds the step's report? | The final message of the thread's newest run, read once the session waits on no work. A status line or `failed` report from an earlier turn is not read. | Evidence: #326 packet, **Expected** |
| D2 | How long does `lets` wait for that work? | Up to the step's existing time limit. At the limit, the existing stop applies: T3 is asked to stop the thread, which is kept, and the command exits 6. | Evidence: #326 packet, **Expected**; `openspec/specs/delegate-resolvers/spec.md`, *A timed-out T3 session is stopped* |
| D3 | Where does T3 record work a session still waits on? | In `pendingBackgroundTasks`, in the `payload_json` of `orchestration_v2_projection_provider_threads`. On 2026-11-28 a thread showed its newest run `completed` and provider thread `idle`, with one entry: a command, `awaited: true`. | Evidence: T3's `statev2.sqlite`, read on 2026-11-28 |
| D4 | Do step sessions mark the work they wait for? | Yes. Every step thread that a background command woke, from 2026-11-24 to 2026-11-26, had called `t3_background_wait` first, such as `sync-unit-tests-retired-story` (#314) and `strip-row-icons-review-build`. | Evidence: T3's `statev2.sqlite` turn items, read on 2026-11-28 |
| D5 | Does the fix reach a step started with `lets delegate step start`? | Yes, with no change of its own: `step start` runs `lets delegate step run` in a background process, and `step wait` reads its result. | Evidence: `lets/src/delegate/background.ts` |
| D6 | Does a question asked while the session waits still end it? | Yes, as today: a pending request ends the session as stopped to ask. | Evidence: `openspec/specs/delegate-resolvers/spec.md`, *A T3 review stops to ask only with a pending request* |
| D7 | What is out of scope? | Which resolver a started step gets (#325), and the `cli` and `subagent` resolvers. | Evidence: #326 packet, **Scope** |
| D8 | What shows the fix works? | A test in `tests/lets/resolvers/t3/t3.test.ts`: a thread's first run completes while an awaited task is pending, a second run ends with the step report, and `lets` reads the second run's report. | Evidence: #326 packet, **Scope** |
| D9 | Where does the fix go: the t3 resolver, the step and review prompts, or both? | The t3 resolver only: it treats a step as still running while its thread has awaited background work. Step sessions already wait as T3 tells them to (D4), and a prompt to stay in the same turn would contradict T3 and cannot outlast a command's 10-minute limit. | User |
| D10 | Which pending background tasks keep a step open? | Only tasks marked `awaited: true`, which `t3_background_wait` sets. Unmarked work, such as a dev server left running, does not, so a step that reports `done` with a server up still ends at once. | Assumption |
| D11 | Does `lets delegate review` on the t3 resolver wait for awaited work too? | Yes, the same way as a step: it reads its result through the same `waitForText`, and the spec says a T3 step ends as a T3 review does. | Assumption |

## Changes from the story

None.

Confirmed by user: yes
