## Story

#155 step-on-t3 — the t3 resolver runs a step in a new thread in the caller's worktree, and returns its report. https://github.com/sidereal-io/lets-spec/issues/155

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where does a `t3` step run? | In a new T3 thread in the checkout that holds the command's working directory. From a linked worktree, it runs in that worktree, on its branch, as #123's `existing_worktree` launch already does for a review and a handoff. | Evidence: `launchThread` in `lets/src/resolvers/t3/t3.ts`; #155 Scope |
| D2 | In which mode does the thread run? | Default interaction mode and `full-access`, the mode #221 gives every thread. A step must write files, run commands and commit without a prompt. | Evidence: `openspec/changes/t3-review-session-fit/design.md` D1, D2; `cli` step's write mode |
| D3 | Which model and effort does it send? | The same as a review: the `--model` as given, a bare family as the catalogue's default, and `--effort` as T3's effort option, with none for Gemini. | Evidence: `t3ModelSelection`, `defaultModel` in `t3.ts` |
| D4 | How does `t3` wait for the step's final message? | As for a review: the same `waitForText`, with #102's rule that only a pending request is a question, and #221's check that a run holding a proposed plan is no result. | Evidence: `waitForText`; #102 and #221 designs |
| D5 | What is a refusal? | As for a review: T3 or the account says no before any assistant message. `t3` archives the thread, and the command tries the next `--model`. When every model is refused, it exits 3. | Evidence: #155 Scope; `run` in `t3.ts`; `withModels` in `lets/src/delegate/lookup.ts` |
| D6 | What does a session that stopped give? | A pending request, a proposed plan, a run that failed after a message, or one interrupted, cancelled or rolled back, is a failed session. The command exits 0 with a `failed` report whose `reason` names the thread. The thread stays, so a person can read it. | Evidence: `step.ts` maps `SessionFailed` to a `failed` report; `run` appends ` (thread <id>)` |
| D7 | Which thread is cleaned up? | A step whose report is `done` gets its thread archived. Any other outcome keeps the thread. | Evidence: `finish` in `t3.ts`; `openspec/specs/delegate-step/spec.md` |
| D8 | What happens to a step thread that runs past its time limit? | The command exits 6, as today, and `t3` first asks T3 to stop the thread, with the same `thread.stop` command as the UI's Stop. The thread stays. When the stop fails or gets no answer in 10 seconds, the command still exits 6, and stderr says the thread may still be running. | Assumption |
| D9 | Does a timed-out review thread get stopped too? | Yes. Since #221, a review thread has full access too, and a timeout skips the tree check, so a review left running could change the checkout unseen. | Evidence: plan review round 1, finding 1; `openspec/changes/t3-review-session-fit/design.md` D2; `lets/src/delegate/review.ts` |
| D10 | What do `lets delegate step instructions` answer inside T3 Code? | `resolver` `t3`, with the same `options` as review and handoff instructions. | Evidence: `instructions.ts` picks by the strategy's verb, and `pick` skips an adapter without `step` |
| D11 | Does the step's record on stderr change? | No. It keeps `for`, `resolver`, `family`, `model`, `handle` and `durationSeconds`, with a handle of kind `thread`. #221's `checkout` and `commit` are for reviews only. | Evidence: `openspec/specs/delegate-step/spec.md`; #221 design Non-Goals |
| D12 | Can a person answer a `needs-input` step in its T3 thread? | Not through `lets`. The caller resumes with `--answers-file`, which opens a new thread, as with any resolver. | Evidence: #155 Scope out |
| D13 | Is a signal to `lets`, such as Ctrl-C, passed on to the thread? | No. The thread keeps running, and a person can stop it in T3 Code. Only a timeout stops it (D8). | Assumption |
| D14 | Do the docs change? | Yes. `docs/resolvers.md` says that `t3` runs steps, how a step thread ends, and that a timed-out one is stopped. Its smoke test after a T3 update gains a step. | Assumption |
| D15 | How is it accepted? | Tests with the T3 fixtures: the adapter in `tests/lets/resolvers/t3/t3.test.ts`, and the step command through `t3` in `tests/lets/resolvers/t3/delegate.test.ts`. In the specs, *The T3 resolver declines every step* is replaced by a requirement that it runs one. | Evidence: #155 Scope; `openspec/specs/delegate-resolvers/spec.md` |

## Changes from the story

- Added: a step or review thread that runs past its time limit is stopped in T3 (D8, D9). Without it, a thread that writes files keeps changing the checkout after `lets` has exited 6, which is the harm #178 removes for `cli`. The plan review widened D9 from steps to reviews.
- Added: the smoke test in `docs/resolvers.md` checks a step (D14).
- No split: about seven tasks.

The user delegated the brainstorm for epic #227: the agent decides and records its recommendations, and asks only where it has none. Every question here had a recommendation, so no question went to the user. The issue's thread has no comments.

Confirmed by user: yes
