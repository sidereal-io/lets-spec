## 1. Archive review coverage

- [x] 1.1 [easy] Exempt a matching archive from rule 3 in `skills/lets-review-build/SKILL.md`, with a token-based regression check in `tests/skill-interfaces.bats` (✓ mise exec -- bats tests/skill-interfaces.bats --filter 'archive preserves code review' passed after failing on the missing exemption)
