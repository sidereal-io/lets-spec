## Why

A review that `t3` runs opens in T3's plan mode. The reviewer then stops to ask a question (exit 5), or answers with a plan or a progress note, and the command still exits 0. A plan review of about 15 minutes also runs past the 15-minute limit (exit 6). When a review does finish, nothing in its output says which checkout and commit it read, so a review of the wrong code looks like a clean one. The rest of epic #227 depends on reviews that finish and can be trusted, so this fix comes second, after #123.

## What Changes

- A `t3` review opens its thread in default mode, for plan and code reviews alike. Handoffs already do (D1). The tree check still stops a review that writes files, with exit 7 (D2).
- A `t3` review whose run holds a proposed plan exits 5, never 0. The thread stays, so a person can read it (D3, D4). Nothing else in how `t3` waits for a result changes; #102 does that (D5).
- A review gets 30 minutes at effort `low` and `medium`, and 45 at `high`, through every resolver. `--timeout-minutes` still sets the limit (D6, D7).
- The review's JSON line gains `checkout`, the absolute path of the checkout the session ran in, and `commit`, the full hash at that checkout's `HEAD` when the session ended (D8, D11). `t3` takes the checkout from T3's own record of the thread (D9). `cli` gives the command's own checkout (D10).
- `lets-review-plan` and `lets-review-build` put the checkout's path and `HEAD` at the top of the prompt, and ask the reviewer to report what it read. When either the JSON line or the reviewer's report names another checkout or commit, the skill records no review and stops (D13, D14, D15).
- `docs/resolvers.md` and the `--help` text describe the new mode, limit and fields (D17).
- Out: binding the thread to the caller's worktree (#123), reading a brief `waiting` as final (#102), and stopping a timed-out process tree (#178).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: three new requirements. *The T3 resolver runs a review in default mode*, *A T3 review that returns a plan exits 5*, and *The T3 resolver names the checkout T3 ran the review in*.
- `delegate-review`: two new requirements. *The review record names the checkout and commit the session read* adds `checkout` and `commit` to the JSON line. *A review has time to finish* sets the default limits. *The review record says what the review was for* stays as it is.

## Impact

- Code: `lets/src/resolvers/t3/t3.ts` (`launchThread`, `waitForText`, a read of the thread's checkout), `lets/src/resolvers/cli/cli.ts`, `lets/src/resolvers/kit/adapter.ts` (`DEFAULT_TIMEOUT_MINUTES` and the run's result type), `lets/src/delegate/review.ts`, `lets/src/main.ts` (help text).
- Tests: `tests/lets/resolvers/t3/`, `tests/lets/resolvers/cli/`, `tests/lets/resolvers/kit/adapter.test.ts`, `tests/lets/delegate/review.test.ts`, `tests/skill-interfaces.bats`.
- Skills: `skills/lets-review-plan/SKILL.md`, `skills/lets-review-build/SKILL.md`.
- Docs: `docs/resolvers.md`.
- Output: the review's JSON line gains two fields. A caller that reads the line by field name is not affected.
- This repository gets the fix only at the next release, when its `lets` pin moves past 0.7.0.
