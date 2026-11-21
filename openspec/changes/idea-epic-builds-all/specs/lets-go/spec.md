<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: A shape step that files a parent goes on as an epic run
When the shape step reports `done` with the first evidence line `epic #<parent>: <title>` and at least one `story #<story>: <title>` line, `lets-go` SHALL go on from the blocker read in *Check the issue* with `<parent>` as `<i>`, whatever the run started from: an idea, an issue that discovery split into a new parent whose `Input:` line names that issue, an empty epic that discovery shaped in place, or an epic whose stopped discovery the step finished. That read SHALL find the parent's open stories, and its `epic` case SHALL start an epic run on them, as *An epic run starts on an epic with open stories* says. The epic run SHALL build every one of those stories, in waves, and end with one line per story. `lets-go` SHALL ask the user nothing before the epic run starts, in either question mode: the user already confirmed the stories in discovery's Phase 5. It SHALL print the `Done shape` line once, before the epic run prints its waves. It SHALL pick no single story from the report. A story that is not ready SHALL get its `not built` line, as *An epic run ends with one line per story* says. When the first evidence line is `issue #<i>: <title>`, `lets-go` SHALL go on with that one issue and start no epic run.

#### Scenario: An idea's discovery builds every story
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin model`, and the shape step reports `done` with `epic #190: Epic: plugin backlog`, `story #191: plugin-contract — ...`, `story #192: plugin-github — ...` and `story #193: plugin-docs — ...`
- **THEN** `lets-go` prints one `Done shape:` line, runs `lets backlog item 190`, prints `Waves for #190:`, and starts an epic run on #190 whose stories are #191, #192 and #193

#### Scenario: A split issue builds every story
- **WHEN** the user runs `lets-go #180`, and the shape step reports `done` with `epic #300: Epic: plugin contract`, `story #301: ...` and `story #302: ...`, and #300's body says `Input: #180`
- **THEN** `lets-go` starts an epic run on #300 whose stories are #301 and #302, and claims nothing on #180 or #300

#### Scenario: No question before the epic run
- **WHEN** the question mode is `ask`, and the shape step reports `done` for `epic #190: Epic: plugin backlog` with three stories
- **THEN** `lets-go` asks the user no question between the step's report and the line `Waves for #190:`

#### Scenario: No story under the parent is ready
- **WHEN** the shape step filed #190 with the stories #191 and #192, and both are blocked by the open issue #120, which is not under #190
- **THEN** the epic run claims nothing, ends with one `not built, blocked by #120` line for each of #191 and #192, and prints no `Picked` line

#### Scenario: A discovery that fits one story starts no epic run
- **WHEN** the shape step reports `done` with the first evidence line `issue #190: plugin-contract — ...`
- **THEN** `lets-go` takes #190 as `<i>`, confirms its packet as a Story, and starts no epic run

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL go on as an epic run on that parent, as *A shape step that files a parent goes on as an epic run* says. It SHALL not run that third case again for the report's stories. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL shape the epic when it is empty, as *An epic run shapes an empty epic first* says; stop when it is finished, as *A finished epic stops the run* says; shape it when its discovery stopped partway, as *An epic run finishes a stopped discovery before it builds* says; and otherwise start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the parent query of *A stopped discovery resumes from its parent issue*, and its read of the answers and prompt files, run for an idea; for an issue `#<i>` when the discovery maps have uncommitted edits before the shape step, as *lets-go commits the discovery map on the story's branch* says; for an epic with open sub-issues, as *An epic run finishes a stopped discovery before it builds* says; and for a `complete` issue whose `Input:` line names the issue itself, as *An epic run shapes an empty epic first* says;
- in an epic run only, the reads of *An epic run picks each story as next picks it*, the worktree commands and `lets sync` of *An epic run gives each story run a worktree of its own* and *An epic run reuses a story's clean worktree*, and the fetches and ancestry checks of *An epic run stacks a story on its met blocker*;
- the `git status --porcelain -uall -- openspec/discovery.md openspec/discovery` before the shape step and after *Claim*, and the commit of the discovery maps it lists, that *lets-go commits the discovery map on the story's branch* says. In an epic run, these include the copy into the story's worktree and the restore of the epic run's checkout that *An epic run commits the discovery map on the first story it claims* says.

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
- **THEN** `lets-go` goes on from the blocker read in *Check the issue* with the epic as `<i>`, and does not run its own `next` case for the three stories

#### Scenario: A branch made after the check
- **WHEN** *Check the issue* found no branch `lets-go-chore` for #149, and someone creates a local branch `lets-go-chore` before *Claim* creates it
- **THEN** *Claim* fails to create the branch, removes its assignment, sets #149's Status back to Todo and returns `branch-failed`, and `lets-go` shows the error and stops

#### Scenario: An epic run checks a started story out in a worktree
- **WHEN** an epic run on #278 picks #280, whose branch `epic-run-stacks` is on `origin` and is not checked out anywhere
- **THEN** `lets-go` does not run *Claim* or `git switch`, runs `git fetch origin epic-run-stacks`, then `git worktree add .workspace/lets-go/worktrees/epic-run-stacks epic-run-stacks`, and the epic run's checkout stays on the default branch

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* returns `complete`, and no shape step ran in this run, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.`, once for that issue. `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* returns `complete` after a shape step reported `done` in this run, `lets-go` SHALL print `Done shape: <date>. <evidence>` instead, with the report's `date` and its `evidence` joined with `; `. It SHALL print the `Done shape` line once per run: after a lost claim, *Check the issue* SHALL not print it again for the issue picked next, and in an epic run that a shape step started, it SHALL not print it again for any story. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says, and print no skip line.

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
- **WHEN** discovery filed the parent #190 with the stories #191 and #192, `lets-go` printed `Done shape:` before the waves for #190, *Claim* returned `taken` for #191, and the epic run then picked #192
- **THEN** `lets-go` prints no second `Done shape:` line, and no `Skipped shape:` line for #192

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
- `Picked #<i>: <title>, the next ready issue.`
- `docs: the discovery map from #<parent>`
- `Discovery status: in-progress`
- `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`
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

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The skill SHALL not hold `the first ready story under`, and SHALL have no heading *Pick the first ready story*. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The first-ready-story pick is gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it does not find `the first ready story under`, and no heading is `Pick the first ready story`

#### Scenario: The old discovery query
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and does not find `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`

#### Scenario: The step table header changes
- **WHEN** the step table's header no longer reads `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the fixed-lines check still passes

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says, and for an epic the user named, as *An epic run shapes an empty epic first* and *An epic run finishes a stopped discovery before it builds* say. For an epic whose stopped Finalize *A stopped discovery resumes from its parent issue* found through another input's answers, the step SHALL run for that input, under that input's `<shape-name>`. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. When the step ran for an epic `#<i>` whose `Input:` line names another input, `lets-go` SHALL also remove that input's answers file, under its own `<shape-name>`, and, for an idea, only when that input's prompt file holds that idea: otherwise a stopped round of that input leaves answers that *A stopped discovery resumes from its parent issue* finds when the run goes back to *Check the issue*. When the step reports `done` with an `epic #<parent>` line, `lets-go` SHALL also remove `.workspace/lets-go/issue-<parent>-shape-answers.yaml`, whatever input the step ran for: a stopped round of `lets-go #<parent>` may have left answers there. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The step SHALL run `lets-shape` on the idea or on `#<i>`, with the prompt *The step prompt says what to run, the question mode, and how to report* gives it. `lets-shape` SHALL pick its path as the `discovery-checkpoints` capability says: it shapes the work as one issue, to the end of its comment reads, its reply and its glossary handoff, or runs discovery when the work is too large, as *The shape step runs discovery only after a yes* says. For an idea that the title search already checked, the step SHALL run no second title search. The step SHALL create no change and no change branch, and SHALL end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. The packet confirmation, the question about which product an idea belongs to, and the question that moves the map for a second product SHALL reach `lets-go` with no recommendation, so `lets-go` asks the user in either mode. The first evidence line of a `done` report SHALL be `issue #<i>: <title>` for one issue. When discovery filed stories, it SHALL be `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL take the parent as `<i>`, and go on as *A shape step that files a parent goes on as an epic run* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number or an epic's number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `<shape-name>` is `idea-fix-letssync-quiet-output`: the dash alone is dropped, and four words are all there are

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`, after the title search found no match
- **THEN** its header holds `add a --quiet flag to lets sync` and says the search ran and no open issue is the same work, and its `## What to run` section holds only ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.``

#### Scenario: The shape prompt names discovery
- **WHEN** `lets-go` writes the shape prompt
- **THEN** its report rules name discovery's evidence lines, `epic #<parent>: <title>` and `story #<story>: <title>`, and the file holds none of `lets-shape`'s discovery rules: not `Run discovery on it?`, not `Discovery status: in-progress` and not *Resume mode*

#### Scenario: An idea the search already checked
- **WHEN** the shape step runs for the idea `add a --quiet flag to lets sync`, after the title search found no match
- **THEN** the step runs no title search of its own, creates the issue, ends on the default branch with a clean tree, and its first evidence line is `issue #<i>: <title>`

#### Scenario: The packet confirmation reaches the user
- **WHEN** the shape step reports `needs-input` with the packet confirmation, at `auto`
- **THEN** the question carries no `recommendation`, and `lets-go` asks the user it

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: An epic's round removes its named input's answers
- **WHEN** a run for the idea `rewrite the backlog around a plugin model` stopped with #190 at `Discovery status: in-progress`, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds one pair and its prompt file holds that idea, and the user runs `lets-go #190`, whose shape step for #190 reports `done` for `epic #190`
- **THEN** `lets-go` removes `.workspace/lets-go/issue-190-shape-answers.yaml` and `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml`, so the lookup back in *Check the issue* finds no discovery, and the epic run starts

#### Scenario: An idea's round removes the epic's own answers
- **WHEN** a run for `lets-go #190` resumed #190 at `Discovery status: in-progress`, left `.workspace/lets-go/issue-190-shape-answers.yaml` holding one pair, and stopped, and the user then runs `lets-go rewrite the backlog around a plugin model`, the idea #190's `Input:` line names, whose shape step reports `done` for `epic #190`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` and `.workspace/lets-go/issue-190-shape-answers.yaml`, so the lookup back in *Check the issue* finds no discovery, and the epic run starts

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

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, or during Finalize. Finalize removes the parent's status line before it asks its own questions, so a stop during Finalize leaves a parent with no status line. To find an input's discovery, `lets-go` SHALL list the open parent issues with `lets-shape`'s query, `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and keep each whose `Input:` line names this input: the idea word for word for an idea, and `#<i>` or the issue's URL for an issue. When the input is an issue `#<i>` that is itself in that list, `lets-go` SHALL keep it too, whatever its `Input:` line names, as `lets-shape` does. A kept parent SHALL be this input's discovery when it says `Discovery status: in-progress`. It SHALL also be this input's discovery when it has no status line and an earlier shape round of this input left answers: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair, and, for an idea, `.workspace/lets-go/<shape-name>-shape-prompt.md` holds this idea. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT be this input's discovery.

An epic that discovery filed from another input names that input in its `Input:` line: an idea, or an issue `#<n>` that discovery split. A stop during Finalize leaves that input's answers, not the epic's. So when the input is an issue `#<i>` kept because it is itself in the list, its `Input:` line names another input, and it has no status line, `lets-go` SHALL also look for the answers of that named input: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair, where `<shape-name>` is `idea-<slug>` for the idea, or `issue-<n>` for `#<n>`, and, for an idea, `.workspace/lets-go/<shape-name>-shape-prompt.md` holds that idea. When it finds them, the epic SHALL be this input's discovery, and the lookup SHALL return with it the named input, whose shape round the shape step resumes. Otherwise the lookup SHALL return each discovery with this input. `lets-go` SHALL read no other file and run no other query for this. The answers file exists only on the machine where that round ran: on another machine, the lookup SHALL find no discovery for that epic.

For an idea, `lets-go` SHALL run this lookup before the title search of *Start from an idea*. When it finds a discovery, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, naming each parent it found, skip the title search, and run the shape step for the idea. The step resumes the discovery, or finishes its Finalize, because `lets-shape` matches the parent's `Input:` line to the idea, as the `discovery-checkpoints` capability says. When it finds none, `lets-go` SHALL run the title search. For an issue, *Start from an idea* does not run: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. For an epic with open sub-issues, `lets-go` SHALL run this lookup for `#<epic>` before the epic run starts, as *An epic run finishes a stopped discovery before it builds* says. For a `complete` issue whose `Input:` line names the issue itself, the one story an empty epic became, `lets-go` SHALL run this lookup for it before it claims the issue, as *An epic run shapes an empty epic first* says. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: The same idea after a stop during Finalize
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped during Finalize, the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, asks no question, and runs the shape step, whose round finishes Finalize on that parent

#### Scenario: A finished discovery of the same idea
- **WHEN** the open epic `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` does not exist, and the user runs `lets-go rewrite the backlog around a plugin model`
- **THEN** `lets-go` does not say a discovery is in progress, and runs the title search as usual

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

#### Scenario: An idea's epic after a stop during Finalize
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/issue-190-shape-answers.yaml` does not exist, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds the Phase 5 story table confirmed, and `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-prompt.md` holds that idea
- **THEN** the lookup returns #190, with the idea `rewrite the backlog around a plugin model` as the input whose round resumes

#### Scenario: A split issue's epic after a stop during Finalize
- **WHEN** the lookup runs for `#300`, the open parent #300 has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** the lookup returns #300, with `#180` as the input whose round resumes

#### Scenario: The answers are on another machine
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, and neither `.workspace/lets-go/issue-190-shape-answers.yaml` nor `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` exists
- **THEN** the lookup finds no discovery

#### Scenario: Another idea's answers under the same name
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds one pair, and `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-prompt.md` holds `rewrite the backlog around a plugin store`
- **THEN** the lookup finds no discovery

#### Scenario: The input is itself the parent
- **WHEN** the lookup runs for `#200`, and the open parent #200 says `Discovery status: in-progress — next phase: stories` with `Input: rewrite the backlog around a plugin model`
- **THEN** the lookup keeps #200 as this input's discovery

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits the discovery maps in the working tree on the default branch: `openspec/discovery.md`, and in a repository with several products the files under `openspec/discovery/`. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, which names each changed file and works when the folder does not exist. When that lists a path, `lets-go` SHALL look for this input's discovery, for an idea or an issue `#<i>`, as *A stopped discovery resumes from its parent issue* says. For an idea, it SHALL use what *Start from an idea* found. When this input has a discovery, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes the discovery or finishes its Finalize. When it has none, `lets-go` SHALL say the maps have uncommitted edits, name each path, say to commit or discard them, and stop. When the check went on only because one or more parents with no status line were this input's discovery, and the shape step then shaped none of those parents: the one issue it reports, or the parent it reports, is not one of them, the edits may be another discovery's: `lets-go` SHALL print the `Done shape` line, name each path the status command lists, say to commit or discard them, and stop in *Run the shape step*, before *Check the issue*. It SHALL claim nothing and create no branch. The shape step SHALL end on the default branch with the tree clean, except the discovery maps when discovery ran. When the shape step ran in this run and *Claim* created the branch of the issue it shaped, outside an epic run, `lets-go` SHALL run that status command again, on the branch, before *lets-go walks the step table* reads the tree. A shape step that files a parent and its stories starts an epic run, as *A shape step that files a parent goes on as an epic run* says. In an epic run, the story's branch is in its own worktree, and `lets-go` SHALL commit the maps as *An epic run commits the discovery map on the first story it claims* says instead. It SHALL commit each path it lists, new files included. The commit is `git add -- <paths>`, then `git commit -m "docs: the discovery map from #<parent>" -- <paths>`. It SHALL never pass `openspec/discovery` itself to `git add` or `git commit`, because both fail on a path that matches no file. `<parent>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When no discovery map changed, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that the discovery maps it names hold the discovery's edits, uncommitted on the default branch. While *Find the input's discovery* still takes the parent as this input's discovery, it SHALL say to leave the maps as they are, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard them before the next run, because a run stops on a dirty tree.

#### Scenario: The map is committed
- **WHEN** discovery changed `openspec/discovery.md`, the parent #190 became the one story `plugin-contract — ...`, and *Claim* created the branch `plugin-contract`
- **THEN** `lets-go` commits `openspec/discovery.md` alone on `plugin-contract` as `docs: the discovery map from #190`, and `git status --porcelain` then lists no path outside `.workspace/`

#### Scenario: A new map
- **WHEN** the project had no `openspec/discovery.md` and discovery created it
- **THEN** `lets-go` commits the new file the same way

#### Scenario: The run stops before Claim
- **WHEN** discovery turned the parent #190 into one story, *Check the issue* stops on #190's open blocker, and `openspec/discovery.md` is modified
- **THEN** `lets-go` says the map is uncommitted on the default branch, says to commit or discard it before the next run, and commits nothing

#### Scenario: A dirty map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step runs, and this input has no discovery
- **THEN** `lets-go` says the map has uncommitted edits, says to commit or discard them, and runs no step

#### Scenario: A dirty map from the discovery it resumes
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped after Personas was confirmed, `git status --porcelain` lists ` M openspec/discovery.md`, and the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`
- **THEN** `lets-go` runs the shape step, which resumes the parent at the journey map, and the map commit after *Claim* takes the edits

#### Scenario: A dirty map after a stop during Finalize
- **WHEN** a run for `#180` stopped during Finalize, `git status --porcelain` lists ` M openspec/discovery.md`, the open parent `Epic: plugin backlog` has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** `lets-go` does not say to commit or discard the map, and runs the shape step, whose round finishes Finalize on that parent

#### Scenario: A dirty map beside a finished discovery
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` does not exist
- **THEN** `lets-go` says the map has uncommitted edits, says to commit or discard them, and runs no step

#### Scenario: A dirty map beside a finished epic and an abandoned round
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds one pair from an abandoned round, and the shape step reports `issue #180: Plugin contract`
- **THEN** `lets-go` prints the `Done shape` line, names `openspec/discovery.md`, says to commit or discard it, and stops before *Check the issue*. It claims nothing, creates no branch and makes no map commit

#### Scenario: A dirty map beside a finished epic, and a new discovery
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds one pair from an abandoned round, and the shape step reports `epic #300: Plugin contract` with `story #301: Plugin loader`
- **THEN** `lets-go` prints the `Done shape` line, names `openspec/discovery.md`, says to commit or discard it, and stops before *Check the issue*. It starts no epic run, claims nothing and makes no map commit

#### Scenario: A later run with no shape step
- **WHEN** the user runs `lets-go #191` after the map was committed by hand, #191's packet is complete, and *Claim* creates the branch
- **THEN** `lets-go` makes no map commit

#### Scenario: A discovery that fits one story
- **WHEN** discovery edited the map and the parent became story #190, and *Claim* created #190's branch
- **THEN** `lets-go` commits the map as `docs: the discovery map from #190`

#### Scenario: A product's map and the root
- **WHEN** discovery moved the old map to `openspec/discovery/web-shop.md`, rewrote `openspec/discovery.md` as the root, and created `openspec/discovery/warehouse.md`, the parent became the one story `stock-alerts — ...`, and *Claim* created the branch `stock-alerts`
- **THEN** `lets-go` commits those three paths, and no other, on `stock-alerts` in one commit, `docs: the discovery map from #<parent>`

#### Scenario: A dirty product map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery/warehouse.md` before the shape step runs, and this input has no discovery
- **THEN** `lets-go` names `openspec/discovery/warehouse.md`, says to commit or discard it, and runs no step

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue, as its key: the key the user named, the issue `next` or *Run the epic* picked, or the issue or parent a shape step shaped. `<issue-url>` is its URL.
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

### Requirement: lets-go opens with an overview of its parts
`skills/lets-go/SKILL.md` SHALL describe a run as named parts. A part is one named piece of a run, as `openspec/glossary.md` defines it. The parts SHALL be these eleven, in run order:

1. *Read the settings*
2. *Read the request*
3. *Start from an idea*
4. *Check the issue*
5. *Run the shape step*
6. *Run the epic*
7. *Route*
8. *Enter the branch*
9. *Set the question mode*
10. *Walk the step table*
11. *End of the run*

 *Start from an idea*, *Run the shape step* and *Run the epic* run only when the request or the packet needs them. *Run the epic* runs only in an epic run. Each part SHALL be a `##` heading of `SKILL.md`, in that order. `SKILL.md` SHALL hold an overview table right after its opening paragraphs, and before `## Placeholders`. The table SHALL have one row per part, in the same order. Each row SHALL name the part and link to its heading. It SHALL say what the part does, and whether it runs in the `lets-go` session or a fresh one. It SHALL say what comes next, and when the part stops. The skill SHALL hold no `## Start` heading, and SHALL not name *Start* anywhere. Another requirement of this spec may still say *Start*. There it means the parts from *Read the settings* to *Set the question mode*, which run before the walk. *Start*'s blocker read is the blocker read in *Check the issue*.

#### Scenario: The overview lists every part
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds a table before `## Placeholders` whose rows name the eleven parts, each linked to its heading, in run order

#### Scenario: The parts are headings in run order
- **WHEN** the skill-interfaces test lists the `##` headings of `skills/lets-go/SKILL.md`
- **THEN** each of the eleven parts is one of them, in the order the overview lists them, none is `## Start`, and no file of `lets-go` says `*Start*`

#### Scenario: A part missing from the overview
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a `## Route` heading and an overview table that has no row for *Route*
- **THEN** the overview check fails, and its output names `Route`

### Requirement: A lost claim drops the issue, and three lost claims stop the run
When *Claim* returns `taken` for an issue the user named or confirmed as the same work, `lets-go` SHALL say who has it, and stop. In an epic run, the user named the epic, and the epic run picked each story. When *Claim* returns `taken` for such a story, `lets-go` SHALL settle the story with the line `#<story> <story-name>: not built, taken by <login>`, naming each assignee *Claim* returns. It SHALL count no lost claim, and SHALL pick again as *An epic run picks each story as next picks it* says. The three-lost-claims stop SHALL not apply in an epic run: the epic's stories are a fixed set, so the run always ends. When `next` picked the issue, `lets-go` SHALL leave out every issue lost in this run. It SHALL run `lets backlog ready` again, with every lost issue in `--exclude`, and take the first ready candidate that is left. It SHALL print the `Picked` line in the same form as the first pick: `Picked #<i>: <title>, the next ready issue.` It SHALL keep the lines it printed already. It SHALL go on from the blocker read with the new issue. When no candidate is left, it SHALL stop as when nothing is ready. Outside an epic run, after the third lost claim in one run, `lets-go` SHALL say that other sessions keep taking the picked issues, say to run `lets-go` again, and stop, claiming nothing.

#### Scenario: The lost issue is not picked again
- **WHEN** `next` picked #149, *Claim* returns `taken` for it, and the candidate list read before the claim still holds #149
- **THEN** `lets-go` leaves #149 out, runs `lets backlog ready --exclude 149`, and picks another issue

#### Scenario: A lost story under a parent
- **WHEN** discovery filed #190 with the stories #191 and #192, the epic run on #190 picked #191, and *Claim* returns `taken` for it with the assignee `octocat`
- **THEN** `lets-go` settles #191 with `#191 plugin-contract: not built, taken by octocat`, picks #192 next, and picks no issue outside #190's stories

#### Scenario: Three lost claims
- **WHEN** *Claim* returns `taken` for three picked issues in one run
- **THEN** `lets-go` says other sessions keep taking the picked issues, says to run `lets-go` again, claims nothing and stops

#### Scenario: A lost story in an epic run
- **WHEN** an epic run on #278 picked #279, and *Claim* returns `taken` for it with the assignee `octocat`
- **THEN** `lets-go` settles #279 with `#279 epic-run-skeleton: not built, taken by octocat`, runs `lets backlog ready` again with `--exclude 279`, and does not stop

#### Scenario: Three lost stories in an epic run
- **WHEN** an epic run on #278 has five stories, and *Claim* returns `taken` for three of them in turn
- **THEN** `lets-go` does not say that other sessions keep taking the picked issues, and goes on to pick from the two stories left

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the three parts. *Start from an idea*, *Run the shape step* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the two shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** it finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`; no file of `lets-go` has a heading *What shape runs*

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

### Requirement: lets-go gives a whole printed line in a text block
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL give each whole line the run prints in a fenced `text` block. A part of a line, such as the `Records disagree:` prefix, a line named in passing, and a line in a table cell, such as a Skip line in *The step table*, SHALL be an inline code span.

#### Scenario: The Picked line of next
- **WHEN** the skill-interfaces test reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** `Picked #<i>: <title>, the next ready issue.` is a line of a `text` block

#### Scenario: The Failed examples
- **WHEN** the skill-interfaces test reads *The step lines*
- **THEN** `Failed review build: <reason>` and `Failed shape: <reason>` are lines of a `text` block

### Requirement: An epic run shapes an empty epic first
An empty epic is an epic with no sub-issues, open or closed: `lets backlog item <epic>` returns an empty `subIssues` and an empty `closedSubIssues`. When *Confirm the packet* returns `epic` for an empty epic, and the run started on the default branch, `lets-go` SHALL run the shape step for `#<epic>`, with `<shape-name>` `issue-<epic>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL claim nothing on the epic and create no branch before the step. When a shape step has already run in this run, `lets-go` SHALL instead say that `#<epic>` has no stories after shaping, say to run the `lets-shape` skill on `#<epic>`, and stop, running no second shape step. The step's `lets-shape` shapes the epic in place, as the `discovery-checkpoints` capability says.

When the step reports `done` and its first evidence line is `epic #<epic>: <title>`, naming the run's epic, `lets-go` SHALL go on from the blocker read in *Check the issue* with the epic as `<i>`, so it reads the epic's new open sub-issues. It SHALL print the `Done shape` line once, before the epic run prints its waves, and SHALL then start the epic run on those sub-issues as *An epic run starts on an epic with open stories* says. When the first evidence line is `issue #<epic>: <title>`, because the whole epic fits one story and became it, `lets-go` SHALL go on from the blocker read with `#<epic>` as `<i>`, as for an issue number, and build it as one story. That story keeps `Input: #<epic>`. On a later run, when *Confirm the packet* returns `complete` for an issue whose `Input:` line names the issue itself, `lets-go` SHALL first run *Find the input's discovery* for it. When the lookup finds the issue, its discovery stopped before it finished, and `lets-go` SHALL act as for `needs-shape`, with the reason that its discovery is in progress, so the shape step resumes the discovery or finishes its Finalize. When the step reports `failed` or `needs-input`, `lets-go` SHALL act as *The shape step shapes an idea or an unshaped issue* says.

#### Scenario: An empty epic runs the shape step
- **WHEN** the user runs `lets-go #300` on the default branch, #300's Kind is Epic, it has no open blocker, and `lets backlog item 300` returns `"subIssues": []` and `"closedSubIssues": []`
- **THEN** `lets-go` runs `lets delegate step run --for shape --name issue-300-shape`, its prompt says ``Invoke the `lets-shape` skill for issue #300, and stop where it stops.``, and it claims nothing and creates no branch before the step

#### Scenario: The shaped epic is built as an epic run
- **WHEN** the shape step for #300 reports `done` with `epic #300: Epic: plugin backlog`, `story #301: ...`, `story #302: ...` and `story #303: ...`
- **THEN** `lets-go` prints `Done shape: <date>. epic #300: Epic: plugin backlog; story #301: ...; story #302: ...; story #303: ...` once, runs `lets backlog item 300` again, and starts an epic run on #300 whose stories are #301, #302 and #303

#### Scenario: The epic became one story
- **WHEN** the shape step for #300 reports `done` with the first evidence line `issue #300: plugin-contract — the backlog reads its provider from a plugin`
- **THEN** `lets-go` takes #300 as `<i>`, reads its blockers, confirms its packet as a Story, and starts no epic run

#### Scenario: The one story's discovery stopped
- **WHEN** an earlier run turned #300 into one story and stopped during Finalize, #300's body says `Input: #300` and has no status line, `.workspace/lets-go/issue-300-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go #300` on the default branch
- **THEN** *Confirm the packet* returns `complete`, *Find the input's discovery* finds #300, and `lets-go` runs the shape step for #300 before it claims #300

#### Scenario: Still empty after a shape step
- **WHEN** a shape step has run in this run, and *Confirm the packet* then returns `epic` for #300 with no sub-issues
- **THEN** `lets-go` says that #300 has no stories after shaping, says to run the `lets-shape` skill on #300, and stops without a second shape step

#### Scenario: The old line is gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds no `lets-go does not shape an empty epic yet`

### Requirement: An epic run finishes a stopped discovery before it builds
When *Confirm the packet* returns `epic` for an epic with open sub-issues, on the default branch, `lets-go` SHALL run *Find the input's discovery* for `#<epic>` before the epic run starts, as *A stopped discovery resumes from its parent issue* says. That lookup keeps the epic itself when it is a parent. When the lookup finds one or more discoveries, `lets-go` SHALL say that a discovery of `#<epic>` is in progress at each `#<parent>` it found, and run the shape step for the input the lookup returned with it, whose round resumes the discovery or finishes its Finalize. That input is `#<epic>`, or the idea or issue `#<n>` that the epic's `Input:` line names when the lookup found that input's answers. When the step reports `done` with the first evidence line `epic #<epic>: <title>`, followed by a `story #<story>: <title>` line for each of the epic's stories, including stories an earlier round filed, `lets-go` SHALL go on from the blocker read in *Check the issue* with `#<epic>` as `<i>`, and start the epic run. The step prompt SHALL ask for a `story` line for each story, in the order discovery created them, so that a round that only finishes Finalize still lists the stories and *Read the report* does not fail it for naming no story. When a shape step has already run in this run, it SHALL instead say to run the `lets-shape` skill on `#<epic>`, and stop. When the lookup finds none, the epic run SHALL start. An epic whose discovery finished SHALL NOT be shaped again: it has no status line, and no answers file of an earlier round of `issue-<epic>`, or of the input its `Input:` line names, holds a pair.

#### Scenario: A stop between rounds
- **WHEN** the user runs `lets-go #300`, #300 has the open sub-issues #301 and #302, and its body says `Discovery status: in-progress — next phase: stories` with `Input: #300`
- **THEN** `lets-go` says a discovery of #300 is in progress at #300, runs the shape step for #300, and starts no epic run before the step reports

#### Scenario: A stop during Finalize
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** `lets-go` runs the shape step for #300, whose round finishes Finalize, and after its `done` report starts the epic run on #301 to #303

#### Scenario: An idea's epic stopped during Finalize
- **WHEN** an earlier run for the idea `rewrite the backlog around a plugin model` filed #190 with the open sub-issues #191 to #193 and stopped during Finalize, #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds the Phase 5 story table confirmed, its prompt file holds that idea, and the user runs `lets-go #190`
- **THEN** `lets-go` says a discovery of #190 is in progress at #190, runs `lets delegate step run --for shape --name idea-rewrite-the-backlog-around-a-shape` with the answers file, and its prompt names the idea, not #190. After the step's `done` report for `epic #190`, `lets-go` starts the epic run on #191 to #193

#### Scenario: A split issue's epic stopped during Finalize
- **WHEN** an earlier run for #180 filed #300 with `Input: #180` and the open sub-issues #301 and #302, and stopped during Finalize, #300 has no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go #300`
- **THEN** `lets-go` runs the shape step with `--name issue-180-shape`, and its prompt says to shape #180. After the step's `done` report for `epic #300`, `lets-go` starts the epic run on #301 and #302

#### Scenario: A finished discovery is not shaped again
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` does not exist
- **THEN** `lets-go` runs no shape step and starts the epic run on #301 to #303

### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's. A story whose pull request was ready for review when the run started gets this line too, as *An epic run settles the stories already ready, merged or closed* says.
- A merged story: `#<story> <story-name>: merged, <pr-url>`, the URL of its merged pull request.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved`, `in another repository`, `its pull request was closed: <pr-url>` or `it depends on #391, which did not finish`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`: an open blocker that is not met, an assignee, or its Status, Kind or Priority. For a story passed in `--started`, the signed-in user as an assignee SHALL not be the reason, because `lets backlog ready` keeps such a story.
- A story whose step failed: `#<story> <story-name>: failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- A story whose walk stopped for another reason: `#<story> <story-name>: stopped: <reason>`.

A line SHALL end with what *An epic run removes a built story's worktree* says of the story's worktree: `; its worktree is at <path>` for a story that stopped or failed with its worktree kept, and `; its worktree at <path> could not be removed: ` followed by Git's error for a built story whose worktree is kept.

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
- **WHEN** the children of #280 and #281 run at once, and #281's child ends first with its pull request ready for review
- **THEN** `lets-go` prints #281's line when it settles #281, before #280's line, and before any `Picked` line of the next wave

#### Scenario: Built, failed and skipped stories together
- **WHEN** an epic run on #278 builds #279, the build of #391 fails with `tests fail on main`, #392 is blocked by #391, and the run then builds #394
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, `#391 <story-name>: failed at build: tests fail on main; its worktree is at .workspace/lets-go/worktrees/<story-name>`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#394 <story-name>: <pr-url>`, in that order, and no count line

#### Scenario: A second run after a stop
- **WHEN** an earlier epic run on #278 built #279 to a ready pull request, then stopped during #280's build, and the user runs `lets-go #278` again
- **THEN** the new run prints `#279 epic-run-skeleton: <pr-url>` first, then `Resumed #280: <title>, started in an earlier run, under #278.`, and #280's walk goes on from build

### Requirement: lets-go reads and claims the backlog only through lets backlog
`lets-go` SHALL read the ready issues with `lets backlog ready`, read an issue with `lets backlog item <i>`, search titles with `lets backlog find`, claim with `lets backlog claim <i>` and release with `lets backlog release <i>`. It SHALL run no `gh project` command and no Project query. These stay as `gh` until the shaping side moves: the comment thread read of *Confirm the packet*, which is a GraphQL query with its pagination; `gh issue view <i> --json createdAt`; the parent query of *A stopped discovery resumes from its parent issue*; and the issue body edit that records a **Glossary handoff** import. Pull request reads and edits stay as `gh pr` commands.

#### Scenario: No backlog gh in the skill
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds no `gh project`, no `projectsV2`, no `--add-assignee`, no `--remove-assignee` and no `gh issue list --search "is:open no:assignee`, and finds `lets backlog ready`, `lets backlog item <i>`, `lets backlog find`, `lets backlog claim <i>` and `lets backlog release <i>`

#### Scenario: Why no shaped story is ready
- **WHEN** a shape step files #190 with the stories #191 and #192 in one wave, the epic run on #190 runs `lets backlog ready --only 191,192`, which returns no issues, and `lets backlog item 191` returns `"assignees": ["octocat"]`
- **THEN** the epic run settles #191 with `#191 <story-name>: not built, assigned to octocat`

#### Scenario: An epic's sub-issues
- **WHEN** the user runs `lets-go` for #52, and `lets backlog item 52` returns Kind Epic and `subIssues` #136 and #137
- **THEN** `lets-go` says that an epic is built through its stories, lists #136 and #137, and runs no other command to find them

#### Scenario: The parent's Shared decisions
- **WHEN** `lets-go` confirms the packet of a Story whose parent is #52
- **THEN** it reads the parent's **Shared decisions** from the `parent` that `lets backlog item <i>` returned, and runs no `gh issue view 52`

## REMOVED Requirements

### Requirement: lets-go picks the first ready story
**Reason**: A shape step that files a parent and its stories now goes on as an epic run on that parent, for every input, as *A shape step that files a parent goes on as an epic run* says. Nothing builds only the first ready story any more, so the line `Picked #<i>: <title>, the first ready story under #<parent>.` and the `nothing-ready` stop after discovery go too.
**Migration**: Nothing to migrate. A run that discovery used to stop after one story now builds every story under the parent. To build one story only, run `lets-go #<story>` with that story's number.
