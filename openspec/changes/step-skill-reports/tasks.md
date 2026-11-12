## 1. Step skill instruction corrections

- [x] 1.1 [easy] Check missing planning prerequisites before proposing; preserve saved schema on continuation (✓ bats tests/skill-interfaces.bats --filter 'step reports: planning' passed, 2 tests; both failed before the correction).
- [x] 1.2 [easy] Stop on unusable build state output with the actual evidence (✓ bats tests/skill-interfaces.bats --filter 'step reports: build query' passed after its expected red failure).
- [x] 1.3 [easy] Report only archiving from an archive folder while preserving table precedence (✓ bats tests/skill-interfaces.bats --filter 'step reports: archive' passed after its expected red failure).
- [x] 1.4 [easy] Explain literal shell arguments for idea searches without changing the title search (✓ bats tests/skill-interfaces.bats --filter 'step reports: idea' passed after its expected red failure; both examples preserved exact arguments).
- [ ] 1.5 [easy] Scope the prior-claim rule to change outputs and link shaping exceptions (verify: bats tests/skill-interfaces.bats --filter 'step reports: claim').

- [ ] 1.6 [easy] Record author walkthroughs for planning schema cases, unusable state output, literal ideas and shaping-before-claim in verification.md (verify: inspect verification.md against #228 acceptance criteria).
- [ ] 1.7 [easy] Pass pnpm test, nix flake check and mise run check before pushing (verify: all three commands exit zero).

## Deviations Ledger

None.
