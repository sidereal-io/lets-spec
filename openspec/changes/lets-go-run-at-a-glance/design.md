## Context

`skills/lets-go/SKILL.md` is 1,176 lines. `## Start` holds ten numbered steps and, under it as `###` sections, every procedure the steps call: *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim*, *Import the glossary checkpoint*, *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Commit the discovery map*. The walk starts after all of them. About 33 references point at a step by number, in four schemes: *Start*'s, *Claim*'s, *Run the shape step*'s and *Run a step*'s, plus two of `lets-shape`'s inside the shape prompt.

The tests constrain the move:

- `start_step <n>` in `tests/skill-interfaces.bats` reads *Start*'s numbered items. Only the blocker-order test uses it, with `start_step 3`.
- Three `skill_says` phrases name *Start*'s steps: `*Start* step 3 has read its blockers already`, `go back to the step of *Start* that ran it` and `When *Pick the first ready story* or *Claim* ran it, go back to that step`. The blocker-order test also checks that step 3 ends with `go on to step 4.`
- `walk_section` reads from `## Walk the step table` to the next `## ` heading. Its `###` subsections stay inside it.
- `skill_section <skill> <name>` reads a heading's text up to the next heading of any level.
- `placeholder_rows` reads `## Placeholders` in `SKILL.md`, and `lists_start_at_one` needs every list after a heading to start at `1.`.
- The `lets go level` check needs the first `lets go level` line before the first line that holds `` `gh ``.
- `prose_placeholders` already strips fenced code and inline code spans from a file.

GitHub builds a heading's anchor from its text, not its level. So moving a section from `###` to `##` keeps every link to it.

## Goals / Non-Goals

**Goals:**

- A reader can see the whole run, and where a run starts, in the first screen after the opening paragraphs.
- Each part reads top to bottom, and its last line says where to go next.
- No reference depends on a number that an added step would shift.

**Non-Goals:**

- Changing what a part does. Each part keeps today's commands and stops, in today's order, apart from B7 and the Project query.
- Rewording the stops that callers override (#201), merging duplicated rules (#202), or moving text into `references/` (#203).
- Renaming *Find the source of demand* or other procedures (#204).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads `skills/lets-go/SKILL.md` and runs fixture skills folders through `fixture_file`. Every new check gets one passing run on the real skill and one failing fixture that names what broke.
- **Existing seams reused:** `skill_section`, `skill_says`, `skill_does_not_say`, `skill_rows`, `walk_section`, `lists_start_at_one`, `fixture_file`, and the code-stripping loop of `prose_placeholders`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One file is rewritten end to end, and an agent follows it literally. A dropped sentence changes a run without any test failing, because most behaviour is pinned by phrase, not by run.
- **Blast radius:** `skills/lets-go/SKILL.md`, as both published flows ship it; `tests/skill-interfaces.bats`. No code under `lets/`, no other skill, no schema.

## Decisions

### D-1. The layout of `SKILL.md`

```text
# Let's go                      opening paragraphs, no "part way"
## The run at a glance          overview table
## Placeholders
## Read the settings            was Start step 1
## Read the request             was Start step 2, now the entry table
## Start from an idea
## Check the issue              was Start steps 3–5
## Run the shape step
## Pick the first ready story   ends with the note on an uncommitted map
## Route                        was ### Route, plus Start step 6
## Enter the branch             was Start steps 7–9
## Set the level                was Start step 10
## Walk the step table
### Records that disagree
## End of the run
## Procedures                   one paragraph: each returns to the part that ran it
### Find the source of demand
### Confirm the packet
### Glossary preflight          #### Check the prerequisite, #### Check the checkpoint
### Claim
### Import the glossary checkpoint   #### Import the commits, #### Recover from a failed import
### Commit the discovery map
## The step table               four rows
### Read the records
### The change's name
## Write the prompt
### What shape runs
## Run a step
### Run a step in a subagent
## Read the report
## Relay the questions
```

The parts come first, in run order, so the run reads straight through. The procedures follow under one `## Procedures` heading. Alternatives: keep each procedure beside the part that calls it, or put the procedures first. Beside the caller fails because *Find the source of demand* has four callers. Procedures first puts 300 lines between the overview and the first part, which is the defect C2 names.

*Route* becomes the part itself: its table is the part's body, and the route line is kept for the plan step as *Start* step 6 said. *Run the shape step*, *Start from an idea* and *Pick the first ready story* become parts because each one ends by sending the run somewhere. *Commit the discovery map* stays a procedure that *Enter the branch* runs.

### D-2. The overview table

Columns: *Part*, *What it does*, *Runs in*, *Next*, *Stops when*. *Runs in* is `this session` for every part, except *Run the shape step* and *Walk the step table*, which say `this session; its step runs in a fresh one`. Each *Part* cell links to the part's heading. *Next* names parts, never numbers. The table sits right after the opening paragraphs, so the spec's order check and the placeholders' position both hold: overview, then `## Placeholders`, then the first part. The opening paragraphs say "A run can stop before it finishes" in place of "A run can stop part way".

### D-3. The entry table

*Read the request* first takes a leading or trailing `ask` or `recommend` off the request, as now. It then holds a 2 × 3 table: rows *The default branch* and *Another branch*, columns *A number*, *An idea*, *Nothing*. Each cell gives the result in a few words and a link. The commands it needs stay as prose under the table: the `next` case of *Find the source of demand*, and the title search with `gh issue list --state open --search "<branch> in:title" --json number,title`. The search runs once, for both cells that need it.

### D-4. `Next:` lines

Every part but *End of the run* ends its own text with one line: `Next: [Route](#route).` When a part can branch: `Next: [Run the shape step](#run-the-shape-step) when the packet sent the run to shape; otherwise [Route](#route).` The line ends the part's own text, before any `###` subsection. `skill_section` stops at the next heading of any level, so it reads that text alone, and the `Next:` line is its last line. `walk_section` and `part_section` read on through the subsections, so they are not used for this check. *End of the run* ends with "The run is over." A procedure ends with "Return to the part that ran it." *Claim* and the checkpoint keep their own stop rules (#201 changes those).

### D-5. References that replace step numbers

Each reference is rewritten to the part or section that holds the rule, with a link:

| Today | After |
|---|---|
| `*Start* step 1`, `step 2`, `step 9`, `step 10` (placeholders table) | [Read the settings], [Read the request], [Enter the branch], [Set the level] |
| `*Start* step 3`, "the blocker read" | [Check the issue], "its blocker read" |
| `as step 7 does`, `When step 3 has looked already` | `as [Enter the branch](#enter-the-branch) does`, `When *Check the issue* has looked already` |
| `step 2 of [Run the shape step]` | `[Run the shape step](#run-the-shape-step), before shape` |
| `Step 3 of [Run a step]` | `[Run a step](#run-a-step), when it ranks the options` |
| `*Claim* step 2`, `*Claim* step 3` | `*Claim*'s branch check`, `before *Claim* assigns the issue` |
| `step 1 of *Start from an idea*` | `the query in *Start from an idea*` |
| `*Start* step 5` (in *Pick the first ready story* and *Read the records*) | `*Check the issue*` |
| shape prompt: `step 1`, `step 7` | `**Find or create the issue**`, `**Confirm, then write**` |
| `go back to the step of *Start* that ran it` | `return to the part that ran it` |

*Start* goes too, with or without a step number. Each of the ten other places that say *Start* names the part it means. For example, *Read the report* says to go on as *Run the shape step* says after a `done` shape report, not to "go back to *Start*". *Write the prompt* says `<schema>`, `<level>` and `<route line>` are the ones *Enter the branch*, *Set the level* and *Route* set. A `skill_does_not_say lets-go '*Start*'` check keeps it gone. *Start from an idea* does not match it.

The three `skill_says` phrases in the tests change with it. The new phrases are `*Check the issue* has read its blockers already`, `return to the part that ran it` and `When *Claim* ran it, return to *Claim*`.

### D-6. Shape and the step table

The `shape` row leaves the step table. Its *Done when* goes to *Check the issue*, which already prints shape's line. Its skill goes to *Run the shape step*, which already says what shape runs. The table's intro says there are five steps, of which the walk runs four. *Write the prompt* takes `<skill>` from the step table for those four, and from *What shape runs* for shape, as now. The walk loses its shape bullet, and the note in *Walk the step table* that shape's line is printed already moves to a sentence before the walk's first row. *End of the run* still shows the shape line first: the run prints it before the walk. `step_row` does not change. `steps_in_one_table` today checks only the four other rows and ignores a `shape` row. It gains one rule: a row for `shape` adds `shape has a row` to its failures. A fixture with a `shape` row tests it.

### D-7. *Read the report*, B7

The failed-shape bullet moves above the general `failed` bullet. The general bullet runs `gh pr view <name> --json url --jq .url` again, because the failed step may have opened the pull request. It prints the URL when the command finds one. Otherwise it says the branch has no pull request yet. *End of the run* already says a failed shape has no URL, and gains the same rule for a step that failed before any pull request existed.

### D-8. The Project query once per run

*Find the source of demand* opens with: "Run this query only when `<project>` is not set yet in this run. When an earlier pass set `<project>`, `<owner>` and `<repo>`, use them." The query and its three outcomes stay where they are. Moving the query into *Read the settings* was the alternative. It would run on the right occasions, but it would also move a command out of a section the spec lists as holding it, which is #202's ground.

### D-9. New tests and helpers

- `part_section <name>`: the `##` section of that name in `SKILL.md`, up to the next `## `, on one line, like `walk_section`. It replaces `start_step`. The blocker-order test reads `part_section 'Check the issue'`.
- `prose_text <file>`: the code-stripping loop of `prose_placeholders`, split out to print `<line>: <prose>` for each line. `prose_placeholders` then greps its output for placeholders, so its existing tests keep passing.
- `step_numbers <skill>`: runs `prose_text` on each of the skill's files and prints `<file>:<line>: <match>` for each match of `[Ss]teps? [0-9]+`.
- `parts_listed`: the overview table's links before `## Placeholders`, checked against the `##` part headings in order.
- `parts_say_next`: for each part but *End of the run*, the last non-empty line of its own text starts `Next:`. It reads each part's text up to its first heading of any level, as `skill_section` does, not up to the next `## `, so a part with a `###` subsection, such as *Walk the step table*, still passes.
- The entry table check reads `part_section 'Read the request'` for its two rows and three columns.
- `anchors_resolve <skill>`: for each file `skill_files` lists, every `](#<anchor>)` in it, outside code, matches the GitHub anchor of one of that file's own headings: lower case, spaces to hyphens, punctuation other than hyphens dropped. So it keeps working when #203 moves sections into `references/`.

Each helper gets a failing fixture that names what broke, as the spec's scenarios say.

## Risks / Trade-offs

- [The rewrite drops or changes a sentence that no test pins] → Build the new file by moving blocks, not retyping them. Before the last commit, diff the old and new files by sentence (`tr` to one sentence per line, then `sort | comm`), and account for every sentence that changed.
- [A link points at a heading that no longer exists] → The anchors stay because heading text stays. A new check, `anchors_resolve`, fails on any `](#...)` link in a `lets-go` file that matches no heading of that file, and names it.
- [The step-number ban hits a legitimate number] → The ban is on prose only. Phases (`Phase 5`) and list items are not matched.
- [Stories #201 to #206 branch off this one and rewrite the same text] → This story moves text and rewords references only. Later stories start from the new layout.

## Migration & Rollback

N/A. The skill reaches projects at the next release through `lets sync`. A revert of the change's commits restores the old layout.
