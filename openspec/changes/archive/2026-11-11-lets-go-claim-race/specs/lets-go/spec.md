## ADDED Requirements

### Requirement: Claim instructions describe session arbitration
Claim SHALL state that an assigned issue returns taken before any write, and that concurrent claims normally produce one winner and one taken result, with a link to the read-lag risk. It SHALL link to the claim comment format. It SHALL pass the returned claim token to release on branch creation or glossary import failure. Existing lost-claim routing SHALL remain unchanged.

#### Scenario: An assigned issue
- **WHEN** the assignee read finds a nonzero count
- **THEN** Claim returns taken before assignment or Status changes

#### Scenario: Branch creation fails
- **WHEN** the session wins a claim and cannot create its branch
- **THEN** it releases with its own claim token

### Requirement: Claim recovery names the next action
On a failed assignment without a token, the skill SHALL stop and ask the user to inspect the assignment. On release returning `not-found`, it SHALL ask the user to inspect the issue before retrying.

#### Scenario: Assignment fails without a token
- **WHEN** claim reports a failed assignment with no token
- **THEN** the skill stops and asks the user to inspect the assignment

#### Scenario: Release finds no comment
- **WHEN** release returns `not-found`
- **THEN** the skill asks the user to inspect the issue before retrying

## MODIFIED Requirements

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
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
