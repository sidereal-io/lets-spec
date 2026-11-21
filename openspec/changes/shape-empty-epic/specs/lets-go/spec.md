<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: An epic run shapes an empty epic first
An empty epic is an epic with no sub-issues, open or closed: `lets backlog item <epic>` returns an empty `subIssues` and an empty `closedSubIssues`. When *Confirm the packet* returns `epic` for an empty epic, and the run started on the default branch, `lets-go` SHALL run the shape step for `#<epic>`, with `<shape-name>` `issue-<epic>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL claim nothing on the epic and create no branch before the step. When a shape step has already run in this run, `lets-go` SHALL instead say that `#<epic>` has no stories after shaping, say to run the `lets-shape` skill on `#<epic>`, and stop, running no second shape step. The step's `lets-shape` shapes the epic in place, as the `discovery-checkpoints` capability says.

When the step reports `done` and its first evidence line is `epic #<epic>: <title>`, naming the run's epic, `lets-go` SHALL go on from the blocker read in *Check the issue* with the epic as `<i>`, so it reads the epic's new open sub-issues. It SHALL print the `Done shape` line once, before the epic run prints its waves, and SHALL then start the epic run on those sub-issues as *An epic run starts on an epic with open stories* says. It SHALL NOT run *lets-go picks the first ready story*. When the first evidence line is `issue #<epic>: <title>`, because the whole epic fits one story and became it, `lets-go` SHALL go on from the blocker read with `#<epic>` as `<i>`, as for an issue number, and build it as one story. That story keeps `Input: #<epic>`. On a later run, when *Confirm the packet* returns `complete` for an issue whose `Input:` line names the issue itself, `lets-go` SHALL first run *Find the input's discovery* for it. When the lookup finds the issue, its discovery stopped before it finished, and `lets-go` SHALL act as for `needs-shape`, with the reason that its discovery is in progress, so the shape step resumes the discovery or finishes its Finalize. When the step reports `failed` or `needs-input`, `lets-go` SHALL act as *The shape step shapes an idea or an unshaped issue* says.

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

### Requirement: A finished epic stops the run
When *Confirm the packet* returns `epic` for an epic with no open sub-issues and at least one closed sub-issue, `lets-go` SHALL print `#<parent> is finished: every story under it is closed.` and stop. It SHALL claim nothing, create no branch, run no step and leave the epic open.

#### Scenario: Every story is closed
- **WHEN** the user runs `lets-go #278` on the default branch, and `lets backlog item 278` returns `"subIssues": []` and `closedSubIssues` with #279 to #287
- **THEN** `lets-go` prints `#278 is finished: every story under it is closed.`, claims nothing, creates no branch, runs no step, and #278 stays open

#### Scenario: The line is a text block
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/epic-run.md` and `skills/lets-go/SKILL.md`
- **THEN** one of them holds `#<parent> is finished: every story under it is closed.` as a line of its own in a `text` block

### Requirement: An epic run finishes a stopped discovery before it builds
When *Confirm the packet* returns `epic` for an epic with open sub-issues, on the default branch, `lets-go` SHALL run *Find the input's discovery* for `#<epic>` before the epic run starts, as *A stopped discovery resumes from its parent issue* says. That lookup keeps the epic itself when it is a parent. When the lookup finds one or more discoveries, `lets-go` SHALL say that a discovery of `#<epic>` is in progress at each `#<parent>` it found, and run the shape step for `#<epic>`, whose round resumes the discovery or finishes its Finalize. When a shape step has already run in this run, it SHALL instead say to run the `lets-shape` skill on `#<epic>`, and stop. When the lookup finds none, the epic run SHALL start. An epic whose discovery finished SHALL NOT be shaped again: it has no status line, and no answers file of an earlier round of `issue-<epic>` holds a pair.

#### Scenario: A stop between rounds
- **WHEN** the user runs `lets-go #300`, #300 has the open sub-issues #301 and #302, and its body says `Discovery status: in-progress — next phase: stories` with `Input: #300`
- **THEN** `lets-go` says a discovery of #300 is in progress at #300, runs the shape step for #300, and starts no epic run before the step reports

#### Scenario: A stop during Finalize
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** `lets-go` runs the shape step for #300, whose round finishes Finalize, and after its `done` report starts the epic run on #301 to #303

#### Scenario: A finished discovery is not shaped again
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` does not exist
- **THEN** `lets-go` runs no shape step and starts the epic run on #301 to #303

### Requirement: An epic run commits the discovery map on the first story it claims
When a shape step ran in this run, and the epic run's *Claim* creates a story's branch and worktree, `lets-go` SHALL run `git status --porcelain -uall -- openspec/discovery.md openspec/discovery` in the epic run's own checkout. When it lists a path, `lets-go` SHALL carry each listed map into the story's worktree as it stands in the epic run's checkout, and commit them there, alone, as `docs: the discovery map from #<parent>`, before the story's child session starts. It SHALL then return each listed map in the epic run's checkout to its committed state, removing a map that was new, so that the checkout stays clean on the default branch. A later story's claim then finds no changed map and makes no commit. When the epic run claims no story, or a story it claims stops before its map commit, the maps' edits SHALL stay in the epic run's checkout. Before *End of the run*, whenever a shape step ran in this run, `lets-go` SHALL run the status command again in the epic run's checkout, and when it lists a path, SHALL say so as *lets-go commits the discovery map on the story's branch* says for a run that stops before *Claim*. When the shape step leaves the epic with no stories, or a shape step already ran when *Check the issue* finds a stopped discovery, `lets-go` SHALL name the maps' edits the same way before it stops.

#### Scenario: The first claimed story carries the map
- **WHEN** the shape step for #300 changed `openspec/discovery.md`, and the epic run claims #301 first, with the worktree `.workspace/lets-go/worktrees/plugin-contract`
- **THEN** the branch `plugin-contract` holds one commit `docs: the discovery map from #300` that changes `openspec/discovery.md` alone, and `git status --porcelain -- openspec/discovery.md` in the epic run's checkout lists nothing

#### Scenario: A later story carries no map
- **WHEN** the epic run on #300 then claims #302
- **THEN** `lets-go` makes no discovery map commit on #302's branch

#### Scenario: No story is claimed
- **WHEN** the shape step for #300 changed `openspec/discovery.md`, and no story under #300 is ready
- **THEN** `openspec/discovery.md` stays modified in the epic run's checkout, and `lets-go` says to commit or discard it before the next run

#### Scenario: The claimed story stops before its map commit
- **WHEN** the shape step for #300 changed `openspec/discovery.md`, the epic run claims #301, `lets sync` fails in #301's worktree, and no later story is claimed
- **THEN** `openspec/discovery.md` stays modified in the epic run's checkout, and before *End of the run* `lets-go` names it and says to commit or discard it before the next run

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again, unless the parent is the epic the run was given. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When the parent is the run's epic, `lets-go` SHALL go on as *An epic run shapes an empty epic first* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL shape the epic when it is empty, as *An epic run shapes an empty epic first* says; stop when it is finished, as *A finished epic stops the run* says; shape it when its discovery stopped partway, as *An epic run finishes a stopped discovery before it builds* says; and otherwise start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the parent query of *A stopped discovery resumes from its parent issue*, run for an idea; for an issue `#<i>` when the discovery maps have uncommitted edits before the shape step, as *lets-go commits the discovery map on the story's branch* says; for an epic with open sub-issues, as *An epic run finishes a stopped discovery before it builds* says; and for a `complete` issue whose `Input:` line names the issue itself, as *An epic run shapes an empty epic first* says;
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
- **THEN** `lets-go` runs its own `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

#### Scenario: A branch made after the check
- **WHEN** *Check the issue* found no branch `lets-go-chore` for #149, and someone creates a local branch `lets-go-chore` before *Claim* creates it
- **THEN** *Claim* fails to create the branch, removes its assignment, sets #149's Status back to Todo and returns `branch-failed`, and `lets-go` shows the error and stops

#### Scenario: An epic run checks a started story out in a worktree
- **WHEN** an epic run on #278 picks #280, whose branch `epic-run-stacks` is on `origin` and is not checked out anywhere
- **THEN** `lets-go` does not run *Claim* or `git switch`, runs `git fetch origin epic-run-stacks`, then `git worktree add .workspace/lets-go/worktrees/epic-run-stacks epic-run-stacks`, and the epic run's checkout stays on the default branch

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says, and for an epic the user named, as *An epic run shapes an empty epic first* and *An epic run finishes a stopped discovery before it builds* say. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The step SHALL run `lets-shape` on the idea or on `#<i>`, with the prompt *The step prompt says what to run, the question mode, and how to report* gives it. `lets-shape` SHALL pick its path as the `discovery-checkpoints` capability says: it shapes the work as one issue, to the end of its comment reads, its reply and its glossary handoff, or runs discovery when the work is too large, as *The shape step runs discovery only after a yes* says. For an idea that the title search already checked, the step SHALL run no second title search. The step SHALL create no change and no change branch, and SHALL end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. The packet confirmation, the question about which product an idea belongs to, and the question that moves the map for a second product SHALL reach `lets-go` with no recommendation, so `lets-go` asks the user in either mode. The first evidence line of a `done` report SHALL be `issue #<i>: <title>` for one issue. When discovery filed stories, it SHALL be `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says, unless the parent is the epic the run was given: then it SHALL go on as *An epic run shapes an empty epic first* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

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

### Requirement: lets-go picks the first ready story
After a shape report that names a parent and stories, and whose parent is not the epic the run was given, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case SHALL run `lets backlog ready` with the report's stories as `--only`. So SHALL its rank, Must, then Should, then Could, then the oldest issue first, and its *Check the prerequisite* and *Confirm the packet* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When the case returns `nothing-ready`, `lets-go` SHALL print the `Done shape` line, unless this run has printed it already, and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, such as its blocker, its assignee, an unresolved prerequisite, or a packet that is not complete, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case. When the parent is the run's epic, `lets-go` SHALL pick nothing here, and go on as an epic run, as *An epic run shapes an empty epic first* says.

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

#### Scenario: The run's own epic is not picked from
- **WHEN** the user ran `lets-go #300` on the empty epic #300, and the shape step reports `epic #300: Epic: plugin backlog` with three stories
- **THEN** `lets-go` prints no `Picked #<i>: <title>, the first ready story under #300.` line, and starts an epic run on #300

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, during Finalize, or before *Claim*, when no story is ready. Finalize removes the parent's status line before it asks its own questions, so a stop during Finalize leaves a parent with no status line. To find an input's discovery, `lets-go` SHALL list the open parent issues with `lets-shape`'s query, `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and keep each whose `Input:` line names this input: the idea word for word for an idea, and `#<i>` or the issue's URL for an issue. When the input is an issue `#<i>` that is itself in that list, `lets-go` SHALL keep it too, whatever its `Input:` line names, as `lets-shape` does. A kept parent SHALL be this input's discovery when it says `Discovery status: in-progress`. It SHALL also be this input's discovery when it has no status line and an earlier shape round of this input left answers: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair, and, for an idea, `.workspace/lets-go/<shape-name>-shape-prompt.md` holds this idea. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT be this input's discovery.

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

#### Scenario: The input is itself the parent
- **WHEN** the lookup runs for `#200`, and the open parent #200 says `Discovery status: in-progress — next phase: stories` with `Input: rewrite the backlog around a plugin model`
- **THEN** the lookup keeps #200 as this input's discovery

### Requirement: An epic run starts on an epic with open stories
When *Confirm the packet* returns `epic` for the run's issue, the run started on the default branch, the epic has open sub-issues, and *An epic run finishes a stopped discovery before it builds* found no discovery in progress, `lets-go` SHALL start an epic run on that epic, `#<parent>`. On a change's branch it SHALL say that an epic run needs the default branch, and stop: an epic has no change's branch. The epic's stories SHALL be the open sub-issues that `lets backlog item <parent>` printed in *Check the issue*, in the order it printed them. They SHALL stay the same set for the whole epic run: a sub-issue added or closed during the run does not change it. `lets-go` SHALL claim nothing on the epic, and create no branch for it: it claims each story it builds, as for any picked issue. Before the epic run starts, *Check the issue* SHALL run only these checks on the epic:

- the blocker read and the open-blocker decision, as for any issue. An epic has no change's branch, so `lets-go` SHALL not look for one. An open blocker on the epic SHALL stop the run, as for an issue with no branch;
- *Confirm the packet*, which returns `epic` from the Kind alone.

It SHALL not run *Find the source of demand* or *Check the prerequisite* on the epic. Each story's own *Check the prerequisite* runs when the epic run ranks it.

Each story run SHALL run in a child `lets-go` session, as *An epic run runs each story in a child session* says. An empty epic SHALL go as *An epic run shapes an empty epic first* says, and an epic whose sub-issues are all closed as *A finished epic stops the run* says.

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

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits the discovery maps in the working tree on the default branch: `openspec/discovery.md`, and in a repository with several products the files under `openspec/discovery/`. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, which names each changed file and works when the folder does not exist. When that lists a path, `lets-go` SHALL look for this input's discovery, for an idea or an issue `#<i>`, as *A stopped discovery resumes from its parent issue* says. For an idea, it SHALL use what *Start from an idea* found. When this input has a discovery, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes the discovery or finishes its Finalize. When it has none, `lets-go` SHALL say the maps have uncommitted edits, name each path, say to commit or discard them, and stop. When the check went on only because one or more parents with no status line were this input's discovery, and the shape step then shaped none of those parents: the one issue it reports, or the parent it reports, is not one of them, the edits may be another discovery's: `lets-go` SHALL print the `Done shape` line, name each path the status command lists, say to commit or discard them, and stop in *Run the shape step*, before *Check the issue*. It SHALL claim nothing and create no branch. The shape step SHALL end on the default branch with the tree clean, except the discovery maps when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL run that status command again, on the branch, before *lets-go walks the step table* reads the tree. In an epic run, the story's branch is in its own worktree, and `lets-go` SHALL commit the maps as *An epic run commits the discovery map on the first story it claims* says instead. It SHALL commit each path it lists, new files included. The commit is `git add -- <paths>`, then `git commit -m "docs: the discovery map from #<parent>" -- <paths>`. It SHALL never pass `openspec/discovery` itself to `git add` or `git commit`, because both fail on a path that matches no file. `<parent>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When no discovery map changed, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that the discovery maps it names hold the discovery's edits, uncommitted on the default branch. While *Find the input's discovery* still takes the parent as this input's discovery, it SHALL say to leave the maps as they are, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard them before the next run, because a run stops on a dirty tree.

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
- **THEN** `lets-go` prints the `Done shape` line, names `openspec/discovery.md`, says to commit or discard it, and stops before *Check the issue*. It picks no story, claims nothing and makes no map commit

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
- **WHEN** `git status --porcelain` lists ` M openspec/discovery/warehouse.md` before the shape step runs, and this input has no discovery
- **THEN** `lets-go` names `openspec/discovery/warehouse.md`, says to commit or discard it, and runs no step

## REMOVED Requirements

### Requirement: An epic with no open stories points to lets-shape
**Reason**: `lets-go` now shapes an empty epic itself, and stops on a finished epic with its own line.
**Migration**: An empty epic goes as *An epic run shapes an empty epic first* says; an epic whose sub-issues are all closed goes as *A finished epic stops the run* says.
