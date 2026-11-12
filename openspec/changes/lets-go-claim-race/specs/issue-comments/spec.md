## ADDED Requirements

### Requirement: Claim comments are workflow metadata
A claim comment SHALL have the exact first line `lets-go claimed this issue.`, a blank line and `Token: <UUID>`, with no other content. Its author SHALL be a non-bot OWNER, MEMBER or COLLABORATOR. Such comments SHALL not count as unread packet discussion, advance the read watermark or require shaping questions. A malformed comment or the same marker from an outside author SHALL remain ordinary discussion.

#### Scenario: Resume after claiming
- **WHEN** a valid claim comment is newer than both the body's last edit and the newest read marker
- **THEN** that comment alone does not make lets-go return needs-shape

#### Scenario: A marker carries discussion
- **WHEN** a comment has the claim marker followed by substantive text instead of the token format
- **THEN** it remains ordinary discussion and can require shaping
