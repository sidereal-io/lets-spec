## ADDED Requirements

### Requirement: lets-go shows an item by its label and runs commands with its key
Where `lets-go` shows an item to a person, in a line it prints, a question it asks or text it writes in an issue, `#<i>`, `#<parent>` and `#<story>` SHALL stand for that item's `label`, as `lets backlog` returns it. Where `lets-go` runs a command, `<i>`, `<parent>` and `<story>` SHALL stand for the item's `key`. The `## Placeholders` section of `skills/lets-go/SKILL.md` SHALL say so once. With the GitHub backlog provider the label is `#` and the issue number, so every line reads as it did before.

#### Scenario: A GitHub pick
- **WHEN** `next` picks the issue whose `key` is `149` and whose `label` is `#149`
- **THEN** `lets-go` prints `Picked #149: <title>, the next ready issue.` and runs `lets backlog claim 149`

#### Scenario: A pick on another backlog provider
- **WHEN** `next` picks the item whose `key` and `label` are both `PROJ-12`
- **THEN** `lets-go` prints `Picked PROJ-12: <title>, the next ready issue.` and runs `lets backlog claim PROJ-12`

#### Scenario: The placeholder table says it
- **WHEN** the skill-interfaces test reads the `## Placeholders` section of `skills/lets-go/SKILL.md`
- **THEN** it finds `label` and `key` named for the item placeholders

## MODIFIED Requirements

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. An issue number here is any item key of the backlog provider. A request names an issue when, after a question mode word is taken off, it is one word and `lets backlog key <word>` returns a `key`. That key SHALL be `<i>`. When `key` is `null`, the request SHALL be words. When the command returns an `error`, `lets-go` SHALL stop as *A backlog error stops the run* says. With the GitHub backlog provider, `#149` and `149` name the issue whose key is `149`. A leading or trailing `ask` or `auto` SHALL name the question mode when the rest of the request is a number or nothing. When the rest is words on the default branch, `lets-go` SHALL ask the user whether that word names the question mode or is part of the idea, and show both readings. It SHALL ask in either mode, before *Start from an idea* runs. Only when the user says the word names the question mode SHALL `lets-go` take it off, as the question mode. Otherwise the word SHALL stay in the idea, and *Set the question mode* SHALL take the question mode from its next source. On the default branch, every other request with words SHALL be the idea, kept word for word. When the idea holds no letter or digit, in any script, `lets-go` SHALL say that an idea needs at least one letter or digit, and stop. It SHALL stop before the discovery query and the title search, claiming nothing and running no step. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank, and its *Check the prerequisite* and *Confirm the packet* on each candidate, as *Only an idea or a named issue goes to the shape step* says. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When the case returns `nothing-ready`, `lets-go` SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `lets backlog find <branch>` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

#### Scenario: Neither a number nor words
- **WHEN** the user runs `lets-go` alone on the default branch, and `next` finds `#149 lets-go-chore — ...` as the first ready issue
- **THEN** `lets-go` prints `Picked #149: lets-go-chore — ..., the next ready issue.` and goes on to its blocker read with #149

#### Scenario: Nothing is ready
- **WHEN** the user runs `lets-go` alone on the default branch, and no Todo issue is unassigned, unblocked and ready
- **THEN** `lets-go` says the backlog has nothing ready, suggests `lets-shape`, and claims nothing

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as *Find the source of demand* does for a named issue

#### Scenario: An idea
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on the default branch
- **THEN** `lets-go` takes `add a --quiet flag to lets sync` as the idea, and searches for an existing issue as *Find the source of demand* does for described work

#### Scenario: An idea with a question mode
- **WHEN** the user runs `lets-go auto add a --quiet flag to lets sync` on the default branch, and answers that `auto` names the question mode
- **THEN** the idea is `add a --quiet flag to lets sync`, and the question mode is `auto`

#### Scenario: A question mode word that is part of the idea
- **WHEN** the user runs `lets-go ask before deleting the branch` on the default branch, and answers that `ask` is part of the idea
- **THEN** the idea is `ask before deleting the branch`, and *Set the question mode* takes the question mode from `go.questions` or the Kind

#### Scenario: A question mode with a number
- **WHEN** the user runs `lets-go ask #149`
- **THEN** the question mode is `ask`, the issue is `#149`, and `lets-go` asks no question about the word

#### Scenario: An idea with no letters or digits
- **WHEN** the user runs `lets-go ???` on the default branch
- **THEN** `lets-go` says that an idea needs at least one letter or digit, and stops, claiming nothing, before the discovery query and the title search

#### Scenario: Letters in another script
- **WHEN** the user runs `lets-go ログを直す` on the default branch
- **THEN** the idea is `ログを直す`, and the run goes to *Start from an idea*

#### Scenario: No issue number on a change's branch
- **WHEN** the user runs `lets-go` with no issue number on the branch `lets-go-chore`, and one open issue's title starts with `lets-go-chore — `
- **THEN** `lets-go` takes that issue as `<i>`

#### Scenario: Two issues match the branch
- **WHEN** two open issues have titles that start with `lets-go-chore — `
- **THEN** `lets-go` says it needs the issue number, and stops

#### Scenario: The number does not match the branch
- **WHEN** the user runs `lets-go` for `#149` on the branch `step-strategy`, and #149's title does not start with `step-strategy — `
- **THEN** `lets-go` says the issue and the branch do not match, and stops

#### Scenario: Words on a change's branch
- **WHEN** the user runs `lets-go fix the typo in the README` on the branch `lets-go-chore`
- **THEN** `lets-go` says an idea needs the default branch, runs no step, and stops

#### Scenario: A key of another backlog provider
- **WHEN** the user runs `lets-go PROJ-12` on the default branch, and `lets backlog key PROJ-12` returns `"key": "PROJ-12"` and `"label": "PROJ-12"`
- **THEN** `lets-go` takes `PROJ-12` as `<i>` and goes on to its blocker read with `lets backlog item PROJ-12`

#### Scenario: One word that is not a key
- **WHEN** the user runs `lets-go refactor` on the default branch, and `lets backlog key refactor` returns `"key": null`
- **THEN** `lets-go` takes `refactor` as the idea, and goes to *Start from an idea*

#### Scenario: The key command fails
- **WHEN** the user runs `lets-go 149`, and `lets backlog key 149` returns `"error": "unknown-backlog-provider"`
- **THEN** `lets-go` shows the error's `message`, claims nothing and runs no step

### Requirement: lets-go picks the first ready story
After a shape report that names a parent and stories, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case SHALL run `lets backlog ready` with the report's stories as `--only`. So SHALL its rank, Must, then Should, then Could, then the oldest issue first, and its *Check the prerequisite* and *Confirm the packet* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When the case returns `nothing-ready`, `lets-go` SHALL print the `Done shape` line, unless this run has printed it already, and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, such as its blocker, its assignee, an unresolved prerequisite, or a packet that is not complete, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

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

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue, as its key: the key the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
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
- **WHEN** `lets-go` claims #197
- **THEN** it runs `lets backlog claim 197`, and no placeholder stands for the Project

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

### Requirement: A backlog error stops the run
When a `lets backlog` command returns an `error`, `lets-go` SHALL stop, claim nothing more and run no step. For `no-backlog` it SHALL say to run the `lets-setup-backlog` skill. For `several-backlogs` it SHALL list each Project's title and URL, ask the user to unlink the extras, and never pick one. For any other error it SHALL show the error's `message`. *Backlog errors* SHALL hold this rule, and every part that runs a `lets backlog` command SHALL link to it.

#### Scenario: No Project
- **WHEN** no Project is linked to the repository, and the user runs `lets-go` on the branch `fix-typo`
- **THEN** `lets backlog find fix-typo` returns `no-backlog`, and `lets-go` says to run the `lets-setup-backlog` skill and stops

#### Scenario: Two Projects
- **WHEN** two open Projects are linked to the repository, and the user runs `lets-go` on the default branch
- **THEN** `lets-go` lists both titles and URLs from the `several-backlogs` error, asks the user to unlink the extras, claims nothing and stops

#### Scenario: gh fails
- **WHEN** `lets backlog item 149` returns `"error": "backend-failed"` with the message `gh auth login required`
- **THEN** `lets-go` shows `gh auth login required` and stops

#### Scenario: An unknown backlog provider
- **WHEN** `openspec/config.yaml` sets `lets.backlog.provider` to `jria`, and `lets backlog ready` returns `"error": "unknown-backlog-provider"`
- **THEN** `lets-go` shows the error's `message`, which names `jria`, and stops
