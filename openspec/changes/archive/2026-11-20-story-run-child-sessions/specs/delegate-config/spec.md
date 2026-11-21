## MODIFIED Requirements

### Requirement: Every delegation names its intent
`instructions` and `run` SHALL require `--for <intent>`. Under `review`, the intent SHALL be `plan` or `code`. Under `handoff`, it SHALL be `apply`. Under `step`, it SHALL be one of the five steps, `shape`, `plan`, `review-plan`, `build` or `review-build`, or `story`, which runs a story run, not a step. Without `--for`, or with any other value, they SHALL exit 2, name `--for` on stderr, and ask no resolver.

#### Scenario: No intent
- **WHEN** the user runs `lets delegate handoff run --name build-x --prompt-file p.md --model claude`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: An intent from the other strategy
- **WHEN** the user runs `lets delegate review instructions --for apply`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: The one handoff intent
- **WHEN** the user runs `lets delegate handoff run --for apply --name build-x --prompt-file p.md --model claude`
- **THEN** the resolver is asked to start an interactive session

#### Scenario: Each step is an intent
- **WHEN** the user runs `lets delegate step instructions --for <step>` once for each of `shape`, `plan`, `review-plan`, `build` and `review-build`
- **THEN** each exits 0, and its JSON line has `"for"` equal to that step

#### Scenario: The story intent
- **WHEN** the user runs `lets delegate step instructions --for story`
- **THEN** it exits 0, and its JSON line has `"for":"story"`

#### Scenario: The story intent under review
- **WHEN** the user runs `lets delegate review instructions --for story`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: A review intent under step
- **WHEN** the user runs `lets delegate step instructions --for code`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: An old step name under step
- **WHEN** the user runs `lets delegate step instructions --for apply`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: The step strategy's help names the story intent
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names the five steps, and says that `story` runs a story run, not a step
