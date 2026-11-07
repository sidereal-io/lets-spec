## Purpose

Says how `lets go questions` reads the user's default question mode, `go.questions`, from the `lets` config, so that `lets-go` can use it in place of the Kind's default.

## ADDED Requirements

### Requirement: lets go questions prints the default question mode
`lets go questions` SHALL read the `lets` config, the file *delegate-config* names, and print one JSON line on stdout, `{"questions":<value>}`, then exit 0. `<value>` SHALL be the string at `go.questions` when the file holds one. It SHALL be `null` when there is no config file, no `go` key, a null `go`, no `go.questions`, or a null `go.questions`. The command SHALL start no session and ask no resolver.

#### Scenario: The config sets auto
- **WHEN** the file holds `version: 3` and `go.questions: auto`, and the user runs `lets go questions`
- **THEN** it exits 0, and stdout is `{"questions":"auto"}`

#### Scenario: The config sets ask
- **WHEN** the file holds `version: 3` and `go.questions: ask`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

#### Scenario: No config file
- **WHEN** no config file exists
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: No go key
- **WHEN** the file holds `version: 3` and `delegate.resolvers: [subagent]`, and no `go`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: An empty go key
- **WHEN** the file holds `version: 3` and a line `go:` with nothing under it
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: A null question mode
- **WHEN** the file holds `version: 3` and `go.questions: null`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: A go key with no question mode
- **WHEN** the file holds `version: 3` and `go.verbose: true`, and no `go.questions`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":null}`

#### Scenario: No resolver is asked
- **WHEN** the file holds `version: 3`, `delegate.resolvers: [t3]` and `go.questions: auto`, and the user runs `lets go questions`
- **THEN** no resolver is asked to detect, run, start or finish a session

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 3` and `go.questions: auto`
- **THEN** `lets go questions` prints `{"questions":"auto"}`

### Requirement: lets go questions reads only version and go
`lets go questions` SHALL ignore every key of the config but `version` and `go`, at the top level and under `go`. A `delegate` section the `lets delegate` commands would reject SHALL NOT stop it.

#### Scenario: A bad delegate chain
- **WHEN** the file holds `version: 3`, `delegate.resolvers: [codex]` and `go.questions: ask`
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 3`, `go.questions: ask` and a key `go.verbose` this `lets` does not know
- **THEN** `lets go questions` exits 0, and stdout is `{"questions":"ask"}`

### Requirement: A bad go.questions stops the command
`lets go questions` SHALL exit 2 and print nothing on stdout in each of these cases: `go` is present and is not a mapping; `go.questions` is present and is not `ask` or `auto`; the document or its `version` is invalid, as *delegate-config*'s *The config file* says. Stderr SHALL name the config file and the bad key or value.

#### Scenario: A question mode lets does not know
- **WHEN** the file holds `version: 3` and `go.questions: loud`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file, `go.questions` and `loud`

#### Scenario: A question mode that is not a string
- **WHEN** the file holds `version: 3` and `go.questions: [ask]`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file and `go.questions`

#### Scenario: A go key that is not a mapping
- **WHEN** the file holds `version: 3` and `go: auto`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the config file and `go`

#### Scenario: The old version
- **WHEN** the file holds `version: 2` and `go.questions: ask`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr names the file and says the version must be `3`

### Requirement: The help names the key
`lets go --help` SHALL name `questions`, and `lets go questions --help` SHALL name the config file, the key `go.questions`, the two values, and the exit codes 0 and 2.

#### Scenario: The group's help
- **WHEN** the user runs `lets go --help`
- **THEN** the output names `questions`

#### Scenario: The command's help
- **WHEN** the user runs `lets go questions --help`
- **THEN** the output names `config.yaml`, `go.questions`, `ask` and `auto`, and the exit codes `0` and `2`
