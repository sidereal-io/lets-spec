## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every work run. A run that resolves a terminal PR SHALL instead take the shared completion or rejected path before packet, blocker, claim or work-ownership checks, as *A closed pull request ends the run* says. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* SHALL request the shared backlog claim operation and accept only its validated result before proceeding; Status writes SHALL follow the selected provider definition's bounded actions. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL use the shared backlog read operation with complete submitted title and directional blocker facts, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL say that an epic is built through its stories, list its open sub-issues, and stop. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the Project query, run once in *Read the settings*, as *The Project query runs once per run* says;
- the shared blocker read with title and directional blocker facts above;
- the scoped terminal-PR lookup and `lets backlog completion.write --request-file .workspace/backlog-request.json` for the merged path;
- `lets backlog reference.write --request-file .workspace/backlog-request.json` for PR association in the shared runner;
- `lets backlog claim.read` for fresh ownership and status checks;
- `lets backlog submit --continuation-file .workspace/backlog-continuation.json --submission-file .workspace/backlog-submission.json` and `lets backlog resume --continuation-file .workspace/backlog-continuation.json` in the shared bounded action loop;
- the scoped shared operations using `--request-file .workspace/backlog-request.json`;
- the shared issue read for creation time, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- the `git status --porcelain` before the shape step, and the commit of `openspec/discovery.md`, that *lets-go commits the discovery map on the story's branch* says.

The terminal lookup SHALL use the same scoped read boundary; association and
completion SHALL be shared runner calls, not new workflow steps. The action
loop SHALL use the definition selected for the repository and SHALL not contain
GitHub commands or provider-specific sequencing of its own.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. It finds shared backlog reads and bounded claim actions, plus `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` leaves #149 out, runs the shared candidate enumeration again, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

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
- **THEN** it finds `lets backlog item.read` and `lets backlog relationship.list` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

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

### Requirement: Each lets-go procedure returns a result
Each procedure of `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure is a section under `## Procedures` in `SKILL.md`, or one of *Glossary preflight*, *Import the glossary checkpoint* and *Commit the discovery map* in a reference file. *Glossary preflight*, which only *Claim* runs, SHALL return to *Claim*. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results. Each result is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `taken`, `unresolved`, `checkpoint-failed`, `branch-failed`, `claim-uncertain`, `backlog-unavailable` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |

*Glossary preflight* returns `no-owned-edits` when the story owns no glossary edits, and otherwise passes on what *Check the checkpoint* returns. `verified` carries the checkpoint commits to import. *Claim*'s `claimed` carries what *Glossary preflight* returned, so *Enter the branch* runs *Import the glossary checkpoint* only after `verified`. *Commit the discovery map* ends one way only, so it names no result.

#### Scenario: Every procedure returns
- **WHEN** the skill-interfaces test reads each procedure of `lets-go`, in `SKILL.md` and in its reference files
- **THEN** each one says it returns to the part that ran it, or, for *Glossary preflight*, to *Claim*, has no `Next:` line, and holds no `stop` or `stops` outside code

#### Scenario: A procedure that stops
- **WHEN** a skills folder holds `lets-go/SKILL.md` whose *Confirm the packet* says ``Say to run the `lets-shape` skill on `#<i>`, and stop.``
- **THEN** the check fails, and its output names `Confirm the packet`

#### Scenario: Confirm the packet lists its results
- **WHEN** the skill-interfaces test reads *Confirm the packet*
- **THEN** it finds `complete`, `needs-shape` and `epic`

*Claim* SHALL drive intermediate `action` responses through the shared bounded
action loop; an outstanding action is not a completed claim. `claim-uncertain`
SHALL carry known partial effects and the original recovery reference when a
claim cannot be confirmed. `backlog-unavailable` SHALL carry the prerequisite or
capability failure without a new claim. `branch-failed` SHALL carry the branch
error plus release status `complete`, `none` or `unresolved`; unresolved release
SHALL carry its recovery reference. These results SHALL NOT overload glossary
`unresolved` or be treated as a lost-race `taken` result.

#### Scenario: Claim returns uncertain effects
- **WHEN** a submitted claim result leaves assignment or status effects unknown
- **THEN** Claim returns `claim-uncertain` with known effects and the original recovery reference

### Requirement: Each part names the action for each result
A part that runs a procedure SHALL name each result the procedure can return there. For each one, it SHALL say what to do: go on, run another part, or tell the user what the result carries and stop. A part SHALL not hold a catch-all such as `any other stop stands`. The overview's *Stops when* column SHALL name the results a part stops on.

#### Scenario: Check the issue acts on the packet's results
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** it finds `complete`, `needs-shape` and `epic`, each with its action

#### Scenario: Enter the branch acts on the claim's results
- **WHEN** the skill-interfaces test reads *Enter the branch*
- **THEN** it finds `claimed`, `taken`, `unresolved`, `checkpoint-failed`, `branch-failed`, `claim-uncertain` and `backlog-unavailable`, each with its action, and no `branch-exists`

#### Scenario: A claim with owned glossary edits
- **WHEN** *Glossary preflight* returns `verified` with two checkpoint commits, and *Claim* then returns `claimed`
- **THEN** *Enter the branch* runs *Import the glossary checkpoint* with those two commits before it commits the discovery map

#### Scenario: A claim with no owned edits
- **WHEN** *Glossary preflight* returns `no-owned-edits`, and *Claim* returns `claimed`
- **THEN** *Enter the branch* runs no import

#### Scenario: An epic stops the run
- **WHEN** the user runs `lets-go` for `#194`, and *Confirm the packet* returns `epic`
- **THEN** `lets-go` says that an epic is built through its stories, lists its open sub-issues, claims nothing and stops

*Enter the branch* SHALL report `claim-uncertain` or `backlog-unavailable` and
end the run without starting a step or selecting another issue. On
`branch-failed` it SHALL report both the branch error and release outcome;
unresolved release SHALL remain visible with its recovery reference.

### Requirement: The resume paragraph says what a run started again does
The paragraph near the top of `SKILL.md` that tells the user to run `lets-go` again after a run stops SHALL say what the new run does in each of these cases:

- **On the change's branch:** it finds the issue from the branch's name, prints a dated line for each step already done, and goes on from the first unfinished step.
- **On the default branch, with the issue number:** it finds the change's branch, here or on `origin`, switches to it, and goes on the same way. It does not claim the issue again.
- **On the default branch, with nothing:** it does not resume. It picks the next ready issue, and a claimed issue is never ready. To resume, give the issue number, or run it on the change's branch.
- **After a failed step:** the run that failed never runs that step again. A new run starts it afresh, in a new session, with the answers given so far. A failed shape step has no branch: the run says to run `lets-shape` on the idea or the issue.
- **After the pull request is merged:** it verifies the exact associated merge and reconciles completion, then stops without a step. It accepts native Done without a repeated update. Missing merge/closing facts or uncertain effects produce a recovery result, not another build.
- **After the pull request is closed without merge:** there is nothing to resume, and the run stops without completion writes.

Ordinary resume SHALL use immutable issue identity plus a fresh sole-owner and
In Progress read. It SHALL NOT require the original private continuation merely
to continue the step walk. It SHALL check shared local outstanding mutations
and require original-operation reconciliation when effects are uncertain.

#### Scenario: Each case is named
- **WHEN** the skill-interfaces test reads `SKILL.md` up to the overview table
- **THEN** it names the change's branch, the default branch with the issue number, the default branch with nothing, a failed step and a merged or closed pull request, each with what the new run does

### Requirement: A closed pull request ends the run
When a run resolves the exact associated PR as `MERGED`, lets-go SHALL run
shared `completion.write` through its bounded action loop before ending.
Completion SHALL require fresh exact merge, commit and native closing facts;
absence or uncertainty SHALL return a visible pending/recovery result without
setting Done. The terminal path SHALL NOT require current In Progress ownership,
because native automation can already have completed and unassigned the issue.
It SHALL check shared outstanding item mutations before a completion write.

When state is `CLOSED` without merge, lets-go SHALL retain the rejected stop and
request no completion write. Neither terminal path SHALL run a workflow step,
claim, create a branch or be treated as an open-PR record disagreement. They
SHALL run within *Check the issue* before packet, blocker, branch-creation and
ownership-for-work checks. If the branch was deleted, an explicit issue number
SHALL resolve through active/archived committed identity or a unique native
closing PR relationship in the selected repository and backlog. Ambiguous or
missing identity SHALL pause without guessing. On a surviving change branch,
committed identity SHALL permit resolving an issue auto-closed by the merge.
Default-branch invocation with no issue SHALL remain `next`, not terminal work
scanning. A feature-branch merge without the required closing relationship
SHALL report pending completion and leave the item unchanged.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets-go` verifies exact merge and closing facts, reconciles completion or reports missing facts, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `CLOSED`
- **THEN** `lets-go` says the change was rejected, and runs no step

#### Scenario: A stacked pull request merged into its base
- **WHEN** pull request #214 for `lets-go-one-rule-once` merged into `lets-go-procedures-return`, its issue #202 is still open, and the user runs `lets-go` on the branch `lets-go-one-rule-once`
- **THEN** `lets-go` finds #202 by the branch name, reads `MERGED`, reports pending completion without a Done write when the required closing relationship is absent, and runs no step

#### Scenario: Merged issue has no surviving branch
- **WHEN** the user names an auto-closed issue on the default branch after its branch was deleted and the unique native closing PR is merged
- **THEN** lets-go verifies that exact merge, reconciles completion and ends without creating or checking out a branch

### Requirement: lets-go walks the step table
For a nonterminal work run, after *Set the question mode*, on the change's branch, `lets-go` SHALL read the records Git and GitHub keep, in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Then `lets-go` SHALL walk the step table from the top: plan, review plan, build, review build. The step table SHALL have no row for shape: shape runs before the walk, in *Run the shape step*, and *Check the issue* prints its `Skipped shape` or `Done shape` line. When the walk reaches a row, it SHALL read whether that step is done. Each row's done test SHALL be written once, in the walk, as an ordered list: the first item that matches decides. The step table SHALL not restate it. The plan row and the build row each read the change state when the walk reaches them: `openspec instructions apply --change <name> --json`, run when `openspec/changes/<name>/` exists and there is no archive folder. Plan is done when the `state` is `ready` or `all_done`, or the archive folder exists. Build is done when the `state` is `all_done`, or the archive folder exists. The build row SHALL read the state again, even when the plan row read it, because a review plan round can add a task. Any `state` other than `blocked`, `ready` or `all_done` SHALL show the CLI's `instruction` and stop. Review plan is done as *Review plan runs as a step, or is not in the route* says. Review build is done when the archive folder exists. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL check it as *A done report is checked against its record* says, and go on to the next row only when the check passes. `lets-go` SHALL read a row's record when it reaches the row, not before, because a step run in this round changes the records the next row reads.

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

The walk SHALL validate the existing PR association before starting the first
unfinished step, or request association immediately after the plan step first
creates a PR. After any step changes the PR, it SHALL refresh association through
the shared boundary. Pending native closing linkage for a feature-branch stack
SHALL be reported without blocking ordinary work or granting completion. A
terminal PR SHALL have taken *Check the issue*'s completion/rejected path before
this walk; it SHALL run no step-table row.

### Requirement: Review build ends the run
The review build step SHALL run the `lets-review-build` skill. On `lets-standard` that skill reviews the code first. On every flow it then follows the project's finishing rules, verifies, archives, and marks the pull request ready. When it reports `done` and the check that *A done report is checked against its record* sets passes, or when the walk of *lets-go walks the step table* found every step done, the walk SHALL have printed one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done`, the step's spoken name, a colon, the report's `date` and its evidence: `Done build: <date>. <evidence>`. Review plan prints the line *Review plan runs as a step, or is not in the route* sets. A failed step prints `Failed`, the spoken name, a colon and the reason: `Failed review build: <reason>`. The spoken name has a space, never a hyphen. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no workflow step log of its own outside `.workspace/`, and SHALL need none to locate the next unfinished step: without its files in `.workspace/lets-go/`, a run reaches the same step. Private backlog recovery state records uncertain operations, not completed steps. Before ending an open-PR run, the runner SHALL refresh any changed PR association. It SHALL leave the item In Progress until a later explicit run verifies the exact merge and completion; the ready-PR run SHALL not wait for or perform a merge.

#### Scenario: A finished run
- **WHEN** review build reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, plan, review plan, build and review build, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the review plan step and the build step ran in this run on `lets-standard`, and review build reports `done`
- **THEN** the third line starts `Done review plan: ` and the fourth starts `Done build: `

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: Records that disagree stop the run
For nonterminal work runs, when the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

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

Merged or rejected PRs SHALL take the shared terminal path before these
open-PR disagreement rules. A terminal completion with missing identity, merge
facts or uncertain effects SHALL report that specific recovery/missing-fact
result and SHALL NOT attempt a workflow step to repair it.

### Requirement: lets-go looks for the change's branch before the packet check
For nonterminal work, *Check the issue* SHALL look for the change's branch once for each issue it checks. It SHALL look right after the blocker read, and before it runs *Find the source of demand* and *Confirm the packet*, whether a blocker is open or not. On the default branch, it SHALL run `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`. On a change's branch, the branch exists. *Enter the branch* SHALL use what *Check the issue* found, and SHALL not look again. After a shape step, *Check the issue* SHALL look again for the shaped issue, whose title gives the name. Sometimes the branch exists and *Confirm the packet* returns `needs-shape`. Then `lets-go` SHALL say that the change has started on `<name>`, and why the packet needs shaping. It SHALL say to run `lets-shape` on `#<i>`, and stop. It SHALL do the same on the default branch and on the change's branch.

#### Scenario: The lookup comes before the packet check
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** `git ls-remote --heads origin refs/heads/<name>` comes before the link to `#confirm-the-packet`

#### Scenario: A started change with a new comment, on the default branch
- **WHEN** the user runs `lets-go 123` on the default branch, `origin` has the branch `lets-go-chore`, and *Confirm the packet* returns `needs-shape` because #123 has a comment after the watermark
- **THEN** `lets-go` says the change has started on `lets-go-chore`, says to run `lets-shape` on #123, stops, and runs no shape step

#### Scenario: The same change, on its branch
- **WHEN** the user runs `lets-go` on the branch `lets-go-chore`, whose issue #123 has the same comment
- **THEN** `lets-go` says the same, and stops

A terminal PR SHALL instead take the completion/rejected path before branch
creation, packet or glossary checks. Terminal completion SHALL not require a
surviving branch and SHALL never recreate one.

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. A request names an issue when it holds `#<i>` or is a bare number. A leading or trailing `ask` or `auto` SHALL name the question mode when the rest of the request is a number or nothing. When the rest is words on the default branch, `lets-go` SHALL ask the user whether that word names the question mode or is part of the idea, and show both readings. It SHALL ask in either mode, before *Start from an idea* runs. Only when the user says the word names the question mode SHALL `lets-go` take it off, as the question mode. Otherwise the word SHALL stay in the idea, and *Set the question mode* SHALL take the question mode from its next source. On the default branch, every other request with words SHALL be the idea, kept word for word. When the idea holds no letter or digit, in any script, `lets-go` SHALL say that an idea needs at least one letter or digit, and stop. It SHALL stop before the discovery query and the title search, claiming nothing and running no step. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank, and its *Check the prerequisite* and *Confirm the packet* on each candidate, as *Only an idea or a named issue goes to the shape step* says. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When the case returns `nothing-ready`, `lets-go` SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, committed item identity SHALL be checked first for a uniquely scoped existing issue, including one auto-closed by a merge. When no committed identity exists and it is given no number, it SHALL find the open issue by the branch name. When no committed identity resolves the issue, it SHALL use the scoped `item.search` operation to find open issues by branch title and keep only those whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, it SHALL match committed issue identity when present; otherwise that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

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

### Requirement: An entry table says where the run goes after the request
*Read the request* SHALL hold a table that decides where the run goes, from the branch the run started on and the request. Its rows SHALL be the default branch and another branch. Its columns SHALL be a number, an idea and nothing. Each of the six cells SHALL name the part the run goes to next, or the stop:

- On the default branch, a number goes to *Check the issue*. An idea goes to *Start from an idea*. Nothing runs `next`: a pick prints `Picked #<i>: <title>, the next ready issue.` and goes to *Check the issue*, and an empty backlog stops.
- On another branch, a number goes to *Check the issue* when it is the issue named by matching committed identity, or one of the open issues whose title starts with the branch's name and ` — `, and stops otherwise. An idea stops: an idea needs the default branch. Nothing goes to *Check the issue* when matching committed identity resolves the scoped issue, or exactly one open issue's title starts that way, and stops when none or several do.

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

### Requirement: lets-go runs for a Chore, a Bug or a Story
`lets-go` SHALL run on the repository's default branch, or on a change's branch. A change's branch is a branch named after the change, whose issue `lets-go` resolves from committed item identity or branch name as *lets-go takes one issue number or an idea* says. On any other branch it SHALL say that `lets-go` runs on the default branch or on a change's branch, and stop. It SHALL run for an issue whose Kind is Chore, Bug or Story. It SHALL run for an issue of any other Kind but Epic as for a Story. It SHALL also run for an idea or an unshaped issue, which the shape step turns into one. It SHALL add no Kind check of its own: an Epic stops where *Confirm the packet* says an epic is built through its stories. For a Story with a parent, it SHALL read the parent's **Shared decisions** as *Confirm the packet* says, because *Route* needs them. When a procedure returns a result that ends the run, such as `unresolved` for a glossary prerequisite, `lets-go` SHALL stop as the part that ran it says.

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
- **WHEN** the issue's Kind is Epic
- **THEN** `lets-go` stops as *Confirm the packet* says, lists the epic's open sub-issues, and claims nothing

#### Scenario: A branch with no issue
- **WHEN** the current branch is `fix-typo`, and no committed identity resolves an issue and no open issue's title starts with `fix-typo — `
- **THEN** `lets-go` says it runs on the default branch or on a change's branch, and stops

#### Scenario: A glossary prerequisite still stops
- **WHEN** the issue's **Glossary handoff** names an owner whose pull request has not merged
- **THEN** `lets-go` stops as *Check the prerequisite* says, and runs no step

#### Scenario: Another Kind
- **WHEN** the issue's Kind is Spike, and its packet has every Story line
- **THEN** `lets-go` goes on to *Route*, as for a Story

## ADDED Requirements

### Requirement: Backlog actions preserve sole runner ownership
Lets-go SHALL use the shared request/result boundary for the existing-story
GitHub lifecycle. Lets SHALL decide readiness, ranking, claim/release permission,
reconciliation and progression. The agent SHALL execute only the bounded action
requested through the selected provider definition. The step skills SHALL NOT
become alternative runners or gain provider-specific workflow recipes.

#### Scenario: A claim is uncertain
- **WHEN** a requested claim lacks validated observations of effects or final ownership/status
- **THEN** lets-go reports the recovery state and starts no planning or build step

#### Scenario: Build finishes
- **WHEN** lets-build finishes implementation tasks
- **THEN** it returns its step report and lets-go retains responsibility for the next workflow step

### Requirement: Resume validates current authority
Lets-go SHALL carry immutable item identity through step invocations and keep
private operation continuation separate. Before authorizing resumed work it
SHALL require fresh validated sole-owner/In Progress observations and check
outstanding item mutations in the shared local store. Ordinary resume SHALL NOT
require the original private continuation or a new claim. Original-operation
continuation SHALL remain required for uncertain writes and claim release.
Historical claim success SHALL NOT replace fresh verification. A worker session
SHALL be the backend worker identity in `context.session`, distinct from the
step's harness session or label; step sessions SHALL carry their caller's worker
identity for backend actions.

#### Scenario: Branch exists but ownership changed
- **WHEN** the branch exists and a fresh validated submitted read shows another owner
- **THEN** lets-go reports conflict and starts no implementation work

#### Scenario: Current ownership observations are unavailable
- **WHEN** a branch and old claim record exist but current required evidence is unavailable
- **THEN** lets-go pauses and explains the missing evidence without reclaiming or adopting the session

#### Scenario: New session continues the same work
- **WHEN** a new lets-go session resolves the committed item identity and fresh reads show the authenticated actor as sole assignee and In Progress with no known unresolved effects
- **THEN** it resumes from the first unfinished step without the original private continuation or another claim

#### Scenario: Legacy branch predates private continuation
- **WHEN** an existing in-progress branch has no journal and uniquely resolves to the selected issue with valid fresh ownership/status
- **THEN** lets-go continues its existing resume path and does not invent original release authority

### Requirement: Shared runner associates the PR and verifies completion
Within *Walk the step table*, after the plan step creates the OpenSpec change,
lets-go SHALL persist and commit the core's validated generic identity as
`openspec/changes/<name>/identity.json` before the next step. This metadata
SHALL contain no workflow step log, private continuation or credential.
Lets-go SHALL request `reference.write` after a plan step creates the PR,
before the next step. It SHALL validate existing
association on resume and refresh it after a step changes the PR. An already
correct association SHALL cause no repeated write. A stacked PR without an
available native closing relationship SHALL be reported as pending association;
its intended exact PR reference SHALL survive until retargeting permits a fresh
check. Pending association SHALL NOT imply completion.

The runner SHALL use `lets backlog reference.write` and
`lets backlog completion.write` with the same request/submission loop as other
operations. The provider definition SHALL translate backend actions and facts;
it SHALL NOT choose the next workflow part or run a separate completion loop.
After merge, completion SHALL run on the next explicit lets-go invocation for
that issue or its identifiable change branch. No run SHALL merge, watch or wait
for the PR as part of this behavior.

#### Scenario: Plan opens its draft PR
- **WHEN** the plan step returns its new PR and the exact native closing relationship is available
- **THEN** lets-go validates the PR association through reference.write before running the next step

#### Scenario: Stacked PR has no native closing relationship yet
- **WHEN** the intended PR targets a feature branch and native closing linkage is not exposed
- **THEN** lets-go preserves its exact intended reference and reports association pending without authorizing Done
- **AND** ordinary stack work can continue through the shared runner

#### Scenario: A later run finds native completion
- **WHEN** the user runs lets-go for the issue after merging its exact associated PR and GitHub has already set Done
- **THEN** lets-go validates the merge and completed state, writes no repeated update, runs no step and prints the PR URL

#### Scenario: A later run needs a completion update
- **WHEN** the exact associated merge qualifies but the selected backlog item remains In Progress
- **THEN** lets-go requests only the required completion operation, validates its effects and ends without a build step or merge

#### Scenario: Completion response is lost
- **WHEN** a completion write may have reached the backend but its result is unavailable
- **THEN** the next run reconciles that original completion before authorizing another update
