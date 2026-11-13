## 1. Plan-review instructions

- [ ] 1.1 [easy] Route new reviews through author identification before ranking (verify: bats tests/skill-interfaces.bats --filter 'plan review routes')
- [ ] 1.2 [easy] Select effort before either review execution path (verify: bats tests/skill-interfaces.bats --filter 'plan review effort')
- [ ] 1.3 [easy] Supply ranked finding labels outside OpenSpec-only checks (verify: bats tests/skill-interfaces.bats --filter 'plan review finding format')
- [ ] 1.4 [easy] Give unresolved Moderate findings a REVISE disposition (verify: bats tests/skill-interfaces.bats --filter 'plan review verdict')
- [ ] 1.5 [easy] Keep unresolved rebuttals consistent with listed fixes (verify: bats tests/skill-interfaces.bats --filter 'plan review rebuttals')
