## 1. Setup guards and reusable review instructions

- [x] 1.1 [easy] Explain the Project number before dependent commands (✓ bats tests/skill-interfaces.bats --filter 'SLR-05 number' passed)
- [x] 1.2 [easy] State the first-error stop before creation commands (✓ bats tests/skill-interfaces.bats --filter 'SLR-05 error' passed)
- [x] 1.3 [easy] Route missing Status options only to settings-page repair (✓ bats tests/skill-interfaces.bats --filter 'SLR-05 Status' passed)
- [x] 1.4 [easy] Remove the completed trial's pending directive (✓ bats tests/skill-interfaces.bats --filter 'SLR-15' passed)
- [ ] 1.5 [easy] Introduce bounded exchanges before the full passes (verify: bats tests/skill-interfaces.bats --filter 'SLR-16')
