<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

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
