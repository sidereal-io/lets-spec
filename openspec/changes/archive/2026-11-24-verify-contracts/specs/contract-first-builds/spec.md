<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## Purpose

Say how the build step works each task: it fixes the contracts first, writes
the code next, and tests the behavior at public boundaries last, instead of
writing a failing unit test before each piece of code.

## ADDED Requirements

### Requirement: Ship the contract-first skill as written

Let's Spec SHALL ship a skill named `lets-verify-contracts` whose `SKILL.md`
is the source text in issue #304, word for word. It SHALL ship no reference
files with it. Its three phases are Constrain (contracts and types),
Synthesize (code) and Verify (black-box and invariant tests).

#### Scenario: The skill matches the source text
- **WHEN** a reader compares `skills/lets-verify-contracts/SKILL.md` with the fenced source text in issue #304
- **THEN** the two are identical, from the `---` front matter through the last exit criterion

#### Scenario: The skill has no references
- **WHEN** a reader lists `skills/lets-verify-contracts/`
- **THEN** it holds `SKILL.md` and nothing else

### Requirement: Retire the test-first skill

Let's Spec SHALL ship no skill named `lets-test-first`, in either flow. No
skill, schema, `flows.json` entry, `flake.nix` check or README table SHALL
name `lets-test-first`. A test SHALL name it only to check that it is gone.
Archived changes and decision records keep their text.

#### Scenario: A release is built
- **WHEN** the release for the standard flow or the minimal flow is built
- **THEN** its skills include `lets-verify-contracts` and do not include `lets-test-first`

#### Scenario: A project syncs the new release
- **WHEN** a project that has `.agents/skills/lets-test-first/` from an earlier release runs `lets sync` with this release
- **THEN** `.agents/skills/lets-test-first/` no longer exists and `.agents/skills/lets-verify-contracts/SKILL.md` does

#### Scenario: Shipped text names the old skill
- **WHEN** a reader searches `skills/`, `schemas/`, `flows.json`, `flake.nix` and `README.md` for `lets-test-first`
- **THEN** the search finds nothing

### Requirement: Build each task contract first

The apply instruction of `lets-standard` and of `lets-minimal` SHALL tell
the build agent to work each task through the three phases of the
`lets-verify-contracts` skill: contracts first, then the code, then
black-box and invariant tests at public boundaries. The `lets-build` skill
SHALL name `lets-verify-contracts` as the skill the apply instruction uses.
Neither SHALL ask for a failing test before the code is written.

#### Scenario: The standard apply instruction is read
- **WHEN** a build agent reads the apply instruction from `openspec instructions apply` on a `lets-standard` change
- **THEN** it names the `lets-verify-contracts` skill and its three phases, and does not say "watch it fail" or "test-first"

#### Scenario: The minimal apply instruction is read
- **WHEN** a build agent reads the apply instruction on a `lets-minimal` change
- **THEN** it names the `lets-verify-contracts` skill and its three phases, and does not say "watch it fail" or "test-first"

#### Scenario: The build skill is read
- **WHEN** a reader opens `skills/lets-build/SKILL.md`
- **THEN** its description and its Apply section name `lets-verify-contracts`, and neither says "test-first"

### Requirement: Keep expected values independent and external clients replaceable

Both apply instructions SHALL say, in one paragraph, that a test's expected
values must not come from the code's own logic, and that code takes its
external clients as inputs so a test can substitute them.

#### Scenario: A build agent reads the test rules
- **WHEN** a build agent reads either apply instruction
- **THEN** it finds that expected values must not be computed by the code under test, and that external clients are passed in so a test can replace them

### Requirement: Constrain a project that has no static checks

Both apply instructions SHALL say that Phase 1 runs the static checks the
project has, such as a type checker or a linter. When the project has none,
Phase 1 SHALL end once the contracts are written down, as signatures, usage
text or spec scenarios, and the skill's first exit criterion, on type checks
and linting, is then met. Phase 3's failing black-box test then shows what
the code must do.

#### Scenario: The project has a type checker
- **WHEN** a build agent works a task in a project whose checks include a type checker
- **THEN** the apply instruction tells it to end Phase 1 by running that type checker against the new contracts

#### Scenario: The project has no compiler or type checker
- **WHEN** a build agent works a task in a project of shell scripts tested with bats and no linter
- **THEN** the apply instruction tells it that Phase 1 ends once the contracts are written down, that the skill's first exit criterion is then met, and that the failing black-box test in Phase 3 shows what the code must do

### Requirement: Check requirement coverage per task, and in full at the end

Both apply instructions SHALL say that, when a task ends, the skill's
requirement-coverage check covers only the spec requirements that task
builds. The integration task, which runs last, SHALL check that every
requirement in the change's specs has at least one black-box or invariant
test.

#### Scenario: A task covers some requirements
- **WHEN** a build agent finishes a task that builds two of the change's five requirements
- **THEN** the apply instruction asks it to check that those two have a black-box or invariant test, and not the other three

#### Scenario: The integration task ends
- **WHEN** a build agent finishes the integration task
- **THEN** the apply instruction asks it to check that every requirement in the change's specs has a black-box or invariant test
