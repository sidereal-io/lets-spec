## Story

#319 delegate-step-tests-run-the-command — `lets delegate step run`,
`start` and `wait` are tested by running lets with stand-in harness
programs.
https://github.com/sidereal-io/lets-spec/issues/319

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#318 (pull request #333), which taught the stand-ins to write files,
commit, and log their stdin and folder, and added
`tests/delegate/repo.ts`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests does this story move? | The tests in `tests/lets/delegate/step.test.ts` (39) and `background.test.ts` (29); the 12 step tests in `tests/lets/resolvers/cli/delegate.test.ts`; the 6 write-mode `runCommand` tests in `tests/lets/resolvers/cli/cli.test.ts`, which #318 left for this story. | Evidence: #319 packet, *Scope* and *Relevant code*; #318 brainstorm, D9 |
| D2 | Which resolvers do the black-box tests use? | `cli` and `subagent`, chosen by a real lets config, with only the stand-ins and `git` on `PATH`, through `tests/delegate/repo.ts`. | Evidence: #318 brainstorm, D2; `tests/delegate/repo.ts` |
| D3 | Do the T3 resolver's tests change? | No. | Evidence: #308 *Shared decisions*; #319 packet, *Scope: out* |
| D4 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D5 | Do the 19 tests in `tests/lets/delegate/report.test.ts` stay as unit tests? | Yes, all 19. They test pure functions, and each branch would need a whole `lets` run to reach. The new black-box tests still check each outcome once through `step run`: done, needs-input with `ask`, failed, no step-report block, and a bad answers file. | Assumption |
| D6 | Is `tests/lets/delegate/source-tree.test.ts` deleted? | Yes. The `review run` test "with no lets config, subagent is the only resolver asked" and the new `step run` test with no config check the same default wiring. The pull request names both. | Assumption |
| D7 | How do tests check values from the real clock: the done report's `date`, `endedAt` in the exit file and `startedAt` in the run record? | Each value has the right form (ISO 8601 UTC to the second for `date`, a number of milliseconds for the other two) and falls between the moments just before and just after the run. | Assumption |
| D8 | Are the two timeouts that need `--timeout-minutes 1` black-box tested: `step run` with a hanging stand-in, and `step wait` on a step that still runs? | Yes, both, each about 60 seconds, in one file of their own whose two tests run at the same time. | Assumption |
| D9 | What happens to the two tests no `cli` or `subagent` run reaches? | "A finish that fails is reported, and the report stands" in `step.test.ts` stays as a fake-adapter test, with its reason in the pull request. "A process that cannot start is exit 4, and leaves no run record" in `background.test.ts` is deleted: a black-box test with a folder where the report file goes shows the same result. | Assumption |
| D10 | Does `tests/lets/delegate/fixtures/` go? | No. The T3 tests, `tests/lets/go/questions.test.ts` and the kept delegate tests still import it. Only the parts no remaining test uses are removed. | Evidence: imports of `fixtures/command-deps.ts` and `fixtures/fake-io.ts` |
| D11 | Which other tests stay? | In `tests/lets/resolvers/cli/delegate.test.ts`, "finish removes nothing for a process handle whose id is not a session name", which tests the adapter alone. The pull request lists it with its reason. | Evidence: #318 brainstorm, D9 |
| D12 | How are the tests built? | By `skills/lets-verify-contracts/SKILL.md` in this checkout, not test-first. | User |
| D13 | May the change add or move bats tests? | No. Every test it adds, moves or keeps is a Node test, run by `node --test`. | User |

## Changes from the story

- **Kept: some unit and fake-adapter tests.** The story says the tests
  with fakes are gone, but three groups stay, each with its reason in
  the pull request: the 19 `report.test.ts` unit tests (D5), the
  fake-adapter test of a finish that fails (D9), and the cli adapter's
  test of a handle that is not a session name (D11).
- **Kept: `tests/lets/delegate/fixtures/`.** Tests outside this story
  still import it (D10).
- **Added: the 6 write-mode `runCommand` tests** in
  `tests/lets/resolvers/cli/cli.test.ts`, which #318 left for this
  story (D1).
- **Deleted without a direct replacement:** `source-tree.test.ts`, whose
  check two black-box tests already make (D6), and the background test
  of a process that cannot start, which a black-box test of a report
  file that cannot be opened covers (D9).

Confirmed by user: yes
