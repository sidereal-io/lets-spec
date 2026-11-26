<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The default answers when nothing else does
When no config file exists, or the config holds no `delegate.resolvers`, `lets delegate` SHALL ask the default, `subagent`, which is built into `lets`. When the config holds `delegate.resolvers`, `lets delegate` SHALL ask the default only where the chain holds the entry `subagent`, in that position, and only when every resolver before it declines.

#### Scenario: No config
- **WHEN** no config file exists, and the user runs `lets delegate review instructions --for code`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A config with no delegate section
- **WHEN** the config holds only `version: 4`, and the user runs `lets delegate review instructions --for code`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A delegate section with no chain
- **WHEN** the config holds `version: 4` and `delegate.review-build.guidance`, but no `delegate.resolvers`, and the user runs `lets delegate review instructions --for code`
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
