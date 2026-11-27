## MODIFIED Requirements

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder that more than one section of the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. A section is the text under one heading of any level, up to the next heading, and a line inside a code fence is never a heading; the `## Placeholders` section itself does not count as a use. A placeholder that only one section uses SHALL have no row. That section SHALL say what the placeholder stands for, at or before its first use there. Six placeholders that one section uses SHALL keep their rows: `<word>`, `<kebab-name>`, `<one-line outcome>`, `<skill>`, `<plain-language-path>` and `<the sentence above>`. Each placeholder SHALL have at most one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

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
- **WHEN** a reader lists each distinct text in angle brackets that starts with a letter, outside `## Placeholders`, in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`, and keeps those that two or more sections use
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders` in `SKILL.md`

#### Scenario: A placeholder one section uses
- **WHEN** a reader looks for `<wave>`, which only *Run the epic* in `skills/lets-go/references/epic-run.md` uses
- **THEN** the table under `## Placeholders` has no row for it, and *Run the epic* says that `<wave>` is a wave's number, counted from 1, before the line that holds it

#### Scenario: The rows that one section's placeholders keep
- **WHEN** a reader lists the rows of the table under `## Placeholders` whose placeholder only one section uses
- **THEN** the rows are those of `<word>`, `<kebab-name>`, `<one-line outcome>`, `<skill>`, `<plain-language-path>` and `<the sentence above>`, and no other

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to *Claim* in `SKILL.md` and to *Stack the story* in `skills/lets-go/references/epic-run.md`, and adds no row for it
- **THEN** the edit breaks this requirement, because two sections use `<base>` and it has no row under `## Placeholders`

#### Scenario: A placeholder with no row, in a reference file
- **WHEN** an edit adds `<base>` to *Stack the story* in `skills/lets-go/references/epic-run.md` only, adds no row for it, and does not say there what it stands for
- **THEN** the edit breaks this requirement, because the one section that uses `<base>` does not explain it

#### Scenario: A one-section placeholder with a row
- **WHEN** an edit adds a row for `<keys>`, which only *Run the epic* uses
- **THEN** the edit breaks this requirement, because `<keys>` is not one of the six that keep their rows

#### Scenario: The old names are gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`
- **THEN** the reader finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

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

 *Start from an idea*, *Run the shape step* and *Run the epic* run only when the request or the packet needs them. *Run the epic* runs only in an epic run. Each part but *Run the epic* SHALL be a `##` heading of `SKILL.md`, in that order. *Run the epic* SHALL be the `## Run the epic` heading of `references/epic-run.md`, and `SKILL.md` SHALL hold no `## Run the epic` heading. `SKILL.md` SHALL hold an overview table right after its opening paragraphs, and before `## Placeholders`. The table SHALL have one row per part, in the same order. Each row SHALL name the part and link to its heading, in whichever file holds it. It SHALL say what the part does, and whether it runs in the `lets-go` session or a fresh one. It SHALL say what comes next, and when the part stops. The skill SHALL hold no `## Start` heading, and SHALL not name *Start* anywhere. Another requirement of this spec may still say *Start*. There it means the parts from *Read the settings* to *Set the question mode*, which run before the walk. *Start*'s blocker read is the blocker read in *Check the issue*.

#### Scenario: The overview lists every part
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds a table before `## Placeholders` whose rows name the eleven parts, each linked to its heading, in run order

#### Scenario: The parts are headings in run order
- **WHEN** a reader lists the `##` headings of `skills/lets-go/SKILL.md`
- **THEN** each of the eleven parts but *Run the epic* is one of them, in the order the overview lists them, none is `## Start` or `## Run the epic`, and no file of `lets-go` says `*Start*`

#### Scenario: The epic part's row links its reference file
- **WHEN** a reader reads the *Run the epic* row of the overview table
- **THEN** its link is `references/epic-run.md#run-the-epic`, and `references/epic-run.md` has the heading `## Run the epic`

#### Scenario: The epic part's stub comes back
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a `## Run the epic` section that only links `references/epic-run.md#run-the-epic`
- **THEN** the edit breaks this requirement, because the part's heading belongs in `references/epic-run.md` only

#### Scenario: A part missing from the overview
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a `## Route` heading and an overview table with no row for *Route*
- **THEN** the edit breaks this requirement, because the overview does not name every part

### Requirement: Each part ends by saying what comes next
Every part but *End of the run* SHALL end its own text with a line that starts `Next:`, in the file that holds the part's heading. A part's own text runs from its heading to the next heading of any level, so the line comes before any subsection of the part. The line SHALL link the part or parts that can follow, and give the condition for each when there is more than one. A procedure that a part runs, such as *Find the source of demand*, *Confirm the packet* or *Claim*, SHALL say that it returns to the part that ran it, and SHALL have no `Next:` line. *End of the run* SHALL say that the run is over.

#### Scenario: Route says what comes next
- **WHEN** a reader reads the *Route* section of `skills/lets-go/SKILL.md`
- **THEN** its last non-empty line starts `Next:` and links `#enter-the-branch`

#### Scenario: A part with a subsection
- **WHEN** a reader reads *Run the epic* in `skills/lets-go/references/epic-run.md`, which has the subsection *Settle a story*
- **THEN** the last non-empty line before `### Settle a story` starts `Next:`, links `../SKILL.md#check-the-issue` with the story the epic run picked, and links `../SKILL.md#end-of-the-run` for when no story is left

#### Scenario: A part without a Next line
- **WHEN** an edit makes the *Set the question mode* section of `skills/lets-go/SKILL.md` end with no `Next:` line
- **THEN** the edit breaks this requirement

#### Scenario: Check the issue goes to shape or to route
- **WHEN** a reader reads *Check the issue*
- **THEN** its `Next:` line links `#run-the-shape-step` and `#route`, each with its condition

### Requirement: Each lets-go procedure returns a result
Each procedure of `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure is a section under `## Procedures` in `SKILL.md`, or one of *Glossary preflight*, *Import the glossary checkpoint*, *Commit the discovery map*, *Find the input's discovery*, *Read a pull request's base*, *Take up a started story* and *Stack the story* in a reference file. *Glossary preflight*, which only *Claim* runs, SHALL return to *Claim*. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results in one closing list, after its steps. Each result in the list is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. Within the procedure, the closing list SHALL be the only place that says what a result carries. A step of the procedure that returns a result SHALL name the result and the condition that selects it, and SHALL not say what it carries. A procedure that passes on a result of another procedure SHALL name it in its own list and link the list of the procedure that returns it, and SHALL not describe it again. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed`, `branch-failed` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |
| *Commit the map in an epic run* | `committed`, `commit-failed`, `restore-failed` |
| *Read a pull request's base* | `on-story`, `not-stacked`, `edit-failed` |
| *Take up a started story* | `stacked`, `not-stacked`, `settled`, `fetch-failed`, `edit-failed`, `read-failed` |
| *Stack the story* | `stacked`, `settled`, `fetch-failed` |

*Glossary preflight* returns `no-owned-edits` when the story owns no glossary edits, and otherwise passes on what *Check the checkpoint* returns. `verified` carries the checkpoint commits to import. *Claim*'s `claimed` carries what *Glossary preflight* returned, so *Enter the branch* runs *Import the glossary checkpoint* only after `verified`. *Commit the discovery map* ends one way only, so it names no result. Its epic-run form, *Commit the map in an epic run*, can fail after its commit, so it names its results: `committed` when the story's branch holds the maps' edits or no map changed, `commit-failed` with Git's error when the edits are still only in the epic run's checkout, and `restore-failed` with Git's error when the story's commit holds the edits but the checkout could not be restored. *Find the input's discovery* ends one way too: it returns each discovery it found, or none, and names no result.

#### Scenario: Every procedure returns
- **WHEN** a reader reads each procedure of `lets-go`, in `SKILL.md` and in its reference files
- **THEN** each one says it returns to the part that ran it, or, for *Glossary preflight*, to *Claim*, has no `Next:` line, and holds no `stop` or `stops` outside code

#### Scenario: A procedure that stops
- **WHEN** an edit makes *Confirm the packet* say ``Say to run the `lets-shape` skill on `#<i>`, and stop.``
- **THEN** the edit breaks this requirement, because a procedure returns a result and holds no `stop`

#### Scenario: Claim lists its results
- **WHEN** a reader reads *Claim*
- **THEN** the reader finds `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed` and `branch-failed`

#### Scenario: Confirm the packet lists its results
- **WHEN** a reader reads *Confirm the packet*
- **THEN** the reader finds `complete`, `needs-shape` and `epic`

#### Scenario: The epic-run map commit lists its results
- **WHEN** a reader reads *Commit the map in an epic run* and *Enter the branch*
- **THEN** the reader finds `committed`, `commit-failed` and `restore-failed` in each, with an action for each one in *Enter the branch*

#### Scenario: The import lists its results
- **WHEN** a reader reads *Import the glossary checkpoint* in `skills/lets-go/references/glossary-handoff.md`
- **THEN** the reader finds one closing list that holds `imported` and `import-failed`, each with when it is returned and what it carries

#### Scenario: A step names the result it returns
- **WHEN** a reader reads step 3 of *Claim*, where `lets backlog claim` prints `result: taken`
- **THEN** the step says that the result is `taken` and to return it now, and only *Claim*'s closing list says that `taken` carries the names in the `assignees` field

#### Scenario: A step says again what a result carries
- **WHEN** an edit makes step 3 of *Claim* say ``The result is `taken`, with the names in its `assignees` field.``
- **THEN** the edit breaks this requirement, because the closing list already says what `taken` carries

#### Scenario: A passed-on result links its list
- **WHEN** a reader reads the results of *Glossary preflight*, and of *Claim*
- **THEN** *Glossary preflight* describes `no-owned-edits`, and for `verified`, `checkpoint-failed` and `unresolved` links the list of *Check the checkpoint*; *Claim*'s list, for `unresolved` and `checkpoint-failed`, links the list of *Glossary preflight*; neither says again what those results carry

### Requirement: Each part names the action for each result
A part that runs a procedure SHALL name each result the procedure can return there. For each one, it SHALL say what to do: go on, run another part, or tell the user what the result carries and stop. The part SHALL give the action only. It SHALL not say again when the procedure returns the result, or what the result means, since the procedure's closing list says that. Where the action uses something the result carries, the part SHALL name that thing, such as `show the branch's error it carries`. A part SHALL not hold a catch-all such as `any other stop stands`. The overview's *Stops when* column SHALL name the results a part stops on.

#### Scenario: Check the issue acts on the packet's results
- **WHEN** a reader reads *Check the issue*
- **THEN** the reader finds `complete`, `needs-shape` and `epic`, each with its action

#### Scenario: Enter the branch acts on the claim's results
- **WHEN** a reader reads *Enter the branch*
- **THEN** the reader finds `claimed`, `taken`, `unresolved`, `checkpoint-failed` and `branch-failed`, each with its action, and no `branch-exists`

#### Scenario: A part gives the action only
- **WHEN** a reader reads the `branch-failed` action in *Enter the branch*
- **THEN** it says to show the branch's error and any release error that the result carries, and to stop, and it does not say again that *Claim* tried to release the claim

#### Scenario: A part restates a result
- **WHEN** an edit makes the `complete` action in *Check the issue* say that, for a Story with a parent, the result carries the parent's **Shared decisions**
- **THEN** the edit breaks this requirement, because *Confirm the packet*'s closing list already says what `complete` carries

#### Scenario: A claim with owned glossary edits
- **WHEN** *Glossary preflight* returns `verified` with two checkpoint commits, and *Claim* then returns `claimed`
- **THEN** *Enter the branch* runs *Import the glossary checkpoint* with those two commits before it commits the discovery map

#### Scenario: A claim with no owned edits
- **WHEN** *Glossary preflight* returns `no-owned-edits`, and *Claim* returns `claimed`
- **THEN** *Enter the branch* runs no import

#### Scenario: An epic stops the run
- **WHEN** the user runs `lets-go` for `#194`, and *Confirm the packet* returns `epic`
- **THEN** `lets-go` says that an epic is built through its stories, lists its open sub-issues, claims nothing and stops

### Requirement: Each lets-go rule is written once
`lets-go` SHALL write each of these rules in one place. Every other place that uses a rule SHALL link to it or name it, and SHALL not restate it.

- The question mode, in *Set the question mode*.
- The form of each step's `Done`, `Skipped` and `Failed` line, and what fills `<date>` and `<evidence>`, in one section.
- The branch check, in *Check the issue*.
- What a `lets backlog` error does, in *Backlog errors*.
- The prerequisite check, in *Check the prerequisite*.
- The packet check, in *Confirm the packet*.
- When each procedure result is returned and what it carries, in the procedure's closing list, as *Each lets-go procedure returns a result* says.
- What a placeholder that one section uses stands for, in that section, as *Each placeholder in lets-go names one thing* says.
- Each step's done test, and each disagreement but the diverged branch: in none of `lets-go`'s files. `lets go records <name>` applies them, as *go-records* says, and the walk acts on what it prints.

A rule written once MAY run more than once. `next` runs *Check the prerequisite* and *Confirm the packet* on each candidate, and *Check the issue* runs both again for the picked issue. *Claim*'s *Glossary preflight* SHALL run only *Check the checkpoint*, which runs *Check the prerequisite* again only when the owner of the glossary definitions or the proposed base has changed. *Find the source of demand* SHALL not say that it returns to *Claim*, because *Claim* never runs it.

#### Scenario: Each line form is written once
- **WHEN** a reader reads `lets-go`
- **THEN** the reader finds `Done shape: <date>. <evidence>` and `Skipped shape: #<i>'s packet is complete, last edited <date>.` once each

#### Scenario: Each preflight result is described once
- **WHEN** a reader reads `skills/lets-go/references/glossary-handoff.md` and *Claim*
- **THEN** the reader finds what `verified`, `checkpoint-failed` and `unresolved` carry once, in the closing list of *Check the checkpoint*

#### Scenario: No done test is restated
- **WHEN** a reader reads *Walk the step table* and *Read the report*
- **THEN** the reader finds `lets go records <name>` and no ordered list of the tests that say when plan, review plan, build or review build is done

#### Scenario: Claim looks for no branch
- **WHEN** a reader reads *Claim* in `lets-go`
- **THEN** the reader finds no `branch-exists`, and no branch lookup

#### Scenario: The preflight in Claim checks no prerequisite first
- **WHEN** `lets-go` runs *Claim* for #152, whose **Glossary handoff** names #150 as the owner of its definitions, #150's pull request has merged, and neither the owner nor the base has changed since *Check the issue*
- **THEN** *Claim* runs *Check the checkpoint* only when #152 owns the edits, and does not run *Check the prerequisite* again

#### Scenario: No return to Claim
- **WHEN** a reader reads *Find the source of demand*
- **THEN** it does not say `When *Claim* ran it, return to *Claim*`

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The part *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits*, *Recover from a failed import* and *What the import returns* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the two shape parts. *Start from an idea* and *Run the shape step* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the two shape parts, each under a heading with the part's name. *Run the epic* SHALL have no section in `SKILL.md`: `epic-run.md` SHALL hold the whole part under its `## Run the epic` heading, with its `Next:` line, and every link to the part SHALL name `epic-run.md`. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** the reader finds *Records that disagree* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`; no file of `lets-go` has a heading *What shape runs* or *Read the records*

#### Scenario: A part whose steps moved
- **WHEN** a reader reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** a reader reads `SKILL.md` and `references/epic-run.md`
- **THEN** `SKILL.md` has no heading `Run the epic`, each of its links to the part is `references/epic-run.md#run-the-epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run, then holds the heading `## Run the epic`

#### Scenario: The prompt frame is one block to copy
- **WHEN** a reader reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a heading `Records that disagree`
- **THEN** the edit breaks this requirement, because that section belongs in `references/records.md`

#### Scenario: The child's part is in its file
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings

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
- **WHEN** a reader reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it says that an epic has no change's branch to look for, and that *Find the source of demand* does not run for an epic, and its `epic` case links `references/epic-run.md#run-the-epic`
