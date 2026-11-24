# Task planning

## Purpose

Give agents writing task lists explicit size limits and file-sharing rules so that planning stops or permits concurrency consistently.

## Requirements

### Requirement: Stop before writing an oversized task list

The tasks skill SHALL retain the five-to-twelve task range. When the planned list exceeds twelve tasks, it SHALL stop without writing or committing `tasks.md`, report the task count and name the slice to move to a new story. It SHALL leave the split decision to the user in the brainstorm.

#### Scenario: Thirteen behaviors need thirteen tasks
- **WHEN** task planning identifies thirteen tasks
- **THEN** it reports thirteen and a proposed slice, writes or commits no tasks.md, and waits for the user's split decision in the brainstorm

#### Scenario: Twelve tasks fit
- **WHEN** the plan has twelve tasks and no other stop condition applies
- **THEN** task planning can write the task list

### Requirement: Resume tasks after the split decision

After the user decides the split in the brainstorm, task planning SHALL run again on the smaller story.

#### Scenario: User decides the split
- **WHEN** the user has decided the split in the brainstorm
- **THEN** task planning runs again on the smaller story

### Requirement: Compare all concurrently eligible tasks for file sharing

A task SHALL qualify for `[parallel]` only when it shares no files with any other task that could run at the same time. The comparison SHALL include every other task in its section and every task in other sections with no `depends-on` chain between the two sections. Direct and transitive dependency chains in either direction SHALL exclude those other sections from the comparison. Tag syntax, section dependencies and the minimal flow's prohibition on parallel tags SHALL remain unchanged.

#### Scenario: Nonadjacent tasks share a file
- **WHEN** the first and third tasks in one section both edit the same file and the second edits a different file
- **THEN** neither the first nor the third qualifies for a parallel tag

#### Scenario: Independent sections share a file
- **WHEN** tasks in two sections share a file and no dependency chain connects the sections
- **THEN** those tasks do not qualify for parallel tags

#### Scenario: A dependency chain orders sections
- **WHEN** section C depends on B and B depends on A
- **THEN** tasks in A, B and C need not compare files against the other two sections for parallel eligibility because the dependency chains prevent them running at the same time

#### Scenario: Minimal flow writes tasks
- **WHEN** the minimal flow produces a task list
- **THEN** it continues to prohibit parallel tags

#### Scenario: Sections share only a prerequisite
- **WHEN** sections B and C both depend on A but neither has a dependency chain to the other
- **THEN** tasks in B and C compare files against each other for parallel eligibility

### Requirement: Size a task as one behavior through contract, code and test

The tasks skill SHALL define one task as one behavior, taken through all
three phases of the `lets-verify-contracts` skill: its contract, then its
code, then its black-box test. It SHALL not split a behavior's phases into
separate tasks. It SHALL keep the shared-contracts-first section, and SHALL
not describe a task as a red-green cycle.

#### Scenario: A behavior is planned
- **WHEN** task planning plans "return a CSV file from GET /export for a signed-in user"
- **THEN** it writes one task that covers the endpoint's contract, its code and its black-box test, not three tasks

#### Scenario: Shared types come first
- **WHEN** several behaviors depend on one new interface
- **THEN** task planning puts that interface in a first, sequential section of shared contracts

#### Scenario: The skill is read for red-green wording
- **WHEN** a reader searches `skills/lets-write-tasks/SKILL.md` for "red-green" and "test-first"
- **THEN** the search finds neither

### Requirement: Verify a task with its black-box test

Each task's verify command SHALL run that task's black-box or invariant
test. A task in the shared-contracts section SHALL instead verify with the
project's type check or other static check. The integration task SHALL
verify with the whole suite.

#### Scenario: A behavior task's verify command
- **WHEN** task planning writes the verify command for a behavior task
- **THEN** the command runs the black-box test that task adds, such as `pnpm test -- export`

#### Scenario: A shared-contracts task's verify command
- **WHEN** task planning writes the verify command for a task that only adds shared types
- **THEN** the command runs the project's type check or static check, not a behavior test

### Requirement: Check requirement coverage in the integration task

The tasks skill SHALL say that each task checks coverage only for the spec
requirements it builds, and that the integration task checks that every
requirement in the change's specs has at least one black-box or invariant
test.

#### Scenario: The integration task is written
- **WHEN** task planning writes the last, integration task
- **THEN** the task says to check that every requirement in the change's specs has a black-box or invariant test
