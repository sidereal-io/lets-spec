## ADDED Requirements

### Requirement: complete marks the work item done
`lets backlog complete <key>` SHALL mark the item its key names as done on the backlog provider in use, and return `"result": "completed"`. When the item is already done, it SHALL write nothing and return `"result": "completed"` too.

It SHALL check only that the key names an item. It SHALL not look for a merged pull request. It SHALL complete an epic, or an item someone is assigned to, like any other item. A key the backlog provider does not use, or an item that does not exist, SHALL return the error `not-found` and exit 1. When it cannot read whether the item is done, it SHALL return the error `backend-failed`, exit 1, and write nothing.

With the GitHub backlog provider, done is a closed issue. `complete` SHALL close an open issue with the reason completed, and SHALL write no Project field.

#### Scenario: An open issue
- **WHEN** the backlog provider is GitHub, #258 is open, and a user runs `lets backlog complete 258`
- **THEN** #258 is closed with the reason completed, it returns `"result": "completed"`, and the exit code is 0

#### Scenario: An issue already closed
- **WHEN** the backlog provider is GitHub, #258 is closed, and a user runs `lets backlog complete 258`
- **THEN** it returns `"result": "completed"`, writes nothing, and the exit code is 0

#### Scenario: No Project field written
- **WHEN** the backlog provider is GitHub, #258 is open with Status In Progress, and a user runs `lets backlog complete 258`
- **THEN** lets writes no Status, Kind, Priority or Size on the Project

#### Scenario: An assigned epic
- **WHEN** the backlog provider is GitHub, #52 is an open Epic, `octocat` is assigned to it, and a user runs `lets backlog complete 52`
- **THEN** #52 is closed with the reason completed, and it returns `"result": "completed"`

#### Scenario: No such issue
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog complete 99999` and no such issue exists
- **THEN** it returns `"error": "not-found"`, and the exit code is 1

#### Scenario: A GitHub key that is not a number
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog complete PROJ-12`
- **THEN** it returns `"error": "not-found"`, runs no `gh` command, and the exit code is 1

#### Scenario: The read times out
- **WHEN** reading #258's state times out, and a user runs `lets backlog complete 258`
- **THEN** it returns `"error": "backend-failed"`, does not try to close #258, and the exit code is 1

### Requirement: A failed complete write is reported
When the write of `complete` fails, the command SHALL return `"result": "failed"` with `message` holding the backend's error, and exit 0. When the write times out, `message` SHALL say that the write may have happened. It SHALL not retry the write.

#### Scenario: Closing fails
- **WHEN** #258 is open, and closing it fails with `gh`'s error `Resource not accessible by integration`
- **THEN** it returns `"result": "failed"` and a `message` that holds `Resource not accessible by integration`, and the exit code is 0

#### Scenario: Closing times out
- **WHEN** #258 is open, and closing it times out
- **THEN** it returns `"result": "failed"` and `"message": "timed out; the write may have happened"`, tries to close #258 once, and the exit code is 0
