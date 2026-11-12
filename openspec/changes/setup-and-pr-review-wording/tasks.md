## 1. Setup guards and reusable review instructions

- [x] 1.1 [easy] Explain the Project number before dependent commands (✓ bats tests/skill-interfaces.bats --filter 'SLR-05 number' passed)
- [x] 1.2 [easy] State the first-error stop before creation commands (✓ bats tests/skill-interfaces.bats --filter 'SLR-05 error' passed)
- [ ] 1.3 [easy] Route missing Status options only to settings-page repair (verify: bats tests/skill-interfaces.bats --filter 'SLR-05 Status')
- [ ] 1.4 [easy] Remove the completed trial's pending directive (verify: bats tests/skill-interfaces.bats --filter 'SLR-15')
- [ ] 1.5 [easy] Introduce bounded exchanges before the full passes (verify: bats tests/skill-interfaces.bats --filter 'SLR-16')
