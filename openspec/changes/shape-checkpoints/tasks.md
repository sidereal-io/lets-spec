## 1. Shaping recovery

- [ ] 1.1 [easy] Persist the pending Finalize phase in skill and template (verify: bats tests/skill-interfaces.bats --filter 'shape-checkpoints: finalize')
- [ ] 1.2 [easy] Preserve code-based status when dropping stale links (verify: bats tests/skill-interfaces.bats --filter 'shape-checkpoints: stale')
- [ ] 1.3 [easy] Put single-issue sizing before glossary writes with explicit oversized recovery (verify: bats tests/skill-interfaces.bats --filter 'shape-checkpoints: size')
- [ ] 1.4 [easy] Identify the blocker owner issue locally (verify: bats tests/skill-interfaces.bats --filter 'shape-checkpoints: owner')

## Deviations Ledger

- 2026-11-11: The user requires all checks before any push and an independent orchestrator review after handoff. Defer draft publication and independent review accordingly; leave this change unarchived for that review.
