## ADDED Requirements

### Requirement: Claim comments are workflow metadata
A claim comment SHALL have the exact first line `lets-go claimed this issue.`, a blank line and `Token: <UUID>`, with a lowercase UUID v4, an optional final newline and no other content. Its author SHALL be a non-bot OWNER, MEMBER or COLLABORATOR. Such comments SHALL not count as unread packet discussion, advance the read watermark or require shaping questions. A malformed comment or the same marker from an outside author SHALL remain ordinary discussion.

#### Scenario: Resume after claiming
- **WHEN** a valid claim comment is newer than both the body's last edit and the newest read marker
- **THEN** that comment alone does not make lets-go return needs-shape

#### Scenario: A marker carries discussion
- **WHEN** a comment has the claim marker followed by substantive text instead of the token format
- **THEN** it remains ordinary discussion and can require shaping

## MODIFIED Requirements

### Requirement: Every comment is shown and labelled
Before asking about any comment, an agent SHALL show the user one list of the whole thread, oldest first. Each line SHALL hold the comment's number in the list, its label, author, date and one sentence on what it says. The author SHALL be written without a leading `@`, and the sentence SHALL carry no `@mention`. A valid claim comment SHALL carry the label `claim`. For every other comment, the label SHALL be `candidate` when the author association is OWNER, MEMBER or COLLABORATOR and the author is not a bot, and `outside` otherwise. A comment whose author account no longer exists SHALL show as `ghost` and `outside`. An ordinary comment that the newest read marker covers SHALL carry the label `read` instead. A label SHALL never hide a comment.

#### Scenario: A thread of three comments
- **WHEN** an issue holds a comment from a COLLABORATOR, one from a CONTRIBUTOR and one from a bot, and no read marker
- **THEN** the user sees three lines, labelled `candidate`, `outside` and `outside`, with every author and date

#### Scenario: A deleted author
- **WHEN** a comment's author account was deleted
- **THEN** its line shows `ghost` as the author and `outside` as the label

#### Scenario: An outside comment changes the packet
- **WHEN** the user says yes to a comment labelled `outside`
- **THEN** shaping folds it the same way as a `candidate`

### Requirement: Shaping asks about each unread comment
This applies when `lets-shape` shapes an existing issue in Shape one issue, ingests an issue, or reads an open linked story in Revision mode. It SHALL ask the user about each comment the newest read marker does not cover, except valid claim comments, in list order, one at a time. In Shape one issue and Revision mode the recommended answer SHALL be fold or dismiss, with the reason. In Revision mode, when a comment changes a journey stage and not the packet, the recommended answer SHALL be to update the map, naming the stage. In Ingest it SHALL be take into the parent issue or dismiss, with the reason. In Shape one issue the questions SHALL run for every Kind, as their own step after the code is read and before the template interview. When the packet already holds a comment's content, or the comment changes neither the packet nor a stage, shaping SHALL recommend dismiss, with that reason. An existing issue found by title search and confirmed by the user SHALL be read, body and thread, like a named one.

#### Scenario: A comment already in the packet
- **WHEN** a comment asks for a path change that the body's **Relevant code** line already shows
- **THEN** the agent recommends dismiss, saying the packet already holds it

#### Scenario: A Chore with a comment
- **WHEN** the issue's Kind is Chore and it holds one unread comment
- **THEN** shaping asks about that comment before it writes the issue

#### Scenario: An issue found by search
- **WHEN** the user describes work, step 1 finds an open issue by title, and the user confirms it is the same work
- **THEN** shaping reads that issue's body and thread, and asks about its unread comments

#### Scenario: An issue with no comments
- **WHEN** the issue has no comments
- **THEN** shaping asks nothing about comments and posts no reply

#### Scenario: A superseded story in Revision mode
- **WHEN** a `candidate` comment on an open linked story says #140 supersedes it, and no read marker covers the comment
- **THEN** shaping asks about it, recommends updating the map to link #140 at that stage, and does not offer to close the story

#### Scenario: A comment about something else in Revision mode
- **WHEN** an unread `outside` comment on an open linked story asks a question the packet and the map do not touch
- **THEN** shaping asks about it and recommends dismiss, saying it changes neither
