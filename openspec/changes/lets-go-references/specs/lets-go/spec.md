## ADDED Requirements

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these five files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, the `<shape-name>` and `<slug>` rules of *The change's name*, and *What shape runs* |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |

`SKILL.md` SHALL hold no heading of a section in this table, except the three parts. *Start from an idea*, *Run the shape step* and *Pick the first ready story* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in `shape.md`, and its `Next:` line. `shape.md` SHALL hold each part's steps under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** it finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *What shape runs* and *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`

#### Scenario: A part whose steps moved
- **WHEN** the skill-interfaces test reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The prompt frame is one block to copy
- **WHEN** the skill-interfaces test reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a heading `Records that disagree`
- **THEN** the check fails, and its output names `Records that disagree`

### Requirement: lets-go reads the glossary file only for a story with a glossary handoff
`SKILL.md` SHALL say to read `references/glossary-handoff.md` only when the issue's body has a **Glossary handoff** section. Where *Find the source of demand* runs *Check the prerequisite*, and where *Claim* runs *Glossary preflight*, `SKILL.md` SHALL say what each returns for an issue with no such section: `resolved` and `no-owned-edits`, without reading the file. These are the results the moved text already gives for a story with no glossary handoff.

#### Scenario: An issue with no glossary handoff
- **WHEN** the skill-interfaces test reads *Find the source of demand* and *Claim* in `SKILL.md`
- **THEN** each names **Glossary handoff** and links `references/glossary-handoff.md`, *Find the source of demand* names `resolved`, and *Claim* names `no-owned-edits`

## MODIFIED Requirements

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session. It SHALL follow the saved prompt, work only in this repository, on the branch `<name>` or, for shape, on the default branch, and make only the changes that the step calls for. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<session>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: What the subagent may change
- **WHEN** the skill-interfaces test reads *Run a step in a subagent*
- **THEN** it says that the subagent follows the saved prompt, works only in this repository on the branch `<name>`, and makes only the changes that the step calls for, and it does not say `may write files`

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. Some checks test reading order or a relative link. They SHALL read `SKILL.md` alone. These are the checks of the *Walk the step table* section, of the order of the overview and the parts, of the place of the `## Placeholders` section, and of each part's `Next:` line. So are the rule that `lets go level` comes before the first GitHub call, and the links to other skills' reference files. A check of a part's section SHALL read the part's `##` section in `SKILL.md`, then the section with the same name in a reference file, when one has it, so a check of a part's steps follows the steps into `references/shape.md`. A check of a procedure SHALL read the procedure's section in `SKILL.md` or in a reference file, at any heading level. The check that each link names a heading reads each file against its own headings, and each link to another file against that file's headings.

#### Scenario: A fixed line that wraps in a reference file
- **WHEN** a skills folder holds `lets-go/SKILL.md` without `Records disagree:`, and `lets-go/references/records.md` holds `Records` at the end of one line and `disagree:` at the start of the next
- **THEN** the check that `lets-go` says `Records disagree:` passes

#### Scenario: A missing fixed line
- **WHEN** neither `SKILL.md` nor any reference file of `lets-go` holds `Records disagree:`
- **THEN** the check fails, and its output names `Records disagree:`

#### Scenario: A banned phrase in a reference file
- **WHEN** `SKILL.md` does not hold `VERDICT:`, and `lets-go/references/records.md` does
- **THEN** the check that `lets-go` does not say `VERDICT:` fails, and its output names `VERDICT:`

#### Scenario: The lost race
- **WHEN** the skill-interfaces test checks what `lets-go` does after another session claims the issue `next` picked
- **THEN** it checks for `leave out every issue lost in this run`, and does not check for a step number

#### Scenario: A part's steps in a reference file
- **WHEN** a skills folder holds `lets-go/SKILL.md` with `## Run the shape step` and a `Next:` line, and `lets-go/references/shape.md` holds `## Run the shape step` followed by `Check the discovery map.`
- **THEN** the section of *Run the shape step* holds both the `Next:` line and `Check the discovery map.`

#### Scenario: A procedure in a reference file
- **WHEN** a skills folder holds `lets-go/references/glossary-handoff.md` with `## Glossary preflight` followed by `Say so, and stop.`
- **THEN** the check that each procedure holds no `stop` fails, and its output names `Glossary preflight`

### Requirement: Every link inside lets-go names one of its headings
This holds for `skills/lets-go/SKILL.md` and for each file in `skills/lets-go/references/`. A link to a place in the same file is written `](#<anchor>)`. Outside code, each such link SHALL match the anchor GitHub makes from one of that file's own headings. GitHub makes it from the heading's text: in lower case, with each space made a hyphen. It drops every character other than a letter, a digit, a hyphen or an underscore. A link to another file is written with a path relative to the linking file, such as `](references/records.md#records-that-disagree)` or `](../SKILL.md#walk-the-step-table)`. Outside code, the path SHALL name a file that exists, and an anchor after it SHALL match one of that file's headings. A link that leaves the skills folder, or that starts with a URL scheme such as `https:`, is not checked here. The skill-interfaces check SHALL fail on a link that matches no file or no heading, and SHALL name the linking file and the link. It SHALL run on the source skills, and on `lets-go` as the release build installs it in each published flow, `standard` and `minimal`.

#### Scenario: Every link resolves
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** every `](#...)` link outside code matches one of its headings, such as `#enter-the-branch` for `## Enter the branch` and `#the-changes-name` for `### The change's name`

#### Scenario: A link to a heading that is gone
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a link `[Start](#start)` and no heading `Start`
- **THEN** the check fails, and its output names `SKILL.md` and `#start`

#### Scenario: A link in a reference file
- **WHEN** `lets-go/references/glossary-preflight.md` links `[Check the prerequisite](#check-the-prerequisite)` and has a heading `## Check the prerequisite`
- **THEN** the check passes for that file

#### Scenario: A link to a heading in another file
- **WHEN** a skills folder holds `lets-go/SKILL.md` linking `[records disagree](references/records.md#records-that-disagree)`, and `lets-go/references/records.md` has a heading `## Records that disagree`
- **THEN** the check passes

#### Scenario: A link to a missing file
- **WHEN** a skills folder holds `lets-go/SKILL.md` linking `[the frame](references/frame.md)`, and there is no `lets-go/references/frame.md`
- **THEN** the check fails, and its output names `SKILL.md` and `references/frame.md`

#### Scenario: A link to a heading another file does not have
- **WHEN** a skills folder holds `lets-go/references/shape.md` linking `[Check the issue](../SKILL.md#check-the-issue)`, and `lets-go/SKILL.md` has no heading `Check the issue`
- **THEN** the check fails, and its output names `references/shape.md` and `../SKILL.md#check-the-issue`

#### Scenario: The links in both published flows
- **WHEN** the release build installs the `standard` flow and the `minimal` flow
- **THEN** every link in each installed file of `lets-go` resolves to a file and a heading inside the installed skills

### Requirement: Each lets-go procedure returns a result
Each procedure of `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure is a section under `## Procedures` in `SKILL.md`, or one of *Glossary preflight*, *Import the glossary checkpoint* and *Commit the discovery map* in a reference file. *Glossary preflight*, which only *Claim* runs, SHALL return to *Claim*. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results. Each result is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `taken`, `unresolved`, `checkpoint-failed`, `branch-failed` |
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
