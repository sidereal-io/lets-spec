## 1. The complete primitive and command

All tests go in `tests/lets/backlog/complete.test.ts` and drive `run()` with the fake `gh` (`fixtures/fake-gh.ts`) or the fake provider (`fixtures/fake-provider.ts`). Run heavy commands through `deli --`.

- [x] 1.1 [medium] `lets backlog complete 258` on an open GitHub issue reads its state, closes it with `gh issue close 258 --reason completed`, and prints `{ "result": "completed" }` with exit 0. This adds `complete(key)` to `Adapter`, GitHub's implementation, `complete` in `policy.ts` and the command in `commands.ts`, and gives the fake provider a `complete` so it still type-checks (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.2 [easy] `complete` on a closed GitHub issue prints `completed`, runs no `gh issue close`, and exits 0 (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.3 [easy] `complete` writes no Project field: no `gh project item-edit` runs, even for an assigned open Epic, which closes like any other item (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.4 [easy] `complete 99999` on a missing issue prints `"error": "not-found"` with exit 1, and `complete PROJ-12` with the GitHub provider prints `not-found`, runs no `gh` command, and exits 1 (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.5 [easy] A state read that times out prints `"error": "backend-failed"` with exit 1, and runs no `gh issue close` (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.6 [easy] A close that fails prints `{ "result": "failed", "message": <gh's error> }` with exit 0. A close that times out prints `"message": "timed out; the write may have happened"`, runs `gh issue close` once, and exits 0 (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.7 [easy] With a non-GitHub backlog provider, `complete PROJ-12` passes the key `PROJ-12` to that provider's adapter and prints `completed` (verify: deli -- node --test tests/lets/backlog/complete.test.ts) (✓ deli -- node --test tests/lets/backlog/complete.test.ts passed)
- [x] 1.8 [easy] `lets backlog --help` lists `complete <i>` and its results, and the program description says it reads, claims and completes work (verify: deli -- node --test tests/lets/backlog/cli.test.ts) (✓ deli -- node --test tests/lets/backlog/cli.test.ts passed)

## 2. Integration [depends-on: 1]

- [ ] 2.1 [easy] The whole suite, the type check and the OpenSpec validation pass (verify: deli -- pnpm test && mise run check)

## Deviations Ledger
- 1.8: `lets --help` describes the backlog command in `lets/src/main.ts` too. Its line now also says it completes work and names `complete`, so it matches `lets backlog --help`.
