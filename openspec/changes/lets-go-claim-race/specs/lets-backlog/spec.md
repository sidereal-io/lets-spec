## MODIFIED Requirements

### Requirement: claim assigns the issue only when nobody has it
`lets backlog claim <i>` SHALL read the issue's assignees first. When anyone is assigned, it SHALL return `"result": "taken"` with the `assignees`' logins, and SHALL write nothing. Otherwise it SHALL assign the signed-in `gh` user and post a claim comment with a token unique to this run. It SHALL read all claim comments, using their increasing GitHub comment IDs to choose the earliest active claim. Only that claim SHALL set Status to In Progress and return `"result": "claimed"` with `claim`, its token. A loser SHALL delete only its own claim comment, remove its own assignment only when the winner has a different login, leave Status unchanged, and return `taken` with the winner's login. A missing own comment or an unreadable election SHALL never grant ownership.

#### Scenario: Claimed
- **WHEN** nobody is assigned to #149 and its Status is Todo
- **THEN** `claim 149` assigns the signed-in user, sets Status to In Progress, and returns `"result": "claimed"`

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
When a write of `claim` fails, the command SHALL stop at that write and return `"result": "failed"`, with `write` naming the failed write (`assign`, `claim`, `delete-claim`, `unassign` or `status`), and `message` holding `gh`'s error. It SHALL not undo an earlier write, retry, or keep a local claim record. A failure after posting SHALL carry the claim token for recovery; the comment can remain until explicitly released. The exit code SHALL be 0, because `failed` is a result the caller acts on.

#### Scenario: Status write fails
- **WHEN** `claim 149` assigns the user, and setting Status fails with `gh`'s error `field not found`
- **THEN** it returns `"result": "failed"`, `"write": "status"` and a `message` that holds `field not found`, and #149 stays assigned to the user

#### Scenario: Assign fails
- **WHEN** assigning the user to #149 fails
- **THEN** it returns `"result": "failed"` and `"write": "assign"`, and does not try to set the Status

#### Scenario: Assign times out
- **WHEN** assigning the user times out and no claim comment was posted
- **THEN** the result has no claim token, and the skill tells the agent to stop and ask the user to inspect the assignment

### Requirement: release gives the issue back
`lets backlog release <i> --claim <token>` SHALL require the token returned by claim. It SHALL delete only the signed-in user's claim comment matching that token. If another active claim uses the same login, it SHALL preserve that assignment. If any other active claim remains, it SHALL preserve Status. Otherwise it SHALL remove the signed-in user's assignment, set Status to Todo, and return `"result": "released"`. When the token has no matching comment by the signed-in user, release SHALL return `not-found` and write nothing; the skill SHALL ask the user to inspect the issue before retrying. It SHALL never remove another user's assignment. When a write fails, it SHALL return `"result": "failed"` with `write` set to `delete-claim`, `unassign` or `status` and `gh`'s error, as `claim` does.

#### Scenario: Released
- **WHEN** the signed-in user is assigned to #149 and its Status is In Progress
- **THEN** `release 149 --claim <token>` removes the assignment, sets Status to Todo, and returns `"result": "released"`

#### Scenario: Another user stays
- **WHEN** the signed-in user and `octocat` are assigned to #149
- **THEN** `release 149 --claim <token>` removes only the signed-in user, and `octocat` stays assigned

#### Scenario: A stale release uses the winner's login
- **WHEN** a loser has already deleted its comment and later releases its own token while the winner under the same login is active
- **THEN** release returns `not-found` and changes neither the winner's comment nor its assignment nor Status
