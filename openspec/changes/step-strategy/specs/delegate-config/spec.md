## MODIFIED Requirements

### Requirement: The config file
The config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. It SHALL be a mapping that holds `version` `3`. It MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold `review`, `handoff` and `step`, which only `instructions` reads. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate review`, `lets delegate handoff` and `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

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
- **WHEN** the file holds `delegate.step.apply.guidance: 42`
- **THEN** `lets delegate step run --for apply` reads it without error and asks the listed resolvers

### Requirement: A request from lets carries the model the user gave
`lets delegate review run`, `lets delegate handoff run` and `lets delegate step run` SHALL require at least one `--model <family[/model]>`. The family SHALL be `gpt`, `claude` or `gemini`. They SHALL ask the resolver for that family and that model. Without `--model`, or when any `--model` is not of that form, they SHALL exit 2 and ask no resolver.

#### Scenario: A review with a model
- **WHEN** the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with the other required options
- **THEN** the resolver is asked for the family `gpt` and the model `gpt-6-luna`

#### Scenario: A handoff with a bare family
- **WHEN** the user runs `lets delegate handoff run --for apply --name build-x --prompt-file p.md --model claude`
- **THEN** the resolver is asked for the family `claude` and no particular model

#### Scenario: A step with a model
- **WHEN** the user runs `lets delegate step run --for apply --model claude/claude-opus-5-5` with the other required options
- **THEN** the resolver is asked for the family `claude` and the model `claude-opus-5-5`

#### Scenario: No model
- **WHEN** the user runs `lets delegate review run --for code` without `--model`
- **THEN** it exits 2, stderr names `--model`, and no resolver is asked

#### Scenario: An unknown family
- **WHEN** the user runs `lets delegate review run --for code --model gpt --model llama/llama-4` with the other required options
- **THEN** it exits 2, stderr names `llama/llama-4`, and no resolver is asked

### Requirement: The commands are grouped by strategy
`lets delegate` SHALL have three strategies, `review`, `handoff` and `step`, and each SHALL have the commands `instructions` and `run`. `lets delegate review run` SHALL run a prompt in a fresh, read-only session and wait for its final message. `lets delegate handoff run` SHALL start a fresh, interactive session and return at once. `lets delegate step run` SHALL run a prompt in a fresh session that may write files, wait for its final message, and print its step report.

#### Scenario: The help lists both commands
- **WHEN** the user runs `lets delegate review --help`
- **THEN** the output names `instructions` and `run`

#### Scenario: The step strategy's help
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names `instructions` and `run`

#### Scenario: The delegate help names the three strategies
- **WHEN** the user runs `lets delegate --help`
- **THEN** the output names `review`, `handoff` and `step`

### Requirement: Every delegation names its intent
`instructions` and `run` SHALL require `--for <intent>`. Under `review`, the intent SHALL be `plan` or `code`. Under `handoff`, it SHALL be `apply`. Under `step`, it SHALL be one of the five steps: `shape`, `propose`, `propose-review`, `apply` or `apply-review`. Without `--for`, or with any other value, they SHALL exit 2, name `--for` on stderr, and ask no resolver.

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
- **WHEN** the user runs `lets delegate step instructions --for <step>` once for each of `shape`, `propose`, `propose-review`, `apply` and `apply-review`
- **THEN** each exits 0, and its JSON line has `"for"` equal to that step

#### Scenario: A review intent under step
- **WHEN** the user runs `lets delegate step instructions --for code`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

### Requirement: An unknown resolver name stops the command
An entry of the config's `delegate.resolvers` that is not `t3`, `cli` or `subagent` SHALL stop every `lets delegate review`, `lets delegate handoff` and `lets delegate step` command before it asks any resolver. The command SHALL exit 2 and print nothing on stdout. Stderr SHALL name the config file, the entry, and the three names. An absolute path is such an entry: `lets` SHALL NOT rewrite it to a name.

#### Scenario: A path from an older lets
- **WHEN** the config lists `/opt/r/old-resolver`
- **THEN** `lets delegate review run --for code` exits 2, and stderr contains the config file's path, `/opt/r/old-resolver`, `t3`, `cli` and `subagent`

#### Scenario: A name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate handoff run --for apply` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

#### Scenario: A bad entry after one that would answer
- **WHEN** the config lists `subagent`, then `/opt/r/old-resolver`
- **THEN** `lets delegate handoff run --for apply` exits 2, and no prompt is saved under `.workspace/lets-delegate/`

#### Scenario: A step with a name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate step run --for apply` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

### Requirement: The chain is the names the config lists
`lets delegate` SHALL ask the resolvers the config's `delegate.resolvers` names, in the order listed, and no others. A resolver declines when it cannot run here, one that cannot start interactive sessions declines every handoff, and one that cannot run a `step` session declines every step. The first that does not decline SHALL answer, and no later one is asked.

#### Scenario: The first declines
- **WHEN** the config lists `t3` then `cli`, and `t3` declines the review
- **THEN** `cli` is asked, and `lets delegate review run --for code` exits 0 with `cli`'s answer

#### Scenario: The first answers
- **WHEN** the config lists `t3` then `cli`, and `t3` answers the review
- **THEN** `lets delegate review run --for code` prints `t3`'s answer, and `cli` is not asked

#### Scenario: A headless resolver and a handoff
- **WHEN** the config lists `cli` then `subagent`, `cli` can run here, and the user runs `lets delegate handoff run --for apply`
- **THEN** `cli` starts nothing, and the JSON line has `"resolver":"subagent"`

#### Scenario: A resolver without steps and a step
- **WHEN** the config lists `cli` then `subagent`, `cli` can run here but runs no step, and the user runs `lets delegate step instructions --for apply`
- **THEN** `cli` is not asked for its models, and the JSON line has `"resolver":"subagent"`
