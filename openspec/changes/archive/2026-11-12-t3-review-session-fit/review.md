## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. `lets delegate review run` answered through the `t3` resolver with `gemini/gemini-3.8-flash` (thread `7ba69ff4-4663-4474-9803-dde77d2d5543`, 406 seconds). The meta line says `"independent":true`. The author is `claude`.
- **Tool restrictions**: read-only. The prompt said not to edit any file, and `gitClean` was true after the run.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, ADR-024, relevant source files
- **Commit reviewed**: `fdb57e02`. The pinned 0.7.0 `t3` resolver opens threads in the main checkout and in plan mode, so the prompt named this worktree's absolute path. The reviewer's first line confirms it read `/home/andrew/.t3/worktrees/lets-spec/t3-0a89ce71/openspec/changes/t3-review-session-fit/` at `fdb57e02d091b66a3f7af119b0171b1a1440bdc9`, and its findings cite this change's files. No fallback was needed.
- **Effort**: medium, from design.md's scrutiny tier.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **Neither the tree check nor the `HEAD` check sees a change inside `.git/`, or a commit to another branch.** Check: trust boundary. `isTreeClean` in `lets/src/delegate/git.ts` reads `git status`, which ignores `.git/`. `commit` reads only the checkout's `HEAD`. **CONFIRMED** as a limit to record. It is not new: `buildLaunch` already sends `runtimeMode: 'full-access'` in plan mode. Fixed by required change 3.
2. **A skill that reads its own `HEAD` after the review would match a reviewer's commit.** Check: assumption rows (D11, D14). `skills/lets-review-plan/SKILL.md` line 121 reads `HEAD` after the run. **CONFIRMED.** Fixed by required change 2.
3. **The time-limit requirement says the command exits 6, but no scenario asserts it.** Check: scenario testability. `openspec/specs/delegate-review/spec.md` has no timeout scenario. **CONFIRMED.** Fixed by required change 1.

### 📌 Suggestions

4. **The proposed-plan check never fires in default mode, and a plan written as prose still exits 0.** Check: assumptions (D3). **Declined.** See Rebuttals.
5. **Two sentences in the `delegate-resolvers` delta exceed 30 words.** Check: plain language. **CONFIRMED.** Fixed by required change 4.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

Every confirmed finding has a small, unambiguous fix, listed below. No Critical finding is open. The reviewer also suggested APPROVE_WITH_CHANGES.

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. `specs/delegate-review/spec.md` gains the scenario *The session runs past the limit*: exit 6, empty stdout, and stderr says no result came in time.
2. design.md Decision 8 says the skill notes its own top level and full `HEAD` before it writes the prompt, and compares with those. brainstorm.md D14 says the same.
3. design.md *Risks* and ADR-024 *Consequences* say that neither check sees a change inside `.git/` or a commit to another branch.
4. `specs/delegate-resolvers/spec.md` splits the opening sentence of *A T3 review that returns a plan exits 5*, and that requirement's first WHEN clause, with **AND**.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed in `f47c5f08`: design.md *Risks* and ADR-024 *Consequences*.
2. Fixed in `f47c5f08`: design.md Decision 8 and brainstorm.md D14.
3. Fixed in `f47c5f08`: the new scenario in `specs/delegate-review/spec.md`.
4. Declined: the check is a backstop for a thread that runs in plan mode anyway, for example if T3 ignores or changes the mode it was sent. All 22 `proposed_plan` items in T3's state come from plan-mode threads, and one of them gave exit 0 (D3). A plan written as prose in default mode is a different failure. The skills' `Read:` line and their reading of the findings are what catch it.
5. Fixed in `f47c5f08`: the requirement text and the WHEN clause in `specs/delegate-resolvers/spec.md`.
