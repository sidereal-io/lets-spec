## Story

#315 backlog-read-tests-run-the-command — `lets backlog` ready, item,
find, key and waves are tested by running `lets` with a stand-in `gh`.
https://github.com/sidereal-io/lets-spec/issues/315

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. This story
stacks on #309 (`sync-tests-in-node`, pull request #322), which wrote
the helper module `tests/support/lets.ts`.

The issue thread holds one comment: the lets-go claim, which is workflow
metadata and raises no question.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests are in scope? | 157 tests in `tests/lets/backlog/`: `cli` 8, `ready` 27, `commands` 22, `policy` 20, `item` 19, `key` 7, `config` 4, `find` 3, `waves` 47. The `claim`, `complete`, `race`, `reclaim` and `release` tests are #316's. | Evidence: #315 packet; counted in the files |
| D2 | How does a new test run `lets`? | As a black-box test: `lets/bin/lets` run as a program through `runLets` in `tests/support/lets.ts`, checking only stdout, stderr, the exit code, files and the calls the stand-in `gh` logged. | Evidence: #308 *Shared decisions*; `tests/support/lets.ts` |
| D3 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D4 | Where does the stand-in `gh` live? | In the helper module `tests/support/lets.ts`, which it extends. It answers from a table the test gives it and logs each call. How it matches a call is for the design. | Evidence: #315 packet *Scope*; #308 *Shared decisions* |
| D5 | Do `fixtures/fake-gh.ts` and `fixtures/fake-provider.ts` stay? | Yes, both. The `claim`, `release`, `complete`, `race` and `reclaim` tests import them, and #316 retires them. | Evidence: #315 packet; the imports of those five test files |
| D6 | Does `tests/lets/backlog/cli.test.ts` keep its own fake `gh`? | No. Its 8 tests move onto the helper module, because later stories extend the helper and never copy it. | Evidence: #308 *Shared decisions* |
| D7 | Which tests in `waves.test.ts` stay as unit tests? | The 34 tests of the pure functions `relevantPaths` (12), `overlap` (11) and `placeWaves` (11). Each loop, chain or path case would need several items and packets through the command. The 13 tests that call the `waves` command move to black-box tests. | Assumption |
| D8 | Do the 20 tests in `policy.test.ts` stay as unit tests of the pure `ready()` and `itemView()`? | No. Through the command, each case needs one Project item and one search answer, which is not a far larger setup. Each is deleted once a black-box test covers its case. | Assumption |
| D9 | Do the 4 tests in `config.test.ts` stay as unit tests of the pure `backlogProviderFor()`? | No. Through the command, each case is one lets config file. Each is deleted once a black-box test covers its case. | Assumption |
| D10 | Tests of `lets backlog --help` look for phrases in its output. Do they move? | Yes, as black-box tests of the help output. #308 bans phrase tests of skills, schemas and documents; a command's own output is what a black-box test checks. | Assumption |
| D11 | Which unit tests stay is listed where? | In the pull request description, each with its reason. | Evidence: #308 *Shared decisions* |
| D12 | Does this branch add glossary terms? | No. *Black-box test* and *stand-in* keep their meaning from #308's *Shared decisions*, as #309 did. `openspec/glossary.md` stays unchanged. | Assumption |

## Changes from the story

None.

Confirmed by user: no
