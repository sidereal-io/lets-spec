## 1. The review record and its time limit

- [x] 1.1 [medium] `lets delegate review run` puts `checkout`, from the adapter's run result, and `commit`, from `git rev-parse HEAD` in that checkout after the session, on its JSON line, right after `handle`. `Adapter.run` returns `checkout: string | null`. The fake adapters in `tests/lets/delegate/fixtures/command-deps.ts` return `input.cwd`, and its git answers `rev-parse HEAD` with a fixed hash (verify: node --test tests/lets/delegate/review.test.ts) (✓ node --test tests/lets/delegate/review.test.ts passed)
- [x] 1.2 [easy] A null checkout, or a checkout where `git rev-parse HEAD` fails, gives `"commit":null`, and the command still exits 0 and prints the final message (verify: node --test tests/lets/delegate/review.test.ts) (✓ node --test tests/lets/delegate/review.test.ts passed)
- [x] 1.3 [easy] When the session makes a commit and leaves the tree clean, `commit` is the new `HEAD`, not the one before the session (verify: node --test tests/lets/delegate/review.test.ts) (✓ node --test tests/lets/delegate/review.test.ts passed; fails when HEAD is read before the session)
- [x] 1.4 [easy] A review gets 30 minutes at effort `low` and `medium` and 45 at `high`, unless `--timeout-minutes` says otherwise. A session past its limit exits 6 with empty stdout. The `--timeout-minutes` help says `default: 30, or 45 with --effort high`, and the review help lists `checkout` and `commit` (verify: node --test tests/lets/delegate/review.test.ts tests/lets/resolvers/kit/adapter.test.ts tests/lets/delegate/cli.test.ts) (✓ node --test of the three files passed)

## 2. The cli resolver [depends-on: 1]

- [x] 2.1 [parallel] [easy] A review through `cli` has the command's checkout as `checkout`, and that checkout's `HEAD` as `commit` (verify: node --test tests/lets/resolvers/cli/delegate.test.ts) (✓ node --test tests/lets/resolvers/cli/delegate.test.ts passed)

## 3. The t3 resolver [depends-on: 1]

- [x] 3.1 [parallel] [easy] A `t3` review opens its thread with `interactionMode: 'default'`, for plan and code reviews, and a handoff still does. `buildLaunch` sends the mode itself, and `launchThread` no longer takes `readOnly` (verify: node --test tests/lets/resolvers/t3/t3.test.ts) (✓ node --test tests/lets/resolvers/t3/t3.test.ts passed)
- [ ] 3.2 [medium] A `t3` review whose completed run holds a `proposed_plan` item fails with `the session returned a plan, not a result (thread <id>)`, exits 5 with empty stdout, and does not archive the thread. A completed run with no such item returns its final message as before (verify: node --test tests/lets/resolvers/t3/t3.test.ts tests/lets/resolvers/t3/delegate.test.ts)
- [ ] 3.3 [medium] A `t3` review returns as `checkout` the worktree T3 records for the thread, else the root of the thread's T3 project, else `null` when T3 has no row or its payload does not parse. It does not return the checkout it asked for (verify: node --test tests/lets/resolvers/t3/t3.test.ts tests/lets/resolvers/t3/delegate.test.ts)

## 4. Skills and docs [depends-on: 1]

- [ ] 4.1 [parallel] [medium] `skills/lets-review-plan/SKILL.md` and `skills/lets-review-build/SKILL.md` note the checkout's top level and full `HEAD` before they write the prompt. The prompt starts with them, tells the reviewer to read files only there, and asks for a last line `Read: <absolute path> <full commit>`. After exit 0, the skill compares the meta line's `checkout` and `commit` and the `Read:` line with the noted values; after the subagent step, the `Read:` line only. On a difference, a `null` or a missing line, it records no review and stops. `tests/skill-interfaces.bats` checks both skills say this (verify: bats tests/skill-interfaces.bats)
- [ ] 4.2 [parallel] [easy] `docs/resolvers.md` says, in its `t3` section, that a review runs in default mode and that a run holding a plan exits 5. It says the review's JSON line names `checkout` and `commit`, and its smoke test's step 2 expects `checkout` to be the checkout it ran from (verify: grep -n "default mode" docs/resolvers.md)

## 5. Integration [depends-on: 2, 3, 4]

- [ ] 5.1 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger
