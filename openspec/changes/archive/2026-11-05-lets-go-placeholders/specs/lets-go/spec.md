## ADDED Requirements

### Requirement: Placeholders in lets-go render as written
Every placeholder in `skills/lets-go/SKILL.md`, a name in angle brackets such as `<i>`, SHALL sit inside a fenced code block or an inline code span. A placeholder that follows `#`, such as `#<i>`, SHALL have the `#` inside the same code span. So GitHub shows each placeholder as written: it SHALL not read `<i>` or `<p>` as an HTML tag, drop the placeholder, or set the text after it in italics.

#### Scenario: No placeholder outside code
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, and removes every fenced code block and every inline code span
- **THEN** no text in angle brackets that starts with a letter is left

#### Scenario: A fence inside a longer fence
- **WHEN** the test reads the prompt frame, a fence of four backticks that holds fences of three
- **THEN** the test treats the whole frame as code, and the text after the inner fences close as code too, up to the four-backtick line that closes the frame

#### Scenario: A stop that names the issue
- **WHEN** `lets-go` says to run `lets-shape` on the issue
- **THEN** the skill writes the line as ``Say to run the `lets-shape` skill on `#<i>`, and stop.``

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section before *Start*. It SHALL hold a table with one row for each placeholder the file uses: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the file. One thing SHALL have one placeholder. The names SHALL be these:

- `<project>` is the number of the Project linked to the repository. `<owner>` is its owner, and `<repo>` the repository, as `owner/name`.
- `<i>` is the run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Start* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<idea>` is the idea in the user's words.

The file SHALL hold none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`.

#### Scenario: Every placeholder has a row
- **WHEN** the skill-interfaces test lists each distinct text in angle brackets that starts with a letter in `skills/lets-go/SKILL.md`
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders`

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to the skill and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: The old names are gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

#### Scenario: The Project and the issue
- **WHEN** `lets-go` claims #197 on Project 6
- **THEN** it runs `gh project item-edit 6 --owner <owner> --url <issue-url> --field Status --value "In Progress"` with 6 as `<project>`, and never 197

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

## MODIFIED Requirements

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

It SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. It SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. It SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. It SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. It SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

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
