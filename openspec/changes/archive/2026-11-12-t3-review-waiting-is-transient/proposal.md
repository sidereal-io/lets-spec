## Why

A `t3` review that finishes with an answer can still exit 5, saying `the session stopped to ask`, although the reviewer asked nothing. `t3` reads one poll of the run as `waiting` as a question, and T3 can show that status for a moment near the end of a turn. The build session then stops before verify and archive, and the kit does not try the next model, because exit 5 is not a refusal. Epic #227 needs reviews that finish cleanly, and this fix shares `waitForText` with #221, so it follows that change.

## What Changes

- A `t3` review has stopped to ask only when the thread has a pending request. A run whose status is `waiting` does not count by itself (D1).
- A `waiting` run with no pending request is polled again, like a running one, until it ends (D2). One that never ends exits 6 at the review's time limit (D3).
- A pending request still exits 5 with `the session stopped to ask (thread <id>)` at once (D4).
- `docs/resolvers.md` says when a `t3` review counts as stopped to ask (D9).
- Unchanged: T3's secret and link requests (D5), handoffs (D6), and how the kit maps a failed session to exit 5.
- This change relies on #221's plan for `waitForText`, which adds a proposed-plan check in its `completed` branch and leaves the `waiting` branch to this change (D7).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: one new requirement, *A T3 review stops to ask only with a pending request*.

## Impact

- Code: `lets/src/resolvers/t3/t3.ts` (`waitForText`).
- Tests: `tests/lets/resolvers/t3/t3.test.ts`.
- Docs: `docs/resolvers.md`.
- Output: none changes. A review that exited 5 on a brief `waiting` now exits 0 with its final message.
- This repository gets the fix only at the next release, when its `lets` pin moves past 0.7.0.
