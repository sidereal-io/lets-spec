## 1. Run a step in a T3 thread

- [x] 1.1 [medium] Inside T3 Code, `lets delegate step run --for build --model gpt/gpt-6-luna --effort high` from a linked worktree asks T3 for one new thread in that worktree, on its branch, in default mode, running `gpt-6-luna` with effort `high`. It prints the `done` report from the thread's final message, and its record has `"resolver":"t3"` and a `handle` of kind `thread`. A bare `gemini` step runs the catalogue's default with no effort option. `t3` gets `step` through one helper that `run` also uses. The test *a step inside T3 Code opens no thread* becomes this one (verify: node --test tests/lets/resolvers/t3/delegate.test.ts) (✓ node --test tests/lets/resolvers/t3/ passed, 131 tests)
- [x] 1.2 [easy] A step thread whose report is `done` is archived, and one whose report is `needs-input` is not (verify: node --test tests/lets/resolvers/t3/delegate.test.ts) (✓ node --test tests/lets/resolvers/t3/delegate.test.ts passed, 34 tests)
- [ ] 1.3 [easy] A step whose first thread T3 fails before any assistant message archives that thread and runs the next `--model`. When every model is refused, the command exits 3 with T3's failure message on stderr (verify: node --test tests/lets/resolvers/t3/delegate.test.ts)
- [ ] 1.4 [easy] A step thread with a pending request gives exit 0 and a `failed` report whose `reason` says `the session stopped to ask` and names the thread. The thread is not archived, and the record has `"handle":null` (verify: node --test tests/lets/resolvers/t3/delegate.test.ts)
- [ ] 1.5 [easy] Inside T3 Code, `lets delegate step instructions --for plan` exits 0 with `"strategy":"step"`, `"resolver":"t3"` and the catalogue's options. The test *step instructions inside T3 Code decline* becomes this one, and a step outside T3 Code still opens no thread (verify: node --test tests/lets/resolvers/t3/delegate.test.ts)

## 2. Stop a timed-out thread [depends-on: 1]

- [ ] 2.1 [medium] A step still running at its time limit sends T3 one `thread.stop` for its thread, does not archive it, and exits 6 with an empty stdout and the thread on stderr. The header comment of `t3.ts` says that `thread.stop` was read from the T3 Code 0.1.7 server bundle (verify: node --test tests/lets/resolvers/t3/delegate.test.ts)
- [ ] 2.2 [easy] A review still running at its time limit is stopped in the same way: one `thread.stop`, no archive, exit 6 (verify: node --test tests/lets/resolvers/t3/t3.test.ts)
- [ ] 2.3 [medium] A stop that T3 rejects, or does not answer within 10 seconds, still ends in a timeout. The error says `could not stop it, so it may still be running` and names the thread. `dispatch` takes an optional deadline and passes it to `request` (verify: node --test tests/lets/resolvers/t3/t3.test.ts)

## 3. Docs [parallel]

- [ ] 3.1 [easy] `docs/resolvers.md` says `t3` runs steps. The resolver table's `t3` row says a step runs in a new thread, archived when it is done. *It runs no step yet* gives way to a short part on steps: the checkout and mode, and which threads are kept. A bullet beside the review bullets says that a `t3` review or step still running at its time limit is stopped, and its thread kept (verify: grep -n "archived when it is done" docs/resolvers.md)
- [ ] 3.2 [easy] The smoke test in *After a t3 update* gains a step whose prompt asks for a `done` step report. It expects `"outcome":"done"` on stdout, `"resolver":"t3"` on stderr and an archived thread (verify: grep -n "step run" docs/resolvers.md)

## 4. Integration [depends-on: 1, 2, 3]

- [ ] 4.1 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger

- 1.1: adding `step` makes `t3` answer step instructions, so the old test *step instructions inside T3 Code decline* failed at once. Task 1.1's commit turns it into 1.5's test *step instructions inside T3 Code list the catalogue's models*. Task 1.5's commit adds the test that a step outside T3 Code opens no thread.
