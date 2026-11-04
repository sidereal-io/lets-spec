# Verification: github-backlog-build

Using change: github-backlog-build, schema lets-standard, repository-local root.
The integration review covers main `7d8cec4` through `19cbf55`. Main's kit is preserved; later source commits are the six listed review fixes and
associated bundle-smoke test correction. Both reviewed commits remain in
history and the reviewed base remains on origin/main. Identity uses ADR-015;
main's executable-boundary decision retains ADR-014.

| Dimension | Result |
|---|---|
| Completeness | 20/20 tasks complete; seven planning artifacts present; 8 added requirements and 1 modified contract requirement mapped. |
| Correctness | All 9 requirements and 26 scenarios checked against implementation and automated coverage, supplemented by live native reconciliation. |
| Coherence | Native actor-level ownership, private continuation journals, executable transport, immutable identity and merge-gated completion follow the revised design and ADR-015. |

| Requirement | Implementation and evidence |
|---|---|
| Resolve one configured backlog without fallback | repository-config.ts, client.ts and github.ts; configuration negatives, both Project link directions, live implicit selection. |
| Enforce executable transport | protocol.ts, transport.ts and gh.ts; process limits, scoped inputs, uncertain writes, complete pagination and cursor rejection. |
| Preserve packet and readiness policy | selection.ts, capabilities.ts, both source flows; ranking and skill tests, live blocked and owned exclusions. Packet and Fold retain their shared glossary meanings. |
| Reconcile native actor ownership | claims.ts, sessions.ts and store.ts; no machine-state fields, partial assignment rejection, deliberate handle continuation, fresh ownership checks, local supersession regression and live lost-response recovery. |
| Release only the current worker's claim | Claims.release and reconciliation; replacement-owner checks, original-key no-effect retry, stale acquire rejection and actual branch-failure release live. |
| Retain immutable identity | identity.ts; selection mismatch, immutable binding, explicit handle and legacy negatives, automated archive identity tests and live bind/resume. |
| Associate PRs and complete after merge | completion.ts, host.ts; native closing-link pagination, missing/wrong PR negatives, unmerged workflow rejection, merge-gated Done and idempotent replay live. |
| Clarify transport effects | The complete modified contract requirement preserves kit scenarios and adds production start-failure and read-deadline cases; transport and entry-process regressions cover classification, Unicode and bounded deadlines. |
| Prove production flow | Built CLI and default adapter; revised live evidence records final tested source, designated fixtures, fresh user-merged PR #14 and exact merge commit, fault injection and cleanup. |

Validation after integration fixes: the same repository checks passed with
bounded concurrency: `node --test --test-concurrency=4 "tests/**/*.test.ts"`
(625 tests), `pnpm check`, and `bats tests` (133 checks).
`nix flake check --max-jobs 1 --cores 2` passed on x86_64-linux, including runtime
distribution and both flows. The moved source conformance suite is included
in Node checks; following main, kit source/tests are excluded from releases.
The first full run exposed an obsolete bundle assertion; its correction passed.
Subsequent unconstrained runs hit process-fixture deadlines. No assertion or
production timeout was relaxed; checks were rerun with lower concurrency. Independent Claude Opus 5.5 review and the verdict
for each finding are recorded in code-review.md.

No critical issues, warnings or skipped verification dimensions remain. The
checks combine code inspection and automated coverage with the listed live
cases; they do not claim every scenario or race was reproduced against GitHub.
GitHub cannot distinguish remote sessions sharing an actor, detect reassignment
between snapshots, or provide a distributed lock. The local generation check
only detects competing sessions represented in the same private local journal.
Acceptance-owned legacy Project text fields were removed after checking scope;
the final live run used fresh issues #8–#13 and test PR #14. Both merged
completion and replay returned Done for merge commit
35fc0721258503871211b572a76e81e8af0ec86d. Fresh fixtures are retained for inspection. No capability
or glossary definition is retired. Archive and readiness are permitted; merge
remains user-owned.

The fresh-fixture revision changes no runtime code. Earlier code review and
625 Node tests, typecheck, 133 Bats checks and serial Nix results still cover
the runtime. Fresh OpenSpec strict validation supplements those checks.
