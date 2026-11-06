# lets-go Specification

## Purpose

Says what the `lets-go` skill does for a shaped Chore, Bug or Story, or for an idea in words: where it starts, how it shapes an idea or an unshaped issue, how it runs discovery for a large idea and picks the first ready story, what it skips and how it says so, which interactivity level it picks, how it runs each step and reads its report, how it relays a step's questions to the user, and how the run ends.

## Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own, under *Start*. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Claim* sets the issue's Status with `gh project item-edit`, so `lets-go` sets that field itself. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. When a blocker is open, `lets-go` SHALL look for the change's branch before it stops. When the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue, and the prerequisite stop SHALL stand: an unresolved owner or checkpoint is reported, and the run stops. When no such branch exists, `lets-go` SHALL say which open issues block it, and stop. The named-issue case of *Find the source of demand* SHALL make no blocker stop of its own, because the blocker read has decided. When *Find the source of demand* passes, Start's next step SHALL say what comes next, not the section. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when none matches, the case's stop, to run `lets-shape`, SHALL be set aside: the shape step runs for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* finds that another session took an issue `next` picked, `lets-go` SHALL run `next` again with the same candidates. It SHALL go on from its blocker read with the new issue. On the default branch, when *Confirm the packet* stops with a remedy of running `lets-shape` on #<i>, that stop SHALL be set aside too: the shape step runs for #<i>. It SHALL be set aside once per run: after a shape step, the stop stands. On a change's branch, that stop SHALL stand, because the shape step runs only before any branch exists. The Epic stop SHALL stand. Beside the commands those sections hold, Start SHALL run only:

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

#### Scenario: A stacked story with an unresolved prerequisite
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, the branch `lets-go-story` exists on `origin`, and #152's **Glossary handoff** names #150 as the owner of its definitions, and #150's pull request has not merged
- **THEN** `lets-go` names #149 as an open blocker, reports that #150 owns the definitions and has not merged, and stops, and runs no step

#### Scenario: The blocker rule comes before the call
- **WHEN** the skill-interfaces test reads *Start* in `skills/lets-go/SKILL.md`
- **THEN** it finds `gh issue view <i> --json title,blockedBy` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

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

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* passes, and no shape step ran in this run, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.` `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* passes after a shape step reported `done` in this run, `lets-go` SHALL print `Done shape: <date>. <evidence>` instead, with the report's `date` and its `evidence` joined with `; `. When *Confirm the packet* fails with a remedy of running `lets-shape` on #<i>, `lets-go` SHALL run the shape step, as *The shape step shapes an idea or an unshaped issue* says, and print no skip line.

#### Scenario: An edited packet
- **WHEN** issue `#149`'s body was last edited on 2026-11-04
- **THEN** `lets-go` prints `Skipped shape: #149's packet is complete, last edited 2026-11-04.`

#### Scenario: A packet never edited
- **WHEN** the issue's `lastEditedAt` is null and `gh issue view <i> --json createdAt` says it was created on 2026-11-03
- **THEN** the skip line's date is `2026-11-03`

#### Scenario: A packet with a missing line
- **WHEN** the packet lacks its one-line outcome
- **THEN** `lets-go` prints no skip line, and runs the shape step for the issue

#### Scenario: A packet the shape step wrote
- **WHEN** the shape step reported `done` in this run with the date `2026-11-05T09:30:00Z`, and *Confirm the packet* passes for the issue it named
- **THEN** `lets-go` prints `Done shape: 2026-11-05T09:30:00Z.` followed by the report's evidence, and no `Skipped shape` line

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the level, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. Review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.` `<pr>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body. `lets-go` SHALL find the `## Plan review` heading first, and read the section up to the next `## ` heading or the end of the body. Inside it, `<sha>` SHALL come from the line that starts `Reviewed: `, and `<verdict>` from the line that starts `- **Verdict:** `. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

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

### Requirement: lets-go picks the interactivity level and says why
In *Start*, when it reads the request and before it asks GitHub for anything, `lets-go` SHALL run `lets go level` from the repo root, once per run. When the command exits non-zero, `lets-go` SHALL show the user its stderr and stop. It SHALL then claim nothing and run no step. Otherwise it SHALL keep the `level` the command printed for the whole run. Each time it picks the level, it SHALL take the first of these that is set. First, the level the user named in the request. Then the kept `level`, when it is not `null`. Then the Kind's default: `recommend` for a Chore or a Bug, `ask` for a Story. It SHALL print the line for the source it used. For the request's level: `Interactivity: <level>, because you asked for it.` For the config's: `Interactivity: <level>, because your lets config sets go.level.` For the Kind's: `Interactivity: <level>, because #<i> is a <Kind>.` Before a shape step, the Kind is not settled. The level for the shape step SHALL be the request's, when named; else the config's, when set; else `ask`. In that last case the line SHALL read `Interactivity: ask, because shape has not run yet.` After the shape step, `lets-go` SHALL pick the level again, in the same order, and print its line. `lets-go` SHALL never ask the user which level to use. The level SHALL hold for the whole run and SHALL not be kept for a later run. It SHALL put the level, and what it means for the step, into every step prompt.

#### Scenario: The level line
- **WHEN** issue `#149` is a Chore and Start has passed
- **THEN** `lets-go` prints `Interactivity: recommend, because #149 is a Chore.` before it runs plan

#### Scenario: A Story
- **WHEN** issue `#152` is a Story and Start has passed
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.` before it runs plan

#### Scenario: A Bug
- **WHEN** the issue is a Bug
- **THEN** `lets-go` prints `Interactivity: recommend, because #<i> is a Bug.` with the issue's number

#### Scenario: The user names the level
- **WHEN** the user runs `lets-go` for `#152`, a Story, and says `recommend`
- **THEN** `lets-go` prints `Interactivity: recommend, because you asked for it.` and relays at `recommend`

#### Scenario: A later run
- **WHEN** an earlier run of `lets-go` for `#152` ran at `recommend` because the user said so, and the user runs `lets-go` for `#152` again without naming a level
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.`

#### Scenario: The shape step's level
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` without naming a level
- **THEN** `lets-go` prints `Interactivity: ask, because shape has not run yet.` before the shape step, and relays its questions at `ask`

#### Scenario: The level after shape
- **WHEN** the shape step wrote `#181` as a Chore, and the user named no level
- **THEN** `lets-go` prints `Interactivity: recommend, because #181 is a Chore.` before it runs plan

#### Scenario: A named level holds through shape
- **WHEN** the user runs `lets-go recommend add a --quiet flag to lets sync`, and the shape step writes a Story
- **THEN** `lets-go` prints `Interactivity: recommend, because you asked for it.` before the shape step and again before plan

#### Scenario: The config sets the level
- **WHEN** the `lets` config holds `go.level: recommend`, issue `#152` is a Story, the user named no level, and Start has passed
- **THEN** `lets-go` prints `Interactivity: recommend, because your lets config sets go.level.` before it runs plan, and relays at `recommend`

#### Scenario: The request's level beats the config's
- **WHEN** the `lets` config holds `go.level: recommend`, and the user runs `lets-go` for `#152`, a Story, and says `ask`
- **THEN** `lets-go` prints `Interactivity: ask, because you asked for it.`

#### Scenario: The config's level before shape
- **WHEN** the `lets` config holds `go.level: recommend`, and the user runs `lets-go add a --quiet flag to lets sync` without naming a level
- **THEN** `lets-go` prints `Interactivity: recommend, because your lets config sets go.level.` before the shape step, and again before plan

#### Scenario: The config holds no level
- **WHEN** `lets go level` prints `{"level":null}`, issue `#152` is a Story, and the user named no level
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.`

#### Scenario: lets go level fails
- **WHEN** the `lets` config holds `go.level: loud`, and the user runs `lets-go` for `#152`
- **THEN** `lets-go` shows the user the command's stderr, which names `go.level`, claims nothing, and runs no step

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run each when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

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

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session, and may write files. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<session>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch, the schema and the route line. For the shape step, the issue is `#<i>`, or `none yet` with the idea, and the branch is the default branch. Its schema and route are left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says, and its discovery when the work is too large for one issue, as *The shape step asks before it runs discovery* says. For every other step: invoke the step's skill, as the step table names it, for the change and the issue, and stop where that skill stops. The skills are `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. The prompt SHALL name no other skill, and no section of a skill, for those steps. `lets-plan` takes the route line from the prompt for the proposal's commit message. The prompt SHALL say the interactivity level, and what the `lets-go` session does with it. At `recommend`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same at both levels. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it. For shape, the issue comes first, as `issue #<i>: <title>`, or the parent and the stories, as `epic #<parent>: <title>` and `story #<story>: <title>` lines. For review plan, the verdict and the reviewed commit come first, as `Plan review: <verdict> for <sha>`.

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

### Requirement: lets-go relays a needs-input report at the recommend level
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<session>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

#### Scenario: A mixed report
- **WHEN** the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for plan` again with `--answers-file .workspace/lets-go/lets-go-chore-plan-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. On a `failed` report it SHALL show the reason, name the step and the branch, and stop. It SHALL say that running `lets-go` again on the branch carries on from the first unfinished step. For a failed shape step there is no branch: it SHALL say to run `lets-shape` on the idea or the issue instead. It SHALL not run a failed step again in the same run.

#### Scenario: A failed apply
- **WHEN** the build step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `build` and the branch, says to run `lets-go` again on the branch, and runs no review build

#### Scenario: A repeated question
- **WHEN** the resumed plan step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

#### Scenario: A failed shape
- **WHEN** the shape step reports `failed`
- **THEN** `lets-go` prints `Failed shape:` with the reason, says to run `lets-shape`, names no branch, and runs no plan

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
`skills/lets-go/SKILL.md`, or a file in `skills/lets-go/references/`, SHALL hold each of these strings, so the skill-interfaces test can check them. A string may wrap across lines. `## Placeholders` SHALL be in `SKILL.md` itself, as *Each placeholder in lets-go names one thing* says:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done review plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `Interactivity: <level>, because your lets config sets go.level.`
- `lets go level`
- `issue #<i>: <title>`
- `epic #<parent>: <title>`
- `story #<story>: <title>`
- `Plan review: <verdict> for <sha>`
- `Run discovery on it?`
- `Picked #<i>: <title>, the first ready story under #<parent>.`
- `Picked #<i>: <title>, the next ready issue.`
- `docs: the discovery map from #<parent>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
- `--for review-plan`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --format=%as <sha>`
- `gh pr view <name> --json number,body`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<session>-prompt.md`
- `.workspace/lets-go/<session>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<session>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`
- `## Placeholders`
- `<shape-name>`
- `<session>`

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The step table header changes
- **WHEN** the step table's header no longer reads `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the fixed-lines check still passes

### Requirement: lets-go ships in both flows as an entry point
Both flows in `flows.json` SHALL ship `lets-go` and `lets-plan`. The routing table in `overlays/AGENTS.md` SHALL hold a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run`, and a row whose request is `Start the next story, or move the current branch's change on`. Each row's answer SHALL be `The \`lets-go\` skill`, in that table's form. The README's usage table SHALL hold a row with the first request, and a row whose request is `Start the next story, or carry on the change on your current branch`, each with the answer `\`lets-go\``, in that table's form. Neither table SHALL keep a row whose request is `Take a shaped story, bug or chore to a ready pull request in one run`, and neither SHALL point a row at `lets-build`. The `lets-shape` rows SHALL stay: shaping alone is still a request. The skill-interfaces test SHALL count `lets-go` as an entry point, which no schema, config or skill needs to name.

#### Scenario: The flows
- **WHEN** the skill-interfaces test reads `flows.json`
- **THEN** `standard` and `minimal` both list `lets-go` and `lets-plan` in `skills`

#### Scenario: The routing rows
- **WHEN** the skill-interfaces test reads `overlays/AGENTS.md` and `README.md`
- **THEN** each holds a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run` and whose answer names `lets-go`. Each holds its next-story row with the answer `lets-go`. Neither holds the row without the idea, or a row that names `lets-build`

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
- Review plan: `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`, from the **Plan review** section and `git log -1 --format=%as <sha>`, as *Review plan runs as a step, or is not in the route* says.
- Build: `Skipped build: every task is ticked, last task commit <date> (<sha>).`, from `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Review build: `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.` Its read is `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<date>-<name>/tasks.md`, with the pull request read earlier. The line is the same on every flow.

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

### Requirement: A closed pull request ends the run
When the pull request's `state` is `MERGED`, `lets-go` SHALL say the change is merged and the run is finished, and stop. When its `state` is `CLOSED`, `lets-go` SHALL say the change was rejected and there is nothing to resume, and stop. Neither SHALL count as a disagreement, and neither SHALL run a step.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets-go` says the change is merged, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `CLOSED`
- **THEN** `lets-go` says the change was rejected, and runs no step

### Requirement: lets-go runs for a Chore, a Bug or a Story
`lets-go` SHALL run on the repository's default branch, or on a change's branch. A change's branch is a branch named after the change, whose issue `lets-go` finds as *lets-go takes one issue number or an idea* says. On any other branch it SHALL say that `lets-go` runs on the default branch or on a change's branch, and stop. It SHALL run for an issue whose Kind is Chore, Bug or Story, and for an idea or an unshaped issue, which the shape step turns into one. It SHALL add no Kind check of its own: an Epic stops where *Confirm the packet* says an epic is built through its stories. For a Story with a parent, it SHALL read the parent's **Shared decisions** as *Confirm the packet* says, because *Route* needs them. A stop that one of *Start*'s sections makes, such as an unresolved glossary prerequisite, SHALL stand as that section reports it. The exceptions are the open-blocker stop and the `lets-shape` stops that *Start finds, confirms, routes and claims the issue* sets aside.

#### Scenario: A change's branch
- **WHEN** the current branch is `lets-go-chore`, and issue #149's title starts with `lets-go-chore — `
- **THEN** `lets-go` runs for #149 on that branch, and claims nothing

#### Scenario: A Story
- **WHEN** *Confirm the packet* reads the issue's fields and its Kind is Story, and the issue has a parent
- **THEN** `lets-go` reads the parent's **Shared decisions**, runs *Route*, and goes on to the first step

#### Scenario: A Bug
- **WHEN** the issue's Kind is Bug and its packet has every Bug line
- **THEN** `lets-go` goes on to *Route* without reading a parent

#### Scenario: An Epic
- **WHEN** the issue's Kind is Epic
- **THEN** `lets-go` stops as *Confirm the packet* says, lists the epic's open sub-issues, and claims nothing

#### Scenario: A branch with no issue
- **WHEN** the current branch is `fix-typo`, and no open issue's title starts with `fix-typo — `
- **THEN** `lets-go` says it runs on the default branch or on a change's branch, and stops

#### Scenario: A glossary prerequisite still stops
- **WHEN** the issue's **Glossary handoff** names an owner whose pull request has not merged
- **THEN** `lets-go` stops as *Check the prerequisite* says, and runs no step

### Requirement: lets-go relays a needs-input report at the ask level
At the `ask` level, when a report's outcome is `needs-input`, `lets-go` SHALL ask the user every question, one at a time, in the report's order. It SHALL wait for each answer before the next question. For a question with a `recommendation`, it SHALL show the recommendation as the suggested answer. It SHALL write each answer as the user gave it, even when the user took the recommendation. It SHALL add no ` (lets-go accepted the step's recommendation; the user did not decide)` marker. It SHALL append every pair, in order, to `.workspace/lets-go/<session>-answers.yaml`. It SHALL then run the step again, as *lets-go relays a needs-input report at the recommend level* says.

#### Scenario: A recommended question at ask
- **WHEN** the level is `ask` and the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`
- **THEN** `lets-go` asks the user `Which schema?`, shows `lets-minimal` as the suggested answer, and writes the user's answer with no marker

#### Scenario: The user takes the recommendation at ask
- **WHEN** the level is `ask` and the user answers a recommended question with the recommendation
- **THEN** the answers file holds the recommendation as the answer, with no marker, so the step records it as `User`

#### Scenario: A confirmation at ask
- **WHEN** the level is `ask` and the report holds `Do you confirm the ledger?` with no recommendation
- **THEN** `lets-go` asks the user that question alone, as it does at `recommend`

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. A request names an issue when it holds `#<i>` or is a bare number. A leading or trailing `ask` or `recommend` names the level and SHALL not count as part of the idea. On the default branch, every other request with words SHALL be the idea, kept word for word. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank and its *Check the prerequisite* on each candidate. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When no candidate is ready, it SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `gh issue list --state open --search "<branch> in:title" --json number,title` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

#### Scenario: Neither a number nor words
- **WHEN** the user runs `lets-go` alone on the default branch, and `next` finds `#149 lets-go-chore — ...` as the first ready issue
- **THEN** `lets-go` prints `Picked #149: lets-go-chore — ..., the next ready issue.` and goes on to its blocker read with #149

#### Scenario: Nothing is ready
- **WHEN** the user runs `lets-go` alone on the default branch, and no Todo issue is unassigned, unblocked and ready
- **THEN** `lets-go` says the backlog has nothing ready, suggests `lets-shape`, and claims nothing

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as *Find the source of demand* does for a named issue

#### Scenario: An idea
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on the default branch
- **THEN** `lets-go` takes `add a --quiet flag to lets sync` as the idea, and searches for an existing issue as *Find the source of demand* does for described work

#### Scenario: An idea with a level
- **WHEN** the user runs `lets-go recommend add a --quiet flag to lets sync` on the default branch
- **THEN** the idea is `add a --quiet flag to lets sync`, and the level is `recommend`

#### Scenario: No issue number on a change's branch
- **WHEN** the user runs `lets-go` with no issue number on the branch `lets-go-chore`, and one open issue's title starts with `lets-go-chore — `
- **THEN** `lets-go` takes that issue as `<i>`

#### Scenario: Two issues match the branch
- **WHEN** two open issues have titles that start with `lets-go-chore — `
- **THEN** `lets-go` says it needs the issue number, and stops

#### Scenario: The number does not match the branch
- **WHEN** the user runs `lets-go` for `#149` on the branch `step-strategy`, and #149's title does not start with `step-strategy — `
- **THEN** `lets-go` says the issue and the branch do not match, and stops

#### Scenario: Words on a change's branch
- **WHEN** the user runs `lets-go fix the typo in the README` on the branch `lets-go-chore`
- **THEN** `lets-go` says an idea needs the default branch, runs no step, and stops

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* stops on the default branch with a remedy of running `lets-shape` on `#<i>`. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a stop that *Confirm the packet* makes SHALL stand. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The shape prompt SHALL say to run `lets-shape`'s *Shape one issue* to its end, including its second comment fetch, its reply, and its glossary handoff. For an idea, it SHALL give the idea word for word. It SHALL say that Start has searched and the user confirmed no open issue is the same work, so the step skips the search and creates the issue. For an existing issue, it SHALL name `#<i>` and say to shape it. It SHALL say to create no change and no change branch, and to end on the default branch with a clean tree, except `openspec/discovery.md` when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. It SHALL say that the packet confirmation is a confirmation question, with no recommendation. It SHALL say what the first evidence line of a `done` report is: `issue #<i>: <title>` for one issue. When discovery filed stories, it is `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. It SHALL say that work too large for one issue, Size L or XL, or an input that holds a large idea, ends the round with the discovery question, as *The shape step asks before it runs discovery* says. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `<shape-name>` is `idea-fix-letssync-quiet-output`: the dash alone is dropped, and four words are all there are

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`
- **THEN** the file names `lets-shape`, holds `add a --quiet flag to lets sync`, says the search has run and to create the issue, says to run *Shape one issue* to its end and finish on the default branch with a clean tree, and says the first evidence line is `issue #<i>: <title>`

#### Scenario: The shape prompt names discovery
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file holds `Run discovery on it?`, `epic #<parent>: <title>`, `story #<story>: <title>`, `Discovery status: in-progress` and `openspec/discovery.md`, and does not say to end with a failed report for a too-large idea

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` before it writes the prompt, and the first round carries no `--answers-file`

#### Scenario: Confirm the packet stops after shape
- **WHEN** the shape step reported `done` for #181 in this run, and *Confirm the packet* then finds no Kind for #181
- **THEN** `lets-go` stops as `lets-build` does, says to run `lets-shape` on #181, and runs no second shape step

#### Scenario: An issue with no packet
- **WHEN** the user runs `lets-go` for `#180`, and *Confirm the packet* finds no Kind for it
- **THEN** `lets-go` runs the shape step with `--name issue-180-shape`, and its prompt says to shape #180

#### Scenario: The shape step is done
- **WHEN** the shape step reports `done` with the first evidence line `issue #181: lets-sync-quiet — lets sync takes a --quiet flag` and the date `2026-11-05T09:30:00Z`
- **THEN** `lets-go` takes `#181` as `<i>`, reads its blockers, and confirms its packet. It prints `Done shape: 2026-11-05T09:30:00Z. issue #181: lets-sync-quiet — lets sync takes a --quiet flag`, and goes on to *Route*

#### Scenario: A done report that names no issue
- **WHEN** the shape step reports `done` and its first evidence line is `created the issue`
- **THEN** `lets-go` treats the step as `failed`, with a reason that says the shape step named no issue, and stops

#### Scenario: An idea too large for one issue
- **WHEN** the shape step sizes the idea XL
- **THEN** it ends the round with the discovery question instead of a `failed` report, and `lets-go` prints no `Failed shape:` line

#### Scenario: An issue that holds a large idea
- **WHEN** the user runs `lets-go` for `#180`, whose body is a two-page vision with no packet, and the shape step finds it holds a large idea
- **THEN** the step's report is `needs-input` with the discovery question, and on `yes` discovery runs with #180 as its input, which stays open as `lets-shape` leaves it

#### Scenario: The shape step in a subagent
- **WHEN** `step run --for shape` exits 3 and its stderr names `.workspace/lets-delegate/idea-add-a-quiet-flag-to-shape.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file on the default branch, and reads its `step-report` block

### Requirement: The shape step asks before it runs discovery
The shape step SHALL NOT fail, and SHALL NOT start discovery on its own, when it finds the work too large for one issue. Too large means Size L or XL, or an input that holds a large idea. It SHALL end its round with a `needs-input` report that holds the question `The work is Size <L or XL>, too large for one issue. Run discovery on it?` with the recommendation `yes`. `lets-go` SHALL relay that question as it relays any other, at the run's level. When the answer is `yes`, the resumed step SHALL run `lets-shape`'s discovery with the idea or #<i> as its input. It SHALL run every phase from Ingest to Finalize, including the glossary handoff. Each phase's confirmation, and the story table in Phase 5, SHALL be a confirmation question with no recommendation. The parent's `Input:` line SHALL hold the idea's words for an idea, or `#<i>` for an issue, so a later round can match it. When the answer is anything but `yes`, the step SHALL end with a `failed` report that says the work is too large for one issue and discovery was declined. The step SHALL create no change and no change branch; the parent issue, the stories and a glossary holding branch are `lets-shape`'s own.

The shape prompt SHALL say all of this. It SHALL order the step's entry points, so a fresh round does not re-enter *Shape one issue*. First: when an open parent issue says `Discovery status: in-progress` and its `Input:` line names this input, run *Resume mode* on it, and start no second run. Second: when an open parent issue's `Input:` line names this input, it has no status line, and the `## Answers` section confirmed its Phase 5 story table, Finalize has started on it, because Finalize removes the status line before it asks its own questions. Finish Finalize on that parent, including the glossary handoff, and start no second run. Third: when the `## Answers` section answers the discovery question with `yes`, run discovery from Ingest. Otherwise: run *Shape one issue*. It SHALL say that the phases the `## Answers` section confirmed are settled, so *Resume mode* goes straight to the parent's recorded next phase and asks no confirmation of its restatement. It SHALL recommend the first story in dependency order as the owner of glossary edits made in discovery.

#### Scenario: A too-large idea asks
- **WHEN** the shape step for the idea `rewrite the backlog around a plugin model` sizes it XL
- **THEN** its report is `needs-input`, with the question `The work is Size XL, too large for one issue. Run discovery on it?` and the recommendation `yes`, and the step has created no issue

#### Scenario: The user says yes
- **WHEN** the answers file holds that question with the answer `yes`, and no parent issue says `Discovery status: in-progress`
- **THEN** the resumed step runs discovery from Ingest with the idea as its input, and ends its next round with Ingest's questions and the parent issue's confirmation, which has no recommendation

#### Scenario: A resumed round finds the parent
- **WHEN** the idea is `rewrite the backlog around a plugin model`, the answers file holds the discovery question answered `yes` and Ingest's confirmation, and the open parent issue `Epic: plugin backlog` says `Discovery status: in-progress — next phase: moscow` with `Input: rewrite the backlog around a plugin model`
- **THEN** the resumed step resumes that parent at MoSCoW, asks no confirmation of where discovery stopped, and creates no second parent

#### Scenario: A resumed round for an issue
- **WHEN** the shape step is for `#180`, and an open parent issue says `Discovery status: in-progress` with `Input: #180`
- **THEN** the resumed step resumes that parent, and does not shape #180 as one issue

#### Scenario: The prompt orders the entry points
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file names *Resume mode* first, Finalize on a parent with no status line second, discovery from Ingest third, and *Shape one issue* otherwise, and says a confirmed phase is settled

#### Scenario: A round during Finalize
- **WHEN** the answers file holds the discovery question answered `yes` and the Phase 5 story table confirmed, and the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, because Finalize removed it before the glossary handoff asked who carries the edits
- **THEN** the resumed step finishes Finalize on that parent with the handoff's answer, and does not run discovery from Ingest or create a second parent

#### Scenario: The user declines
- **WHEN** the answers file holds that question with the answer `no`
- **THEN** the step ends `failed`, with a reason that says the work is too large for one issue and discovery was declined, and `lets-go` prints `Failed shape:` with it

#### Scenario: At recommend
- **WHEN** the user ran `lets-go recommend` with the idea, and the shape step reports the discovery question
- **THEN** `lets-go` answers `yes` itself, tells the user, and runs the step again with the answers file

### Requirement: The shape report names the parent and the stories
When discovery filed stories, the shape step's `done` report SHALL hold, as its first evidence line, `epic #<parent>: <title>`, with the parent issue's number and title. It SHALL then hold one line per story, `story #<story>: <title>`, in the order the stories were created. When discovery found that the whole run fits one story, so the parent became that story, the first evidence line SHALL be `issue #<i>: <title>`, as for one issue. `lets-go` SHALL read `<parent>` and each `<story>` from those lines. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. A `done` report whose first line is an `epic` line and that holds no `story` line SHALL count as `failed`, with a reason that says the shape step named no story. The `Done shape: <date>. <evidence>` line SHALL carry those lines as its evidence.

#### Scenario: A discovery with three stories
- **WHEN** the shape step reports `done` with the evidence `epic #190: Epic: plugin backlog`, `story #191: plugin-contract — ...`, `story #192: plugin-github — ...` and `story #193: plugin-docs — ...`
- **THEN** `lets-go` takes `190` as the parent and `191`, `192` and `193` as the stories, and prints `Done shape: <date>. epic #190: Epic: plugin backlog; story #191: ...; story #192: ...; story #193: ...`

#### Scenario: A discovery that fits one story
- **WHEN** discovery found the run fits one story and retitled the parent `plugin-contract — ...`, and the report's first evidence line is `issue #190: plugin-contract — ...`
- **THEN** `lets-go` takes `#190` as `<i>`, picks no story, and goes on as for an issue number

#### Scenario: An epic with no stories
- **WHEN** the report's evidence is the one line `epic #190: Epic: plugin backlog`
- **THEN** `lets-go` treats the step as `failed`, with a reason that says the shape step named no story, and stops

### Requirement: lets-go picks the first ready story
After a shape report that names a parent and stories, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case's two commands SHALL run as the section writes them. So SHALL its rank, Must, then Should, then Could, then the lowest issue number, and its *Check the prerequisite* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When no candidate is ready, `lets-go` SHALL print the `Done shape` line and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

#### Scenario: The walking skeleton is picked
- **WHEN** the report names stories #191, #192 and #193, all Todo with Priority Must, #192 and #193 are blocked by #191, and nobody is assigned to any
- **THEN** `lets-go` prints `Picked #191: plugin-contract — ..., the first ready story under #190.`, reads #191's blockers, confirms its packet, and runs *Claim* for it

#### Scenario: The rank follows next
- **WHEN** the unblocked candidates are #192, a Should, and #193, a Must
- **THEN** `lets-go` picks #193

#### Scenario: Another issue is not a candidate
- **WHEN** the backlog holds an unblocked, unassigned Must, #120, that the report does not name
- **THEN** `lets-go` does not pick #120

#### Scenario: No story is ready
- **WHEN** every story the report names is blocked by a documentation chore that owns the glossary edits
- **THEN** `lets-go` prints the `Done shape` line, says no story under #190 is ready, names each story and its blocker, says to run `lets-go` with a story's number once it is ready, and stops with no branch

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, or before *Claim*, when no story is ready. For an idea, before the title search of *Start from an idea*, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line holds the idea's words. It SHALL use `lets-shape`'s own query, `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`. When one exists, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, skip the title search, and run the shape step for the idea. The step resumes that discovery, as *The shape step asks before it runs discovery* says. For an issue, no check is needed: the stops of *Confirm the packet* send `#<i>` to the shape step, which finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL stand: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and a yes on `Epic: plugin backlog` stops at the Epic stop, as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* sends #180 to the shape step, whose round resumes that parent

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits `openspec/discovery.md` in the working tree on the default branch. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain`. When that lists `openspec/discovery.md`, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line names this input. When one exists, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes it. When none exists, `lets-go` SHALL say the map has uncommitted edits, say to commit or discard them, and stop. The shape step SHALL end on the default branch with the tree clean, except `openspec/discovery.md` when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL commit that file alone on the branch before *lets-go walks the step table* reads the tree. The commit is `git add openspec/discovery.md` and a `docs:` commit whose message is `docs: the discovery map from #<parent>`. `<parent>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When `openspec/discovery.md` is unchanged, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that `openspec/discovery.md` holds the discovery's map, uncommitted on the default branch. While the parent still says `Discovery status: in-progress`, it SHALL say to leave the map as it is, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard it before the next run, because a run stops on a dirty tree.

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

### Requirement: Placeholders in lets-go render as written
Every placeholder in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`, a name in angle brackets such as `<i>`, SHALL sit inside a fenced code block or an inline code span. A placeholder that follows `#`, such as `#<i>`, SHALL have the `#` inside the same code span. So GitHub shows each placeholder as written: it SHALL not read `<i>` or `<p>` as an HTML tag, drop the placeholder, or set the text after it in italics.

#### Scenario: No placeholder outside code
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`, and removes every fenced code block and every inline code span
- **THEN** no text in angle brackets that starts with a letter is left

#### Scenario: A fence inside a longer fence
- **WHEN** the test reads the prompt frame, a fence of four backticks that holds fences of three
- **THEN** the test treats the whole frame as code, and the text after the inner fences close as code too, up to the four-backtick line that closes the frame

#### Scenario: A stop that names the issue
- **WHEN** `lets-go` says to run `lets-shape` on the issue
- **THEN** the skill writes the line as ``Say to run the `lets-shape` skill on `#<i>`, and stop.``

#### Scenario: A placeholder outside code in a reference file
- **WHEN** `skills/lets-go/references/records.md` holds `pull request #<pr>` outside a code span
- **THEN** the test fails, and names the file, the line and `<pr>`

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section before *Start*. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<project>` is the number of the Project linked to the repository. `<owner>` is its owner, and `<repo>` the repository, as `owner/name`.
- `<i>` is the run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Start* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<idea>` is the idea in the user's words.

Neither `SKILL.md` nor any reference file SHALL hold `<n>`, `<p>`, `<url>`, `<issue URL>` or `<words>`.

#### Scenario: Every placeholder has a row
- **WHEN** the skill-interfaces test lists each distinct text in angle brackets that starts with a letter in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders` in `SKILL.md`

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to the skill and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: A placeholder with no row, in a reference file
- **WHEN** an edit adds `<base>` to `skills/lets-go/references/glossary-preflight.md` and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: The old names are gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`
- **THEN** it finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

#### Scenario: The Project and the issue
- **WHEN** `lets-go` claims #197 on Project 6
- **THEN** it runs `gh project item-edit 6 --owner <owner> --url <issue-url> --field Status --value "In Progress"` with 6 as `<project>`, and never 197

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. The checks that test reading order or a relative link SHALL read `SKILL.md` alone: the steps of *Start*, the *Walk the step table* section, the place of the `## Placeholders` section, the rule that `lets go level` comes before the first GitHub call, and the links to other skills' reference files.

#### Scenario: A fixed line that wraps in a reference file
- **WHEN** a skills folder holds `lets-go/SKILL.md` without `Records disagree:`, and `lets-go/references/records.md` holds `Records` at the end of one line and `disagree:` at the start of the next
- **THEN** the check that `lets-go` says `Records disagree:` passes

#### Scenario: A missing fixed line
- **WHEN** neither `SKILL.md` nor any reference file of `lets-go` holds `Records disagree:`
- **THEN** the check fails, and its output names `Records disagree:`

#### Scenario: A banned phrase in a reference file
- **WHEN** `SKILL.md` does not hold `VERDICT:`, and `lets-go/references/records.md` does
- **THEN** the check that `lets-go` does not say `VERDICT:` fails, and its output names `VERDICT:`

#### Scenario: The lost race
- **WHEN** the skill-interfaces test checks what `lets-go` does after another session claims the issue `next` picked
- **THEN** it checks for ``run `next` again with the same candidates``, and does not check for a step number of *Start*

### Requirement: A lets-go section may sit in a reference file, at any heading level
The skill-interfaces check that `lets-go` holds a section SHALL pass when a heading whose text is the section's name, at any level from `#` to `######`, is a line of `SKILL.md` or of a file in `skills/lets-go/references/`. It SHALL fail when no such heading exists, and SHALL name the section. This holds for *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim*, *Import the glossary checkpoint*, *Check the prerequisite*, *Check the checkpoint*, *Import the commits* and *Recover from a failed import*.

#### Scenario: A section moved to a reference file
- **WHEN** `lets-go/SKILL.md` has no heading `Check the checkpoint`, and `lets-go/references/glossary-preflight.md` has the line `## Check the checkpoint`
- **THEN** the section check passes for *Check the checkpoint*

#### Scenario: A section at another level
- **WHEN** `SKILL.md` holds `## Route` in place of `### Route`
- **THEN** the section check passes for *Route*

#### Scenario: A missing section
- **WHEN** no file of `lets-go` has a heading `Claim`
- **THEN** the section check fails, and its output names `Claim`

### Requirement: The step table check reads the step rows
The skill-interfaces check that `lets-go` keeps its steps in one table SHALL pass when the rows for `plan`, `review-plan`, `build` and `review-build`, each a line that starts ``| `<step>` |``, appear exactly once each, and all four sit in one table: one run of consecutive lines that start with `|`, in `SKILL.md` or in one file in `skills/lets-go/references/`. A `shape` row SHALL be allowed and not required. The check SHALL not pin the table's header line.

#### Scenario: The table as it stands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, whose step table has a row for each of the five steps
- **THEN** the step table check passes

#### Scenario: A table with no shape row and another header
- **WHEN** the step table's header is `| Step | Skill | Record | Skip line |`, and it has rows for `plan`, `review-plan`, `build` and `review-build` and none for `shape`
- **THEN** the step table check passes

#### Scenario: A step with two rows
- **WHEN** `lets-go`'s files hold two lines that start ``| `build` |``
- **THEN** the step table check fails, and its output names `build`

#### Scenario: Steps split across two tables
- **WHEN** the `plan` and `review-plan` rows sit in one table, and the `build` and `review-build` rows in another
- **THEN** the step table check fails

### Requirement: The exit-3 sentence may wrap
The skill-interfaces check that `lets-review-build`, `lets-review-plan` and `lets-go` each say `**3**: no fresh session can run here, for example because no resolver started one` SHALL match that sentence across line breaks, as *The lets-go checks read the skill's reference files* says, and SHALL read each skill's reference files too.

#### Scenario: The sentence wraps
- **WHEN** `skills/lets-go/SKILL.md` holds `**3**: no fresh session can run here, for example` at the end of one line and `because no resolver started one` at the start of the next
- **THEN** the exit-3 check passes for `lets-go`

#### Scenario: The sentence is gone
- **WHEN** `skills/lets-review-plan/SKILL.md` and its reference files do not hold the sentence
- **THEN** the exit-3 check fails, and its output names `lets-review-plan`
