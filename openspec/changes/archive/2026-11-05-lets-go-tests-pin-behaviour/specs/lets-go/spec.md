## ADDED Requirements

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. The checks that test reading order or a relative link SHALL read `SKILL.md` alone: the steps of *Start*, the *Walk the step table* section, the place of the `## Placeholders` section, the rule that `lets go level` comes before the first GitHub call, and the links to other skills' reference files.

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
- **THEN** it checks for ``run `next` again with the same candidates``, and does not check for a step number of *Start*

### Requirement: A lets-go section may sit in a reference file, at any heading level
The skill-interfaces check that `lets-go` holds a section SHALL pass when a heading whose text is the section's name, at any level from `#` to `######`, is a line of `SKILL.md` or of a file in `skills/lets-go/references/`. It SHALL fail when no such heading exists, and SHALL name the section. This holds for *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim*, *Import the glossary checkpoint*, *Check the prerequisite*, *Check the checkpoint*, *Import the commits* and *Recover from a failed import*.

#### Scenario: A section moved to a reference file
- **WHEN** `lets-go/SKILL.md` has no heading `Check the checkpoint`, and `lets-go/references/glossary-preflight.md` has the line `## Check the checkpoint`
- **THEN** the section check passes for *Check the checkpoint*

#### Scenario: A section at another level
- **WHEN** `SKILL.md` holds `## Route` in place of `### Route`
- **THEN** the section check passes for *Route*

#### Scenario: A missing section
- **WHEN** no file of `lets-go` has a heading `Claim`
- **THEN** the section check fails, and its output names `Claim`

### Requirement: The step table check reads the step rows
The skill-interfaces check that `lets-go` keeps its steps in one table SHALL pass when the rows for `plan`, `review-plan`, `build` and `review-build`, each a line that starts ``| `<step>` |``, appear exactly once each, and all four sit in one table: one run of consecutive lines that start with `|`, in `SKILL.md` or in one file in `skills/lets-go/references/`. A `shape` row SHALL be allowed and not required. The check SHALL not pin the table's header line.

#### Scenario: The table as it stands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, whose step table has a row for each of the five steps
- **THEN** the step table check passes

#### Scenario: A table with no shape row and another header
- **WHEN** the step table's header is `| Step | Skill | Record | Skip line |`, and it has rows for `plan`, `review-plan`, `build` and `review-build` and none for `shape`
- **THEN** the step table check passes

#### Scenario: A step with two rows
- **WHEN** `lets-go`'s files hold two lines that start ``| `build` |``
- **THEN** the step table check fails, and its output names `build`

#### Scenario: Steps split across two tables
- **WHEN** the `plan` and `review-plan` rows sit in one table, and the `build` and `review-build` rows in another
- **THEN** the step table check fails

### Requirement: The exit-3 sentence may wrap
The skill-interfaces check that `lets-review-build`, `lets-review-plan` and `lets-go` each say `**3**: no fresh session can run here, for example because no resolver started one` SHALL match that sentence across line breaks, as *The lets-go checks read the skill's reference files* says, and SHALL read each skill's reference files too.

#### Scenario: The sentence wraps
- **WHEN** `skills/lets-go/SKILL.md` holds `**3**: no fresh session can run here, for example` at the end of one line and `because no resolver started one` at the start of the next
- **THEN** the exit-3 check passes for `lets-go`

#### Scenario: The sentence is gone
- **WHEN** `skills/lets-review-plan/SKILL.md` and its reference files do not hold the sentence
- **THEN** the exit-3 check fails, and its output names `lets-review-plan`

## MODIFIED Requirements

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md`, or a file in `skills/lets-go/references/`, SHALL hold each of these strings, so the skill-interfaces test can check them. A string may wrap across lines. `## Placeholders` SHALL be in `SKILL.md` itself, as *Each placeholder in lets-go names one thing* says:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done review plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `Interactivity: <level>, because your lets config sets go.level.`
- `lets go level`
- `issue #<i>: <title>`
- `epic #<parent>: <title>`
- `story #<story>: <title>`
- `Plan review: <verdict> for <sha>`
- `Run discovery on it?`
- `Picked #<i>: <title>, the first ready story under #<parent>.`
- `Picked #<i>: <title>, the next ready issue.`
- `docs: the discovery map from #<parent>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
- `--for review-plan`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --format=%as <sha>`
- `gh pr view <name> --json number,body`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<session>-prompt.md`
- `.workspace/lets-go/<session>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<session>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`
- `## Placeholders`
- `<shape-name>`
- `<session>`

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The step table header changes
- **WHEN** the step table's header no longer reads `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the fixed-lines check still passes

### Requirement: Placeholders in lets-go render as written
Every placeholder in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`, a name in angle brackets such as `<i>`, SHALL sit inside a fenced code block or an inline code span. A placeholder that follows `#`, such as `#<i>`, SHALL have the `#` inside the same code span. So GitHub shows each placeholder as written: it SHALL not read `<i>` or `<p>` as an HTML tag, drop the placeholder, or set the text after it in italics.

#### Scenario: No placeholder outside code
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`, and removes every fenced code block and every inline code span
- **THEN** no text in angle brackets that starts with a letter is left

#### Scenario: A fence inside a longer fence
- **WHEN** the test reads the prompt frame, a fence of four backticks that holds fences of three
- **THEN** the test treats the whole frame as code, and the text after the inner fences close as code too, up to the four-backtick line that closes the frame

#### Scenario: A stop that names the issue
- **WHEN** `lets-go` says to run `lets-shape` on the issue
- **THEN** the skill writes the line as ``Say to run the `lets-shape` skill on `#<i>`, and stop.``

#### Scenario: A placeholder outside code in a reference file
- **WHEN** `skills/lets-go/references/records.md` holds `pull request #<pr>` outside a code span
- **THEN** the test fails, and names the file, the line and `<pr>`

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section before *Start*. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<project>` is the number of the Project linked to the repository. `<owner>` is its owner, and `<repo>` the repository, as `owner/name`.
- `<i>` is the run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Start* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<idea>` is the idea in the user's words.

Neither `SKILL.md` nor any reference file SHALL hold `<n>`, `<p>`, `<url>`, `<issue URL>` or `<words>`.

#### Scenario: Every placeholder has a row
- **WHEN** the skill-interfaces test lists each distinct text in angle brackets that starts with a letter in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders` in `SKILL.md`

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to the skill and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: A placeholder with no row, in a reference file
- **WHEN** an edit adds `<base>` to `skills/lets-go/references/glossary-preflight.md` and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: The old names are gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`
- **THEN** it finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

#### Scenario: The Project and the issue
- **WHEN** `lets-go` claims #197 on Project 6
- **THEN** it runs `gh project item-edit 6 --owner <owner> --url <issue-url> --field Status --value "In Progress"` with 6 as `<project>`, and never 197

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`
