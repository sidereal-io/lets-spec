## Why

Inside T3 Code, `t3` declines every step, so `lets delegate step run` falls through to `cli` or `subagent`, and Mo cannot watch the step work. This is the last story of epic #227: the stories below it make a `t3` session run in the caller's worktree, finish, and come back reliably, which a session that writes files needs.

## What Changes

- `t3` runs a step. `lets delegate step run` inside T3 Code opens a new T3 thread in the caller's checkout, in default mode, with the model and effort a review would get (D1, D2, D3).
- `t3` waits for the thread's final message as it does for a review, and the command reads the step report from it (D4).
- A refusal archives the thread and tries the next `--model`, then exits 3 (D5). A thread that stops to ask, ends on a plan or fails after a message gives a `failed` report that names the thread, and the thread stays (D6). A `done` step's thread is archived; any other is kept (D7).
- **Added to the story:** a step thread still running at its time limit is stopped in T3, with the UI's own Stop, before the command exits 6. The thread stays (D8). A review's timeout does not change (D9).
- `lets delegate step instructions` inside T3 Code answers with `t3` and its models (D10).
- Unchanged: the step's record on stderr (D11), resuming with `--answers-file` (D12), and signals to `lets` (D13).
- `docs/resolvers.md` describes `t3` steps, and its smoke test after a T3 update runs one (D14).
- This change relies on three plans below it: #221's default mode for every thread and its proposed-plan check, #102's rule that only a pending request is a question, and #123's `existing_worktree` launch, which is in the code. #178 changes nothing it relies on.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: *The T3 resolver declines every step* is removed. New requirements say that `t3` runs a step in a T3 thread, how a `t3` step ends, that a timed-out one is stopped, and that `t3` lists the same models for a step as for a review. *The T3 resolver declines outside T3 Code* adds steps.
- `delegate-step`: *A step runs in a session that may write files* keeps its rule. Its scenario of a resolver that runs no step no longer names `t3`.

## Impact

- Code: `lets/src/resolvers/t3/t3.ts` (a new `step`, a stop on timeout). No other module changes: `step.ts` and `lookup.ts` already ask any adapter that has `step`.
- Tests: `tests/lets/resolvers/t3/t3.test.ts`, `tests/lets/resolvers/t3/delegate.test.ts`.
- Docs: `docs/resolvers.md`.
- Behaviour: inside T3 Code, with `t3` first in `delegate.resolvers`, steps now run in T3 threads instead of in `cli` or `subagent`. A user who wants the old behaviour lists `cli` before `t3`.
- This repository gets the change only at the next release, when its `lets` pin moves past 0.7.0.
