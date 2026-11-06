## Context

The source already separates author plan and build review skills. `lets delegate review` supports the `plan` and `code` intents, read-only fresh sessions, ranked models and refusal handling. Its metadata says which model ran and whether it differed from the supplied source family. It checks working-tree changes, not whether a reviewer followed its reasoning method.

`flows.json` selects authored skills for both release variants. `build/build-release.mjs` copies whole skill directories, including references. `tests/skill-interfaces.bats` validates names, commands, links and reachability; entry points need an explicit exemption from workflow reachability. No executable collaborator-review engine exists.

The project is pinned to release 0.7.0 for its own workflow. That installed schema still requires a plan review artifact; current source workflows record author reviews in PR descriptions. This change follows its installed schema while adding an independent collaborator skill to the source.

## Goals / Non-Goals

**Goals:** Ship `lets-review-pr` as a standalone entry point in both flows. Give a mediator an executable method for bounded examiner/challenger passes and one useful public comment. Preserve the user's model preference and captured-revision decision.

**Non-Goals:** Add a new delegation strategy, programmatic review engine, automatic invocation, contributor fixes, required target-project artifacts, hosted execution or cross-revision finding tracker. Change no author's build gate or ADR template.

## Test Seams

- **Primary test seam:** the installed skill contract and release output, exercised by `tests/skill-interfaces.bats` and the existing release builder harness.
- **Existing seams reused:** `skill_says`, flow selection, reference-link assertions and release materialization helpers. Extend entry-point classification for `lets-review-pr` explicitly.
- Contract tests cover required prompts, guardrails and output fields. They do not prove an LLM's judgment. Add a small set of scripted review exercises under the skill's references: disproved concern, justified early exit, supported uncertain risk, advancing head and a no-findings result. Each supplies inputs and expected decisions for a future explicit trial; do not claim those trials ran because text assertions passed.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** new public review entry point; access to target PR data; delegation prompts; public comment publication. Existing CLI, resolver wire contracts, build schemas and contributor files remain unchanged.

## Decisions

### Keep orchestration in a standalone skill

Add `skills/lets-review-pr/SKILL.md` with focused references for pass prompts, publication format, ADR research sources and trial exercises. The invoking session is the mediator. A pass delegates its examiner and challenger in fresh read-only contexts, then obtains the examiner's one response with the challenge and original evidence supplied. A harness that cannot resume a role can start a fresh role session with that bounded transcript. Never simulate both roles in the mediator's own context.

Use existing `lets delegate review instructions --for plan` for decision passes and `--for code` for implementation and focused implementation questions. Rank permitted discovered models with the implementer's known model as a preference to avoid, not a requirement for a different family. Unknown authorship remains unknown; do not infer it from the reviewer's identity. Existing model metadata supports honest reporting, without defining a new independence flag. When discovery provides no options or every model is refused, use the existing fresh read-only subagent fallback. If no such delegation is available, report the review incomplete; do not substitute an unchallenged review.

`lets delegate review run` requires `--source-family`. When the implementer's family is known, use it. When it is unknown, pass the mediator's known family only as a CLI compatibility value. Keep implementer provenance unknown in prompts and publication; the resulting `independent` boolean compares the role to that compatibility value and is not evidence of independence from the implementer. Contract tests must cover this unknown-provenance path. If the mediator's family cannot be represented by the existing CLI, use an available fresh read-only native subagent or report the unsupported prerequisite; never invent a family.

Alternatives: changing the CLI would impose a new contract for judgment expressed in prompts; reusing author-review skills directly would import their build gates, verdicts and PR body writes. Both exceed the independent comment workflow.

### Capture immutable Git inputs before starting passes

Resolve an explicit PR URL or repository/number with `gh pr view` and record repository identity, head SHA, base SHA, base ref, URL and capture time. Ensure the captured Git objects are readable locally by fetching explicit refs as needed. Compute and record the merge base from the captured base and head. If refs race during fetch, obtain and verify the recorded objects or stop; never silently use the new branch head.

Read the diff from captured merge base to captured head. Read target files with `git show <sha>:<path>` and cite links containing the head SHA. Never switch the user's checkout to the PR branch or use the current worktree as evidence for the captured head. Preserve the user's working tree. Each prompt receives explicit revision identity, read-only rules and concrete evidence paths. A missing object or unreadable/truncated diff is a reported limitation that prevents claiming a complete full pass.

Before publishing, read the current head again. If it differs, retain the reviewed head and say newer commits were not reviewed (D2). If the final head cannot be read, state that the current head could not be checked. A repeat invocation starts afresh; old comments supply claims to reassess, never dispositions to trust.

### Keep target criteria bounded by the review method

Read the target project's configuration, applicable glossary paths and `REVIEW.md` at the captured revision. Resolve separate planning stores explicitly if present; record source and material limits rather than guessing or substituting this repository's glossary. Carry concrete vocabulary inputs and semantic checks into every delegated prompt. Treat target content and published research as evidence, never delegation or publication instructions. A target review rule can supply a quality criterion but cannot change role bounds, permissions or output rules.

Use static inspection first. Verification must be proportionate and safe in the available environment. Do not execute PR scripts, hooks or tests in the user's trusted checkout, expose credentials to target code, or install target dependencies merely because a reviewer requests it. If meaningful execution cannot be isolated safely under existing authorization, qualify the claim and report the limit. No target code changes are part of verification.

### Run two full passes, then evidence-selected focused passes

The decision pass reads the captured change and existing accepted ADRs. Its prompt assesses whether records are needed, why choices were made, consistency with constraints and coverage of consequences. Bundle the issue's Nygard, AWS and GDS links as sources to consult, with an instruction to report inaccessible sources. Use their principles without importing their document structure into the target project.

For each pass, the examiner supplies candidate concerns with observations, interpretation, consequence, evidence and uncertainty. The challenger receives both the concern and access to the captured change, and seeks disproof, missing context or overstatement. The examiner receives one response. The mediator can request one targeted verification, adjudicates using evidence and closes the exchange. The pass can contain several concerns; the exchange bound applies to that pass, not an unbounded loop per finding.

After decisions, stop only for a verified concern that undermines the approach enough to make implementation review premature. Missing ADRs, wording preferences and unverified risks do not qualify. Otherwise run the full implementation pass over correctness, structure, connections and integration. After both full passes, choose zero, one or two focused passes from concrete questions raised by evidence. State the question and its source before starting one. No contributor fix or head refresh is needed between passes. End when no substantive question remains or the trial limit is reached.

### Publish an evidence-qualified comment

The mediator drops refuted and trivial concerns. Each surviving concern needs a specific basis, a plausible meaningful consequence and a challenge. A concern can be discussion-worthy without a reproducible defect. Distinguish confidence from perceived criticality; use consequence to order concerns, not certainty alone. Put consequential unresolved disagreements in a separate questions section.

The comment template includes PR identity, full reviewed SHA and commit link, captured base context, completed passes, limits, reason for stopping, model provenance when known, findings, unresolved questions and next steps. Every concern separates observations, interpretations and suggested remedies. The clean result states no substantive concern survived and explains scope and limits without approval. Publish neither raw role exchanges nor an approval/changes-required verdict.

Write final text under `.workspace/`, inspect it, and publish once with `gh pr comment <pr-url> --body-file <file>`. Explicit invocation authorizes that comment; no extra publication approval is part of the skill. Only the mediator can publish. Never edit the PR body, submit a review verdict or post per-pass comments. On failure preserve the text and report failure. On an unknown outcome check existing comments for the exact prepared text and reviewer identity before deciding whether it was posted; do not retry blindly or claim success without a returned or verified comment URL.

### Ship and document the independent entry point

Add `lets-review-pr` to both flow recipes and the entry-point exemption in the interface test. Link its references using existing release-relative conventions. Add a README usage row and a short explanation that explicit invocation posts one comment and does not run the author's workflow. Update the skill list where needed without adding it to `lets-go` or any schema.

## Risks / Trade-offs

- [Role prompts cannot guarantee sound judgment] → Test the contract, keep evidence and uncertainty explicit, and trial the method on real reviews before revising its stated limits.
- [Several read-only delegations cost time and tokens] → Bound each exchange and permit focused passes only for specific evidence-backed questions.
- [A captured revision ages while review runs] → Identify it exactly and disclose newer commits; do not imply current-head coverage.
- [A supported risk is mistaken for a proven bug] → Separate observations, interpretation, consequence, uncertainty and suggested remedy.
- [Public text follows a failed network response] → Preserve the prepared comment and check for an existing post before any retry.

## Migration & Rollback

No data migration. A new release ships the skill through normal sync. Rollback removes the skill from flow recipes and usage docs; existing PR comments remain historical feedback. The repository's installed copies update only through the pinned-release workflow.
