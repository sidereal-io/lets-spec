# lets-go Specification

## Purpose

Says what the `lets-go` skill does for a shaped Chore, Bug or Story, or for an idea in words: where it starts, how it shapes an idea or an unshaped issue, how it runs discovery for a large idea and picks the first ready story, what it skips and how it says so, which question mode it picks, how it runs each step and reads its report, how it relays a step's questions to the user, and how the run ends.

## Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- in an epic run only, the reads and the `git switch <default>` of *An epic run picks each story as next picks it*, and the fetches and ancestry checks of *An epic run stacks a story on its met blocker*;
- the `git status --porcelain -uall -- openspec/discovery.md openspec/discovery` before the shape step and after *Claim*, and the commit of the discovery maps it lists, that *lets-go commits the discovery map on the story's branch* says.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. It finds `gh issue view <i> --json createdAt`, `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `lets backlog claim <i>`, no `gh project` and no `gh api graphql`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` leaves #149 out, runs `lets backlog ready --exclude 149`, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and walks the step table there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** the user named the issue, and *Claim* returns `taken` because someone else has it
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
- **WHEN** the skill-interfaces test reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it finds `lets backlog item <i>` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** the user named #180, no branch for its change exists, and *Confirm the packet* returns `needs-shape` because it finds two comments after the watermark
- **THEN** `lets-go` runs the shape step for #180

#### Scenario: The pick names next
- **WHEN** the shape step reports an epic and three stories
- **THEN** `lets-go` runs its own `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

#### Scenario: A branch made after the check
- **WHEN** *Check the issue* found no branch `lets-go-chore` for #149, and someone creates a local branch `lets-go-chore` before *Claim* creates it
- **THEN** *Claim* fails to create the branch, removes its assignment, sets #149's Status back to Todo and returns `branch-failed`, and `lets-go` shows the error and stops

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* returns `complete`, and no shape step ran in this run, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.`, once for that issue. `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* returns `complete` after a shape step reported `done` in this run, `lets-go` SHALL print `Done shape: <date>. <evidence>` instead, with the report's `date` and its `evidence` joined with `; `. It SHALL print the `Done shape` line once per run: after a lost claim, *Check the issue* SHALL not print it again for the story picked next. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says, and print no skip line.

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

#### Scenario: Done shape after a lost claim
- **WHEN** discovery filed #191 and #192, *Check the issue* printed `Done shape:` for #191, *Claim* returned `taken` for #191, and *Pick the first ready story* then picked #192
- **THEN** `lets-go` prints the `Picked` line for #192, and no second `Done shape:` line

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the question mode, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. When the walk reaches review plan, the first of these that matches SHALL decide whether it is done. First, on `lets-minimal`, review plan is done. Second, when the archive folder exists, review plan is done, and the records disagree when the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line. Third, otherwise, review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.` `<pr>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body. `lets-go` SHALL find the `## Plan review` heading first, and read the section up to the next `## ` heading or the end of the body. Inside it, `<sha>` SHALL come from the line that starts `Reviewed: `, and `<verdict>` from the line that starts `- **Verdict:** `. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the first of these files that exists: the change's `openspec/changes/<name>/.openspec.yaml`, then the archived change's `openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`. When neither exists, it SHALL be the route's schema. So an archived change keeps the schema it was built with, even when the route would now pick another.

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

#### Scenario: An archived change on lets-minimal
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore/.openspec.yaml` says `schema: lets-minimal`, the issue's Size has since changed to M so that the route would pick `lets-standard`, and pull request #167's body has no **Plan review** section
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.`, and prints no `Records disagree:` line for the missing section

### Requirement: lets-go picks the question mode and says why
In *Read the settings*, before it asks GitHub for anything, `lets-go` SHALL run `lets go questions` from the repo root, once per run. When the command exits non-zero, `lets-go` SHALL show the user its stderr and stop. It SHALL then claim nothing and run no step. Otherwise it SHALL keep the `questions` value the command printed for the whole run. Each time it picks the question mode, it SHALL take the first of these that is set. First, the question mode the user named in the request. Then the kept `questions` value, when it is not `null`. Then the Kind's default: `auto` for a Chore or a Bug, and `ask` for a Story or any other Kind, because *Confirm the packet* reads any other Kind as a Story. It SHALL print the line for the source it used. For the request's question mode: `Questions: <mode>, because you asked for it.` For the config's: `Questions: <mode>, because your lets config sets go.questions.` For the Kind's: `Questions: <mode>, because #<i> is a <Kind>.` Before a shape step, the Kind is not settled. The question mode for the shape step SHALL be the request's, when named; else the config's, when set; else `ask`. In that last case the line SHALL read `Questions: ask, because shape has not run yet.` After the shape step, `lets-go` SHALL pick the question mode again, in the same order, and print its line. *Set the question mode* SHALL hold this rule, and *Run the shape step* SHALL link to it, not write it again. `lets-go` SHALL never ask the user which question mode to use. The question mode SHALL hold for the whole run and SHALL not be kept for a later run. It SHALL put the question mode, and what it means for the step, into every step prompt.

#### Scenario: The question mode line
- **WHEN** issue `#149` is a Chore and Start has passed
- **THEN** `lets-go` prints `Questions: auto, because #149 is a Chore.` before it runs plan

#### Scenario: A Story
- **WHEN** issue `#152` is a Story and Start has passed
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.` before it runs plan

#### Scenario: A Bug
- **WHEN** the issue is a Bug
- **THEN** `lets-go` prints `Questions: auto, because #<i> is a Bug.` with the issue's number

#### Scenario: The user names the question mode
- **WHEN** the user runs `lets-go` for `#152`, a Story, and says `auto`
- **THEN** `lets-go` prints `Questions: auto, because you asked for it.` and relays at `auto`

#### Scenario: A later run
- **WHEN** an earlier run of `lets-go` for `#152` ran at `auto` because the user said so, and the user runs `lets-go` for `#152` again without naming a question mode
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.`

#### Scenario: The shape step's question mode
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` without naming a question mode
- **THEN** `lets-go` prints `Questions: ask, because shape has not run yet.` before the shape step, and relays its questions at `ask`

#### Scenario: The question mode after shape
- **WHEN** the shape step wrote `#181` as a Chore, and the user named no question mode
- **THEN** `lets-go` prints `Questions: auto, because #181 is a Chore.` before it runs plan

#### Scenario: A named question mode holds through shape
- **WHEN** the user runs `lets-go auto add a --quiet flag to lets sync`, and the shape step writes a Story
- **THEN** `lets-go` prints `Questions: auto, because you asked for it.` before the shape step and again before plan

#### Scenario: The config sets the question mode
- **WHEN** the `lets` config holds `go.questions: auto`, issue `#152` is a Story, the user named no question mode, and Start has passed
- **THEN** `lets-go` prints `Questions: auto, because your lets config sets go.questions.` before it runs plan, and relays at `auto`

#### Scenario: The request's question mode beats the config's
- **WHEN** the `lets` config holds `go.questions: auto`, and the user runs `lets-go` for `#152`, a Story, and says `ask`
- **THEN** `lets-go` prints `Questions: ask, because you asked for it.`

#### Scenario: The config's question mode before shape
- **WHEN** the `lets` config holds `go.questions: auto`, and the user runs `lets-go add a --quiet flag to lets sync` without naming a question mode
- **THEN** `lets-go` prints `Questions: auto, because your lets config sets go.questions.` before the shape step, and again before plan

#### Scenario: The config holds no question mode
- **WHEN** `lets go questions` prints `{"questions":null}`, issue `#152` is a Story, and the user named no question mode
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.`

#### Scenario: lets go questions fails
- **WHEN** the `lets` config holds `go.questions: loud`, and the user runs `lets-go` for `#152`
- **THEN** `lets-go` shows the user the command's stderr, which names `go.questions`, claims nothing, and runs no step

#### Scenario: Another Kind
- **WHEN** issue `#160` has the Kind Spike on the Project, its packet has every Story line, and the user named no question mode and the config sets none
- **THEN** `lets-go` prints `Questions: ask, because #160 is a Spike.`

#### Scenario: The rule is written once
- **WHEN** the skill-interfaces test reads *Run the shape step* in `lets-go`
- **THEN** it finds a link to `#set-the-question-mode`, and not the line `Questions: <mode>, because your lets config sets go.questions.`

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run shape when *Check the issue* or *Start from an idea* sends the run to *Run the shape step*, before the walk. It SHALL run each other step when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

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
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session. It SHALL follow the saved prompt, work only in this repository, on the branch `<name>` or, for shape, on the default branch, and make only the changes that the step calls for. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question`, an optional string `recommendation` and an optional boolean `ask`, by the rule `lets` uses: `ask: true` is kept, `ask: false` is dropped, and any other value breaks the report, which names `questions[<i>].ask`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<session>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: What the subagent may change
- **WHEN** the skill-interfaces test reads *Run a step in a subagent*
- **THEN** it says that the subagent follows the saved prompt, works only in this repository on the branch `<name>`, and makes only the changes that the step calls for, and it does not say `may write files`

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

#### Scenario: A subagent's marked question
- **WHEN** the subagent's block holds `outcome: needs-input` and one question with `ask: true`
- **THEN** `.workspace/lets-go/<session>-report.json` holds that question with `"ask":true`

### Requirement: The step prompt says what to run, the question mode, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch, the schema and the route line. For the shape step, the issue is `#<i>`, or `none yet` with the idea, and the branch is the default branch. Its schema and route are left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says, and its discovery when the work is too large for one issue, as *The shape step asks before it runs discovery* says. For every other step: invoke the step's skill, as the step table names it, for the change and the issue, and stop where that skill stops. The skills are `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. The prompt SHALL name no other skill, and no section of a skill, for those steps. `lets-plan` takes the route line from the prompt for the proposal's commit message. The prompt SHALL say the question mode, and what the `lets-go` session does with it. At `auto`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same in both modes. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it. For shape, the issue comes first, as `issue #<i>: <title>`, or the parent and the stories, as `epic #<parent>: <title>` and `story #<story>: <title>` lines. For review plan, the verdict and the reviewed commit come first, as `Plan review: <verdict> for <sha>`.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `auto`
- **THEN** the file names `lets-plan`, `lets-go-chore`, `#149`, the route line, `auto`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`, and does not name `openspec-propose`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the question mode is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

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
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user in either mode

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema and no route, and keeps the `## Questions` and report rules of the other prompts

### Requirement: lets-go relays a needs-input report in auto mode
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<session>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

The rounds at `auto` SHALL have a limit. From a step's sixth `needs-input` report in a run, `lets-go` SHALL relay every question of that step as at `ask`: it SHALL ask the user each one, show the recommendation as the suggested answer, and write the answer as the user gave it, with no marker. Before the first such question, it SHALL print `Questions: ask for the rest of this step, because it asked for input five times.` once. The count SHALL be per step and per run: a new run, or another step, starts again at none.

#### Scenario: A mixed report
- **WHEN** the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for plan` again with `--answers-file .workspace/lets-go/lets-go-chore-plan-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

#### Scenario: A step that keeps asking
- **WHEN** the question mode is `auto`, and the build step reports `needs-input` for the sixth time in this run, with `Which flag name?` recommended `--quiet`
- **THEN** `lets-go` prints `Questions: ask for the rest of this step, because it asked for input five times.`, asks the user `Which flag name?` with `--quiet` as the suggested answer, and writes the user's answer with no marker

#### Scenario: The fifth round is still answered
- **WHEN** the question mode is `auto`, and the build step reports `needs-input` for the fifth time in this run, with every question recommended
- **THEN** `lets-go` takes each recommendation as the answer, as for the first round, and prints no `Questions:` line

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. At `auto`, from a step's sixth `needs-input` report in a run, the user answers every question of that step, as *lets-go relays a needs-input report in auto mode* says. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. *Read the report* SHALL handle a failed shape step before any other failed step. For a failed shape step there is no branch: `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch and print no pull request URL. On a `failed` report from any other step it SHALL show the reason, name the step and the branch, and stop. It SHALL say that running `lets-go` again on the branch carries on from the first unfinished step. It SHALL print the pull request's URL only when the branch has a pull request. When it has none, it SHALL print no URL, and SHALL say that the branch has no pull request yet. It SHALL not run a failed step again in the same run.

#### Scenario: A failed apply
- **WHEN** the build step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `build` and the branch, says to run `lets-go` again on the branch, and runs no review build

#### Scenario: A repeated question
- **WHEN** the resumed plan step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

#### Scenario: A failed shape
- **WHEN** the shape step reports `failed`
- **THEN** `lets-go` prints `Failed shape:` with the reason, says to run `lets-shape`, names no branch, prints no pull request URL, and runs no plan

#### Scenario: A failed plan with no pull request
- **WHEN** the plan step reports `failed` on the branch `lets-go-chore` before its brainstorm opened a pull request, and `gh pr view lets-go-chore` finds none
- **THEN** `lets-go` names `plan` and `lets-go-chore`, says the branch has no pull request yet, and prints no URL

#### Scenario: The shape case comes first
- **WHEN** the skill-interfaces test reads *Read the report* in `skills/lets-go/SKILL.md`
- **THEN** the case for a failed shape step comes before the case for any other failed step

### Requirement: Review build ends the run
The review build step SHALL run the `lets-review-build` skill. On `lets-standard` that skill reviews the code first. On every flow it then follows the project's finishing rules, verifies, archives, and marks the pull request ready. When it reports `done` and the check that *A done report is checked against its record* sets passes, or when the walk of *lets-go walks the step table* found every step done, the walk SHALL have printed one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done`, the step's spoken name, a colon, the report's `date` and its evidence: `Done build: <date>. <evidence>`. Review plan prints the line *Review plan runs as a step, or is not in the route* sets. A failed step prints `Failed`, the spoken name, a colon and the reason: `Failed review build: <reason>`. The spoken name has a space, never a hyphen. `lets-go` SHALL then print the pull request's URL and stop. In an epic run, it SHALL instead settle the story with its line and go on, as *An epic run picks each story as next picks it* says. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** review build reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, plan, review plan, build and review build, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the review plan step and the build step ran in this run on `lets-standard`, and review build reports `done`
- **THEN** the third line starts `Done review plan: ` and the fourth starts `Done build: `

#### Scenario: A finished story in an epic run
- **WHEN** an epic run on #278 is building #279, and review build reports `done` for it with pull request #392 ready for review
- **THEN** `lets-go` prints `#279 epic-run-skeleton: https://github.com/sidereal-io/lets-spec/pull/392`, switches to the default branch, and ranks the epic's stories again, and the run is not over

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
- `Questions: <mode>, because #<i> is a <Kind>.`
- `Questions: <mode>, because you asked for it.`
- `Questions: ask, because shape has not run yet.`
- `Questions: <mode>, because your lets config sets go.questions.`
- `lets go questions`
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
After *Set the question mode*, on the change's branch, `lets-go` SHALL read the records Git and GitHub keep, in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Then `lets-go` SHALL walk the step table from the top: plan, review plan, build, review build. The step table SHALL have no row for shape: shape runs before the walk, in *Run the shape step*, and *Check the issue* prints its `Skipped shape` or `Done shape` line. When the walk reaches a row, it SHALL read whether that step is done. Each row's done test SHALL be written once, in the walk, as an ordered list: the first item that matches decides. The step table SHALL not restate it. The plan row and the build row each read the change state when the walk reaches them: `openspec instructions apply --change <name> --json`, run when `openspec/changes/<name>/` exists and there is no archive folder. Plan is done when the `state` is `ready` or `all_done`, or the archive folder exists. Build is done when the `state` is `all_done`, or the archive folder exists. The build row SHALL read the state again, even when the plan row read it, because a review plan round can add a task. Any `state` other than `blocked`, `ready` or `all_done` SHALL show the CLI's `instruction` and stop. Review plan is done as *Review plan runs as a step, or is not in the route* says. Review build is done when the archive folder exists. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL check it as *A done report is checked against its record* says, and go on to the next row only when the check passes. `lets-go` SHALL read a row's record when it reaches the row, not before, because a step run in this round changes the records the next row reads.

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

#### Scenario: The step table has no done column
- **WHEN** the skill-interfaces test reads the step table of `lets-go`
- **THEN** its header has no *Done when* column

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
When the pull request's `state` is `MERGED`, `lets-go` SHALL say the change is merged and the run is finished, and stop. When its `state` is `CLOSED`, `lets-go` SHALL say the change was rejected and there is nothing to resume, and stop. Neither SHALL count as a disagreement, and neither SHALL run a step. The skill SHALL say when these stops run. They run only when the change's branch still exists and the run can find its issue. That happens in three cases: a stacked pull request merged into the branch below it; a pull request closed without merging; or a closed issue the user names on the default branch, whose branch is still there. In the first two cases the issue stays open.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets-go` says the change is merged, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `CLOSED`
- **THEN** `lets-go` says the change was rejected, and runs no step

#### Scenario: A stacked pull request merged into its base
- **WHEN** pull request #214 for `lets-go-one-rule-once` merged into `lets-go-procedures-return`, its issue #202 is still open, and the user runs `lets-go` on the branch `lets-go-one-rule-once`
- **THEN** `lets-go` finds #202 by the branch name, reads `MERGED`, says the change is merged, and runs no step

### Requirement: lets-go runs for a Chore, a Bug or a Story
`lets-go` SHALL run on the repository's default branch, or on a change's branch. A change's branch is a branch named after the change, whose issue `lets-go` finds as *lets-go takes one issue number or an idea* says. On any other branch it SHALL say that `lets-go` runs on the default branch or on a change's branch, and stop. It SHALL run for an issue whose Kind is Chore, Bug or Story. It SHALL run for an issue of any other Kind but Epic as for a Story. It SHALL also run for an idea or an unshaped issue, which the shape step turns into one. It SHALL add no Kind check of its own: an Epic starts an epic run where *Confirm the packet* returns `epic`, as *An epic run starts on an epic with open stories* says. For a Story with a parent, it SHALL read the parent's **Shared decisions** as *Confirm the packet* says, because *Route* needs them. When a procedure returns a result that ends the run, such as `unresolved` for a glossary prerequisite, `lets-go` SHALL stop as the part that ran it says.

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
- **WHEN** the issue's Kind is Epic, it has open sub-issues, and the run started on the default branch
- **THEN** `lets-go` starts an epic run, and claims nothing on the epic

#### Scenario: A branch with no issue
- **WHEN** the current branch is `fix-typo`, and no open issue's title starts with `fix-typo — `
- **THEN** `lets-go` says it runs on the default branch or on a change's branch, and stops

#### Scenario: A glossary prerequisite still stops
- **WHEN** the issue's **Glossary handoff** names an owner whose pull request has not merged
- **THEN** `lets-go` stops as *Check the prerequisite* says, and runs no step

#### Scenario: Another Kind
- **WHEN** the issue's Kind is Spike, and its packet has every Story line
- **THEN** `lets-go` goes on to *Route*, as for a Story

### Requirement: lets-go relays a needs-input report in ask mode
In `ask` mode, when a report's outcome is `needs-input`, `lets-go` SHALL ask the user every question, one at a time, in the report's order. It SHALL wait for each answer before the next question. For a question with a `recommendation`, it SHALL show the recommendation as the suggested answer. It SHALL write each answer as the user gave it, even when the user took the recommendation. It SHALL add no ` (lets-go accepted the step's recommendation; the user did not decide)` marker. It SHALL append every pair, in order, to `.workspace/lets-go/<session>-answers.yaml`. It SHALL then run the step again, as *lets-go relays a needs-input report in auto mode* says.

#### Scenario: A recommended question at ask
- **WHEN** the question mode is `ask` and the plan step reports `needs-input` with `Which schema?` recommended `lets-minimal`
- **THEN** `lets-go` asks the user `Which schema?`, shows `lets-minimal` as the suggested answer, and writes the user's answer with no marker

#### Scenario: The user takes the recommendation at ask
- **WHEN** the question mode is `ask` and the user answers a recommended question with the recommendation
- **THEN** the answers file holds the recommendation as the answer, with no marker, so the step records it as `User`

#### Scenario: A confirmation at ask
- **WHEN** the question mode is `ask` and the report holds `Do you confirm the ledger?` with no recommendation
- **THEN** `lets-go` asks the user that question alone, as it does at `auto`

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. An issue number here is any item key of the backlog provider. A request names an issue when, after a question mode word is taken off, it is one word and `lets backlog key -- '<word>'` returns a `key`, with each `'` in the word written as `'\''`. That key SHALL be `<i>`. When `key` is `null`, the request SHALL be words. When the command returns an `error`, `lets-go` SHALL stop as *A backlog error stops the run* says. With the GitHub backlog provider, `#149` and `149` name the issue whose key is `149`. A leading or trailing `ask` or `auto` SHALL name the question mode when the rest of the request is a number or nothing. When the rest is words on the default branch, `lets-go` SHALL ask the user whether that word names the question mode or is part of the idea, and show both readings. It SHALL ask in either mode, before *Start from an idea* runs. Only when the user says the word names the question mode SHALL `lets-go` take it off, as the question mode. Otherwise the word SHALL stay in the idea, and *Set the question mode* SHALL take the question mode from its next source. On the default branch, every other request with words SHALL be the idea, kept word for word. When the idea holds no letter or digit, in any script, `lets-go` SHALL say that an idea needs at least one letter or digit, and stop. It SHALL stop before the discovery query and the title search, claiming nothing and running no step. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank, and its *Check the prerequisite* and *Confirm the packet* on each candidate, as *Only an idea or a named issue goes to the shape step* says. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When the case returns `nothing-ready`, `lets-go` SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `lets backlog find <branch>` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

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

#### Scenario: An idea with a question mode
- **WHEN** the user runs `lets-go auto add a --quiet flag to lets sync` on the default branch, and answers that `auto` names the question mode
- **THEN** the idea is `add a --quiet flag to lets sync`, and the question mode is `auto`

#### Scenario: A question mode word that is part of the idea
- **WHEN** the user runs `lets-go ask before deleting the branch` on the default branch, and answers that `ask` is part of the idea
- **THEN** the idea is `ask before deleting the branch`, and *Set the question mode* takes the question mode from `go.questions` or the Kind

#### Scenario: A question mode with a number
- **WHEN** the user runs `lets-go ask #149`
- **THEN** the question mode is `ask`, the issue is `#149`, and `lets-go` asks no question about the word

#### Scenario: An idea with no letters or digits
- **WHEN** the user runs `lets-go ???` on the default branch
- **THEN** `lets-go` says that an idea needs at least one letter or digit, and stops, claiming nothing, before the discovery query and the title search

#### Scenario: Letters in another script
- **WHEN** the user runs `lets-go ログを直す` on the default branch
- **THEN** the idea is `ログを直す`, and the run goes to *Start from an idea*

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

#### Scenario: A key of another backlog provider
- **WHEN** the user runs `lets-go PROJ-12` on the default branch, and `lets backlog key PROJ-12` returns `"key": "PROJ-12"` and `"label": "PROJ-12"`
- **THEN** `lets-go` takes `PROJ-12` as `<i>` and goes on to its blocker read with `lets backlog item PROJ-12`

#### Scenario: One word that is not a key
- **WHEN** the user runs `lets-go refactor` on the default branch, and `lets backlog key refactor` returns `"key": null`
- **THEN** `lets-go` takes `refactor` as the idea, and goes to *Start from an idea*

#### Scenario: One word with an apostrophe
- **WHEN** the user runs `lets-go can't` on the default branch
- **THEN** `lets-go` runs `lets backlog key -- 'can'\''t'`, which returns `"key": null`, and takes `can't` as the idea

#### Scenario: The key command fails
- **WHEN** the user runs `lets-go 149`, and `lets backlog key 149` returns `"error": "unknown-backlog-provider"`
- **THEN** `lets-go` shows the error's `message`, claims nothing and runs no step

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The shape prompt SHALL say to run `lets-shape`'s *Shape one issue* to its end, including its second comment fetch, its reply, and its glossary handoff. For an idea, it SHALL give the idea word for word. It SHALL say that Start has searched and the user confirmed no open issue is the same work, so the step skips the search and creates the issue. For an existing issue, it SHALL name `#<i>` and say to shape it. It SHALL say to create no change and no change branch, and to end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. It SHALL say that the packet confirmation is a confirmation question, with no recommendation. So are the question about which product an idea belongs to, and the question that moves the map for a second product. It SHALL say what the first evidence line of a `done` report is: `issue #<i>: <title>` for one issue. When discovery filed stories, it is `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. It SHALL say that work too large for one issue, Size L or XL, or an input that holds a large idea, ends the round with the discovery question, as *The shape step asks before it runs discovery* says. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

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
- **THEN** the file holds `Run discovery on it?`, `epic #<parent>: <title>`, `story #<story>: <title>`, `Discovery status: in-progress`, `openspec/discovery.md` and `openspec/discovery/`, and does not say to end with a failed report for a too-large idea

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` before it writes the prompt, and the first round carries no `--answers-file`

#### Scenario: Confirm the packet stops after shape
- **WHEN** the shape step reported `done` for #181 in this run, and *Confirm the packet* then returns `needs-shape` because #181 has no Kind
- **THEN** `lets-go` says to run `lets-shape` on #181, stops, and runs no second shape step

#### Scenario: An issue with no packet
- **WHEN** the user runs `lets-go` for `#180`, no branch for its change exists, and *Confirm the packet* returns `needs-shape` because #180 has no Kind
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
The shape step SHALL NOT fail, and SHALL NOT start discovery on its own, when it finds the work too large for one issue. Too large means Size L or XL, or an input that holds a large idea. It SHALL end its round with a `needs-input` report that holds the question `The work is Size <L or XL>, too large for one issue. Run discovery on it?` with the recommendation `yes`. `lets-go` SHALL relay that question as it relays any other, in the run's question mode. When the answer is `yes`, the resumed step SHALL run `lets-shape`'s discovery with the idea or #<i> as its input. It SHALL run every phase from Ingest to Finalize, including the glossary handoff. Each phase's confirmation, and the story table in Phase 5, SHALL be a confirmation question with no recommendation. The parent's `Input:` line SHALL hold the idea's words for an idea, or `#<i>` for an issue, so a later round can match it. When the answer is anything but `yes`, the step SHALL end with a `failed` report that says the work is too large for one issue and discovery was declined. The step SHALL create no change and no change branch; the parent issue, the stories and a glossary holding branch are `lets-shape`'s own.

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

#### Scenario: At auto
- **WHEN** the user ran `lets-go auto` with the idea, and the shape step reports the discovery question
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
After a shape report that names a parent and stories, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case SHALL run `lets backlog ready` with the report's stories as `--only`. So SHALL its rank, Must, then Should, then Could, then the oldest issue first, and its *Check the prerequisite* and *Confirm the packet* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When the case returns `nothing-ready`, `lets-go` SHALL print the `Done shape` line, unless this run has printed it already, and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, such as its blocker, its assignee, an unresolved prerequisite, or a packet that is not complete, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

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
A discovery can stop between rounds, or before *Claim*, when no story is ready. For an idea, before the title search of *Start from an idea*, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line holds the idea's words. It SHALL use `lets-shape`'s own query, `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`. When one exists, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, skip the title search, and run the shape step for the idea. The step resumes that discovery, as *The shape step asks before it runs discovery* says. For an issue, no check is needed: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits the discovery maps in the working tree on the default branch: `openspec/discovery.md`, and in a repository with several products the files under `openspec/discovery/`. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, which names each changed file and works when the folder does not exist. When that lists a path, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line names this input. When one exists, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes it. When none exists, `lets-go` SHALL say the maps have uncommitted edits, name each path, say to commit or discard them, and stop. The shape step SHALL end on the default branch with the tree clean, except the discovery maps when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL run that status command again, on the branch, before *lets-go walks the step table* reads the tree. It SHALL commit each path it lists, new files included. The commit is `git add -- <paths>`, then `git commit -m "docs: the discovery map from #<parent>" -- <paths>`. It SHALL never pass `openspec/discovery` itself to `git add` or `git commit`, because both fail on a path that matches no file. `<parent>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When no discovery map changed, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that the discovery maps it names hold the discovery's edits, uncommitted on the default branch. While the parent still says `Discovery status: in-progress`, it SHALL say to leave the maps as they are, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard them before the next run, because a run stops on a dirty tree.

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

#### Scenario: A product's map and the root
- **WHEN** discovery moved the old map to `openspec/discovery/web-shop.md`, rewrote `openspec/discovery.md` as the root, and created `openspec/discovery/warehouse.md`, and *Claim* created the branch `stock-alerts`
- **THEN** `lets-go` commits those three paths, and no other, on `stock-alerts` in one commit, `docs: the discovery map from #<parent>`

#### Scenario: A dirty product map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery/warehouse.md` before the shape step runs, and no open parent issue for this input says `Discovery status: in-progress`
- **THEN** `lets-go` names `openspec/discovery/warehouse.md`, says to commit or discard it, and runs no step

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
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue, as its key: the key the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Check the issue* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<claim>` is the unique session token returned by `lets backlog claim <i>`, kept by *Claim* for release.
- `<idea>` is the idea in the user's words.

Neither `SKILL.md` nor any reference file SHALL hold `<n>`, `<p>`, `<url>`, `<issue URL>`, `<words>`, `<project>`, `<owner>` or `<repo>`. The table's *Where the run sets it* column SHALL name the part or section that sets each placeholder, never a step number.

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
- **WHEN** `lets-go` claims #197
- **THEN** it runs `lets backlog claim 197`, and no placeholder stands for the Project

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. Some checks test reading order or a relative link. They SHALL read `SKILL.md` alone. These are the checks of the *Walk the step table* section, of the order of the overview and the parts, of the place of the `## Placeholders` section, and of each part's `Next:` line. So are the rule that `lets go questions` comes before the first GitHub call, and the links to other skills' reference files. A check of a part's section SHALL read the part's `##` section in `SKILL.md`, then the section with the same name in a reference file, when one has it, so a check of a part's steps follows the steps into `references/shape.md`. A check of a procedure SHALL read the procedure's section in `SKILL.md` or in a reference file, at any heading level. The check that each link names a heading reads each file against its own headings, and each link to another file against that file's headings.

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
- **THEN** it checks for `leave out every issue lost in this run`, and does not check for a step number

#### Scenario: A part's steps in a reference file
- **WHEN** a skills folder holds `lets-go/SKILL.md` with `## Run the shape step` and a `Next:` line, and `lets-go/references/shape.md` holds `## Run the shape step` followed by `Check the discovery map.`
- **THEN** the section of *Run the shape step* holds both the `Next:` line and `Check the discovery map.`

#### Scenario: A procedure in a reference file
- **WHEN** a skills folder holds `lets-go/references/glossary-handoff.md` with `## Glossary preflight` followed by `Say so, and stop.`
- **THEN** the check that each procedure holds no `stop` fails, and its output names `Glossary preflight`

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
The skill-interfaces check that `lets-go` keeps its steps in one table SHALL pass when the rows for `plan`, `review-plan`, `build` and `review-build`, each a line that starts ``| `<step>` |``, appear exactly once each, and all four sit in one table: one run of consecutive lines that start with `|`, in `SKILL.md` or in one file in `skills/lets-go/references/`. A `shape` row SHALL make the check fail, and its output SHALL name `shape`: shape runs before the walk. The check SHALL not pin the table's header line.

#### Scenario: The table as it stands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, whose step table has a row for each of plan, review plan, build and review build
- **THEN** the step table check passes

#### Scenario: A table with a shape row
- **WHEN** the step table has rows for `plan`, `review-plan`, `build` and `review-build`, and one that starts ``| `shape` |``
- **THEN** the step table check fails, and its output names `shape`

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

### Requirement: Each numbered list in lets-go starts at 1 under its heading
In `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md`, the first numbered item after each heading, outside fenced code blocks, SHALL be numbered `1.`. A list SHALL not carry on its numbers from the list under an earlier heading. *Check the prerequisite* SHALL number its steps 1 to 4, and *Check the checkpoint* SHALL number its steps from 1. Where one of these sections sends the agent to the other, it SHALL name the other section and link to it, and SHALL not refer to it by step number. The skill-interfaces check SHALL fail when a heading's first numbered item is not `1.`, and its output SHALL name the file, the heading and the number found.

#### Scenario: The checkpoint steps start at 1
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** the first numbered item after `#### Check the checkpoint` is `1.`, and the check passes

#### Scenario: A list that carries on across a heading
- **WHEN** a skills folder holds `lets-go/SKILL.md` with `### Steps` followed by `5. Read the base.`
- **THEN** the numbering check fails, and its output names `SKILL.md`, `### Steps` and `5.`

#### Scenario: A number inside a code block
- **WHEN** a heading is followed by a fenced code block whose first line is `5. not a step`, and then by `1. Read the base.`
- **THEN** the numbering check passes

### Requirement: The checkpoint names the prerequisite check it repeats
*Check the checkpoint* SHALL end by saying that, when the owner of the glossary definitions or the proposed base changed since *Find the source of demand* ran *Check the prerequisite*, the agent runs [Check the prerequisite](#check-the-prerequisite) again, before *Claim* claims the issue. It SHALL name that section and link to it. It SHALL not say `repeat steps 1 to 3`, and SHALL not say to go on with the packet, blocker and routing checks, which *Start* ran before *Claim*. When that second run finds an unresolved prerequisite, `lets-go` SHALL report it and stop, claiming nothing, whether the user named the issue or `next` picked it.

#### Scenario: The rerun is named
- **WHEN** the skill-interfaces test reads *Check the checkpoint* in `lets-go`
- **THEN** it finds a link to `#check-the-prerequisite` there, and no file of `lets-go` says `repeat steps 1 to 3` or `Go on with the normal packet, blocker and routing checks`

#### Scenario: The owner changed after next picked the story
- **WHEN** `next` picked #152, *Check the checkpoint* runs inside *Claim* step 2, and #152's glossary owner has changed to #150, whose pull request has not merged
- **THEN** `lets-go` runs *Check the prerequisite* again, reports that #150 owns the definitions and has not merged, and stops without assigning #152 or creating a branch

### Requirement: A failed checkpoint check stops before the claim and repairs nothing
Each check in *Check the checkpoint* that fails SHALL make it return `checkpoint-failed`, with what it found. *Claim* SHALL then return `checkpoint-failed` before it assigns the issue or creates a branch, and *Enter the branch* SHALL report what was found and stop. The run SHALL repair nothing: it SHALL not recover a missing commit, resolve a patch, drop or rewrite a commit, or change the working tree. The checks that can fail are:

- a checkpoint commit or the recorded head is missing, or exists only in a local checkout;
- the range from the base to the head holds a merge, a commit that is not recorded, or a commit that touches a path other than the recorded glossary paths;
- the context the commits need is not on the proposed base;
- the owned paths do not match the shaping baseline;
- the rehearsal finds a partial or conflicting patch.

An edit that the rehearsal finds already present on the base SHALL not be a failure: the import skips it. *Check the checkpoint* SHALL not say `Resolve a partial or conflicting patch` or `do not claim until it is recovered`.

#### Scenario: A missing checkpoint
- **WHEN** the **Glossary handoff** of #152 records a checkpoint commit that `git cat-file -e` cannot find after the recorded branch is fetched
- **THEN** `lets-go` reports the missing commit, and stops without assigning #152 or creating a branch

#### Scenario: A conflicting patch
- **WHEN** the rehearsal in `.workspace/` finds that a checkpoint commit conflicts with `openspec/glossary.md` on the proposed base
- **THEN** `lets-go` reports the conflict, and stops without assigning the issue, creating a branch or editing the glossary

#### Scenario: An edit already present
- **WHEN** the rehearsal finds that the base already holds one of two checkpoint commits, and the other applies cleanly
- **THEN** `lets-go` goes on to claim the issue, and the import skips the commit already present

#### Scenario: The wording that repairs is gone
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** no file of `lets-go` says `Resolve a partial or conflicting patch` or `do not claim until it is recovered`, and *Check the checkpoint* returns `checkpoint-failed` where a check fails, with no word `stop`

### Requirement: lets-go opens with an overview of its parts
`skills/lets-go/SKILL.md` SHALL describe a run as named parts. A part is one named piece of a run, as `openspec/glossary.md` defines it. The parts SHALL be these twelve, in run order:

1. *Read the settings*
2. *Read the request*
3. *Start from an idea*
4. *Check the issue*
5. *Run the shape step*
6. *Pick the first ready story*
7. *Run the epic*
8. *Route*
9. *Enter the branch*
10. *Set the question mode*
11. *Walk the step table*
12. *End of the run*

 *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Run the epic* run only when the request or the packet needs them. *Run the epic* runs only in an epic run. Each part SHALL be a `##` heading of `SKILL.md`, in that order. `SKILL.md` SHALL hold an overview table right after its opening paragraphs, and before `## Placeholders`. The table SHALL have one row per part, in the same order. Each row SHALL name the part and link to its heading. It SHALL say what the part does, and whether it runs in the `lets-go` session or a fresh one. It SHALL say what comes next, and when the part stops. The skill SHALL hold no `## Start` heading, and SHALL not name *Start* anywhere. Another requirement of this spec may still say *Start*. There it means the parts from *Read the settings* to *Set the question mode*, which run before the walk. *Start*'s blocker read is the blocker read in *Check the issue*.

#### Scenario: The overview lists every part
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds a table before `## Placeholders` whose rows name the twelve parts, each linked to its heading, in run order

#### Scenario: The parts are headings in run order
- **WHEN** the skill-interfaces test lists the `##` headings of `skills/lets-go/SKILL.md`
- **THEN** each of the twelve parts is one of them, in the order the overview lists them, none is `## Start`, and no file of `lets-go` says `*Start*`

#### Scenario: A part missing from the overview
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a `## Route` heading and an overview table that has no row for *Route*
- **THEN** the overview check fails, and its output names `Route`

### Requirement: An entry table says where the run goes after the request
*Read the request* SHALL hold a table that decides where the run goes, from the branch the run started on and the request. Its rows SHALL be the default branch and another branch. Its columns SHALL be a number, an idea and nothing. Each of the six cells SHALL name the part the run goes to next, or the stop:

- On the default branch, a number goes to *Check the issue*. An idea goes to *Start from an idea*. Nothing runs `next`: a pick prints `Picked #<i>: <title>, the next ready issue.` and goes to *Check the issue*, and an empty backlog stops.
- On another branch, a number goes to *Check the issue* when it is one of the open issues whose title starts with the branch's name and ` — `, and stops otherwise. An idea stops: an idea needs the default branch. Nothing goes to *Check the issue* when exactly one open issue's title starts that way, and stops when none or several do.

The table SHALL replace the bullets *Start* step 2 held, with the same results. A leading or trailing `ask` or `auto` SHALL be read before the table decides, as *lets-go takes one issue number or an idea* says. On another branch, words stop the run, so `lets-go` SHALL ask no question about the word there.

#### Scenario: An idea on the default branch
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on `main`, the default branch
- **THEN** the entry table sends the run to *Start from an idea*

#### Scenario: An idea on a change's branch
- **WHEN** the user runs `lets-go add a --quiet flag` on the branch `lets-go-chore`
- **THEN** the entry table stops the run, and `lets-go` says that an idea needs the default branch

#### Scenario: Nothing on a change's branch with one match
- **WHEN** the user runs `lets-go` with nothing on the branch `lets-go-chore`, and one open issue's title starts `lets-go-chore — `
- **THEN** the entry table sends the run to *Check the issue* for that issue

#### Scenario: The table has six cells
- **WHEN** the skill-interfaces test reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** it finds a table with a row for the default branch and a row for another branch, and a column each for a number, an idea and nothing

### Requirement: Each part ends by saying what comes next
Every part but *End of the run* SHALL end its own text with a line that starts `Next:`. A part's own text runs from its heading to the next heading of any level, so the line comes before any subsection of the part. The line SHALL link the part or parts that can follow, and give the condition for each when there is more than one. A procedure that a part runs, such as *Find the source of demand*, *Confirm the packet* or *Claim*, SHALL say that it returns to the part that ran it, and SHALL have no `Next:` line. *End of the run* SHALL say that the run is over.

#### Scenario: Route says what comes next
- **WHEN** the skill-interfaces test reads the *Route* section of `skills/lets-go/SKILL.md`
- **THEN** its last non-empty line starts `Next:` and links `#enter-the-branch`

#### Scenario: A part with a subsection
- **WHEN** the skill-interfaces test reads *Walk the step table*, which has the subsection *Records that disagree*
- **THEN** the last non-empty line before `### Records that disagree` starts `Next:` and links `#end-of-the-run`

#### Scenario: A part without a Next line
- **WHEN** a skills folder holds `lets-go/SKILL.md` whose *Set the question mode* section ends with no `Next:` line
- **THEN** the check fails, and its output names `Set the question mode`

#### Scenario: Check the issue goes to shape or to route
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** its `Next:` line links `#run-the-shape-step` and `#route`, each with its condition

### Requirement: lets-go refers to no step by its number
`skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` SHALL refer to another part of the skill by its name and a link, never by a step number. Outside fenced code blocks and inline code spans, no text SHALL match the word `step` or `steps` followed by a number, in any case. So the skill SHALL not say `*Start* step 3`, `*Claim* step 2`, `Step 3 of [Run a step](#run-a-step)` or `go on to step 4`. The shape prompt SHALL name `lets-shape`'s steps by their bold titles, **Find or create the issue** and **Confirm, then write**, not by their numbers. A numbered list SHALL still number its items.

#### Scenario: No step numbers
- **WHEN** the skill-interfaces test reads `lets-go`, outside code
- **THEN** it finds no `step` or `steps` followed by a number

#### Scenario: A step number comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with the line `Go on from *Claim* step 3.`
- **THEN** the check fails, and its output names `SKILL.md` and `step 3`

#### Scenario: A numbered list
- **WHEN** a section of `lets-go` holds a list numbered `1.` to `4.`
- **THEN** the step-number check passes

#### Scenario: The shape prompt names lets-shape's steps
- **WHEN** the skill-interfaces test reads *What shape runs* in `lets-go`
- **THEN** it finds `**Find or create the issue**` and `**Confirm, then write**`

### Requirement: Every link inside lets-go names one of its headings
This holds for `skills/lets-go/SKILL.md` and for each file in `skills/lets-go/references/`. A link to a place in the same file is written `](#<anchor>)`. Outside code, each such link SHALL match the anchor GitHub makes from one of that file's own headings. GitHub makes it from the heading's text: in lower case, with each space made a hyphen. It drops every character other than a letter, a digit, a hyphen or an underscore. A link to another file is written with a path relative to the linking file, such as `](references/records.md#records-that-disagree)` or `](../SKILL.md#walk-the-step-table)`. Outside code, the path SHALL name a file that exists, and an anchor after it SHALL match one of that file's headings. A link that leaves the skills folder, or that starts with a URL scheme such as `https:`, is not checked here. The skill-interfaces check SHALL fail on a link that matches no file or no heading, and SHALL name the linking file and the link. It SHALL run on the source skills, and on `lets-go` as the release build installs it in each published flow, `standard` and `minimal`.

#### Scenario: Every link resolves
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** every `](#...)` link outside code matches one of its headings, such as `#enter-the-branch` for `## Enter the branch` and `#the-changes-name` for `### The change's name`

#### Scenario: A link to a heading that is gone
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a link `[Start](#start)` and no heading `Start`
- **THEN** the check fails, and its output names `SKILL.md` and `#start`

#### Scenario: A link in a reference file
- **WHEN** `lets-go/references/glossary-preflight.md` links `[Check the prerequisite](#check-the-prerequisite)` and has a heading `## Check the prerequisite`
- **THEN** the check passes for that file

#### Scenario: A link to a heading in another file
- **WHEN** a skills folder holds `lets-go/SKILL.md` linking `[records disagree](references/records.md#records-that-disagree)`, and `lets-go/references/records.md` has a heading `## Records that disagree`
- **THEN** the check passes

#### Scenario: A link to a missing file
- **WHEN** a skills folder holds `lets-go/SKILL.md` linking `[the frame](references/frame.md)`, and there is no `lets-go/references/frame.md`
- **THEN** the check fails, and its output names `SKILL.md` and `references/frame.md`

#### Scenario: A link to a heading another file does not have
- **WHEN** a skills folder holds `lets-go/references/shape.md` linking `[Check the issue](../SKILL.md#check-the-issue)`, and `lets-go/SKILL.md` has no heading `Check the issue`
- **THEN** the check fails, and its output names `references/shape.md` and `../SKILL.md#check-the-issue`

#### Scenario: The links in both published flows
- **WHEN** the release build installs the `standard` flow and the `minimal` flow
- **THEN** every link in each installed file of `lets-go` resolves to a file and a heading inside the installed skills

### Requirement: Each lets-go procedure returns a result
Each procedure of `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure is a section under `## Procedures` in `SKILL.md`, or one of *Glossary preflight*, *Import the glossary checkpoint* and *Commit the discovery map* in a reference file. *Glossary preflight*, which only *Claim* runs, SHALL return to *Claim*. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results. Each result is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed`, `branch-failed` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |

*Glossary preflight* returns `no-owned-edits` when the story owns no glossary edits, and otherwise passes on what *Check the checkpoint* returns. `verified` carries the checkpoint commits to import. *Claim*'s `claimed` carries what *Glossary preflight* returned, so *Enter the branch* runs *Import the glossary checkpoint* only after `verified`. *Commit the discovery map* ends one way only, so it names no result.

#### Scenario: Every procedure returns
- **WHEN** the skill-interfaces test reads each procedure of `lets-go`, in `SKILL.md` and in its reference files
- **THEN** each one says it returns to the part that ran it, or, for *Glossary preflight*, to *Claim*, has no `Next:` line, and holds no `stop` or `stops` outside code

#### Scenario: A procedure that stops
- **WHEN** a skills folder holds `lets-go/SKILL.md` whose *Confirm the packet* says ``Say to run the `lets-shape` skill on `#<i>`, and stop.``
- **THEN** the check fails, and its output names `Confirm the packet`

#### Scenario: Claim lists its results
- **WHEN** the skill-interfaces test reads *Claim*
- **THEN** it finds `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed` and `branch-failed`

#### Scenario: Confirm the packet lists its results
- **WHEN** the skill-interfaces test reads *Confirm the packet*
- **THEN** it finds `complete`, `needs-shape` and `epic`

### Requirement: Each part names the action for each result
A part that runs a procedure SHALL name each result the procedure can return there. For each one, it SHALL say what to do: go on, run another part, or tell the user what the result carries and stop. A part SHALL not hold a catch-all such as `any other stop stands`. The overview's *Stops when* column SHALL name the results a part stops on.

#### Scenario: Check the issue acts on the packet's results
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** it finds `complete`, `needs-shape` and `epic`, each with its action

#### Scenario: Enter the branch acts on the claim's results
- **WHEN** the skill-interfaces test reads *Enter the branch*
- **THEN** it finds `claimed`, `taken`, `unresolved`, `checkpoint-failed` and `branch-failed`, each with its action, and no `branch-exists`

#### Scenario: A claim with owned glossary edits
- **WHEN** *Glossary preflight* returns `verified` with two checkpoint commits, and *Claim* then returns `claimed`
- **THEN** *Enter the branch* runs *Import the glossary checkpoint* with those two commits before it commits the discovery map

#### Scenario: A claim with no owned edits
- **WHEN** *Glossary preflight* returns `no-owned-edits`, and *Claim* returns `claimed`
- **THEN** *Enter the branch* runs no import

#### Scenario: An epic stops the run
- **WHEN** the user runs `lets-go` for `#194`, and *Confirm the packet* returns `epic`
- **THEN** `lets-go` says that an epic is built through its stories, lists its open sub-issues, claims nothing and stops

### Requirement: lets-go states the action, not an override
`lets-go` SHALL state each action directly. Outside code, no text of `lets-go` SHALL hold `aside`, or the word `stand` or `stands`, in any case, except in `stands for`. So the skill SHALL not say `set that stop aside`, `the stop in next stands` or `The lines printed for the lost issue stand`.

#### Scenario: No override idiom
- **WHEN** the skill-interfaces test reads `lets-go`, outside code
- **THEN** it finds no `aside`, and no `stand` or `stands` other than in `stands for`

#### Scenario: An override comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with the line ``When nothing is ready, the stop in `next` stands.``
- **THEN** the check fails, and its output names `stands`

#### Scenario: The placeholders table
- **WHEN** `lets-go` says `Each one stands for one thing` and has a column `What it stands for`
- **THEN** the check passes

### Requirement: lets-go looks for the change's branch before the packet check
*Check the issue* SHALL look for the change's branch once for each issue it checks. It SHALL look right after the blocker read, and before it runs *Find the source of demand* and *Confirm the packet*, whether a blocker is open or not. On the default branch, it SHALL run `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`. On a change's branch, the branch exists. *Enter the branch* SHALL use what *Check the issue* found, and SHALL not look again. After a shape step, *Check the issue* SHALL look again for the shaped issue, whose title gives the name. Sometimes the branch exists and *Confirm the packet* returns `needs-shape`. Then `lets-go` SHALL say that the change has started on `<name>`, and why the packet needs shaping. It SHALL say to run `lets-shape` on `#<i>`, and stop. It SHALL do the same on the default branch and on the change's branch.

#### Scenario: The lookup comes before the packet check
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** `git ls-remote --heads origin refs/heads/<name>` comes before the link to `#confirm-the-packet`

#### Scenario: A started change with a new comment, on the default branch
- **WHEN** the user runs `lets-go 123` on the default branch, `origin` has the branch `lets-go-chore`, and *Confirm the packet* returns `needs-shape` because #123 has a comment after the watermark
- **THEN** `lets-go` says the change has started on `lets-go-chore`, says to run `lets-shape` on #123, stops, and runs no shape step

#### Scenario: The same change, on its branch
- **WHEN** the user runs `lets-go` on the branch `lets-go-chore`, whose issue #123 has the same comment
- **THEN** `lets-go` says the same, and stops

### Requirement: Only an idea or a named issue goes to the shape step
`lets-go` SHALL run the shape step before *Claim* only for an idea, or for an issue the user named or confirmed as the same work. On `needs-shape`, `lets-go` SHALL run the shape step only when all three of these hold:

- the user named the issue, or confirmed it as the same work;
- the change's branch does not exist, locally or on `origin`;
- no shape step has run in this run.

Otherwise it SHALL say why the packet needs shaping, say to run `lets-shape` on `#<i>`, and stop, running no step. `next` SHALL count a candidate as ready only when *Check the prerequisite* returns `resolved` for it and *Confirm the packet* returns `complete`. It SHALL check the candidates in rank order, each with that candidate's number as `<i>` while it is checked. It SHALL skip a candidate for which either check fails. So `next` never sends an issue to the shape step, and never edits an issue it skips.

#### Scenario: Next skips a candidate with an unread comment
- **WHEN** `next` ranks #150 first and #151 second, #150 has a comment after the watermark, and #151's packet is complete
- **THEN** `lets-go` prints `Picked #151: <title>, the next ready issue.`, runs no shape step, and leaves #150 as it was

#### Scenario: Next skips a candidate with no Kind
- **WHEN** the Project's first Todo candidate, #160, has no Kind
- **THEN** `next` skips #160, and does not pick it

#### Scenario: A picked packet changes before the check
- **WHEN** `next` picked #151, and *Check the issue*'s *Confirm the packet* then returns `needs-shape` because a comment arrived in between
- **THEN** `lets-go` says to run `lets-shape` on #151, stops, claims nothing, and runs no shape step

#### Scenario: A named issue still goes to shape
- **WHEN** the user runs `lets-go` for `#180` on the default branch, no branch for its change exists, and #180 has no Kind
- **THEN** `lets-go` runs the shape step for #180

### Requirement: A lost claim drops the issue, and three lost claims stop the run
When *Claim* returns `taken` for an issue the user named or confirmed as the same work, `lets-go` SHALL say who has it, and stop. In an epic run, the user named the epic, and the epic run picked each story. When *Claim* returns `taken` for such a story, `lets-go` SHALL settle the story with the line `#<story> <story-name>: not built, taken by <login>`, naming each assignee *Claim* returns. It SHALL count no lost claim, and SHALL pick again as *An epic run picks each story as next picks it* says. The three-lost-claims stop SHALL not apply in an epic run: the epic's stories are a fixed set, so the run always ends. When `next` or *Pick the first ready story* picked the issue, `lets-go` SHALL leave out every issue lost in this run. It SHALL run `lets backlog ready` again, with the same `--only` as the first pick and every lost issue in `--exclude`, and take the first ready candidate that is left. It SHALL print the `Picked` line in the same form as the first pick. That is `Picked #<i>: <title>, the next ready issue.` after `next`. After *Pick the first ready story*, it is `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL keep the lines it printed already. It SHALL go on from the blocker read with the new issue. When no candidate is left, it SHALL stop as when nothing is ready. Outside an epic run, after the third lost claim in one run, `lets-go` SHALL say that other sessions keep taking the picked issues, say to run `lets-go` again, and stop, claiming nothing.

#### Scenario: The lost issue is not picked again
- **WHEN** `next` picked #149, *Claim* returns `taken` for it, and the candidate list read before the claim still holds #149
- **THEN** `lets-go` leaves #149 out, runs `lets backlog ready --exclude 149`, and picks another issue

#### Scenario: A lost story under a parent
- **WHEN** *Pick the first ready story* picked #191 under #190, and *Claim* returns `taken` for it, and #192 is the next ready story
- **THEN** `lets-go` prints `Picked #192: <title>, the first ready story under #190.`, and picks no issue outside #190's stories

#### Scenario: Three lost claims
- **WHEN** *Claim* returns `taken` for three picked issues in one run
- **THEN** `lets-go` says other sessions keep taking the picked issues, says to run `lets-go` again, claims nothing and stops

#### Scenario: A lost story in an epic run
- **WHEN** an epic run on #278 picked #279, and *Claim* returns `taken` for it with the assignee `octocat`
- **THEN** `lets-go` settles #279 with `#279 epic-run-skeleton: not built, taken by octocat`, runs `lets backlog ready` again with `--exclude 279`, and does not stop

#### Scenario: Three lost stories in an epic run
- **WHEN** an epic run on #278 has five stories, and *Claim* returns `taken` for three of them in turn
- **THEN** `lets-go` does not say that other sessions keep taking the picked issues, and goes on to pick from the two stories left

### Requirement: A done report is checked against its record
After a `done` report from plan, review plan, build or review build, the walk SHALL check the report before it prints the step's line. It SHALL read the three records again, as at the start of the walk: `git status --porcelain`, `gh pr view <name> --json number,url,state,isDraft,body`, and the archive folder. It SHALL apply their disagreement rules, then run the row's done test. When the records disagree, `lets-go` SHALL stop as *Records that disagree stop the run* says. When the test says the step is done, the walk SHALL print the step's `Done` line and go on. When the test says the step is not done, the step has failed. `lets-go` SHALL print its `Failed` line, whose reason starts `the step reported done, but` and names the record and what it holds. It SHALL end the walk as for a `failed` report, and SHALL not run the step again. A shape step's `done` report SHALL need no check of its own: *Check the issue* runs *Confirm the packet* after it, and a second `needs-shape` stops the run.

#### Scenario: Plan reports done on a blocked change
- **WHEN** the plan step reports `done`, and `openspec instructions apply --change lets-go-chore --json` then says `blocked`
- **THEN** `lets-go` prints a line that starts `Failed plan: the step reported done, but` and names the state `blocked`, prints no `Done plan:` line, and runs no review plan

#### Scenario: Review plan reports done with no section
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the review plan step reports `done`, and pull request #167's body still has no **Plan review** section
- **THEN** `lets-go` prints a line that starts `Failed review plan: the step reported done, but` and names the missing **Plan review** section, and runs no build

#### Scenario: Review build reports done on a draft
- **WHEN** the review build step reports `done`, the archive folder exists, and pull request #167 is still a draft
- **THEN** `lets-go` prints `Records disagree:`, names the draft, and prints no `Done review build:` line

#### Scenario: Plan leaves a file uncommitted
- **WHEN** the plan step reports `done`, and `git status --porcelain` then lists `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `lets-go` prints `Records disagree:`, names the path, prints no `Done plan:` line, and runs no review plan

#### Scenario: A report the records agree with
- **WHEN** the build step reports `done`, and the state is then `all_done`
- **THEN** `lets-go` prints `Done build:` with the report's date and evidence, and goes on to review build

### Requirement: Each lets-go rule is written once
`lets-go` SHALL write each of these rules in one place. Every other place that uses a rule SHALL link to it or name it, and SHALL not restate it.

- The question mode, in *Set the question mode*.
- The form of each step's `Done`, `Skipped` and `Failed` line, and what fills `<date>` and `<evidence>`, in one section.
- The branch check, in *Check the issue*.
- What a `lets backlog` error does, in *Backlog errors*.
- The prerequisite check, in *Check the prerequisite*.
- The packet check, in *Confirm the packet*.
- Each step's done test, in the walk.

A rule written once MAY run more than once. `next` runs *Check the prerequisite* and *Confirm the packet* on each candidate, and *Check the issue* runs both again for the picked issue. *Claim*'s *Glossary preflight* SHALL run only *Check the checkpoint*, which runs *Check the prerequisite* again only when the owner of the glossary definitions or the proposed base has changed. *Find the source of demand* SHALL not say that it returns to *Claim*, because *Claim* never runs it.

#### Scenario: Each line form is written once
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** it finds `Done shape: <date>. <evidence>` and `Skipped shape: #<i>'s packet is complete, last edited <date>.` once each

#### Scenario: Claim looks for no branch
- **WHEN** the skill-interfaces test reads *Claim* in `lets-go`
- **THEN** it finds no `branch-exists`, and no branch lookup

#### Scenario: The preflight in Claim checks no prerequisite first
- **WHEN** `lets-go` runs *Claim* for #152, whose **Glossary handoff** names #150 as the owner of its definitions, #150's pull request has merged, and neither the owner nor the base has changed since *Check the issue*
- **THEN** *Claim* runs *Check the checkpoint* only when #152 owns the edits, and does not run *Check the prerequisite* again

#### Scenario: No return to Claim
- **WHEN** the skill-interfaces test reads *Find the source of demand*
- **THEN** it does not say `When *Claim* ran it, return to *Claim*`

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, the `<shape-name>` and `<slug>` rules of *The change's name*, and *What shape runs* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the four parts. *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the three shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** it finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *What shape runs* and *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`

#### Scenario: A part whose steps moved
- **WHEN** the skill-interfaces test reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** the skill-interfaces test reads the *Run the epic* section of `SKILL.md`
- **THEN** it links `references/epic-run.md#run-the-epic`, its last paragraph starts `Next:`, `references/epic-run.md` has a heading `Run the epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run

#### Scenario: The prompt frame is one block to copy
- **WHEN** the skill-interfaces test reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a heading `Records that disagree`
- **THEN** the check fails, and its output names `Records that disagree`

#### Scenario: The child's part is in its file
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings

### Requirement: lets-go reads the glossary file only for a story with a glossary handoff
`SKILL.md` SHALL say to read `references/glossary-handoff.md` only when the issue's body has a **Glossary handoff** section. Where *Find the source of demand* runs *Check the prerequisite*, and where *Claim* runs *Glossary preflight*, `SKILL.md` SHALL say what each returns for an issue with no such section: `resolved` and `no-owned-edits`, without reading the file. These are the results the moved text already gives for a story with no glossary handoff.

#### Scenario: An issue with no glossary handoff
- **WHEN** the skill-interfaces test reads *Find the source of demand* and *Claim* in `SKILL.md`
- **THEN** each names **Glossary handoff** and links `references/glossary-handoff.md`, *Find the source of demand* names `resolved`, and *Claim* names `no-owned-edits`

### Requirement: lets-go carries the glossary's entries for its own terms
`skills/lets-go/references/terms.md` SHALL hold the entries of `openspec/glossary.md` for *Part*, *Procedure*, *Step*, *Step report*, *Question mode* and *Packet*. Each entry SHALL be a `##` heading with the term, as in the glossary, and its text SHALL be the glossary entry's text, word for word. The file SHALL hold no other entry. An installed skill cannot link `openspec/glossary.md`: in a project that installs `lets-go`, that path is the project's own glossary. So this file is how the definitions travel with the skill. The skill-interfaces check SHALL fail when an entry's text differs from the glossary's, or when an entry is missing from either file, and SHALL name the term.

#### Scenario: The copy matches the glossary
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/terms.md` and `openspec/glossary.md`
- **THEN** each of the six terms has a `##` heading in both files, the text under each heading is the same once whitespace is collapsed, and the check passes

#### Scenario: The glossary changes and the copy does not
- **WHEN** a fixture glossary's *Procedure* entry says `run by a part` and the fixture `terms.md` says `run by a part or another procedure`
- **THEN** the check fails, and its output names `Procedure`

#### Scenario: A term missing from the copy
- **WHEN** the fixture `terms.md` has no `## Step report` heading
- **THEN** the check fails, and its output names `Step report`

### Requirement: lets-go links each glossary term at its first use
In `skills/lets-go/SKILL.md`, the first mention of each of *Packet*, *Step*, *Step report* and *Question mode*, in any case and outside the frontmatter and code, SHALL sit in a link to that term's heading in `references/terms.md`, such as `[step report](references/terms.md#step-report)`. A mention of *Step report* SHALL not count as a mention of *Step*. The skill SHALL not repeat a definition that `terms.md` holds.

#### Scenario: Each term links at its first mention
- **WHEN** the skill-interfaces test finds, in `SKILL.md` outside the frontmatter and code, the first line that mentions each of `packet`, `step`, `step report` and `question mode`
- **THEN** that line holds a link to `references/terms.md#packet`, `#step`, `#step-report` or `#question-mode`, as the term is

#### Scenario: A term used before its link
- **WHEN** a fixture `SKILL.md` says `the issue's packet` on one line, and links `[packet](references/terms.md#packet)` on a later line
- **THEN** the check fails, and its output names `packet`

### Requirement: lets-go explains each of its own terms where it first appears
`lets-go` SHALL explain each term below, in the section where it first appears, in the same sentence or the one before it. The explanation SHALL say what the term is, not only where it is used.

| Term | Where | What the explanation says |
|---|---|---|
| *Find the source of demand* and `next` | The paragraph before the overview table in `SKILL.md` | *Find the source of demand* finds the run's issue: the one the user named, the one an idea's words describe, or `next`. `next` is the first ready issue on the backlog, as that procedure ranks it. |
| *Procedure* | The same paragraph | A part or another procedure runs it, and it returns a result to what ran it. It links `references/terms.md#procedure`. |
| *read marker* and the unread-comment rule | *Confirm the packet* | A read marker is a comment that `lets-shape` posts when it has read the thread, as the issue-comments reference says. A comment is unread when it was created or edited after both the body's last edit and the newest read marker. The sentence `The watermark is the later of the body's last edit and the newest read marker` stays. |
| *Glossary handoff* | Its first mention in `SKILL.md`, in *Find the source of demand* | The section `lets-shape` writes in a story's issue body when shaping added glossary terms. It records which issue owns the definitions, and where the owner's glossary commits are. |
| *prerequisite* | *Check the prerequisite*, in `references/glossary-handoff.md` | The glossary definitions a story needs that another issue owns. |
| *checkpoint* and *owned paths* | *Check the checkpoint* | The checkpoint is the ordered `docs:` commits that hold shaping's glossary edits. The owned paths are the glossary files those commits may change. |
| *rehearse* | *Check the checkpoint*, at its first use | Try the import first in a throwaway checkout, and keep the real working tree as it is. |
| *holding branch* | *Import the commits* | The branch `lets-shape` makes from the default branch to keep the checkpoint commits until a story's branch imports them. |

The opening paragraphs of `SKILL.md`, before the overview, SHALL say that "you" is the agent that runs the skill, and "the user" is the person who asked for the run. No reference file SHALL say it again.

The `## Procedures` section of `SKILL.md` SHALL say, before its first procedure, that a part or another procedure runs each procedure, and that each returns to what ran it.

#### Scenario: The explanations are in their sections
- **WHEN** the skill-interfaces test reads the paragraph before the overview table, *Confirm the packet*, *Find the source of demand*, *Check the prerequisite*, *Check the checkpoint* and *Import the commits*
- **THEN** each holds its row's explanation, and *Confirm the packet* still holds `The watermark is the later of the body's last edit and the newest read marker`

#### Scenario: Who "you" is
- **WHEN** the skill-interfaces test reads `SKILL.md` up to the overview table
- **THEN** it says `"You" is the agent`, and no file in `skills/lets-go/references/` says it

#### Scenario: A procedure that another runs
- **WHEN** the skill-interfaces test reads `## Procedures` up to its first `###` heading
- **THEN** it says that a part or another procedure runs each procedure

### Requirement: The lets-go description says when to use it in about 50 words
The `description` in the frontmatter of `skills/lets-go/SKILL.md` SHALL start with `Use when`, and SHALL hold at most 60 words. It SHALL name these requests: a story, bug or chore, or an idea in words, built end to end to a pull request ready for review; the next story; the change on the current branch; and `lets-go` run again after a run stopped. It SHALL say that `lets-go` runs each step in a fresh session. It SHALL leave the question modes, the shape rules and the resume details to the body.

#### Scenario: The description as it ships
- **WHEN** the skill-interfaces test reads the frontmatter of `skills/lets-go/SKILL.md`
- **THEN** its `description` starts `Use when`, holds at most 60 words, and holds `next story`, `current branch` and `fresh session`

#### Scenario: A description that grew
- **WHEN** a fixture `SKILL.md` has a `description` of 61 words that starts `Use when`
- **THEN** the check fails, and its output names the word count

### Requirement: The resume paragraph says what a run started again does
The paragraph near the top of `SKILL.md` that tells the user to run `lets-go` again after a run stops SHALL say what the new run does in each of these cases:

- **On the change's branch:** it finds the issue from the branch's name, prints a dated line for each step already done, and goes on from the first unfinished step.
- **On the default branch, with the issue number:** it finds the change's branch, here or on `origin`, switches to it, and goes on the same way. It does not claim the issue again.
- **On the default branch, with an epic's number:** it starts the epic run again. It gives each story whose pull request is ready, merged or closed its line, resumes each story this user started, and builds the rest.
- **On the default branch, with nothing:** it does not resume. It picks the next ready issue, and a claimed issue is never ready. To resume, give the issue number, or run it on the change's branch.
- **After a failed step:** the run that failed never runs that step again. A new run starts it afresh, in a new session, with the answers given so far. A failed shape step has no branch: the run says to run `lets-shape` on the idea or the issue.
- **After the pull request is merged or closed:** there is nothing to resume, and the run stops.

#### Scenario: Each case is named
- **WHEN** the skill-interfaces test reads `SKILL.md` up to the overview table
- **THEN** it names the change's branch, the default branch with the issue number, the default branch with an epic's number, the default branch with nothing, a failed step and a merged or closed pull request, each with what the new run does

### Requirement: Enter the branch opens the shape file only after a shape step
*Enter the branch* SHALL link *Commit the discovery map* in `references/shape.md` only for a run in which a shape step ran. For a run with no shape step, it SHALL say that there is no map to commit, so the run reads no part of `references/shape.md`. *Commit the discovery map* keeps its own rule, so a map is committed exactly when *lets-go commits the discovery map on the story's branch* says.

#### Scenario: A claim with no shape step
- **WHEN** the skill-interfaces test reads *Enter the branch*
- **THEN** each link to `references/shape.md#commit-the-discovery-map` sits in a sentence that says a shape step ran in this run

### Requirement: lets-go wraps its prose at 72 columns
No line of `skills/lets-go/SKILL.md` or of a file in `skills/lets-go/references/` SHALL be longer than 72 columns, outside these exceptions. A column is one character (one Unicode code point), not one byte.

- the frontmatter, between the opening and closing `---`;
- a table row, a line whose first character other than a space is `|`;
- a line inside a fenced code block, the fence lines included;
- a line that holds one link and nothing else but leading spaces, a list marker such as `-` or `1.`, and one closing `.`, `,`, `;` or `:`;
- every line of `references/terms.md`, which copies `openspec/glossary.md` word for word.

The skill-interfaces check SHALL fail on any other line longer than 72 columns, and its output SHALL name the file, the line number and the length.

#### Scenario: The source wraps
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds no line longer than 72 columns outside the exceptions

#### Scenario: A prose line too long
- **WHEN** a skills folder holds `lets-go/references/shape.md` whose line 4 is 73 characters of prose
- **THEN** the check fails, and its output names `references/shape.md`, line `4` and the length `73`

#### Scenario: A table row, a command and a lone link
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a 120-column table row, a 120-column line inside a ```` ```bash ```` block, and a line longer than 72 columns that holds only `   [Import the glossary checkpoint](references/glossary-handoff.md#import-the-glossary-checkpoint).`
- **THEN** the check passes

#### Scenario: Wide characters count once
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a prose line of 70 characters, five of them `ログを直す`
- **THEN** the check passes

#### Scenario: The exit-3 sentence wraps
- **WHEN** the skill-interfaces test reads *Run a step* in `skills/lets-go/SKILL.md`
- **THEN** `**3**: no fresh session can run here, for example because no resolver started one` spans more than one line, and the exit-3 check still passes

### Requirement: lets-go links each section it names
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a file by a link to its heading, every time, in prose and in table cells, the overview's *Next* column included. A link to a section of another `lets-go` file, or of another skill, SHALL use a path relative to the linking file, as *Every link inside lets-go names one of its headings* says. A section of another skill that a published flow does not install, such as *Check an earlier review* in `lets-review-plan`, which the `minimal` flow leaves out, SHALL stay in italics, so that every link resolves in both flows. A heading inside the step prompt frame, which is not a heading of the file, SHALL be written as it is typed, in a code span, such as `## What to run`. `references/terms.md` is exempt: it copies `openspec/glossary.md` word for word, and the glossary names sections such as *Route* and *Claim* in italics.

Outside fenced code blocks, inline code spans and `references/terms.md`, the skill-interfaces check SHALL fail on italic text, `*...*`, that equals the text of a heading outside code in a `lets-go` file, or of a heading that a `lets-go` link points to in another skill. Its output SHALL name the file, the line number and the text.

#### Scenario: Every section reference is a link
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`, outside code
- **THEN** it finds no italic text that equals a heading of those files, such as `*Claim*` or `*Check the issue*`

#### Scenario: An italic section name comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a heading `## Route` and, on line 12, the text `otherwise *Route*`
- **THEN** the check fails, and its output names `SKILL.md`, line `12` and `Route`

#### Scenario: A section of another skill
- **WHEN** the skill-interfaces test reads *End of the run* in `skills/lets-go/SKILL.md`
- **THEN** it finds a link to `../lets-review-build/SKILL.md#finish-the-change`

#### Scenario: A section the minimal flow does not install
- **WHEN** the skill-interfaces test reads the review plan row of *Walk the step table*
- **THEN** it finds `*Check an earlier review*` in italics and the `lets-review-plan` skill named, and no link to `../lets-review-plan/`

#### Scenario: A heading of the prompt frame
- **WHEN** the skill-interfaces test reads *Write the prompt* in `references/step-prompt.md`
- **THEN** it finds `` `## What to run` `` and no `*What to run*`

#### Scenario: The glossary's copy keeps its italics
- **WHEN** the skill-interfaces test reads `references/terms.md`, which says `such as *Route* or *Walk the step table*`
- **THEN** the check passes, and `terms.md` still matches `openspec/glossary.md`

#### Scenario: Italics that name no section
- **WHEN** a skills folder holds `lets-go/SKILL.md` with no heading `Resume mode`, and the text `*Resume mode*` inside a fenced code block
- **THEN** the check passes

### Requirement: lets-go names a pull request section in bold
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a pull request's body in bold, such as **Code review** and **Plan review**. A heading the agent searches for, such as `## Plan review`, and a printed line SHALL stay in code font. The skill-interfaces check SHALL fail on an inline code span that holds only `Code review` or `Plan review`, and its output SHALL name the file and the line number.

#### Scenario: The sections are bold
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds `**Code review**` in *Walk the step table* and in *Records that disagree*, and no code span that holds only `Code review` or `Plan review`

#### Scenario: A section name in code font comes back
- **WHEN** a skills folder holds `lets-go/references/records.md` whose line 30 says ``has no `Code review` section``
- **THEN** the check fails, and its output names `references/records.md` and line `30`

#### Scenario: A heading to search for
- **WHEN** `references/records.md` says ``Find the `## Plan review` heading``
- **THEN** the check passes

### Requirement: lets-go names a step in plain words in prose
In prose, `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a step as *The step table* says: shape, plan, review plan, build or review build, in plain words. Code font SHALL stay for a `--for` value, a file name, a config key and the step table's *Step* column.

#### Scenario: The steps named in code font are plain
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** none of them says ``Run the `shape` step``, ``When `review-build` reports`` or ``after `shape`, go on``

#### Scenario: The `--for` names stay in code font
- **WHEN** the skill-interfaces test reads *The step table*
- **THEN** it still says that `--for` uses `shape`, `plan`, `review-plan`, `build` and `review-build`

### Requirement: lets-go gives a whole printed line in a text block
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL give each whole line the run prints in a fenced `text` block. A part of a line, such as the `Records disagree:` prefix, a line named in passing, and a line in a table cell, such as a Skip line in *The step table*, SHALL be an inline code span.

#### Scenario: The Picked line of next
- **WHEN** the skill-interfaces test reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** `Picked #<i>: <title>, the next ready issue.` is a line of a `text` block, as `Picked #<i>: <title>, the first ready story under #<parent>.` is in `references/shape.md`

#### Scenario: The Failed examples
- **WHEN** the skill-interfaces test reads *The step lines*
- **THEN** `Failed review build: <reason>` and `Failed shape: <reason>` are lines of a `text` block

### Requirement: lets-go reads and claims the backlog only through lets backlog
`lets-go` SHALL read the ready issues with `lets backlog ready`, read an issue with `lets backlog item <i>`, search titles with `lets backlog find`, claim with `lets backlog claim <i>` and release with `lets backlog release <i>`. It SHALL run no `gh project` command and no Project query. These stay as `gh` until the shaping side moves: the comment thread read of *Confirm the packet*, which is a GraphQL query with its pagination; `gh issue view <i> --json createdAt`; the in-progress parent query; and the issue body edit that records a **Glossary handoff** import. Pull request reads and edits stay as `gh pr` commands.

#### Scenario: No backlog gh in the skill
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds no `gh project`, no `projectsV2`, no `--add-assignee`, no `--remove-assignee` and no `gh issue list --search "is:open no:assignee`, and finds `lets backlog ready`, `lets backlog item <i>`, `lets backlog find`, `lets backlog claim <i>` and `lets backlog release <i>`

#### Scenario: Why no shaped story is ready
- **WHEN** a shape step reports stories #191 and #192, `lets backlog ready --only 191,192` returns no issues, and `lets backlog item 191` returns `"assignees": ["octocat"]`
- **THEN** `lets-go` names #191 as left out because `octocat` has it

#### Scenario: An epic's sub-issues
- **WHEN** the user runs `lets-go` for #52, and `lets backlog item 52` returns Kind Epic and `subIssues` #136 and #137
- **THEN** `lets-go` says that an epic is built through its stories, lists #136 and #137, and runs no other command to find them

#### Scenario: The parent's Shared decisions
- **WHEN** `lets-go` confirms the packet of a Story whose parent is #52
- **THEN** it reads the parent's **Shared decisions** from the `parent` that `lets backlog item <i>` returned, and runs no `gh issue view 52`

### Requirement: A backlog error stops the run
When a `lets backlog` command returns an `error`, `lets-go` SHALL stop, claim nothing more and run no step. For `no-backlog` it SHALL say to run the `lets-setup-backlog` skill. For `several-backlogs` it SHALL list each Project's title and URL, ask the user to unlink the extras, and never pick one. For any other error it SHALL show the error's `message`. *Backlog errors* SHALL hold this rule, and every part that runs a `lets backlog` command SHALL link to it.

#### Scenario: No Project
- **WHEN** no Project is linked to the repository, and the user runs `lets-go` on the branch `fix-typo`
- **THEN** `lets backlog find fix-typo` returns `no-backlog`, and `lets-go` says to run the `lets-setup-backlog` skill and stops

#### Scenario: Two Projects
- **WHEN** two open Projects are linked to the repository, and the user runs `lets-go` on the default branch
- **THEN** `lets-go` lists both titles and URLs from the `several-backlogs` error, asks the user to unlink the extras, claims nothing and stops

#### Scenario: gh fails
- **WHEN** `lets backlog item 149` returns `"error": "backend-failed"` with the message `gh auth login required`
- **THEN** `lets-go` shows `gh auth login required` and stops

#### Scenario: An unknown backlog provider
- **WHEN** the user's lets config sets `backlog.provider` to `jria`, and `lets backlog ready` returns `"error": "unknown-backlog-provider"`
- **THEN** `lets-go` shows the error's `message`, which names `jria`, and stops

### Requirement: A failed claim write stops the run
When `lets backlog claim <i>` returns `failed`, *Claim* SHALL return `claim-failed` with the write and the message, before it creates a branch. `lets-go` SHALL show which write failed and the message, say what the issue may be left holding, such as the user's assignment, and stop. It SHALL not release the claim, and SHALL run no step. When creating the branch fails and `lets backlog release <i>` then returns `failed`, *Claim* SHALL return `branch-failed` with both errors.

#### Scenario: The Status write fails
- **WHEN** `lets backlog claim 149` returns `"result": "failed"`, `"write": "status"` and `"message": "field not found"`
- **THEN** `lets-go` says the Status write failed with `field not found`, that #149 may still be assigned to the user, creates no branch and stops

#### Scenario: Release fails after a branch failure
- **WHEN** creating the branch `lets-go-chore` fails, and `lets backlog release 149` returns `failed` with `"write": "unassign"`
- **THEN** *Claim* returns `branch-failed`, and `lets-go` shows the branch error and the release error, and stops

### Requirement: Claim instructions describe session arbitration
Claim SHALL state that an assigned issue returns taken before any write, and that concurrent claims normally produce one winner and one taken result, with a link to the read-lag risk. It SHALL link to the claim comment format. It SHALL pass the returned claim token to release on branch creation or glossary import failure. Existing lost-claim routing SHALL remain unchanged.

#### Scenario: An assigned issue
- **WHEN** the assignee read finds a nonzero count
- **THEN** Claim returns taken before assignment or Status changes

#### Scenario: Branch creation fails
- **WHEN** the session wins a claim and cannot create its branch
- **THEN** it releases with its own claim token

### Requirement: Claim recovery names the next action
On a failed assignment without a token, the skill SHALL stop and ask the user to inspect the assignment. On release returning `not-found`, it SHALL ask the user to inspect the issue before retrying.

#### Scenario: Assignment fails without a token
- **WHEN** claim reports a failed assignment with no token
- **THEN** the skill stops and asks the user to inspect the assignment

#### Scenario: Release finds no comment
- **WHEN** release returns `not-found`
- **THEN** the skill asks the user to inspect the issue before retrying

### Requirement: lets-go shows an item by its label and runs commands with its key
`lets-go` shows an item to a person in the lines it prints, the questions it asks and the text it writes in an issue. There, `#<i>`, `#<parent>` and `#<story>` SHALL stand for that item's `label`, as `lets backlog` returns it. Where `lets-go` runs a command, `<i>`, `<parent>` and `<story>` SHALL stand for the item's `key`. The `## Placeholders` section of `skills/lets-go/SKILL.md` SHALL say so once. With the GitHub backlog provider the label is `#` and the issue number, so every line reads as it did before.

#### Scenario: A GitHub pick
- **WHEN** `next` picks the issue whose `key` is `149` and whose `label` is `#149`
- **THEN** `lets-go` prints `Picked #149: <title>, the next ready issue.` and runs `lets backlog claim 149`

#### Scenario: A pick on another backlog provider
- **WHEN** `next` picks the item whose `key` and `label` are both `PROJ-12`
- **THEN** `lets-go` prints `Picked PROJ-12: <title>, the next ready issue.` and runs `lets backlog claim PROJ-12`

### Requirement: An epic run starts on an epic with open stories
When *Confirm the packet* returns `epic` for the run's issue, and the run started on the default branch, `lets-go` SHALL start an epic run on that epic, `#<parent>`. On a change's branch it SHALL say that an epic run needs the default branch, and stop: an epic has no change's branch. The epic's stories SHALL be the open sub-issues that `lets backlog item <parent>` printed in *Check the issue*, in the order it printed them. They SHALL stay the same set for the whole epic run: a sub-issue added or closed during the run does not change it. `lets-go` SHALL claim nothing on the epic, and create no branch for it: it claims each story it builds, as for any picked issue. Before the epic run starts, *Check the issue* SHALL run only these checks on the epic:

- the blocker read and the open-blocker decision, as for any issue. An epic has no change's branch, so `lets-go` SHALL not look for one. An open blocker on the epic SHALL stop the run, as for an issue with no branch;
- *Confirm the packet*, which returns `epic` from the Kind alone.

It SHALL not run *Find the source of demand* or *Check the prerequisite* on the epic. Each story's own *Check the prerequisite* runs when the epic run ranks it.

Each story run SHALL run in a child `lets-go` session, as *An epic run runs each story in a child session* says. This change does not shape an empty epic, though the glossary's *Epic run* entry names it. An epic with no open stories SHALL go as *An epic with no open stories points to lets-shape* says; #283 shapes it.

#### Scenario: An epic with open stories
- **WHEN** the user runs `lets-go #278` on the default branch, #278's Kind is Epic, it has no open blocker, and it has the open sub-issues #279 to #287
- **THEN** `lets-go` starts an epic run whose stories are #279 to #287, in that order, and claims nothing on #278

#### Scenario: An epic with an open blocker
- **WHEN** the user runs `lets-go #278` on the default branch, and #278 is blocked by the open issue #263
- **THEN** `lets-go` says that #263 blocks #278, starts no epic run, and claims nothing

#### Scenario: The epic's own glossary handoff is not checked
- **WHEN** #278's body has a **Glossary handoff** that names #279 as the owner of its definitions, and #279's pull request has not merged
- **THEN** `lets-go` runs no *Check the prerequisite* on #278, and starts the epic run

#### Scenario: The checks on the epic come before the epic run
- **WHEN** the skill-interfaces test reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it says that an epic has no change's branch to look for, and that *Find the source of demand* does not run for an epic, and its `epic` case links `#run-the-epic`

### Requirement: An epic with no open stories points to lets-shape
When an epic run starts and the epic has no open sub-issues, `lets-go` SHALL print `#<parent> has no open stories. lets-go does not shape an empty epic yet: run the lets-shape skill on #<parent>.` It SHALL then stop, claiming nothing and creating no branch.

#### Scenario: An empty epic
- **WHEN** the user runs `lets-go #300` on the default branch, and #300 is an epic with no open sub-issues
- **THEN** `lets-go` prints `#300 has no open stories. lets-go does not shape an empty epic yet: run the lets-shape skill on #300.`, claims nothing, creates no branch and runs no step

### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*. The candidates SHALL be the epic's stories that are in this repository and not yet settled, and no other issue. `lets-go` SHALL pass the epic's stories in this repository to `lets backlog ready` as `--only`, every story already settled as `--exclude`, every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, and every story not settled yet that has its change's branch as `--started`, as *An epic run resumes the stories this user started* says, such as `lets backlog ready --only 279,280,281 --exclude 279 --met-blockers 279 --started 281`. With no story settled it SHALL pass no `--exclude`, with no met story no `--met-blockers`, and with no such branch no `--started`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.`, or the `Resumed` line for a story passed in `--started`. It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, in this session. It SHALL then run the story's run in a child session, as *An epic run runs each story in a child session* says. When the story's run has ended with its pull request ready for review, `lets-go` SHALL settle the story with its line, as *The epic run settles a story from its child's report* says, run `git switch <default>`, and pick again. It SHALL rank the stories again for every pick, because a story built in this run can change what is ready.

When the case returns `nothing-ready`, every story not yet settled SHALL get its `not built` line, in the epic's order, and the epic run SHALL end as *An epic run ends with one line per story* says.

#### Scenario: The first pick
- **WHEN** an epic run on #278 starts, #279 is the only story that `lets backlog ready --only 279,280,281,282,283,284,285,286,287` lists, and its prerequisite and packet pass
- **THEN** `lets-go` prints `Picked #279: epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story, the next ready story under #278.`, reads #279's blockers, and runs *Claim* for it

#### Scenario: The next pick leaves out the settled stories
- **WHEN** the epic run has built #279, and settles it with its line
- **THEN** `lets-go` runs `git switch` to the default branch, then `lets backlog ready` with `--only` naming the epic's stories, `--exclude 279`, and `--met-blockers 279` when #279's pull request is open and ready for review

#### Scenario: A started story in the pick
- **WHEN** an epic run on #278 starts, nothing is settled at the start, and only #282's change's branch `epic-run-resume` exists, on `origin`
- **THEN** the first pick runs `lets backlog ready --only 279,280,281,282,283,284,285,286,287 --started 282`

#### Scenario: A candidate whose packet is not complete
- **WHEN** `lets backlog ready` lists #281 and #282, and *Confirm the packet* returns `needs-shape` for #281
- **THEN** `lets-go` picks #282, runs no shape step for #281, and #281 is not settled yet

#### Scenario: A sub-issue in another repository
- **WHEN** the epic's open sub-issues are #279 and `other-org/tools#5`
- **THEN** `lets-go` passes `--only 279`, and `other-org/tools#5` gets `not built, in another repository`

#### Scenario: The story runs in a child session
- **WHEN** the epic run has claimed #279 and entered its branch `epic-run-skeleton`
- **THEN** `lets-go` runs `lets delegate step run --for story` for #279, and walks none of #279's steps in its own session

#### Scenario: No child session
- **WHEN** the epic run builds #279, and `lets delegate step run --for story` exits 3
- **THEN** the epic run walks #279's step table in its own session, and runs each step as *Run a step* says, as *With no child session, the epic run walks the story itself* says

### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's. A story whose pull request was ready for review when the run started gets this line too, as *An epic run settles the stories already ready, merged or closed* says.
- A merged story: `#<story> <story-name>: merged, <pr-url>`, the URL of its merged pull request.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved`, `in another repository`, `its pull request was closed: <pr-url>`, `it depends on #391, which did not finish` or `the epic run stopped at #391`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`, as *Pick the first ready story* does: an open blocker that is not met, an assignee, or its Status, Kind or Priority. For a story passed in `--started`, the signed-in user as an assignee SHALL not be the reason, because `lets backlog ready` keeps such a story.
- A story whose step failed: `#<story> <story-name>: failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- A story whose walk stopped for another reason: `#<story> <story-name>: stopped: <reason>`.

#### Scenario: Two built, one blocked
- **WHEN** an epic run on #278 builds #279 and then a story #391, and #283 is blocked throughout by #263, which is not a story of #278
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#391 <story-name>: <pr-url>`, then `#283 <story-name>: not built, blocked by #263`

#### Scenario: A stacked story's line
- **WHEN** an epic run on #278 builds #279, then builds #280 stacked on #279
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#280 epic-run-stacks: <pr-url>, stacked on #279`

#### Scenario: An assigned story
- **WHEN** #282 is assigned to `octocat` when the epic run starts, and its change's branch exists nowhere
- **THEN** its line is `#282 epic-run-resume: not built, assigned to octocat`

#### Scenario: A started story left out for its Status
- **WHEN** #282 is assigned to the signed-in user `octocat`, its branch `epic-run-resume` exists, it has no open blocker, its Status is Done, and nothing is ready
- **THEN** its line is `#282 epic-run-resume: not built, its Status is Done`, not `assigned to octocat`

#### Scenario: Each line prints as the story settles
- **WHEN** the epic run settles #279 with its pull request URL, and goes on to pick another story
- **THEN** `lets-go` prints #279's line before it prints the next `Picked` line

#### Scenario: Built, failed and skipped stories together
- **WHEN** an epic run on #278 builds #279, the build of #391 fails with `tests fail on main`, #392 is blocked by #391, and the run then builds #394
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, `#391 <story-name>: failed at build: tests fail on main`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#394 <story-name>: <pr-url>`, in that order, and no count line

#### Scenario: A second run after a stop
- **WHEN** an earlier epic run on #278 built #279 to a ready pull request, then stopped during #280's build, and the user runs `lets-go #278` again
- **THEN** the new run prints `#279 epic-run-skeleton: <pr-url>` first, then `Resumed #280: <title>, started in an earlier run, under #278.`, and #280's walk goes on from build

### Requirement: A failure or a stop skips only the stories that depend on it
While an epic run is on a story, from its pick to its line, a stop SHALL end that story's run, and not the epic run. This holds the same way for every stop of the parts and procedures the story runs through: a failed step, records that disagree, a pull request that is merged or closed, a stop of *Check the prerequisite*, a failed claim write, a `lets backlog` error, a `fetch-failed` from *Stack the story*, and every other stop. The lost claim of *A lost claim drops the issue, and three lost claims stop the run* is unchanged: it settles the story with `not built, taken by <login>` and picks again. A stop between stories, such as a `lets backlog` error in a pick, SHALL still end the epic run, as *A backlog error stops the run* says.

On a stop in a story run, `lets-go` SHALL act in this order:

1. Do what the stop says, such as print the `Failed` line and the pull request's URL.
2. Settle the story with `failed at <step name>: <reason>` for a failed step, or `stopped: <reason>` for any other stop. The story is `<failed>` from here on.
3. Check the checkout. When it holds uncommitted changes outside `.workspace/`, staged, unstaged or untracked, the epic run SHALL end at that story. Each story the run had not settled SHALL get `not built, the epic run stopped at #<stopped-story>`, in the epic's order, where `<stopped-story>` is `<failed>`. `lets-go` SHALL leave the changes as they are, print every line, as *End of the run* does, and stop.
4. Otherwise settle each dependent of `<failed>`, in the epic's order, with `not built, it depends on #<failed>, which did not finish`, right after `<failed>`'s own line. A dependent is a story of the epic, in this repository and not settled yet, whose open blockers include `<failed>`, or include another dependent, through any number of stories. Only "blocked by" links between the epic's own stories that are not settled yet count: a link through an issue outside the epic, or through a story settled before this stop, does not make a story a dependent. The line names `<failed>` itself, even when the dependence goes through other stories.
5. Run `git switch <default>`, and pick the next story, as *An epic run picks each story as next picks it* says. Every story settled in steps 2 and 4 is passed in `--exclude`, so none of them is picked. When `git switch` fails, `lets-go` SHALL say Git's error, and end the epic run as step 3 says.

`lets-go` SHALL not retry a failed step in the same run. Running `lets-go` again on the failed story's branch carries on, as for any run. The end of an epic run SHALL print no count of built, failed or skipped stories: the per-story lines are its summary.

`<stopped-story>` and `<failed>` are different placeholders from `<story>`, the story the line is for.

The rule's text SHALL appear once, under the heading *A stop in an epic run* in `references/epic-run.md`. Each stop keeps its own text. Each section that holds a stop a story can reach SHALL link the rule, next to its stops, as each `lets backlog` call links *Backlog errors*: *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions* in `SKILL.md`, and *Records that disagree* in `references/records.md`. The sentence after the overview that says any part stops on a `lets backlog` error SHALL link the rule too, and SHALL say that a stop in a story run ends only that story.

#### Scenario: A failed build
- **WHEN** an epic run on #278 has built #279, the build step of #391 reports `failed` with the reason `tests fail on main`, #392 is blocked by #391, #393 is blocked by #392, #394 has no open blocker, and the checkout has no uncommitted changes outside `.workspace/`
- **THEN** `lets-go` prints `Failed build: tests fail on main` and the rest of what *Read the report* says, then the lines `#391 <story-name>: failed at build: tests fail on main`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#393 <story-name>: not built, it depends on #391, which did not finish`, in that order, runs `git switch` to the default branch, and runs the next pick with `--exclude` naming #279, #391, #392 and #393, which can pick #394

#### Scenario: Records that disagree
- **WHEN** the walk of #391 finds that the records disagree, no story of the epic is blocked by #391, and the checkout is clean outside `.workspace/`
- **THEN** #391's line is `#391 <story-name>: stopped: ` followed by the disagreement, no story gets a `depends on` line, and the epic run picks again

#### Scenario: A failed claim write
- **WHEN** *Claim* for #391 returns `claim-failed`, and the checkout is clean outside `.workspace/`
- **THEN** `lets-go` shows what *Claim* says for `claim-failed`, settles #391 with `#391 <story-name>: stopped: ` followed by the reason, and picks again

#### Scenario: Uncommitted changes after a failure
- **WHEN** the build step of #391 reports `failed`, and `git status` shows a modified file `skills/lets-go/SKILL.md` that is not committed
- **THEN** #391's line is `#391 <story-name>: failed at build: <reason>`, each story not settled gets a line such as `#394 <story-name>: not built, the epic run stopped at #391`, `lets-go` prints every line, runs no `git switch` and picks no other story, and the modified file is still there

#### Scenario: Changes only in .workspace
- **WHEN** the build step of #391 reports `failed`, and the only uncommitted files are under `.workspace/`
- **THEN** the epic run settles #391's dependents and picks again

#### Scenario: A link through an issue outside the epic
- **WHEN** the build step of #391 fails, and #395, a story of the epic, is blocked only by #263, which is not a story of the epic and is blocked by #391
- **THEN** #395 gets no `depends on` line when #391 settles, and gets its own line later, such as `#395 <story-name>: not built, blocked by #263`

#### Scenario: A stop between stories
- **WHEN** the epic run has settled #391 after a failure, and the next `lets backlog ready` returns an error
- **THEN** `lets-go` stops as *Backlog errors* says, and picks no other story

#### Scenario: The rule is written once
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/epic-run.md`
- **THEN** it finds `not built, the epic run stopped at #<stopped-story>`, `not built, it depends on #<failed>, which did not finish` and `failed at <step name>: <reason>` once each across the files of `lets-go`, all under the heading *A stop in an epic run*

#### Scenario: Each section with a stop links the rule
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `skills/lets-go/references/records.md`
- **THEN** it finds a link to `epic-run.md#a-stop-in-an-epic-run` in the overview's sentence on `lets backlog` errors, in each of *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions*, and in *Records that disagree*

#### Scenario: A section with a stop that does not link the rule
- **WHEN** a skills folder holds a `lets-go` whose *Run a step* has no link to `epic-run.md#a-stop-in-an-epic-run`
- **THEN** the check fails, and its output names `Run a step`

### Requirement: An epic run counts a blocker as met when its story's pull request is ready
In an epic run, an open blocker SHALL count as met only when all of these hold:

- it is one of the epic's stories, in this repository;
- its change's pull request is open and not a draft: it is ready for review;
- that pull request's head branch is in this repository, not a fork: its branch is on `origin`.

It SHALL not matter whether this epic run or an earlier one built the blocker. The blocker's change's name is the part of its title before ` — `, or the whole title when it has none. Its pull request is the open one whose head branch has that name and whose `isCrossRepository` is false. A blocker whose pull request is a draft, a blocker whose only pull request with that head branch comes from a fork, a blocker with no open pull request, and a blocker that is not one of the epic's stories SHALL not count as met. Before each pick, `lets-go` SHALL read the open pull requests once, with `gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName,isCrossRepository`, and SHALL find the met stories from that one read. A met story's branch and pull request are the ones that read found: *An epic run stacks a story on its met blocker* uses them.

#### Scenario: A blocker built in this run
- **WHEN** an epic run on #278 has built #279, whose pull request #290 from the branch `epic-run-skeleton` is open and ready for review, and #280's only open blocker is #279
- **THEN** the next pick runs `lets backlog ready --only 279,280,281,282,283,284,285,286,287 --exclude 279 --met-blockers 279`, and can pick #280

#### Scenario: A blocker built in an earlier run
- **WHEN** an epic run on #278 starts, #279 is open and assigned, and its pull request from `epic-run-skeleton` is open and ready for review
- **THEN** the first pick passes `--met-blockers 279`, though this run did not build #279

#### Scenario: A blocker whose pull request is a draft
- **WHEN** #279's pull request is a draft, and #280's only open blocker is #279
- **THEN** the pick passes no `--met-blockers 279`, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A blocker whose pull request comes from a fork
- **WHEN** #280's only open blocker is #279, and the only open pull request whose head branch is `epic-run-skeleton` comes from a fork, so its `isCrossRepository` is true
- **THEN** the pick passes no `--met-blockers 279`, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A blocker outside the epic
- **WHEN** #283's only open blocker is #263, which is not a story of #278, and #263 has an open pull request ready for review
- **THEN** the pick does not pass #263 in `--met-blockers`, and #283's line is `#283 <story-name>: not built, blocked by #263`

### Requirement: An epic run stacks a story on its met blocker
In an epic run, when *Check the issue* finds that the story the epic run picked has an open blocker, and either no change's branch here or on `origin`, or a change's branch and no pull request, `lets-go` SHALL decide as follows, in this order, before it runs *Find the source of demand* for the story:

1. When an open blocker is not met, as *An epic run counts a blocker as met when its story's pull request is ready* says, `lets-go` SHALL settle the story with `not built, blocked by #<blocker>`, naming each open blocker that is not met, and pick again.
2. Otherwise `lets-go` SHALL fetch each open blocker's branch with `git fetch origin <blocker-branch>`. The base is the open blocker whose branch contains every other open blocker's branch: for each other open blocker, `git merge-base --is-ancestor origin/<other-branch> origin/<blocker-branch>` succeeds. With one open blocker, that blocker is the base. When two blockers' branches point at the same commit, the base is the first of them in the epic's order.
3. When no open blocker's branch contains all the others, `lets-go` SHALL settle the story with `not built, blocked by #<a> and #<b>, on different branches`, naming every open blocker, and pick again. Three or more blockers are named as `#<a>, #<b> and #<c>`.
4. With a base, `lets-go` SHALL print `Stacks on #<blocker>: <blocker-branch>, pull request #<blocker-pr>.`, before *Claim* runs, and go on with the story. The story is stacked on `#<blocker>` until it is settled.

A settle in steps 1 and 3 SHALL claim nothing, count no lost claim and not end the epic run. For a stacked story with no branch, *Claim* SHALL create the story's branch off `origin/<blocker-branch>`, with no upstream, instead of off the default branch. *Glossary preflight*'s proposed base SHALL be `origin/<blocker-branch>`. A stacked story whose branch exists runs no *Claim*: its step prompts hold the `## Stack` section, so the plan step opens its pull request on `<blocker-branch>`. A started story with a pull request takes its stack from that pull request, as *A resumed story's pull request sets its stack* says. A run that is not an epic run SHALL not stack: an open blocker with no change's branch still stops it.

#### Scenario: One met blocker
- **WHEN** an epic run picks #280, whose only open blocker is #279, and #279's pull request #290 from `epic-run-skeleton` is open and ready for review
- **THEN** `lets-go` prints `Stacks on #279: epic-run-skeleton, pull request #290.`, and *Claim* creates the branch `epic-run-stacks` off `origin/epic-run-skeleton`

#### Scenario: Two blockers on one stack
- **WHEN** an epic run picks #281, whose open blockers are #279 and #280, both met, and `origin/epic-run-stacks` contains `origin/epic-run-skeleton`
- **THEN** `lets-go` prints `Stacks on #280: epic-run-stacks, pull request #<pr>.`, and creates #281's branch off `origin/epic-run-stacks`

#### Scenario: Two blockers on the same commit
- **WHEN** an epic run picks #287, whose open blockers #284 and #285 are both met, the epic lists #284 before #285, and `origin/<#284's branch>` and `origin/<#285's branch>` point at the same commit
- **THEN** `lets-go` stacks #287 on #284, and prints `Stacks on #284: <#284's branch>, pull request #<pr>.`

#### Scenario: Two blockers on different branches
- **WHEN** an epic run picks #286, whose open blockers #284 and #285 are both met, and neither one's branch contains the other's
- **THEN** `lets-go` settles #286 with `#286 <story-name>: not built, blocked by #284 and #285, on different branches`, claims nothing, and picks again

#### Scenario: A blocker that stopped being met
- **WHEN** `lets backlog ready` listed #280 with `--met-blockers 279`, and #279's pull request was marked as a draft before *Check the issue* read #280
- **THEN** `lets-go` settles #280 with `not built, blocked by #279`, claims nothing, and picks again

#### Scenario: A resumed story with a branch and no pull request
- **WHEN** the epic run resumes #282, whose branch `epic-run-resume` exists and has no pull request, and whose only open blocker #281 has the pull request #292 from `epic-run-failures`, open and ready for review
- **THEN** `lets-go` prints `Stacks on #281: epic-run-failures, pull request #292.`, runs no *Claim*, and the plan step's prompt holds a `## Stack` section with `--base epic-run-failures`

#### Scenario: Outside an epic run
- **WHEN** the user runs `lets-go 280` on the default branch, #279 is open and its pull request is ready for review, and no branch `epic-run-stacks` exists
- **THEN** `lets-go` says #279 blocks #280, creates no branch, and claims nothing

### Requirement: A stacked story's pull request targets its blocker's branch
When `lets-go` writes the prompt for a step of a stacked story, the prompt SHALL hold a `## Stack` section. It SHALL name the blocker, its branch and its pull request. It SHALL tell the step to open the story's draft pull request with `--base <blocker-branch>`, and to put the line `Stacked on #<blocker-pr>; merge that first.` on its own line after `Closes #<i>` in its description. When the pull request exists with another base, the section SHALL tell the step to fix it with `gh pr edit <name> --base <blocker-branch>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section. The brainstorm instruction of the `lets-standard` and `lets-minimal` schemas SHALL say to follow the prompt's `## Stack` section, when it has one, where it opens the draft pull request.

#### Scenario: The plan step of a stacked story
- **WHEN** an epic run writes the prompt for the plan step of #280, stacked on #279, whose pull request #290 is from `epic-run-skeleton`
- **THEN** the prompt's `## Stack` section holds `--base epic-run-skeleton` and `Stacked on #290; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** an epic run writes the prompt for a step of #279, which has no open blocker
- **THEN** the prompt holds no `## Stack` section

#### Scenario: The schemas follow the section
- **WHEN** the skill-interfaces test reads the brainstorm instruction of `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`
- **THEN** each says to follow the step prompt's `## Stack` section where it opens the draft pull request

### Requirement: An epic run settles the stories already ready, merged or closed
When an epic run starts, before its first pick, `lets-go` SHALL read the pull requests of each story of the epic in this repository, in the epic's order. A story's pull requests are those whose head branch is the story's change's name and whose `isCrossRepository` is false. Of these, the story's pull request SHALL be the open one when there is one; otherwise the merged one; otherwise the closed one created last. `lets-go` SHALL then settle each story as follows, in the epic's order:

- **Open and ready for review:** the built line, `#<story> <story-name>: <pr-url>`. When the pull request's base is not the default branch, and it is the head branch of a pull request of this repository that merged into the default branch, the blocker has merged: `lets-go` SHALL run `gh pr edit <story-pr> --base <default>`, by the pull request's number, rebase nothing, and give the plain built line. This holds even when the merged pull request's story is still one of the epic's stories. Otherwise, when the base is the branch of another open story of the epic in this repository, the line SHALL end `, stacked on #<blocker>`, naming that story. Any other base SHALL be left as it is, with the plain built line. `lets-go` SHALL run none of the story's steps, and the story SHALL count as met, as *An epic run counts a blocker as met when its story's pull request is ready* says.
- **Merged:** `#<story> <story-name>: merged, <pr-url>`.
- **Closed without merging:** `#<story> <story-name>: not built, its pull request was closed: <pr-url>`.

A story whose pull request is an open draft, or that has no pull request, SHALL not be settled here. A story whose pull request merged or was closed SHALL not be resumed. Its dependents SHALL get their own `not built, blocked by #<blocker>` line when no candidate is left, because its issue is still open. A closed sub-issue is not one of the epic's stories, and SHALL get no line.

#### Scenario: A story ready for review from an earlier run
- **WHEN** an epic run on #278 starts, and #279's pull request #290, from `epic-run-skeleton` into the default branch, is open and ready for review
- **THEN** `lets-go` prints `#279 epic-run-skeleton: <#290's url>` before the first pick, runs no step of #279, and the first pick passes `--exclude 279` and `--met-blockers 279`

#### Scenario: A ready story stacked on an open story
- **WHEN** an epic run starts, #280's pull request #291 is open and ready for review, its base is `epic-run-skeleton`, and #279 is open
- **THEN** #280's line is `#280 epic-run-stacks: <#291's url>, stacked on #279`

#### Scenario: A ready story whose blocker has merged
- **WHEN** an epic run starts, #280's pull request #291 is open and ready for review, its base is `epic-run-skeleton`, #279 is closed, and #290 from `epic-run-skeleton` has merged into the default branch
- **THEN** `lets-go` runs `gh pr edit 291 --base <default>`, rebases nothing, and #280's line is `#280 epic-run-stacks: <#291's url>`, with no `, stacked on`

#### Scenario: A merged story
- **WHEN** an epic run starts, #279 is open, and its pull request #290 has merged into the branch `epic-run-base`
- **THEN** #279's line is `#279 epic-run-skeleton: merged, <#290's url>`, and #279 is not resumed

#### Scenario: A closed story
- **WHEN** an epic run starts, and #281's only pull request #292 was closed without merging
- **THEN** #281's line is `#281 epic-run-failures: not built, its pull request was closed: <#292's url>`, and #281 is not resumed

#### Scenario: A dependent of a merged story
- **WHEN** #279's pull request merged into another story's branch, so #279 is still open, and #280's only open blocker is #279
- **THEN** no pick lists #280, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A draft pull request
- **WHEN** an epic run starts, and #282's only pull request is an open draft
- **THEN** `lets-go` settles no line for #282 at the start

#### Scenario: A pull request from a fork
- **WHEN** an epic run starts, and the only pull request whose head branch is `epic-run-resume` comes from a fork and has merged
- **THEN** `lets-go` settles no line for #282 at the start

### Requirement: An epic run resumes the stories this user started
A started story SHALL be an open story of the epic, in this repository, that is assigned to the signed-in user, and whose change's branch exists here or on `origin`. A story assigned to the signed-in user with no such branch is not started: its line stays `not built, assigned to <login>`. When an epic run starts, `lets-go` SHALL look for each story's change's branch, here and on `origin`. Each pick SHALL pass every story of the epic in this repository, not settled yet, that has its change's branch, in `--started`. `lets backlog ready` keeps those assigned to the signed-in user as candidates, as *ready lists the ready issues in rank order* says. A started story SHALL rank like any other candidate, and the met-blocker rule SHALL apply to it.

When the pick is a story passed in `--started`, `lets-go` SHALL print `Resumed #<i>: <title>, started in an earlier run, under #<parent>.` in place of the `Picked` line. It SHALL then go on with the story from the blocker read in *Check the issue*, as for a picked story. The branch exists, so `lets-go` SHALL not claim the story again: it switches to the branch, and the walk goes on from the first unfinished step.

#### Scenario: A story claimed in an earlier run
- **WHEN** an epic run on #278 starts, #282 is assigned to the signed-in user and In Progress, `origin` has the branch `epic-run-resume`, #282 has no pull request, and it has no open blocker
- **THEN** the pick passes `--started 282`, and when it picks #282, `lets-go` prints `Resumed #282: epic-run-resume — running lets-go on the epic again goes on with its unfinished stories, started in an earlier run, under #278.`, runs no *Claim*, and switches to `epic-run-resume`

#### Scenario: A started story ranks like any other
- **WHEN** #283 is Must and nobody has started it, and #282 is Should and started
- **THEN** the pick lists #283 before #282

#### Scenario: A started story waits for its blocker
- **WHEN** #282 is started, its only open blocker is #281, and #281's pull request is a draft
- **THEN** no pick lists #282, and #282's line is `#282 epic-run-resume: not built, blocked by #281`

#### Scenario: Assigned with no branch
- **WHEN** #284 is assigned to the signed-in user `octocat`, and no branch `epic-run-children` exists here or on `origin`
- **THEN** the pick does not pass #284 in `--started`, and #284's line is `#284 epic-run-children: not built, assigned to octocat`

#### Scenario: Started by someone else
- **WHEN** #285 is assigned to `hubot`, who is not the signed-in user, and `origin` has its change's branch
- **THEN** the pick passes #285 in `--started`, `lets backlog ready` does not list it, and #285's line is `#285 <story-name>: not built, assigned to hubot`

### Requirement: A resumed story's pull request sets its stack
When the story the epic run picked is a started story with an open pull request, *Check the issue* SHALL decide its stack from that pull request's base, before the walk, and SHALL not run *Stack the story*. The story's pull request SHALL be chosen as at the start of the epic run, from `gh pr list --head <name> --state all`, with every pull request from a fork dropped:

- The base is not the default branch, and it is the head branch of a pull request of this repository that merged into the default branch: `lets-go` SHALL run `gh pr edit <story-pr> --base <default>`, by the pull request's number, rebase nothing, and the story SHALL not be stacked. Its line SHALL have no `, stacked on`. This holds even when the merged pull request's story is still one of the epic's stories, because it merged during the epic run.
- Otherwise, the base is the branch of a met story, as *An epic run counts a blocker as met when its story's pull request is ready* says: the story SHALL stay stacked on that story, as `<blocker>`, with that story's branch and pull request. Its step prompts SHALL hold the `## Stack` section, as *A stacked story's pull request targets its blocker's branch* says, and its line SHALL end `, stacked on #<blocker>`.
- Any other base SHALL be left as it is, and the story SHALL not be stacked.

When the started story has no pull request and an open blocker, *An epic run stacks a story on its met blocker* SHALL decide its stack. When its pull request merged or was closed during the epic run, the story SHALL not be stacked, and *Walk the step table* SHALL act on the pull request's state as for any run. Restacking a story after a lower pull request changes in review is out of scope.

#### Scenario: A resumed story stacked on an open story
- **WHEN** the epic run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`, and #280's pull request #291 from `epic-run-stacks` is open and ready for review
- **THEN** each step prompt of #281 holds a `## Stack` section naming #280, `epic-run-stacks` and #291, and #281's line ends `, stacked on #280`

#### Scenario: A resumed story whose blocker has merged
- **WHEN** the epic run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`, #280 is closed, and #291 from `epic-run-stacks` has merged into the default branch
- **THEN** `lets-go` runs `gh pr edit 292 --base <default>` before the walk, rebases nothing, no step prompt of #281 holds a `## Stack` section, and #281's line has no `, stacked on`

#### Scenario: A resumed story whose blocker merged during the epic run
- **WHEN** the epic run started with #280 open and its pull request #291 from `epic-run-stacks` ready for review, #291 then merged into the default branch while the run built another story, and the run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`
- **THEN** `lets-go` runs `gh pr edit 292 --base <default>` before the walk, and no step prompt of #281 holds a `## Stack` section

#### Scenario: A resumed story on the default branch
- **WHEN** the epic run resumes #282, whose draft pull request has the default branch as its base
- **THEN** `lets-go` edits no base, and no step prompt of #282 holds a `## Stack` section

### Requirement: An epic run runs each story in a child session
After *Set the question mode* has set `<mode>` for the story the epic run picked, on the story's branch `<name>`, `lets-go` SHALL run the story's run in a child `lets-go` session, in this order:

1. Write the story prompt to `.workspace/lets-go/<name>-story-prompt.md`. Its first line SHALL be `You run a story run of a lets-go epic run: #<i>, for the change <name>, under #<parent>.` It SHALL name the issue and its URL, the branch `<name>`, `<schema>` and the route line, and SHALL say that the question mode is `<mode>`. It SHALL say that the epic run has already claimed the issue, routed it and entered the branch `<name>`, so the child claims nothing, routes nothing and stays on `<name>`. It SHALL tell the child to invoke the `lets-go` skill, and to end with one step report. For a stacked story it SHALL hold the `## Stack` section that the story's step prompts hold, with the same `<blocker>`, `<blocker-branch>` and `<blocker-pr>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section.
2. Remove `.workspace/lets-go/<name>-story-answers.yaml` and each `.workspace/lets-go/<name>-<step>-rounds.txt`, so the story run starts with no answers and no counted rounds. Do this only before the story's first child session in this run, never when relaying its questions.
3. Run `lets delegate step instructions --for story`, and rank its `options` as *Run a step* ranks a step's: the guidance first, then the order the options came in. When `options` is empty, pass its own family as the one model.
4. Run `lets delegate step run --for story --name <name>-story --prompt-file .workspace/lets-go/<name>-story-prompt.md --effort high`, with one `--model` per ranked option, best first, writing stdout to `.workspace/lets-go/<name>-story-report.json` and stderr to `.workspace/lets-go/<name>-story-meta.txt`.

While a child runs, the epic run SHALL print only its own lines: the `Picked` or `Resumed` line, the `Stacks on` line, the `Questions` line, the questions it relays and their answers, and the story's line. It SHALL NOT print the child's `Skipped`, `Done` or `Failed` lines.

#### Scenario: The story prompt
- **WHEN** an epic run on #278 has entered the branch `story-run-child-sessions` for #284, on `lets-standard`, at the question mode `auto`, stacked on #282, whose pull request #293 is from `epic-run-resume`
- **THEN** `.workspace/lets-go/story-run-child-sessions-story-prompt.md` starts with `You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.`, names `lets-standard` and the question mode `auto`, says that the epic run has already claimed #284, routed it and entered the branch, and holds a `## Stack` section with `--base epic-run-resume` and `Stacked on #293; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** the epic run writes the story prompt for #279, which has no open blocker
- **THEN** the story prompt holds no `## Stack` section

#### Scenario: The child's command
- **WHEN** `lets delegate step instructions --for story` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and its guidance is `null`
- **THEN** the epic run runs `lets delegate step run --for story --name story-run-child-sessions-story --prompt-file .workspace/lets-go/story-run-child-sessions-story-prompt.md --effort high --model claude/claude-opus-5-5 --model gpt/gpt-6-luna`

#### Scenario: Story guidance ranks the models
- **WHEN** `options` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and the guidance is `Prefer gpt.`
- **THEN** the first `--model` is `gpt/gpt-6-luna`

#### Scenario: The story starts with no answers
- **WHEN** an earlier epic run left `.workspace/lets-go/story-run-child-sessions-story-answers.yaml` and `.workspace/lets-go/story-run-child-sessions-plan-rounds.txt`
- **THEN** the epic run removes both before the story's first `lets delegate step run --for story`

#### Scenario: The child's step lines stay in the child
- **WHEN** the child skips plan and runs build, which reports `done`
- **THEN** the epic run prints neither `Skipped plan:` nor `Done build:`

### Requirement: A story run's child walks only the step table
When the request starts with `You run a story run of a lets-go epic run:`, `lets-go` SHALL run as a story run's child. It SHALL take `<i>`, `<name>`, `<parent>`, `<schema>`, the route line, `<mode>` and any stack from the story prompt. When the current branch is not `<name>`, it SHALL end with a `failed` report whose reason is `stopped: the story run is on <branch>, not <name>`. Otherwise it SHALL run none of *Read the request*, *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, and SHALL claim nothing. It SHALL walk *The step table* from its top row on the branch `<name>`, as *Walk the step table* says, and run each step that is not done as *Run a step* says, the subagent step on exit 3 included. Each step's prompt SHALL hold `<mode>` from the story prompt, and the story prompt's `## Stack` section when it has one.

The child's part SHALL be written in `skills/lets-go/references/story-run.md`, whose first lines say to read it only in a story run's child session. *Read the request* in `SKILL.md` SHALL link it for a request that starts with the story prompt's first line.

#### Scenario: A child on its branch
- **WHEN** a child session starts on the branch `story-run-child-sessions` with a story prompt for #284
- **THEN** it runs no `lets backlog claim`, no *Route* and no *Set the question mode*, and reads the walk's three records first

#### Scenario: A child on another branch
- **WHEN** a child session starts on the branch `main` with a story prompt for the change `story-run-child-sessions`
- **THEN** it runs no step, and ends with a `failed` report whose reason is `stopped: the story run is on main, not story-run-child-sessions`

#### Scenario: A step prompt in a child
- **WHEN** the child writes the prompt for the plan step, and the story prompt says the question mode is `ask` and holds a `## Stack` section
- **THEN** the plan step's prompt says the question mode is `ask`, and holds the same `## Stack` section

#### Scenario: The child's part is in a reference file
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/story-run.md` and *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** the reference file says to read it only in a story run's child session, and *Read the request* links `references/story-run.md` beside the text `You run a story run of a lets-go epic run:`

### Requirement: A story run's child ends with one step report
A story run's child SHALL end its session with one step report, as the story prompt says, and SHALL print no pull request URL and no epic line in place of it:

- When the walk ends with every row done, it SHALL end with a `done` report whose first evidence line is `pull request #<pr>: <pr-url>`, the change's pull request.
- When a step fails, including a `done` report that its record does not bear out, it SHALL end with a `failed` report whose reason is `failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- At any other stop of the walk, such as records that disagree, a pull request that is merged or closed, a settled question asked again, or a `lets delegate step run` exit code that stops the walk, it SHALL end with a `failed` report whose reason is `stopped: <reason>`, where the reason is what the stop says.

#### Scenario: Every step done
- **WHEN** the child's review build step reports `done`, and its record shows the pull request #301 ready for review
- **THEN** the child ends with a `done` report whose first evidence line is `pull request #301: <pr-url>`

#### Scenario: Every step done before the child started
- **WHEN** every row of the walk is done when the child reads it
- **THEN** the child prints the four `Skipped` lines, and ends with a `done` report whose first evidence line names the pull request

#### Scenario: A failed build
- **WHEN** the build step reports `failed` with the reason `tests fail on main`
- **THEN** the child ends with a `failed` report whose reason is `failed at build: tests fail on main`

#### Scenario: Records that disagree
- **WHEN** the child finds an archive folder and `openspec/changes/<name>/` both present
- **THEN** the child ends with a `failed` report whose reason starts `stopped: `

### Requirement: A story run's child passes its steps' questions up
A story run's child SHALL answer no step's question, at either question mode. When a step reports `needs-input`, the child SHALL first apply the settled-question stop of *Relay the questions*. Otherwise it SHALL append one line to `.workspace/lets-go/<session>-rounds.txt`, and count the step's rounds in this story run as the lines in that file. It SHALL end with a `needs-input` report that holds the step's questions, in the step's order, each with the step's `recommendation` when it has one. From the step's sixth round, each question SHALL also hold `ask: true`.

When the story prompt ends with an `## Answers` section, the child SHALL give those answers to the step they answer: at the first row of the walk that is not done, when that step's `.workspace/lets-go/<session>-report.json` holds a `needs-input` report, it SHALL append each answer pair whose question is one of that report's questions to `.workspace/lets-go/<session>-answers.yaml`, as *Relay the questions* writes pairs, then run the step with `--answers-file` that file, in place of the row's *Not done* action, and read its report. Before it writes any pair, it SHALL check that report. When the report is not `needs-input`, or a pair matches no question of that report, the child SHALL write nothing, run no step, and end with a `failed` report whose reason is `stopped: the answers match no question the <step name> step asked`.

#### Scenario: A question with a recommendation at auto
- **WHEN** the story prompt says the question mode is `auto`, and the plan step reports `needs-input` with one question that has a recommendation
- **THEN** the child answers nothing, appends a line to `.workspace/lets-go/<name>-plan-rounds.txt`, and ends with a `needs-input` report holding that question and its recommendation, with no `ask`

#### Scenario: The sixth round
- **WHEN** `.workspace/lets-go/<name>-plan-rounds.txt` holds five lines, and the plan step reports `needs-input` again
- **THEN** the child ends with a `needs-input` report each of whose questions holds `ask: true`

#### Scenario: The answers reach the step
- **WHEN** the child starts with a story prompt whose `## Answers` section holds the answer to `Which schema?`, plan is the first row not done, and `.workspace/lets-go/<name>-plan-report.json` holds a `needs-input` report asking `Which schema?`
- **THEN** the child appends that pair to `.workspace/lets-go/<name>-plan-answers.yaml`, and runs the plan step with `--answers-file .workspace/lets-go/<name>-plan-answers.yaml`

#### Scenario: Answers to no open question
- **WHEN** the story prompt's `## Answers` section answers `Which schema?`, and the plan step's last report asked only `Do you confirm the ledger?`
- **THEN** the child runs no step, and ends with a `failed` report whose reason is `stopped: the answers match no question the plan step asked`

#### Scenario: A settled question asked again
- **WHEN** the plan step's `needs-input` report asks a question whose exact text is in `.workspace/lets-go/<name>-plan-answers.yaml`
- **THEN** the child ends with a `failed` report whose reason starts `stopped: `, and passes no question up

### Requirement: The epic run relays a story run's questions
When the child's report is `needs-input`, the epic run SHALL go through its questions in the report's order:

- A question that holds `ask` true SHALL go to the user, with its `recommendation` as the suggested answer, whatever `<mode>` is, and its answer SHALL be written as the user gave it, with no marker. Before the first such question of a report, the epic run SHALL print `Questions: ask for the rest of this step, because it asked for input five times.`
- Every other question SHALL go as `<mode>` says, as *Relay the questions* does: at `auto`, a question with a `recommendation` takes it as the answer, with the marker ` (lets-go accepted the step's recommendation; the user did not decide)`, and one without goes to the user; at `ask`, every question goes to the user.

The epic run SHALL then write this report's pairs, in order, to `.workspace/lets-go/<name>-story-answers.yaml`, replacing what it held, and run the child again with steps 3 and 4 of *An epic run runs each story in a child session*, with the same prompt file and `--answers-file .workspace/lets-go/<name>-story-answers.yaml`. It SHALL ask for the options again, and rank them again. It SHALL NOT write the story prompt again, and SHALL NOT remove the story's answers file or rounds files.

#### Scenario: Auto with a recommendation
- **WHEN** `<mode>` is `auto`, and the child's report asks `Which schema?` with the recommendation `lets-minimal`
- **THEN** the epic run says it answered `Which schema?` with `lets-minimal`, writes the answer `lets-minimal (lets-go accepted the step's recommendation; the user did not decide)`, and runs the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`

#### Scenario: A marked question at auto
- **WHEN** `<mode>` is `auto`, and the child's report asks one question with a recommendation and `ask` true
- **THEN** the epic run prints `Questions: ask for the rest of this step, because it asked for input five times.`, asks the user that question with the recommendation as the suggested answer, and writes the user's answer with no marker

#### Scenario: Each round replaces the answers file
- **WHEN** the epic run relays a second `needs-input` report from the same story
- **THEN** `.workspace/lets-go/<name>-story-answers.yaml` holds only the second report's pairs

#### Scenario: A relay keeps the counted rounds
- **WHEN** `.workspace/lets-go/<name>-plan-rounds.txt` holds two lines, and the epic run relays the child's `needs-input` report
- **THEN** the epic run runs the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`, and `.workspace/lets-go/<name>-plan-rounds.txt` still holds its two lines

### Requirement: The epic run settles a story from its child's report
When `lets delegate step run --for story` ends, the epic run SHALL settle the story, as *Settle a story* says, from its exit code and the report:

- **Exit 0, `done`:** it SHALL read the pull request with `gh pr view <name> --json url,state,isDraft`. When the pull request is open and not a draft, it SHALL settle the story with its built line, or with its stacked line while the story is stacked. Otherwise the line SHALL be `stopped: the story run reported done, but <what the record holds>`, such as `the pull request is a draft` or `the branch has no pull request`.
- **Exit 0, `failed`:** a reason that starts `failed at <step name>: ` or `stopped: ` SHALL be the text after the story's name in its line. Any other reason, including one that `lets` wrote because the child gave no valid report, SHALL give `stopped: <reason>`.
- **Exit 2, 4 or 6:** the line SHALL be `stopped: <reason>`, where the reason is the error `lets delegate` printed on stderr. A child that did not finish in time is one.
- **Exit 3:** nothing is settled from the child. The epic run SHALL go on as *With no child session, the epic run walks the story itself* says, and settle the story when that walk ends.

Every line but a built or stacked line is a stop in a story run: after settling the story, the epic run SHALL go on as *A failure or a stop skips only the stories that depend on it* says, from its third action. The epic run SHALL NOT start the child again for that story in this run.

#### Scenario: A built story
- **WHEN** the child for #284 ends with a `done` report, and `gh pr view story-run-child-sessions` shows the pull request open and not a draft
- **THEN** the epic run settles #284 with `#284 story-run-child-sessions: <pr-url>`, or with `, stacked on #<blocker>` after it while #284 is stacked

#### Scenario: Done, but the pull request is a draft
- **WHEN** the child ends with a `done` report, and the pull request is a draft
- **THEN** the story's line is `#<story> <story-name>: stopped: the story run reported done, but the pull request is a draft`

#### Scenario: A failed step in the child
- **WHEN** the child ends with a `failed` report whose reason is `failed at review build: the review found two blockers`
- **THEN** the story's line is `#<story> <story-name>: failed at review build: the review found two blockers`, and the stories that depend on it get their `depends on` lines

#### Scenario: A report lets could not read
- **WHEN** `lets delegate step run --for story` prints a `failed` report whose reason is `the final message has no step-report block`
- **THEN** the story's line is `#<story> <story-name>: stopped: the final message has no step-report block`

#### Scenario: The child times out
- **WHEN** `lets delegate step run --for story` exits 6
- **THEN** the story's line starts `#<story> <story-name>: stopped: `, the epic run checks the checkout, and picks the next story when it is clean

### Requirement: With no child session, the epic run walks the story itself
When `lets delegate step run --for story` exits 3, the epic run SHALL print `No child session could start for #<i>, so this session walks its steps.` It SHALL then walk the story's step table in its own session, as *Walk the step table* says, with each step in a fresh session or a subagent, as *Run a step* says, and settle the story as *Run the epic* does today. It SHALL NOT run the story prompt in a subagent, even when the meta file names a saved prompt.

When the child exits 3 after the epic run relayed its questions, the epic run SHALL first give the pairs of `.workspace/lets-go/<name>-story-answers.yaml` to the step that asked, as the child does with an `## Answers` section: at the first row that is not done, it SHALL check the step's last report and append the pairs to `.workspace/lets-go/<session>-answers.yaml`, or stop the story's run when a pair matches none of its questions. That step's count of `needs-input` reports SHALL start from the lines in its `.workspace/lets-go/<session>-rounds.txt`.

#### Scenario: Only the default resolver
- **WHEN** the config lists only `subagent`, and the epic run starts the child for #279
- **THEN** `lets delegate step run --for story` exits 3, the epic run prints `No child session could start for #279, so this session walks its steps.`, runs #279's plan step with `lets delegate step run --for plan`, and starts no subagent with the story prompt

#### Scenario: Exit 3 after a relay keeps the answers
- **WHEN** the epic run relays the plan step's question `Which schema?`, writes its answer to `.workspace/lets-go/<name>-story-answers.yaml`, and the child's next run exits 3
- **THEN** the epic run appends that pair to `.workspace/lets-go/<name>-plan-answers.yaml`, and runs the plan step in its own walk with `--answers-file .workspace/lets-go/<name>-plan-answers.yaml`
