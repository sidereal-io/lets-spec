## Context

This change stacks on `kill-process-tree` (#178), which stacks on `t3-review-waiting-is-transient` (#102), `t3-review-session-fit` (#221) and the archived `t3-worktree-sessions` (#123). It designs against `lets/src/resolvers/t3/t3.ts` as those changes leave it:

- **From #123, in the code:** `launchThread` asks T3 for an `existing_worktree` workspace when the caller's top level is a linked worktree, and for the project's `root` otherwise, on the current branch.
- **From #221's plan:** `buildLaunch` always sends `interactionMode: 'default'`, and `launchThread` takes only `{ effort }`. `waitForText` throws `SessionFailed('the session returned a plan, not a result')` when a completed run holds a `proposed_plan` item. `run` returns `{ handle, text, checkout }`, with `checkout` read by `readCheckout` after the wait. ADR-024 says the tree check keeps a review read-only.
- **From #102's plan:** `waitForText` treats only `run.pendingRequests > 0` as stopped to ask. A `waiting` run with no request is polled again, until the time limit.
- **From #178's plan:** nothing this change uses. It changes `execFile` in `kit/io.ts`, which `t3` calls only to issue a token.

The rest is already in place:

- `Adapter.step?(input: StepInput, { timeoutMs })` returns `{ handle, text }`, and `StepInput` is `RunInput`. `pick('step')` skips an adapter with no `step`, so adding the method is what makes `t3` answer steps and step instructions.
- `step.ts` passes the caller's top level as `cwd`, maps a `SessionFailed` to a `failed` report with a `null` handle, lets `Refused` reach `withModels` for the next model, lets `TimeoutError` exit 6, and calls `finish(handle, ok)` with ok only on `done`. `finish` archives the thread on ok.
- `run`'s catch archives the thread on `Refused`, and appends ` (thread <id>)` to every kit error.
- `pollUntil` throws `TimeoutError('no result after <ms> ms')` at the limit and leaves the T3 run going.
- T3 Code 0.1.7's `OrchestrationV2Command` has `thread.stop`: `{ type, commandId, threadId, reason?, stopDelegatedTasks? }`. Its UI's Stop and its own task cancellation send it through `orchestration.dispatchCommand`, the call `archive` already uses. Without `stopDelegatedTasks: false`, it also stops every task the thread delegated.

## Goals / Non-Goals

**Goals:**

- `t3` gets `step`, and shares every line of `run` it can, so a step and a review wait, refuse and fail in the same way.
- A step thread that times out is asked to stop, and every task it delegated with it.

**Non-Goals:**

- Changing `step.ts`, `lookup.ts` or the step's record.
- A `checkout` or `commit` for a step. #221 gives them to reviews only.
- Stopping a review at its timeout, or a thread when `lets` gets a signal.

## Test Seams

- **Primary test seam:** `lets delegate step run` and `step instructions` with the real `t3` adapter, in `tests/lets/resolvers/t3/delegate.test.ts`. `runningT3` gives an in-memory T3 database built from `fixtures/t3-schema.sql`, the caller's checkout, and the log of what the fake WebSocket was sent. It covers the launch, the next model after a refusal, a failed session, archiving a `done` thread, the timeout's stop, and step instructions.
- **Existing seams reused:** `createAdapter(io).step(...)` in `tests/lets/resolvers/t3/t3.test.ts`, with `launchingIo` and `sentTypes`, for the message when the stop fails and for a review that is not stopped. Both files already test `run` this way.
- **Fixtures to update:** none. The fake WebSocket answers every `orchestration.dispatchCommand`, so `thread.stop` needs no new answer. A test that makes the stop fail sends a `Failure` exit for it, as the archive tests do. The two tests that say a step inside T3 Code opens no thread become tests that it opens one.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the `t3` adapter, and which resolver answers `step run` and `step instructions` inside T3 Code. A step thread writes files with full access, as a `cli` step already does. No config, schema or stored data changes.

## Decisions

1. **`run` and `step` share one helper.** `session(input, { timeoutMs, stopOnTimeout })` launches the thread with the input's effort, waits with `waitForText`, and holds `run`'s catch. `run` calls it with `stopOnTimeout: false` and adds `checkout`. `step` calls it with `true` and returns `{ handle, text }`. *Alternative:* a second copy of `run` for steps. The two would drift, and the spec says a step ends as a review does.
2. **A step thread opens as a review thread does.** Default mode and `full-access` come from #221's `buildLaunch`, and the checkout from #123's `launchThread`. Nothing about the launch knows which strategy asked. *Alternative:* a separate launch for steps. There is no field to set differently.
3. **A timeout sends `thread.stop`, then rethrows the `TimeoutError`.** The command is `{ type: 'thread.stop', commandId: randomUUID(), threadId, reason: 'lets delegate: the step ran past its time limit' }`, sent with `dispatch`. When it fails, the error's message gains `; could not stop it, so it may still be running: <why>`, as a failed archive adds to a refusal. Then ` (thread <id>)` is appended. The thread is not archived, so a person can see where it stopped. *Alternatives:* `run.interrupt` needs the run's id and leaves delegated tasks running, while `thread.stop` is the UI's Stop and stops them too. Archiving the thread hides it, and archiving does not stop a run. This decision is new behaviour on a private protocol, so the ADR step weighs it.
4. **Only a step stops at its timeout.** A review keeps its behaviour (D9). The flag lives in the helper's options rather than in `waitForText`, so #102's and #221's changes to `waitForText` are untouched.
5. **No change to the step command.** `step.ts` already turns `SessionFailed` into a `failed` report and calls `finish` with ok only on `done`, so the thread rules in the spec follow from the shared catch and `finish`.
6. **The header names what was read from 0.1.7.** The file's header comment says protocol 2 was read from t3code 0.1.0. It gains one line saying that `thread.stop` was read from the 0.1.7 server bundle's `OrchestrationV2Command`.
7. **Docs.** In `docs/resolvers.md`, the resolver table's `t3` row says a step runs in a new thread, archived when it is done. The `t3` section replaces *It runs no step yet* with a short subsection on steps: the checkout and mode, which threads are kept, and the stop at the time limit. The smoke test after a T3 update gains a step whose prompt asks for a `done` report, and expects `"outcome":"done"` and an archived thread.

## Risks / Trade-offs

- [A T3 update renames `thread.stop` or changes its fields.] → The stop then fails, the command still exits 6, and stderr says the thread may still be running. The smoke test's step does not reach the timeout, so the header comment and the README's "After a t3 update" are the guard, as for every private call here.
- [The stop arrives as the run ends.] → T3's dispatcher accepts a `thread.stop` that produces no events, where it rejects most other commands that do nothing, so a stop of a finished thread succeeds without effect. The command still exits 6, because `pollUntil` had already timed out, and a report the thread wrote in that moment is not read.
- [A step thread writes files with full access in the caller's checkout.] → The same trust a `cli` step has since #156, and the reason a step exists. The thread runs in the caller's worktree (#123), so it cannot write in another checkout by accident.
- [Inside T3 Code, steps move from `cli` to `t3` for users who list `t3` first.] → The intended outcome. The spec's migration note says to list `cli` first to keep the old behaviour.
- [Ctrl-C on `lets` leaves the thread running.] → A person sees the thread in T3 Code and can stop it there (D13).

## Migration & Rollback

N/A. Nothing stored changes shape. To roll back, revert the change: `t3` then declines steps again, and the next resolver answers them.
