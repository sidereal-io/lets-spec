## Review Metadata- **Reviewer:** claude/claude-opus-5-5, subagent, other family with fresh context (the author family is GPT, from the PR body and the brief), independent: yes
- **Reviewed head:** `30425ce3a9fd570754c2f8de3ee7339885bee235`
- **Round:** 1. Prior round: the earlier Opus review gave REVISE. Its 10 findings were rechecked and are summarised in Result 2.
- **Inputs read:** `brainstorm.md`, `proposal.md`, `design.md`, `adr.md`, `tasks.md`, `specs/delegate-review/spec.md`, the main `openspec/specs/delegate-review/spec.md`, ADR-023, `skills/lets-go/references/step-prompt.md`, the #226 shared decisions and the #229 packet from the brief.
- **Vocabulary inputs:** `skills/lets-shape/references/domain-language.md`, `skills/lets-shape/references/plain-language.md`, `openspec/glossary.md`. There is no narrower glossary for delegate-review, and no REVIEW.md.
- **Limits:** I worked read-only. I ran only the filtered Bats checks. I did not run `pnpm test`, `nix flake check` or `mise run check`.

**Decision under review:** separate listed models from allowed models, and stop and ask when guidance excludes them all. In build reviews, rank against every author family, pass this session's family to the CLI, and report overlap separately. This rules out three things: falling back silently, changing the CLI, and treating the CLI's single-family `independent` value as independence from all authors.

## Findings

1. **Moderate: the spec does not say what the user may pick at the excluded-all stop, so the spec, the design and the skills give three different answers.**
   - **Where:** `specs/delegate-review/spec.md:5,9` says "ask the user to choose a model or the subagent step", and fallbacks respect exclusions "unless the user changes them". `design.md:24` says "a user selecting a previously excluded model must change the exclusion explicitly". Both skills (build `:77-78`, plan `:95-96`) say "Ask the user to change the guidance to allow a model or the subagent step".
   - **Scenario:** a Claude session has guidance "never use claude", and the resolver lists only `claude/*`.
     - The spec's scenario offers the subagent step without condition. Here that subagent is Claude, which the same requirement forbids ("Every fallback SHALL respect guidance exclusions").
     - It is also unclear whether "use claude/opus" typed in reply counts as changing the guidance, or whether `delegate.review.*.guidance` in the `lets` config has to be edited first.
   - **Consequence:** one agent may refuse the user's typed choice until the config is edited. Another may edit the user's config itself. The SLR-10 decision ("offers a model or the subagent step") gets applied inconsistently.
   - **What must be true:** the spec and design say that the user's explicit choice of a listed model, given in the answer, is the change in exclusions for this run. They also say the subagent step is offered only when a permitted subagent can run.

2. **Moderate: the second stop ("no permitted subagent can run") has no spec scenario and no `needs-input` route.**
   - **Where:** both skills' subagent step says "If no permitted subagent can run, stop and ask the user" (build `:116-117`, plan `:145-146`). No spec scenario covers this. The `lets-go` route was added only to the excluded-all stop (`:79`, `:97`).
   - **Scenario:** in a `lets-go` review step, the run exits 3, and guidance excludes the family of the only subagent available.
   - **Consequence:** ADR-023 says a step never asks in its session. This stop asks in its session, so the step hangs or is reported as a failed session. That is the same defect the prior round's finding 10 fixed for the other stop.
   - **What must be true:** the spec has a scenario "no permitted fallback can run → stop and ask, through `needs-input` in a `lets-go` step", and the skills route this stop the same way as the first.

3. **Moderate: the tasks' verify commands fail, and the "passed" marks are stale.**
   - **Where:** `tasks.md:3-7` filter on `'review model choice: exclusions'`, `…: ranking`, `…: overlap`, `…: subagent provenance` and `…: missing REVIEW.md`. Commit 08d20a0d merged those tests into `review model choice: policy anchors`.
   - **Evidence:** I ran task 1.1's command. It printed `ERROR: Found no tests.` and exited 1.
   - **Coverage gaps:**
     - No task covers the "Resolver lists no models" or "Fresh-session models are refused … subject to guidance exclusions" scenarios.
     - No task covers the `needs-input` routing.
   - **Consequence:** `openspec-verify-change` or a later session cannot reproduce any ✓. The tasks no longer cover every scenario.
   - **What must be true:** each task names a filter that matches a real test, such as `--filter 'review model choice: policy anchors'` or the updated ranking and no-options tests. A task or a line in an existing task covers the fallback-respects-exclusions scenarios.

4. **Suggestion: the Deviations Ledger is out of date.**
   - **Where:** `tasks.md:11` says "Review is recorded as deferred rather than claiming a verdict". Commit 69a0c880 removed that placeholder record.
   - **Correction:** say that the plan review is recorded in `review.md` before archive.

Checks with no finding:
- **Assumption rows:** none exist. D1 and D2 are User rows and are respected. D3 is evidence from the story.
- **Scope:** matches the proposal. #220 and #230 stay out.
- **ADR manifest:** trimmed to 006, 008, 019 and 023, which is correct. No new ADR is warranted.
- **Test seam:** matches `design.md:13-15`.
- **Scenario testability:** the mixed-author scenarios can only be asserted by a reader walkthrough, not by a text test. `design.md:31` says so openly, so I do not count it as a defect.

**A failure mode the author may have missed:** finding 2. Both of the new stops ask the user, but only the first one returns `needs-input`.

## Verdict

VERDICT: APPROVE_WITH_CHANGES

Each finding has a small, unambiguous edit, listed below.

## Required Changes

CHANGES_APPLIED: yes

1. **`spec.md:5,9` and `design.md:24`:** state that the user's explicit choice of a listed model in the answer is the change in exclusions for this run. Offer the subagent step only when a permitted subagent can run.
2. **`spec.md`:** add the scenario "no permitted fallback can run → stop and ask (`needs-input` in a `lets-go` step)".
3. **`tasks.md:3-7`:**
   - Point each verify command at a test that exists.
   - Cover the fallback-respects-exclusions scenarios and the `needs-input` routing.
   - Fix the ledger line at `:11`.

## Rebuttals

1. **CONFIRMED, fixed in 7114cf43:** the answer allows a listed model for this run without editing config; only a permitted subagent is offered. The skills, spec and design now agree.
2. **CONFIRMED, fixed in 5a023a5e:** every user question in either skill returns `needs-input` in a `lets-go` step. The spec includes the missing no-permitted-fallback scenario.
3. **CONFIRMED, fixed in 082e744e:** task commands now match the compact policy, ranking and no-options tests. Their current commands passed; the author walked through the fallback and question routes before recording completion.
4. **CONFIRMED, fixed in 082e744e:** the ledger describes recording the real plan review before archive.

The final source/build review also requested an anchor at the actual stop (dec2da2a), a conjunction in the report sentence (a72129e2), and current PR validation text (updated in the PR). All were accepted. No Critical or Moderate finding remains open.
