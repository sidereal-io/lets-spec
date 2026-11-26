## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL go on as an epic run on that parent, as *A shape step that files a parent goes on as an epic run* says. It SHALL not run that third case again for the report's stories. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL shape the epic when it is empty, as *An epic run shapes an empty epic first* says; stop when it is finished, as *A finished epic stops the run* says; shape it when its discovery stopped partway, as *An epic run finishes a stopped discovery before it builds* says; and otherwise start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- `lets go records <name>`, run before the walk and after each `done` report, as *lets-go walks the step table* says. It makes the walk's reads of Git, GitHub and the change state, the reads of `lets-review-plan`'s *Check an earlier review* among them;
- the parent query of *A stopped discovery resumes from its parent issue*, and its read of the answers and prompt files, run for an idea; for an issue `#<i>` when the discovery maps have uncommitted edits before the shape step, as *lets-go commits the discovery map on the story's branch* says; for an epic with open sub-issues, as *An epic run finishes a stopped discovery before it builds* says; and for a `complete` issue whose `Input:` line names the issue itself, as *An epic run shapes an empty epic first* says;
- in an epic run only, the reads of *An epic run picks each story as next picks it*, the worktree commands and `lets sync` of *An epic run gives each story run a worktree of its own* and *An epic run reuses a story's clean worktree*, and the fetches and ancestry checks of *An epic run stacks a story on its met blocker*;
- the `git status --porcelain -uall -- openspec/discovery.md openspec/discovery` before the shape step and after *Claim*, and the commit of the discovery maps it lists, that *lets-go commits the discovery map on the story's branch* says. In an epic run, these include the copy into the story's worktree and the restore of the epic run's checkout that *An epic run commits the discovery map on the first story it claims* says.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. The reader also finds `gh issue view <i> --json createdAt`, `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `lets backlog claim <i>`, no `gh project` and no `gh api graphql`, and no section named as `lets-build`'s

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
- **WHEN** a reader reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds `lets backlog item <i>` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

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
- **THEN** `lets-go` goes on from the blocker read in *Check the issue* with the epic as `<i>`, and does not run its own `next` case for the three stories

#### Scenario: A branch made after the check
- **WHEN** *Check the issue* found no branch `lets-go-chore` for #149, and someone creates a local branch `lets-go-chore` before *Claim* creates it
- **THEN** *Claim* fails to create the branch, removes its assignment, sets #149's Status back to Todo and returns `branch-failed`, and `lets-go` shows the error and stops

#### Scenario: An epic run checks a started story out in a worktree
- **WHEN** an epic run on #278 picks #280, whose branch `epic-run-stacks` is on `origin` and is not checked out anywhere
- **THEN** `lets-go` does not run *Claim* or `git switch`, runs `git fetch origin epic-run-stacks`, then `git worktree add .workspace/lets-go/worktrees/epic-run-stacks epic-run-stacks`, and the epic run's checkout stays on the default branch

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md`, or a file in `skills/lets-go/references/`, SHALL hold each of these strings, exactly as written: they are lines `lets-go` prints, commands it runs, and names, paths and markers that its steps and other skills read. A string may wrap across lines. `## Placeholders` SHALL be in `SKILL.md` itself, as *Each placeholder in lets-go names one thing* says:

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
- `Picked #<i>: <title>, the next ready issue.`
- `docs: the discovery map from #<parent>`
- `Discovery status: in-progress`
- `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`
- `issue-<i>`
- `idea-<slug>`
- `--for review-plan`
- `lets go records <name>`
- `the step reported done, but lets go records <name> says it is not done`
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

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The skill SHALL not hold `the first ready story under`, and SHALL have no heading *Pick the first ready story*. The skill SHALL not hold `--diff-filter` or `--format=%as`, and SHALL have no heading *Read the records*: `lets go records` makes those reads. The skill SHALL not hold `openspec instructions apply`, `isDraft,body`, `git merge-base --is-ancestor <sha>` or `git show`, because `lets go records` makes the done tests' reads too. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** a reader reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The first-ready-story pick is gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader does not find `the first ready story under`, and no heading is `Pick the first ready story`

#### Scenario: The old discovery query
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and does not find `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`

#### Scenario: The record reads are gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `lets go records <name>`, does not find `--diff-filter` or `--format=%as`, and no heading is `Read the records`

#### Scenario: The done tests' reads are gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader does not find `openspec instructions apply`, `isDraft,body`, `git merge-base --is-ancestor <sha>` or `git show`

#### Scenario: The step table header changes
- **WHEN** an edit changes the step table's header from `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the edit breaks no part of this requirement, because the header is not one of the fixed lines

### Requirement: Each lets-go rule is written once
`lets-go` SHALL write each of these rules in one place. Every other place that uses a rule SHALL link to it or name it, and SHALL not restate it.

- The question mode, in *Set the question mode*.
- The form of each step's `Done`, `Skipped` and `Failed` line, and what fills `<date>` and `<evidence>`, in one section.
- The branch check, in *Check the issue*.
- What a `lets backlog` error does, in *Backlog errors*.
- The prerequisite check, in *Check the prerequisite*.
- The packet check, in *Confirm the packet*.
- Each step's done test, and each disagreement but the diverged branch: in none of `lets-go`'s files. `lets go records <name>` applies them, as *go-records* says, and the walk acts on what it prints.

A rule written once MAY run more than once. `next` runs *Check the prerequisite* and *Confirm the packet* on each candidate, and *Check the issue* runs both again for the picked issue. *Claim*'s *Glossary preflight* SHALL run only *Check the checkpoint*, which runs *Check the prerequisite* again only when the owner of the glossary definitions or the proposed base has changed. *Find the source of demand* SHALL not say that it returns to *Claim*, because *Claim* never runs it.

#### Scenario: Each line form is written once
- **WHEN** a reader reads `lets-go`
- **THEN** the reader finds `Done shape: <date>. <evidence>` and `Skipped shape: #<i>'s packet is complete, last edited <date>.` once each

#### Scenario: No done test is restated
- **WHEN** a reader reads *Walk the step table* and *Read the report*
- **THEN** the reader finds `lets go records <name>` and no ordered list of the tests that say when plan, review plan, build or review build is done

#### Scenario: Claim looks for no branch
- **WHEN** a reader reads *Claim* in `lets-go`
- **THEN** the reader finds no `branch-exists`, and no branch lookup

#### Scenario: The preflight in Claim checks no prerequisite first
- **WHEN** `lets-go` runs *Claim* for #152, whose **Glossary handoff** names #150 as the owner of its definitions, #150's pull request has merged, and neither the owner nor the base has changed since *Check the issue*
- **THEN** *Claim* runs *Check the checkpoint* only when #152 owns the edits, and does not run *Check the prerequisite* again

#### Scenario: No return to Claim
- **WHEN** a reader reads *Find the source of demand*
- **THEN** it does not say `When *Claim* ran it, return to *Claim*`

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the question mode, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. When the walk reaches review plan, `lets-go` SHALL take whether it is done from the `review-plan` key of the `done` key that `lets go records <name>` prints. The command applies *Check an earlier review*, as *go-records* says, and `lets-go` SHALL not apply its rules itself. When the answer is `false`, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. The answer SHALL come from the command's latest output, so a pull request that a step in this run opened or changed is read after that step. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`, filled from the `review-plan` record, as *A skipped step's line carries its evidence and date* says. `lets-go` SHALL not cut the **Plan review** section out of the body to fill the line, and SHALL not run `git log` for its date. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema that picks the line SHALL be the `schema:` line of the first of these files that exists: the change's `openspec/changes/<name>/.openspec.yaml`, then the archived change's `openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`. When neither exists, it SHALL be the route's schema. So an archived change keeps the schema it was built with, even when the route would now pick another.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the walk reached review plan with no **Plan review** section in pull request #167, and the review plan step reported `done` with the date `2026-11-05T10:00:00Z` and the evidence `Plan review: APPROVE for 7d16565` and `pull request #167`
- **THEN** `lets-go` prints `Done review plan: 2026-11-05T10:00:00Z. Plan review: APPROVE for 7d16565; pull request #167` before it runs build

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, and `lets go records lets-go-chore` maps `review-plan` to `true` under `done` and prints the `review-plan` record `{"commit":"7d16565","date":"2026-11-03","pr":167,"verdict":"APPROVE"}`
- **THEN** `lets-go` prints `Skipped review plan: the Plan review in pull request #167 says APPROVE for 7d16565, committed 2026-11-03.` and runs no review plan step

#### Scenario: A ready change with no review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, and `lets go records lets-go-chore` maps `plan` to `true` and `review-plan` to `false` under `done`
- **THEN** the next step to run is review plan, with `--for review-plan`, and build runs only after it reports `done`

#### Scenario: A stale review
- **WHEN** the **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE`, a later commit changed `design.md` that no rebuttal names, and so `lets go records lets-go-chore` maps `review-plan` to `false`
- **THEN** `lets-go` runs the review plan step, whose `lets-review-plan` runs a new round

#### Scenario: The body is read when the row is reached
- **WHEN** the plan step reported `done` in this run, and its brainstorm opened the pull request
- **THEN** `lets-go` takes review plan's answer from the output of `lets go records <name>` that it ran after the plan step's `done` report, not from the output before the walk

#### Scenario: An archived change on lets-minimal
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore/.openspec.yaml` says `schema: lets-minimal`, the issue's Size has since changed to M so that the route would pick `lets-standard`, and pull request #167's body has no **Plan review** section
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.`, and prints no `Records disagree:` line, because `lets go records lets-go-chore` reports no disagreement

### Requirement: lets-go walks the step table
After *Set the question mode*, on the change's branch, `lets-go` SHALL run `lets go records <name>` from the repo root, once, before the walk. It SHALL act on what the command prints, in this order:

1. When the command exits non-zero, `lets-go` SHALL show the user its stderr, stop, and run no step.
2. When the `pull-request` key is `MERGED` or `CLOSED`, `lets-go` SHALL stop as *A closed pull request ends the run* says.
3. When the `disagreements` key is not empty, `lets-go` SHALL stop as *Records that disagree stop the run* says.

Then `lets-go` SHALL walk the step table from the top: plan, review plan, build, review build. The step table SHALL have no row for shape: shape runs before the walk, in *Run the shape step*, and *Check the issue* prints its `Skipped shape` or `Done shape` line. At each row, the row's step SHALL be done when the `done` key of the command's latest output maps the row's *Step* key to `true`, and not done when it maps it to `false`. `lets-go` SHALL not run `git status`, `gh pr view` or `openspec instructions apply` to decide whether a step is done, and SHALL not restate a done test: *go-records* says each one. The step table SHALL not restate one either. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says, and run no command. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL run `lets go records <name>` again and check the report, as *A done report is checked against its record* says, and go on to the next row only when the check passes. The rows after it SHALL use that newer output, because the step changed the records they read. A row that is done reads the latest output and runs the command no more: no step has run since that output.

#### Scenario: A branch with no change
- **WHEN** `lets go records lets-go-chore` exits 0 with `"disagreements":[]`, `"pull-request":null` and `done` mapping every step to `false`
- **THEN** the first step the walk runs is plan, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** the change state is `blocked`, so `lets go records lets-go-chore` maps `plan` to `false`
- **THEN** the first step the walk runs is plan

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`, and `lets go records go-chore` maps `plan` to `false`
- **THEN** the first step the walk runs for `go-chore` is plan

#### Scenario: A ready plan
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, and `done` maps `plan` to `true` and the other steps to `false`
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, runs `lets go records lets-go-chore` again after review plan reports `done`, and runs build when that output maps `build` to `false`

#### Scenario: Every task ticked
- **WHEN** `done` maps `plan`, `review-plan` and `build` to `true`, and `review-build` to `false`
- **THEN** `lets-go` prints four skip lines, then runs review build

#### Scenario: An archived change
- **WHEN** `done` maps every step to `true`, and `disagreements` is `[]`
- **THEN** `lets-go` prints a skip line for each of the four rows, and runs no step

#### Scenario: A built change whose review is missing
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, and `done` maps `plan` and `build` to `true`, and `review-plan` and `review-build` to `false`
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, prints `Skipped build: every task is ticked, last task commit <date> (<sha>).` with the `build` record of the output after review plan's `done` report, and runs review build

#### Scenario: A review round adds a task
- **WHEN** the output before the walk mapped `build` to `true`, the review plan step ran in this run, and its `REVISE` round added an unticked task to `tasks.md` before its `APPROVE`, so the output after its `done` report maps `build` to `false`
- **THEN** `lets-go` runs build instead of printing `Skipped build:`

#### Scenario: An unknown change state
- **WHEN** `lets go records lets-go-chore` exits 4, and its stderr names the state `no_tasks` and holds the CLI's `instruction`
- **THEN** `lets-go` shows that stderr, stops, and runs no step

#### Scenario: The walk runs no done test itself
- **WHEN** a reader reads *Walk the step table*
- **THEN** the reader finds `lets go records <name>`, and does not find `gh pr view <name> --json number,url,state,isDraft,body` or `openspec instructions apply`

#### Scenario: The step table has no done column
- **WHEN** a reader reads the step table of `lets-go`
- **THEN** its header has no *Done when* column

### Requirement: A skipped step's line carries its evidence and date
Each done step SHALL print one line when the walk reaches its row, in step order. When the walk settles a row as done before this run, `lets-go` SHALL fill the row's Skip line from the record under the row's *Step* key, in the latest output of `lets go records <name>`: `<date>` from the record's `date`, `<sha>` from its `commit`, `<pr>` from its `pr` and `<verdict>` from its `verdict`. The latest output is the one from before the walk, or from after the last `done` report, so it holds the records as they are when the walk reaches the row. It SHALL not run `git log`, or cut a section out of the pull request's body, to fill a Skip line. The step table names each step's record. The lines and their records are:

- Plan: `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`, from the `plan` record, the commit that added `openspec/changes/<name>/tasks.md`.
- Review plan: `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`, from the `review-plan` record, as *Review plan runs as a step, or is not in the route* says. On `lets-minimal` the line is `Skipped review plan: not in the lets-minimal route.`, and `lets-go` reads no record for it.
- Build: `Skipped build: every task is ticked, last task commit <date> (<sha>).`, from the `build` record, the last commit that changed `openspec/changes/<name>/tasks.md`.
- Review build: `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.`, from the `review-build` record, the commit that added the archive folder's `tasks.md`, and the pull request. The line is the same on every flow.

The record of plan and of build SHALL be the same after archive as before, as *go-records* says. A `null` record for a step that is done is a disagreement that the command reports, as *Records that disagree stop the run* says, so the walk stops before it reaches the row. The shape line is set by its own requirement.

#### Scenario: A skipped propose
- **WHEN** commit `2bbc7d0` of 2026-11-03 added `openspec/changes/lets-go-chore/tasks.md`, so `lets go records lets-go-chore` prints the `plan` record `{"commit":"2bbc7d0","date":"2026-11-03"}`
- **THEN** `lets-go` prints `Skipped plan: the plan is ready, tasks.md committed 2026-11-03 (2bbc7d0).`

#### Scenario: A skipped apply
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70` of 2026-11-03, so the `build` record is `{"commit":"3222c70","date":"2026-11-03"}`
- **THEN** `lets-go` prints `Skipped build: every task is ticked, last task commit 2026-11-03 (3222c70).`

#### Scenario: A skipped apply review
- **WHEN** commit `1d253bd` of 2026-11-04 added `openspec/changes/archive/2026-11-04-lets-go-chore/tasks.md`, pull request #167 is open and not a draft, and the `review-build` record is `{"commit":"1d253bd","date":"2026-11-04","pr":167}`
- **THEN** `lets-go` prints `Skipped review build: archived 2026-11-04 (1d253bd); pull request #167 is ready for review.`

#### Scenario: A rebased branch
- **WHEN** the branch was rebased after the last task commit, so its committer date is today
- **THEN** the build skip line's date is the `build` record's `date`, the commit's author date, not today

#### Scenario: A skipped review build on the minimal flow
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, `lets go records lets-go-chore` maps every step to `true` with `"disagreements":[]`, and the `review-build` record is `{"commit":"1d253bd","date":"2026-11-04","pr":167}`
- **THEN** `lets-go` prints the same `Skipped review build:` line, and no disagreement

#### Scenario: Each row reads the records again
- **WHEN** the walk settles plan as done, then runs the review plan step in this run, then settles build as done
- **THEN** `lets-go` runs `lets go records <name>` twice, before the walk and after review plan's `done` report, fills the build line from the second output, and runs no `git log` command for either line

#### Scenario: The command fails
- **WHEN** `lets go records lets-go-chore` exits 4 before the walk, with `lets go: gh pr view: HTTP 502` on stderr
- **THEN** `lets-go` shows that stderr, stops, and runs no step

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. `lets-go` SHALL find a disagreement in one of two ways:

- the local branch and `origin/<name>` have diverged, which `lets-go` finds when `git merge --ff-only origin/<name>` cannot fast-forward;
- `lets go records <name>` prints an entry under its `disagreements` key, for one of the rows `dirty-tree`, `change-and-archive`, `archive-not-ready`, `brainstorm-without-pull-request`, `archive-without-plan-review` and `null-record`, as *go-records* says.

For each entry, `lets-go` SHALL print the entry's `found`, and the fix by hand that `references/records.md` gives for the entry's `row`. `references/records.md` SHALL give one fix for each of the six rows, under the row's name, and one for the diverged branch. `lets-go` SHALL not restate when a row matches.

#### Scenario: A dirty tree
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"dirty-tree","found":"skills/lets-go/SKILL.md"}`
- **THEN** `lets-go` prints `Records disagree:`, names `skills/lets-go/SKILL.md`, says to commit or discard it, and runs no step

#### Scenario: A diverged branch
- **WHEN** the local branch `lets-go-chore` and `origin/lets-go-chore` each have a commit the other lacks
- **THEN** `lets-go` prints `Records disagree:`, says the branch and `origin` have diverged, and runs no step

#### Scenario: Archived, but the pull request is a draft
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"archive-not-ready","found":"isDraft: true"}`
- **THEN** `lets-go` prints `Records disagree:`, names `isDraft: true`, says to mark the pull request ready as `lets-review-build` does or revert the archive commit, and runs no step

#### Scenario: A committed brainstorm with no pull request
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"brainstorm-without-pull-request","found":"openspec/changes/lets-go-chore/brainstorm.md"}`
- **THEN** `lets-go` prints `Records disagree:`, names the path, says to push the branch and open the draft pull request, and runs no step

#### Scenario: A read that finds no commit
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"null-record","found":"plan"}`
- **THEN** `lets-go` prints `Records disagree:`, names the `plan` record of `lets go records lets-go-chore`, and runs no step

#### Scenario: Two disagreements
- **WHEN** `lets go records lets-go-chore` prints a `dirty-tree` entry and a `change-and-archive` entry
- **THEN** `lets-go` prints `Records disagree:`, names what each entry found with its fix, and runs no step

#### Scenario: No review plan record on the minimal flow
- **WHEN** the change's `.openspec.yaml` says `schema: lets-minimal`, and `lets go records lets-go-chore` prints `"review-plan":null`, maps `review-plan` to `true` under `done`, and prints `"disagreements":[]`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.`, and no `Records disagree:` line

#### Scenario: A new branch with no pull request
- **WHEN** `lets go records lets-go-chore` prints `"disagreements":[]` and `"pull-request":null`, and maps every step to `false`
- **THEN** `lets-go` prints no disagreement, and the first step the walk runs is plan

#### Scenario: A built change with no plan review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, and `lets go records lets-go-chore` prints `"disagreements":[]` and maps `plan` and `build` to `true` and `review-plan` to `false`
- **THEN** `lets-go` prints no `Records disagree:` line, and runs review plan as *lets-go walks the step table* says

#### Scenario: An archived change on the minimal flow
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, the archive folder exists, the pull request is ready for review with no `Code review` section, and `lets go records lets-go-chore` prints `"disagreements":[]`
- **THEN** `lets-go` prints no disagreement, and runs no step

#### Scenario: An archived change with no plan review
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"archive-without-plan-review","found":"no Plan review section"}`
- **THEN** `lets-go` prints `Records disagree:`, says the pull request has no Plan review section, and runs no step

#### Scenario: An archived change on the standard flow with no code review
- **WHEN** `lets go records lets-go-chore` prints the entry `{"row":"archive-not-ready","found":"no Code review section"}`
- **THEN** `lets-go` prints `Records disagree:`, says the pull request has no Code review section, and runs no step

#### Scenario: Each row has a fix
- **WHEN** a reader reads `references/records.md`
- **THEN** the reader finds `dirty-tree`, `change-and-archive`, `archive-not-ready`, `brainstorm-without-pull-request`, `archive-without-plan-review` and `null-record`, each with what to fix by hand, and a fix for a diverged branch

### Requirement: A closed pull request ends the run
When the `pull-request` key of `lets go records <name>` is `MERGED`, `lets-go` SHALL say the change is merged and the run is finished, and stop. When it is `CLOSED`, `lets-go` SHALL say the change was rejected and there is nothing to resume, and stop. Neither SHALL count as a disagreement, and neither SHALL run a step. `lets-go` SHALL check the `pull-request` key before the `disagreements` key, so a merged or closed change that also has a disagreement ends with this stop. The skill SHALL say when these stops run. They run only when the change's branch still exists and the run can find its issue. That happens in three cases: a stacked pull request merged into the branch below it; a pull request closed without merging; or a closed issue the user names on the default branch, whose branch is still there. In the first two cases the issue stays open.

#### Scenario: A merged pull request
- **WHEN** `lets go records lets-go-chore` prints `"pull-request":"MERGED"`
- **THEN** `lets-go` says the change is merged, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `lets go records lets-go-chore` prints `"pull-request":"CLOSED"`
- **THEN** `lets-go` says the change was rejected, and runs no step

#### Scenario: A merged pull request with a dirty tree
- **WHEN** `lets go records lets-go-chore` prints `"pull-request":"MERGED"` and a `dirty-tree` entry
- **THEN** `lets-go` says the change is merged, prints no `Records disagree:` line, and runs no step

#### Scenario: A stacked pull request merged into its base
- **WHEN** pull request #214 for `lets-go-one-rule-once` merged into `lets-go-procedures-return`, its issue #202 is still open, and the user runs `lets-go` on the branch `lets-go-one-rule-once`
- **THEN** `lets-go` finds #202 by the branch name, reads `"pull-request":"MERGED"` from `lets go records lets-go-one-rule-once`, says the change is merged, and runs no step

### Requirement: A done report is checked against its record
After a `done` report from plan, review plan, build or review build, the walk SHALL check the report before it prints the step's line. It SHALL run `lets go records <name>` again, because the step may have changed any record, and act on its output as before the walk: a non-zero exit, a merged or closed pull request, or a disagreement stops the run. When the records disagree, `lets-go` SHALL stop as *Records that disagree stop the run* says. Otherwise, when the `done` key maps the row's step to `true`, the walk SHALL print the step's `Done` line and go on. When it maps the step to `false`, the step has failed. `lets-go` SHALL print its `Failed` line, whose reason is `the step reported done, but lets go records <name> says it is not done`. It SHALL end the walk as for a `failed` report, and SHALL not run the step again. A shape step's `done` report SHALL need no check of its own: *Check the issue* runs *Confirm the packet* after it, and a second `needs-shape` stops the run.

#### Scenario: Plan reports done on a blocked change
- **WHEN** the plan step reports `done`, and `lets go records lets-go-chore` then maps `plan` to `false`
- **THEN** `lets-go` prints `Failed plan: the step reported done, but lets go records lets-go-chore says it is not done`, prints no `Done plan:` line, and runs no review plan

#### Scenario: Review plan reports done with no section
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the review plan step reports `done`, and `lets go records lets-go-chore` then maps `review-plan` to `false`
- **THEN** `lets-go` prints a line that starts `Failed review plan: the step reported done, but`, and runs no build

#### Scenario: Review build reports done on a draft
- **WHEN** the review build step reports `done`, and `lets go records lets-go-chore` then prints the entry `{"row":"archive-not-ready","found":"isDraft: true"}`
- **THEN** `lets-go` prints `Records disagree:`, names `isDraft: true`, and prints no `Done review build:` line

#### Scenario: Plan leaves a file uncommitted
- **WHEN** the plan step reports `done`, and `lets go records lets-go-chore` then prints the entry `{"row":"dirty-tree","found":"openspec/changes/lets-go-chore/tasks.md"}`
- **THEN** `lets-go` prints `Records disagree:`, names the path, prints no `Done plan:` line, and runs no review plan

#### Scenario: A report the records agree with
- **WHEN** the build step reports `done`, and `lets go records lets-go-chore` then maps `build` to `true`
- **THEN** `lets-go` prints `Done build:` with the report's date and evidence, and goes on to review build
