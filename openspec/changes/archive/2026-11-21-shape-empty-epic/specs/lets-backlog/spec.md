<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: item reads one issue with its Project fields
`lets backlog item <key>` SHALL return the issue's `key`, `label`, `title`, `body`, `url` and `state`, and its Project fields `kind`, `priority`, `size` and `status`. A field that is unset, or an issue that is not on the Project, SHALL give `null` for each field it lacks. It SHALL return `assignees`, the login of each assigned user. It SHALL return `blockedBy`, each blocker's `key`, `label`, `title`, `state` and `url`. It SHALL return `parent` as `null`, or with the parent's `key`, `label`, `title`, `url` and `body`. It SHALL return `subIssues`, each open sub-issue's `key`, `label`, `title` and `url`. It SHALL return `closedSubIssues`, each closed sub-issue's `key`, `label`, `title` and `url`, in the same form. An issue with no sub-issues SHALL return both as empty lists. A caller can then tell an epic with no sub-issues from an epic whose sub-issues are all closed. A related issue can sit in another repository, where its `key` alone names another issue, so its `url` names it, and its `label` names its repository. A parent that cannot be read SHALL return the error `backend-failed`, whose message names the parent, never `not-found`. An issue that does not exist SHALL return the error `not-found`.

#### Scenario: A shaped story with a parent
- **WHEN** #136 is a Story with Priority Must, Size M and Status In Progress, its parent is #52, and #135 blocks it and is closed
- **THEN** `item` returns `"kind": "Story"`, `"priority": "Must"`, `"size": "M"`, `"status": "In Progress"`, a `parent` with `"key": "52"`, `"label": "#52"` and its body, and `blockedBy` with #135 and `"state": "CLOSED"`

#### Scenario: An assigned story
- **WHEN** `octocat` is assigned to #192
- **THEN** `item 192` returns `"assignees": ["octocat"]`

#### Scenario: An epic
- **WHEN** #52 is an Epic with open sub-issues #136 and #137, and a closed sub-issue #135
- **THEN** `item 52` returns `subIssues` with #136 and #137 and not #135, and `closedSubIssues` with #135 alone

#### Scenario: An epic with no sub-issues
- **WHEN** #60 is an Epic with no sub-issues
- **THEN** `item 60` returns `"subIssues": []` and `"closedSubIssues": []`

#### Scenario: An epic whose sub-issues are all closed
- **WHEN** #61 is an Epic whose only sub-issues, #62 and #63, are closed
- **THEN** `item 61` returns `"subIssues": []`, and `closedSubIssues` with #62 and #63, each with its `key`, `label`, `title` and `url`

#### Scenario: A blocker in another repository
- **WHEN** #52 is blocked by `acme/lib#7`
- **THEN** `item 52` returns `blockedBy` with `"key": "7"`, `"label": "acme/lib#7"` and `"url": "https://github.com/acme/lib/issues/7"`

#### Scenario: A parent that cannot be read
- **WHEN** #136's parent sits in a repository the signed-in user cannot read
- **THEN** `item 136` returns `"error": "backend-failed"` with a message that names the parent, and the exit code is 1

#### Scenario: Not on the Project
- **WHEN** #200 is an open issue that is not on the Project
- **THEN** `item 200` returns its title and body, and `null` for `kind`, `priority`, `size` and `status`

#### Scenario: No such issue
- **WHEN** a user runs `lets backlog item 99999` and no such issue exists
- **THEN** it returns `"error": "not-found"`, and the exit code is 1

#### Scenario: A key that is not a number
- **WHEN** a backlog provider holds the item `PROJ-12`, and a user runs `lets backlog item PROJ-12`
- **THEN** it returns `"key": "PROJ-12"` and `"label": "PROJ-12"`, and the exit code is 0

#### Scenario: A GitHub key that is not a number
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog item PROJ-12`
- **THEN** it returns `"error": "not-found"`, runs no `gh` command, and the exit code is 1
