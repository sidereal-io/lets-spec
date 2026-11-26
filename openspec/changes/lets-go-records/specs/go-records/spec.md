## Purpose

Says how `lets go records <name>` reads the record each step of a change leaves in Git and in the pull request, and prints them as JSON, so that `lets-go` can fill its Skip lines without reading `git log` and the pull request's body by hand.

## ADDED Requirements

### Requirement: lets go records prints one record for each step
`lets go records <name>` SHALL print one JSON line on stdout and exit 0. The line SHALL be an object with exactly four keys, in this order: `plan`, `review-plan`, `build` and `review-build`. Each key SHALL hold that step's record, or `null` when the step has no record. A record SHALL hold these keys, in this order:

- every record: `commit`, the commit's short hash as `git log`'s `%h` prints it, and `date`, the commit's author date as `YYYY-MM-DD`, as `git log`'s `%as` prints it;
- `review-plan` also: `pr`, the pull request's number, and `verdict`, the plan review's verdict;
- `review-build` also: `pr`, the pull request's number, or `null`.

The command SHALL write nothing to the repository, the branch or the pull request. It SHALL not read `openspec/config.yaml` or the change's schema, so on a `lets-minimal` change review plan's record is `null` unless the pull request holds a **Plan review** section. It SHALL not say whether a step is done.

#### Scenario: Every step has a record
- **WHEN** the repository's commits added and ticked `openspec/changes/lets-go-chore/tasks.md` and then archived it, and pull request #167 for the branch `lets-go-chore` has a **Plan review** section
- **THEN** `lets go records lets-go-chore` exits 0, stdout is one line, and the line parses as an object whose keys are `plan`, `review-plan`, `build` and `review-build`, in that order, none of them `null`

#### Scenario: A new change
- **WHEN** the branch `lets-go-chore` has no commit that touches `openspec/changes/lets-go-chore/` and no pull request
- **THEN** `lets go records lets-go-chore` exits 0, and stdout is `{"plan":null,"review-plan":null,"build":null,"review-build":null}`

#### Scenario: The date is the author date
- **WHEN** the commit that added `openspec/changes/lets-go-chore/tasks.md` has the author date 2026-11-03 and the committer date 2026-11-20, as after a rebase
- **THEN** the `plan` record's `date` is `2026-11-03`

#### Scenario: The command writes nothing
- **WHEN** `lets go records lets-go-chore` runs in a repository with a clean tree
- **THEN** `git status --porcelain` prints nothing afterwards, `HEAD` is the same commit, and the stand-in `gh` was called only with `pr view`

### Requirement: Plan's record is the commit that added the task list
The `plan` record SHALL be the most recent commit reachable from `HEAD` that added `openspec/changes/<name>/tasks.md`. It SHALL be `null` when no such commit exists. After archive, the path's history still holds the add, so the record SHALL be the same as before archive.

#### Scenario: A planned change
- **WHEN** commit `2bbc7d0`, authored 2026-11-03, added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** the `plan` record is `{"commit":"2bbc7d0","date":"2026-11-03"}`

#### Scenario: No task list yet
- **WHEN** `openspec/changes/lets-go-chore/` holds `brainstorm.md` and `proposal.md`, and no commit added `tasks.md`
- **THEN** the `plan` record is `null`

#### Scenario: An archived change
- **WHEN** a later commit moved `openspec/changes/lets-go-chore/` to `openspec/changes/archive/2026-11-06-lets-go-chore/`
- **THEN** the `plan` record names the commit that added `openspec/changes/lets-go-chore/tasks.md`, not the archive commit

### Requirement: Build's record is the last commit that changed the task list
The `build` record SHALL be the most recent commit reachable from `HEAD` that modified `openspec/changes/<name>/tasks.md`, without adding or deleting it. It SHALL be `null` when no such commit exists. After archive, the record SHALL be the same as before archive.

#### Scenario: The last task tick
- **WHEN** commits `a11ce01` and then `3222c70`, authored 2026-11-05, ticked tasks in `openspec/changes/lets-go-chore/tasks.md`
- **THEN** the `build` record is `{"commit":"3222c70","date":"2026-11-05"}`

#### Scenario: No task ticked yet
- **WHEN** a commit added `openspec/changes/lets-go-chore/tasks.md`, and no later commit changed it
- **THEN** the `build` record is `null`, and the `plan` record is not

#### Scenario: The archive is not a tick
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70`, and a later commit moved the folder to the archive
- **THEN** the `build` record's `commit` is `3222c70`

### Requirement: Review build's record is the archive commit and the pull request
The command SHALL look in `openspec/changes/archive/` in the working tree for a folder whose whole name is a date as `YYYY-MM-DD`, a hyphen, and `<name>`. When exactly one such folder exists, the `review-build` record SHALL be the most recent commit reachable from `HEAD` that added that folder's `tasks.md`, and its `pr` SHALL be the number of the branch's pull request, or `null` when the branch has none. The `review-build` record SHALL be `null` when no such folder exists, when more than one exists, or when no commit added the folder's `tasks.md`. A folder whose name only ends in `-<name>` SHALL not count.

#### Scenario: An archived change with a pull request
- **WHEN** commit `1d253bd`, authored 2026-11-06, added `openspec/changes/archive/2026-11-06-lets-go-chore/tasks.md`, and pull request #167 is the branch's
- **THEN** the `review-build` record is `{"commit":"1d253bd","date":"2026-11-06","pr":167}`

#### Scenario: An archived change with no pull request
- **WHEN** the archive folder `2026-11-06-lets-go-chore` exists with its commit, and `gh` finds no pull request for the branch `lets-go-chore`
- **THEN** the `review-build` record holds the archive commit, its `date`, and `"pr":null`

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-06-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets go records go-chore` prints `"review-build":null`

#### Scenario: Two archive folders
- **WHEN** the archive holds both `2026-11-06-lets-go-chore` and `2026-11-09-lets-go-chore`
- **THEN** the `review-build` record is `null`

#### Scenario: A folder that no commit added
- **WHEN** `openspec/changes/archive/2026-11-06-lets-go-chore/tasks.md` exists in the working tree but is not committed
- **THEN** the `review-build` record is `null`

### Requirement: Review plan's record comes from the Plan review section only
The command SHALL read the branch's pull request with `gh`, and take its number and body. In the body, it SHALL find the first line that is `## Plan review`, and read the section from there to the next line that starts `## `, or to the end of the body. Inside that section only, `<sha>` SHALL be the rest of the first line that starts `Reviewed: `, and `<verdict>` the rest of the first line that starts `- **Verdict:** `, each without the spaces around it. The `review-plan` record SHALL be `{"commit":<sha>,"date":<date>,"pr":<number>,"verdict":<verdict>}`. `commit` SHALL be `<sha>` exactly as written, not shortened or expanded. `verdict` SHALL be `<verdict>` exactly as written. `<date>` SHALL be the author date, as `YYYY-MM-DD`, of the commit `<sha>` names.

The `review-plan` record SHALL be `null` in each of these cases:

- the branch has no pull request;
- the body has no `## Plan review` line;
- the section has no `Reviewed: ` line, or no `- **Verdict:** ` line, or either holds nothing after its start;
- git cannot find a commit by `<sha>` in the repository.

A `Reviewed:` line outside the section, such as the one in a **Code review** section, SHALL not be read.

#### Scenario: A plan review
- **WHEN** pull request #167's body holds `## Plan review`, then `Reviewed: 7d16565` and `- **Verdict:** APPROVE`, and commit `7d16565` was authored 2026-11-04
- **THEN** the `review-plan` record is `{"commit":"7d16565","date":"2026-11-04","pr":167,"verdict":"APPROVE"}`

#### Scenario: The commit as written
- **WHEN** the section says `Reviewed: ` followed by a full 40-character hash
- **THEN** the record's `commit` is that full hash, as written

#### Scenario: A code review section first
- **WHEN** the body holds a `## Code review` section with `Reviewed: 9f00ba1` and, after it, a `## Plan review` section with `Reviewed: 7d16565`
- **THEN** the record's `commit` is `7d16565`

#### Scenario: A code review section but no plan review
- **WHEN** the body holds a `## Code review` section with `Reviewed: 9f00ba1` and `- **Verdict:** APPROVE`, and no `## Plan review` line
- **THEN** the `review-plan` record is `null`

#### Scenario: A section with no verdict line
- **WHEN** the **Plan review** section holds `Reviewed: 7d16565` and no line that starts `- **Verdict:** `
- **THEN** the `review-plan` record is `null`

#### Scenario: A reviewed commit git does not have
- **WHEN** the section says `Reviewed: 0000000` and `- **Verdict:** APPROVE`, and no commit in the repository starts with `0000000`
- **THEN** the `review-plan` record is `null`, and the command exits 0

#### Scenario: A reviewed value that looks like an option
- **WHEN** the section says `Reviewed: --all` and `- **Verdict:** APPROVE`
- **THEN** the `review-plan` record is `null`, and the command exits 0

#### Scenario: No pull request
- **WHEN** `gh` finds no pull request for the branch `lets-go-chore`
- **THEN** the `review-plan` record is `null`, and the command exits 0

### Requirement: A bad name or a failed read stops the command
`lets go records` SHALL take exactly one argument, the change's name. It SHALL exit 2 and print nothing on stdout when the argument is missing, or when the name is not lower-case kebab-case: letters and digits in words joined by single hyphens, starting with a letter. It SHALL exit 4 and print nothing on stdout when a read fails in a way that is not one of the `null` cases above: the current directory is not in a Git repository, `git` or `gh` cannot start, or `gh` fails for any reason other than finding no pull request for the branch. For a missing argument, stderr SHALL say that the argument `name` is missing. In every other case, stderr SHALL be one line that starts `lets go: `, and names the bad name, or the command that failed and its error.

#### Scenario: No name
- **WHEN** the user runs `lets go records` with no argument
- **THEN** it exits 2, stdout is empty, and stderr names the missing argument `name`

#### Scenario: A name that is a path
- **WHEN** the user runs `lets go records ../lets-go-chore`
- **THEN** it exits 2, stdout is empty, and stderr starts `lets go: ` and names `../lets-go-chore`

#### Scenario: gh is not signed in
- **WHEN** the stand-in `gh` exits 1 for `pr view` with `To get started with GitHub CLI, please run:  gh auth login` on stderr
- **THEN** `lets go records lets-go-chore` exits 4, stdout is empty, and stderr starts `lets go: ` and holds `gh auth login`

#### Scenario: Not a Git repository
- **WHEN** the user runs `lets go records lets-go-chore` in a folder outside any Git repository
- **THEN** it exits 4, stdout is empty, and stderr starts `lets go: ` and names `git`

### Requirement: The help says what each record holds
`lets go --help` SHALL name `records`. `lets go records --help` SHALL name the four keys `plan`, `review-plan`, `build` and `review-build`; say which commit each record names; name the fields `commit`, `date`, `pr` and `verdict`; say that a record is `null` when the step left none; and name the exit codes 0, 2 and 4.

#### Scenario: The group's help
- **WHEN** the user runs `lets go --help`
- **THEN** the output names `questions` and `records`

#### Scenario: The command's help
- **WHEN** the user runs `lets go records --help`
- **THEN** the output names `plan`, `review-plan`, `build`, `review-build`, `commit`, `date`, `pr`, `verdict`, `null`, `tasks.md`, `Plan review`, and the exit codes `0`, `2` and `4`
