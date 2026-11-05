## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The author is Claude; the reviewer was `gemini/gemini-4-argon`, in a fresh T3 thread bound to this worktree.
- **Tool restrictions**: read-only: view, grep, glob only
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, at commit `16996d6`, tier `low`
- **Prompt**: `.workspace/step-names-review-prompt.md`. Raw findings: `.workspace/step-names-review-raw.md`.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **`Done <step>:` and `Failed <step>:` would print `review-build` in kebab-case, and the spec pinned no `Done plan`, `Done build` or `Done review build` line.** CONFIRMED. The skill defines `<step>` as the `--for` value, and its *End of the run* says `Failed <step>: <reason>`; the delta's *Review build ends the run* said `Done <step>: <date>`. Both contradict D2. Check: contradictions, scope.
2. **`StepOptions['for']` is the whole `Intent` union, so an in-process `step()` call with `for: 'apply'` compiles and passes.** CONFIRMED. `lets/src/delegate/step.ts` types `for` as `Intent`, and the resolver tests call `step()` in process. Removing `propose` makes `tsc` catch those sites; keeping `apply` for `handoff` does not. Check: test seams, assumptions.
3. **The final grep in design.md and the bats negatives in D8 missed `delegate.step.apply`, `--for apply` under `step`, and the spoken old names.** CONFIRMED. `lets/src/main.ts`, `README.md` and `docs/resolvers.md` hold `delegate.step.apply.guidance`, and the skill's prose says `propose review` and `apply review`. Check: scope, completeness.

### 📌 Suggestions

4. **The step prompt's first line puts the kebab-case `<step>` in a sentence.** CONFIRMED as described, accepted as a clarification. That line tells the session which step it runs, so it carries the `--for` value on purpose. Check: contradictions.
5. **Plain language: passive voice that hid the actor, and sentences over 30 words, in the plan's own prose.** CONFIRMED. Check: plain language.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. In the `lets-go` delta, *Review build ends the run* says the `Done` and `Failed` lines use the step's spoken name, with a space, and *The prose holds the fixed lines the tests check* pins `Done plan: <date>. <evidence>`, `Done build: <date>. <evidence>` and `Done review build: <date>. <evidence>`. Design decision 3, D2 and the proposal say the same.
2. Design decision 1 adds `STEP_INTENTS`, a `const` tuple, and `StepIntent`; `StepOptions['for']` becomes `StepIntent`. `InstructionsOptions` and `guidanceFor` keep `Intent`.
3. The design's grep risk and D8's negative checks cover `delegate.step.apply`, `step.apply`, `for: 'apply'`, `--for apply`, `propose review`, `apply review`, `propose-review` and `apply-review`. A hit under `handoff` stays.
4. Design decision 3 says the prompt's first line names the step as `--for` does, and why.
5. Rewrite the passive sentences in brainstorm.md D5 and *Changes from the story*, proposal.md, design.md decision 2 and adr.md in the active voice. Split the sentences over 30 words in design.md's *Test Seams*, *Blast radius*, decision 4 and the grep risk, and the answers-file sentence in the `lets-go` delta.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed, in commit `docs: apply the plan review's changes to step-names`: `specs/lets-go/spec.md` *Review build ends the run* and the fixed-lines list; design.md decision 3; brainstorm.md D2; proposal.md.
2. Fixed, same commit: design.md decision 1. The tasks carry the type change.
3. Fixed, same commit: design.md *Risks* and decision 6; brainstorm.md D8.
4. Fixed, same commit: design.md decision 3.
5. Fixed, same commit, in every file the finding named. `openspec validate --strict` still passes.
