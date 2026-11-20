## ADDED Requirements

### Requirement: waves sorts the named items into waves
`lets backlog waves --only <keys>` SHALL read each item that `--only` names, and return `waves`: a list of waves, in order, each with a list of `stories`. Every named item SHALL be in exactly one wave, once, even when `--only` names it twice. Within a wave, the stories SHALL keep the order `--only` gives. Each story SHALL carry its `key` and `label`, and `waitsFor` and `reason`. For a story in the first wave, `waitsFor` and `reason` SHALL be `null`. For a story in a later wave, `waitsFor` SHALL hold the `key` and `label` of the story it waits for, and `reason` SHALL say why, as *waves places each item in the earliest wave it fits* says. `--only` SHALL be required: without it, or with an empty key, the command is a usage error and exits 2. An item that does not exist SHALL return the error `not-found`. The command SHALL write nothing to the backlog. `lets backlog --help` SHALL list `waves` and its result.

#### Scenario: Two independent items
- **WHEN** a user runs `lets backlog waves --only 283,285`, neither blocks the other, #283's **Relevant code** names `skills/lets-shape/SKILL.md` and #285's names `lets/src/backlog/commands.ts`
- **THEN** stdout holds `{"waves":[{"stories":[{"key":"283","label":"#283","waitsFor":null,"reason":null},{"key":"285","label":"#285","waitsFor":null,"reason":null}]}]}`, and the exit code is 0

#### Scenario: A key named twice
- **WHEN** a user runs `lets backlog waves --only 283,283`
- **THEN** `waves` holds #283 once

#### Scenario: No --only
- **WHEN** a user runs `lets backlog waves` with no `--only`
- **THEN** the exit code is 2, and stdout is empty

#### Scenario: An item that does not exist
- **WHEN** a user runs `lets backlog waves --only 283,99999`, and no issue #99999 exists
- **THEN** it returns `"error": "not-found"`, and the exit code is 1

#### Scenario: The help lists waves
- **WHEN** a user runs `lets backlog --help`
- **THEN** the help names `waves` and `{ waves: [{ stories: [{ key, label, waitsFor, reason }] }] }`

### Requirement: waves orders an item after each of its blockers
In `lets backlog waves`, a named item SHALL be another named item's blocker when the other item's `blockedBy`, as `lets backlog item` returns it, holds an open issue whose `key` and `label` are those of the named item. A closed blocker, an issue that `--only` does not name, and an issue in another repository whose `key` matches a named item's SHALL not count. Each item SHALL go in a later wave than each of its blockers, so a chain of these links orders every item along it. A chain through an issue that `--only` does not name SHALL order nothing.

#### Scenario: A chain of blockers
- **WHEN** a user runs `lets backlog waves --only 1,2,3`, #2 is blocked by the open #1, #3 is blocked by the open #2, and no two of them name overlapping paths
- **THEN** wave 1 holds #1, wave 2 holds #2, and wave 3 holds #3

#### Scenario: A chain through an issue not named
- **WHEN** a user runs `lets backlog waves --only 1,3`, #2 is blocked by #1, #3 is blocked by #2, and no two of them name overlapping paths
- **THEN** wave 1 holds #1 and #3, and there is no wave 2

#### Scenario: A closed blocker
- **WHEN** a user runs `lets backlog waves --only 1,2`, #2's only blocker is #1, #1 is closed, and they name no overlapping paths
- **THEN** wave 1 holds #1 and #2

#### Scenario: A blocker in another repository with the same number
- **WHEN** a user runs `lets backlog waves --only 7,9`, #9 is blocked by the open `acme/lib#7`, whose `key` is `7` and whose `label` is `acme/lib#7`, and #7 and #9 name no overlapping paths
- **THEN** wave 1 holds #7 and #9

### Requirement: waves reads an item's paths from its packet's Relevant code
`lets backlog waves` SHALL read an item's paths from the `- **Relevant code**:` list item of its body: that line, and the indented lines that continue it. A path SHALL be a code span with no space in it that holds a `/`, or that ends in a file extension: a `.` followed by letters or digits, such as `README.md`. A leading `./` SHALL be dropped from a path, so `./README.md` and `README.md` are the same path. Every other code span, such as `ready --only` or `subIssues`, SHALL be ignored, and so SHALL all text outside code spans, such as section names in parentheses. Two paths SHALL overlap when they are the same once a trailing `/` is dropped, or when one, with a `/` after it, starts the other: one is a folder that holds the other. Two items SHALL overlap when any of their paths overlap. An item SHALL overlap every other item when its body has no **Relevant code** list item, or its **Relevant code** names no path, such as `new`.

#### Scenario: Section names and other code spans are ignored
- **WHEN** #279's body holds ``- **Relevant code**: `skills/lets-go/SKILL.md` (*Check the issue*), `lets/src/backlog/commands.ts` (`ready --only`, `subIssues`)``
- **THEN** waves reads the paths `skills/lets-go/SKILL.md` and `lets/src/backlog/commands.ts` for #279, and no other

#### Scenario: Two items name the same file
- **WHEN** #283's **Relevant code** holds ``- **Relevant code**: `skills/lets-go/references/shape.md` (*What shape runs*)``, and #287's holds ``- **Relevant code**: `skills/lets-go/references/shape.md` (*Pick the first ready story*)``
- **THEN** #283 and #287 overlap

#### Scenario: A folder holds a file
- **WHEN** #5's **Relevant code** names `lets/src/backlog/`, and #6's names `lets/src/backlog/commands.ts`
- **THEN** #5 and #6 overlap

#### Scenario: A folder name that only starts another name
- **WHEN** #5's **Relevant code** names `skills/lets-go`, and #6's names `skills/lets-go-extra/SKILL.md`
- **THEN** #5 and #6 do not overlap

#### Scenario: A file name with no folder
- **WHEN** #5's **Relevant code** names `README.md`, and #6's names `README.md` too
- **THEN** #5 and #6 overlap

#### Scenario: A packet that names no path
- **WHEN** #2's **Relevant code** is `new`
- **THEN** #2 overlaps every other named item

### Requirement: waves places each item in the earliest wave it fits
`lets backlog waves` SHALL place the items one at a time. Each time, it SHALL take the first item, in the order `--only` gives, that is not placed yet and whose blockers are all placed. It SHALL put that item in the earliest wave after every wave that holds one of its blockers. While the item overlaps a story already in that wave, it SHALL move the item to the next wave, and open a new wave after the last one when it needs to.

A story that this sort placed in a later wave SHALL carry the story it waits for in the wave just before its own, and the reason:

- When that wave holds one of its blockers, `waitsFor` SHALL be the first such blocker in that wave, and `reason` SHALL be `blocked by <label>`, such as `blocked by #285`.
- Otherwise `waitsFor` SHALL be the first story in that wave that the item overlaps. When the item names no path, `reason` SHALL be `its packet names no Relevant code`. When that story names no path, `reason` SHALL be `<label>'s packet names no Relevant code`. Otherwise take the item's first path, in its packet's order, that overlaps a path of that story, and the first such path of that story. When the two are the same, `reason` SHALL be `both name <path>`. When one holds the other, `reason` SHALL be `<folder> holds <path>`.

When items are left that cannot be placed, because their blockers form a loop or depend on one, waves SHALL place them in the order `--only` gives, each in a new wave of its own after the last one. For each of these that is not in the first wave, `waitsFor` SHALL be its first blocker, in the order `--only` gives, that was left, and `reason` SHALL be `blocked by <label>, through a loop of blocked-by links`. That blocker can be in a later wave than the item's own.

#### Scenario: The waves of an epic
- **WHEN** a user runs `lets backlog waves --only 283,285,286,287`, #283's **Relevant code** names `skills/lets-shape/SKILL.md` and `skills/lets-go/references/shape.md`, #285's names `lets/src/backlog/commands.ts`, #286 is blocked by the open #285 and names `lets/src/delegate/step.ts`, and #287 names `skills/lets-go/references/shape.md`
- **THEN** wave 1 holds #283 and #285, with `null` reasons, and wave 2 holds #286, waiting for #285 with `blocked by #285`, then #287, waiting for #283 with `both name skills/lets-go/references/shape.md`

#### Scenario: A blocker later in --only
- **WHEN** a user runs `lets backlog waves --only 10,11`, #10 is blocked by the open #11, and they name no overlapping paths
- **THEN** wave 1 holds #11, and wave 2 holds #10, waiting for #11 with `blocked by #11`

#### Scenario: An item that fits an earlier wave
- **WHEN** a user runs `lets backlog waves --only 1,2,3`, #1 and #2 both name `README.md`, #3 names `lets/src/main.ts`, and none of them is blocked
- **THEN** wave 1 holds #1 and #3, and wave 2 holds #2

#### Scenario: An item whose packet names no path
- **WHEN** a user runs `lets backlog waves --only 1,2,3`, #2's **Relevant code** is `new`, and #1 and #3 name no overlapping paths
- **THEN** wave 1 holds #1 and #3, and wave 2 holds only #2, waiting for #1 with `its packet names no Relevant code`

#### Scenario: An item after one whose packet names no path
- **WHEN** a user runs `lets backlog waves --only 1,2`, and #1's body has no **Relevant code** list item
- **THEN** wave 1 holds #1, and wave 2 holds #2, waiting for #1 with `#1's packet names no Relevant code`

#### Scenario: A folder holds a path
- **WHEN** a user runs `lets backlog waves --only 5,6`, #5 names `lets/src/backlog/`, and #6 names `lets/src/backlog/commands.ts`
- **THEN** wave 2 holds #6, waiting for #5 with `lets/src/backlog/ holds lets/src/backlog/commands.ts`

#### Scenario: A loop of blockers
- **WHEN** a user runs `lets backlog waves --only 7,8`, #7 is blocked by the open #8, #8 is blocked by the open #7, and they name no overlapping paths
- **THEN** wave 1 holds #7, with `null` reasons, and wave 2 holds #8, waiting for #7 with `blocked by #7, through a loop of blocked-by links`

#### Scenario: A loop after a placed item
- **WHEN** a user runs `lets backlog waves --only 1,7,8`, #1 is not blocked, #7 is blocked by the open #8, #8 is blocked by the open #7, and no two of them name overlapping paths
- **THEN** wave 1 holds #1, wave 2 holds #7, waiting for #8 with `blocked by #8, through a loop of blocked-by links`, and wave 3 holds #8, waiting for #7 with `blocked by #7, through a loop of blocked-by links`
