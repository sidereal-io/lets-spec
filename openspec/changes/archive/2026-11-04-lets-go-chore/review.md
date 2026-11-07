## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The plan was written in a Claude session; `gemini/gemini-4-argon` reviewed it through the `t3` resolver, and the meta line says `"independent":true`.
- **Tool restrictions**: read-only: view, grep, glob only. `gitClean` was true after the review.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/lets-go/spec.md, adr.md, ADR-015, at commit 0e94c59, against the delegate-step spec and code, `lets-build`, `lets-brainstorm`, `tests/skill-interfaces.bats`, `tests/sync-rules.bats`, `flows.json`, `overlays/AGENTS.md` and the README.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **Where the Kind gate sits.** Design D-1 put the Kind Chore gate before `lets-build`'s *Find the source of demand*, but `lets-build` reads the Kind only in *Confirm the packet*, and the spec forbade `lets-go` any `gh` command of its own. Check: contradictions, assumption rows (D2). CONFIRMED: `skills/lets-build/SKILL.md` reads `{kind, priority, size, status}` in *Confirm the packet*, after the glossary prerequisite check.
2. **No source for `createdAt`.** The skip line falls back to the issue's `createdAt`, but neither `lets-build`'s `gh issue view` nor the thread query reads it, and `lets-go` could add no command. Check: contradictions, assumption rows (D5). CONFIRMED: `gh issue view <i> --json number,title,body,url,parent` and the query in `references/issue-comments.md` select no issue `createdAt`.
3. **A resumed brainstorm cannot source its ledger rows.** The `## Answers` section does not say which answers the user gave and which `lets-go` took from a recommendation, so the step cannot set `User` or `Assumption`, nor know that the confirmation is answered. Check: contradictions with `lets-brainstorm`'s ledger rules. CONFIRMED: `lets/src/delegate/report.ts` appends plain question and answer pairs, and `skills/lets-brainstorm/SKILL.md` needs a source per row and an explicit yes.
4. **Exit 3 parsing weaker than `lets`.** The subagent path checked only the fence and `outcome`, not the per-outcome fields. Check: contradictions with `openspec/specs/delegate-step/spec.md`. CONFIRMED: `lets/src/delegate/report.ts` rejects a `done` report without `evidence`, a `needs-input` report without `questions`, and a `failed` report without a string `reason`.
5. **Routing row test seam and table forms.** The design named `tests/sync-rules.bats` as a seam for the routing row, but that file tests no routing table, and the spec asked the README to hold "the same row" though its table has another form. Check: test seams. CONFIRMED: `tests/sync-rules.bats` checks marker replacement and file modes only; `README.md` uses `| You want to | Run |` with bare skill names, `overlays/AGENTS.md` uses `| Request | Start with |` with `The \`x\` skill`.

### 📌 Suggestions

6. **Scenarios assert runtime behaviour the prose test cannot run.** The reviewer asked that the spec say which fixed strings the skill-interfaces test asserts. Check: scenario testability. CONFIRMED in part: most scenarios describe what an agent following the skill does, which only a run can check; the fixed strings the bats test greps were not listed in one place.
7. **Sentences over 30 words.** Twenty-two sentences across the artifacts. Check: plain language. CONFIRMED for the spec, design, adr.md and ADR-015. Declined for the brainstorm's ledger rows: `lets-brainstorm` keeps each row to one line, and the design holds the why.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Spec, *lets-go runs on the default branch, for a Chore*, and design D-1: the Kind gate sits inside *Confirm the packet*, right after the Project fields are read, before the parent epic is read; an earlier `lets-build` stop stands. Brainstorm D2 says the same.
2. Spec, *Start reuses lets-build* and the skip requirement, design D-1, brainstorm D5: `lets-go` adds one command, `gh issue view <i> --json createdAt`, run only when `lastEditedAt` is null; `lastEditedAt` comes from the thread query.
3. Spec, the prompt and relay requirements, design D-2, brainstorm D11: `lets-go` marks an answer it took from a recommendation with ` (lets-go accepted the step's recommendation; the user did not decide)`; the prompt frame says a marked answer is `Assumption`, any other is `User`, and yes to the confirmation question confirms the ledger.
4. Spec, *Exit 3 runs the step in a subagent*, and design D-5: the per-outcome field rules from the `delegate-step` spec, and a new scenario for a `done` report with no evidence.
5. Design *Test Seams* and *Blast radius*, spec *lets-go ships in both flows*: every new test lives in `tests/skill-interfaces.bats`; the routing rows are stated in each table's own form; `tests/sync-rules.bats` is not touched.
6. Spec: a new requirement, *The prose holds the fixed lines the tests check*, listing the strings the skill-interfaces test greps.
7. Split the sentences over 30 words in the spec, design, adr.md and ADR-015.

CHANGES_APPLIED: yes

## Rebuttals

- Findings 1 to 5: fixed in commit `docs: apply the plan review's required changes to lets-go-chore`. The spec was rewritten with changes 1 to 7; design D-1, D-2 and D-5, its *Test Seams* and *Blast radius* carry changes 1 to 5 and 7; brainstorm D2, D5 and D11 carry changes 1 to 3; adr.md and ADR-015 carry change 7.
- Finding 6: fixed in part by change 6, the new requirement that lists the fixed strings. The runtime scenarios stay: they say what the skill must make an agent do, and the first dogfood run after the next release checks them.
- Finding 7: fixed for the spec, design, adr.md and ADR-015. Rebutted for the brainstorm's ledger rows, which the `lets-brainstorm` skill keeps to one line each.
