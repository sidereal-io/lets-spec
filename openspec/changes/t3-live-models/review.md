## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: subagent, other family. `lets delegate review run` exited 3: every model was refused (gemini by the #120 bug, `gpt-6-luna` at its usage limit, `gpt-6.1-sol` and `gpt-6-astra` not on this account). The review ran as a T3 child task on `antigravity/gemini-4-argon`, in plan mode.
- **Independent**: yes. T3's task status names `antigravity` / `gemini-4-argon`, and the author is `claude`. `git status` was the same before and after.
- **Tool restrictions**: read-only by instruction, in plan mode, in the shared checkout
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, at commit be42726

## Findings

### 🔴 Critical (blocking)

1. **A bare family with no default sends `model: null`, which T3 rejects.** `ModelSelectionWire.model` is a `TrimmedNonEmptyString` (t3code 0.1.0 `binCli-*.mjs`:25428). The spec scenario "No default in the catalogue" and design.md's fallback both send no model. Check: contradictions, assumptions. **CONFIRMED.**
2. **The 10 s catalogue timeout does not cover the token or the ticket.** `issueToken` runs `t3` with no time limit, and `requestTicket` fetches with no signal (`t3.ts`:203–227). The timer starts only once the WebSocket is open. A frozen T3 holds `instructions` for minutes. Check: where it stops working. **CONFIRMED.**

### 🟡 Moderate

3. **The default ignores hidden models, and hiding drops custom models.** T3's composer keeps custom models even when hidden (`isCustom || !hidden.has(slug)`, client `utils-*.js`, and `binCli-*.mjs`:322396). It then picks the default from the visible models only. Check: contradictions. **CONFIRMED.** The claim that Antigravity custom models never reach `providers[].models` is **OUT-OF-SCOPE**: `t3` lists what T3's catalogue holds.
4. **A reshaped `getConfig` reply throws a `TypeError`, which becomes exit 4.** design.md catches only errors from the request, not from reading the reply. Check: where it stops working. **CONFIRMED.**
5. **#121 already changed `defaultModel` and archived its manifest scenarios.** `origin/t3-gemini-model-ids` has `defaultModel(manifest, family)`, with no `keepEffort`, and is archived (`da22e2a`). Check: contradictions. **CONFIRMED.**
6. **The spec says "provider" where the design means one provider instance.** A second instance such as `codex_work` has a family under the spec's wording, but the design leaves it out. Check: contradictions. **CONFIRMED.**
7. **D7 and D8 are Assumption rows. A stale token is minted twice. The empty-catalogue scenario has a loophole.** `launchThread` would reuse a token that the catalogue request had already replaced. "Inside T3 Code" passes even when the catalogue was never read. Check: assumption rows, scenario testability. **CONFIRMED** for the double mint and the loophole. **REFUTED** for D7 and D8: the user confirmed the ledger after the author named both rows as assumptions.

### 📌 Suggestions

8. **Plain language.** `status`, `state` and "not failing" name one thing. Some scenario sentences run past 30 words. Some passive voice hides the actor. Check: plain language. **CONFIRMED** in part. "Probe" stays: ADR-006 and the resolver contract use it.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: REVISE

## Required Changes (if APPROVE_WITH_CHANGES)

None. Findings 1 and 5 need decisions and a new base, which a short listed edit cannot cover. The user decided them on 2026-10-31.

CHANGES_APPLIED: n/a

## Rebuttals

1. Fixed in round 2: a bare family runs the visible default, or else the first visible model. With neither, it refuses with exit 3 (User, D10).
2. Fixed in round 2: one deadline covers the token, the ticket and the reply.
3. Fixed in round 2: hiding never drops a custom model, and the default comes from the visible models (User, D12). The Antigravity custom-model part is out of scope, as above.
4. Fixed in round 2: the adapter reads the reply defensively, and any error while reading becomes a warning.
5. Fixed in round 2: the change stacks on #121 (User, D11). The delta modifies #121's "opens a session" requirement.
6. Fixed in round 2: the spec names the provider instance, with a `codex_work` scenario.
7. Fixed in round 2: `launchThread` reads the token again after the catalogue request. "Inside T3 Code" asserts an empty stderr. D8 adds a live bare-family run. Rebutted for D7 and D8: the user confirmed both.
8. Fixed in part in round 2: `status` is the one word, and long sentences are split. "Probe" is kept, as ADR-006 uses it.
