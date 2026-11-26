<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The lets config selects the backlog provider
Each `lets backlog` command SHALL read `backlog.provider` from the `lets` config: the repository's lets config, `.lets/config.yaml` in the repository root, merged over the user's lets config, `$XDG_CONFIG_HOME/lets/config.yaml`, or `~/.config/lets/config.yaml` when `XDG_CONFIG_HOME` is unset or empty, as *delegate-config* says. It SHALL use the backlog provider in effect: the repository's value when it sets one, and the user's value otherwise. When neither file sets it, because a file, its `backlog` section, or `provider` is absent or null, the backlog provider SHALL be `github`. When `provider` names a backlog provider this release does not ship, the command SHALL return the error `unknown-backlog-provider` and exit 1, with a `message` that names the value, the file that set it and each backlog provider the release ships, and SHALL run no backend command. When either file cannot be read, is not YAML, or is not a mapping with `version: 4`, or the `backlog` in effect is not a mapping, or the `provider` in effect is not a string, the command SHALL return `unknown-backlog-provider` too, with a `message` that names the file that holds the fault and what is wrong, and SHALL run no backend command. It SHALL never read the backlog provider from `openspec/config.yaml`. The help text SHALL name the backlog provider in use, and the file that set it, or say it is the default.

#### Scenario: No config file
- **WHEN** the user has no lets config, the repository has no `.lets/config.yaml`, and the user runs `lets backlog ready`
- **THEN** it reads the GitHub Project

#### Scenario: No backlog section
- **WHEN** the lets config holds `version: 4` and a `delegate` section, and no `backlog`
- **THEN** `lets backlog ready` reads the GitHub Project

#### Scenario: GitHub named
- **WHEN** the lets config holds `backlog:` with `provider: github`
- **THEN** `lets backlog ready` reads the GitHub Project

#### Scenario: An unknown backlog provider
- **WHEN** the user's lets config sets `backlog.provider` to `jria`, the repository has no `.lets/config.yaml`, and a user runs `lets backlog item 136`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `jria`, the user's lets config file and `github`, no `gh` command runs, and the exit code is 1

#### Scenario: A config lets cannot read
- **WHEN** the lets config sets `backlog.provider` to `[jira]`, or the file is not YAML, and a user runs `lets backlog claim 136`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names the file, no `gh` command runs, and the exit code is 1

#### Scenario: openspec/config.yaml is not read
- **WHEN** `openspec/config.yaml` holds `lets:` with `backlog:` and `provider: jria`, the user has no lets config, and the repository has no `.lets/config.yaml`
- **THEN** `lets backlog ready` reads the GitHub Project

#### Scenario: The repository's backlog provider wins
- **WHEN** the user's lets config sets `backlog.provider` to `jria`, and `.lets/config.yaml` holds `version: 4` and `backlog.provider: github`
- **THEN** `lets backlog ready` reads the GitHub Project, and returns no error

#### Scenario: An unknown backlog provider in the repository's lets config
- **WHEN** the user's lets config sets `backlog.provider` to `github`, `.lets/config.yaml` sets it to `jria`, and a user runs `lets backlog item 136`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `jria`, `.lets/config.yaml` and `github`, no `gh` command runs, and the exit code is 1

#### Scenario: A repository's lets config with the old version
- **WHEN** `.lets/config.yaml` holds `version: 3`, and a user runs `lets backlog ready`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `.lets/config.yaml` and says the version must be `4`, no `gh` command runs, and the exit code is 1

#### Scenario: The help names the file that set the provider
- **WHEN** `.lets/config.yaml` holds `version: 4` and `backlog.provider: github`, and the user runs `lets backlog --help`
- **THEN** the output says the backlog provider is `github`, set in `.lets/config.yaml`

