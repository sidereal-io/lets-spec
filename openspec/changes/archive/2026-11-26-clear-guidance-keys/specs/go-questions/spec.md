<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: lets go questions prints the default question mode
`lets go questions` SHALL read the `lets` config, the user's lets config and the repository's lets config merged as *delegate-config* says, and print one JSON line on stdout, `{"questions":<value>}`, then exit 0. `<value>` SHALL be the string at `go.questions` in effect after the merge. It SHALL be `null` when neither file sets it: no config file, no `go` key, a null `go`, no `go.questions`, or a null `go.questions`. The command SHALL start no session and ask no resolver.

#### Scenario: The config sets auto
- **WHEN** the file holds `version: 4` and `go.questions: auto`, and the user runs `lets go questions`
- **THEN** it exits 0, and stdout is `{"questions":"auto"}`

#### Scenario: The config sets ask
- **WHEN** the file holds `version: 4` and `go.questions: ask`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

#### Scenario: No config file
- **WHEN** no config file exists
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: No go key
- **WHEN** the file holds `version: 4` and `delegate.resolvers: [subagent]`, and no `go`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: An empty go key
- **WHEN** the file holds `version: 4` and a line `go:` with nothing under it
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: A null question mode
- **WHEN** the file holds `version: 4` and `go.questions: null`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: A go key with no question mode
- **WHEN** the file holds `version: 4` and `go.verbose: true`, and no `go.questions`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: No resolver is asked
- **WHEN** the file holds `version: 4`, `delegate.resolvers: [t3]` and `go.questions: auto`, and the user runs `lets go questions`
- **THEN** no resolver is asked to detect, run, start or finish a session

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 4` and `go.questions: auto`
- **THEN** `lets go questions` prints `{"questions":"auto"}`

#### Scenario: The repository's question mode wins
- **WHEN** the user's lets config holds `version: 4` and `go.questions: ask`, and `.lets/config.yaml` holds `version: 4` and `go.questions: auto`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"auto"}`

#### Scenario: The repository sets no question mode
- **WHEN** the user's lets config holds `version: 4` and `go.questions: ask`, and `.lets/config.yaml` holds `version: 4` and no `go`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

### Requirement: lets go questions reads only version and go
`lets go questions` SHALL ignore every key of the config but `version` and `go`, at the top level and under `go`. A `delegate` section the `lets delegate` commands would reject SHALL NOT stop it.

#### Scenario: A bad delegate chain
- **WHEN** the file holds `version: 4`, `delegate.resolvers: [codex]` and `go.questions: ask`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 4`, `go.questions: ask` and a key `go.verbose` this `lets` does not know
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

### Requirement: A bad go.questions stops the command
`lets go questions` SHALL exit 2 and print nothing on stdout in each of these cases: the `go` in effect is not a mapping; the `go.questions` in effect is not `ask` or `auto`; either document or its `version` is invalid, as *delegate-config*'s *The config file* says. Stderr SHALL name the file that holds the bad key or value, as *delegate-config*'s *A message names the file the value came from* says, and the bad key or value.

#### Scenario: A question mode lets does not know
- **WHEN** the file holds `version: 4` and `go.questions: loud`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file, `go.questions` and `loud`

#### Scenario: A question mode that is not a string
- **WHEN** the file holds `version: 4` and `go.questions: [ask]`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file and `go.questions`

#### Scenario: A go key that is not a mapping
- **WHEN** the file holds `version: 4` and `go: auto`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file and `go`

#### Scenario: The old version
- **WHEN** the file holds `version: 2` and `go.questions: ask`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the file and says the version must be `4`

#### Scenario: A bad question mode in the repository's lets config
- **WHEN** the user's lets config holds `version: 4` and `go.questions: ask`, and `.lets/config.yaml` holds `version: 4` and `go.questions: loud`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names `.lets/config.yaml`, `go.questions` and `loud`

