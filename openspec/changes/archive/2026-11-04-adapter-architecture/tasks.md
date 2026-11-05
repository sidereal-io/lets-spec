## 1. Earlier implementation (historical; corrected by section 2)

This is a documentation chore. Specs are deliberately skipped: the existing
runtime contract stays in place until #180 migrates it. Verify prose by reading
the complete affected sections against the confirmed ledger; `git diff --check`
is the mechanical check, not proof of architectural completeness. Do not add
tests that merely assert the wording of the ADR.

- [x] 1.1 [medium] Record ADR-015 in `docs/decisions/ADR-015-built-in-adapters-with-configurable-provider-definitions.md`, explaining why built-in code owns execution, validation, deadlines and recovery across delegation and backlogs, why supported mappings/options belong in provider definitions, and why executable adapters, loaded plugins and the agent-executed recipe hybrid lost; include benefits and costs (✓ `git diff --check` passed; section checked against the confirmed ledger).
- [x] 1.2 [medium] Complete ADR-015's configuration and discovery rules: preserve lets as the configuration reader, machine-level delegation settings and repository-level backlog selection/mappings, keep credentials outside committed configuration, distinguish configured selection from backend capability discovery, and specify supported-definition validation/versioning and actionable compatibility errors without silent executable or provider fallback (✓ `git diff --check` passed; configuration rules checked against ADR-005, ADR-010 and ADR-011).
- [x] 1.3 [medium] Complete ADR-015's execution and packaging rules: adapters ship with lets while backend tools can remain separate dependencies; code owns bounded execution and error/effect classification, uncertain mutations require reconciliation before retry or progression, and native ownership/status, exact merge evidence and private local recovery journals remain unchanged; retain all four providers' automated and live release obligations (✓ `git diff --check` passed; state, recovery and release guarantees checked against the ledger and backlog contract).
- [x] 1.4 [medium] Add ADR-015's migration inventory for #180, mapping executable-specific requirements in `openspec/specs/backlog-adapter-contract/spec.md` and `docs/backlog-adapter-contract.md` to their built-in replacements, including transport/process limits, executable resolution, protocol compatibility, offline conformance and release packaging; explicitly retain behavioral guarantees and mark the current runtime/specs as awaiting migration without editing PR #172 or repeating its acceptance (✓ `git diff --check` passed; inventory checked against all 13 backlog contract requirements and the contract document).
- [x] 1.5 [easy] Mark ADR-014 superseded by ADR-015 and add concise reconciliation notices to ADR-010, ADR-005 and ADR-011 that identify retained built-in execution, explicit resolver ordering/no adapter lookup, and configuration ownership rules; distinguish the repository backlog configuration from ADR-011's machine settings so readers can find the current decision without losing historical rationale (✓ `git diff --check` passed; all four notices checked against ADR-015 and prior decision text).

## Finishing evidence

Run `pnpm test` and `nix flake check` with the pinned tools before pushing.
Follow lets-build's required code review, verification and separate archive
commit before marking the PR ready. Keep #179 In Progress until confirmed
merge; leave the merge to the user. The recovered glossary checkpoint remains historical provenance; the explicitly
approved Adapter revision is a separate glossary-only commit.

## 2. Correct the execution architecture

The clarified ledger supersedes the earlier execution decision. These are
prose checks for a documentation chore; no wording-mirroring tests or runtime
changes are required. Existing runtime specs remain unchanged until migration.

- [x] 2.1 [medium] Correct ADR-015's decision, history, openness and alternatives for project-wide agent execution without duplicate provider implementations (✓ git diff --check passed; decision checked against C1/C2/C4).
- [x] 2.2 [medium] Specify bounded action requests, structured submission validation, evidence provenance and independent verification limits, unknown outcomes and reconciliation before retry/progression (✓ git diff --check passed; evidence and recovery checked against C3/C6).
- [x] 2.3 [medium] Reconcile definition discovery/versioning and configuration ownership, including machine-specific backlog tools without overriding repository selection; distinguish target definitions from currently implemented delegation settings (✓ git diff --check passed; ownership/versioning checked against prior records and C2).
- [x] 2.4 [medium] Correct migration, packaging and conformance inventory for #180 and delegation follow-up; retain behavioral guarantees and four-provider release obligations without claiming runtime completion (✓ git diff --check passed; inventory checked against the contract and C5/C6).
- [x] 2.5 [medium] Reconcile ADR-005/010/011/014 notices with the corrected decision, preserve historical bodies and document the deliberate glossary revision and earlier review limits (✓ git diff --check passed; notices checked against ADR-015 and retained historical bodies).
