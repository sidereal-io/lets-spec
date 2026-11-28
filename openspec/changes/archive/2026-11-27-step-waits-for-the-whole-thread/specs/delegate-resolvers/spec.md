<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: A T3 session waits for its awaited background work
When `t3` answers `lets delegate step run` or `lets delegate review run`, it SHALL treat the session as still running while T3 shows the thread with a pending background task that the session marked as awaited. Awaited work is a background task that T3 records with `awaited: true`, as it does when the session calls `t3_background_wait`. A completed run SHALL end the session only when the thread has no awaited background task left. `t3` SHALL then read the final message of the thread's newest run, and SHALL NOT read the final message of an earlier run.

When the awaited work has cleared and the newest run is still the one that completed while it was pending, `t3` SHALL keep waiting up to 30 seconds for a later run, because T3 may drop a finished task a moment before it records the run the task wakes. After 30 seconds with no later run, it SHALL read that run's final message. A session that never had awaited work SHALL end as soon as its run completes.

A pending background task that is not awaited SHALL NOT keep the session open. The wait SHALL count against the step's or the review's time limit, as described in "A timed-out T3 session is stopped". A pending request SHALL still end the session as stopped to ask while it waits, as for any run.

#### Scenario: A step's session ends a turn to wait for its review
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate step run --for review-plan` with the other required options inside T3 Code
- **AND** the thread's first run completes with the final message `The review is running; waiting for it to finish.`, while T3 shows one pending background task for the thread with `awaited: true`
- **AND** the task then ends, and the thread's second run completes with a final message that ends with a `done` step report
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"done"` from the second run's report, and the thread is archived

#### Scenario: A step whose session writes an early failed report
- **WHEN** a step thread's first run completes with a final message that ends with a `failed` step report, while T3 shows an awaited background task for the thread
- **AND** the thread's second run then completes with a final message that ends with a `done` step report
- **THEN** the command exits 0 and stdout is one JSON line with `"outcome":"done"`

#### Scenario: A review's session ends a turn to wait
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code --model claude/claude-opus-5-5` with every required option inside T3 Code
- **AND** the thread's first run completes while T3 shows an awaited background task for the thread, and a second run then completes with the final message `No findings.`
- **THEN** the command exits 0 and prints `No findings.`

#### Scenario: The awaited work ends and the session does not run again
- **WHEN** a step thread's first run completes with a final message that ends with a `done` step report, while T3 shows an awaited background task for the thread
- **AND** the task then ends, and T3 records no second run within 30 seconds
- **THEN** the command exits 0 and stdout is one JSON line with `"outcome":"done"` from the first run's report

#### Scenario: Background work the session did not await
- **WHEN** a step thread's first run completes with a final message that ends with a `done` step report, while T3 shows one pending background task for the thread with `awaited: false`
- **THEN** the command exits 0 at once, and stdout is one JSON line with `"outcome":"done"` from that run's report

#### Scenario: The awaited work outlasts the time limit
- **WHEN** `t3` answers `lets delegate step run --timeout-minutes 3` with the other required options, and the thread's first run completes while T3 shows an awaited background task for the thread
- **AND** the task is still pending after 3 minutes
- **THEN** T3 is asked to stop that thread, the thread is not archived, the command exits 6, stdout is empty, and stderr names the thread

#### Scenario: The session asks a question while it waits
- **WHEN** a step thread's first run completes while T3 shows an awaited background task for the thread, and T3 then holds a pending request for the thread
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that says `the session stopped to ask` and names the thread, and the thread is not archived
