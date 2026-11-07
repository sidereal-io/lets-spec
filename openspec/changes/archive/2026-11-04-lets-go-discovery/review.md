## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The plan was written in a Claude session; `gemini/gemini-4-argon` reviewed it in a fresh Gemini thread, and the meta line says `"independent":true`.
- **Tool restrictions**: read-only: view, grep, glob only. `gitClean` was true after the review.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/lets-go/spec.md and adr.md, at commit e588645, against `skills/lets-go/SKILL.md`, the main `lets-go` spec, `lets-shape` and its issue template, `lets-build`, the `delegate-step` spec, ADR-015, ADR-017, `tests/skill-interfaces.bats`, `README.md`, `openspec/glossary.md` and the archived `lets-go-from-idea` change.
- **How the review ran**: `lets delegate review run` was not run. The `t3` resolver's Gemini session starts in the main checkout, and its sandbox cannot read this worktree. The orchestrating session ran the prompt, `.workspace/lets-go-discovery-review-prompt.md`, in a Gemini thread bound to this worktree, in plan mode, with fresh context, at effort medium.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **The spec contradicts itself on the parent's `Input:` line.** The discovery requirement says the prompt writes the idea's words in `Input:`, so a resumed round can match it, but its scenario `A resumed round finds the parent` tests `Input: conversation, 2026-11-05`. Check: contradictions. CONFIRMED: the scenario was written before the requirement's sentence was added.
2. **A stopped discovery does not resume on a new run.** Typing the idea again sends Start to the title search, which can offer the in-progress parent; a yes makes it `<i>`, and the Epic stop ends the run before the shape step can resume. A reworded idea with the same first five words also loses its answers file. Check: failure modes. CONFIRMED in part: the Epic path is real, and the plan said nothing about a stopped run. The answers-file removal for a reworded idea is #153's rule, and the parent's recorded phases survive it.
3. **A dirty map blocks a later run, or is swept into another commit.** After a none-ready stop, `openspec/discovery.md` stays dirty on the default branch; a later `lets-go #<story>` with no shape step claims the story and stops on `git status --porcelain`, and the map commit never runs. A map dirty before a shape step could be committed as another discovery's. Check: assumption D10. CONFIRMED: the requirement tied the commit to a picked story, and had no guard before the step.
4. **The prompt could re-enter *Shape one issue* on a later round.** `lets-shape`'s mode pick puts single-issue shaping first, and the prompt leads with it, so a fresh round after a `yes` could shape one issue instead of running or resuming discovery. Check: contradictions with `lets-shape`. CONFIRMED: `skills/lets-shape/SKILL.md` *Locate the discovery*, step 4, first match wins.

### 📌 Suggestions

5. ***Resume mode* confirms its restatement, which doubles the rounds.** Step 2 of *Resume mode* confirms a summary with the user before the next phase; inside a step that is one more `needs-input` round per phase. Check: failure modes. CONFIRMED: `skills/lets-shape/SKILL.md` *Resume mode*, step 2.
6. **Sentences over 30 words**, eight listed across proposal.md, design.md and specs/lets-go/spec.md. Check: plain language. CONFIRMED.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Spec, *The shape step asks before it runs discovery*: the scenario uses the idea's words in the `Input:` line, and the requirement says the line holds the idea's words or `#<i>`.
2. Spec, a new requirement *A stopped discovery resumes from its parent issue*; design D-2; brainstorm D5a: for an idea, Start checks the in-progress parents with `lets-shape`'s query before the title search, matches the `Input:` line, and runs the shape step on a match; an issue reaches the step through *Confirm the packet*; a reworded idea is a new input.
3. Spec, *lets-go commits the discovery map on the story's branch*; design D-5; brainstorm D10: the commit runs only when the shape step ran in this run; a map dirty before the shape step stops the run; the none-ready stop says to commit or discard the map before the next run.
4. Spec, *The shape step asks before it runs discovery*; design D-2; brainstorm D5: the prompt orders the step's entry points: *Resume mode* on a matching in-progress parent, else discovery from Ingest on a `yes`, else *Shape one issue*.
5. Spec, the same requirement; design D-2: the prompt says a confirmed phase is settled, so *Resume mode* skips its restatement confirmation.
6. Proposal, design and spec: split the eight sentences finding 6 lists.

CHANGES_APPLIED: yes

## Rebuttals

- Findings 1 to 6: fixed in commit `35fdc6e`, `docs: apply the plan review's required changes to lets-go-discovery`, as changes 1 to 6. The spec's discovery requirement now orders the entry points, settles confirmed phases, and fixes the `Input:` scenario; a new requirement covers a stopped discovery; the map requirement gains the before-step guard, the in-run condition and the stop message; three scenarios each cover the new rules. Design D-2 and D-5, brainstorm D5, D5a and D10, and the proposal record the same. The listed sentences are split.
- Finding 2, the reworded idea: the answers file goes, as #153 decided, and the first parent stays in progress with its confirmed phases. The design's risks say how the user resumes it. No further change.
