## Purpose

Give agents writing task lists explicit size limits and file-sharing rules so that planning stops or permits concurrency consistently.

## ADDED Requirements

### Requirement: Stop before writing an oversized task list

The tasks skill SHALL retain the five-to-twelve task range. When the planned list exceeds twelve tasks, it SHALL stop without writing or committing `tasks.md`, report the task count and name the slice to move to a new story. It SHALL leave the split decision to the user in the brainstorm.

#### Scenario: Thirteen behaviors need thirteen tasks
- **WHEN** task planning identifies thirteen tasks
- **THEN** it reports thirteen and a proposed slice, writes or commits no tasks.md, and waits for the user's split decision in the brainstorm

#### Scenario: Twelve tasks fit
- **WHEN** the plan has twelve tasks and no other stop condition applies
- **THEN** task planning can write the task list

### Requirement: Resume tasks after the split decision

The tasks skill SHALL direct the agent to rerun task planning on the smaller story after the user decides the split in the brainstorm.

#### Scenario: User decides the split
- **WHEN** the user has decided the split in the brainstorm
- **THEN** the next action is to rerun task planning on the smaller story

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
- **THEN** tasks in C need not compare files against tasks in A or B for parallel eligibility because those sections cannot run at the same time

#### Scenario: Minimal flow writes tasks
- **WHEN** the minimal flow produces a task list
- **THEN** it continues to prohibit parallel tags

#### Scenario: A prerequisite compares against its descendants
- **WHEN** section C depends on B and B depends on A
- **THEN** tasks in A need not compare files against tasks in B or C for parallel eligibility

#### Scenario: Sections share only a prerequisite
- **WHEN** sections B and C both depend on A but neither has a dependency chain to the other
- **THEN** tasks in B and C compare files against each other for parallel eligibility
