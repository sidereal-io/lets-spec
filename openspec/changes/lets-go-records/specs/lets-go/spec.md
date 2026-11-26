## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL go on as an epic run on that parent, as *A shape step that files a parent goes on as an epic run* says. It SHALL not run that third case again for the report's stories. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL shape the epic when it is empty, as *An epic run shapes an empty epic first* says; stop when it is finished, as *A finished epic stops the run* says; shape it when its discovery stopped partway, as *An epic run finishes a stopped discovery before it builds* says; and otherwise start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- `lets go records <name>`, run at each row the walk settles as done before this run, as *A skipped step's line carries its evidence and date* says;
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

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *The step prompt says what to run, the question mode, and how to report* says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. When the walk reaches review plan, the first of these that matches SHALL decide whether it is done. First, on `lets-minimal`, review plan is done. Second, when the archive folder exists, review plan is done, and the records disagree when the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line. Third, otherwise, review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`, filled from the `review-plan` record that `lets go records <name>` prints, as *A skipped step's line carries its evidence and date* says. `lets-go` SHALL not cut the **Plan review** section out of the body to fill the line, and SHALL not run `git log` for its date. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the first of these files that exists: the change's `openspec/changes/<name>/.openspec.yaml`, then the archived change's `openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`. When neither exists, it SHALL be the route's schema. So an archived change keeps the schema it was built with, even when the route would now pick another.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the walk reached review plan with no **Plan review** section in pull request #167, and the review plan step reported `done` with the date `2026-11-05T10:00:00Z` and the evidence `Plan review: APPROVE for 7d16565` and `pull request #167`
- **THEN** `lets-go` prints `Done review plan: 2026-11-05T10:00:00Z. Plan review: APPROVE for 7d16565; pull request #167` before it runs build

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, pull request #167's **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE` and covers the plan, and `lets go records lets-go-chore` prints the `review-plan` record `{"commit":"7d16565","date":"2026-11-03","pr":167,"verdict":"APPROVE"}`
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
- `openspec instructions apply --change <name> --json`
- `lets go records <name>`
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

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The skill SHALL not hold `the first ready story under`, and SHALL have no heading *Pick the first ready story*. The skill SHALL not hold `--diff-filter` or `--format=%as`, and SHALL have no heading *Read the records*: `lets go records` makes those reads. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

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

#### Scenario: The step table header changes
- **WHEN** an edit changes the step table's header from `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the edit breaks no part of this requirement, because the header is not one of the fixed lines

### Requirement: A skipped step's line carries its evidence and date
Each done step SHALL print one line when the walk reaches its row, in step order. When the walk settles a row as done before this run, `lets-go` SHALL run `lets go records <name>` from the repo root, and fill the row's Skip line from the record under the row's *Step* key: `<date>` from the record's `date`, `<sha>` from its `commit`, `<pr>` from its `pr` and `<verdict>` from its `verdict`. It SHALL run the command at each such row, not once for the walk, because a step that runs in this walk changes the records the next row reads. It SHALL not run `git log`, or cut a section out of the pull request's body, to fill a Skip line. The step table names each step's record. The lines and their records are:

- Plan: `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`, from the `plan` record, the commit that added `openspec/changes/<name>/tasks.md`.
- Review plan: `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`, from the `review-plan` record, as *Review plan runs as a step, or is not in the route* says. On `lets-minimal` the line is `Skipped review plan: not in the lets-minimal route.`, and `lets-go` reads no record for it.
- Build: `Skipped build: every task is ticked, last task commit <date> (<sha>).`, from the `build` record, the last commit that changed `openspec/changes/<name>/tasks.md`.
- Review build: `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.`, from the `review-build` record, the commit that added the archive folder's `tasks.md`, and the pull request. The line is the same on every flow.

The record of plan and of build SHALL be the same after archive as before, as *go-records* says. When `lets go records` exits non-zero, `lets-go` SHALL show the user its stderr, stop, and run no step. A `null` record for a row the walk settles as done is a disagreement, as *Records that disagree stop the run* says. The shape line is set by its own requirement.

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
- **WHEN** `openspec/config.yaml` says `schema: lets-minimal`, the archive folder exists, and pull request #167 is ready for review with no `Code review` section
- **THEN** `lets-go` prints the same `Skipped review build:` line, and no disagreement

#### Scenario: Each row reads the records again
- **WHEN** the walk settles plan as done, then runs the review plan step in this run, then settles build as done
- **THEN** `lets-go` runs `lets go records <name>` for the plan row and again for the build row, and runs no `git log` command for either line

#### Scenario: The command fails
- **WHEN** the walk settles plan as done, and `lets go records lets-go-chore` exits 4 with `lets go: gh pr view: HTTP 502` on stderr
- **THEN** `lets-go` shows that stderr, stops, and runs no step

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

- `git status --porcelain` lists a path outside `.workspace/`;
- the local branch and `origin/<name>` have diverged;
- a change folder and an archive folder exist for the same name;
- an archive folder exists but the pull request is missing or is a draft, or, when the `schema:` line of `openspec/config.yaml` is `lets-standard`, has no `Code review` section;
- an archive folder exists, the schema is not `lets-minimal`, and the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line;
- `openspec/changes/<name>/brainstorm.md` is committed but the branch has no open pull request;
- `lets go records <name>` prints `null` for the record of a row the walk settles as done before this run. Review plan on `lets-minimal` reads no record, so it is not one.

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
- **WHEN** the state is `ready`, the tree is clean, and `lets go records lets-go-chore` prints `"plan":null`
- **THEN** `lets-go` prints `Records disagree:`, names the `plan` record of `lets go records lets-go-chore`, and runs no step

#### Scenario: No review plan record on the minimal flow
- **WHEN** the change's `.openspec.yaml` says `schema: lets-minimal`, the state is `all_done`, and `lets go records lets-go-chore` prints `"review-plan":null`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.`, and no `Records disagree:` line

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

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the three parts. *Start from an idea*, *Run the shape step* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the two shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** the reader finds *Records that disagree* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`; no file of `lets-go` has a heading *What shape runs* or *Read the records*

#### Scenario: A part whose steps moved
- **WHEN** a reader reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** a reader reads the *Run the epic* section of `SKILL.md`
- **THEN** it links `references/epic-run.md#run-the-epic`, its last paragraph starts `Next:`, `references/epic-run.md` has a heading `Run the epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run

#### Scenario: The prompt frame is one block to copy
- **WHEN** a reader reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a heading `Records that disagree`
- **THEN** the edit breaks this requirement, because that section belongs in `references/records.md`

#### Scenario: The child's part is in its file
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings
