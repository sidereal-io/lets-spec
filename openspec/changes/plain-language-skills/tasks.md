## 1. Shared guidance

- [x] 1.1 [medium] Give every shipped skill and schema writing step a working reference to the same reader-focused plain-language method (verify: pnpm exec bats tests/skill-interfaces.bats) (✓ 268 checks passed; the wrapping check passed after its fix)

## 2. Instructions and outputs [depends-on: 1]

- [x] 2.1 [medium] Make skill selection, shaping and planning instructions clear about their inputs, decisions and outputs (verify: pnpm exec bats tests/skill-interfaces.bats) (✓ 42 relevant interface checks passed; git diff --check passed)
- [x] 2.2 [medium] Make writing and test-first guidance usable without the earlier conversation while preserving required formats (verify: pnpm exec bats tests/skill-interfaces.bats) (✓ 13 relevant interface and release checks passed; git diff --check passed)
- [x] 2.3 [medium] Give delegated reviewers reader-task criteria and make the review procedures and reports easy to follow (verify: pnpm exec bats tests/skill-interfaces.bats) (✓ installed reference check and 6 focused format checks passed; full repository checks follow)

## 3. Verification [depends-on: 2]

- [ ] 3.1 [medium] Exercise skill selection, glossary handoff and plain-language judgment in a fresh agent context and record actual results and human-testing limits (verify: git diff --check)
- [ ] 3.2 [medium] Verify both release flows and the repository checks, then record the complete sweep and remaining limits (verify: pnpm test)

## Deviations Ledger

None.
