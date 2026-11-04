## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The plan was written in a Claude session; `gemini/gemini-4-argon` reviewed it in a fresh Gemini thread, and the meta line says `"independent":true`.
- **Tool restrictions**: read-only: view, grep, glob only. `gitClean` was true after the review.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/lets-go/spec.md and adr.md, at commit f648d9d, against `skills/lets-go/SKILL.md`, the main `lets-go` spec, `lets-build`, `lets-shape`, the `delegate-step` spec, ADR-014, ADR-015 and ADR-017, `tests/skill-interfaces.bats`, `overlays/AGENTS.md`, `README.md`, `openspec/glossary.md` and the archived `lets-go-story` change.
- **How the review ran**: `lets delegate review run --for plan` exited 5 twice. The `t3` resolver's Gemini session starts in the main checkout, and its sandbox cannot read this worktree, so the session stopped to ask instead of reviewing. The orchestrating session then ran the same prompt, `.workspace/lets-go-from-idea-review-prompt.md`, in a Gemini thread bound to this worktree, in plan mode, with fresh context. Those two failed starts produced no findings and count as no round.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **The shape prompt stops `lets-shape` short, and forbids the glossary holding branch.** "Stop once the issue is written and its Project fields are set" skips steps 8 and 9 of *Shape one issue* and the glossary handoff; "create no branch" conflicts with the holding branch *Preserve glossary edits between sessions* makes; the packet confirmation is not named as a confirmation question. Check: contradictions with `lets-shape`. CONFIRMED: `skills/lets-shape/SKILL.md` lines 131 to 135 create the holding branch, and lines 337 to 423 run the handoff after step 7.
2. **A stale answers file answers a new idea.** Two ideas can share their first five words, and one issue can enter the shape step twice, so `<name>-shape-answers.yaml` from an earlier step is fed into the first round of a later one. Check: assumption D10. CONFIRMED: `skills/lets-go/SKILL.md` *Run a step* step 4 adds any existing answers file, and nothing removes it.
3. **Confirm the packet can send the issue back into the shape step.** After shape reports `done`, Start reruns *Confirm the packet*; a stop with a `lets-shape` remedy would run shape again on the same cause. Check: contradictions. CONFIRMED: the delta set the stop aside without a bound.
4. **Design D-1 says the shared sections run "as they are", and the plan leaves out *Find the first unfinished step*.** That section says shape is done once *Confirm the packet* passes and that Start printed shape's line; Start's steps 5 and 10 must branch on whether shape ran; the frame, the fallback and *Read the report* change for shape. Check: contradictions with the skill. CONFIRMED in part: brainstorm D15 and the proposal's Impact already named the frame, *Read the report*, the fallback and *End of the run*, but not *Find the first unfinished step* or steps 5 and 10, and D-1 overstated what stays unchanged.

### 📌 Suggestions

5. **The slug rule is underspecified** for punctuation, flags and ideas shorter than five words. Check: assumption D10. CONFIRMED.
6. **Sentences over 30 words** in design.md and specs/lets-go/spec.md, eight listed. Check: plain language. CONFIRMED.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Spec, *The shape step shapes an idea or an unshaped issue*, design D-1 and brainstorm D5: the prompt says to run *Shape one issue* to its end, including the second comment fetch, the reply and the glossary handoff; to end on the default branch with a clean tree; to create no change and no change branch, a glossary holding branch allowed; and that the packet confirmation is a confirmation question. Spec, *The step prompt says what to run, the level, and how to report*: name an issue packet beside a brainstorm ledger as a confirmation.
2. Spec, the same requirement, design D-6 and brainstorm D10: `lets-go` removes `.workspace/lets-go/<name>-shape-answers.yaml` once the shape step reports `done` or `failed`.
3. Spec, the same requirement and *Start reuses lets-build*, design D-1 and brainstorm D4: the shape step runs at most once per run; after it, a *Confirm the packet* stop stands.
4. Design D-1, brainstorm D15 and the proposal's Impact: name *Find the first unfinished step* and Start's steps 5 and 10 among the places that change, and say what the shared sections gain for shape.
5. Spec, design D-6 and brainstorm D10: fix the slug rule: split on white space, lower-case, keep letters and digits, drop an empty word, join the first five or all when fewer.
6. Design and spec: split the eight sentences finding 6 lists.

CHANGES_APPLIED: yes

## Rebuttals

- Findings 1 to 6: fixed in commit `410491f`, `docs: apply the plan review's required changes to lets-go-from-idea`, as changes 1 to 6. The spec's shape requirement now bounds the step to once per run, says to run *Shape one issue* to its end and finish on the default branch with a clean tree, fixes the slug rule, and removes the answers file after `done` or `failed`; four scenarios cover these. Design D-1 lists what each shared section gains, and D-6 the removal and the slug rule. Brainstorm D4, D5, D10 and D15 record the same. The listed sentences are split.
- Finding 1, the documentation pull request part: when the user picks a documentation pull request as the glossary owner, `lets-build`'s *Check the prerequisite* stops the run until it merges. That is `lets-build`'s rule for a story whose definitions live elsewhere, and it applies the same way under `lets-build`. The design's risks name it; no change to the plan.
