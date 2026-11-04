## Purpose

Says how `lets go level` reads the user's default interactivity level, `go.level`, from the `lets` config, so that `lets-go` can use it in place of the Kind's default.

## ADDED Requirements

### Requirement: lets go level prints the default level
`lets go level` SHALL read the `lets` config, the file *delegate-config* names, and print one JSON line on stdout, `{"level":<value>}`, then exit 0. `<value>` SHALL be the string at `go.level` when the file holds one. It SHALL be `null` when there is no config file, no `go` key, a null `go`, no `go.level`, or a null `go.level`. The command SHALL start no session and ask no resolver.

#### Scenario: The config sets recommend
- **WHEN** the file holds `version: 3` and `go.level: recommend`, and the user runs `lets go level`
- **THEN** it exits 0, and stdout is `{"level":"recommend"}`

#### Scenario: The config sets ask
- **WHEN** the file holds `version: 3` and `go.level: ask`
- **THEN** `lets go level` exits 0, and stdout is `{"level":"ask"}`

#### Scenario: No config file
- **WHEN** no config file exists
- **THEN** `lets go level` exits 0, and stdout is `{"level":null}`

#### Scenario: No go key
- **WHEN** the file holds `version: 3` and `delegate.resolvers: [subagent]`, and no `go`
- **THEN** `lets go level` exits 0, and stdout is `{"level":null}`

#### Scenario: An empty go key
- **WHEN** the file holds `version: 3` and a line `go:` with nothing under it
- **THEN** `lets go level` exits 0, and stdout is `{"level":null}`

#### Scenario: A null level
- **WHEN** the file holds `version: 3` and `go.level: null`
- **THEN** `lets go level` exits 0, and stdout is `{"level":null}`

#### Scenario: A go key with no level
- **WHEN** the file holds `version: 3` and `go.verbose: true`, and no `go.level`
- **THEN** `lets go level` exits 0, and stdout is `{"level":null}`

#### Scenario: No resolver is asked
- **WHEN** the file holds `version: 3`, `delegate.resolvers: [t3]` and `go.level: recommend`, and the user runs `lets go level`
- **THEN** no resolver is asked to detect, run, start or finish a session

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 3` and `go.level: recommend`
- **THEN** `lets go level` prints `{"level":"recommend"}`

### Requirement: lets go level reads only version and go
`lets go level` SHALL ignore every key of the config but `version` and `go`, at the top level and under `go`. A `delegate` section the `lets delegate` commands would reject SHALL NOT stop it.

#### Scenario: A bad delegate chain
- **WHEN** the file holds `version: 3`, `delegate.resolvers: [codex]` and `go.level: ask`
- **THEN** `lets go level` exits 0, and stdout is `{"level":"ask"}`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 3`, `go.level: ask` and a key `go.verbose` this `lets` does not know
- **THEN** `lets go level` exits 0, and stdout is `{"level":"ask"}`

### Requirement: A bad go.level stops the command
`lets go level` SHALL exit 2 and print nothing on stdout in each of these cases: `go` is present and is not a mapping; `go.level` is present and is not `ask` or `recommend`; the document or its `version` is invalid, as *delegate-config*'s *The config file* says. Stderr SHALL name the config file and the bad key or value.

#### Scenario: A level lets does not know
- **WHEN** the file holds `version: 3` and `go.level: loud`
- **THEN** `lets go level` exits 2, stdout is empty, and stderr names the config file, `go.level` and `loud`

#### Scenario: A level that is not a string
- **WHEN** the file holds `version: 3` and `go.level: [ask]`
- **THEN** `lets go level` exits 2, stdout is empty, and stderr names the config file and `go.level`

#### Scenario: A go key that is not a mapping
- **WHEN** the file holds `version: 3` and `go: recommend`
- **THEN** `lets go level` exits 2, stdout is empty, and stderr names the config file and `go`

#### Scenario: The old version
- **WHEN** the file holds `version: 2` and `go.level: ask`
- **THEN** `lets go level` exits 2, stdout is empty, and stderr names the file and says the version must be `3`

### Requirement: The help names the key
`lets go --help` SHALL name `level`, and `lets go level --help` SHALL name the config file, the key `go.level`, the two values, and the exit codes 0 and 2.

#### Scenario: The group's help
- **WHEN** the user runs `lets go --help`
- **THEN** the output names `level`

#### Scenario: The command's help
- **WHEN** the user runs `lets go level --help`
- **THEN** the output names `config.yaml`, `go.level`, `ask` and `recommend`, and the exit codes `0` and `2`
