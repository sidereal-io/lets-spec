## ADDED Requirements

### Requirement: An epic run settles the stories already ready, merged or closed
When an epic run starts, before its first pick, `lets-go` SHALL read the pull requests of each story of the epic in this repository, in the epic's order. A story's pull requests are those whose head branch is the story's change's name and whose `isCrossRepository` is false. Of these, the story's pull request SHALL be the open one when there is one; otherwise the merged one; otherwise the closed one created last. `lets-go` SHALL then settle each story as follows, in the epic's order:

- **Open and ready for review:** the built line, `#<story> <story-name>: <pr-url>`. When the pull request's base is not the default branch, and it is the head branch of a pull request of this repository that merged into the default branch, the blocker has merged: `lets-go` SHALL run `gh pr edit <name> --base <default>`, rebase nothing, and give the plain built line. This holds even when the merged pull request's story is still one of the epic's stories. Otherwise, when the base is the branch of another open story of the epic in this repository, the line SHALL end `, stacked on #<blocker>`, naming that story. Any other base SHALL be left as it is, with the plain built line. `lets-go` SHALL run none of the story's steps, and the story SHALL count as met, as *An epic run counts a blocker as met when its story's pull request is ready* says.
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
- **THEN** `lets-go` runs `gh pr edit epic-run-stacks --base <default>`, rebases nothing, and #280's line is `#280 epic-run-stacks: <#291's url>`, with no `, stacked on`

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
When the story the epic run picked is a started story with an open pull request, *Check the issue* SHALL decide its stack from that pull request's base, before the walk, and SHALL not run *Stack the story*:

- The base is not the default branch, and it is the head branch of a pull request of this repository that merged into the default branch: `lets-go` SHALL run `gh pr edit <name> --base <default>`, rebase nothing, and the story SHALL not be stacked. Its line SHALL have no `, stacked on`. This holds even when the merged pull request's story is still one of the epic's stories, because it merged during the epic run.
- Otherwise, the base is the branch of a met story, as *An epic run counts a blocker as met when its story's pull request is ready* says: the story SHALL stay stacked on that story, as `<blocker>`, with that story's branch and pull request. Its step prompts SHALL hold the `## Stack` section, as *A stacked story's pull request targets its blocker's branch* says, and its line SHALL end `, stacked on #<blocker>`.
- Any other base SHALL be left as it is, and the story SHALL not be stacked.

When the started story has no pull request and an open blocker, *An epic run stacks a story on its met blocker* SHALL decide its stack. Restacking a story after a lower pull request changes in review is out of scope.

#### Scenario: A resumed story stacked on an open story
- **WHEN** the epic run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`, and #280's pull request #291 from `epic-run-stacks` is open and ready for review
- **THEN** each step prompt of #281 holds a `## Stack` section naming #280, `epic-run-stacks` and #291, and #281's line ends `, stacked on #280`

#### Scenario: A resumed story whose blocker has merged
- **WHEN** the epic run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`, #280 is closed, and #291 from `epic-run-stacks` has merged into the default branch
- **THEN** `lets-go` runs `gh pr edit epic-run-failures --base <default>` before the walk, rebases nothing, no step prompt of #281 holds a `## Stack` section, and #281's line has no `, stacked on`

#### Scenario: A resumed story whose blocker merged during the epic run
- **WHEN** the epic run started with #280 open and its pull request #291 from `epic-run-stacks` ready for review, #291 then merged into the default branch while the run built another story, and the run resumes #281, whose draft pull request #292 has the base `epic-run-stacks`
- **THEN** `lets-go` runs `gh pr edit epic-run-failures --base <default>` before the walk, and no step prompt of #281 holds a `## Stack` section

#### Scenario: A resumed story on the default branch
- **WHEN** the epic run resumes #282, whose draft pull request has the default branch as its base
- **THEN** `lets-go` edits no base, and no step prompt of #282 holds a `## Stack` section

## MODIFIED Requirements

### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*. The candidates SHALL be the epic's stories that are in this repository and not yet settled, and no other issue. `lets-go` SHALL pass the epic's stories in this repository to `lets backlog ready` as `--only`, every story already settled as `--exclude`, every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, and every story not settled yet that has its change's branch as `--started`, as *An epic run resumes the stories this user started* says, such as `lets backlog ready --only 279,280,281 --exclude 279 --met-blockers 279 --started 281`. With no story settled it SHALL pass no `--exclude`, with no met story no `--met-blockers`, and with no such branch no `--started`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.`, or the `Resumed` line for a story passed in `--started`. It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch*, *Set the question mode* and *Walk the step table*, in this session. When the story's walk has ended with its pull request ready for review, `lets-go` SHALL settle the story with its line, run `git switch <default>`, and pick again. It SHALL rank the stories again for every pick, because a story built in this run can change what is ready.

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

#### Scenario: No child session
- **WHEN** the epic run builds #279
- **THEN** each of #279's steps runs as *Run a step* says, and `lets-go` starts no other `lets-go` session for the story

### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's. A story whose pull request was ready for review when the run started gets this line too, as *An epic run settles the stories already ready, merged or closed* says.
- A merged story: `#<story> <story-name>: merged, <pr-url>`, the URL of its merged pull request.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved`, `in another repository`, `its pull request was closed: <pr-url>`, `it depends on #391, which did not finish` or `the epic run stopped at #391`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`, as *Pick the first ready story* does: an open blocker, an assignee, or its Status, Kind or Priority.
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

#### Scenario: Each line prints as the story settles
- **WHEN** the epic run settles #279 with its pull request URL, and goes on to pick another story
- **THEN** `lets-go` prints #279's line before it prints the next `Picked` line

#### Scenario: Built, failed and skipped stories together
- **WHEN** an epic run on #278 builds #279, the build of #391 fails with `tests fail on main`, #392 is blocked by #391, and the run then builds #394
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, `#391 <story-name>: failed at build: tests fail on main`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#394 <story-name>: <pr-url>`, in that order, and no count line

#### Scenario: A second run after a stop
- **WHEN** an earlier epic run on #278 built #279 to a ready pull request, then stopped during #280's build, and the user runs `lets-go #278` again
- **THEN** the new run prints `#279 epic-run-skeleton: <pr-url>` first, then `Resumed #280: <title>, started in an earlier run, under #278.`, and #280's walk goes on from build

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
