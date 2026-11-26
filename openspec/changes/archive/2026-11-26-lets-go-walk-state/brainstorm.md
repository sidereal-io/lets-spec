## Story

#268 lets-go-walk-state — lets go records also says which steps are done and which records disagree.
https://github.com/sidereal-io/lets-spec/issues/268

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is in scope? | `lets go records <name>` says whether each of the four steps is done, using the same tests as today, reports the records that disagree with what it found, and reports a merged or closed pull request. `lets-go` runs it before the walk and after each `done` report, and keeps the table of what the user fixes by hand. Out: running steps and relaying questions. | Evidence: #268 packet, **Scope** |
| D2 | Keep #268 as one story, or split review plan's done test into its own story? | One story. Review plan's done test is the main reason to move the walk into code, and a split would leave half the done tests in code and half by hand. | Assumption |
| D3 | Which rows of *Records that disagree* does the command report? | Six: a dirty tree, a change folder beside an archive folder, an archive folder with a missing, draft or unreviewed pull request, a committed `brainstorm.md` with no pull request, an archived change with no **Plan review** section, and a `null` record for a row settled as done. The diverged-branch check stays in `lets-go`'s *Enter the branch*. | Assumption |
| D4 | How does the command decide that a fix commit under `APPROVE_WITH_CHANGES` holds up? | Mechanically only: rules 1 to 4 of *Check an earlier review*; the **Rebuttals** list holds at least as many `Fixed in <commit>` lines as there are required changes; and each commit those lines name is listed by rule 4's `git log` and touches only `openspec/changes/<name>/` and `docs/decisions/`. The command matches by count, not by number, because rebuttals are numbered by finding, not by required change (in #346, required change 1 is answered by rebuttal 3). Nobody judges the diff again: the review plan step did when it wrote the rebuttals. `lets-review-plan`'s text does not change. | Assumption |
| D5 | Which schema do the two schema-dependent tests read? | Both as today: review plan on `lets-minimal` uses the change's `.openspec.yaml`, in the change folder or its archive folder; the **Code review** rule uses the `schema:` line of `openspec/config.yaml`. The command reads both itself. | Assumption |
| D6 | What does the command print? | The four record keys, unchanged, then a done key mapping each step to true or false, a disagreements key listing each matching row with what was found, and the pull request's state (`OPEN`, `MERGED`, `CLOSED` or `null`). An `openspec instructions apply` state other than `blocked`, `ready` or `all_done` exits 4 with the CLI's instruction on stderr. The design sets the exact JSON layout. | Assumption |
| D7 | Where is the review plan rule written? | Only in `lets-review-plan`'s *Check an earlier review*, whose text does not change. `lets-go` stops restating it, and the command's help cites it. | Assumption |
| D8 | Does "record" get a glossary entry? | No. A record still means what a step leaves in Git or the pull request. The done answers and disagreements are worked out from records, and the command's help explains them. | Assumption |
| D9 | What evidence accepts the story? | Node tests of the command in `tests/go/records.test.ts` against a fixture repository, the contract tests for `lets-go`'s text, and `wc -l` for each changed skill file, before and after, in the pull request. | Evidence: #268 packet, **Scope**; commit 57f02c4d removed the bats tests |

## Changes from the story

- **Tests are Node tests, not bats.** The packet's **Relevant code** names `tests/skill-interfaces.bats`. Commit 57f02c4d deleted it, so the tests go in `tests/go/` and `tests/contracts/`.
- **The diverged-branch check stays in `lets-go`.** The packet asks the command to report each row of *Records that disagree*. *Enter the branch* already finds a branch that has diverged from `origin` when its fast-forward fails, before any record is read, so the command reports the other six rows (D3).
- **Review plan's done test no longer reads fix diffs.** Today the walk reads each fix commit with `git show` to judge that it makes the required change. The command checks only what can be checked mechanically (D4).

Confirmed by user: yes
