## 1. Session claims

- [x] 1.1 [complex] Select one winner when two logins claim together (✓ node --test tests/lets/backlog/race.test.ts passed).
- [x] 1.2 [medium] Preserve the shared assignment when sessions use one login (✓ node --test tests/lets/backlog/race.test.ts passed).
- [x] 1.3 [medium] Release only the claim identified by the caller (✓ pnpm test:backlog passed, 51 tests).
- [x] 1.4 [medium] Report failed claim writes without granting ownership (✓ pnpm test:backlog passed, 56 tests).
- [x] 1.5 [medium] Explain claim arbitration and pass its token through recovery (✓ bats tests/skill-interfaces.bats --filter claim-race: passed).
- [x] 1.6 [easy] Exempt valid claim metadata from packet discussion (✓ bats tests/skill-interfaces.bats --filter claim-race: passed).
