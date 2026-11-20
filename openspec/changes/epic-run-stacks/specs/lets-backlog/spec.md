<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: ready lists the ready issues in rank order
`lets backlog ready` SHALL return `issues`: the open issues of this repository on the Project that pass every one of these filters:

- Status is Todo.
- Kind is not Epic.
- Priority is Must, Should or Could.
- Nobody is assigned.
- No open issue blocks it, other than the issues `--met-blockers <key>,<key>` names.

It SHALL rank them Must, then Should, then Could, then by creation time, oldest first. Each issue SHALL carry `key`, `label`, `title`, `url`, `kind`, `priority` and `size`. `--only <key>,<key>` SHALL keep only the issues named. `--exclude <key>,<key>` SHALL leave out the issues named. `--met-blockers` SHALL count each issue it names as a met blocker: an issue whose every open blocker is named there passes the blocker filter, and still needs every other filter. A blocker in another repository SHALL never count as named: its key can name an issue of this repository. A key in `--only`, `--exclude` or `--met-blockers` that names no ready issue, or no blocker, SHALL be ignored. Without `--met-blockers`, an issue with an open blocker SHALL never be listed. An issue from another repository on the same Project SHALL never be listed.

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

#### Scenario: A blocker named as met
- **WHEN** #280 is Todo, Must and unassigned, its only open blocker is #279, and a user runs `lets backlog ready --met-blockers 279`
- **THEN** `issues` holds #280

#### Scenario: One open blocker not named
- **WHEN** #281 is Todo, Must and unassigned, its open blockers are #279 and #280, and a user runs `lets backlog ready --met-blockers 279`
- **THEN** `issues` does not hold #281

#### Scenario: A met blocker does not skip the other filters
- **WHEN** #282's only open blocker is #279, #282 is assigned to `octocat`, and a user runs `lets backlog ready --met-blockers 279`
- **THEN** `issues` does not hold #282

#### Scenario: A blocker in another repository is never met
- **WHEN** #283's only open blocker is `other-org/tools#279`, and a user runs `lets backlog ready --met-blockers 279`
- **THEN** `issues` does not hold #283
