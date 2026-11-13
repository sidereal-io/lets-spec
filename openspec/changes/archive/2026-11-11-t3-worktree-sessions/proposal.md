## Why

A review that `t3` opens from a linked git worktree runs in the repository's main checkout instead. The reviewer reads the wrong diff, or an empty one, and can still answer `(none)`: a false clean review that looks the same as a real one. Every pull request in the later stories of epic #227 goes through such a review, so this fix comes first.

## What Changes

- When `lets delegate review run` or `lets delegate handoff run` runs from a linked worktree inside T3 Code, `t3` opens the thread in that worktree, on its branch (D1, D3, D4).
- From the main checkout, `t3` opens the thread as it does today (D5).
- A detached HEAD and a `cwd` below the worktree's top level have defined behavior (D6, D7).
- The thread still belongs to the main checkout's T3 project. A repository T3 does not know is refused as before (D8).
- `docs/resolvers.md` says where a `t3` session runs, and its smoke test checks it (D11).
- Out: steps, the `cli` resolver, and the review-output, plan-mode and time-limit fixes in #221 (D1, D2).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: a new requirement, *The T3 resolver opens a session in the checkout that asked for it*, says which checkout the thread opens in. *The T3 resolver opens a session in a T3 thread* stays as it is.

## Impact

- Code: `lets/src/resolvers/t3/t3.ts` (`buildLaunch`, `launchThread`).
- Tests: `tests/lets/resolvers/t3/t3.test.ts`, and the git fixtures in `tests/lets/resolvers/t3/delegate.test.ts`.
- Docs: `docs/resolvers.md`.
- Protocol: uses T3 Code's `existing_worktree` workspace strategy, which T3 Code 0.1.7 accepts. No new dependency.
- This repository gets the fix only at the next release, when its `lets` pin moves past 0.7.0 (D12).
