## Why

On every run, `lets-go` decides by hand whether each step is done. *Walk the step table*, the rules in `references/records.md` and the re-check in *Read the report* are the longest hand-run logic in the skill. Review plan's test is the hardest: the agent follows *Check an earlier review* in `lets-review-plan`, runs `git merge-base`, `git log` and `git show`, and judges each fix commit. A wrong answer runs a step twice or skips one, and nothing checks it. The previous story (#265, pull request #346) moved the walk's record reads into `lets go records`. This story moves the done tests and the disagreement checks there too.

## What Changes

- **`lets go records <name>` says which steps are done.** After the four record keys, which stay unchanged, it prints a done key that maps each of the four steps to `true` or `false`, using the same tests as today (D1, D6). Review plan's test applies rules 1 to 4 of *Check an earlier review* mechanically. Under `APPROVE_WITH_CHANGES` it counts `Fixed in <commit>` rebuttals against the required changes, and checks that each named commit is a plan commit. Nobody reads a fix commit's diff again (D4).
- **The command reports the records that disagree.** A disagreements key lists each matching row of *Records that disagree*, with what was found, such as a path or the pull request's draft state. It covers six rows: a dirty tree, a change folder beside an archive folder, an archive folder whose pull request is missing, a draft, or has no **Code review** section, a committed `brainstorm.md` with no pull request, an archived change with no **Plan review** section, and a `null` record for a step that is done (D3). The diverged-branch row stays in `lets-go`'s *Enter the branch*.
- **The command reports the pull request's state:** `OPEN`, `MERGED`, `CLOSED`, or `null` when the branch has none (D6).
- **The command now reads the schema.** Review plan is done on `lets-minimal`, read from the change's `.openspec.yaml` or its archive folder's. The **Code review** rule reads the `schema:` line of `openspec/config.yaml`. Both are as today (D5). This reverses the current rule that the command reads no schema.
- **A change state the walk does not know is a failed read.** When `openspec instructions apply` prints a state other than `blocked`, `ready` or `all_done`, the command exits 4 and prints the CLI's instruction on stderr (D6).
- **`lets-go`'s walk acts on the command's answer.** It runs `lets go records <name>` once before the walk and again after each `done` report. It stops on a disagreement, a merged or closed pull request, or a non-zero exit. It runs each step whose done answer is `false`. It no longer runs `git status`, `gh pr view` or `openspec instructions apply` for the walk, and no longer restates *Check an earlier review* (D7).
- **`references/records.md` keeps the table of what the user fixes by hand,** keyed by the rows the command reports, plus the diverged-branch row.
- **Unchanged:** `lets-review-plan`'s text (D7). No glossary entry for "record" (D8). Running steps and relaying questions stay in `lets-go` (D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `go-records`: the command also prints the done answers, the disagreements and the pull request's state; it reads the tree, the change state and the schema; it exits 4 for an unknown change state; its help names the new keys. This changes *lets go records prints one record for each step*, *A bad name or a failed read stops the command* and *The help says what each record holds*, and adds requirements for the done tests and the disagreements.
- `lets-go`: the walk reads the done answers and the disagreements from `lets go records <name>`, before the walk and after each `done` report, instead of running each test. This changes *lets-go walks the step table*, *Review plan runs as a step, or is not in the route*, *A skipped step's line carries its evidence and date*, *Records that disagree stop the run*, *A closed pull request ends the run*, *A done report is checked against its record*, *Each lets-go rule is written once*, and the fixed strings in *The prose holds the fixed lines the tests check*.

## Impact

- **Code:** `lets/src/go/records.ts` grows the done tests and the disagreement checks. The command's help in `lets/src/main.ts` names the new keys and cites *Check an earlier review*.
- **Skills:** `skills/lets-go/SKILL.md` (*Walk the step table*, *Read the report*, *The step table*) and `skills/lets-go/references/records.md`. The pull request records `wc -l` for each changed skill file, before and after (D9).
- **Tests:** `tests/go/records.test.ts` covers each done test and each disagreement against a fixture repository with a stand-in `gh`. The contract tests in `tests/contracts/` check `lets-go`'s new text (D9).
- **Outside tools:** the command now also runs `git status`, `git merge-base`, `openspec instructions apply`, and `git log` and `git diff-tree` for review plan's test. It still writes nothing.
- **Contract:** the JSON output only gains keys, so the Skip lines `lets-go` fills from the record keys keep working (D6). The shape is a contract: a later change to a key is a breaking change.
