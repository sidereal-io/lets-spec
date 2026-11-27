<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The default answers when nothing else does
When no config file exists, or the config holds no `delegate.resolvers`, `lets delegate` SHALL ask the default, `subagent`, which is built into `lets`. When the config holds `delegate.resolvers`, `lets delegate` SHALL ask the default only where the chain holds the entry `subagent`, in that position, and only when every resolver before it declines.

#### Scenario: No config
- **WHEN** no config file exists, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A config with no delegate section
- **WHEN** the config holds only `version: 4`, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A delegate section with no chain
- **WHEN** the config holds `version: 4` and `delegate.review-build.guidance`, but no `delegate.resolvers`, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A listed resolver answers before the default
- **WHEN** the config lists a resolver that answers a review with a final message, then `subagent`
- **THEN** `lets delegate review run --for review-build` prints that message and exits 0, and the default is not asked

#### Scenario: A listed resolver declines and the default is next
- **WHEN** the config lists a resolver that declines, then `subagent`
- **THEN** `lets delegate review instructions --for review-build` prints a JSON line with `"resolver":"subagent"`

#### Scenario: The chain leaves the default out
- **WHEN** the config lists one resolver that declines, and no `subagent` entry
- **THEN** `lets delegate step run --for build --name build-x` with the other required options exits 2, and `.workspace/lets-delegate/build-x.prompt.md` is not written

#### Scenario: The default runs with lets's own Node
- **WHEN** the config lists `subagent`, no `node` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x` with the other required options
- **THEN** it exits 3, `.workspace/lets-delegate/build-x.prompt.md` holds the prompt, and stderr contains "subagent"

### Requirement: The default runs no review
When the default answers a review, `lets delegate review run` SHALL exit 3, print nothing on stdout, and start no process.

#### Scenario: A review with no resolver installed
- **WHEN** the default answers `lets delegate review run --for review-build --name x --prompt-file p.md --source-family claude --effort high --model gpt`
- **THEN** the command exits 3, stdout is empty, and no process is started

#### Scenario: A family CLI is on PATH
- **WHEN** the default answers a review, and `codex`, `claude` and `agy` are all on `PATH`
- **THEN** the command exits 3, and none of them is run

### Requirement: Every lets carries the default
The `lets` of the release tarball, of the Nix `lets` package and of the repository's source tree SHALL each answer as the default with nothing else installed or configured. The default SHALL be part of `lets` itself, and SHALL need no file beside it.

#### Scenario: The release tarball
- **WHEN** a user unpacks the release tarball, and runs its `bin/lets delegate review instructions --for review-build` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The Nix package
- **WHEN** a user runs the Nix package's `lets delegate review instructions --for review-build` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The source tree
- **WHEN** a developer runs `lets/bin/lets delegate review instructions --for review-build` in this repository with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The program beside lets is gone
- **WHEN** the release folder has no `resolvers/` folder, nothing else is configured, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

### Requirement: The default answers wherever lets runs
The default, `subagent`, SHALL answer wherever `lets` runs, inside a harness or not, and SHALL never decline. Asked which models it can run, it SHALL list none.

#### Scenario: Instructions in a plain terminal
- **WHEN** no config file exists, the command runs outside any harness, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it exits 0 and prints one JSON line with `"resolver":"subagent"` and `"options":[]`
