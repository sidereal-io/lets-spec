## 1. The command and the adapter boundary

- [x] 1.1 [easy] Remove #135's executable kit: `lets/src/backlog/*`, `tests/lets/backlog/*`, `docs/backlog-adapter-contract.md`, the flake's dist check for that doc, and the README's mentions of the executable contract; the type check still passes (verify: `test ! -e docs/backlog-adapter-contract.md && deli -- pnpm exec tsc --noEmit`) (✓ `test ! -e docs/backlog-adapter-contract.md && deli -- pnpm exec tsc --noEmit` passed)
- [x] 1.2 [medium] `lets backlog <command>` prints one JSON object and exits 0 on a result, exits 1 with `no-backlog`, `several-backlogs` (titles and URLs) or `gh-failed` from today's Project query, and exits 2 on a usage error; tests use a fake `Io` whose `execFile` answers `gh` calls from a table (verify: `node --test tests/lets/backlog/commands.test.ts`) (✓ `node --test tests/lets/backlog/commands.test.ts` passed, 9 tests)

## 2. The backlog commands [depends-on: 1]

- [x] 2.1 [medium] `ready` lists the open Todo, non-Epic, Must/Should/Could, unassigned and unblocked issues of this repository, ranked Must, Should, Could, then lowest number, honours `--only` and `--exclude`, and passes today's 500-item limits to `gh` (verify: `node --test tests/lets/backlog/ready.test.ts`) (✓ `node --test tests/lets/backlog/ready.test.ts` passed, 9 tests; 3 fail with the number order reversed)
- [x] 2.2 [medium] `item <i>` returns title, body, URL, state, Project fields (null when unset or off the Project), assignees, blockers with state, parent with body, and open sub-issues, and returns `not-found` for a missing issue (verify: `node --test tests/lets/backlog/item.test.ts`) (✓ `node --test tests/lets/backlog/item.test.ts` passed, 8 tests; 1 fails when closed sub-issues are kept)
- [x] 2.3 [easy] `find <words>` returns the open issues whose titles match, unfiltered, and an empty list for no match (verify: `node --test tests/lets/backlog/find.test.ts`) (✓ `node --test tests/lets/backlog/find.test.ts` passed, 3 tests; the words test failed first, on a word that starts with --)
- [x] 2.4 [medium] `claim <i>` returns `taken` with the logins and writes nothing when anyone is assigned, otherwise assigns `@me` then sets Status In Progress and returns `claimed`, and returns `failed` with `write` and `gh`'s error, with no undo, when either write fails or times out (verify: `node --test tests/lets/backlog/claim.test.ts`) (✓ `node --test tests/lets/backlog/claim.test.ts` passed, 7 tests; the taken test fails with the assignee check removed)
- [x] 2.5 [easy] `release <i>` removes only `@me` and sets Status Todo, returning `released`, or `failed` with `write` set to `unassign` or `status` (verify: `node --test tests/lets/backlog/release.test.ts`) (✓ `node --test tests/lets/backlog/release.test.ts` passed, 4 tests; 1 fails when release writes In Progress)

## 3. The skills call lets backlog [depends-on: 2]

- [x] 3.1 [complex] `lets-go` reads the backlog only through `lets backlog ready`, `item` and `find`: no Project query in *Read the settings*, no `<project>`, `<owner>` or `<repo>`, the parent and an epic's sub-issues taken from `item`, and a *Backlog errors* section that every call links to; the `lets-go` spec's bats checks are updated to match (verify: `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'` passed, 89 tests; the whole file passed, 270 tests)
- [x] 3.2 [medium] `lets-go`'s *Claim* claims with `lets backlog claim <i>` and releases with `lets backlog release <i>`, returns `claim-failed` with the write and message, and `branch-failed` with both errors when the release fails too; *Enter the branch* says what to do with each (verify: `deli -- bats tests/skill-interfaces.bats --filter 'Claim'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'Claim'` passed; the whole file passed, 271 tests)
- [x] 3.3 [easy] `lets-plan` finds the change's issue with `lets backlog find <branch>`, keeping its `<branch> — ` title-prefix rule (verify: `deli -- bats tests/skill-interfaces.bats --filter 'lets-plan'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'lets-plan'` passed after failing on the old search; the whole file passed, 271 tests)

## 4. Acceptance [depends-on: 3]

- [x] 4.1 [medium] Every project check passes: the Node tests, the type check, the bats tests, the flake and OpenSpec validation (verify: `deli -- pnpm test && deli -- nix flake check && mise run check`) (✓ `deli -- pnpm test` passed: 574 Node tests, the type check and 370 bats tests; `deli -- nix flake check` exited 0; `mise run check` passed 15 of 15)
- [ ] 4.2 [medium] Live run in a clone of `mstelz/test-repo-pls-ignore` with this branch's `lets`: `ready`, `item`, `find`, `claim` (`claimed`, then `taken` from a second account or a pre-assigned issue) and `release` behave as specified against its real Project, and one `lets-go` run claims a story and creates its branch; the results are recorded in the pull request (verify: `lets backlog item <claimed-issue>` in the clone shows `"status": "In Progress"` and the user in `assignees`)

## Deviations Ledger

- 1.1: ADR-014 still links to `docs/backlog-adapter-contract.md`. It is superseded and kept as written, so the link now points at a removed file; the file stays in Git history.
- 1.1: the README's `lets/src/backlog/` row is removed here and comes back with the new code in 1.2.
- 2.1–2.5: the adapter and the shared rules were written whole in 1.2, as one object. Each command's tests in section 2 came after that code, so each was checked to fail against a deliberately broken rule before it was ticked.
- 3.1: *Claim* still ran `gh project item-edit` with `<project>` and `<owner>` until 3.2, so those two rows stay in the Placeholders table, marked as Claim's, until 3.2 removes them with the calls.
- 3.2: the `<issue-url>` row stays, because the step prompt still names the issue URL; it is now set from the `url` that `lets backlog item <i>` prints.
