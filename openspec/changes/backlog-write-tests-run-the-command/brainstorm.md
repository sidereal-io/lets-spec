## Story

#316 backlog-write-tests-run-the-command — `lets backlog` claim, release
and complete are tested by running `lets` with a stand-in `gh`.
https://github.com/sidereal-io/lets-spec/issues/316

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. This story
stacks on #315 (`backlog-read-tests-run-the-command`, pull request
#330), which wrote the stand-in `gh` rows and the fixture
`tests/backlog/github.ts`.

The issue thread holds one comment: the lets-go claim, which is workflow
metadata and raises no question.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests are in scope? | 40 tests in `tests/lets/backlog/`: `claim` 16, `complete` 10, `release` 8, `race` 4 and `reclaim` 2. The read commands and the live GitHub API (#146) are out. | Evidence: #316 packet; counted in the files |
| D2 | How does a new test run `lets`? | As a black-box test: `lets/bin/lets backlog …` run as a program through `backlog()` in `tests/backlog/github.ts`, checking only stdout, the exit code and what the stand-in `gh` logged or kept. | Evidence: #308 *Shared decisions*; `tests/backlog/github.ts` |
| D3 | Does `lets` change, or any spec requirement? | No. The `lets-backlog` spec describes what the commands do, and that stays the same. | Evidence: #308 *Shared decisions* |
| D4 | Which testing strategy does the build follow? | `skills/lets-verify-contracts/SKILL.md` in this checkout, not test-first. Where an installed skill says test-first, lets-verify-contracts wins. | User |
| D5 | May this change add or move a bats test? | No. Every test it adds, moves or keeps is a Node test, run by `node --test`. No bats check of `claim`, `release` or `complete` exists; the backlog lines of `tests/skill-interfaces.bats` check skill text, which #311 and #312 own. | User; Evidence: `tests/skill-interfaces.bats` |
| D6 | How does the stand-in `gh` remember a write? | It keeps what an earlier call wrote, such as the claim comment, in a file, so a later call in the same or another run of `lets` reads it back. | Evidence: #316 packet |
| D7 | How does a test check the claim token `lets` makes with `randomUUID`? | By its shape, a UUID, as `claim.test.ts` does today, or by reading it back from what the stand-in kept. | Evidence: #316 packet |
| D8 | Six cases rely on `gh` running past its 60-second limit. What happens to them? | Only what needs the timeout stays in process: the result "timed out; the write may have happened" for `claim` and `complete`, and the finite timeout on every write. The rest move to black-box tests with a `gh` call that fails instead: the recovery token is kept, the state read is backend-failed, and the close is not retried. `lets` does not change. | Assumption |
| D9 | Three tests use the fake backlog provider with Jira-style keys, one each in `claim`, `release` and `complete`. What happens to them? | They stay in process, unchanged, as #315's D13 kept its four. | Assumption |
| D10 | Does `tests/lets/backlog/fixtures/` go? | No. The tests D8 and D9 keep import `fake-gh.ts` and `fake-provider.ts`, and so do the tests #315 kept in `commands`, `item`, `ready` and `key`. | Evidence: the imports in `tests/lets/backlog/` |
| D11 | How does a test set the order of two claims racing? | It runs two `lets backlog` processes against one shared stand-in state. The stand-in holds a named call until the test lets it go, through a file, so there are no sleeps. The release in the clean-up case is a real `lets backlog release`. | Assumption |
| D12 | Where are the kept tests listed? | In the pull request description, under *Kept in process*, each with its reason. | Evidence: #308 *Shared decisions* |
| D13 | Does this branch add glossary terms? | No. *Black-box test* and *stand-in* keep their meaning from #308's *Shared decisions*, as #315's D12 did. `openspec/glossary.md` stays unchanged. | Assumption |

## Changes from the story

- The packet's scope deletes `tests/lets/backlog/fixtures/` when nothing
  imports it. Kept tests still import it (D10), so it stays, and a fake
  `gh` remains for those tests only. The packet's *Why this story* says
  the story removes the last fake `gh`; that is no longer true.

Confirmed by user: no
