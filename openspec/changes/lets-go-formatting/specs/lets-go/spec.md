## ADDED Requirements

### Requirement: lets-go wraps its prose at 72 columns
No line of `skills/lets-go/SKILL.md` or of a file in `skills/lets-go/references/` SHALL be longer than 72 columns, outside these exceptions. A column is one character (one Unicode code point), not one byte.

- the frontmatter, between the opening and closing `---`;
- a table row, a line whose first character other than a space is `|`;
- a line inside a fenced code block, the fence lines included;
- a line that holds one link and nothing else but leading spaces, a list marker such as `-` or `1.`, and one closing `.`, `,`, `;` or `:`;
- every line of `references/terms.md`, which copies `openspec/glossary.md` word for word.

The skill-interfaces check SHALL fail on any other line longer than 72 columns, and its output SHALL name the file, the line number and the length.

#### Scenario: The source wraps
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds no line longer than 72 columns outside the exceptions

#### Scenario: A prose line too long
- **WHEN** a skills folder holds `lets-go/references/shape.md` whose line 4 is 73 characters of prose
- **THEN** the check fails, and its output names `references/shape.md`, line `4` and the length `73`

#### Scenario: A table row, a command and a lone link
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a 120-column table row, a 120-column line inside a ```` ```bash ```` block, and a line longer than 72 columns that holds only `   [Import the glossary checkpoint](references/glossary-handoff.md#import-the-glossary-checkpoint).`
- **THEN** the check passes

#### Scenario: Wide characters count once
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a prose line of 70 characters, five of them `ログを直す`
- **THEN** the check passes

#### Scenario: The exit-3 sentence wraps
- **WHEN** the skill-interfaces test reads *Run a step* in `skills/lets-go/SKILL.md`
- **THEN** `**3**: no fresh session can run here, for example because no resolver started one` spans more than one line, and the exit-3 check still passes

### Requirement: lets-go links each section it names
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a file by a link to its heading, every time, in prose and in table cells, the overview's *Next* column included. A link to a section of another `lets-go` file, or of another skill, SHALL use a path relative to the linking file, as *Every link inside lets-go names one of its headings* says. A section of another skill that a published flow does not install, such as *Check an earlier review* in `lets-review-plan`, which the `minimal` flow leaves out, SHALL stay in italics, so that every link resolves in both flows. A heading inside the step prompt frame, which is not a heading of the file, SHALL be written as it is typed, in a code span, such as `## What to run`. `references/terms.md` is exempt: it copies `openspec/glossary.md` word for word, and the glossary names sections such as *Route* and *Claim* in italics.

Outside fenced code blocks, inline code spans and `references/terms.md`, the skill-interfaces check SHALL fail on italic text, `*...*`, that equals the text of a heading outside code in a `lets-go` file, or of a heading that a `lets-go` link points to in another skill. Its output SHALL name the file, the line number and the text.

#### Scenario: Every section reference is a link
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`, outside code
- **THEN** it finds no italic text that equals a heading of those files, such as `*Claim*` or `*Check the issue*`

#### Scenario: An italic section name comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a heading `## Route` and, on line 12, the text `otherwise *Route*`
- **THEN** the check fails, and its output names `SKILL.md`, line `12` and `Route`

#### Scenario: A section of another skill
- **WHEN** the skill-interfaces test reads *End of the run* in `skills/lets-go/SKILL.md`
- **THEN** it finds a link to `../lets-review-build/SKILL.md#finish-the-change`

#### Scenario: A section the minimal flow does not install
- **WHEN** the skill-interfaces test reads the review plan row of *Walk the step table*
- **THEN** it finds `*Check an earlier review*` in italics and the `lets-review-plan` skill named, and no link to `../lets-review-plan/`

#### Scenario: A heading of the prompt frame
- **WHEN** the skill-interfaces test reads *Write the prompt* in `references/step-prompt.md`
- **THEN** it finds `` `## What to run` `` and no `*What to run*`

#### Scenario: The glossary's copy keeps its italics
- **WHEN** the skill-interfaces test reads `references/terms.md`, which says `such as *Route* or *Walk the step table*`
- **THEN** the check passes, and `terms.md` still matches `openspec/glossary.md`

#### Scenario: Italics that name no section
- **WHEN** a skills folder holds `lets-go/SKILL.md` with no heading `Resume mode`, and the text `*Resume mode*` inside a fenced code block
- **THEN** the check passes

### Requirement: lets-go names a pull request section in bold
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a pull request's body in bold, such as **Code review** and **Plan review**. A heading the agent searches for, such as `## Plan review`, and a printed line SHALL stay in code font. The skill-interfaces check SHALL fail on an inline code span that holds only `Code review` or `Plan review`, and its output SHALL name the file and the line number.

#### Scenario: The sections are bold
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds `**Code review**` in *Walk the step table* and in *Records that disagree*, and no code span that holds only `Code review` or `Plan review`

#### Scenario: A section name in code font comes back
- **WHEN** a skills folder holds `lets-go/references/records.md` whose line 30 says ``has no `Code review` section``
- **THEN** the check fails, and its output names `references/records.md` and line `30`

#### Scenario: A heading to search for
- **WHEN** `references/records.md` says ``Find the `## Plan review` heading``
- **THEN** the check passes

### Requirement: lets-go names a step in plain words in prose
In prose, `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a step as *The step table* says: shape, plan, review plan, build or review build, in plain words. Code font SHALL stay for a `--for` value, a file name, a config key and the step table's *Step* column.

#### Scenario: The steps named in code font are plain
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** none of them says ``Run the `shape` step``, ``When `review-build` reports`` or ``after `shape`, go on``

#### Scenario: The `--for` names stay in code font
- **WHEN** the skill-interfaces test reads *The step table*
- **THEN** it still says that `--for` uses `shape`, `plan`, `review-plan`, `build` and `review-build`

### Requirement: lets-go gives a whole printed line in a text block
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL give each whole line the run prints in a fenced `text` block. A part of a line, such as the `Records disagree:` prefix, a line named in passing, and a line in a table cell, such as a Skip line in *The step table*, SHALL be an inline code span.

#### Scenario: The Picked line of next
- **WHEN** the skill-interfaces test reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** `Picked #<i>: <title>, the next ready issue.` is a line of a `text` block, as `Picked #<i>: <title>, the first ready story under #<parent>.` is in `references/shape.md`

#### Scenario: The Failed examples
- **WHEN** the skill-interfaces test reads *The step lines*
- **THEN** `Failed review build: <reason>` and `Failed shape: <reason>` are lines of a `text` block
