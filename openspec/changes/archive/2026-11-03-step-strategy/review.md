## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The author is `claude`; the reviewer was `gemini/gemini-4-argon`, through the `t3` resolver, in thread `f4373a0f-4a80-4d60-bdb3-478f67db6dcd`. The meta line says `"independent":true`.
- **Tool restrictions**: read-only: view, grep, glob only. The tree was clean after the review (`"gitClean":true`).
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, ADR-014, relevant source files, at commit `09c0374`
- **Effort**: high, from design.md's scrutiny tier

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **The default's step runs once per `--model`.** `withModels` asks `subagent.step` for each model, so the prompt file is written once per model and the saved path appears on every refusal line. A failed write becomes exit 4. — **CONFIRMED** in part. The repeated write is idempotent and the repeated line is the spec'd `<model>: <reason>` format. A failed write already exits 4 for `subagent.start` today (`lets/src/delegate/lookup.ts`, `inAdapter`). Check: assumption rows (D10).
2. **A session that fails after starting has no handle.** `Adapter.run` throws `SessionFailed` without a handle, and `Adapter.step` would too, so the plan's "finish every session" and "the record holds `handle`" promises could not be kept on that path. — **CONFIRMED**. Check: contradictions.
3. **Fence matching was unspecified.** A three-backtick quote inside a four-backtick block, or an example block in prose, could be read as the report. — **CONFIRMED** for the inner fence. The example-in-prose case is **OUT-OF-SCOPE** as a parser rule: no rule tells a real report from a quoted one; it is a documented risk. Check: scenario testability.
4. **Multi-line and blank answers.** A multi-line answer would spill out of its `- Q:`/`A:` item, and blank strings were not rejected. — **CONFIRMED**. Check: assumption rows (D11).
5. **Untouched `delegate-config` requirements still name two strategies.** "A refused model passes to the next", "A chain where every resolver declines fails the command" and "An unexpected failure inside a resolver exits 4" named only `review run` and `handoff run`, while the proposal said the ranked-model rules cover `step run`. — **CONFIRMED**. The `delegate-resolvers` point, that "The T3 resolver declines outside T3 Code" names reviews and handoffs, is **REFUTED**: the delta's new requirement says `t3` declines every step inside T3 Code or not, which is wider, not in conflict. Check: contradictions, parser format.

### 📌 Suggestions

6. **Sentences over 30 words** in `delegate-step/spec.md` (three), `delegate-instructions/spec.md` and `delegate-default/spec.md`. — **CONFIRMED**. Check: plain language.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. `specs/delegate-step/spec.md`: state the fence rule (opening line of three or more backticks and `step-report`; closing line of at least as many backticks and nothing else; the last block wins; text after it is ignored), with a scenario for a fence inside the block.
2. `specs/delegate-step/spec.md` and `design.md` D-3: when the resolver reports the session failed, no `finish` is asked and the record's `handle` is `null`. The finish requirement starts "After the session gives its final message".
3. `specs/delegate-step/spec.md` and `design.md` D-4: each `question` and `answer` holds text other than white space, else exit 2; a multi-line question or answer stays inside its own entry, with continuation lines indented. Scenarios for a multi-line answer and a blank answer.
4. `specs/delegate-config/spec.md`: MODIFIED blocks for "A chain where every resolver declines fails the command", "A refused model passes to the next" and "An unexpected failure inside a resolver exits 4", each naming `step run` with a scenario.
5. `specs/delegate-default/spec.md` and `design.md` D-5: say the default writes the same file again for each further `--model`, and that a failed write exits 4 as it does for a handoff.
6. `design.md` Risks: a session that quotes a `step-report` block in prose and writes none of its own.
7. Split the sentences over 30 words that the review names.

CHANGES_APPLIED: yes

## Rebuttals

- Finding 1: fixed in part, change 5 (`design.md` D-5, `specs/delegate-default/spec.md`). The exit-4-on-failed-write part is rebutted: `lets/src/delegate/lookup.ts` `inAdapter` gives the same exit for `subagent.start` today, and the plan keeps that behaviour.
- Finding 2: fixed, change 2 (`specs/delegate-step/spec.md`, requirements "A session that gives no valid report is a failed report", "The step hands its session back" and "The step record"; `design.md` D-3).
- Finding 3: fixed for the inner fence, change 1 (`specs/delegate-step/spec.md`, "The step's session ends its final message with a step report"; `design.md` D-2). The quoted-example case is recorded as a risk, change 6: no parser rule can tell a quoted block from a real one, and the docs will tell a step to write its report last.
- Finding 4: fixed, change 3 (`specs/delegate-step/spec.md`, "Answers resume a step"; `design.md` D-4).
- Finding 5: fixed for `delegate-config`, change 4. Rebutted for `delegate-resolvers`: the delta's "The T3 resolver declines every step" covers steps everywhere, and the main spec's "declines outside T3 Code" stays true for reviews and handoffs.
- Finding 6: fixed, change 7.

The required changes are committed as `docs: apply the plan review's required changes to step-strategy`, before this file.
