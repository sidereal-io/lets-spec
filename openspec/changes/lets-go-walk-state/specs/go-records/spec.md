## MODIFIED Requirements

### Requirement: lets go records prints one record for each step
`lets go records <name>` SHALL print one JSON line on stdout and exit 0. The line SHALL be an object with exactly seven keys, in this order: `plan`, `review-plan`, `build`, `review-build`, `done`, `disagreements` and `pull-request`. Each of the first four keys SHALL hold that step's record, or `null` when the step has no record. A record SHALL hold these keys, in this order:

- every record: `commit`, the commit's short hash as `git log`'s `%h` prints it, and `date`, the commit's author date as `YYYY-MM-DD`, as `git log`'s `%as` prints it;
- `review-plan` also: `pr`, the pull request's number, and `verdict`, the plan review's verdict;
- `review-build` also: `pr`, the pull request's number, or `null`.

The `done`, `disagreements` and `pull-request` keys hold what the requirements below say. The command SHALL write nothing to the repository, the branch or the pull request. The four records SHALL not depend on the schema, so on a `lets-minimal` change review plan's record is `null` unless the pull request holds a **Plan review** section.

#### Scenario: Every step has a record
- **WHEN** the repository's commits added and ticked `openspec/changes/lets-go-chore/tasks.md` and then archived it, and pull request #167 for the branch `lets-go-chore` has a **Plan review** section
- **THEN** `lets go records lets-go-chore` exits 0, stdout is one line, and the line parses as an object whose keys are `plan`, `review-plan`, `build`, `review-build`, `done`, `disagreements` and `pull-request`, in that order, and none of the first four is `null`

#### Scenario: A new change
- **WHEN** the branch `lets-go-chore` has a clean tree, no commit that touches `openspec/changes/lets-go-chore/`, and no pull request
- **THEN** `lets go records lets-go-chore` exits 0, and stdout is `{"plan":null,"review-plan":null,"build":null,"review-build":null,"done":{"plan":false,"review-plan":false,"build":false,"review-build":false},"disagreements":[],"pull-request":null}`

#### Scenario: The date is the author date
- **WHEN** the commit that added `openspec/changes/lets-go-chore/tasks.md` has the author date 2026-11-03 and the committer date 2026-11-20, as after a rebase
- **THEN** the `plan` record's `date` is `2026-11-03`

#### Scenario: The command writes nothing
- **WHEN** `lets go records lets-go-chore` runs in a repository with a clean tree and a change folder `openspec/changes/lets-go-chore/`
- **THEN** `git status --porcelain` prints nothing afterwards, `HEAD` is the same commit, the stand-in `gh` was called only with `pr view`, and the stand-in `openspec` was called only with `instructions apply`

### Requirement: A bad name or a failed read stops the command
`lets go records` SHALL take exactly one argument, the change's name. It SHALL exit 2 and print nothing on stdout when the argument is missing, or when the name is not lower-case kebab-case: letters and digits in words joined by single hyphens, starting with a letter. It SHALL exit 4 and print nothing on stdout when a read fails in a way that is not one of the `null` or `false` cases these requirements give:

- the current directory is not in a Git repository, or `git`, `gh` or `openspec` cannot start;
- `gh` fails for any reason other than finding no pull request for the branch;
- `openspec instructions apply` exits non-zero, or prints something other than JSON with a string `state`;
- the change state is not `blocked`, `ready` or `all_done`;
- `openspec/config.yaml`, or a `.openspec.yaml` the command reads, exists but cannot be read.

For a missing argument, stderr SHALL say that the argument `name` is missing. In every other case, stderr SHALL be one line that starts `lets go: `, and names the bad name, or the command that failed and its error. For a change state the command does not know, the line SHALL name the state and hold the CLI's `instruction`, so that `lets-go` can show it.

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

#### Scenario: A change state the command does not know
- **WHEN** `openspec/changes/lets-go-chore/` exists, no archive folder does, and the stand-in `openspec` prints `{"state":"no_tasks","instruction":"Run openspec status first."}` for `instructions apply`
- **THEN** `lets go records lets-go-chore` exits 4, stdout is empty, and stderr is one line that starts `lets go: `, names `no_tasks` and holds `Run openspec status first.`

#### Scenario: openspec fails
- **WHEN** `openspec/changes/lets-go-chore/` exists, no archive folder does, and the stand-in `openspec` exits 1 with `Change not found` on stderr
- **THEN** `lets go records lets-go-chore` exits 4, stdout is empty, and stderr starts `lets go: ` and holds `Change not found`

### Requirement: The help says what each record holds
`lets go --help` SHALL name `records`. `lets go records --help` SHALL name the four record keys `plan`, `review-plan`, `build` and `review-build`; say which commit each record names; name the fields `commit`, `date`, `pr` and `verdict`; and say that a record is `null` when the step left none. It SHALL also name the keys `done`, `disagreements` and `pull-request`; say that `done` maps each step to `true` or `false`; name the entry keys `row` and `found` and the six rows `dirty-tree`, `change-and-archive`, `archive-not-ready`, `brainstorm-without-pull-request`, `archive-without-plan-review` and `null-record`; cite *Check an earlier review* in the `lets-review-plan` skill as the rule review plan's answer applies; and name the exit codes 0, 2 and 4.

#### Scenario: The group's help
- **WHEN** the user runs `lets go --help`
- **THEN** the output names `questions` and `records`

#### Scenario: The command's help
- **WHEN** the user runs `lets go records --help`
- **THEN** the output names `plan`, `review-plan`, `build`, `review-build`, `commit`, `date`, `pr`, `verdict`, `null`, `tasks.md`, `Plan review`, `done`, `disagreements`, `pull-request`, `row`, `found`, `dirty-tree`, `change-and-archive`, `archive-not-ready`, `brainstorm-without-pull-request`, `archive-without-plan-review`, `null-record`, `Check an earlier review`, `lets-review-plan`, and the exit codes `0`, `2` and `4`

## ADDED Requirements

### Requirement: The done key says whether each step is done
The `done` key SHALL hold an object with the keys `plan`, `review-plan`, `build` and `review-build`, in this order. Each SHALL be `true` when that step is done and `false` when it is not. In these requirements, an archive folder is a folder in `openspec/changes/archive/` in the working tree whose whole name is a date as `YYYY-MM-DD`, a hyphen, and `<name>`. One such folder or more counts. The change state is the `state` that `openspec instructions apply --change <name> --json` prints. The command SHALL run that command at most once, and only when `openspec/changes/<name>/` exists and no archive folder does. The first of these that matches SHALL decide:

1. When an archive folder exists, every step SHALL be done.
2. When `openspec/changes/<name>/` does not exist, plan, review plan, build and review build SHALL not be done.
3. Otherwise plan SHALL be done when the change state is `ready` or `all_done`, and not done when it is `blocked`. Build SHALL be done when the change state is `all_done`, and not done when it is `blocked` or `ready`. Review build SHALL not be done.

Review plan's answer SHALL follow *Review plan's done answer applies Check an earlier review* after rules 1 and 2.

#### Scenario: No change folder
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** `done` maps `plan`, `review-plan`, `build` and `review-build` to `false`, and the stand-in `openspec` was not called

#### Scenario: A plan in progress
- **WHEN** `openspec/changes/lets-go-chore/` exists and the change state is `blocked`
- **THEN** `done` maps `plan` and `build` to `false`

#### Scenario: A ready plan
- **WHEN** the change state is `ready`
- **THEN** `done` maps `plan` to `true`, and `build` and `review-build` to `false`

#### Scenario: Every task ticked
- **WHEN** the change state is `all_done`, and no archive folder exists
- **THEN** `done` maps `plan` and `build` to `true`, and `review-build` to `false`

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore/` exists, and `openspec/changes/lets-go-chore/` does not
- **THEN** `done` maps all four steps to `true`, and the stand-in `openspec` was not called

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`, and `openspec/changes/go-chore/` does not exist
- **THEN** `lets go records go-chore` maps `plan` to `false`

#### Scenario: Two archive folders
- **WHEN** the archive holds both `2026-11-06-lets-go-chore` and `2026-11-09-lets-go-chore`
- **THEN** `done` maps all four steps to `true`, the `review-build` record is `null`, and `disagreements` holds a `null-record` entry whose `found` names `review-build`

### Requirement: Review plan's done answer applies Check an earlier review
The change's schema SHALL be the `schema:` line of `openspec/changes/<name>/.openspec.yaml`, or, when that file does not exist, of the archive folder's `.openspec.yaml`. When neither exists, the schema is unknown, and is not `lets-minimal`. Review plan SHALL be done when an archive folder exists, or when the change's schema is `lets-minimal`. Review plan SHALL not be done when `openspec/changes/<name>/` does not exist and no archive folder does. Otherwise the command SHALL apply the rules of *Check an earlier review* in the `lets-review-plan` skill, reading `<sha>` and `<verdict>` as *Review plan's record comes from the Plan review section only* says. Review plan SHALL be done only when all of these hold:

1. The `review-plan` record is not `null`.
2. The verdict is `APPROVE` or `APPROVE_WITH_CHANGES`.
3. `git merge-base --is-ancestor <sha> HEAD` succeeds.
4. Each commit that `git log <sha>..HEAD -- openspec/changes/<name>/ docs/decisions/` lists is a fix. When a task is ticked, the log SHALL also leave out `openspec/changes/<name>/tasks.md`, because each task's commit ticks that file and a tick does not change the plan. A task is ticked when a line of that file in `HEAD`'s tree starts with optional spaces and `- [x] `. The `build` record does not decide this: a planning commit that edits `tasks.md` also sets it.
5. Under `APPROVE_WITH_CHANGES`, the **Rebuttals** list holds at least as many fix items as the **Required changes** list holds items, and each commit a fix item names is listed by rule 4's `git log` without the `tasks.md` exclusion, and changes only paths under `openspec/changes/<name>/` and `docs/decisions/`.

A fix is a commit that a fix item names and that changes only paths under `openspec/changes/<name>/` and `docs/decisions/`. These words name parts of the **Plan review** section:

- An item of a list is a line that starts with optional spaces, one or more digits, a dot and a space. The **Required changes** list holds the items after the line that starts `- **Required changes:**`, up to the next line that starts `- **`, or the end of the section. The **Rebuttals** list holds the items after the line that starts `- **Rebuttals:**`, in the same way.
- A fix item is an item of the **Rebuttals** list whose text after the number starts `Fixed in `, then 4 to 40 hexadecimal characters, then `:`. It names the commit that git finds by those characters.

The command SHALL not judge whether a fix's diff makes the required change. The review plan step judged that when it wrote the rebuttal. Nor SHALL it match a fix item to a required change by number: the template numbers rebuttals by finding.

#### Scenario: A lets-minimal change
- **WHEN** `openspec/changes/lets-go-chore/.openspec.yaml` says `schema: lets-minimal`, and the branch has no pull request
- **THEN** `done` maps `review-plan` to `true`, the `review-plan` record is `null`, and `disagreements` is `[]`

#### Scenario: No Plan review section
- **WHEN** the change's schema is `lets-standard`, the change state is `ready`, and pull request #167's body has no `## Plan review` line
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: A REVISE verdict
- **WHEN** the section says `Reviewed: 7d16565` and `- **Verdict:** REVISE`
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: An approved plan
- **WHEN** the section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE`, and the only commits after `7d16565` change `lets/src/` and tick `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `done` maps `review-plan` to `true`

#### Scenario: A rebased branch
- **WHEN** the section says `- **Verdict:** APPROVE` for a commit that `git merge-base --is-ancestor` finds is not an ancestor of `HEAD`
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: A plan change after the review
- **WHEN** the section says `- **Verdict:** APPROVE` for `7d16565`, and a later commit changes `openspec/changes/lets-go-chore/design.md` and no fix item names it
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: A tick before any task is built
- **WHEN** no line of `openspec/changes/lets-go-chore/tasks.md` in `HEAD`'s tree is a ticked task, the section says `- **Verdict:** APPROVE` for `7d16565`, and a later commit changes only `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `done` maps `review-plan` to `false`, because the log leaves out `tasks.md` only once a task is ticked

#### Scenario: A tasks.md edited in planning and again after the review
- **WHEN** a commit before `7d16565` edited `openspec/changes/lets-go-chore/tasks.md`, so the `build` record is not `null`, the section says `- **Verdict:** APPROVE` for `7d16565`, a later commit changes only that file, and no line of it in `HEAD`'s tree is a ticked task
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: Required changes with their fixes
- **WHEN** the section says `- **Verdict:** APPROVE_WITH_CHANGES` for `1e0c374`, its **Required changes** list holds one item, its **Rebuttals** list holds `1. Rebutted: ...` and `2. Fixed in cfd377e8: design.md decision 2`, and commit `cfd377e8`, after `1e0c374`, changes only `openspec/changes/lets-go-chore/design.md`
- **THEN** `done` maps `review-plan` to `true`

#### Scenario: A required change with no fix
- **WHEN** the section says `- **Verdict:** APPROVE_WITH_CHANGES`, its **Required changes** list holds two items, and its **Rebuttals** list holds one fix item
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: A fix that changes code
- **WHEN** the section says `- **Verdict:** APPROVE_WITH_CHANGES`, and the commit its one fix item names changes `openspec/changes/lets-go-chore/design.md` and `lets/src/go/records.ts`
- **THEN** `done` maps `review-plan` to `false`

#### Scenario: A fix from before the review
- **WHEN** the section says `- **Verdict:** APPROVE_WITH_CHANGES` for `1e0c374`, and its one fix item names a commit that is an ancestor of `1e0c374`
- **THEN** `done` maps `review-plan` to `false`, because rule 4's `git log` does not list it

### Requirement: The disagreements key lists the records that disagree
The `disagreements` key SHALL hold a list with one entry for each row below that matches, in this order, and SHALL be `[]` when none matches. Each entry SHALL be an object with two keys, in this order: `row`, the row's name, and `found`, a string that says what the command found. Where `found` names several things, it SHALL join them with `, `.

1. `dirty-tree`: `git status --porcelain` lists a path outside `.workspace/`. `found` names each such path.
2. `change-and-archive`: an archive folder and `openspec/changes/<name>/` both exist. `found` names `openspec/changes/<name>/` and each archive folder, as `openspec/changes/archive/<folder>/`.
3. `archive-not-ready`: an archive folder exists, and the branch has no pull request, or the pull request's `isDraft` is `true`, or the `schema:` line of `openspec/config.yaml` is `lets-standard` and the pull request's body has no line `## Code review`. `found` is `no pull request`, or names each of `isDraft: true` and `no Code review section` that holds.
4. `brainstorm-without-pull-request`: the tree of `HEAD` holds `openspec/changes/<name>/brainstorm.md`, and the branch has no pull request. `found` is that path.
5. `archive-without-plan-review`: an archive folder exists, the change's schema is not `lets-minimal`, and the `review-plan` record is `null` because the branch has no pull request or the body has no **Plan review** section with a `Reviewed: ` line and a `- **Verdict:** ` line. `found` is `no Plan review section`.
6. `null-record`: a step's `done` answer is `true` and its record is `null`. Review plan is left out when the change's schema is `lets-minimal`, and when row 5 matches. `found` names each such step's key, such as `plan`.

A change that is built but not archived, and whose pull request has no **Plan review** section, matches no row: review plan's answer is `false`, so `lets-go` runs it. The command SHALL not look for a branch that has diverged from `origin`: `lets-go` finds that when it fast-forwards the branch.

#### Scenario: A clean change
- **WHEN** the tree is clean, the change state is `ready`, and pull request #167 is a draft with no **Plan review** section
- **THEN** `disagreements` is `[]`

#### Scenario: A dirty tree
- **WHEN** `git status --porcelain` lists `skills/lets-go/SKILL.md` and `.workspace/`
- **THEN** `disagreements` holds `{"row":"dirty-tree","found":"skills/lets-go/SKILL.md"}`

#### Scenario: A change folder beside its archive
- **WHEN** `openspec/changes/lets-go-chore/` and `openspec/changes/archive/2026-11-06-lets-go-chore/` both exist
- **THEN** `disagreements` holds `{"row":"change-and-archive","found":"openspec/changes/lets-go-chore/, openspec/changes/archive/2026-11-06-lets-go-chore/"}`

#### Scenario: Archived, but the pull request is a draft
- **WHEN** the archive folder exists, `openspec/config.yaml` says `schema: lets-standard`, and pull request #167's `isDraft` is `true` and its body has a `## Code review` line
- **THEN** `disagreements` holds `{"row":"archive-not-ready","found":"isDraft: true"}`

#### Scenario: Archived on the standard flow with no code review
- **WHEN** `openspec/config.yaml` says `schema: lets-standard`, the archive folder exists, and pull request #167 is ready for review with no `## Code review` line
- **THEN** `disagreements` holds `{"row":"archive-not-ready","found":"no Code review section"}`

#### Scenario: Archived on the minimal flow with no code review
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, the archived change's `.openspec.yaml` says `schema: lets-minimal`, and pull request #167 is ready for review with no `## Code review` line
- **THEN** `disagreements` is `[]`

#### Scenario: A lets-minimal change archived in a lets-standard repository
- **WHEN** `openspec/config.yaml` says `schema: lets-standard`, the archived change's `.openspec.yaml` says `schema: lets-minimal`, and pull request #167 is ready for review with no `## Code review` line
- **THEN** `disagreements` holds `{"row":"archive-not-ready","found":"no Code review section"}`, and no `archive-without-plan-review` entry

#### Scenario: Archived with no pull request
- **WHEN** the archive folder exists, the archived change's `.openspec.yaml` says `schema: lets-standard`, and `gh` finds no pull request for the branch
- **THEN** `disagreements` holds `{"row":"archive-not-ready","found":"no pull request"}`, then `{"row":"archive-without-plan-review","found":"no Plan review section"}`, and no `null-record` entry that names `review-plan`

#### Scenario: A committed brainstorm with no pull request
- **WHEN** `HEAD` holds `openspec/changes/lets-go-chore/brainstorm.md`, the change state is `blocked`, and `gh` finds no pull request
- **THEN** `disagreements` holds `{"row":"brainstorm-without-pull-request","found":"openspec/changes/lets-go-chore/brainstorm.md"}`

#### Scenario: A brainstorm not yet committed
- **WHEN** `openspec/changes/lets-go-chore/brainstorm.md` exists in the working tree but not in `HEAD`, and `gh` finds no pull request
- **THEN** `disagreements` holds a `dirty-tree` entry, and no `brainstorm-without-pull-request` entry

#### Scenario: Archived with no plan review
- **WHEN** the archived change's `.openspec.yaml` says `schema: lets-standard`, and pull request #167 is ready for review with a `## Code review` section and no `## Plan review` line
- **THEN** `disagreements` is `[{"row":"archive-without-plan-review","found":"no Plan review section"}]`

#### Scenario: A done step with no record
- **WHEN** the change state is `ready`, and the `plan` record is `null` because the clone is shallow and its history starts after the commit that added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `disagreements` holds `{"row":"null-record","found":"plan"}`

#### Scenario: A built change with no plan review
- **WHEN** the change's schema is `lets-standard`, the change state is `all_done`, and the pull request's body has no **Plan review** section
- **THEN** `disagreements` is `[]`, and `done` maps `review-plan` to `false` and `build` to `true`

#### Scenario: Two rows in order
- **WHEN** `git status --porcelain` lists `README.md`, and `openspec/changes/lets-go-chore/` and its archive folder both exist
- **THEN** the `dirty-tree` entry comes before the `change-and-archive` entry

### Requirement: The pull-request key holds the pull request's state
The `pull-request` key SHALL hold the `state` that `gh` prints for the branch's pull request, such as `OPEN`, `MERGED` or `CLOSED`, or `null` when the branch has none. The command SHALL work out the records, the done answers and the disagreements for a merged or closed pull request as for an open one.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets go records lets-go-chore` exits 0, and `pull-request` is `"MERGED"`

#### Scenario: No pull request
- **WHEN** `gh` finds no pull request for the branch `lets-go-chore`
- **THEN** `pull-request` is `null`
