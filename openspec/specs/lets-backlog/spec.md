# lets-backlog Specification

## Purpose
`lets backlog` reads, claims and completes work on the repository's backlog for the skills, so a skill never runs the backlog provider's commands itself for what these commands cover. The user's lets config selects the backlog provider. GitHub, issues on the one Project linked to the repository, is the default, and the only one this release ships.

## Requirements

### Requirement: Each backlog command prints one JSON object
Each `lets backlog` command SHALL print one JSON object on stdout, followed by a newline, and exit 0 when it has a result. When the backlog cannot answer, it SHALL print one JSON object with an `error` code and a `message` that says what to do, and exit 1. A usage error, such as a missing key or an unknown flag, SHALL exit 2, as every other `lets` command does.

#### Scenario: A result
- **WHEN** a user runs `lets backlog item 136` and #136 exists
- **THEN** stdout holds one JSON object with `"key": "136"`, and the exit code is 0

#### Scenario: A missing argument
- **WHEN** a user runs `lets backlog item` with no key
- **THEN** the exit code is 2, and stdout is empty

#### Scenario: gh is not signed in
- **WHEN** a user runs `lets backlog ready` and `gh` reports that it is not authenticated
- **THEN** stdout holds `"error": "backend-failed"` with a `message` that holds `gh`'s error, and the exit code is 1

### Requirement: The backlog is the one Project linked to the repository
With the GitHub backlog provider, each command except `key` SHALL use the open Project linked to the current repository, as the repository's own Project list or as an owner's Project that links back to the repository. When there is none, the command SHALL return the error `no-backlog`, whose message says to run the `lets-setup-backlog` skill. When there are two or more, it SHALL return the error `several-backlogs` with a `projects` list holding each one's `title` and `url`, and SHALL never pick one.

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
`lets backlog ready` SHALL return `issues`: the open issues of this repository on the Project that pass every one of these filters:

- Status is Todo.
- Kind is not Epic.
- Priority is Must, Should or Could.
- Nobody is assigned.
- No open issue blocks it.

It SHALL rank them Must, then Should, then Could, then by creation time, oldest first. Each issue SHALL carry `key`, `label`, `title`, `url`, `kind`, `priority` and `size`. `--only <key>,<key>` SHALL keep only the issues named. `--exclude <key>,<key>` SHALL leave out the issues named. A key in `--only` or `--exclude` that names no ready issue SHALL be ignored. An issue from another repository on the same Project SHALL never be listed.

#### Scenario: Rank
- **WHEN** the ready issues are #160 Should, #120 Must and #110 Should, each created in the order of its number
- **THEN** `issues` lists the keys `120`, `110`, `160`, in that order

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

#### Scenario: Ties break by creation time, not by key
- **WHEN** a backlog provider's ready items are `PROJ-9` and `PROJ-12`, both Must, and `PROJ-12` was created first
- **THEN** `issues` lists `PROJ-12`, then `PROJ-9`

#### Scenario: Keys that are not numbers in --only
- **WHEN** a user runs `lets backlog ready --only PROJ-9,PROJ-12`, and `PROJ-3` is also ready
- **THEN** `issues` holds only those of `PROJ-9` and `PROJ-12` that are ready

### Requirement: item reads one issue with its Project fields
`lets backlog item <key>` SHALL return the issue's `key`, `label`, `title`, `body`, `url` and `state`, and its Project fields `kind`, `priority`, `size` and `status`. A field that is unset, or an issue that is not on the Project, SHALL give `null` for each field it lacks. It SHALL return `assignees`, the login of each assigned user. It SHALL return `blockedBy`, each blocker's `key`, `label`, `title`, `state` and `url`. It SHALL return `parent` as `null`, or with the parent's `key`, `label`, `title`, `url` and `body`. It SHALL return `subIssues`, each open sub-issue's `key`, `label`, `title` and `url`. A related issue can sit in another repository, where its `key` alone names another issue, so its `url` names it, and its `label` names its repository. A parent that cannot be read SHALL return the error `backend-failed`, whose message names the parent, never `not-found`. An issue that does not exist SHALL return the error `not-found`.

#### Scenario: A shaped story with a parent
- **WHEN** #136 is a Story with Priority Must, Size M and Status In Progress, its parent is #52, and #135 blocks it and is closed
- **THEN** `item` returns `"kind": "Story"`, `"priority": "Must"`, `"size": "M"`, `"status": "In Progress"`, a `parent` with `"key": "52"`, `"label": "#52"` and its body, and `blockedBy` with #135 and `"state": "CLOSED"`

#### Scenario: An assigned story
- **WHEN** `octocat` is assigned to #192
- **THEN** `item 192` returns `"assignees": ["octocat"]`

#### Scenario: An epic
- **WHEN** #52 is an Epic with open sub-issues #136 and #137, and a closed sub-issue #135
- **THEN** `item 52` returns `subIssues` with #136 and #137 and not #135

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

### Requirement: find searches open issue titles
`lets backlog find <words>` SHALL return `issues`: each open issue of this repository whose title matches the words, with its `key`, `label` and `title`. It SHALL not filter the matches further. The caller decides which match, if any, is the issue it wants.

#### Scenario: A change's branch
- **WHEN** a user runs `lets backlog find github-backlog-build`, and #136's title is `github-backlog-build — Take an existing GitHub story through the shared backlog boundary`
- **THEN** `issues` holds `"key": "136"`, `"label": "#136"` and that title

#### Scenario: No match
- **WHEN** no open issue's title matches
- **THEN** `issues` is an empty list, and the exit code is 0

### Requirement: claim assigns the issue only when nobody has it
`lets backlog claim <i>` SHALL read claims before assignees. If anyone is assigned, it SHALL return `taken` with their logins and write nothing. Otherwise it SHALL assign the signed-in user and post a unique claim token. It SHALL exclude claims seen before the empty-assignee check and elect the lowest remaining comment ID. The winner SHALL delete the excluded abandoned comments. Only the winner SHALL set Status to In Progress and return `claimed` with its token as `claim`. A loser SHALL delete its comment, recheck claims and return `taken` with the winner's login. It SHALL remove its assignment unless another claim shares its login, and set Status to Todo only if no claim remains. A missing own comment or unreadable election SHALL never grant ownership.

#### Scenario: Claimed
- **WHEN** nobody is assigned to #149 and its Status is Todo
- **THEN** `claim 149` assigns the signed-in user, sets Status to In Progress, and returns `"result": "claimed"`

#### Scenario: Abandoned claim
- **WHEN** nobody is assigned but a previous claim comment remains
- **THEN** a new claim ignores that comment and can win

#### Scenario: Release after reclaiming
- **WHEN** a new session reclaims an issue with an abandoned comment under the same or a different login, then releases its token
- **THEN** no claim comments remain, its assignment is removed, and Status is Todo

#### Scenario: Taken
- **WHEN** `octocat` is assigned to #149
- **THEN** `claim 149` returns `"result": "taken"` with `"assignees": ["octocat"]`, and changes neither the assignees nor the Status

#### Scenario: Two sessions use one login
- **WHEN** two sessions read an empty assignee list and post different claim tokens under the same login
- **THEN** only the earliest comment's session returns claimed, the loser deletes its own comment, and the shared assignment remains

#### Scenario: Two sessions use different logins
- **WHEN** two sessions read an empty assignee list and post different claim tokens under different logins
- **THEN** only the earliest comment's session returns claimed, and the loser removes only its own comment and assignment without writing Status

### Requirement: A failed claim write is reported, not repaired
When a write of `claim` fails, the command SHALL stop at that write and return `"result": "failed"`, with `write` naming the failed write (`assign`, `claim`, `delete-claim`, `unassign` or `status`), and `message` holding the backend's error. It SHALL not undo an earlier write, retry, or keep a local claim record. A failure after posting SHALL carry the claim token for recovery; the comment can remain until explicitly released. The exit code SHALL be 0, because `failed` is a result the caller acts on.

#### Scenario: Status write fails
- **WHEN** `claim 149` assigns the user, and setting Status fails with `gh`'s error `field not found`
- **THEN** it returns `"result": "failed"`, `"write": "status"` and a `message` that holds `field not found`, and #149 stays assigned to the user

#### Scenario: Assign fails
- **WHEN** assigning the user to #149 fails
- **THEN** it returns `"result": "failed"` and `"write": "assign"`, and does not try to set the Status

#### Scenario: Assign times out
- **WHEN** assigning the user times out and no claim comment was posted
- **THEN** the result has no claim token, and no claim comment is posted

### Requirement: release gives the issue back
`lets backlog release <key> --claim <token>` SHALL require the token returned by claim. If no comment matches the token and signed-in login, it SHALL return `not-found` and write nothing. Otherwise it SHALL delete that comment and recheck claims. It SHALL preserve its assignment if another claim shares its login, or remove it otherwise. It SHALL preserve Status if any claim remains, or set it to Todo otherwise. After successful writes it SHALL return `released`. It SHALL never remove another user's assignment. A failed write SHALL return `failed`, with `write` naming `delete-claim`, `unassign` or `status`, and `message` holding the backend's error.

#### Scenario: Released
- **WHEN** the signed-in user is assigned to #149, its Status is In Progress, and their claim comment holds `<token>`
- **THEN** `release 149 --claim <token>` removes the assignment, sets Status to Todo, and returns `"result": "released"`

#### Scenario: Another user stays
- **WHEN** the signed-in user and `octocat` are assigned to #149
- **THEN** `release 149 --claim <token>` removes only the signed-in user, and `octocat` stays assigned

#### Scenario: A stale release uses the winner's login
- **WHEN** a loser has already deleted its comment and later releases its own token while the winner under the same login is active
- **THEN** release returns `not-found` and changes neither the winner's comment nor its assignment nor Status

### Requirement: The user's lets config selects the backlog provider
Each `lets backlog` command SHALL read `backlog.provider` from the user's lets config, `$XDG_CONFIG_HOME/lets/config.yaml`, or `~/.config/lets/config.yaml` when `XDG_CONFIG_HOME` is unset or empty, and use that backlog provider. When the file, its `backlog` section, or `provider` is absent or null, the backlog provider SHALL be `github`. When `provider` names a backlog provider this release does not ship, the command SHALL return the error `unknown-backlog-provider` and exit 1, with a `message` that names the value, the file and each backlog provider the release ships, and SHALL run no backend command. When the file is not YAML, is not a mapping with `version: 3`, or holds a `backlog` that is not a mapping or a `provider` that is not a string, the command SHALL return `unknown-backlog-provider` too, with a `message` that names the file and what is wrong, and SHALL run no backend command. It SHALL never read the backlog provider from `openspec/config.yaml`. The help text SHALL name the backlog provider in use.

#### Scenario: No config file
- **WHEN** the user has no lets config, and runs `lets backlog ready`
- **THEN** it reads the GitHub Project

#### Scenario: No backlog section
- **WHEN** the lets config holds `version: 3` and a `delegate` section, and no `backlog`
- **THEN** `lets backlog ready` reads the GitHub Project

#### Scenario: GitHub named
- **WHEN** the lets config holds `backlog:` with `provider: github`
- **THEN** `lets backlog ready` reads the GitHub Project

#### Scenario: An unknown backlog provider
- **WHEN** the lets config sets `backlog.provider` to `jria`, and a user runs `lets backlog item 136`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `jria`, the lets config file and `github`, no `gh` command runs, and the exit code is 1

#### Scenario: A config lets cannot read
- **WHEN** the lets config sets `backlog.provider` to `[jira]`, or the file is not YAML, and a user runs `lets backlog claim 136`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names the file, no `gh` command runs, and the exit code is 1

#### Scenario: openspec/config.yaml is not read
- **WHEN** `openspec/config.yaml` holds `lets:` with `backlog:` and `provider: jria`, and the user has no lets config
- **THEN** `lets backlog ready` reads the GitHub Project

### Requirement: key says whether text is one of the backlog provider's keys
`lets backlog key <text>` SHALL return `key` and `label` when the text names an item in the backlog provider's own form, and `"key": null` and `"label": null` when it does not. It SHALL decide from the text alone, and SHALL run no backend command. Text after `--` SHALL be read as the text, even when it starts with `-`. With the GitHub backlog provider, a whole number above zero, with or without a leading `#`, SHALL give that number as `key` and `#` and the number as `label`.

#### Scenario: A GitHub number
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog key 149`
- **THEN** it returns `"key": "149"` and `"label": "#149"`, and the exit code is 0

#### Scenario: A GitHub number with its hash
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog key '#149'`
- **THEN** it returns `"key": "149"` and `"label": "#149"`

#### Scenario: Words
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog key refactor`
- **THEN** it returns `"key": null` and `"label": null`, and the exit code is 0

#### Scenario: Text that looks like an option
- **WHEN** the backlog provider is GitHub, and a user runs `lets backlog key -- --help`
- **THEN** it returns `"key": null` and `"label": null`, and prints no help

#### Scenario: No Project needed
- **WHEN** no Project is linked to the repository, and a user runs `lets backlog key 149`
- **THEN** it returns `"key": "149"`, and runs no `gh` command
