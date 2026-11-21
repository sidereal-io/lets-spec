## ADDED Requirements

### Requirement: An epic run gives each story run a worktree of its own
In an epic run, every story run SHALL work in a git worktree of its own, even in a wave of one story. The epic run's own checkout SHALL stay on the default branch for the whole epic run. `<path>` is the story's worktree: `.workspace/lets-go/worktrees/<name>` in the epic run's checkout for a worktree the epic run creates, or the path `git worktree list --porcelain` prints for one it reuses, as *An epic run reuses a story's clean worktree* says.

Where *Enter the branch* checks the story's branch out, the epic run SHALL create the worktree instead:

- **A story with no branch:** *Claim* SHALL create the branch and its worktree together, off the default branch, with `git worktree add -b <name> .workspace/lets-go/worktrees/<name> <default>`. For a stacked story it SHALL create them off the blocker's branch, with no upstream, with `git worktree add --no-track -b <name> .workspace/lets-go/worktrees/<name> origin/<blocker-branch>`. When the command fails, *Claim* SHALL release the claim and return `branch-failed`, as it does when creating a branch fails.
- **A story whose branch exists, here or on `origin`, and is checked out in no worktree:** the epic run SHALL run `git fetch origin <name>` when `origin` has it, then `git worktree add .workspace/lets-go/worktrees/<name> <name>`. When the command fails, the story's run SHALL stop with `stopped: ` followed by Git's error.

When git ignores the project's lets-spec skills, as `git check-ignore -q .agents/skills/lets-go` says in the epic run's checkout, the epic run SHALL then run `lets sync` with `<path>` as its working directory, so the child finds the `lets-go` skill and the lets schemas. It SHALL prepare nothing else in the worktree. When `lets sync` exits non-zero, the story's run SHALL stop with `stopped: lets sync failed in its worktree: ` followed by its error.

From then on, every command of the story that reads or writes its branch SHALL run in `<path>`: the fetch and fast-forward of *Enter the branch*, *Import the glossary checkpoint*, the schema read, the child session, and the walk in this session when no child session can start.

#### Scenario: A new story's worktree
- **WHEN** an epic run on #278 claims #279, which has no branch and no open blocker, on a repository whose default branch is `main`
- **THEN** *Claim* runs `git worktree add -b epic-run-skeleton .workspace/lets-go/worktrees/epic-run-skeleton main`, and `git branch --show-current` in the epic run's checkout still prints `main`

#### Scenario: A stacked story's worktree
- **WHEN** the epic run claims #280, stacked on #279, whose branch is `epic-run-skeleton`
- **THEN** *Claim* runs `git worktree add --no-track -b epic-run-stacks .workspace/lets-go/worktrees/epic-run-stacks origin/epic-run-skeleton`

#### Scenario: Ignored skills
- **WHEN** the epic run's checkout ignores `.agents/skills/lets-go`, and the epic run creates the worktree for #279
- **THEN** it runs `lets sync` in `.workspace/lets-go/worktrees/epic-run-skeleton` before the story's child session starts

#### Scenario: Committed skills
- **WHEN** git tracks `.agents/skills/lets-go` in the epic run's checkout
- **THEN** the epic run runs no `lets sync` in the story's worktree

#### Scenario: A worktree that cannot be created
- **WHEN** `git worktree add` fails for #280, whose branch exists, with the error `fatal: '.workspace/lets-go/worktrees/epic-run-stacks' already exists`
- **THEN** #280's line is `#280 epic-run-stacks: stopped: fatal: '.workspace/lets-go/worktrees/epic-run-stacks' already exists`, and the epic run goes on with the other stories

### Requirement: An epic run reuses a story's clean worktree
Before it creates a worktree for a story whose branch exists, the epic run SHALL look for a worktree that already has the branch checked out, with `git worktree list --porcelain`: an entry whose `branch` line is `refs/heads/<name>`. An earlier epic run may have kept one, or the user may have made one. When one exists, its path is `<path>`, and the epic run SHALL check it for changes that are not committed, outside `.workspace/`, with `git -C <path> status --porcelain --untracked-files=all -- . ':(exclude).workspace'`:

- **It prints nothing:** the epic run SHALL use that worktree for the story's run, and create none. It SHALL bring the branch up to date in it, as *Enter the branch* does, and run `lets sync` in it, as for a new worktree, when git ignores the project's lets-spec skills.
- **It prints a line:** the epic run SHALL settle the story with `stopped: its worktree at <path> has changes that are not committed`, leave the worktree as it is, and go on with the other stories, as *A failure or a stop skips only the stories that depend on it* says.

#### Scenario: A clean worktree kept by an earlier run
- **WHEN** an earlier epic run stopped #281 and kept `.workspace/lets-go/worktrees/epic-run-failures`, which has no changes outside `.workspace/`, and the user runs `lets-go #278` again
- **THEN** the new run prints the `Resumed` line for #281, runs no `git worktree add` for it, and starts #281's child session in that worktree

#### Scenario: A worktree with changes
- **WHEN** `git worktree list --porcelain` shows `refs/heads/epic-run-failures` checked out at `/repo/.workspace/lets-go/worktrees/epic-run-failures`, and `git status` there shows a modified `skills/lets-go/SKILL.md`
- **THEN** #281's line is `#281 epic-run-failures: stopped: its worktree at /repo/.workspace/lets-go/worktrees/epic-run-failures has changes that are not committed`, the modified file is still there, and the stories that depend on #281 get their `depends on` lines

### Requirement: An epic run removes a built story's worktree
When a story run ends with the story's pull request ready for review, the epic run SHALL remove the story's worktree with `git worktree remove <path>`, before it settles the story, and SHALL keep the branch. It SHALL remove only a worktree under `.workspace/lets-go/worktrees/`: a worktree it reused from elsewhere stays as it is. When the removal fails, the epic run SHALL keep the worktree, and the story's line SHALL end with `; its worktree at <path> could not be removed: ` followed by Git's error.

When a story's run stops or fails, the epic run SHALL keep its worktree as it is, and the story's line SHALL end with `; its worktree is at <path>`. A story whose run stopped before its worktree existed has no such ending.

#### Scenario: A built story
- **WHEN** the child for #279 ends with a `done` report, and #279's pull request is open and ready for review
- **THEN** the epic run runs `git worktree remove .workspace/lets-go/worktrees/epic-run-skeleton`, `git branch --list epic-run-skeleton` still prints the branch, and the line is `#279 epic-run-skeleton: <pr-url>`

#### Scenario: A worktree that cannot be removed
- **WHEN** #279 is built, and `git worktree remove` fails because the worktree holds an untracked file
- **THEN** the worktree is kept, and #279's line is `#279 epic-run-skeleton: <pr-url>; its worktree at .workspace/lets-go/worktrees/epic-run-skeleton could not be removed: ` followed by Git's error

#### Scenario: A failed story keeps its worktree
- **WHEN** the child for #391 ends with a `failed` report whose reason is `failed at build: tests fail on main`
- **THEN** the epic run removes no worktree, and #391's line is `#391 <story-name>: failed at build: tests fail on main; its worktree is at .workspace/lets-go/worktrees/<story-name>`

#### Scenario: A stop before the worktree exists
- **WHEN** *Claim* for #391 returns `claim-failed`
- **THEN** #391's line is `#391 <story-name>: stopped: ` followed by the reason, with no worktree ending

### Requirement: An epic run waits for the children of a wave
Once the pick of the current wave returns `nothing-ready`, and the stories it left are settled, the epic run SHALL wait for the children it started for that wave. While one or more children run, it SHALL run `lets delegate step wait`, with `--timeout-minutes 5` and one `--name <name>-story` for each child that runs, so that the wait returns before an agent host stops a long command, and act on the child it names, from the exit code it gives and the report in that story's report file:

- **`needs-input`:** relay the questions, as *The epic run relays a story run's questions* says, and start that child again.
- **Exit 3:** keep the story for later, as *With no child session, the epic run walks the story itself* says.
- **Any other:** settle the story, as *The epic run settles a story from its child's report* says.

When `lets delegate step wait` exits 6, the epic run SHALL run it again with the same names. When it exits with any other code, the epic run SHALL say its error, and end the epic run: it SHALL name each child still running and its worktree, and print every line, as *End of the run* does.

Once no child of the wave runs, the epic run SHALL walk each story kept for later, one at a time. Then it SHALL pick from the next wave that holds a story not settled yet, or end, as *An epic run ends with one line per story* says. It SHALL start no story of a later wave while a story of the current wave is not settled.

#### Scenario: Two children of a wave
- **WHEN** the epic run has started the children of #280 and #281, and the pick returns `nothing-ready`
- **THEN** the epic run runs `lets delegate step wait --timeout-minutes 5 --name epic-run-stacks-story --name epic-run-failures-story`

#### Scenario: One child ends first
- **WHEN** `lets delegate step wait` names `epic-run-failures-story` with exit 0, and #281's report is `done` with its pull request ready for review
- **THEN** the epic run settles #281, then runs `lets delegate step wait --timeout-minutes 5 --name epic-run-stacks-story`

#### Scenario: The next wave waits for the whole wave
- **WHEN** the waves are `Wave 1: #280, #281` and `Wave 2: #282`, and #281 has settled while #280's child still runs
- **THEN** the epic run runs no `lets backlog ready --only 282` until #280 has settled

#### Scenario: A wait that passes its limit
- **WHEN** `lets delegate step wait --timeout-minutes 5 --name epic-run-stacks-story` exits 6
- **THEN** the epic run runs `lets delegate step wait --timeout-minutes 5 --name epic-run-stacks-story` again, and settles nothing

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- in an epic run only, the reads of *An epic run picks each story as next picks it*, the worktree commands and `lets sync` of *An epic run gives each story run a worktree of its own* and *An epic run reuses a story's clean worktree*, and the fetches and ancestry checks of *An epic run stacks a story on its met blocker*;
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

#### Scenario: An epic run checks a started story out in a worktree
- **WHEN** an epic run on #278 picks #280, whose branch `epic-run-stacks` is on `origin` and is not checked out anywhere
- **THEN** `lets-go` does not run *Claim* or `git switch`, runs `git fetch origin epic-run-stacks`, then `git worktree add .workspace/lets-go/worktrees/epic-run-stacks epic-run-stacks`, and the epic run's checkout stays on the default branch

### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*, and SHALL start each picked story's run before it picks again, so the stories of one wave run at the same time. The current wave SHALL be the earliest wave, as *An epic run prints its waves before the first pick* found them, that holds a story not settled yet. The candidates SHALL be the current wave's stories that are not settled yet and whose run has not started in this epic run, and no other issue. `lets-go` SHALL pass the current wave's stories to `lets backlog ready` as `--only`, every story already settled or started in this epic run as `--exclude`, every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, and every story not settled yet that has its change's branch as `--started`, as *An epic run resumes the stories this user started* says, such as `lets backlog ready --only 280,281 --exclude 279 --met-blockers 279 --started 281`. With no story settled or started it SHALL pass no `--exclude`, with no met story no `--met-blockers`, and with no such branch no `--started`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`, so a story of a later wave SHALL not be picked while the current wave has a story not settled, whatever its Priority. Every story of the current wave that is ready and passes those checks SHALL start, with no limit on how many run at once. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.`, or the `Resumed` line for a story passed in `--started`. It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, in this session. It SHALL then start the story's run in a child session, in the story's worktree, as *An epic run runs each story in a child session* says, and pick again without waiting for it to end. It SHALL rank the stories again for every pick, because a story settled in this run can change what is ready. It SHALL run no `git switch <default>` between picks: its checkout stays on the default branch.

When the case returns `nothing-ready`, every story of the current wave not settled yet and not started SHALL get its `not built` line, in the epic's order. The epic run SHALL then wait for the wave's children, as *An epic run waits for the children of a wave* says. When a later wave holds a story not settled yet, `lets-go` SHALL then pick again, from that wave. Otherwise the epic run SHALL end as *An epic run ends with one line per story* says.

#### Scenario: The first pick
- **WHEN** an epic run on #278 starts, nothing is settled, wave 1 holds only #279, `lets backlog ready --only 279` lists #279, and its prerequisite and packet pass
- **THEN** `lets-go` prints `Picked #279: epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story, the next ready story under #278.`, reads #279's blockers, and runs *Claim* for it

#### Scenario: Two stories of one wave start at once
- **WHEN** the waves are `Wave 1: #279` and `Wave 2: #280, #281`, #279 is settled with its pull request ready for review, and both #280 and #281 are ready
- **THEN** `lets-go` runs `lets backlog ready --only 280,281 --exclude 279 --met-blockers 279`, starts #280's child session, then runs `lets backlog ready --only 280,281 --exclude 279,280 --met-blockers 279` and starts #281's child session, before either child ends

#### Scenario: The next pick leaves out the settled stories
- **WHEN** the waves are `Wave 1: #279` and `Wave 2: #280, #281`, and the epic run has built #279 and settles it with its line
- **THEN** `lets-go` runs no `git switch`, then runs `lets backlog ready --only 280,281 --exclude 279`, with `--met-blockers 279` when #279's pull request is open and ready for review

#### Scenario: A started story in the pick
- **WHEN** an epic run on #278 starts, nothing is settled at the start, wave 1 holds #281 and #282, and only #282's change's branch `epic-run-resume` exists, on `origin`
- **THEN** the first pick runs `lets backlog ready --only 281,282 --started 282`

#### Scenario: A story of a later wave waits, whatever its Priority
- **WHEN** wave 1 holds #283, whose Priority is Could, and wave 2 holds #287, whose Priority is Must
- **THEN** the first pick runs `lets backlog ready --only 283`, and can pick only #283

#### Scenario: A wave with nothing ready
- **WHEN** the waves are `Wave 1: #283, #285` and `Wave 2: #286`, the epic run has built #285, #283 is blocked by #263, which is not a story of the epic, and `lets backlog ready --only 283,285 --exclude 285 --met-blockers 285` returns no issues
- **THEN** `lets-go` settles #283 with `#283 <story-name>: not built, blocked by #263`, then runs `lets backlog ready --only 286 --exclude 283,285 --met-blockers 285`

#### Scenario: The last wave with nothing ready
- **WHEN** the current wave is the last, no child of it runs, and its pick returns `nothing-ready`
- **THEN** each story of that wave not settled yet gets its `not built` line, and the epic run goes to *End of the run*

#### Scenario: A candidate whose packet is not complete
- **WHEN** `lets backlog ready` lists #281 and #282, and *Confirm the packet* returns `needs-shape` for #281
- **THEN** `lets-go` picks #282, runs no shape step for #281, and #281 is not settled yet

#### Scenario: A sub-issue in another repository
- **WHEN** the epic's open sub-issues are #279 and `other-org/tools#5`
- **THEN** `lets-go` passes `--only 279`, and `other-org/tools#5` gets `not built, in another repository`

#### Scenario: The story runs in a child session
- **WHEN** the epic run has claimed #279 and created its worktree `.workspace/lets-go/worktrees/epic-run-skeleton`
- **THEN** `lets-go` runs `lets delegate step start --for story` for #279, with `--checkout .workspace/lets-go/worktrees/epic-run-skeleton`, and walks none of #279's steps in its own session

#### Scenario: No child session
- **WHEN** the epic run builds #279, and `lets delegate step wait` names #279's child with exit 3
- **THEN** the epic run walks #279's step table in its own session, in #279's worktree, once no other child of the wave runs, as *With no child session, the epic run walks the story itself* says

### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's. A story whose pull request was ready for review when the run started gets this line too, as *An epic run settles the stories already ready, merged or closed* says.
- A merged story: `#<story> <story-name>: merged, <pr-url>`, the URL of its merged pull request.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved`, `in another repository`, `its pull request was closed: <pr-url>` or `it depends on #391, which did not finish`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`, as *Pick the first ready story* does: an open blocker that is not met, an assignee, or its Status, Kind or Priority. For a story passed in `--started`, the signed-in user as an assignee SHALL not be the reason, because `lets backlog ready` keeps such a story.
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

### Requirement: A failure or a stop skips only the stories that depend on it
While an epic run is on a story, from its pick to its line, a stop SHALL end that story's run, and not the epic run. This holds the same way for every stop of the parts and procedures the story runs through: a failed step, records that disagree, a pull request that is merged or closed, a stop of *Check the prerequisite*, a failed claim write, a `lets backlog` error, a `fetch-failed` from *Stack the story*, a worktree that cannot be created or that has changes that are not committed, and every other stop. The lost claim of *A lost claim drops the issue, and three lost claims stop the run* is unchanged: it settles the story with `not built, taken by <login>` and picks again. A stop between stories, such as a `lets backlog` error in a pick, SHALL still end the epic run, as *A backlog error stops the run* says. When children of the wave still run at that stop, the epic run SHALL first wait for each of them and settle its story, as *An epic run waits for the children of a wave* says, and start no other story.

On a stop in a story run, `lets-go` SHALL act in this order:

1. Do what the stop says, such as print the `Failed` line and the pull request's URL.
2. Settle the story with `failed at <step name>: <reason>` for a failed step, or `stopped: <reason>` for any other stop, with the worktree ending that *An epic run removes a built story's worktree* says. The story is `<failed>` from here on. Its worktree SHALL stay as it is, with any changes that are not committed: they stop no other story.
3. Settle each dependent of `<failed>`, in the epic's order, with `not built, it depends on #<failed>, which did not finish`, right after `<failed>`'s own line. A dependent is a story of the epic, in this repository and not settled yet, whose open blockers include `<failed>`, or include another dependent, through any number of stories. Only "blocked by" links between the epic's own stories that are not settled yet count: a link through an issue outside the epic, or through a story settled before this stop, does not make a story a dependent. The line names `<failed>` itself, even when the dependence goes through other stories.
4. Go back to where the epic run was: the next pick of the current wave, or the wait for its children. Every story settled in steps 2 and 3 is passed in `--exclude`, so none of them is picked. The epic run SHALL run no `git switch`.

`lets-go` SHALL not retry a failed step in the same run. Running `lets-go` again on the failed story's branch carries on, as for any run. The end of an epic run SHALL print no count of built, failed or skipped stories: the per-story lines are its summary.

`<failed>` is a different placeholder from `<story>`, the story the line is for.

The rule's text SHALL appear once, under the heading *A stop in an epic run* in `references/epic-run.md`. Each stop keeps its own text. Each section that holds a stop a story can reach SHALL link the rule, next to its stops, as each `lets backlog` call links *Backlog errors*: *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions* in `SKILL.md`, and *Records that disagree* in `references/records.md`. The sentence after the overview that says any part stops on a `lets backlog` error SHALL link the rule too, and SHALL say that a stop in a story run ends only that story.

#### Scenario: A failed build
- **WHEN** an epic run on #278 has built #279, the build step of #391 reports `failed` with the reason `tests fail on main`, #392 is blocked by #391, #393 is blocked by #392, and #394 has no open blocker
- **THEN** `lets-go` prints the lines `#391 <story-name>: failed at build: tests fail on main; its worktree is at .workspace/lets-go/worktrees/<story-name>`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#393 <story-name>: not built, it depends on #391, which did not finish`, in that order, runs no `git switch`, and runs the next pick with `--exclude` naming #279, #391, #392 and #393, which can pick #394

#### Scenario: Records that disagree
- **WHEN** the walk of #391 finds that the records disagree, and no story of the epic is blocked by #391
- **THEN** #391's line is `#391 <story-name>: stopped: ` followed by the disagreement and its worktree ending, no story gets a `depends on` line, and the epic run goes on

#### Scenario: A failed claim write
- **WHEN** *Claim* for #391 returns `claim-failed`
- **THEN** `lets-go` shows what *Claim* says for `claim-failed`, settles #391 with `#391 <story-name>: stopped: ` followed by the reason, and picks again

#### Scenario: Uncommitted changes after a failure
- **WHEN** the build step of #391 reports `failed`, #394 has no open blocker, and `git status` in #391's worktree shows a modified file `skills/lets-go/SKILL.md` that is not committed
- **THEN** #391's line ends with `; its worktree is at .workspace/lets-go/worktrees/<story-name>`, the modified file is still there, no story gets a line that says the epic run stopped, and the epic run can still pick #394

#### Scenario: Changes only in .workspace
- **WHEN** the build step of #391 reports `failed`, and the only uncommitted files in #391's worktree are under `.workspace/`
- **THEN** the epic run settles #391 with its worktree ending, settles #391's dependents and goes on, as it does when the worktree has other changes

#### Scenario: A link through an issue outside the epic
- **WHEN** the build step of #391 fails, and #395, a story of the epic, is blocked only by #263, which is not a story of the epic and is blocked by #391
- **THEN** #395 gets no `depends on` line when #391 settles, and gets its own line later, such as `#395 <story-name>: not built, blocked by #263`

#### Scenario: A stop between stories
- **WHEN** the epic run has settled #391 after a failure, no child runs, and the next `lets backlog ready` returns an error
- **THEN** `lets-go` stops as *Backlog errors* says, and picks no other story

#### Scenario: A stop between stories while children run
- **WHEN** the child of #280 runs, and the pick after it returns a `lets backlog` error
- **THEN** `lets-go` starts no other story, waits for #280's child and settles #280, then stops as *Backlog errors* says

#### Scenario: The rule is written once
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/epic-run.md`
- **THEN** it finds `not built, it depends on #<failed>, which did not finish` and `failed at <step name>: <reason>` once each across the files of `lets-go`, all under the heading *A stop in an epic run*, and finds `the epic run stopped at` in no file of `lets-go`

#### Scenario: Each section with a stop links the rule
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `skills/lets-go/references/records.md`
- **THEN** it finds a link to `epic-run.md#a-stop-in-an-epic-run` in the overview's sentence on `lets backlog` errors, in each of *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions*, and in *Records that disagree*

#### Scenario: A section with a stop that does not link the rule
- **WHEN** a skills folder holds a `lets-go` whose *Run a step* has no link to `epic-run.md#a-stop-in-an-epic-run`
- **THEN** the check fails, and its output names `Run a step`

### Requirement: An epic run runs each story in a child session
After *Set the question mode* has set `<mode>` for the story the epic run picked, with the story's branch `<name>` checked out in its worktree `<path>`, `lets-go` SHALL start the story's run in a child `lets-go` session, in the background, in this order:

1. Write the story prompt to `.workspace/lets-go/<name>-story-prompt.md` in the epic run's checkout. Its first line SHALL be `You run a story run of a lets-go epic run: #<i>, for the change <name>, under #<parent>.` It SHALL name the issue and its URL, the branch `<name>`, the worktree `<path>` as the child's checkout, `<schema>` and the route line, and SHALL say that the question mode is `<mode>`. It SHALL say that the epic run has already claimed the issue, routed it and checked the branch `<name>` out in that worktree, so the child claims nothing, routes nothing, stays on `<name>` and works only in the worktree. It SHALL tell the child to invoke the `lets-go` skill, and to end with one step report. For a stacked story it SHALL hold the `## Stack` section that the story's step prompts hold, with the same `<blocker>`, `<blocker-branch>` and `<blocker-pr>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section.
2. Remove `.workspace/lets-go/<name>-story-answers.yaml` in the epic run's checkout, and each `.workspace/lets-go/<name>-<step>-rounds.txt` in the worktree, where the child keeps them, so the story run starts with no answers and no counted rounds. Do this only before the story's first child session in this run, never when relaying its questions.
3. Run `lets delegate step instructions --for story`, and rank its `options` as *Run a step* ranks a step's: the guidance first, then the order the options came in. When `options` is empty, pass its own family as the one model.
4. Run `lets delegate step start --for story --name <name>-story --checkout <path> --prompt-file .workspace/lets-go/<name>-story-prompt.md --report-file .workspace/lets-go/<name>-story-report.json --meta-file .workspace/lets-go/<name>-story-meta.txt --effort high`, with one `--model` per ranked option, best first. It returns once the child has started, and the epic run goes on without waiting for it.

While children run, the epic run SHALL print only its own lines: the `Picked` or `Resumed` lines, the `Stacks on` lines, the `Questions` lines, the questions it relays and their answers, and the stories' lines. It SHALL NOT print a child's `Skipped`, `Done` or `Failed` lines.

#### Scenario: The story prompt
- **WHEN** an epic run on #278 has created the worktree `.workspace/lets-go/worktrees/story-run-child-sessions` for #284, on `lets-standard`, at the question mode `auto`, stacked on #282, whose pull request #293 is from `epic-run-resume`
- **THEN** `.workspace/lets-go/story-run-child-sessions-story-prompt.md` starts with `You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.`, names `lets-standard`, the question mode `auto` and the worktree `.workspace/lets-go/worktrees/story-run-child-sessions`, says that the epic run has already claimed #284, routed it and checked the branch out, and holds a `## Stack` section with `--base epic-run-resume` and `Stacked on #293; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** the epic run writes the story prompt for #279, which has no open blocker
- **THEN** the story prompt holds no `## Stack` section

#### Scenario: The child's command
- **WHEN** `lets delegate step instructions --for story` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and its guidance is `null`
- **THEN** the epic run runs `lets delegate step start --for story --name story-run-child-sessions-story --checkout .workspace/lets-go/worktrees/story-run-child-sessions --prompt-file .workspace/lets-go/story-run-child-sessions-story-prompt.md --report-file .workspace/lets-go/story-run-child-sessions-story-report.json --meta-file .workspace/lets-go/story-run-child-sessions-story-meta.txt --effort high --model claude/claude-opus-5-5 --model gpt/gpt-6-luna`

#### Scenario: Story guidance ranks the models
- **WHEN** `options` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and the guidance is `Prefer gpt.`
- **THEN** the first `--model` is `gpt/gpt-6-luna`

#### Scenario: The story starts with no answers
- **WHEN** an earlier epic run left `.workspace/lets-go/story-run-child-sessions-story-answers.yaml` in the epic run's checkout, and `.workspace/lets-go/story-run-child-sessions-plan-rounds.txt` in the story's worktree
- **THEN** the epic run removes both before the story's first `lets delegate step start --for story`

#### Scenario: The child's step lines stay in the child
- **WHEN** the child skips plan and runs build, which reports `done`
- **THEN** the epic run prints neither `Skipped plan:` nor `Done build:`

### Requirement: The epic run relays a story run's questions
When a child's report is `needs-input`, the epic run SHALL relay that one report before it acts on another child's report, and the other children SHALL keep running while it does. It SHALL take the reports in the order `lets delegate step wait` names their children. It SHALL put `#<i>: ` before each question it asks the user or answers itself, where `#<i>` is the story whose child asked, such as `#286: Which schema?`. It SHALL go through the report's questions in the report's order:

- A question that holds `ask` true SHALL go to the user, with its `recommendation` as the suggested answer, whatever `<mode>` is, and its answer SHALL be written as the user gave it, with no marker. Before the first such question of a report, the epic run SHALL print `Questions: ask for the rest of this step, because it asked for input five times.`
- Every other question SHALL go as `<mode>` says, as *Relay the questions* does: at `auto`, a question with a `recommendation` takes it as the answer, with the marker ` (lets-go accepted the step's recommendation; the user did not decide)`, and one without goes to the user; at `ask`, every question goes to the user.

Once every question of the report has an answer, the epic run SHALL write this report's pairs, in order, to `.workspace/lets-go/<name>-story-answers.yaml`, replacing what it held, and start the child again with steps 3 and 4 of *An epic run runs each story in a child session*, with the same prompt file and `--answers-file .workspace/lets-go/<name>-story-answers.yaml`. It SHALL ask for the options again, and rank them again. It SHALL NOT write the story prompt again, and SHALL NOT remove the story's answers file or rounds files. The questions written to the answers file SHALL be the child's, without the `#<i>: ` before them.

#### Scenario: Auto with a recommendation
- **WHEN** `<mode>` is `auto`, and the child of #286 reports a question `Which schema?` with the recommendation `lets-minimal`
- **THEN** the epic run says it answered `#286: Which schema?` with `lets-minimal`, writes the question `Which schema?` with the answer `lets-minimal (lets-go accepted the step's recommendation; the user did not decide)`, and starts the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`

#### Scenario: A marked question at auto
- **WHEN** `<mode>` is `auto`, and the child's report asks one question with a recommendation and `ask` true
- **THEN** the epic run prints `Questions: ask for the rest of this step, because it asked for input five times.`, asks the user that question, prefixed with its story, with the recommendation as the suggested answer, and writes the user's answer with no marker

#### Scenario: Two children ask at once
- **WHEN** the children of #280 and #281 both end with `needs-input`, and `lets delegate step wait` names #281's child first
- **THEN** the epic run asks or answers every question of #281's report, each prefixed `#281: `, and starts #281's child again before it relays any question of #280

#### Scenario: Other children run while the user answers
- **WHEN** the epic run asks the user `#281: Which schema?`, and #280's child still runs
- **THEN** #280's child keeps running, and the epic run acts on #280's report only after it has started #281's child again

#### Scenario: Each round replaces the answers file
- **WHEN** the epic run relays a second `needs-input` report from the same story
- **THEN** `.workspace/lets-go/<name>-story-answers.yaml` holds only the second report's pairs

#### Scenario: A relay keeps the counted rounds
- **WHEN** `.workspace/lets-go/<name>-plan-rounds.txt` in the story's worktree holds two lines, and the epic run relays the child's `needs-input` report
- **THEN** the epic run starts the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`, and that rounds file still holds its two lines

### Requirement: The epic run settles a story from its child's report
When `lets delegate step wait` names a story's child, the epic run SHALL settle the story, as *Settle a story* says, from the exit code it gives and the report in `.workspace/lets-go/<name>-story-report.json`:

- **Exit 0, `done`:** it SHALL read the pull request with `gh pr view <name> --json url,state,isDraft`. When the pull request is open and not a draft, it SHALL remove the story's worktree, as *An epic run removes a built story's worktree* says, and settle the story with its built line, or with its stacked line while the story is stacked. Otherwise the line SHALL be `stopped: the story run reported done, but <what the record holds>`, such as `the pull request is a draft` or `the branch has no pull request`.
- **Exit 0, `failed`:** a reason that starts `failed at <step name>: ` or `stopped: ` SHALL be the text after the story's name in its line. Any other reason, including one that `lets` wrote because the child gave no valid report, SHALL give `stopped: <reason>`.
- **Exit 2, 4 or 6:** the line SHALL be `stopped: <reason>`, where the reason is the error in `.workspace/lets-go/<name>-story-meta.txt`. A child that did not finish in time is one.
- **Exit 3:** nothing is settled from the child. The epic run SHALL go on as *With no child session, the epic run walks the story itself* says, and settle the story when that walk ends.

Every line but a built or stacked line is a stop in a story run: after settling the story, the epic run SHALL go on as *A failure or a stop skips only the stories that depend on it* says, from its third action. The epic run SHALL NOT start the child again for that story in this run.

#### Scenario: A built story
- **WHEN** the child for #284 ends with a `done` report, and `gh pr view story-run-child-sessions` shows the pull request open and not a draft
- **THEN** the epic run removes `.workspace/lets-go/worktrees/story-run-child-sessions`, and settles #284 with `#284 story-run-child-sessions: <pr-url>`, or with `, stacked on #<blocker>` after it while #284 is stacked

#### Scenario: Done, but the pull request is a draft
- **WHEN** the child ends with a `done` report, and the pull request is a draft
- **THEN** the story's line is `#<story> <story-name>: stopped: the story run reported done, but the pull request is a draft; its worktree is at <path>`

#### Scenario: A failed step in the child
- **WHEN** the child ends with a `failed` report whose reason is `failed at review build: the review found two blockers`
- **THEN** the story's line is `#<story> <story-name>: failed at review build: the review found two blockers; its worktree is at <path>`, and the stories that depend on it get their `depends on` lines

#### Scenario: A report lets could not read
- **WHEN** the child's report is a `failed` report whose reason is `the final message has no step-report block`
- **THEN** the story's line is `#<story> <story-name>: stopped: the final message has no step-report block; its worktree is at <path>`

#### Scenario: The child times out
- **WHEN** `lets delegate step wait` names the story's child with exit 6
- **THEN** the story's line starts `#<story> <story-name>: stopped: `, and the epic run goes on with the other children of the wave

### Requirement: With no child session, the epic run walks the story itself
When `lets delegate step wait` names a story's child with exit 3, the epic run SHALL keep the story until no other child of the wave runs. It SHALL then print `No child session could start for #<i>, so this session walks its steps.` and walk the story's step table in its own session, with the story's worktree as the repository root, as *Walk the step table* says, with each step in a fresh session or a subagent, as *Run a step* says. It SHALL walk such stories one at a time, in the order their children ended, and settle each as *Run the epic* does when its walk ends, removing its worktree when it is built. It SHALL NOT run the story prompt in a subagent, even when the meta file names a saved prompt.

When the child that `lets delegate step wait` names with exit 3 had been started again after the epic run relayed its questions, the epic run SHALL first give the pairs of `.workspace/lets-go/<name>-story-answers.yaml` to the step that asked, as the child does with an `## Answers` section: at the first row that is not done, it SHALL check the step's last report and append the pairs to `.workspace/lets-go/<session>-answers.yaml`, or stop the story's run when a pair matches none of its questions. That step's count of `needs-input` reports SHALL start from the lines in its `.workspace/lets-go/<session>-rounds.txt`.

#### Scenario: Only the default resolver
- **WHEN** the config lists only `subagent`, and the epic run starts the child for #279
- **THEN** `lets delegate step wait` names #279's child with exit 3, the epic run prints `No child session could start for #279, so this session walks its steps.`, runs #279's plan step with `lets delegate step run --for plan` from `.workspace/lets-go/worktrees/epic-run-skeleton`, and starts no subagent with the story prompt

#### Scenario: The walk waits for the wave
- **WHEN** #279's child exits 3, and #280's child, of the same wave, still runs
- **THEN** the epic run walks none of #279's steps until #280 has settled

#### Scenario: Two stories with no child session
- **WHEN** the children of #280 and #281 both exit 3, #281's first
- **THEN** the epic run walks #281's steps, settles #281, then walks #280's steps

#### Scenario: Exit 3 after a relay keeps the answers
- **WHEN** the epic run relays the plan step's question `Which schema?`, writes its answer to `.workspace/lets-go/<name>-story-answers.yaml`, starts the child again, and `lets delegate step wait` then names the child with exit 3
- **THEN** the epic run appends that pair to `.workspace/lets-go/<name>-plan-answers.yaml` in the story's worktree, and runs the plan step in its own walk with `--answers-file .workspace/lets-go/<name>-plan-answers.yaml`
