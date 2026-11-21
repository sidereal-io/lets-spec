<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The step prompt says what to run, the question mode, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch, the schema and the route line. For the shape step, the issue is `#<i>`, or `none yet` with the idea word for word, and the branch is the default branch. Its schema and route are left out, because *Route* has not run. For an idea whose open issue titles *Start from an idea* searched, the header SHALL also say that the search ran and no open issue is the same work. It SHALL say what to run in one sentence. For every step but shape: invoke the step's skill, as the step table names it, for the change and the issue, and stop where that skill stops. The skills are `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. For shape, the sentence is ``Invoke the `lets-shape` skill for issue #<i>, and stop where it stops.`` for an issue, and ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.`` for an idea. The prompt SHALL name no other skill, and no section of a skill, for any step. How `lets-shape` picks its path, resumes a discovery and asks its questions is `lets-shape`'s own, as the `discovery-checkpoints` capability says. `lets-plan` takes the route line from the prompt for the proposal's commit message. The prompt SHALL say the question mode, and what the `lets-go` session does with it. At `auto`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same in both modes. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it. For shape, the issue comes first, as `issue #<i>: <title>`, or the parent and the stories, as `epic #<parent>: <title>` and `story #<story>: <title>` lines. For review plan, the verdict and the reviewed commit come first, as `Plan review: <verdict> for <sha>`.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `auto`
- **THEN** the file names `lets-plan`, `lets-go-chore`, `#149`, the route line, `auto`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`, and does not name `openspec-propose`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the question mode is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-standard`
- **THEN** the file names the `lets-build` skill, says to stop where it stops, and names neither `lets-review-plan` nor `lets-review-build`

#### Scenario: The build prompt on lets-minimal
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-minimal`
- **THEN** the file names `lets-build` and does not name `lets-review-plan`

#### Scenario: The review build prompt
- **WHEN** `lets-go` writes the review build prompt
- **THEN** the file names the `lets-review-build` skill for the change, and names no section of `lets-build`

#### Scenario: The review plan prompt
- **WHEN** `lets-go` writes the review plan prompt for change `lets-go-story`, issue `#152`
- **THEN** the file names the `lets-review-plan` skill for `lets-go-story`, names `#152` and the route line, says the first evidence line is `Plan review: <verdict> for <sha>`, and names no `lets-build`

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: A phase confirmation
- **WHEN** the shape step's discovery needs the user to confirm the journey map
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user in either mode

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema and no route, and keeps the `## Questions` and report rules of the other prompts

#### Scenario: The shape prompt for an issue
- **WHEN** `lets-go` writes the shape prompt for `#180`
- **THEN** its `## What to run` section holds only ``Invoke the `lets-shape` skill for issue #180, and stop where it stops.``

#### Scenario: The shape prompt names no part of lets-shape
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file names no section of `lets-shape`, such as *Resume mode* or *Shape one issue*, and does not hold `Discovery status: in-progress` or `Run discovery on it?`

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The step SHALL run `lets-shape` on the idea or on `#<i>`, with the prompt *The step prompt says what to run, the question mode, and how to report* gives it. `lets-shape` SHALL pick its path as the `discovery-checkpoints` capability says: it shapes the work as one issue, to the end of its comment reads, its reply and its glossary handoff, or runs discovery when the work is too large, as *The shape step runs discovery only after a yes* says. For an idea that the title search already checked, the step SHALL run no second title search. The step SHALL create no change and no change branch, and SHALL end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. The packet confirmation, the question about which product an idea belongs to, and the question that moves the map for a second product SHALL reach `lets-go` with no recommendation, so `lets-go` asks the user in either mode. The first evidence line of a `done` report SHALL be `issue #<i>: <title>` for one issue. When discovery filed stories, it SHALL be `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

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

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, or before *Claim*, when no story is ready. For an idea, before the title search of *Start from an idea*, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line holds the idea's words. It SHALL use `lets-shape`'s own query, `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`. When one exists, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, skip the title search, and run the shape step for the idea. The step resumes that discovery, because `lets-shape` matches the parent's `Input:` line to the idea, as the `discovery-checkpoints` capability says. For an issue, no check is needed: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the four parts. *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the three shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

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

## ADDED Requirements

### Requirement: The shape step runs discovery only after a yes
The shape step SHALL NOT fail, and SHALL NOT start discovery on its own, when it finds the work too large for one issue. Too large means Size L or XL, or an input that holds a large idea. Its round SHALL end with a `needs-input` report that holds the question `The work is Size <L or XL>, too large for one issue. Run discovery on it?` with the recommendation `yes`, as *lets-shape asks before it runs discovery* says. `lets-go` SHALL relay that question as it relays any other, in the run's question mode. When the answer is `yes`, the resumed step SHALL run `lets-shape`'s discovery with the idea or `#<i>` as its input, every phase from Ingest to Finalize, including the glossary handoff. Each phase's confirmation, and the story table in Phase 5, SHALL reach `lets-go` with no recommendation. A later round SHALL carry the discovery on from its parent issue, and SHALL NOT start a second one: it resumes the parent at its recorded next phase, or finishes Finalize on a parent whose status line Finalize removed, as the `discovery-checkpoints` capability says. A phase the answers confirmed SHALL NOT be asked again. When the answer is anything but `yes`, the step SHALL end with a `failed` report that says the work is too large for one issue and discovery was declined. The step SHALL create no change and no change branch; the parent issue, the stories and a glossary holding branch are `lets-shape`'s own. The owner of glossary edits made in discovery SHALL reach `lets-go` with the first story in dependency order as its recommendation.

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

#### Scenario: A round during Finalize
- **WHEN** the answers file holds the discovery question answered `yes` and the Phase 5 story table confirmed, and the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, because Finalize removed it before the glossary handoff asked who carries the edits
- **THEN** the resumed step finishes Finalize on that parent with the handoff's answer, and does not run discovery from Ingest or create a second parent

#### Scenario: The user declines
- **WHEN** the answers file holds that question with the answer `no`
- **THEN** the step ends `failed`, with a reason that says the work is too large for one issue and discovery was declined, and `lets-go` prints `Failed shape:` with it

#### Scenario: At auto
- **WHEN** the user ran `lets-go auto` with the idea, and the shape step reports the discovery question
- **THEN** `lets-go` answers `yes` itself, tells the user, and runs the step again with the answers file

### Requirement: lets-go names a part of a skill, never its step number
`skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` SHALL refer to another part of the skill by its name and a link, never by a step number. Outside fenced code blocks and inline code spans, no text SHALL match the word `step` or `steps` followed by a number, in any case. So the skill SHALL not say `*Start* step 3`, `*Claim* step 2`, `Step 3 of [Run a step](#run-a-step)` or `go on to step 4`. A numbered list SHALL still number its items.

#### Scenario: No step numbers
- **WHEN** the skill-interfaces test reads `lets-go`, outside code
- **THEN** it finds no `step` or `steps` followed by a number

#### Scenario: A step number comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with the line `Go on from *Claim* step 3.`
- **THEN** the check fails, and its output names `SKILL.md` and `step 3`

#### Scenario: A numbered list
- **WHEN** a section of `lets-go` holds a list numbered `1.` to `4.`
- **THEN** the step-number check passes

## REMOVED Requirements

### Requirement: The shape step asks before it runs discovery
**Reason**: The rule moves to `lets-shape`, and the shape prompt no longer orders its entry points. *The shape step runs discovery only after a yes* replaces it and describes what the run does.
**Migration**: Read the discovery question, the resume order and the Finalize case in the `discovery-checkpoints` capability, and the run's side in *The shape step runs discovery only after a yes*.

### Requirement: lets-go refers to no step by its number
**Reason**: Its rule that the shape prompt names `lets-shape`'s steps by their titles goes, because the shape prompt names no part of `lets-shape`. *lets-go names a part of a skill, never its step number* replaces it with the rest of its rule unchanged.
**Migration**: None for readers of `lets-go`: the step-number check is the same. Checks that read *What shape runs* for `lets-shape`'s step titles are removed.
