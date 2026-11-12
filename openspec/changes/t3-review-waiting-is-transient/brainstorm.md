## Story

#102 t3-review-waiting-is-transient — a read-only review that finishes with an answer comes back through the command.
https://github.com/sidereal-io/lets-spec/issues/102

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | When has a `t3` review stopped to ask? | When the thread has a pending runtime request, as today. A run whose status is `waiting` has not stopped to ask by that alone. | Evidence: T3 Code 0.1.7 `waitForRun` (its own CLI reports `needs_input` only when `pendingRequestCount > 0`) and `resolveThreadAwarenessPhaseV2` (shows a `waiting` run as running); #102 evidence: the failed thread had no runtime request at all |
| D2 | What does `t3` do with a `waiting` run that has no pending request? | It keeps polling, as for a `running` run, until the run ends or the review's time limit passes. In T3, `waiting` means the provider has finished and a checkpoint capture is pending. The packet's other option is not taken: failing when `waiting` lasts for some polls. No length of time tells a slow capture from a stuck one. | Evidence: T3 Code 0.1.7 `runtimeLayer` (a completed turn is stored as `waiting` until its checkpoint capture ends) and `waitForRun`, which loops with no poll count or grace period |
| D3 | What happens when a `waiting` run never ends? | The review times out: exit 6 at the review's limit (30 minutes, or 45 at `--effort high`, from #221), with the thread named. | Evidence: `pollUntil` in `lets/src/resolvers/kit/wait.ts`; #221 design decision 7 |
| D4 | Does a pending request still stop the review at once? | Yes. It exits 5 with `the session stopped to ask (thread <id>)`, whatever the run's status. | Evidence: #102 Scope (in: "only with a pending request"; out: the kit's exit-5 mapping) |
| D5 | Do T3's other ways to wait on the user count, such as a `secret_request` or `link_request` item? | No. `readRun` counts only runtime requests today, and a review never asks for a secret or a link. | Assumption |
| D6 | Does a handoff change? | No. Only `run`, the review, waits for a result. A handoff returns as soon as its thread opens. | Evidence: `createAdapter` in `lets/src/resolvers/t3/t3.ts` |
| D7 | What does this story rely on from #221? | Its plan for `waitForText`: one `proposed_plan` check in the `completed` branch, and the `waiting` branch left alone. Also its default mode, and its 30-minute limit, which D3 relies on. #102 changes only the `waiting` condition, so a run that passes through `waiting` and then completes still meets #221's plan check. | Evidence: `openspec/changes/t3-review-session-fit/design.md`, decisions 1, 3 and 7 |
| D8 | How is the fix accepted? | Resolver tests: a run that reads `waiting` on one poll and `completed` on the next returns its final message; a `waiting` run with a pending request exits 5; a run that stays `waiting` times out. In `delegate-resolvers`, a new requirement says when a `t3` review has stopped to ask, with a scenario for each case. | Evidence: #227 Shared decisions |
| D9 | Do the docs change? | Yes, one bullet in the `t3` section of `docs/resolvers.md`: a review exits 5 when the session asks a question, and a brief `waiting` status does not count. | Assumption |

## Changes from the story

- Narrowed: the packet allows either "persists" or "only with a pending request". D2 takes the second alone.
- Added: a run that stays `waiting` is tested to time out (D3), so the fix cannot make a stuck review wait forever.
- Added: the `docs/resolvers.md` bullet (D9).
- No split: about four tasks.

The user delegated the brainstorm for epic #227: the agent decides and records its recommendations, and asks only where it has none. Every question here had a recommendation, so no question went to the user. The thread's two comments are covered by `lets-shape`'s read marker, and the first was folded into the packet.

Confirmed by user: yes
