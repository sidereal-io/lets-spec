## 1. Task planning instructions

Five implementation tasks share two interface tests.

- [x] 1.1 [easy] Stop an oversized task list before writing or committing tasks.md, reporting its count and proposed slice while the user owns the split (verify: bats tests/skill-interfaces.bats --filter 'task-limits: size guidance') (✓ pnpm test passed, including both shared interface tests)
- [x] 1.2 [easy] Resume task planning on the smaller story after the user decides the split in the brainstorm (verify: bats tests/skill-interfaces.bats --filter 'task-limits: size guidance') (✓ pnpm test passed, including both shared interface tests)
- [x] 1.3 [easy] Compare every other task in the same section for parallel file sharing (verify: bats tests/skill-interfaces.bats --filter 'task-limits: concurrency guidance') (✓ pnpm test passed, including both shared interface tests)
- [x] 1.4 [easy] Include other sections with no direct or transitive dependency chain in either direction (verify: bats tests/skill-interfaces.bats --filter 'task-limits: concurrency guidance') (✓ pnpm test passed, including both shared interface tests)
- [x] 1.5 [easy] Reject parallel tags for the first and third tasks sharing a file while preserving minimal-flow restrictions (verify: bats tests/skill-interfaces.bats --filter 'task-limits: concurrency guidance') (✓ pnpm test passed, including both shared interface tests)

## Deviations Ledger

- Pushes and PR creation wait until all three repository checks pass, as the user requires.
- No new brainstorm policy questions: the user explicitly requested the already decided SLR-19/20 policies from #226.
