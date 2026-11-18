## MODIFIED Requirements

### Requirement: The config file
The user's lets config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. The repository's lets config SHALL be one YAML document at `.lets/config.yaml` in the repository root; *The repository's lets config* says how `lets` finds it. Each file SHALL be a mapping that holds `version` `3`. Each MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold `review`, `handoff` and `step`, which only `instructions` reads. The document MAY hold `go`, a mapping of the settings for `lets go`, which only `lets go questions` reads; *go-questions* says what it holds. The document MAY hold `backlog`, which only `lets backlog` reads; *lets-backlog* says what it holds. The config is the two files merged, as *The repository's value wins, leaf by leaf* says. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate review`, `lets delegate handoff` and `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

- either document is not YAML, or is not a mapping
- either document's `version` is not the number `3`
- the `delegate` in effect is not a mapping
- the `delegate.resolvers` in effect is not a list

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

#### Scenario: The repository's lets config has the old version
- **WHEN** the user's lets config is valid, and `.lets/config.yaml` holds `version: 2`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml` and says the version must be `3`

## ADDED Requirements

### Requirement: The repository's lets config
`lets` SHALL find the repository root by running `git rev-parse --show-toplevel` in the folder it runs in, and SHALL read the repository's lets config from `.lets/config.yaml` under that root. When the folder is not in a Git repository, or Git cannot answer, `lets` SHALL read only the user's lets config. When the root has no `.lets/config.yaml`, `lets` SHALL read only the user's lets config. When `.lets/config.yaml` exists but cannot be read, such as a folder or a file without read permission, the command SHALL fail as it does for a bad config, and the message SHALL name `.lets/config.yaml`. `lets` SHALL never read settings from `openspec/config.yaml`.

#### Scenario: Run from a subfolder
- **WHEN** the repository root holds `.lets/config.yaml` with `version: 3` and `delegate.resolvers: [cli]`, the user has no lets config, and the user runs `lets delegate review run --for code` from the folder `docs/` in that repository
- **THEN** it asks `cli`

#### Scenario: Outside a Git repository
- **WHEN** the folder the command runs in is not in a Git repository, and the user's lets config holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: No repository's lets config
- **WHEN** the repository has no `.lets/config.yaml`, and the user's lets config holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: Neither file
- **WHEN** the repository has no `.lets/config.yaml`, and the user has no lets config
- **THEN** `lets delegate handoff run --for apply` reads no config, and the JSON line has `"resolver":"subagent"`

#### Scenario: A repository's lets config that is a folder
- **WHEN** `.lets/config.yaml` is a folder
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml`

### Requirement: The repository's value wins, leaf by leaf
`lets` SHALL merge the two files into one config. Where both files hold a mapping at the same key, `lets` SHALL merge the two mappings key by key, at every depth. Where the repository's lets config holds any other value at a key, such as a string, a number or a list, that value SHALL replace the user's value at that key whole, and `lets` SHALL NOT join two lists. A key the repository's lets config does not hold, or holds as null, SHALL keep the user's value. Each command SHALL check only the values in effect after the merge, so a bad user's value that the repository replaces SHALL NOT stop it.

#### Scenario: The repository sets one guidance
- **WHEN** the user's lets config holds `delegate.review.plan.guidance` `Prefer gpt.` and `delegate.review.code.guidance` `Prefer claude.`, and `.lets/config.yaml` holds `version: 3` and `delegate.review.code.guidance` `Use gemini.`
- **THEN** `lets delegate review instructions --for code` prints `"guidance":"Use gemini."`, and `lets delegate review instructions --for plan` prints `"guidance":"Prefer gpt."`

#### Scenario: The repository's chain replaces the user's
- **WHEN** the user's lets config holds `delegate.resolvers: [t3, subagent]`, `.lets/config.yaml` holds `version: 3` and `delegate.resolvers: [cli]`, and `cli` declines
- **THEN** `lets delegate review run --for code` exits 2 and says every resolver declined, and neither `t3` nor `subagent` is asked

#### Scenario: A null key in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 3` and `delegate.resolvers: null`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: The repository replaces a bad user's value
- **WHEN** the user's lets config holds `version: 3` and `delegate.resolvers: [codex]`, and `.lets/config.yaml` holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`, and does not exit 2

### Requirement: A message names the file the value came from
When a `lets` message names the config file, because a value in it is bad or because the chain it lists declined, it SHALL name the file that holds that value: `.lets/config.yaml` when the value in effect came from the repository's lets config, and the user's lets config otherwise. When neither file sets the value, the message SHALL name the user's lets config.

#### Scenario: A bad resolver in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 3` and `delegate.resolvers: [codex]`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml` and `codex`, and does not name the user's lets config

#### Scenario: A bad guidance in the repository's lets config
- **WHEN** `.lets/config.yaml` holds `version: 3` and `delegate.review.code.guidance: 42`
- **THEN** `lets delegate review instructions --for code` exits 2, and stderr names `.lets/config.yaml` and `delegate.review.code.guidance`

#### Scenario: The repository's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 3` and `delegate.resolvers: []`
- **THEN** `lets delegate handoff run --for apply` exits 2, and stderr says every resolver declined and names `.lets/config.yaml`

#### Scenario: The user's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 3` and no `delegate`, and the user's lets config holds `delegate.resolvers: []`
- **THEN** `lets delegate handoff run --for apply` exits 2, and stderr says every resolver declined and names the user's lets config
