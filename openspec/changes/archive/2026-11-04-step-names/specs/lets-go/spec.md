## RENAMED Requirements
- FROM: `### Requirement: Propose review is reported as not in the route`
- TO: `### Requirement: Review plan is reported as not in the route`
- FROM: `### Requirement: Apply review ends the run`
- TO: `### Requirement: Review build ends the run`

## MODIFIED Requirements

### Requirement: Review plan is reported as not in the route
When the schema is `lets-minimal`, `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, and plan is done, `lets-go` SHALL print a review plan line. Its evidence is `review.md says VERDICT: <verdict>, committed <date> (<sha>).` `<verdict>` SHALL be the value of the `VERDICT:` line in the change's `review.md`. That file is `openspec/changes/<name>/review.md`, or `openspec/changes/archive/<YYYY-MM-DD>-<name>/review.md` once the change is archived. `<date>` and `<sha>` SHALL come from `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`. When the plan step reported `done` in this run, the line SHALL start `Done review plan:`. When plan was done before this run, it SHALL start `Skipped review plan:`. Review plan SHALL not run as a step of its own. On `lets-standard` it runs inside the plan step, as the schema's `review` artifact. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the plan step reported `done` in this run, and `review.md` says `VERDICT: APPROVE_WITH_CHANGES` in commit `7d16565` of 2026-11-03
- **THEN** `lets-go` prints `Done review plan: review.md says VERDICT: APPROVE_WITH_CHANGES, committed 2026-11-03 (7d16565).`

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, plan was done before this run, and `review.md` says `VERDICT: APPROVE` in commit `7d16565` of 2026-11-03
- **THEN** `lets-go` prints `Skipped review plan: review.md says VERDICT: APPROVE, committed 2026-11-03 (7d16565).`

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
`lets-go` SHALL run shape, when it is needed, then plan, build and review build, in that order, starting at the first unfinished step that *lets-go finds the first unfinished step* found. For each step it SHALL write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`. `<name>` is the change's name, and `<step>` is `shape`, `plan`, `build` or `review-build`. For the shape step, `<name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <name>-<step> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<name>-<step>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `.workspace/lets-go/<name>-<step>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for plan` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for plan --name lets-go-chore-plan` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A run that starts at apply
- **WHEN** the first unfinished step is build
- **THEN** `lets-go` writes no plan prompt, and the first `step run` is `--for build`

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

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session, and may write files. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<name>-<step>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<name>-<step>-report.json`.

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
Each step prompt SHALL name the step, the change, the issue, the branch and the schema. For the shape step, the issue is `#<i>`, or `none yet` with the idea; the branch is the default branch; and the schema is left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says, and its discovery when the work is too large for one issue, as *The shape step asks before it runs discovery* says. For plan: the `openspec-propose` skill for the change, for the issue, with the route line. It continues the change when it already exists, and does not offer the handoff. For build: the `lets-build` skill on the branch. It stops when every task is ticked, and does not finish the change. For review build: the *Finish the change* section of the `lets-build` skill. The prompt SHALL say the interactivity level, and what the `lets-go` session does with it. At `recommend`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same at both levels. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it; for shape, the issue first, as `issue #<n>: <title>`, or the parent and the stories, as `epic #<p>: <title>` and `story #<n>: <title>` lines.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `recommend`
- **THEN** the file names `openspec-propose`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the level is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the build prompt
- **THEN** the file says to stop when every task is ticked, and not to run *Finish the change*

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: A phase confirmation
- **WHEN** the shape step's discovery needs the user to confirm the journey map
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user at either level

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema, and keeps the `## Questions` and report rules of the other prompts

### Requirement: lets-go relays a needs-input report at the recommend level
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

#### Scenario: A mixed report
- **WHEN** the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for plan` again with `--answers-file .workspace/lets-go/lets-go-chore-plan-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. On a `failed` report it SHALL show the reason, name the step and the branch, say that running `lets-build` on the branch carries on, and stop. For a failed shape step there is no branch: it SHALL say to run `lets-shape` on the idea or the issue instead. It SHALL not run a failed step again.

#### Scenario: A failed apply
- **WHEN** the build step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `build` and the branch, says to run `lets-build` on the branch, and runs no review build

#### Scenario: A repeated question
- **WHEN** the resumed plan step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

#### Scenario: A failed shape
- **WHEN** the shape step reports `failed`
- **THEN** `lets-go` prints `Failed shape:` with the reason, says to run `lets-shape`, names no branch, and runs no plan

### Requirement: Review build ends the run
The review build step SHALL run `lets-build`'s *Finish the change*: the project's finishing rules, verify, archive, and marking the pull request ready. When it reports `done`, or when *lets-go finds the first unfinished step* found every step done, `lets-go` SHALL print one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done`, the step's spoken name, a colon, the report's `date` and its evidence: `Done build: <date>. <evidence>`. Review plan prints the line *Review plan is reported as not in the route* sets. A failed step prints `Failed`, the spoken name, a colon and the reason: `Failed review build: <reason>`. The spoken name has a space, never a hyphen. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** review build reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, plan, review plan, build and review build, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the plan step ran in this run on `lets-standard`, and review build reports `done`
- **THEN** the third line starts `Done review plan: review.md says VERDICT:`

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Done review plan: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `Interactivity: <level>, because your lets config sets go.level.`
- `lets go level`
- `issue #<n>: <title>`
- `epic #<p>: <title>`
- `story #<n>: <title>`
- `Run discovery on it?`
- `Picked #<n>: <title>, the first ready story under #<p>.`
- `docs: the discovery map from #<p>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
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

It SHALL not hold `#152 adds`, `#153 adds` or `#154 adds`, SHALL not say that `lets-go` takes chores only, SHALL not say that `lets-go` needs an issue number on the default branch, and SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `#152 adds`, `#153 adds` or `#154 adds`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

### Requirement: lets-go finds the first unfinished step
After Start, on the change's branch, `lets-go` SHALL find the first unfinished step from the records Git and GitHub keep, and SHALL run the steps from there. It SHALL read the records in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Fourth, `openspec instructions apply --change <name> --json`, read as `lets-build`'s *Find where you are* reads it. No change folder, or `state` `blocked`, means plan is the first unfinished step. `ready` means build. `all_done` means review build. Any other `state` SHALL show the CLI's `instruction` and stop. Shape SHALL count as done when *Confirm the packet* passed. Review plan SHALL count as done when plan is done.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first unfinished step is plan, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first unfinished step is plan

#### Scenario: A ready plan
- **WHEN** the state is `ready`
- **THEN** the first unfinished step is build, and `lets-go` prints the shape, plan and review plan skip lines before it

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`
- **THEN** the first unfinished step is review build, and `lets-go` prints four skip lines before it

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

### Requirement: A skipped step's line carries its evidence and date
Each skipped step SHALL print one line, in step order, before the first step that runs. `<date>` SHALL be the author date of the commit named, as `YYYY-MM-DD`, from `git log`'s `%as`. `<sha>` SHALL be its short hash, from `%h`. The lines and their reads are:

- Plan: `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Build: `Skipped build: every task is ticked, last task commit <date> (<sha>).`, from `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Review build: `Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<date>-<name>/tasks.md` and the pull request read earlier.

The same `git log` commands SHALL date plan and build after archive, because the old path's history holds the add and the ticks. The shape line and the review plan line are set by their own requirements.

#### Scenario: A skipped propose
- **WHEN** commit `2bbc7d0` of 2026-11-03 added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `lets-go` prints `Skipped plan: the plan is ready, tasks.md committed 2026-11-03 (2bbc7d0).`

#### Scenario: A skipped apply
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70` of 2026-11-03
- **THEN** `lets-go` prints `Skipped build: every task is ticked, last task commit 2026-11-03 (3222c70).`

#### Scenario: A skipped apply review
- **WHEN** commit `1d253bd` of 2026-11-04 added `openspec/changes/archive/2026-11-04-lets-go-chore/tasks.md`, and pull request #167 is open, not a draft, with a `Code review` section
- **THEN** `lets-go` prints `Skipped review build: archived 2026-11-04 (1d253bd); pull request #167 is ready for review with a Code review section.`

#### Scenario: A rebased branch
- **WHEN** the branch was rebased after the last task commit, so its committer date is today
- **THEN** the build skip line's date is the commit's author date, not today

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
- **THEN** `lets-go` prints no disagreement, and the first unfinished step is plan

### Requirement: lets-go relays a needs-input report at the ask level
At the `ask` level, when a report's outcome is `needs-input`, `lets-go` SHALL ask the user every question, one at a time, in the report's order. It SHALL wait for each answer before the next question. For a question with a `recommendation`, it SHALL show the recommendation as the suggested answer. It SHALL write each answer as the user gave it, even when the user took the recommendation. It SHALL add no ` (lets-go accepted the step's recommendation; the user did not decide)` marker. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. It SHALL then run the step again, as *lets-go relays a needs-input report at the recommend level* says.

#### Scenario: A recommended question at ask
- **WHEN** the level is `ask` and the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`
- **THEN** `lets-go` asks the user `Which schema?`, shows `lets-minimal` as the suggested answer, and writes the user's answer with no marker

#### Scenario: The user takes the recommendation at ask
- **WHEN** the level is `ask` and the user answers a recommended question with the recommendation
- **THEN** the answers file holds the recommendation as the answer, with no marker, so the step records it as `User`

#### Scenario: A confirmation at ask
- **WHEN** the level is `ask` and the report holds `Do you confirm the ledger?` with no recommendation
- **THEN** `lets-go` asks the user that question alone, as it does at `recommend`
