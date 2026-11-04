# Verification: github-backlog-build

Using change: github-backlog-build, schema lets-standard, repository-local root.

| Dimension | Result |
|---|---|
| Completeness | 12/12 tasks complete; all seven planning artifacts done; 8 added requirements mapped. |
| Correctness | All 8 requirements and 18 scenarios reviewed against implementation, process tests and live evidence. |
| Coherence | Executable boundary, private recovery state, versioned identity, best-effort provenance and merge-gated completion follow the design and ADR-014. |

## Requirement mapping

| Requirement | Implementation | Evidence |
|---|---|---|
| Resolve one configured backlog without fallback | config.ts, client.ts, github.ts Project discovery and mapping checks | Configuration negatives, linked discovery tests and live default Project resolution. The zero/multiple Project guard in Client.resolve was inspected; the live fixture intentionally has one Project. |
| Enforce executable transport | transport.ts, protocol.ts, gh.ts | No-shell process tests, output/runtime bounds, validated failures, scoped identity rejection and cursor-loop rejection. |
| Preserve packet and readiness policy | selection.ts, capabilities.ts, source build skill, both schemas | Numeric ranking, owned/blocked rejection, named Epic routing, active-provenance exclusion, skill interfaces and live negative cases. |
| Verify session ownership | claims.ts, sessions.ts, store.ts | Same-account conflict, partial assignment rejection, fresh replay checks, distinct private handle, raw CLI guards and interrupted-response recovery. |
| Release only this worker's claim | Claims.release and reconciliation | Replaced-owner preservation, partial-provenance release, stale acquire rejection and actual live branch-failure release. |
| Retain immutable identity | identity.ts and private session association | Selection mismatch, missing legacy identity, explicit-handle rejection, archive continuation and live archived identity. |
| Associate exact PR and complete after merge | completion.ts, host.ts and post-merge source routing | Wrong PR rejection, exact closing lines, unmerged refusal, lost completion reconciliation, actual user-owned merge and idempotent Done. |
| Prove production flow | packaged CLI, Nix distribution and live-acceptance.md | Real fixture selection/claim/bind/resume/release/reference, fault injection, merge commit fef1ac4c162fb0edb840b6489f0b5aae480b7227, completion and cleanup. |

## Validation and review

- `pnpm test`: 567 Node tests, type checking and 133 Bats checks passed.
- `nix flake check`: passed on x86_64-linux, including both flows, both
  executables, standalone validator closure and complete isolated conformance.
  The first post-review process-fixture run hit deadlines; its rerun passed.
- `openspec validate github-backlog-build --strict`: passed.
- Independent fresh-context Claude Opus 5.5 review covered main
  a0aef6b64081bca8f250d031a6dc81ea8d5ba850..397647efb5511c3fa653e3989675bf7d7e1f9e2e.
  See code-review.md for every finding, fix and evidence-based partial rebuttal.
  The reviewed head remains an ancestor; the current main base contains the
  reviewed base. All later source commits are the six listed review fixes.
- The shared glossary's Packet and Fold meanings are unchanged. No capability
  is retired and no glossary cleanup is needed.

No critical issues, warnings or skipped verification dimensions remain.
Verification combines code inspection, automated behavior checks and the
recorded live cases; it does not claim that every API permutation was run live.
The new main spec can be synced and the change archived. Merge remains user-owned.
