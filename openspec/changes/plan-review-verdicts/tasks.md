## 1. Plan-review instructions

- [x] 1.1 [easy] Route new reviews through author identification before ranking (✓ bats tests/skill-interfaces.bats --filter 'plan review routes' passed)
- [x] 1.2 [easy] Select effort before either review execution path (✓ bats tests/skill-interfaces.bats --filter 'plan review effort' passed)
- [x] 1.3 [easy] Supply ranked finding labels outside OpenSpec-only checks (✓ bats tests/skill-interfaces.bats --filter 'plan review finding format' passed)
- [x] 1.4 [easy] Give unresolved Moderate findings a REVISE disposition (✓ bats tests/skill-interfaces.bats --filter 'plan review verdict' passed)
- [ ] 1.5 [easy] Keep unresolved rebuttals consistent with listed fixes (verify: bats tests/skill-interfaces.bats --filter 'plan review rebuttals')
