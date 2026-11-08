## MODIFIED Requirements

### Requirement: The thread query returns what the labels need
The lets-shape thread query SHALL remain one `gh api graphql` command.
Lets-go and lets-brainstorm SHALL obtain equivalent complete thread facts
through configured `item.read` actions instead of hard-coded provider commands. For every comment it SHALL return the URL, author login, author type, author association, creation date, last edit date and body. It SHALL also return the issue's last body edit date. It SHALL page when the thread is longer than one page.

#### Scenario: A thread with a maintainer and a bot
- **WHEN** an issue holds one comment from a MEMBER and one from a GitHub App
- **THEN** the query returns both, the first with association `MEMBER` and author type `User`, the second with author type `Bot`

#### Scenario: An edited comment
- **WHEN** a comment was edited after it was posted
- **THEN** the query returns its last edit date, and a never-edited comment's last edit date is null

#### Scenario: The query is checked by the test suite
- **WHEN** the skill-interfaces test scans `skills/*/references/*.md` for `gh` commands
- **THEN** it finds the thread query and `gh` recognises its group and command

### Requirement: Build reads the thread before it claims
In *Confirm the packet*, `lets-go` SHALL fetch the issue's body edit date, comments and read markers through the configured `item.read` boundary with complete paginated coverage. It SHALL link `../lets-shape/references/issue-comments.md` for the labels and marker rather than restate them. It SHALL run the check for `next` and for a named issue alike, after the required-lines check and before it claims the issue.

#### Scenario: The skill links the reference
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds the link `](../lets-shape/references/issue-comments.md)`, and the link resolves inside the installed skills in each built flow

#### Scenario: The same check for `next`
- **WHEN** `next` selects an issue whose thread has a comment newer than its watermark
- **THEN** the run stops the same way as for a named issue, and does not move on to another candidate

### Requirement: Brainstorm reads the thread and shows it
When `lets-brainstorm` reads the story packet, it SHALL fetch the issue's thread through the configured `item.read` boundary with complete paginated coverage. It SHALL show the user the reference's list. It SHALL link `../lets-shape/references/issue-comments.md` for the labels and marker rather than restate them.

#### Scenario: The skill links the reference
- **WHEN** the skill-interfaces test reads `skills/lets-brainstorm/SKILL.md`
- **THEN** it finds the link `](../lets-shape/references/issue-comments.md)`, and the link resolves inside the installed skills in each built flow

#### Scenario: An issue with two comments
- **WHEN** the brainstorm starts on an issue with one `read` comment and one `candidate` comment
- **THEN** the user sees both in one list, oldest first, before any question

#### Scenario: An issue with no comments
- **WHEN** the brainstorm starts on an issue with no comments
- **THEN** the brainstorm asks nothing about comments and the ledger cites no comment

### Requirement: Brainstorm fetches the thread again before the user confirms the ledger
Before it asks the user to confirm the ledger, `lets-brainstorm` SHALL fetch the complete thread again through configured `item.read`, whether or not the first fetch found a comment. A comment the first fetch did not return, or whose last edit date changed, SHALL be shown and raised like the others.

#### Scenario: A comment arrives during the brainstorm
- **WHEN** a collaborator comments on the story after the first fetch and before the ledger is confirmed
- **THEN** the brainstorm shows that comment and, when it bears on the story, asks about it before the user confirms

#### Scenario: A thread that was empty
- **WHEN** the first fetch found no comment, and a comment arrives during the brainstorm
- **THEN** the second fetch returns it, and the brainstorm shows it
