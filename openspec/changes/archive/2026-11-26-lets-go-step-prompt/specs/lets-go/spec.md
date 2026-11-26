## MODIFIED Requirements

### Requirement: Review plan runs as a step, or is not in the route
When the schema is `lets-minimal`, review plan never runs. `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. When the schema is not `lets-minimal`, review plan SHALL be a step of its own. It SHALL run as *Each step runs through lets delegate step* says, with `--for review-plan` and `--name <name>-review-plan`. Its prompt SHALL say to invoke the `lets-review-plan` skill for the change, as *lets go step-prompt prints a walk step's prompt* in the `go-step-prompt` capability says. That skill reviews the plan, or lets its *Check an earlier review* decide, runs its own rounds, and records the review in the pull request description under **Plan review**. When the walk reaches review plan, the first of these that matches SHALL decide whether it is done. First, on `lets-minimal`, review plan is done. Second, when the archive folder exists, review plan is done, and the records disagree when the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line. Third, otherwise, review plan SHALL count as done when that section covers the plan: `lets-review-plan`'s *Check an earlier review* finds no reason to run the skill again, and says the review is finished. When the walk reaches review plan and no section covers the plan, review plan SHALL run, whatever the change's `state`. So a `ready` change with no covering review goes to review plan, not build. `lets-go` SHALL read the pull request's body when it reaches the row, with `gh pr view <name> --json number,body`, because a step in this run can have opened or changed it. When review plan was done before this run, `lets-go` SHALL print `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.` `<pr>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body. `lets-go` SHALL find the `## Plan review` heading first, and read the section up to the next `## ` heading or the end of the body. Inside it, `<sha>` SHALL come from the line that starts `Reviewed: `, and `<verdict>` from the line that starts `- **Verdict:** `. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the review plan step reports `done` in this run, `lets-go` SHALL print `Done review plan: <date>. <evidence>`, with the report's `date` and its `evidence` joined with `; `, as for any other step. The schema SHALL be the `schema:` line of the first of these files that exists: the change's `openspec/changes/<name>/.openspec.yaml`, then the archived change's `openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`. When neither exists, it SHALL be the route's schema. So an archived change keeps the schema it was built with, even when the route would now pick another.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the walk reached review plan with no **Plan review** section in pull request #167, and the review plan step reported `done` with the date `2026-11-05T10:00:00Z` and the evidence `Plan review: APPROVE for 7d16565` and `pull request #167`
- **THEN** `lets-go` prints `Done review plan: 2026-11-05T10:00:00Z. Plan review: APPROVE for 7d16565; pull request #167` before it runs build

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, pull request #167's **Plan review** section says `Reviewed: 7d16565` and `- **Verdict:** APPROVE` and covers the plan, and `git log -1 --format=%as 7d16565` prints `2026-11-03`
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

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says, and for an epic the user named, as *An epic run shapes an empty epic first* and *An epic run finishes a stopped discovery before it builds* say. For an epic whose stopped Finalize *A stopped discovery resumes from its parent issue* found through another input's answers, the step SHALL run for that input, under that input's `<shape-name>`. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. When the step ran for an epic `#<i>` whose `Input:` line names another input, `lets-go` SHALL also remove that input's answers file, under its own `<shape-name>`, and, for an idea, only when that input's prompt file holds that idea: otherwise a stopped round of that input leaves answers that *A stopped discovery resumes from its parent issue* finds when the run goes back to *Check the issue*. When the step reports `done` with an `epic #<parent>` line, `lets-go` SHALL also remove `.workspace/lets-go/issue-<parent>-shape-answers.yaml`, whatever input the step ran for: a stopped round of `lets-go #<parent>` may have left answers there. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The step SHALL run `lets-shape` on the idea or on `#<i>`, with the prompt that *lets go step-prompt prints the shape prompt for an issue or an idea* in the `go-step-prompt` capability describes. `lets-shape` SHALL pick its path as the `discovery-checkpoints` capability says: it shapes the work as one issue, to the end of its comment reads, its reply and its glossary handoff, or runs discovery when the work is too large, as *The shape step runs discovery only after a yes* says. For an idea that the title search already checked, the step SHALL run no second title search. The step SHALL create no change and no change branch, and SHALL end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. The packet confirmation, the question about which product an idea belongs to, and the question that moves the map for a second product SHALL reach `lets-go` with no recommendation, so `lets-go` asks the user in either mode. The first evidence line of a `done` report SHALL be `issue #<i>: <title>` for one issue. When discovery filed stories, it SHALL be `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL take the parent as `<i>`, and go on as *A shape step that files a parent goes on as an epic run* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number or an epic's number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

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

### Requirement: Placeholders in lets-go render as written
Every placeholder in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`, a name in angle brackets such as `<i>`, SHALL sit inside a fenced code block or an inline code span. A placeholder that follows `#`, such as `#<i>`, SHALL have the `#` inside the same code span. So GitHub shows each placeholder as written: it SHALL not read `<i>` or `<p>` as an HTML tag, drop the placeholder, or set the text after it in italics.

#### Scenario: No placeholder outside code
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`, and removes every fenced code block and every inline code span
- **THEN** no text in angle brackets that starts with a letter is left

#### Scenario: A fence inside a longer fence
- **WHEN** a file of `lets-go` holds a fence of four backticks that holds fences of three
- **THEN** the whole outer fence is code, the text after the inner fences close included, up to the four-backtick line that closes it, so a placeholder there renders as written

#### Scenario: A stop that names the issue
- **WHEN** `lets-go` says to run `lets-shape` on the issue
- **THEN** the skill writes the line as ``Say to run the `lets-shape` skill on `#<i>`, and stop.``

#### Scenario: A placeholder outside code in a reference file
- **WHEN** an edit makes `skills/lets-go/references/records.md` hold `pull request #<pr>` outside a code span
- **THEN** the edit breaks this requirement, because Markdown would hide `<pr>`

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these seven files, and no other. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the three parts. *Start from an idea*, *Run the shape step* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the two shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** the reader finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`; no file of `lets-go` has a heading *What shape runs*

#### Scenario: A part whose steps moved
- **WHEN** a reader reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** a reader reads the *Run the epic* section of `SKILL.md`
- **THEN** it links `references/epic-run.md#run-the-epic`, its last paragraph starts `Next:`, `references/epic-run.md` has a heading `Run the epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run

#### Scenario: The prompt frame is one block to copy
- **WHEN** a reader looks for a step's prompt frame in `lets-go`
- **THEN** no file of `lets-go` holds it: `skills/lets-go/references/` has no `step-prompt.md`, no file has a heading *Write the prompt*, and *Run a step* sends the one block that `lets go step-prompt` prints to `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a heading `Records that disagree`
- **THEN** the edit breaks this requirement, because that section belongs in `references/records.md`

#### Scenario: The child's part is in its file
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings

### Requirement: lets-go links each section it names
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a file by a link to its heading, every time, in prose and in table cells, the overview's *Next* column included. A link to a section of another `lets-go` file, or of another skill, SHALL use a path relative to the linking file, as *Every link inside lets-go names one of its headings* says. A section of another skill that a published flow does not install, such as *Check an earlier review* in `lets-review-plan`, which the `minimal` flow leaves out, SHALL stay in italics, so that every link resolves in both flows. A heading inside a step's prompt or a story prompt, which is not a heading of the file, SHALL be written as it is typed, in a code span, such as `## Stack`. `references/terms.md` is exempt: it copies `openspec/glossary.md` word for word, and the glossary names sections such as *Route* and *Claim* in italics.

#### Scenario: Every section reference is a link
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`, outside code
- **THEN** the reader finds no italic text that equals a heading of those files, such as `*Claim*` or `*Check the issue*`

#### Scenario: An italic section name comes back
- **WHEN** an edit makes `skills/lets-go/SKILL.md`, which has a heading `## Route`, say `otherwise *Route*`
- **THEN** the edit breaks this requirement, because it names a section in italics and not by a link

#### Scenario: A section of another skill
- **WHEN** a reader reads *End of the run* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds a link to `../lets-review-build/SKILL.md#finish-the-change`

#### Scenario: A section the minimal flow does not install
- **WHEN** a reader reads the review plan row of *Walk the step table*
- **THEN** the reader finds `*Check an earlier review*` in italics and the `lets-review-plan` skill named, and no link to `../lets-review-plan/`

#### Scenario: A heading of the prompt frame
- **WHEN** a reader reads `references/story-run.md`
- **THEN** the reader finds `` `## Stack` `` and no `*Stack*`

#### Scenario: The glossary's copy keeps its italics
- **WHEN** a reader reads `references/terms.md`, which says `such as *Route* or *Walk the step table*`
- **THEN** those italics break no rule, because this requirement exempts `terms.md`, and `terms.md` still matches `openspec/glossary.md`

#### Scenario: Italics that name no section
- **WHEN** `skills/lets-go/SKILL.md` has no heading `Resume mode`, and holds the text `*Resume mode*` inside a fenced code block
- **THEN** the file meets this requirement, because text in code names no section

### Requirement: A stacked story's pull request targets its blocker's branch
When `lets-go` writes the prompt for a step of a stacked story, it SHALL pass `--blocker <blocker> --blocker-branch <blocker-branch> --blocker-pr <blocker-pr>` to `lets go step-prompt`, so that the prompt holds the `## Stack` section that *A stacked story's prompt holds a Stack section* in the `go-step-prompt` capability describes. It SHALL pass them for every step of the story, so that a step resumed after `needs-input` still sees them. A story is stacked when *Stack the story* or *Take up a started story* returned `stacked` for it, or, in a story run's child, when the story prompt holds a `## Stack` section, whose blocker, branch and pull request the child passes on. For a story that is not stacked, `lets-go` SHALL pass none of the three flags. The brainstorm instruction of the `lets-standard` and `lets-minimal` schemas SHALL say to follow the prompt's `## Stack` section, when it has one, where it opens the draft pull request.

#### Scenario: The plan step of a stacked story
- **WHEN** an epic run writes the prompt for the plan step of #280, stacked on #279, whose pull request #290 is from `epic-run-skeleton`
- **THEN** it runs `lets go step-prompt --for plan` with `--blocker 279 --blocker-branch epic-run-skeleton --blocker-pr 290`, and the prompt's `## Stack` section holds `--base epic-run-skeleton` and `Stacked on #290; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** an epic run writes the prompt for a step of #279, which has no open blocker
- **THEN** its `lets go step-prompt` command carries no `--blocker`, and the prompt holds no `## Stack` section

#### Scenario: A stacked story in a child
- **WHEN** a story run's child writes the build prompt, and its story prompt holds a `## Stack` section that names #282, `epic-run-resume` and #293
- **THEN** the child runs `lets go step-prompt --for build` with `--blocker 282 --blocker-branch epic-run-resume --blocker-pr 293`

#### Scenario: The schemas follow the section
- **WHEN** a reader reads the brainstorm instruction of `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`
- **THEN** each says to follow the step prompt's `## Stack` section where it opens the draft pull request

### Requirement: An epic run runs each story in a child session
After *Set the question mode* has set `<mode>` for the story the epic run picked, with the story's branch `<name>` checked out in its worktree `<path>`, `lets-go` SHALL start the story's run in a child `lets-go` session, in the background, in this order:

1. Write the story prompt to `.workspace/lets-go/<name>-story-prompt.md` in the epic run's checkout, by running `lets go step-prompt --for story --name <name> --issue <i> --issue-url <issue-url> --parent <parent> --checkout <path> --schema <schema> --route <route line> --questions <mode>` and sending its stdout to that file. The `go-step-prompt` capability says what the story prompt holds. For a stacked story, the command SHALL carry the same `--blocker`, `--blocker-branch` and `--blocker-pr` as the story's step prompts. For a story that is not stacked, it SHALL carry none of them. When the command exits non-zero, the epic run SHALL stop the story's run, with the command's stderr as the story's reason.
2. Remove `.workspace/lets-go/<name>-story-answers.yaml` in the epic run's checkout, and each `.workspace/lets-go/<name>-<step>-rounds.txt` in the worktree, where the child keeps them, so the story run starts with no answers and no counted rounds. Do this only before the story's first child session in this run, never when relaying its questions.
3. Run `lets delegate step instructions --for story`, and rank its `options` as *Run a step* ranks a step's: the guidance first, then the order the options came in. When `options` is empty, pass its own family as the one model.
4. Run `lets delegate step start --for story --name <name>-story --checkout <path> --prompt-file .workspace/lets-go/<name>-story-prompt.md --report-file .workspace/lets-go/<name>-story-report.json --meta-file .workspace/lets-go/<name>-story-meta.txt --effort high`, with one `--model` per ranked option, best first. It returns once the child has started, and the epic run goes on without waiting for it.

While children run, the epic run SHALL print only its own lines: the `Picked` or `Resumed` lines, the `Stacks on` lines, the `Questions` lines, the questions it relays and their answers, and the stories' lines. It SHALL NOT print a child's `Skipped`, `Done` or `Failed` lines.

#### Scenario: The story prompt
- **WHEN** an epic run on #278 has created the worktree `.workspace/lets-go/worktrees/story-run-child-sessions` for #284, on `lets-standard`, at the question mode `auto`, stacked on #282, whose pull request #293 is from `epic-run-resume`
- **THEN** `.workspace/lets-go/story-run-child-sessions-story-prompt.md` starts with `You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.`, names `lets-standard`, the question mode `auto` and the worktree `.workspace/lets-go/worktrees/story-run-child-sessions`, says that the epic run has already claimed #284, routed it and checked the branch out, and holds a `## Stack` section with `--base epic-run-resume` and `Stacked on #293; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** the epic run writes the story prompt for #279, which has no open blocker
- **THEN** its `lets go step-prompt --for story` command carries no `--blocker`, and the story prompt holds no `## Stack` section

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

## ADDED Requirements

### Requirement: lets-go writes each step's prompt with lets go step-prompt
Before it runs a step, *Run a step* SHALL create `.workspace/lets-go` when it is missing, run `lets go step-prompt --for <step>` from the repo root with the step's values, and send its stdout to `.workspace/lets-go/<session>-prompt.md`. The `go-step-prompt` capability says what each prompt holds. The values SHALL be the ones the run holds for the step:

- For every step but shape: `--name <name> --issue <i> --issue-url <issue-url> --schema <schema> --route <route line> --questions <mode>`. In a story run's child, `<schema>`, the route line and `<mode>` are the ones the story prompt gives.
- For shape on an issue: `--issue <i> --issue-url <issue-url> --branch <default> --questions <mode>`.
- For shape on an idea: `--idea <idea> --branch <default> --questions <mode>`, and `--searched` only when *Start from an idea* ran its title search and the search or the user found no match.
- For a stacked story, the stack flags that *A stacked story's pull request targets its blocker's branch* names.

When the command exits non-zero, `lets-go` SHALL show the user its stderr, name the step, and stop, and SHALL run no `lets delegate step` command for that step. No file of `skills/lets-go/` SHALL hold a copy of a prompt's text for `lets-go` to fill in.

#### Scenario: The plan prompt
- **WHEN** the walk reaches plan for the change `lets-go-chore`, issue `149`, on `lets-minimal`, at the question mode `auto`
- **THEN** `lets-go` runs `lets go step-prompt --for plan --name lets-go-chore --issue 149` with `--issue-url`, `--schema lets-minimal`, the route line as `--route` and `--questions auto`, sends its stdout to `.workspace/lets-go/lets-go-chore-plan-prompt.md`, and then runs `lets delegate step run --for plan --name lets-go-chore-plan --prompt-file .workspace/lets-go/lets-go-chore-plan-prompt.md`

#### Scenario: The shape prompt for a searched idea
- **WHEN** *Start from an idea* searched the open issue titles for `add a --quiet flag to lets sync` and found no match, on a repository whose default branch is `main`, at `auto`
- **THEN** `lets-go` runs `lets go step-prompt --for shape --idea "add a --quiet flag to lets sync" --branch main --questions auto --searched`, and sends its stdout to `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`

#### Scenario: The shape prompt for an issue
- **WHEN** the shape step runs for `#180` on a repository whose default branch is `main`
- **THEN** its `lets go step-prompt` command carries `--issue 180`, `--branch main` and no `--idea`, `--schema` or `--route`

#### Scenario: The command fails
- **WHEN** `lets go step-prompt` exits 2 because the plain-language reference is not installed
- **THEN** `lets-go` shows the user its stderr, names the step, stops, and runs no `lets delegate step instructions` and no `lets delegate step run` for it

#### Scenario: No prompt frame in the skill
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `lets go step-prompt` in *Run a step* and in *Start the story run*, and no line `The question mode is <mode>. At auto, the lets-go session answers each` and no line `You run a story run of a lets-go epic run: #<i>, for the change <name>, under #<parent>.`

## REMOVED Requirements

### Requirement: The step prompt says what to run, the question mode, and how to report
**Reason**: `lets go step-prompt` now prints each step's prompt, so what the prompt holds is the command's behavior, not the skill's. `lets-go` no longer writes the prompt's text.
**Migration**: The `go-step-prompt` capability carries each rule: the header lines and the `## What to run` sentence for each step, the shape prompt's two forms, the question mode and the `## Answers` rules, the confirmation with no recommendation, and the report rules. *lets-go writes each step's prompt with lets go step-prompt* says how `lets-go` gets the prompt.
