## 1. Review model choice

- [x] 1.1 [easy] Stop for user choice when guidance excludes all models or no permitted fallback can run; preserve guidance on empty-discovery and exit-3 fallback, returning `needs-input` in a `lets-go` step (✓ bats tests/skill-interfaces.bats --filter 'review model choice: policy anchors|subagent step when there are no options' passed; author walkthrough confirmed)
- [x] 1.2 [easy] Rank build reviewers against every author family, using this session's family for CLI compatibility (✓ bats tests/skill-interfaces.bats --filter 'each review skill ranks' passed; author walkthrough confirmed)
- [x] 1.3 [easy] Report author-family overlap separately from CLI independence (✓ bats tests/skill-interfaces.bats --filter 'review model choice: policy anchors' passed; author walkthrough confirmed)
- [x] 1.4 [easy] Describe the evidenced plan subagent family consistently (✓ bats tests/skill-interfaces.bats --filter 'review model choice: policy anchors' passed; author walkthrough confirmed)
- [x] 1.5 [easy] Name REVIEW.md as the absent source (✓ bats tests/skill-interfaces.bats --filter 'review model choice: policy anchors' passed; author walkthrough confirmed)

## Deviations Ledger

- 2026-11-11: The user authorized implementation and a draft PR with review left to the orchestrator. The real plan review is recorded in review.md before archive. Push waits for all three required checks.
- 2026-11-11: The review requested compact policy anchors. Author walkthroughs verify exclusions, permitted fallback, `needs-input` routing, mixed-author ranking and overlap; automated anchors do not prove comprehension.
