## Story

#265 lets-go-records — lets go records prints each step's record, and lets-go fills its Skip lines from it.
https://github.com/sidereal-io/lets-spec/issues/265

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is in scope? | A `lets go records <name>` command that prints the record of plan, review plan, build and review build. `lets-go` fills every Skip line from it, and *Read the records* leaves `references/records.md`. Out: deciding which steps are done, and records that disagree; #268 takes both. | Evidence: #265 packet, **Scope** |
| D2 | What does `lets go records <name>` print? | One JSON line on stdout, exit 0: an object keyed `plan`, `review-plan`, `build`, `review-build`, in step order, each a record or null. Each record has `commit` (short hash; for review plan, the `Reviewed:` commit as written) and `date` (author date, YYYY-MM-DD). Review plan adds `pr` and `verdict`; review build adds `pr`. | Assumption |
| D3 | When is a record null, and when is only one field null? | Plan, build and review build are null when their `git log` read finds no commit. Review plan is null unless the pull request exists, its **Plan review** section has a `Reviewed:` line and a Verdict line, and git can date the named commit. Review build keeps its record with `pr: null` when there is an archive commit but no pull request. Only the **Plan review** section of the body is read. | Assumption |
| D4 | Does the command read the flow's schema? | No. It prints what the records hold, so on `lets-minimal` review plan is normally null. `lets-go` keeps printing its fixed `lets-minimal` line. | Assumption |
| D5 | Does "record" get a glossary entry, in `openspec/glossary.md` and `lets-go`'s `references/terms.md`? | No entry for now. The command's `--help` says what each record holds. #268 can define the term if it widens the meaning. | Assumption |
| D6 | Where is the new behaviour specified? | A new capability, `go-records`, beside `go-questions`, for the command. A `lets-go` delta rewrites *A skipped step's line carries its evidence and date* to fill each line from `lets go records`, and says `records.md` holds only *Records that disagree*. | Assumption |
| D7 | What evidence accepts the story? | Node tests of the command against a fixture repository, and the contract tests for `lets-go`'s text. The pull request records `wc -l` for each changed skill file, before and after. | Evidence: #265 packet, **Scope**; precedent in the archived `shape-search-once` brainstorm, D6 |

## Changes from the story

- **Tests are Node tests, not bats.** The packet's **Relevant code** names `tests/skill-interfaces.bats`. Pull request #336 removed the bats tests, so the command's tests go in `tests/go/`, beside `questions.test.ts`, and the text checks in `tests/contracts/`.

Confirmed by user: yes
