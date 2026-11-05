## RENAMED Requirements
- FROM: `### Requirement: lets-go finds the first unfinished step`
- TO: `### Requirement: lets-go walks the step table`

- FROM: `### Requirement: Review plan is reported as not in the route`
- TO: `### Requirement: Review plan runs as a step, or is not in the route`

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own, under *Start*. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Claim* sets the issue's Status with `gh project item-edit`, so `lets-go` sets that field itself. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. When *Find the source of demand* finds an open blocker, `lets-go` SHALL look for the change's branch before it stops. For that, its blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. When the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. When no such branch exists, the stop stands. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when none matches, the case's stop, to run `lets-shape`, SHALL be set aside: the shape step runs for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* finds that another session took an issue `next` picked, `lets-go` SHALL run `next` again with the same candidates. It SHALL go on from its blocker read with the new issue. On the default branch, when *Confirm the packet* stops with a remedy of running `lets-shape` on #<i>, that stop SHALL be set aside too: the shape step runs for #<i>. It SHALL be set aside once per run: after a shape step, the stop stands. On a change's branch, that stop SHALL stand, because the shape step runs only before any branch exists. The Epic stop SHALL stand. Beside the commands those sections hold, Start SHALL run only:

- `lets go level`, run once when it reads the request, as *lets-go picks the interactivity level and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- `title` beside `blockedBy` in the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- the `git status --porcelain` before the shape step, and the commit of `openspec/discovery.md`, that *lets-go commits the discovery map on the story's branch* says.

Start SHALL not be a step: it SHALL run no `lets delegate step` command of its own and SHALL produce no step report. The shape step it runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. It finds `gh issue view <i> --json createdAt`, `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `gh project item-edit`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` runs `next` again over the same candidates, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and walks the step table there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** *Claim* finds that someone else has the issue
- **THEN** `lets-go` says who has it and stops, and runs no step

#### Scenario: A blocked story on its own branch
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, and the branch `lets-go-story` exists on `origin`
- **THEN** `lets-go` names #149 as an open blocker, switches to `lets-go-story`, and walks the step table there

#### Scenario: A blocked story with no branch
- **WHEN** `lets-go` runs for #152 on the default branch, #149 is open, and no branch `lets-go-story` exists locally or on `origin`
- **THEN** `lets-go` says #149 blocks it, and claims nothing

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** *Confirm the packet* finds two comments after the watermark on #180
- **THEN** `lets-go` runs the shape step for #180 instead of stopping

#### Scenario: The pick names next
- **WHEN** the shape step reports an epic and three stories
- **THEN** `lets-go` runs its own `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the level, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. Review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.` `<p>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body. `lets-go` SHALL find the `## Plan review` heading first, and read the section up to the next `## ` heading or the end of the body. Inside it, `<sha>` SHALL come from the line that starts `Reviewed: `, and `<verdict>` from the line that starts `- **Verdict:** `. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the walk reached review plan with no **Plan review** section in pull request #167, and the review plan step reported `done` with the date `2026-11-05T10:00:00Z` and the evidence `Plan review: APPROVE for 7d16565` and `pull request #167`
- **THEN** `lets-go` prints `Done review plan: 2026-11-05T10:00:00Z. Plan review: APPROVE for 7d16565; pull request #167` before it runs build

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, pull request #167's **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE` and covers the plan, and `git log -1 --format=%as 7d16565` prints `2026-11-03`
- **THEN** `lets-go` prints `Skipped review plan: the Plan review in pull request #167 says APPROVE for 7d16565, committed 2026-11-03.` and runs no review plan step

#### Scenario: A ready change with no review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the state is `ready`, and the pull request's body has no **Plan review** section
- **THEN** the next step to run is review plan, with `--for review-plan`, and build runs only after it reports `done`

#### Scenario: A stale review
- **WHEN** the **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE`, and a later commit changed `design.md` that no rebuttal names
- **THEN** `lets-go` runs the review plan step, whose `lets-review-plan` runs a new round

#### Scenario: The body is read when the row is reached
- **WHEN** the plan step reported `done` in this run, and its brainstorm opened the pull request
- **THEN** `lets-go` reads the body with `gh pr view <name> --json number,body` when it reaches review plan, not from the read before the plan step

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run each when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`. `<name>` is the change's name, and `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. For the shape step, `<name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <name>-<step> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<name>-<step>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `.workspace/lets-go/<name>-<step>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for plan` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for plan --name lets-go-chore-plan` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A run that starts at apply
- **WHEN** the first step the walk finds not done is build
- **THEN** `lets-go` writes no plan prompt and no review plan prompt, and the first `step run` is `--for build`

#### Scenario: An answers file from an interrupted run
- **WHEN** `.workspace/lets-go/lets-go-chore-plan-answers.yaml` exists with one pair before the plan step's first round
- **THEN** that round's `step run` carries `--answers-file .workspace/lets-go/lets-go-chore-plan-answers.yaml`

#### Scenario: An empty answers file
- **WHEN** `.workspace/lets-go/lets-go-chore-plan-answers.yaml` exists and is empty
- **THEN** the first round's `step run` carries no `--answers-file`

#### Scenario: A timeout
- **WHEN** `step run` exits 6
- **THEN** `lets-go` shows the user the meta file, names the step, and stops without running the step again

#### Scenario: The shape step's answers file
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` again after a run stopped, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds two pairs
- **THEN** the shape step's first round carries `--answers-file` with that file

#### Scenario: The review plan step's name
- **WHEN** the walk reaches review plan for the change `lets-go-story` and finds it not done
- **THEN** `lets-go` writes `.workspace/lets-go/lets-go-story-review-plan-prompt.md`, and runs `step run --for review-plan --name lets-go-story-review-plan` with it

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch, the schema and the route line. For the shape step, the issue is `#<i>`, or `none yet` with the idea, and the branch is the default branch. Its schema and route are left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says, and its discovery when the work is too large for one issue, as *The shape step asks before it runs discovery* says. For every other step: invoke the step's skill, as the step table names it, for the change and the issue, and stop where that skill stops. The skills are `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. The prompt SHALL name no other skill, and no section of a skill, for those steps. `lets-plan` takes the route line from the prompt for the proposal's commit message. The prompt SHALL say the interactivity level, and what the `lets-go` session does with it. At `recommend`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same at both levels. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it. For shape, the issue comes first, as `issue #<n>: <title>`, or the parent and the stories, as `epic #<p>: <title>` and `story #<n>: <title>` lines. For review plan, the verdict and the reviewed commit come first, as `Plan review: <verdict> for <sha>`.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `recommend`
- **THEN** the file names `lets-plan`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`, and does not name `openspec-propose`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the level is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-standard`
- **THEN** the file names the `lets-build` skill, says to stop where it stops, and names neither `lets-review-plan` nor `lets-review-build`

#### Scenario: The build prompt on lets-minimal
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-minimal`
- **THEN** the file names `lets-build` and does not name `lets-review-plan`

#### Scenario: The review build prompt
- **WHEN** `lets-go` writes the review build prompt
- **THEN** the file names the `lets-review-build` skill for the change, and names no section of `lets-build`

#### Scenario: The review plan prompt
- **WHEN** `lets-go` writes the review plan prompt for change `lets-go-story`, issue `#152`
- **THEN** the file names the `lets-review-plan` skill for `lets-go-story`, names `#152` and the route line, says the first evidence line is `Plan review: <verdict> for <sha>`, and names no `lets-build`

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: A phase confirmation
- **WHEN** the shape step's discovery needs the user to confirm the journey map
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user at either level

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema and no route, and keeps the `## Questions` and report rules of the other prompts

### Requirement: Review build ends the run
The review build step SHALL run the `lets-review-build` skill. On `lets-standard` that skill reviews the code first. On every flow it then follows the project's finishing rules, verifies, archives, and marks the pull request ready. When it reports `done`, or when the walk of *lets-go walks the step table* found every step done, the walk SHALL have printed one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done`, the step's spoken name, a colon, the report's `date` and its evidence: `Done build: <date>. <evidence>`. Review plan prints the line *Review plan runs as a step, or is not in the route* sets. A failed step prints `Failed`, the spoken name, a colon and the reason: `Failed review build: <reason>`. The spoken name has a space, never a hyphen. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** review build reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, plan, review plan, build and review build, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the review plan step and the build step ran in this run on `lets-standard`, and review build reports `done`
- **THEN** the third line starts `Done review plan: ` and the fourth starts `Done build: `

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done review plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `Interactivity: <level>, because your lets config sets go.level.`
- `lets go level`
- `issue #<n>: <title>`
- `epic #<p>: <title>`
- `story #<n>: <title>`
- `Plan review: <verdict> for <sha>`
- `Run discovery on it?`
- `Picked #<n>: <title>, the first ready story under #<p>.`
- `Picked #<n>: <title>, the next ready issue.`
- `docs: the discovery map from #<p>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
- `--for review-plan`
- `| Step | Skill | Done when | Record | Skip line |`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --format=%as <sha>`
- `gh pr view <name> --json number,body`
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

It SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. It SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. It SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. It SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. It SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

### Requirement: lets-go walks the step table
After Start, on the change's branch, `lets-go` SHALL read the records Git and GitHub keep, in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Then `lets-go` SHALL walk the step table from the top: shape, plan, review plan, build, review build. When it reaches a row, it SHALL read whether that step is done. Shape is done when *Confirm the packet* passed. The plan row and the build row each read the change state when the walk reaches them: `openspec instructions apply --change <name> --json`, run when `openspec/changes/<name>/` exists and there is no archive folder. Plan is done when the `state` is `ready` or `all_done`, or the archive folder exists. Build is done when the `state` is `all_done`, or the archive folder exists. The build row SHALL read the state again, even when the plan row read it, because a review plan round can add a task. Any `state` other than `blocked`, `ready` or `all_done` SHALL show the CLI's `instruction` and stop. Review plan is done as *Review plan runs as a step, or is not in the route* says. Review build is done when the archive folder exists. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL go on to the next row. `lets-go` SHALL read a row's record when it reaches the row, not before, because a step run in this round changes the records the next row reads.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first step the walk runs is plan, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first step the walk runs is plan

#### Scenario: A ready plan
- **WHEN** the state is `ready`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, and runs build after review plan reports `done`

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`, and the pull request's **Plan review** section covers the plan
- **THEN** `lets-go` prints four skip lines, then runs review build

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

#### Scenario: A built change whose review is missing
- **WHEN** the state is `all_done`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, prints `Skipped build: every task is ticked, last task commit <date> (<sha>).` with the last task commit, and runs review build

#### Scenario: A review round adds a task
- **WHEN** the plan row read `all_done`, the review plan step ran in this run, and its `REVISE` round added an unticked task to `tasks.md` before its `APPROVE`
- **THEN** the build row reads the state again, finds `ready`, and runs build instead of printing `Skipped build:`

### Requirement: A skipped step's line carries its evidence and date
Each done step SHALL print one line when the walk reaches its row, in step order. `<date>` SHALL be the author date of the commit named, as `YYYY-MM-DD`, from `git log`'s `%as`. `<sha>` SHALL be its short hash, from `%h`. The step table names each step's record. The lines and their reads are:

- Plan: `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Review plan: `Skipped review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.`, from the **Plan review** section and `git log -1 --format=%as <sha>`, as *Review plan runs as a step, or is not in the route* says.
- Build: `Skipped build: every task is ticked, last task commit <date> (<sha>).`, from `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Review build: `Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review.` Its read is `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<date>-<name>/tasks.md`, with the pull request read earlier. The line is the same on every flow.

The same `git log` commands SHALL date plan and build after archive, because the old path's history holds the add and the ticks. The shape line is set by its own requirement.

#### Scenario: A skipped propose
- **WHEN** commit `2bbc7d0` of 2026-11-03 added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `lets-go` prints `Skipped plan: the plan is ready, tasks.md committed 2026-11-03 (2bbc7d0).`

#### Scenario: A skipped apply
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70` of 2026-11-03
- **THEN** `lets-go` prints `Skipped build: every task is ticked, last task commit 2026-11-03 (3222c70).`

#### Scenario: A skipped apply review
- **WHEN** commit `1d253bd` of 2026-11-04 added `openspec/changes/archive/2026-11-04-lets-go-chore/tasks.md`, and pull request #167 is open and not a draft
- **THEN** `lets-go` prints `Skipped review build: archived 2026-11-04 (1d253bd); pull request #167 is ready for review.`

#### Scenario: A rebased branch
- **WHEN** the branch was rebased after the last task commit, so its committer date is today
- **THEN** the build skip line's date is the commit's author date, not today

#### Scenario: A skipped review build on the minimal flow
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, the archive folder exists, and pull request #167 is ready for review with no `Code review` section
- **THEN** `lets-go` prints the same `Skipped review build:` line, and no disagreement

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

- `git status --porcelain` lists a path outside `.workspace/`;
- the local branch and `origin/<name>` have diverged;
- a change folder and an archive folder exist for the same name;
- an archive folder exists but the pull request is missing or is a draft, or, when the `schema:` line of `openspec/config.yaml` is `lets-standard`, has no `Code review` section;
- an archive folder exists, the schema is not `lets-minimal`, and the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line;
- `openspec/changes/<name>/brainstorm.md` is committed but the branch has no open pull request;
- a `git log` read for a skipped step finds no commit.

A built change that is not archived, and whose pull request has no **Plan review** section, is not a disagreement: the walk reaches review plan before build, and runs it. Once the change is archived, no step can write the section.

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
- **THEN** `lets-go` prints no disagreement, and the first step the walk runs is plan

#### Scenario: A built change with no plan review
- **WHEN** the state is `all_done`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints no `Records disagree:` line, and runs review plan as *lets-go walks the step table* says

#### Scenario: An archived change on the minimal flow
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, the archive folder exists, and the pull request is ready for review with no `Code review` section
- **THEN** `lets-go` prints no disagreement, and runs no step

#### Scenario: An archived change with no plan review
- **WHEN** the change's schema is `lets-standard`, the archive folder exists, and pull request #167 is ready for review with a **Code review** section and no **Plan review** section
- **THEN** `lets-go` prints `Records disagree:`, says the pull request has no Plan review section, and runs no step

#### Scenario: An archived change on the standard flow with no code review
- **WHEN** `openspec/config.yaml` says `schema: lets-standard`, the archive folder exists, and the pull request is ready for review with no `Code review` section
- **THEN** `lets-go` prints `Records disagree:`, says the pull request has no Code review section, and runs no step

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits `openspec/discovery.md` in the working tree on the default branch. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain`. When that lists `openspec/discovery.md`, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line names this input. When one exists, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes it. When none exists, `lets-go` SHALL say the map has uncommitted edits, say to commit or discard them, and stop. The shape step SHALL end on the default branch with the tree clean, except `openspec/discovery.md` when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL commit that file alone on the branch before *lets-go walks the step table* reads the tree. The commit is `git add openspec/discovery.md` and a `docs:` commit whose message is `docs: the discovery map from #<p>`. `<p>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When `openspec/discovery.md` is unchanged, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that `openspec/discovery.md` holds the discovery's map, uncommitted on the default branch. While the parent still says `Discovery status: in-progress`, it SHALL say to leave the map as it is, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard it before the next run, because a run stops on a dirty tree.

#### Scenario: The map is committed
- **WHEN** discovery changed `openspec/discovery.md`, and *Claim* created the branch `plugin-contract`
- **THEN** `lets-go` commits `openspec/discovery.md` alone on `plugin-contract` as `docs: the discovery map from #190`, and `git status --porcelain` then lists no path outside `.workspace/`

#### Scenario: A new map
- **WHEN** the project had no `openspec/discovery.md` and discovery created it
- **THEN** `lets-go` commits the new file the same way

#### Scenario: The run stops before Claim
- **WHEN** no story is ready, and `openspec/discovery.md` is modified
- **THEN** `lets-go` says the map is uncommitted on the default branch, says to commit or discard it before the next run, and commits nothing

#### Scenario: A dirty map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step runs, and no open parent issue for this input says `Discovery status: in-progress`
- **THEN** `lets-go` says the map has uncommitted edits, says to commit or discard them, and runs no step

#### Scenario: A dirty map from the discovery it resumes
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped after Personas was confirmed, `git status --porcelain` lists ` M openspec/discovery.md`, and the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`
- **THEN** `lets-go` runs the shape step, which resumes the parent at the journey map, and the map commit after *Claim* takes the edits

#### Scenario: A later run with no shape step
- **WHEN** the user runs `lets-go #191` after the map was committed by hand, #191's packet is complete, and *Claim* creates the branch
- **THEN** `lets-go` makes no map commit

#### Scenario: A discovery that fits one story
- **WHEN** discovery edited the map and the parent became story #190, and *Claim* created #190's branch
- **THEN** `lets-go` commits the map as `docs: the discovery map from #190`
