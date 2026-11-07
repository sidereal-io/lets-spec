## ADDED Requirements

### Requirement: lets-go carries the glossary's entries for its own terms
`skills/lets-go/references/terms.md` SHALL hold the entries of `openspec/glossary.md` for *Part*, *Procedure*, *Step*, *Step report*, *Interactivity level* and *Packet*. Each entry SHALL be a `##` heading with the term, as in the glossary, and its text SHALL be the glossary entry's text, word for word. The file SHALL hold no other entry. An installed skill cannot link `openspec/glossary.md`: in a project that installs `lets-go`, that path is the project's own glossary. So this file is how the definitions travel with the skill. The skill-interfaces check SHALL fail when an entry's text differs from the glossary's, or when an entry is missing from either file, and SHALL name the term.

#### Scenario: The copy matches the glossary
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/terms.md` and `openspec/glossary.md`
- **THEN** each of the six terms has a `##` heading in both files, the text under each heading is the same once whitespace is collapsed, and the check passes

#### Scenario: The glossary changes and the copy does not
- **WHEN** a fixture glossary's *Procedure* entry says `run by a part` and the fixture `terms.md` says `run by a part or another procedure`
- **THEN** the check fails, and its output names `Procedure`

#### Scenario: A term missing from the copy
- **WHEN** the fixture `terms.md` has no `## Step report` heading
- **THEN** the check fails, and its output names `Step report`

### Requirement: lets-go links each glossary term at its first use
In `skills/lets-go/SKILL.md`, the first mention of each of *Packet*, *Step*, *Step report* and *Interactivity level*, in any case and outside the frontmatter and code, SHALL sit in a link to that term's heading in `references/terms.md`, such as `[step report](references/terms.md#step-report)`. A mention of *Step report* SHALL not count as a mention of *Step*. The skill SHALL not repeat a definition that `terms.md` holds.

#### Scenario: Each term links at its first mention
- **WHEN** the skill-interfaces test finds, in `SKILL.md` outside the frontmatter and code, the first line that mentions each of `packet`, `step`, `step report` and `interactivity level`
- **THEN** that line holds a link to `references/terms.md#packet`, `#step`, `#step-report` or `#interactivity-level`, as the term is

#### Scenario: A term used before its link
- **WHEN** a fixture `SKILL.md` says `the issue's packet` on one line, and links `[packet](references/terms.md#packet)` on a later line
- **THEN** the check fails, and its output names `packet`

### Requirement: lets-go explains each of its own terms where it first appears
`lets-go` SHALL explain each term below, in the section where it first appears, in the same sentence or the one before it. The explanation SHALL say what the term is, not only where it is used.

| Term | Where | What the explanation says |
|---|---|---|
| *Find the source of demand* and `next` | The paragraph before the overview table in `SKILL.md` | *Find the source of demand* finds the run's issue: the one the user named, the one an idea's words describe, or `next`. `next` is the first ready issue on the backlog, as that procedure ranks it. |
| *Procedure* | The same paragraph | A part or another procedure runs it, and it returns a result to what ran it. It links `references/terms.md#procedure`. |
| *read marker* and the unread-comment rule | *Confirm the packet* | A read marker is a comment that `lets-shape` posts when it has read the thread, as the issue-comments reference says. A comment is unread when it was created or edited after both the body's last edit and the newest read marker. The sentence `The watermark is the later of the body's last edit and the newest read marker` stays. |
| *Glossary handoff* | Its first mention in `SKILL.md`, in *Find the source of demand* | The section `lets-shape` writes in a story's issue body when shaping added glossary terms. It records which issue owns the definitions, and where the owner's glossary commits are. |
| *prerequisite* | *Check the prerequisite*, in `references/glossary-handoff.md` | The glossary definitions a story needs that another issue owns. |
| *checkpoint* and *owned paths* | *Check the checkpoint* | The checkpoint is the ordered `docs:` commits that hold shaping's glossary edits. The owned paths are the glossary files those commits may change. |
| *rehearse* | *Check the checkpoint*, at its first use | Try the import first in a throwaway checkout, and keep the real working tree as it is. |
| *holding branch* | *Import the commits* | The branch `lets-shape` makes from the default branch to keep the checkpoint commits until a story's branch imports them. |

The opening paragraphs of `SKILL.md`, before the overview, SHALL say that "you" is the agent that runs the skill, and "the user" is the person who asked for the run. No reference file SHALL say it again.

The `## Procedures` section of `SKILL.md` SHALL say, before its first procedure, that a part or another procedure runs each procedure, and that each returns to what ran it.

#### Scenario: The explanations are in their sections
- **WHEN** the skill-interfaces test reads the paragraph before the overview table, *Confirm the packet*, *Find the source of demand*, *Check the prerequisite*, *Check the checkpoint* and *Import the commits*
- **THEN** each holds its row's explanation, and *Confirm the packet* still holds `The watermark is the later of the body's last edit and the newest read marker`

#### Scenario: Who "you" is
- **WHEN** the skill-interfaces test reads `SKILL.md` up to the overview table
- **THEN** it says `"You" is the agent`, and no file in `skills/lets-go/references/` says it

#### Scenario: A procedure that another runs
- **WHEN** the skill-interfaces test reads `## Procedures` up to its first `###` heading
- **THEN** it says that a part or another procedure runs each procedure

### Requirement: The lets-go description says when to use it in about 50 words
The `description` in the frontmatter of `skills/lets-go/SKILL.md` SHALL start with `Use when`, and SHALL hold at most 60 words. It SHALL name these requests: a story, bug or chore, or an idea in words, built end to end to a pull request ready for review; the next story; the change on the current branch; and `lets-go` run again after a run stopped. It SHALL say that `lets-go` runs each step in a fresh session. It SHALL leave the levels, the shape rules and the resume details to the body.

#### Scenario: The description as it ships
- **WHEN** the skill-interfaces test reads the frontmatter of `skills/lets-go/SKILL.md`
- **THEN** its `description` starts `Use when`, holds at most 60 words, and holds `next story`, `current branch` and `fresh session`

#### Scenario: A description that grew
- **WHEN** a fixture `SKILL.md` has a `description` of 61 words that starts `Use when`
- **THEN** the check fails, and its output names the word count

### Requirement: The resume paragraph says what a run started again does
The paragraph near the top of `SKILL.md` that tells the user to run `lets-go` again after a run stops SHALL say what the new run does in each of these cases:

- **On the change's branch:** it finds the issue from the branch's name, prints a dated line for each step already done, and goes on from the first unfinished step.
- **On the default branch, with the issue number:** it finds the change's branch, here or on `origin`, switches to it, and goes on the same way. It does not claim the issue again.
- **On the default branch, with nothing:** it does not resume. It picks the next ready issue, and a claimed issue is never ready. To resume, give the issue number, or run it on the change's branch.
- **After a failed step:** the run that failed never runs that step again. A new run starts it afresh, in a new session, with the answers given so far. A failed shape step has no branch: the run says to run `lets-shape` on the idea or the issue.
- **After the pull request is merged or closed:** there is nothing to resume, and the run stops.

#### Scenario: Each case is named
- **WHEN** the skill-interfaces test reads `SKILL.md` up to the overview table
- **THEN** it names the change's branch, the default branch with the issue number, the default branch with nothing, a failed step and a merged or closed pull request, each with what the new run does

### Requirement: Enter the branch opens the shape file only after a shape step
*Enter the branch* SHALL link *Commit the discovery map* in `references/shape.md` only for a run in which a shape step ran. For a run with no shape step, it SHALL say that there is no map to commit, so the run reads no part of `references/shape.md`. *Commit the discovery map* keeps its own rule, so a map is committed exactly when *lets-go commits the discovery map on the story's branch* says.

#### Scenario: A claim with no shape step
- **WHEN** the skill-interfaces test reads *Enter the branch*
- **THEN** each link to `references/shape.md#commit-the-discovery-map` sits in a sentence that says a shape step ran in this run

## MODIFIED Requirements

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these six files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, the `<shape-name>` and `<slug>` rules of *The change's name*, and *What shape runs* |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

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
