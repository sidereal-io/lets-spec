## Purpose

`lets backlog` reads and claims work on the repository's backlog for the skills, so a skill never runs the backlog program's commands itself. The backlog program is GitHub: issues on the one Project linked to the repository.

## ADDED Requirements

### Requirement: Each backlog command prints one JSON object
Each `lets backlog` command SHALL print one JSON object on stdout, followed by a newline, and exit 0 when it has a result. When the backlog cannot answer, it SHALL print one JSON object with an `error` code and a `message` that says what to do, and exit 1. A usage error, such as a missing issue number or an unknown flag, SHALL exit 2, as every other `lets` command does.

#### Scenario: A result
- **WHEN** a user runs `lets backlog item 136` and #136 exists
- **THEN** stdout holds one JSON object with `"number": 136`, and the exit code is 0

#### Scenario: A missing argument
- **WHEN** a user runs `lets backlog item` with no number
- **THEN** the exit code is 2, and stdout is empty

#### Scenario: gh is not signed in
- **WHEN** a user runs `lets backlog ready` and `gh` reports that it is not authenticated
- **THEN** stdout holds `"error": "gh-failed"` with a `message` that holds `gh`'s error, and the exit code is 1

### Requirement: The backlog is the one Project linked to the repository
Each command SHALL use the open Project linked to the current repository, as the repository's own Project list or as an owner's Project that links back to the repository. When there is none, the command SHALL return the error `no-backlog`, whose message says to run the `lets-setup-backlog` skill. When there are two or more, it SHALL return the error `several-backlogs` with a `projects` list holding each one's `title` and `url`, and SHALL never pick one.

#### Scenario: A user-owned Project that links back
- **WHEN** the repository's own Project list is empty, and its owner has one open Project that lists the repository
- **THEN** `lets backlog ready` uses that Project

#### Scenario: No Project
- **WHEN** no open Project is linked to the repository
- **THEN** `lets backlog ready` returns `"error": "no-backlog"`, and its message names `lets-setup-backlog`

#### Scenario: Two Projects
- **WHEN** two open Projects are linked to the repository
- **THEN** `lets backlog claim 136` returns `"error": "several-backlogs"` with both titles and URLs, and assigns no one

### Requirement: ready lists the ready issues in rank order
`lets backlog ready` SHALL return `issues`: the open issues of this repository on the Project whose Status is Todo, whose Kind is not Epic, whose Priority is Must, Should or Could, that nobody is assigned to, and that no open issue blocks. It SHALL rank them Must, then Should, then Could, then by lowest issue number. Each issue SHALL carry `number`, `title`, `url`, `kind`, `priority` and `size`. `--only <i>,<i>` SHALL keep only the issues named. `--exclude <i>,<i>` SHALL leave out the issues named. An issue from another repository on the same Project SHALL never be listed.

#### Scenario: Rank
- **WHEN** the ready issues are #160 Should, #120 Must and #110 Should
- **THEN** `issues` lists #120, #110, #160, in that order

#### Scenario: Left out
- **WHEN** #149 is Todo and Must, but has an assignee, #150 is blocked by an open issue, #151 is a Wont, and #152 is an Epic
- **THEN** `issues` holds none of them

#### Scenario: Only the shaped stories
- **WHEN** a user runs `lets backlog ready --only 191,192,193`, and #120 is also ready
- **THEN** `issues` holds only those of #191, #192 and #193 that are ready

#### Scenario: Lost claims left out
- **WHEN** a user runs `lets backlog ready --exclude 149`, and #149 is still ready
- **THEN** `issues` does not hold #149

#### Scenario: Nothing ready
- **WHEN** no issue is ready
- **THEN** `issues` is an empty list, and the exit code is 0

### Requirement: item reads one issue with its Project fields
`lets backlog item <i>` SHALL return the issue's `number`, `title`, `body`, `url` and `state`, and its Project fields `kind`, `priority`, `size` and `status`. A field that is unset, or an issue that is not on the Project, SHALL give `null` for each field it lacks. It SHALL return `blockedBy`, each blocker's `number`, `title` and `state`. It SHALL return `parent` as `null`, or with the parent's `number`, `title` and `body`. An issue that does not exist SHALL return the error `not-found`.

#### Scenario: A shaped story with a parent
- **WHEN** #136 is a Story with Priority Must, Size M and Status In Progress, its parent is #52, and #135 blocks it and is closed
- **THEN** `item` returns `"kind": "Story"`, `"priority": "Must"`, `"size": "M"`, `"status": "In Progress"`, a `parent` with `"number": 52` and its body, and `blockedBy` with #135 and `"state": "CLOSED"`

#### Scenario: Not on the Project
- **WHEN** #200 is an open issue that is not on the Project
- **THEN** `item 200` returns its title and body, and `null` for `kind`, `priority`, `size` and `status`

#### Scenario: No such issue
- **WHEN** a user runs `lets backlog item 99999` and no such issue exists
- **THEN** it returns `"error": "not-found"`, and the exit code is 1

### Requirement: find searches open issue titles
`lets backlog find <words>` SHALL return `issues`: each open issue of this repository whose title matches the words, with its `number` and `title`. It SHALL not filter the matches further. The caller decides which match, if any, is the issue it wants.

#### Scenario: A change's branch
- **WHEN** a user runs `lets backlog find github-backlog-build`, and #136's title is `github-backlog-build — Take an existing GitHub story through the shared backlog boundary`
- **THEN** `issues` holds #136 with that title

#### Scenario: No match
- **WHEN** no open issue's title matches
- **THEN** `issues` is an empty list, and the exit code is 0

### Requirement: claim assigns the issue only when nobody has it
`lets backlog claim <i>` SHALL read the issue's assignees first. When anyone is assigned, it SHALL return `"result": "taken"` with the `assignees`' logins, and SHALL write nothing. Otherwise it SHALL assign the signed-in `gh` user, then set the issue's Status on the Project to In Progress, and return `"result": "claimed"`.

#### Scenario: Claimed
- **WHEN** nobody is assigned to #149 and its Status is Todo
- **THEN** `claim 149` assigns the signed-in user, sets Status to In Progress, and returns `"result": "claimed"`

#### Scenario: Taken
- **WHEN** `octocat` is assigned to #149
- **THEN** `claim 149` returns `"result": "taken"` with `"assignees": ["octocat"]`, and changes neither the assignees nor the Status

### Requirement: A failed claim write is reported, not repaired
When a write of `claim` fails, the command SHALL stop at that write and return `"result": "failed"`, with `write` set to `assign` or `status`, and `message` holding `gh`'s error. It SHALL not undo an earlier write, retry, or keep any record of its own. The exit code SHALL be 0, because `failed` is a result the caller acts on.

#### Scenario: Status write fails
- **WHEN** `claim 149` assigns the user, and setting Status fails with `gh`'s error `field not found`
- **THEN** it returns `"result": "failed"`, `"write": "status"` and a `message` that holds `field not found`, and #149 stays assigned to the user

#### Scenario: Assign fails
- **WHEN** assigning the user to #149 fails
- **THEN** it returns `"result": "failed"` and `"write": "assign"`, and does not try to set the Status

### Requirement: release gives the issue back
`lets backlog release <i>` SHALL remove the signed-in user's assignment, then set the Status to Todo, and return `"result": "released"`. It SHALL never remove another user's assignment. When a write fails, it SHALL return `"result": "failed"` with `write` set to `unassign` or `status` and `gh`'s error, as `claim` does.

#### Scenario: Released
- **WHEN** the signed-in user is assigned to #149 and its Status is In Progress
- **THEN** `release 149` removes the assignment, sets Status to Todo, and returns `"result": "released"`

#### Scenario: Another user stays
- **WHEN** the signed-in user and `octocat` are assigned to #149
- **THEN** `release 149` removes only the signed-in user, and `octocat` stays assigned
