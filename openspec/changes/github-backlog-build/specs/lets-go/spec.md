## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* SHALL request the shared backlog claim operation and accept only its validated result before proceeding; Status writes SHALL follow the selected provider definition's bounded actions. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL use the shared backlog read operation with complete captured title and directional blocker facts, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL say that an epic is built through its stories, list its open sub-issues, and stop. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the Project query, run once in *Read the settings*, as *The Project query runs once per run* says;
- the shared blocker read with title and directional blocker facts above;
- the shared issue read for creation time, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- the `git status --porcelain` before the shape step, and the commit of `openspec/discovery.md`, that *lets-go commits the discovery map on the story's branch* says.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. It finds shared backlog reads and bounded claim actions, plus `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` leaves #149 out, runs both `next` commands again, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

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
- **THEN** it finds the shared title/blocker read before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

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

#### Scenario: Claim needs another bounded action
- **WHEN** the shared claim operation returns an outstanding action rather than a validated completed claim
- **THEN** lets-go executes only that action through the selected definition and starts no plan or build step until validation permits it

### Requirement: lets-go picks the first ready story
After a shape report that names a parent and stories, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case SHALL use complete scoped candidates from the shared backlog boundary and core selection policy, rather than its former direct provider enumeration commands. So SHALL its rank, Must, then Should, then Could, then the lowest issue number, and its *Check the prerequisite* and *Confirm the packet* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When the case returns `nothing-ready`, `lets-go` SHALL print the `Done shape` line, unless this run has printed it already, and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, such as its blocker, its assignee, an unresolved prerequisite, or a packet that is not complete, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

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

### Requirement: The Project query runs once per run
`lets-go` SHALL resolve repository backlog selection through the shared boundary once per run, in *Read the settings*, right after it finds the default branch and the current one. The validated selection sets `<project>`, `<owner>` and `<repo>` for the whole run. An explicit valid repository Project selection SHALL resolve multiple linked Projects; invalid explicit selection SHALL fail without fallback. When it finds no Project, `lets-go` SHALL say to run the `lets-setup-backlog` skill, and stop. When no explicit selection exists and it finds two or more, `lets-go` SHALL list each one's title and URL, ask the user to select one explicitly, and stop. It SHALL never pick one itself. These two stops SHALL come before every other stop of the run but a failed `lets go questions`. No other part SHALL hold them. *Find the source of demand* SHALL not run the query, and SHALL return neither `no-project` nor `several-projects`.

#### Scenario: Next, then the named issue
- **WHEN** `lets-go` runs with nothing on the default branch, `next` picks #149, and *Check the issue* runs *Find the source of demand* for #149
- **THEN** the Project query has run once in the run

#### Scenario: No Project
- **WHEN** no Project is linked to the repository, and the user runs `lets-go` on the branch `fix-typo`
- **THEN** `lets-go` says to run the `lets-setup-backlog` skill and stops, before it searches for the branch's issue

#### Scenario: Two Projects
- **WHEN** two open Projects are linked to the repository and none is explicitly selected
- **THEN** `lets-go` lists both titles and URLs, asks the user to select one explicitly, claims nothing and stops

#### Scenario: The rule is in the section
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** *Read the settings* holds the Project query, and no part or procedure holds `no-project` or `several-projects`

#### Scenario: A Project is explicitly selected
- **WHEN** two linked Projects exist and repository settings validly select one
- **THEN** lets-go uses that Project without requiring the other link to be removed

### Requirement: A lost claim drops the issue, and three lost claims stop the run
When *Claim* returns `taken` for an issue the user named or confirmed as the same work, `lets-go` SHALL say who has it, and stop. When `next` or *Pick the first ready story* picked the issue, `lets-go` SHALL leave out every issue lost in this run. It SHALL run the shared candidate enumeration again, with the same narrowing as the first pick, and take the first ready candidate that is left. It SHALL print the `Picked` line in the same form as the first pick. That is `Picked #<i>: <title>, the next ready issue.` after `next`. After *Pick the first ready story*, it is `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL keep the lines it printed already. It SHALL go on from the blocker read with the new issue. When no candidate is left, it SHALL stop as when nothing is ready. After the third lost claim in one run, `lets-go` SHALL say that other sessions keep taking the picked issues, say to run `lets-go` again, and stop, claiming nothing.

#### Scenario: The lost issue is not picked again
- **WHEN** `next` picked #149, *Claim* returns `taken` for it, and the candidate list read before the claim still holds #149
- **THEN** `lets-go` leaves #149 out, runs the shared candidate enumeration again, and picks another issue

#### Scenario: A lost story under a parent
- **WHEN** *Pick the first ready story* picked #191 under #190, and *Claim* returns `taken` for it, and #192 is the next ready story
- **THEN** `lets-go` prints `Picked #192: <title>, the first ready story under #190.`, and picks no issue outside #190's stories

#### Scenario: Three lost claims
- **WHEN** *Claim* returns `taken` for three picked issues in one run
- **THEN** `lets-go` says other sessions keep taking the picked issues, says to run `lets-go` again, claims nothing and stops

## ADDED Requirements

### Requirement: Backlog actions preserve sole runner ownership
Lets-go SHALL use the shared request/result boundary for the existing-story
GitHub lifecycle. Lets SHALL decide readiness, ranking, claim/release permission,
reconciliation and progression. The agent SHALL execute only the bounded action
requested through the selected provider definition. The step skills SHALL NOT
become alternative runners or gain provider-specific workflow recipes.

#### Scenario: A claim is uncertain
- **WHEN** a requested claim lacks independently established effects or final ownership/status
- **THEN** lets-go reports the recovery state and starts no planning or build step

#### Scenario: Build finishes
- **WHEN** lets-build finishes implementation tasks
- **THEN** it returns its step report and lets-go retains responsibility for the next workflow step

### Requirement: Resume validates current authority
Lets-go SHALL carry immutable item identity and the original private continuation
through step invocations. Before authorizing resumed work it SHALL require fresh
independently captured ownership/status, even when a local branch exists.
Committed identity and historical successful claim evidence SHALL NOT replace
that verification or authorize another session's release.

#### Scenario: Branch exists but ownership changed
- **WHEN** the branch exists and a fresh captured read shows another owner
- **THEN** lets-go reports conflict and starts no implementation work

#### Scenario: Captured ownership is unavailable
- **WHEN** a branch and old claim record exist but current required evidence is unavailable
- **THEN** lets-go pauses and explains the missing evidence without reclaiming or adopting the session
