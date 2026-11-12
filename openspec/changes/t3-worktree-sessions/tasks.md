## 1. Fixtures

- [x] 1.1 [easy] The git fixtures that answer `launchThread` (`launchingIo` and the inline `results` in `tests/lets/resolvers/t3/t3.test.ts`, `runningT3` and its callers in `tests/lets/resolvers/t3/delegate.test.ts`) answer each git call by its arguments, not by its place in the queue, and answer `git rev-parse --show-toplevel` with the main checkout. Every existing test still passes on the unchanged resolver (verify: node --test tests/lets/resolvers/t3/t3.test.ts tests/lets/resolvers/t3/delegate.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts tests/lets/resolvers/t3/delegate.test.ts passed, 108 tests)

## 2. Where the thread runs [depends-on: 1]

- [x] 2.1 [easy] `buildLaunch` given a `worktreePath` sends `{ type: 'existing_worktree', worktreePath, branch }`, leaves `branch` out when it is null, and sends `{ type: 'root', branch? }` as today when `worktreePath` is null (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 82 tests)
- [x] 2.2 [medium] A review (`run`) from a linked worktree on branch `fix-login` launches its thread with `existing_worktree`, the worktree's top level and branch `fix-login`, in the T3 project for the main checkout (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 83 tests)
- [x] 2.3 [easy] A handoff (`start`) from a linked worktree launches its thread with `existing_worktree`, the worktree's top level and its branch (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 84 tests)
- [x] 2.4 [easy] A review from the main checkout launches its thread with `{ type: 'root', branch: 'main' }`, and the resolver's git calls are the common dir, the top level and the branch, in that order (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 86 tests)
- [x] 2.5 [easy] A review from a subdirectory of a linked worktree sends the worktree's top level as `worktreePath`, not the subdirectory (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 87 tests)
- [x] 2.6 [easy] A review from a linked worktree with a detached HEAD sends `existing_worktree` with no `branch` (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed, 88 tests)
- [x] 2.7 [easy] `lets delegate review run` from a linked worktree of a repository T3 has no project for exits 3, creates no thread, and names the main checkout on stderr (verify: node --test tests/lets/resolvers/t3/delegate.test.ts) (✓ node --test tests/lets/resolvers/t3/delegate.test.ts passed, 28 tests)

## 3. Docs [depends-on: 2]

- [x] 3.1 [easy] `docs/resolvers.md` says, in its `t3` section, that a session started from a linked worktree runs in that worktree on its branch, and its *After a t3 update* smoke test runs a handoff from a linked worktree and checks that the new thread shows that worktree (verify: grep -n "linked worktree" docs/resolvers.md) (✓ grep -n "linked worktree" docs/resolvers.md found lines 41 and 125)

## 4. Integration [depends-on: 3]

- [ ] 4.1 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger
