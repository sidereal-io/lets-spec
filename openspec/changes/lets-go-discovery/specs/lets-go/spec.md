## ADDED Requirements

### Requirement: The shape step asks before it runs discovery
The shape step SHALL NOT fail, and SHALL NOT start discovery on its own, when it finds the work too large for one issue. Too large means Size L or XL, or an input that holds a large idea. It SHALL end its round with a `needs-input` report that holds the question `The work is Size <L or XL>, too large for one issue. Run discovery on it?` with the recommendation `yes`. `lets-go` SHALL relay that question as it relays any other, at the run's level. When the answer is `yes`, the resumed step SHALL run `lets-shape`'s discovery with the idea or #<i> as its input. It SHALL run every phase from Ingest to Finalize, including the glossary handoff. Each phase's confirmation, and the story table in Phase 5, SHALL be a confirmation question with no recommendation. The parent's `Input:` line SHALL hold the idea's words for an idea, or `#<i>` for an issue, so a later round can match it. When the answer is anything but `yes`, the step SHALL end with a `failed` report that says the work is too large for one issue and discovery was declined. The step SHALL create no change and no change branch; the parent issue, the stories and a glossary holding branch are `lets-shape`'s own.

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

#### Scenario: At recommend
- **WHEN** the user ran `lets-go recommend` with the idea, and the shape step reports the discovery question
- **THEN** `lets-go` answers `yes` itself, tells the user, and runs the step again with the answers file

### Requirement: The shape report names the parent and the stories
When discovery filed stories, the shape step's `done` report SHALL hold, as its first evidence line, `epic #<p>: <title>`, with the parent issue's number and title. It SHALL then hold one line per story, `story #<n>: <title>`, in the order the stories were created. When discovery found that the whole run fits one story, so the parent became that story, the first evidence line SHALL be `issue #<n>: <title>`, as for one issue. `lets-go` SHALL read `<p>` and each `<n>` from those lines. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. A `done` report whose first line is an `epic` line and that holds no `story` line SHALL count as `failed`, with a reason that says the shape step named no story. The `Done shape: <date>. <evidence>` line SHALL carry those lines as its evidence.

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
After a shape report that names a parent and stories, `lets-go` SHALL pick one story by naming `lets-build`'s *Find the source of demand*, its third case, `next`. The candidates SHALL be the report's stories and no other issue. That case's two commands SHALL run as `lets-build` writes them. So SHALL its rank, Must, then Should, then Could, then the lowest issue number, and its *Check the prerequisite* on each candidate in rank order. `lets-go` SHALL print `Picked #<n>: <title>, the first ready story under #<p>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When no candidate is ready, `lets-go` SHALL print the `Done shape` line and say that no story under #<p> is ready. It SHALL name each story and why it was left out, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

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
A discovery can stop between rounds, or before *Claim*, when no story is ready. For an idea, before the title search of *Start from an idea*, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line holds the idea's words. It SHALL use `lets-shape`'s own query, `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`. When one exists, `lets-go` SHALL say that a discovery of this idea is in progress at #<p>, skip the title search, and run the shape step for the idea. The step resumes that discovery, as *The shape step asks before it runs discovery* says. For an issue, no check is needed: the stops of *Confirm the packet* send #<i> to the shape step, which finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL stand: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and a yes on `Epic: plugin backlog` stops at the Epic stop, as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* sends #180 to the shape step, whose round resumes that parent

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits `openspec/discovery.md` in the working tree on the default branch. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain`. When that lists `openspec/discovery.md`, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line names this input. When one exists, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes it. When none exists, `lets-go` SHALL say the map has uncommitted edits, say to commit or discard them, and stop. The shape step SHALL end on the default branch with the tree clean, except `openspec/discovery.md` when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL commit that file alone on the branch before *Find the first unfinished step* reads the tree. The commit is `git add openspec/discovery.md` and a `docs:` commit whose message is `docs: the discovery map from #<p>`. `<p>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When `openspec/discovery.md` is unchanged, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that `openspec/discovery.md` holds the discovery's map, uncommitted on the default branch. While the parent still says `Discovery status: in-progress`, it SHALL say to leave the map as it is, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard it before the next run, because a run stops on a dirty tree.

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

## MODIFIED Requirements

### Requirement: Start reuses lets-build
`lets-go` SHALL run `lets-build`'s *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run, by naming those sections. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. When *Find the source of demand* finds an open blocker, `lets-go` SHALL look for the change's branch before it stops. For that, its blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. When the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. When no such branch exists, the stop stands. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when none matches, the case's stop, to run `lets-shape`, SHALL be set aside: the shape step runs for the idea. After a shape report that names a parent and stories, `lets-go` SHALL run that section's third case, `next`, with the candidates narrowed to the report's stories, as *lets-go picks the first ready story* says. On the default branch, when *Confirm the packet* stops with a remedy of running `lets-shape` on #<i>, that stop SHALL be set aside too: the shape step runs for #<i>. It SHALL be set aside once per run: after a shape step, the stop stands. On a change's branch, that stop SHALL stand, because the shape step runs only before any branch exists. The Epic stop SHALL stand. `lets-go` SHALL add no other check of its own to `lets-build`'s sections. The commands it adds of its own are:

- `title` beside `blockedBy` in the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go finds the first unfinished step* and *A skipped step's line carries its evidence and date*;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- the `git status --porcelain` before the shape step, and the commit of `openspec/discovery.md`, that *lets-go commits the discovery map on the story's branch* says.

Start SHALL not be a step: it SHALL run no `lets delegate step` command of its own and SHALL produce no step report. The shape step it runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route* and *Claim* named as sections of `lets-build`, finds `gh issue view <i> --json createdAt`, and finds no `gh project item-edit` command

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and finds the first unfinished step there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** `lets-build`'s *Claim* finds that someone else has the issue
- **THEN** `lets-go` says who has it and stops, as `lets-build` does, and runs no step

#### Scenario: A blocked story on its own branch
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, and the branch `lets-go-story` exists on `origin`
- **THEN** `lets-go` names #149 as an open blocker, switches to `lets-go-story`, and finds the first unfinished step there

#### Scenario: A blocked story with no branch
- **WHEN** `lets-go` runs for #152 on the default branch, #149 is open, and no branch `lets-go-story` exists locally or on `origin`
- **THEN** `lets-go` says #149 blocks it, as `lets-build` does, and claims nothing

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** *Confirm the packet* finds two comments after the watermark on #180
- **THEN** `lets-go` runs the shape step for #180 instead of stopping

#### Scenario: The pick names next
- **WHEN** the shape step reports an epic and three stories
- **THEN** `lets-go` names `lets-build`'s `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* stops on the default branch with a remedy of running `lets-shape` on #<i>. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a stop that *Confirm the packet* makes SHALL stand. `<name>` for the shape step SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The shape prompt SHALL say to run `lets-shape`'s *Shape one issue* to its end, including its second comment fetch, its reply, and its glossary handoff. For an idea, it SHALL give the idea word for word. It SHALL say that Start has searched and the user confirmed no open issue is the same work, so the step skips the search and creates the issue. For an existing issue, it SHALL name #<i> and say to shape it. It SHALL say to create no change and no change branch, and to end on the default branch with a clean tree, except `openspec/discovery.md` when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. It SHALL say that the packet confirmation is a confirmation question, with no recommendation. It SHALL say what the first evidence line of a `done` report is: `issue #<n>: <title>` for one issue. When discovery filed stories, it is `epic #<p>: <title>`, followed by `story #<n>: <title>` lines. It SHALL say that work too large for one issue, Size L or XL, or an input that holds a large idea, ends the round with the discovery question, as *The shape step asks before it runs discovery* says. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `<name>` is `idea-fix-letssync-quiet-output`: the dash alone is dropped, and four words are all there are

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`
- **THEN** the file names `lets-shape`, holds `add a --quiet flag to lets sync`, says the search has run and to create the issue, says to run *Shape one issue* to its end and finish on the default branch with a clean tree, and says the first evidence line is `issue #<n>: <title>`

#### Scenario: The shape prompt names discovery
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file holds `Run discovery on it?`, `epic #<p>: <title>`, `story #<n>: <title>`, `Discovery status: in-progress` and `openspec/discovery.md`, and does not say to end with a failed report for a too-large idea

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` before it writes the prompt, and the first round carries no `--answers-file`

#### Scenario: Confirm the packet stops after shape
- **WHEN** the shape step reported `done` for #181 in this run, and *Confirm the packet* then finds no Kind for #181
- **THEN** `lets-go` stops as `lets-build` does, says to run `lets-shape` on #181, and runs no second shape step

#### Scenario: An issue with no packet
- **WHEN** the user runs `lets-go` for `#180`, and *Confirm the packet* finds no Kind for it
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

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch and the schema. For the shape step, the issue is `#<i>`, or `none yet` with the idea; the branch is the default branch; and the schema is left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says, and its discovery when the work is too large for one issue, as *The shape step asks before it runs discovery* says. For propose: the `openspec-propose` skill for the change, for the issue, with the route line. It continues the change when it already exists, and does not offer the handoff. For apply: the `lets-build` skill on the branch. It stops when every task is ticked, and does not finish the change. For apply review: the *Finish the change* section of the `lets-build` skill. The prompt SHALL say the interactivity level, and what the `lets-go` session does with it. At `recommend`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same at both levels. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it; for shape, the issue first, as `issue #<n>: <title>`, or the parent and the stories, as `epic #<p>: <title>` and `story #<n>: <title>` lines.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `recommend`
- **THEN** the file names `openspec-propose`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the level is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the apply prompt
- **THEN** the file says to stop when every task is ticked, and not to run *Finish the change*

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: A phase confirmation
- **WHEN** the shape step's discovery needs the user to confirm the journey map
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user at either level

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema, and keeps the `## Questions` and report rules of the other prompts

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped propose review: not in the lets-minimal route.`
- `Skipped propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Done propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Skipped apply: every task is ticked, last task commit <date> (<sha>).`
- `Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `issue #<n>: <title>`
- `epic #<p>: <title>`
- `story #<n>: <title>`
- `Run discovery on it?`
- `Picked #<n>: <title>, the first ready story under #<p>.`
- `docs: the discovery map from #<p>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<name>-<step>-prompt.md`
- `.workspace/lets-go/<name>-<step>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<name>-<step>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`

It SHALL not hold `#152 adds`, `#153 adds` or `#154 adds`, SHALL not say that `lets-go` takes chores only, SHALL not say that `lets-go` needs an issue number on the default branch, and SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `#152 adds`, `#153 adds` or `#154 adds`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`
