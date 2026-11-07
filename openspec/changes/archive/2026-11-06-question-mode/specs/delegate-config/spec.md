## MODIFIED Requirements

### Requirement: The config file
The config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. It SHALL be a mapping that holds `version` `3`. It MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold `review`, `handoff` and `step`, which only `instructions` reads. The document MAY hold `go`, a mapping of the settings for `lets go`, which only `lets go questions` reads; *go-questions* says what it holds. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate review`, `lets delegate handoff` and `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

- the document is not YAML, or is not a mapping
- `version` is not the number `3`
- `delegate` is present and is not a mapping
- `delegate.resolvers` is present and is not a list

#### Scenario: A valid config
- **WHEN** the file holds `version: 3` and `delegate.resolvers` listing `t3` and `subagent`, and `t3` declines
- **THEN** `lets delegate review run --for code` reads it without error, and asks `t3`, then the default, in that order

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: The file under the home folder
- **WHEN** `XDG_CONFIG_HOME` is the empty string, and `~/.config/lets/config.yaml` holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: An invalid config
- **WHEN** the file's `delegate.resolvers` holds `bin/old-resolver`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `bin/old-resolver`

#### Scenario: The old version
- **WHEN** the file holds `version: 2`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and says the version must be `3`

#### Scenario: A delegate key that is not a mapping
- **WHEN** the file holds `version: 3` and `delegate: [t3]`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `delegate`

#### Scenario: An empty delegate key
- **WHEN** the file holds `version: 3` and a line `delegate:` with nothing under it
- **THEN** `lets delegate handoff run --for apply` reads it without error, and the JSON line has `"resolver":"subagent"`

#### Scenario: Resolvers that are not a list
- **WHEN** the file holds `version: 3` and `delegate.resolvers: t3`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `delegate.resolvers`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 3`, a valid `delegate.resolvers`, a top-level key `sync`, and a key `telemetry` under `delegate`, which this `lets` does not know
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: run ignores the guidance
- **WHEN** the file holds `delegate.review.code.guidance: 42`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: step run ignores the step guidance
- **WHEN** the file holds `delegate.step.build.guidance: 42`
- **THEN** `lets delegate step run --for build` reads it without error and asks the listed resolvers

#### Scenario: A go key under a delegate command
- **WHEN** the file holds `version: 3`, a valid `delegate.resolvers`, and `go.questions: loud`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers
