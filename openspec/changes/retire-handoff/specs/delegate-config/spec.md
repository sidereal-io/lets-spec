## MODIFIED Requirements

### Requirement: The config file
The user's lets config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. The repository's lets config SHALL be one YAML document at `.lets/config.yaml` in the repository root; *The repository's lets config* says how `lets` finds it. Each file SHALL be a mapping that holds `version` `3`. Each MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold `review` and `step`, which only `instructions` reads. The document MAY hold `go`, a mapping of the settings for `lets go`, which only `lets go questions` reads; *go-questions* says what it holds. The document MAY hold `backlog`, which only `lets backlog` reads; *lets-backlog* says what it holds. The config is the two files merged, as *The repository's value wins, leaf by leaf* says. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate review` and `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`, and SHALL print no message about it. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

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
- **THEN** `lets delegate review instructions --for code` reads it without error, and the JSON line has `"resolver":"subagent"`

#### Scenario: Resolvers that are not a list
- **WHEN** the file holds `version: 3` and `delegate.resolvers: t3`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `delegate.resolvers`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 3`, a valid `delegate.resolvers`, a top-level key `sync`, and a key `telemetry` under `delegate`, which this `lets` does not know
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: A handoff key from an earlier lets
- **WHEN** the file holds `version: 3`, a valid `delegate.resolvers`, and `delegate.handoff.apply.guidance` `Prefer claude.`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers, and stderr does not contain `handoff`

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

### Requirement: A chain where every resolver declines fails the command
When every resolver the config lists declines, `lets delegate` SHALL exit 2, print nothing on stdout, and say on stderr that every resolver declined, naming the config file. The help text of `lets delegate review run` and `lets delegate step run` SHALL name this case under exit 2.

#### Scenario: Only a T3 resolver, run from a terminal
- **WHEN** the config lists only `t3`, and the command runs outside T3 Code
- **THEN** `lets delegate review run --for code` exits 2, stdout is empty, and stderr names the config file and says every resolver declined

#### Scenario: An empty list
- **WHEN** the config's `delegate.resolvers` is `[]`
- **THEN** `lets delegate step run --for build` exits 2, stdout is empty, and stderr names the config file and says every resolver declined

#### Scenario: The help text
- **WHEN** the user runs `lets delegate review run --help`
- **THEN** the line for exit 2 says that every resolver in the config declined

#### Scenario: The step's help text
- **WHEN** the user runs `lets delegate step run --help`
- **THEN** the line for exit 2 says that every resolver in the config declined

### Requirement: A refused model passes to the next
`run` SHALL take `--model` one or more times, as a ranked list. It SHALL ask the resolver that answers for the first model. While that resolver refuses, `run` SHALL ask the same resolver for the next model, and SHALL stop at the first answer that is not a refusal. It SHALL NOT ask a later resolver in the chain after a refusal. When every model is refused, `run` SHALL exit 3, print nothing on stdout, and print on stderr one line per model, `<model>: <reason>`. This holds for `review run` and `step run`. The review's and the step's JSON line on stderr SHALL name, as `model`, the model the resolver ran, or the `--model` value `lets` asked for when that value names only a family.

#### Scenario: The first model is refused
- **WHEN** the user runs `lets delegate review run --for code --model gpt/gpt-6-astra --model gemini` with the other required options, and the resolver refuses `gpt/gpt-6-astra` and answers for `gemini`
- **THEN** the resolver is asked twice, the second time for the family `gemini`, and the command exits 0 with the second answer

#### Scenario: Every model is refused
- **WHEN** the resolver refuses both `--model gpt/gpt-6-astra` and `--model gemini`
- **THEN** `lets delegate review run` exits 3, stdout is empty, and stderr has a line starting `gpt/gpt-6-astra: ` and a line starting `gemini: `

#### Scenario: A failure that is not a refusal
- **WHEN** the session fails for the first of two models
- **THEN** `lets delegate review run` exits 5, and the resolver is not asked for the second model

#### Scenario: A refusal never moves down the chain
- **WHEN** the config lists `t3` then `cli`, and `t3` refuses every model of a review
- **THEN** `lets delegate review run` exits 3, and `cli` is not asked

#### Scenario: The review names the model that ran
- **WHEN** the resolver refuses `gpt/gpt-6-astra`, then answers for `gemini/gemini-3-pro`
- **THEN** the JSON line on stderr has `"model":"gemini-3-pro"`

#### Scenario: The resolver reports a null model
- **WHEN** the resolver answers for `--model claude`, and reports no model of its own
- **THEN** the JSON line on stderr has `"model":"claude"`

#### Scenario: A step's first model is refused
- **WHEN** the user runs `lets delegate step run --for build --model gpt/gpt-6-astra --model gemini` with the other required options, and the resolver refuses `gpt/gpt-6-astra` and answers for `gemini` with a valid report
- **THEN** the resolver is asked twice, the second time for the family `gemini`, and the command exits 0 with the report

#### Scenario: A step's refusal never moves down the chain
- **WHEN** the config lists `t3` then `subagent`, and `t3` runs steps but refuses every model of a step
- **THEN** `lets delegate step run` exits 3, and `subagent` is not asked

### Requirement: An unknown resolver name stops the command
An entry of the config's `delegate.resolvers` that is not `t3`, `cli` or `subagent` SHALL stop every `lets delegate review` and `lets delegate step` command before it asks any resolver. The command SHALL exit 2 and print nothing on stdout. Stderr SHALL name the config file, the entry, and the three names. An absolute path is such an entry: `lets` SHALL NOT rewrite it to a name.

#### Scenario: A path from an older lets
- **WHEN** the config lists `/opt/r/old-resolver`
- **THEN** `lets delegate review run --for code` exits 2, and stderr contains the config file's path, `/opt/r/old-resolver`, `t3`, `cli` and `subagent`

#### Scenario: A name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate review run --for code` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

#### Scenario: A bad entry after one that would answer
- **WHEN** the config lists `subagent`, then `/opt/r/old-resolver`
- **THEN** `lets delegate step run --for build --name build-x` with the other required options exits 2, and no prompt is saved under `.workspace/lets-delegate/`

#### Scenario: A step with a name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate step run --for build` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

### Requirement: The repository's lets config
`lets` SHALL find the repository root by running `git rev-parse --show-toplevel` in the folder it runs in, and SHALL read the repository's lets config from `.lets/config.yaml` under that root. When the folder is not in a Git repository, or Git cannot answer, `lets` SHALL read only the user's lets config. When the root has no `.lets/config.yaml`, `lets` SHALL read only the user's lets config. When `.lets/config.yaml` exists but cannot be read, such as a folder or a file without read permission, the command SHALL fail as it does for a bad config, and the message SHALL name `.lets/config.yaml`. `lets` SHALL never read settings from `openspec/config.yaml`.

#### Scenario: Run from a subfolder
- **WHEN** the repository root holds `.lets/config.yaml` with `version: 3` and `delegate.resolvers: [cli]`, the user has no lets config, and the user runs `lets delegate review run --for code` from the folder `docs/` in that repository
- **THEN** it asks `cli`

#### Scenario: Outside a Git repository
- **WHEN** the folder the command runs in is not in a Git repository, and the user's lets config holds `version: 3` and `delegate.review.code.guidance` `Prefer claude.`
- **THEN** `lets delegate review instructions --for code` prints `"guidance":"Prefer claude."`

#### Scenario: No repository's lets config
- **WHEN** the repository has no `.lets/config.yaml`, and the user's lets config holds `version: 3` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: Neither file
- **WHEN** the repository has no `.lets/config.yaml`, and the user has no lets config
- **THEN** `lets delegate review instructions --for code` reads no config, and the JSON line has `"resolver":"subagent"` and `"guidance":null`

#### Scenario: A repository's lets config that is a folder
- **WHEN** `.lets/config.yaml` is a folder
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml`

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
- **THEN** `lets delegate review run --for code` exits 2, and stderr says every resolver declined and names `.lets/config.yaml`

#### Scenario: The user's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 3` and no `delegate`, and the user's lets config holds `delegate.resolvers: []`
- **THEN** `lets delegate step run --for build` exits 2, and stderr says every resolver declined and names the user's lets config

## ADDED Requirements

### Requirement: A review or step request carries the model the user gave
`lets delegate review run` and `lets delegate step run` SHALL require at least one `--model <family[/model]>`. The family SHALL be `gpt`, `claude` or `gemini`. They SHALL ask the resolver for that family and that model. Without `--model`, or when any `--model` is not of that form, they SHALL exit 2 and ask no resolver.

#### Scenario: A review with a model
- **WHEN** the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with the other required options
- **THEN** the resolver is asked for the family `gpt` and the model `gpt-6-luna`

#### Scenario: A review with a bare family
- **WHEN** the user runs `lets delegate review run --for code --model claude` with the other required options
- **THEN** the resolver is asked for the family `claude` and no particular model

#### Scenario: A step with a model
- **WHEN** the user runs `lets delegate step run --for build --model claude/claude-opus-5-5` with the other required options
- **THEN** the resolver is asked for the family `claude` and the model `claude-opus-5-5`

#### Scenario: No model
- **WHEN** the user runs `lets delegate review run --for code` without `--model`
- **THEN** it exits 2, stderr names `--model`, and no resolver is asked

#### Scenario: An unknown family
- **WHEN** the user runs `lets delegate review run --for code --model gpt --model llama/llama-4` with the other required options
- **THEN** it exits 2, stderr names `llama/llama-4`, and no resolver is asked

### Requirement: The commands are grouped into two strategies
`lets delegate` SHALL have two strategies, `review` and `step`, and each SHALL have the commands `instructions` and `run`. `lets delegate review run` SHALL run a prompt in a fresh, read-only session and wait for its final message. `lets delegate step run` SHALL run a prompt in a fresh session that may write files, wait for its final message, and print its step report. Any other strategy name, such as `handoff`, SHALL be an unknown command: `lets delegate` SHALL exit 2, print nothing on stdout, say on stderr that the command is unknown, and ask no resolver.

#### Scenario: The help lists both commands
- **WHEN** the user runs `lets delegate review --help`
- **THEN** the output names `instructions` and `run`

#### Scenario: The step strategy's help
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names `instructions` and `run`

#### Scenario: The delegate help names the two strategies
- **WHEN** the user runs `lets delegate --help`
- **THEN** the output names `review` and `step`, and does not name `handoff`

#### Scenario: The handoff command is gone
- **WHEN** the user runs `lets delegate handoff run --for apply --name build-x --prompt-file p.md --model claude`
- **THEN** it exits 2, stdout is empty, stderr contains `unknown command 'handoff'`, no resolver is asked, and nothing is saved under `.workspace/lets-delegate/`

### Requirement: Every review and step names its intent
`instructions` and `run` SHALL require `--for <intent>`. Under `review`, the intent SHALL be `plan` or `code`. Under `step`, it SHALL be one of the five steps, `shape`, `plan`, `review-plan`, `build` or `review-build`, or `story`, which runs a story run, not a step. Without `--for`, or with any other value, they SHALL exit 2, name `--for` on stderr, and ask no resolver.

#### Scenario: No intent
- **WHEN** the user runs `lets delegate step run --name build-x --prompt-file p.md --effort high --model claude`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: The retired handoff intent under review
- **WHEN** the user runs `lets delegate review instructions --for apply`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: Each step is an intent
- **WHEN** the user runs `lets delegate step instructions --for <step>` once for each of `shape`, `plan`, `review-plan`, `build` and `review-build`
- **THEN** each exits 0, and its JSON line has `"for"` equal to that step

#### Scenario: The story intent
- **WHEN** the user runs `lets delegate step instructions --for story`
- **THEN** it exits 0, and its JSON line has `"for":"story"`

#### Scenario: The story intent under review
- **WHEN** the user runs `lets delegate review instructions --for story`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: A review intent under step
- **WHEN** the user runs `lets delegate step instructions --for code`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: An old step name under step
- **WHEN** the user runs `lets delegate step instructions --for apply`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: The step strategy's help names the story intent
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names the five steps, and says that `story` runs a story run, not a step

### Requirement: A resolver that breaks exits 4
When a resolver fails in a way it does not report as a decline, a refusal, a failed session or a timeout, `lets delegate review run` and `lets delegate step run` SHALL exit 4, print nothing on stdout, and print the failure's message on stderr. Exit 4 means the outcome is unknown.

#### Scenario: A review that breaks
- **WHEN** the resolver that answers a review fails with the message `boom`
- **THEN** `lets delegate review run --for code` exits 4, stdout is empty, and stderr contains `boom`

#### Scenario: A step that breaks
- **WHEN** the resolver that answers a step fails with the message `boom`
- **THEN** `lets delegate step run --for build` exits 4, stdout is empty, and stderr contains `boom`

### Requirement: The chain is the resolvers the config names
`lets delegate` SHALL ask the resolvers the config's `delegate.resolvers` names, in the order listed, and no others. A resolver declines when it cannot run here, and one that cannot run a `step` session declines every step. The first that does not decline SHALL answer, and no later one is asked.

#### Scenario: The first declines
- **WHEN** the config lists `t3` then `cli`, and `t3` declines the review
- **THEN** `cli` is asked, and `lets delegate review run --for code` exits 0 with `cli`'s answer

#### Scenario: The first answers
- **WHEN** the config lists `t3` then `cli`, and `t3` answers the review
- **THEN** `lets delegate review run --for code` prints `t3`'s answer, and `cli` is not asked

#### Scenario: A resolver without steps and a step
- **WHEN** the config lists `cli` then `subagent`, `cli` can run here but runs no step, and the user runs `lets delegate step instructions --for build`
- **THEN** `cli` is not asked for its models, and the JSON line has `"resolver":"subagent"`

## REMOVED Requirements

### Requirement: A request from lets carries the model the user gave
**Reason**: Replaced by *A review or step request carries the model the user gave*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *A handoff with a bare family* is now *A review with a bare family*.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: The commands are grouped by strategy
**Reason**: Replaced by *The commands are grouped into two strategies*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *The delegate help names the three strategies* is now *The delegate help names the two strategies*, and the new scenario *The handoff command is gone* says what `lets delegate handoff` does now.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: Every delegation names its intent
**Reason**: Replaced by *Every review and step names its intent*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *No intent* now runs a step, *An intent from the other strategy* is now *The retired handoff intent under review*, and *The one handoff intent* is gone with the strategy.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: An unexpected failure inside a resolver exits 4
**Reason**: Replaced by *A resolver that breaks exits 4*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *A handoff that breaks* is gone with the strategy; the review and step scenarios stay.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: The chain is the names the config lists
**Reason**: Replaced by *The chain is the resolvers the config names*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *A headless resolver and a handoff* is gone with the strategy; *A resolver without steps and a step* still covers a resolver that declines a kind of session.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.
