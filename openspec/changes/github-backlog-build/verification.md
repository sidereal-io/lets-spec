# Verification: github-backlog-build

Using change: github-backlog-build, schema lets-standard, repository-local root.
The reviewed implementation is `787d4c9`, with confirmed review fixes `65312f0`
and `2b73619`. All later source changes are those listed fixes. The reviewed
base remains on origin/main; the reviewed head remains an ancestor.

| Dimension | Result |
|---|---|
| Completeness | 16/16 tasks complete; seven planning artifacts present; 8 added requirements mapped. |
| Correctness | All 8 requirements and 18 scenarios checked against implementation and automated coverage, supplemented by live native reconciliation. |
| Coherence | Native actor-level ownership, private continuation journals, executable transport, immutable identity and merge-gated completion follow the revised design and ADR-014. |

| Requirement | Implementation and evidence |
|---|---|
| Resolve one configured backlog without fallback | config.ts, client.ts and github.ts; configuration negatives, both Project link directions, live implicit selection. |
| Enforce executable transport | protocol.ts, transport.ts and gh.ts; process limits, scoped inputs, uncertain writes, complete pagination and cursor rejection. |
| Preserve packet and readiness policy | selection.ts, capabilities.ts, both source flows; ranking and skill tests, live blocked and owned exclusions. Packet and Fold retain their shared glossary meanings. |
| Reconcile native actor ownership | claims.ts, sessions.ts and store.ts; no machine-state fields, partial assignment rejection, deliberate handle continuation, fresh ownership checks, local supersession regression and live lost-response recovery. |
| Release only the current worker's claim | Claims.release and reconciliation; replacement-owner checks, original-key no-effect retry, stale acquire rejection and actual branch-failure release live. |
| Retain immutable identity | identity.ts; selection mismatch, immutable binding, explicit handle and legacy negatives, automated archive identity tests and live bind/resume. |
| Associate PRs and complete after merge | completion.ts, host.ts; native closing-link pagination, missing/wrong PR negatives, unmerged workflow rejection, merge-gated Done and idempotent replay live. |
| Prove production flow | Built CLI and default adapter; revised live evidence records final tested source, designated fixtures, exact pre-existing user merge, fault injection and cleanup. |

Validation after review fixes: `pnpm test` passed (572 Node tests, typecheck,
133 Bats checks); `nix flake check` passed on x86_64-linux, including packaged
distribution and both flows. Independent Claude Opus 5.5 review and the verdict
for each finding are recorded in code-review.md.

No critical issues, warnings or skipped verification dimensions remain. The
checks combine code inspection and automated coverage with the listed live
cases; they do not claim every scenario or race was reproduced against GitHub.
GitHub cannot distinguish remote sessions sharing an actor, detect reassignment
between snapshots, or provide a distributed lock. The local generation check
only detects competing sessions represented in the same private local journal.
Historical Project text values are ignored and were not deleted. No capability
or glossary definition is retired. Archive and readiness are permitted; merge
remains user-owned.
