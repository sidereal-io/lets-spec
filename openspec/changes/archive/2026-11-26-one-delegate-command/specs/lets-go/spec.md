## MODIFIED Requirements

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the question mode, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. When the walk reaches review plan, the first of these that matches SHALL decide whether it is done. First, on `lets-minimal`, review plan is done. Second, when the archive folder exists, review plan is done, and the records disagree when the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line. Third, otherwise, review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.` `<pr>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body. `lets-go` SHALL find the `## Plan review` heading first, and read the section up to the next `## ` heading or the end of the body. Inside it, `<sha>` SHALL come from the line that starts `Reviewed: `, and `<verdict>` from the line that starts `- **Verdict:** `. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the first of these files that exists: the change's `openspec/changes/<name>/.openspec.yaml`, then the archived change's `openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`. When neither exists, it SHALL be the route's schema. So an archived change keeps the schema it was built with, even when the route would now pick another.

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
- **THEN** the next step to run is review plan, with `--for plan` and `--name <name>-review-plan`, and build runs only after it reports `done`

#### Scenario: A stale review
- **WHEN** the **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE`, and a later commit changed `design.md` that no rebuttal names
- **THEN** `lets-go` runs the review plan step, whose `lets-review-plan` runs a new round

#### Scenario: The body is read when the row is reached
- **WHEN** the plan step reported `done` in this run, and its brainstorm opened the pull request
- **THEN** `lets-go` reads the body with `gh pr view <name> --json number,body` when it reaches review plan, not from the read before the plan step

#### Scenario: An archived change on lets-minimal
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore/.openspec.yaml` says `schema: lets-minimal`, the issue's Size has since changed to M so that the route would pick `lets-standard`, and pull request #167's body has no **Plan review** section
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.`, and prints no `Records disagree:` line for the missing section

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run shape when *Check the issue* or *Start from an idea* sends the run to *Run the shape step*, before the walk. It SHALL run each other step when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<for>` is the `--for` value that starts the step's own session: `<step>` for shape, plan and build, `plan` for review plan, and `build` for review build. `lets-go` SHALL NOT pass `--for review-plan` or `--for review-build`, which start a read-only reviewer, as *delegate-step* says; the review step's own skill starts that reviewer. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <for>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <for> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds `lets delegate step instructions --for <for>`, `lets delegate step run --for <for>`, `delegate.plan.guidance`, `delegate.build.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`, and does not find `delegate.step.`

#### Scenario: The skill names the key each review step reads
- **WHEN** a reader reads *Run a step* in `skills/lets-go/SKILL.md`
- **THEN** it says that the review plan step runs with `--for plan` and reads `delegate.plan.guidance`, that the review build step runs with `--for build` and reads `delegate.build.guidance`, and that `delegate.review-plan` and `delegate.review-build` steer the reviewers those steps start

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
- **THEN** `lets-go` writes `.workspace/lets-go/lets-go-story-review-plan-prompt.md`, and runs `step run --for plan --name lets-go-story-review-plan` with it

#### Scenario: The review build step's own session
- **WHEN** the walk reaches review build for the change `lets-go-story` and finds it not done
- **THEN** `lets-go` runs `step instructions --for build`, then `step run --for build --name lets-go-story-review-build`, and runs no `step run --for review-build`

### Requirement: lets-go names a step in plain words in prose
In prose, `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a step as *The step table* says: shape, plan, review plan, build or review build, in plain words. Code font SHALL stay for a `--for` value, a file name, a config key and the step table's *Step* column.

#### Scenario: The steps named in code font are plain
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** none of them says ``Run the `shape` step``, ``When `review-build` reports`` or ``after `shape`, go on``

#### Scenario: The `--for` names stay in code font
- **WHEN** a reader reads *The step table*
- **THEN** it still says that `--name` and file names use `shape`, `plan`, `review-plan`, `build` and `review-build`, and that a review step's own session runs with `--for plan` or `--for build`
