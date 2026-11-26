## MODIFIED Requirements

### Requirement: The default answers when nothing else does
When no config file exists, or the config holds no `delegate.resolvers`, `lets delegate` SHALL ask the default, `subagent`, which is built into `lets`. When the config holds `delegate.resolvers`, `lets delegate` SHALL ask the default only where the chain holds the entry `subagent`, in that position, and only when every resolver before it declines.

#### Scenario: No config
- **WHEN** no config file exists, and the user runs `lets delegate review instructions --for code`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A config with no delegate section
- **WHEN** the config holds only `version: 3`, and the user runs `lets delegate review instructions --for code`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A delegate section with no chain
- **WHEN** the config holds `version: 3` and `delegate.review.code.guidance`, but no `delegate.resolvers`, and the user runs `lets delegate review instructions --for code`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A listed resolver answers before the default
- **WHEN** the config lists a resolver that answers a review with a final message, then `subagent`
- **THEN** `lets delegate review run --for code` prints that message and exits 0, and the default is not asked

#### Scenario: A listed resolver declines and the default is next
- **WHEN** the config lists a resolver that declines, then `subagent`
- **THEN** `lets delegate review instructions --for code` prints a JSON line with `"resolver":"subagent"`

#### Scenario: The chain leaves the default out
- **WHEN** the config lists one resolver that declines, and no `subagent` entry
- **THEN** `lets delegate step run --for build --name build-x` with the other required options exits 2, and `.workspace/lets-delegate/build-x.prompt.md` is not written

#### Scenario: The default runs with lets's own Node
- **WHEN** the config lists `subagent`, no `node` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x` with the other required options
- **THEN** it exits 3, `.workspace/lets-delegate/build-x.prompt.md` holds the prompt, and stderr contains "subagent"

### Requirement: Every lets carries the default
The `lets` of the release tarball, of the Nix `lets` package and of the repository's source tree SHALL each answer as the default with nothing else installed or configured. The default SHALL be part of `lets` itself, and SHALL need no file beside it.

#### Scenario: The release tarball
- **WHEN** a user unpacks the release tarball, and runs its `bin/lets delegate review instructions --for code` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The Nix package
- **WHEN** a user runs the Nix package's `lets delegate review instructions --for code` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The source tree
- **WHEN** a developer runs `lets/bin/lets delegate review instructions --for code` in this repository with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The program beside lets is gone
- **WHEN** the release folder has no `resolvers/` folder, nothing else is configured, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

## REMOVED Requirements

### Requirement: The default's handoff hands the prompt back
**Reason**: `lets delegate handoff` is gone. Its last caller, the `lets-build` offer, went with ADR-018, and `lets-go` runs every step through `lets delegate step`.
**Migration**: Run the work as a `lets-go` step. When no resolver runs steps, `lets delegate step run` saves the prompt to `.workspace/lets-delegate/<name>.prompt.md`, as *The default's step saves the prompt and refuses* says, and `lets-go` runs it in a subagent.

### Requirement: The default's handoff names no CLI
**Reason**: `lets delegate handoff` is gone, so the default gives no handoff instructions.
**Migration**: None. No other command prints handoff instructions.
