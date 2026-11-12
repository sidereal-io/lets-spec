## 1. Review model choice

- [x] 1.1 [easy] Both review skills stop for user choice when guidance excludes all listed models (✓ bats tests/skill-interfaces.bats --filter 'review model choice: exclusions' passed)
- [ ] 1.2 [easy] Build review ranks against every author family with a session-family CLI compatibility value (verify: bats tests/skill-interfaces.bats --filter 'review model choice: ranking')
- [ ] 1.3 [easy] Build review reports whole-author overlap separately from CLI independence (verify: bats tests/skill-interfaces.bats --filter 'review model choice: overlap')
- [ ] 1.4 [easy] Plan review describes the evidenced subagent family without contradictory context labels (verify: bats tests/skill-interfaces.bats --filter 'review model choice: subagent provenance')
- [ ] 1.5 [easy] Build review names REVIEW.md specifically as the absent source (verify: bats tests/skill-interfaces.bats --filter 'review model choice: missing REVIEW.md')

## Deviations Ledger

- 2026-11-11: The user explicitly authorized implementation and a draft PR with review left to the orchestrator. Review is recorded as deferred rather than claiming a verdict. Push and PR creation wait until all three required checks pass, as the user requested.
