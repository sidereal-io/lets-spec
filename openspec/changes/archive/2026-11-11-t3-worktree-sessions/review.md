## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. `lets delegate review run` answered through the `t3` resolver with `gemini/gemini-3.8-flash` (thread `81e419fd-f049-4567-848e-e93bdc3e2b81`). The meta line says `"independent":true`. The author is `claude`.
- **Tool restrictions**: read-only. The prompt said not to edit any file, and `gitClean` was true after the run.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files
- **Commit reviewed**: `79d933b5`. The pinned 0.7.0 `t3` resolver opens threads in the main checkout, so the prompt named this worktree's absolute path. The reviewer's first line confirms it read `/home/andrew/.t3/worktrees/lets-spec/t3-0a89ce71` at `79d933b5744705af608b90367ec355235c13439c`. No fallback was needed.
- **Effort**: low, from design.md's scrutiny tier.

## Findings

### 🔴 Critical (blocking)

1. **The new git call shifts the test fixtures' answer queue.** Check: test seams. `fakeIo` answers `execFile` in order. `launchingIo` and the inline `results` in `tests/lets/resolvers/t3/t3.test.ts` (lines 777 and 831), and `runningT3` in `tests/lets/resolvers/t3/delegate.test.ts` (line 240), answer only two git calls. A third call, `--show-toplevel`, would take `main\n` as the top level. The plan named neither `delegate.test.ts` nor the fixture change. **CONFIRMED.** Fixed by required change 1.

### 🟡 Moderate

2. **The scenarios assert what the thread runs in, which the CLI's output does not show.** Check: scenario testability. **REFUTED.** See Rebuttals.
3. **D10 says a new scenario under the existing requirement, but the spec adds a new requirement.** Check: contradictions. brainstorm.md D10 against proposal.md and the spec delta. **CONFIRMED.** Fixed by required change 2.
4. **Plain language: "in both cases" after three bullets, passive "no thread is created", long WHEN clauses.** Check: plain language. **CONFIRMED** for the count, the passive and the WHEN clauses. Fixed by required change 3. The sentence lengths it counted in proposal.md and design.md are declined; see Rebuttals.

### 📌 Suggestions

5. **The smoke test checks a review's thread, but `t3` archives that thread once the review succeeds.** Check: test seams. `finish` in `lets/src/resolvers/t3/t3.ts` archives on success. **CONFIRMED.** Fixed by required change 4.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

The reviewer suggested REVISE because of finding 1. A small, unambiguous edit fixes finding 1, and fixes every other confirmed finding too. Finding 2 is refuted. So no Critical finding stays open.

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. design.md *Test Seams* gains **Fixtures to update**, which names the fixtures in `t3.test.ts` and `delegate.test.ts` that answer the new git call. *Blast radius* names both test files. proposal.md *Impact* names `delegate.test.ts`.
2. brainstorm.md D10 names the new requirement, *The T3 resolver opens a session in the checkout that asked for it*, and says the existing requirement stays as it is.
3. The spec delta says "In every case" in place of "in both cases", and "`t3` creates no thread" in place of "no thread is created". It splits the four long WHEN clauses with **AND**. design.md's symlink risk is in shorter sentences.
4. design.md Decision 5's smoke-test step runs a handoff from a linked worktree, not a review, and says why.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed: design.md *Test Seams* (**Fixtures to update**) and *Blast radius*, and proposal.md *Impact*.
2. Rebutted: the scenarios of *The T3 resolver opens a session in a T3 thread* in `openspec/specs/delegate-resolvers/spec.md` already assert a thread's state that the CLI does not print, such as "the thread runs `gpt-6-luna`" (line 114). Tests assert that state on the `orchestration.launchThread` payload, the seam that design.md names. A person can see it in T3 Code, where the thread shows its worktree. The new scenarios follow the same pattern.
3. Fixed: brainstorm.md D10.
4. Fixed: the spec delta's requirement text, its WHEN clauses and its failure scenario, and design.md's symlink risk. Declined: the other proposal.md and design.md sentences the reviewer counted at 31 or 32 words. Each states one fact, and splitting them would not make them clearer.
5. Fixed: design.md Decision 5.
