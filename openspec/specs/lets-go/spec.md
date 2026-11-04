# lets-go Specification

## Purpose

Says what the `lets-go` skill does for a shaped chore: where it starts, what it skips and how it says so, which interactivity level it picks, how it runs each step and reads its report, how it relays a step's questions to the user, and how the run ends.

## Requirements

### Requirement: lets-go takes one issue number
`lets-go` SHALL take one issue number. On the default branch, when it is given none, it SHALL say that it needs an issue number, and stop. On a change's branch, when it is given none, it SHALL find the issue by the branch name. It SHALL run `gh issue list --state open --search "<branch> in:title" --json number,title` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. It SHALL take the issue as `lets-build`'s *Find the source of demand* takes a named issue, and SHALL name that section rather than restate it.

#### Scenario: No issue number
- **WHEN** the user runs `lets-go` with no issue number on the default branch
- **THEN** `lets-go` says it needs an issue number, and claims nothing

#### Scenario: No issue number on a change's branch
- **WHEN** the user runs `lets-go` with no issue number on the branch `lets-go-chore`, and one open issue's title starts with `lets-go-chore — `
- **THEN** `lets-go` takes that issue as `<i>`

#### Scenario: Two issues match the branch
- **WHEN** two open issues have titles that start with `lets-go-chore — `
- **THEN** `lets-go` says it needs the issue number, and stops

#### Scenario: The number does not match the branch
- **WHEN** the user runs `lets-go` for `#149` on the branch `step-strategy`, and #149's title does not start with `step-strategy — `
- **THEN** `lets-go` says the issue and the branch do not match, and stops

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as `lets-build`'s *Find the source of demand* does for a named issue

### Requirement: lets-go runs on the default branch, for a Chore
`lets-go` SHALL run on the repository's default branch, or on a change's branch. A change's branch is a branch named after the change, whose issue `lets-go` finds as *lets-go takes one issue number* says. On any other branch it SHALL say that `lets-go` runs on the default branch or on a change's branch, and stop. It SHALL run only for an issue whose Kind is Chore. It SHALL check the Kind where `lets-build`'s *Confirm the packet* has just read the issue's fields from the Project, before any later check of that section. For a Story or a Bug it SHALL say that #152 adds those Kinds, point to `lets-build`, and stop. A stop that `lets-build` makes earlier, such as an unresolved glossary prerequisite, SHALL stand as `lets-build` reports it.

#### Scenario: A change's branch
- **WHEN** the current branch is `lets-go-chore`, and issue #149's title starts with `lets-go-chore — `
- **THEN** `lets-go` runs for #149 on that branch, and claims nothing

#### Scenario: A branch with no issue
- **WHEN** the current branch is `fix-typo`, and no open issue's title starts with `fix-typo — `
- **THEN** `lets-go` says it runs on the default branch or on a change's branch, and stops

#### Scenario: A Story
- **WHEN** *Confirm the packet* reads the issue's fields and its Kind is Story
- **THEN** `lets-go` names #152, says to run `lets-build`, reads no parent epic, and claims nothing

### Requirement: Start reuses lets-build
`lets-go` SHALL run `lets-build`'s *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run, by naming those sections. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL add no check of its own to `lets-build`'s sections other than the Kind check. The commands it adds of its own are:

- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go finds the first unfinished step* and *A skipped step's line carries its evidence and date*.

Start SHALL not be a step: it SHALL run no `lets delegate step` command and SHALL produce no step report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route* and *Claim* named as sections of `lets-build`, finds `gh issue view <i> --json createdAt`, and finds no `gh project item-edit` command

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and finds the first unfinished step there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** `lets-build`'s *Claim* finds that someone else has the issue
- **THEN** `lets-go` says who has it and stops, as `lets-build` does, and runs no step

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* passes, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.` `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* fails, `lets-go` SHALL say to run `lets-shape` on #<i>, as `lets-build` does, and stop. It SHALL not run shape as a step.

#### Scenario: An edited packet
- **WHEN** issue `#149`'s body was last edited on 2026-11-04
- **THEN** `lets-go` prints `Skipped shape: #149's packet is complete, last edited 2026-11-04.`

#### Scenario: A packet never edited
- **WHEN** the issue's `lastEditedAt` is null and `gh issue view <i> --json createdAt` says it was created on 2026-11-03
- **THEN** the skip line's date is `2026-11-03`

#### Scenario: A packet with a missing line
- **WHEN** the packet lacks its one-line outcome
- **THEN** `lets-go` says to run `lets-shape` on the issue, prints no skip line, and claims nothing

### Requirement: Propose review is reported as not in the route
When the schema is `lets-minimal`, `lets-go` SHALL print `Skipped propose review: not in the lets-minimal route.` after the propose step is done, and before the apply step. That line SHALL carry no date. When the schema is not `lets-minimal`, and propose is done, `lets-go` SHALL print `Skipped propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).` `<verdict>` SHALL be the value of the `VERDICT:` line in `openspec/changes/<name>/review.md`. `<date>` and `<sha>` SHALL come from `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the propose step reports `done`
- **THEN** `lets-go` prints `Skipped propose review: not in the lets-minimal route.` and goes on to apply

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, propose is done, and `review.md` says `VERDICT: APPROVE_WITH_CHANGES` in commit `7d16565` of 2026-11-03
- **THEN** `lets-go` prints `Skipped propose review: review.md says VERDICT: APPROVE_WITH_CHANGES, committed 2026-11-03 (7d16565).`

### Requirement: lets-go picks the interactivity level and says why
Before the first step, `lets-go` SHALL print `Interactivity: recommend, because #<i> is a Chore.` It SHALL put the level, and what it means for the step, into every step prompt.

#### Scenario: The level line
- **WHEN** issue `#149` is a Chore and Start has claimed it
- **THEN** `lets-go` prints `Interactivity: recommend, because #149 is a Chore.` before it runs propose

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run propose, apply and apply review, in that order, starting at the first unfinished step that *lets-go finds the first unfinished step* found. For each step it SHALL write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`. `<name>` is the change's name, and `<step>` is `propose`, `apply` or `apply-review`. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <name>-<step> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. When `.workspace/lets-go/<name>-<step>-answers.yaml` exists before the step's first round and holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `.workspace/lets-go/<name>-<step>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for propose` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for propose --name lets-go-chore-propose` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A run that starts at apply
- **WHEN** the first unfinished step is apply
- **THEN** `lets-go` writes no propose prompt, and the first `step run` is `--for apply`

#### Scenario: An answers file from an interrupted run
- **WHEN** `.workspace/lets-go/lets-go-chore-propose-answers.yaml` exists with one pair before the propose step's first round
- **THEN** that round's `step run` carries `--answers-file .workspace/lets-go/lets-go-chore-propose-answers.yaml`

#### Scenario: An empty answers file
- **WHEN** `.workspace/lets-go/lets-go-chore-propose-answers.yaml` exists and is empty
- **THEN** the first round's `step run` carries no `--answers-file`

#### Scenario: A timeout
- **WHEN** `step run` exits 6
- **THEN** `lets-go` shows the user the meta file, names the step, and stops without running the step again

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session, and may write files. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<name>-<step>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<name>-<step>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for apply` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-apply.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch and the schema. It SHALL say what to run. For propose: the `openspec-propose` skill for the change, for the issue, with the route line. It continues the change when it already exists, and does not offer the handoff. For apply: the `lets-build` skill on the branch. It stops when every task is ticked, and does not finish the change. For apply review: the *Finish the change* section of the `lets-build` skill. The prompt SHALL say the interactivity level. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section: each answer settles its question; an answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`; an answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`
- **THEN** the file names `openspec-propose`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the apply prompt
- **THEN** the file says to stop when every task is ticked, and not to run *Finish the change*

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

### Requirement: lets-go relays a needs-input report at the recommend level
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

#### Scenario: A mixed report
- **WHEN** the propose step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for propose` again with `--answers-file .workspace/lets-go/lets-go-chore-propose-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. On a `failed` report it SHALL show the reason, name the step and the branch, say that running `lets-build` on the branch carries on, and stop. It SHALL not run a failed step again.

#### Scenario: A failed apply
- **WHEN** the apply step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `apply` and the branch, says to run `lets-build` on the branch, and runs no apply review

#### Scenario: A repeated question
- **WHEN** the resumed propose step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

### Requirement: Apply review ends the run
The apply review step SHALL run `lets-build`'s *Finish the change*: the project's finishing rules, verify, archive, and marking the pull request ready. When it reports `done`, or when *lets-go finds the first unfinished step* found every step done, `lets-go` SHALL print one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done <step>: <date>` followed by the report's evidence. A failed step prints `Failed <step>: <reason>`. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** apply review reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, propose, propose review, apply and apply review, then the pull request's URL

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped propose review: not in the lets-minimal route.`
- `Skipped propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Skipped apply: every task is ticked, last task commit <date> (<sha>).`
- `Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`
- `Records disagree:`
- `Interactivity: recommend, because #<i> is a Chore.`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<name>-<step>-prompt.md`
- `.workspace/lets-go/<name>-<step>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<name>-<step>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists

### Requirement: lets-go ships in both flows as an entry point
Both flows in `flows.json` SHALL ship `lets-go`. The routing table in `overlays/AGENTS.md` SHALL hold a row whose request is `Take a shaped chore to a ready pull request in one run` and whose answer is `The \`lets-go\` skill`, in that table's form. The README's usage table SHALL hold a row with the same request and the answer `\`lets-go\``, in that table's form. The skill-interfaces test SHALL count `lets-go` as an entry point, which no schema, config or skill needs to name.

#### Scenario: The flows
- **WHEN** the skill-interfaces test reads `flows.json`
- **THEN** `standard` and `minimal` both list `lets-go` in `skills`

#### Scenario: The routing rows
- **WHEN** the skill-interfaces test reads `overlays/AGENTS.md` and `README.md`
- **THEN** each holds a row whose request is `Take a shaped chore to a ready pull request in one run` and whose answer names `lets-go`

### Requirement: lets-go finds the first unfinished step
After Start, on the change's branch, `lets-go` SHALL find the first unfinished step from the records Git and GitHub keep, and SHALL run the steps from there. It SHALL read the records in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Fourth, `openspec instructions apply --change <name> --json`, read as `lets-build`'s *Find where you are* reads it. No change folder, or `state` `blocked`, means propose is the first unfinished step. `ready` means apply. `all_done` means apply review. Any other `state` SHALL show the CLI's `instruction` and stop. Shape SHALL count as done when *Confirm the packet* passed. Propose review SHALL count as done when propose is done.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first unfinished step is propose, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first unfinished step is propose

#### Scenario: A ready plan
- **WHEN** the state is `ready`
- **THEN** the first unfinished step is apply, and `lets-go` prints the shape, propose and propose review skip lines before it

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`
- **THEN** the first unfinished step is apply review, and `lets-go` prints four skip lines before it

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

### Requirement: A skipped step's line carries its evidence and date
Each skipped step SHALL print one line, in step order, before the first step that runs. `<date>` SHALL be the author date of the commit named, as `YYYY-MM-DD`, from `git log`'s `%as`. `<sha>` SHALL be its short hash, from `%h`. The lines and their reads are:

- Propose: `Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Apply: `Skipped apply: every task is ticked, last task commit <date> (<sha>).`, from `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Apply review: `Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<date>-<name>/tasks.md` and the pull request read earlier.

The same `git log` commands SHALL date propose and apply after archive, because the old path's history holds the add and the ticks. The shape line and the propose review line are set by their own requirements.

#### Scenario: A skipped propose
- **WHEN** commit `2bbc7d0` of 2026-11-03 added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `lets-go` prints `Skipped propose: the plan is ready, tasks.md committed 2026-11-03 (2bbc7d0).`

#### Scenario: A skipped apply
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70` of 2026-11-03
- **THEN** `lets-go` prints `Skipped apply: every task is ticked, last task commit 2026-11-03 (3222c70).`

#### Scenario: A skipped apply review
- **WHEN** commit `1d253bd` of 2026-11-04 added `openspec/changes/archive/2026-11-04-lets-go-chore/tasks.md`, and pull request #167 is open, not a draft, with a `Code review` section
- **THEN** `lets-go` prints `Skipped apply review: archived 2026-11-04 (1d253bd); pull request #167 is ready for review with a Code review section.`

#### Scenario: A rebased branch
- **WHEN** the branch was rebased after the last task commit, so its committer date is today
- **THEN** the apply skip line's date is the commit's author date, not today

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

- `git status --porcelain` lists a path outside `.workspace/`;
- the local branch and `origin/<name>` have diverged;
- a change folder and an archive folder exist for the same name;
- an archive folder exists but the pull request is missing, is a draft, or has no `Code review` section;
- `openspec/changes/<name>/brainstorm.md` is committed but the branch has no open pull request;
- a `git log` read for a skipped step finds no commit.

#### Scenario: A dirty tree
- **WHEN** `git status --porcelain` lists `skills/lets-go/SKILL.md`
- **THEN** `lets-go` prints `Records disagree:`, names the path, says to commit or discard it, and runs no step

#### Scenario: A diverged branch
- **WHEN** the local branch `lets-go-chore` and `origin/lets-go-chore` each have a commit the other lacks
- **THEN** `lets-go` prints `Records disagree:`, says the branch and `origin` have diverged, and runs no step

#### Scenario: Archived, but the pull request is a draft
- **WHEN** the archive folder exists and `gh pr view` says `isDraft` is `true`
- **THEN** `lets-go` prints `Records disagree:`, says the change is archived but the pull request is a draft, and runs no step

#### Scenario: A committed brainstorm with no pull request
- **WHEN** `openspec/changes/lets-go-chore/brainstorm.md` is committed, the state is `blocked`, and `gh pr view lets-go-chore` finds no pull request
- **THEN** `lets-go` prints `Records disagree:`, says the brainstorm is committed but the branch has no pull request, and runs no step

#### Scenario: A read that finds no commit
- **WHEN** the state is `ready`, the tree is clean, and `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md` prints nothing
- **THEN** `lets-go` prints `Records disagree:`, names that command, and runs no step

#### Scenario: A new branch with no pull request
- **WHEN** the branch has no change folder and no pull request
- **THEN** `lets-go` prints no disagreement, and the first unfinished step is propose

### Requirement: A closed pull request ends the run
When the pull request's `state` is `MERGED`, `lets-go` SHALL say the change is merged and the run is finished, and stop. When its `state` is `CLOSED`, `lets-go` SHALL say the change was rejected and there is nothing to resume, and stop. Neither SHALL count as a disagreement, and neither SHALL run a step.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets-go` says the change is merged, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `CLOSED`
- **THEN** `lets-go` says the change was rejected, and runs no step
