# Verification: adapter-architecture correction

## Current result

- Completeness: 10/10 tracked tasks complete, including 5 historical tasks and all 5 correction tasks. The historical implementation is superseded by the current ledger, not represented as the execution hybrid.
- Correctness: spec coverage, requirement mapping and scenario coverage are not applicable because this documentation chore intentionally retains `skip_specs: true` and changes no runtime behavior or main specs.
- Coherence: the current ledger C1–C9, glossary, ADR-015 and ADR-005/010/011/014 notices agree on agent tool execution with core policy/sequencing/recovery/validation, open definitions, trusted capture and the ask-user fallback. Documentation title/metadata, notices, links and provenance were checked. Design adherence is not applicable: lets-minimal defines no design artifact.

The current record is `docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md`.
It distinguishes the earlier built-in execution decision from the clarified
execution hybrid. The recovered glossary checkpoint ae72942bb6546d3694a339196ad3083cee6b3a05
and import 1b791a0597d538a1ea15f0f76d2e73e5bbd79e01 remain provenance. The only
current difference from that checkpoint is the explicitly approved Adapter
revision in glossary-only commit d695d02fa3fa135d3b3c322eed2cf7f7868eb3de,
parent eeb74e9b6d6bd6c873c87154bcf85f48ce5622f9. Resolver, Backend and
Extension remain unchanged. The separate discovery commit was not imported.
#179 / PR #181 remains the sole glossary owner.

## Required correction review

Claude Opus 5.5 independently reviewed main at
7d8cec46eac454573418b114e994ad085c07e968 through
e982c77cf535237c599da3b738906fe23b65d8a5 in fresh context, read-only.
The working tree remained clean; no REVIEW.md exists. Three findings were confirmed:

1. High — unnamed independent evidence channel: b56bcd8 specifies trusted capture, the trust boundary, semantic limits and pause-and-ask-user fallback. The user selected this channel and fallback. The runtime must prove it; today's tools are not claimed compliant.
2. Medium — missing delegation prerequisite for #145: 9f91155 and the updated packet state it is unresolved until the separately shaped delegation runtime exists. A direct blocker must be requested when that follow-up is shaped; #180 does not implement delegation.
3. Low — misleading ADR filename: 51d252b renames ADR-015 and updates all four notices.

Each fix diff was checked against its finding. Later ledger/verification edits
record the agreed choices and evidence; no runtime changes were added.
Earlier reviews approved only the earlier architecture and remain historical.

## Scope and verification evidence

The migration inventory retains all 13 backlog-contract requirements' behavioral
guarantees, while identifying transport-specific replacements. Native state,
private local journals, best-effort limits and exact merge evidence remain.
The four-provider release obligations remain. #180 retains GitHub runtime work;
delegation migration is an unresolved follow-up under #174. Shaping reconciled
#174/#179/#180 and architecture clauses in #137–#145 without changing their
provider outcomes or dependency links. No acceptance mutation ran; PR #172 and
its completed acceptance remain untouched.

`openspec validate adapter-architecture --strict` and `git diff --check` pass.
Final `pnpm test` passed after the review fixes (543 Node tests, type check,
130 Bats checks). Final `nix flake check` passed for x86_64-linux, including
14 flake checks and the flow/release builds.

Documentation verification found no remaining critical issues, warnings or
suggestions. All applicable documentation checks and required repository checks passed. Ready
for archive. Runtime
implementation, trusted-channel availability and live conformance are not verified
by this documentation chore and remain migration acceptance obligations.

---

The following report is retained only as historical evidence for the earlier
built-in execution choice at a912eec. Its exact-match glossary statement and
readiness assessment applied then; they are superseded by the current report.

# Historical verification of the superseded built-in decision

| Dimension | Result |
|---|---|
| Completeness | All 5 tasks complete, with checked sections and mechanical evidence recorded on each task. |
| Correctness | Spec coverage, requirement mapping and scenario coverage are not applicable: this documentation chore intentionally declares `skip_specs: true`. |
| Coherence | ADR metadata, title placement, decision structure and reconciliation notices follow the existing records. Design adherence is not applicable: lets-minimal has no design artifact. |

The confirmed brainstorm and completed tasks were read against ADR-015 and the
four amended records. The decision covers built-in execution, configurable data,
ownership and discovery, explicit definition versioning, compatibility/errors,
bounded execution, recovery, backend dependencies, release evidence and the
migration inventory. It explicitly supersedes ADR-014 and reconciles ADR-005,
ADR-010 and ADR-011.

The independent code review covered main at
`7d8cec46eac454573418b114e994ad085c07e968` through
`ff5deeec58b23f8ff23e0c40f9c96a9fd57fa2fa`. Claude Opus 5.5 ran in fresh
context through the t3 resolver; metadata reports `independent: true` and a clean
working tree. No REVIEW.md exists. All four findings were confirmed and fixed:

| Finding | Resolution |
|---|---|
| Deadline compliance could be mistaken for existing delegation behavior | `6aae024` distinguishes target guarantees and records T3 request/token/Git deadline gaps separately from the GitHub migration. |
| Repository definitions lacked an explicit version rule | `ece0411` specifies `lets.backlog.version`, initial version 1, and rejection/migration rules for missing or unsupported versions. |
| Configuration validation boundaries and misplaced selections were ambiguous | `461bd67` defines provider-definition objects and rejects misplaced known selection keys while preserving unrelated delegation keys. |
| Reconciliation notices preceded record titles | `18bb148` moves them below titles, matching existing records. |

Each fix diff was checked against its finding; these commits contain only the
named corrections. No runtime behavior or main spec changed. No acceptance
mutation ran. PR #172 remains outside this change. Native state, exact merge
evidence, private local recovery and all four providers' release obligations
remain intact. Existing delegation deadline gaps are documented implementation
work, not a claim of runtime completion by this architecture chore.

`openspec validate adapter-architecture --strict` and `git diff --check` pass.
`openspec/glossary.md` has no difference from the recovered glossary checkpoint
`ae72942bb6546d3694a339196ad3083cee6b3a05`; the discovery-map commit was not imported.

No critical issues, warnings or suggestions remain for this documentation
change. All applicable verification checks passed. Ready for archive once the
required pre-push repository checks finish; runtime conformance is not claimed.
