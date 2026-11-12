## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (`gemini/gemini-3.8-flash` through the `t3` resolver, thread `b2f9c8c7-428e-4187-9f8a-ea93c3358ff7`; the meta line says `"independent":true`)
- **Independent**: yes. The plan's author is `claude`, and the reviewer is `gemini`.
- **Tool restrictions**: read-only by prompt. The `t3` resolver in the pinned `lets` 0.7.0 opens the thread in the main checkout, so the prompt named this worktree's absolute path, branch and commit. The reviewer answered `Read: /home/andrew/.t3/worktrees/lets-spec/t3-0a89ce71 at 7601d1cc0b4243afe85da25514a42532549c2a56`, which is this branch's head at the time of review. The tree stayed clean (`"gitClean":true`), and the review took 476 seconds. No fallback through `delegate_task` was needed.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, and T3 Code 0.1.7's server code
- **Commit reviewed**: `7601d1cc`
- **After the review**: the branch was rebased onto `t3-review-session-fit` at `c02af04b`, once #221 was built and archived. `git range-diff` shows every plan commit unchanged, so `7601d1cc` is now `5ad35d12`. The plan was then updated to point at #221's archived design, and to put the docs text in a paragraph, as #221 did. That edit changes no decision the review checked.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **Scenario 1 omits #221's proposed-plan condition.** Check: contradictions. *The scenario:* `specs/delegate-resolvers/spec.md`, scenario *The run shows waiting for a moment, then completes*, expects exit 0 after `waiting` → `completed`. Under #221, a completed run that holds a proposed plan exits 5. *What must be true:* the scenario says the run completes with no proposed plan. — **CONFIRMED.**
2. **A run whose checkpoint capture fails stays `waiting` and holds the caller to the time limit.** Check: the waiting case. *The scenario:* T3 0.1.7 stores a completed turn as `waiting` and starts a checkpoint capture (`runtimeLayer-HjrbqSoY.mjs:137423`, comment at 139575). If the capture fails, the run never reaches `completed`, and `lets` polls for 30 or 45 minutes before exit 6. — **Partly CONFIRMED.** The meaning of `waiting` is right, and it is the root cause of #102. A failed git capture does not leave the run `waiting`, though: T3 catches it and records the checkpoint with status `error` (`runtimeLayer-HjrbqSoY.mjs:5549`). Other finalization failures, such as a database error, could still leave the run `waiting`.

### 📌 Suggestions

3. **design.md's Test Seams does not list the two new tests.** Check: test seams. It names only the fixture change; the new cases are in brainstorm.md D8. — **CONFIRMED.**
4. **Three sentences run over 30 words.** Check: plain language. design.md decision 4, adr.md's summary, and brainstorm.md D2. — **CONFIRMED.**
5. **D2 is labelled `Assumption`, but T3's own `waitForRun` supports it.** Check: assumption rows. — **CONFIRMED.**

The reviewer also noted D5 as a bet: a review that calls a secret or link tool would wait to the time limit. design.md already lists it as a risk, and the reviewer raised no separate finding.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. `specs/delegate-resolvers/spec.md`: the first scenario's run completes "with a final message and no proposed plan". (Finding 1)
2. `design.md` Test Seams: list the two new tests, a `waiting` → `completed` run that returns its message, and a run that stays `waiting` and times out naming the thread. (Finding 3)
3. Split the long sentences in `design.md` decision 4, `adr.md`'s summary and `brainstorm.md` D2. (Finding 4)
4. `design.md` Context: say what `waiting` means in T3 0.1.7, with the line numbers, and that a failed git capture still ends. Risks: add a run whose finalization fails some other way. (Finding 2)
5. `brainstorm.md` D2: cite T3's checkpoint semantics and `waitForRun` as evidence, in place of `Assumption`. (Finding 5)

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed: required change 1.
2. Fixed in part, rebutted in part. The meaning of `waiting` is now in design.md's Context and D2 (required changes 4 and 5). The failed-capture case is rebutted: `runtimeLayer-HjrbqSoY.mjs:5549` catches a failed capture and records it as status `error`, so the run still completes. The remaining case, a finalization that fails in another way, is a new risk in design.md. Before this change that run exited 5 at once; now it exits 6 at the limit. Neither returns the message, so the change makes nothing worse, and the thread still holds the message.
3. Fixed: required change 2.
4. Fixed: required change 3.
5. Fixed: required change 5.
