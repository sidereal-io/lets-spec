## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (`gemini/gemini-3.8-flash` through the `t3` resolver, thread `b085b36e-7bba-42df-82e9-0cf293bda2cb`)
- **Independent**: yes. The plan's author is `claude`, and the reviewer is `gemini`.
- **Tool restrictions**: read-only by prompt. The `t3` resolver in the pinned `lets` 0.7.0 opened the thread in plan mode in the main checkout, so the prompt named this worktree's absolute path, branch and commit. The reviewer answered `Read: /home/andrew/.t3/worktrees/lets-spec/t3-0a89ce71 68fafa84fec6d21b67ef17dba74c5a41abd04fe5`, which is this branch's head at the time of review. The author's shell wrapper around `lets delegate review run` stopped at its own 10-minute limit, before the review's 30-minute limit, so `lets` printed no meta line. The thread went on and completed after about 10 minutes, with no proposed plan and no pending request. Its final message was read from T3's state database. `git status` showed no change from the reviewer. No fallback through `delegate_task` was needed.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, the stacked changes' plans, and T3 Code 0.1.7's server bundle
- **Commit reviewed**: `68fafa84`

## Findings

The reviewer's labels are kept. Each finding is checked against the repository.

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **D9 leaves a timed-out review thread running with full access.** Check: assumption rows, trust boundary. *The scenario:* #221 opens every review thread in default mode with `full-access` (`openspec/changes/t3-review-session-fit/design.md`, decision 2). `review.ts` checks the tree only after a final message (`lets/src/delegate/review.ts`, after `withModels`), so a timeout skips the check. A review thread left running after exit 6 can then write in the caller's worktree unseen, which is the harm D8 removes for steps. *What must be true:* review threads are read-only in T3, or are stopped too. — **CONFIRMED.** The rationale in D9, "a review is read-only", stopped being true with #221.
2. **The stop has no deadline, so a hung T3 server holds the command for 2 more minutes.** Check: partial failure. *The scenario:* `dispatch` in `lets/src/resolvers/t3/t3.ts` calls `request` with no deadline, so its wait is `REPLY_TIMEOUT_MS`, 120 seconds. When the step timed out because T3 stopped answering, the stop waits that long before exit 6. *What must be true:* the stop has a short deadline of its own. — **CONFIRMED.**
3. **Two scenarios leave out required options.** Check: scenario testability. *The scenario:* *A gemini step* runs `lets delegate step run --for plan --effort medium --model gemini`, and *A review that runs too long is not stopped* runs `lets delegate review run --timeout-minutes 3`. Both lack `--name` and `--prompt-file`, which `lets/src/main.ts` requires, so a literal test exits 2. *What must be true:* each says "with the other required options", as the other scenarios do. — **CONFIRMED.**

### 📌 Suggestions

4. **D13 leaves a step thread running when `lets` gets a signal.** Check: assumption rows. *The scenario:* a script or runner aborts `lets delegate step run`, and the thread keeps writing with no caller. *What must be true:* a person watches the thread in T3 Code. — **OUT-OF-SCOPE.** The story is about a person watching each step in T3 Code (#155 MoSCoW line), and the thread is in the sidebar to stop. Passing signals to a T3 thread needs a handler that #178 adds only for `cli` processes. It can be its own story.
5. **Four sentences pass 30 words.** Check: plain language. *The scenario:* the failed-session bullet in the `delegate-resolvers` delta, the first sentence of *A step runs in a session that may write files*, the stop sentence in design.md decision 3, and the closest-call sentence in adr.md. — **CONFIRMED** for three. The `delegate-step` sentence is the main spec's text, carried whole by the MODIFIED block, and this change does not edit it.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Stop a timed-out review thread too. brainstorm.md D9 says yes, with its evidence, and "Changes from the story" says the review widened it. proposal.md's added bullet covers reviews. design.md drops the `stopOnTimeout` flag from decision 1, rewrites decision 4, and updates the goals, non-goals, test seams, blast radius and docs decision. The `delegate-resolvers` delta renames *A timed-out T3 step is stopped* to *A timed-out T3 session is stopped*, and its review scenario expects the stop.
2. Give the stop a 10-second deadline. D8 and design.md decision 3 say so, and `dispatch` gains an optional `deadline`. The spec requirement says it, and gains the scenario *T3 does not answer the stop*.
3. Add "with the other required options" to the gemini step scenario and the review timeout scenario.
4. Split the long sentences in the `delegate-resolvers` delta, design.md decision 3 and adr.md.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed by required change 1.
2. Fixed by required change 2.
3. Fixed by required change 3.
4. Declined: out of this story's scope, as the check says. The thread stays visible in T3 Code, and design.md's Non-Goals names it.
5. Fixed by required change 4, for the three sentences this change wrote. The `delegate-step` sentence is unchanged main-spec text.
