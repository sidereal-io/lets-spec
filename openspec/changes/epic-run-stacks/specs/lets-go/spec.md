<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: An epic run counts a blocker as met when its story's pull request is ready
In an epic run, an open blocker SHALL count as met only when all of these hold:

- it is one of the epic's stories, in this repository;
- its change's pull request is open and not a draft: it is ready for review.

It SHALL not matter whether this epic run or an earlier one built the blocker. The blocker's change's name is the part of its title before ` — `, or the whole title when it has none. Its pull request is the open one whose head branch has that name. A blocker whose pull request is a draft, a blocker with no open pull request, and a blocker that is not one of the epic's stories SHALL not count as met. Before each pick, `lets-go` SHALL read the open pull requests once, with `gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName`, and SHALL find the met stories from that one read. A met story's branch and pull request are the ones that read found: *An epic run stacks a story on its met blocker* uses them.

#### Scenario: A blocker built in this run
- **WHEN** an epic run on #278 has built #279, whose pull request #290 from the branch `epic-run-skeleton` is open and ready for review, and #280's only open blocker is #279
- **THEN** the next pick runs `lets backlog ready --only 279,280,281,282,283,284,285,286,287 --exclude 279 --met-blockers 279`, and can pick #280

#### Scenario: A blocker built in an earlier run
- **WHEN** an epic run on #278 starts, #279 is open and assigned, and its pull request from `epic-run-skeleton` is open and ready for review
- **THEN** the first pick passes `--met-blockers 279`, though this run did not build #279

#### Scenario: A blocker whose pull request is a draft
- **WHEN** #279's pull request is a draft, and #280's only open blocker is #279
- **THEN** the pick passes no `--met-blockers 279`, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A blocker outside the epic
- **WHEN** #283's only open blocker is #263, which is not a story of #278, and #263 has an open pull request ready for review
- **THEN** the pick does not pass #263 in `--met-blockers`, and #283's line is `#283 <story-name>: not built, blocked by #263`

### Requirement: An epic run stacks a story on its met blocker
In an epic run, when *Check the issue* finds that the story the epic run picked has an open blocker, and no change's branch here or on `origin`, `lets-go` SHALL decide as follows, in this order, before it runs *Find the source of demand* for the story:

1. When an open blocker is not met, as *An epic run counts a blocker as met when its story's pull request is ready* says, `lets-go` SHALL settle the story with `not built, blocked by #<blocker>`, naming each open blocker that is not met, and pick again.
2. Otherwise `lets-go` SHALL fetch each open blocker's branch with `git fetch origin <blocker-branch>`. The base is the open blocker whose branch contains every other open blocker's branch: for each other open blocker, `git merge-base --is-ancestor origin/<other-branch> origin/<blocker-branch>` succeeds. With one open blocker, that blocker is the base. When two blockers' branches point at the same commit, the base is the first of them in the epic's order.
3. When no open blocker's branch contains all the others, `lets-go` SHALL settle the story with `not built, blocked by #<a> and #<b>, on different branches`, naming every open blocker, and pick again. Three or more blockers are named as `#<a>, #<b> and #<c>`.
4. With a base, `lets-go` SHALL print `Stacks on #<blocker>: <blocker-branch>, pull request #<blocker-pr>.`, before *Claim* runs, and go on with the story. The story is stacked on `#<blocker>` until it is settled.

A settle in steps 1 and 3 SHALL claim nothing, count no lost claim and not end the epic run. For a stacked story, *Claim* SHALL create the story's branch off `origin/<blocker-branch>`, with no upstream, instead of off the default branch. *Glossary preflight*'s proposed base SHALL be `origin/<blocker-branch>`. A run that is not an epic run SHALL not stack: an open blocker with no change's branch still stops it.

#### Scenario: One met blocker
- **WHEN** an epic run picks #280, whose only open blocker is #279, and #279's pull request #290 from `epic-run-skeleton` is open and ready for review
- **THEN** `lets-go` prints `Stacks on #279: epic-run-skeleton, pull request #290.`, and *Claim* creates the branch `epic-run-stacks` off `origin/epic-run-skeleton`

#### Scenario: Two blockers on one stack
- **WHEN** an epic run picks #281, whose open blockers are #279 and #280, both met, and `origin/epic-run-stacks` contains `origin/epic-run-skeleton`
- **THEN** `lets-go` prints `Stacks on #280: epic-run-stacks, pull request #<pr>.`, and creates #281's branch off `origin/epic-run-stacks`

#### Scenario: Two blockers on different branches
- **WHEN** an epic run picks #286, whose open blockers #284 and #285 are both met, and neither one's branch contains the other's
- **THEN** `lets-go` settles #286 with `#286 <story-name>: not built, blocked by #284 and #285, on different branches`, claims nothing, and picks again

#### Scenario: A blocker that stopped being met
- **WHEN** `lets backlog ready` listed #280 with `--met-blockers 279`, and #279's pull request was marked as a draft before *Check the issue* read #280
- **THEN** `lets-go` settles #280 with `not built, blocked by #279`, claims nothing, and picks again

#### Scenario: Outside an epic run
- **WHEN** the user runs `lets-go 280` on the default branch, #279 is open and its pull request is ready for review, and no branch `epic-run-stacks` exists
- **THEN** `lets-go` says #279 blocks #280, creates no branch, and claims nothing

### Requirement: A stacked story's pull request targets its blocker's branch
When `lets-go` writes the prompt for a step of a stacked story, the prompt SHALL hold a `## Stack` section. It SHALL name the blocker, its branch and its pull request. It SHALL tell the step to open the story's draft pull request with `--base <blocker-branch>`, and to put the line `Stacked on #<blocker-pr>; merge that first.` beside `Closes #<i>` in its description. When the pull request exists with another base, the section SHALL tell the step to fix it with `gh pr edit <name> --base <blocker-branch>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section. The brainstorm instruction of the `lets-standard` and `lets-minimal` schemas SHALL say to follow the prompt's `## Stack` section, when it has one, where it opens the draft pull request.

#### Scenario: The plan step of a stacked story
- **WHEN** an epic run writes the prompt for the plan step of #280, stacked on #279, whose pull request #290 is from `epic-run-skeleton`
- **THEN** the prompt's `## Stack` section holds `--base epic-run-skeleton` and `Stacked on #290; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** an epic run writes the prompt for a step of #279, which has no open blocker
- **THEN** the prompt holds no `## Stack` section

#### Scenario: The schemas follow the section
- **WHEN** the skill-interfaces test reads the brainstorm instruction of `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`
- **THEN** each says to follow the step prompt's `## Stack` section where it opens the draft pull request

## MODIFIED Requirements

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


### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*. The candidates SHALL be the epic's stories that are in this repository and not yet settled, and no other issue. `lets-go` SHALL pass the epic's stories in this repository to `lets backlog ready` as `--only`, every story already settled as `--exclude`, and every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, such as `lets backlog ready --only 279,280,281 --exclude 279 --met-blockers 279`. With no story settled it SHALL pass no `--exclude`, and with no met story no `--met-blockers`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.` It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch*, *Set the question mode* and *Walk the step table*, in this session. When the story's walk has ended with its pull request ready for review, `lets-go` SHALL settle the story with its line, run `git switch <default>`, and pick again. It SHALL rank the stories again for every pick, because a story built in this run can change what is ready.

When the case returns `nothing-ready`, every story not yet settled SHALL get its `not built` line, in the epic's order, and the epic run SHALL end as *An epic run ends with one line per story* says.

#### Scenario: The first pick
- **WHEN** an epic run on #278 starts, #279 is the only story that `lets backlog ready --only 279,280,281,282,283,284,285,286,287` lists, and its prerequisite and packet pass
- **THEN** `lets-go` prints `Picked #279: epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story, the next ready story under #278.`, reads #279's blockers, and runs *Claim* for it

#### Scenario: The next pick leaves out the settled stories
- **WHEN** the epic run has built #279, and settles it with its line
- **THEN** `lets-go` runs `git switch` to the default branch, then `lets backlog ready` with `--only` naming the epic's stories, `--exclude 279`, and `--met-blockers 279` when #279's pull request is open and ready for review

#### Scenario: A candidate whose packet is not complete
- **WHEN** `lets backlog ready` lists #281 and #282, and *Confirm the packet* returns `needs-shape` for #281
- **THEN** `lets-go` picks #282, runs no shape step for #281, and #281 is not settled yet

#### Scenario: A sub-issue in another repository
- **WHEN** the epic's open sub-issues are #279 and `other-org/tools#5`
- **THEN** `lets-go` passes `--only 279`, and `other-org/tools#5` gets `not built, in another repository`

#### Scenario: No child session
- **WHEN** the epic run builds #279
- **THEN** each of #279's steps runs as *Run a step* says, and `lets-go` starts no other `lets-go` session for the story


### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved` or `in another repository`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`, as *Pick the first ready story* does: an open blocker, an assignee, or its Status, Kind or Priority.
- A story whose step failed: `#<story> <story-name>: failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- A story whose walk stopped for another reason: `#<story> <story-name>: stopped: <reason>`.

#### Scenario: Two built, one blocked
- **WHEN** an epic run on #278 builds #279 and then a story #391, and #283 is blocked throughout by #263, which is not a story of #278
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#391 <story-name>: <pr-url>`, then `#283 <story-name>: not built, blocked by #263`

#### Scenario: A stacked story's line
- **WHEN** an epic run on #278 builds #279, then builds #280 stacked on #279
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#280 epic-run-stacks: <pr-url>, stacked on #279`

#### Scenario: An assigned story
- **WHEN** #282 is assigned to `octocat` when the epic run starts
- **THEN** its line is `#282 epic-run-resume: not built, assigned to octocat`

#### Scenario: Each line prints as the story settles
- **WHEN** the epic run settles #279 with its pull request URL, and goes on to pick another story
- **THEN** `lets-go` prints #279's line before it prints the next `Picked` line

