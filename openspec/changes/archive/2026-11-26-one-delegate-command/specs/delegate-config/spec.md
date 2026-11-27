## MODIFIED Requirements

### Requirement: The config file
The user's lets config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. The repository's lets config SHALL be one YAML document at `.lets/config.yaml` in the repository root; *The repository's lets config* says how `lets` finds it. Each file SHALL be a mapping that holds `version` `4`. Each MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold one guidance key per step: `shape`, `plan`, `review-plan`, `build`, `review-build` and `story`. Only `instructions` reads them; *delegate-instructions* says which session each one steers. The document MAY hold `go`, a mapping of the settings for `lets go`, which only `lets go questions` reads; *go-questions* says what it holds. The document MAY hold `backlog`, which only `lets backlog` reads; *lets-backlog* says what it holds. The config is the two files merged, as *The repository's value wins, leaf by leaf* says. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`, and SHALL print no message about it, except that `instructions` rejects `delegate.review` and `delegate.step`, as *delegate-instructions* says. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

- either document is not YAML, or is not a mapping
- either document's `version` is not the number `4`
- the `delegate` in effect is not a mapping
- the `delegate.resolvers` in effect is not a list

#### Scenario: A valid config
- **WHEN** the file holds `version: 4` and `delegate.resolvers` listing `t3` and `subagent`, and `t3` declines
- **THEN** `lets delegate step run --for review-build` reads it without error, and asks `t3`, then the default, in that order

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate step run --for review-build` asks `cli`

#### Scenario: The file under the home folder
- **WHEN** `XDG_CONFIG_HOME` is the empty string, and `~/.config/lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate step run --for review-build` asks `cli`

#### Scenario: An invalid config
- **WHEN** the file's `delegate.resolvers` holds `bin/old-resolver`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names the file and `bin/old-resolver`

#### Scenario: The old version
- **WHEN** the file holds `version: 2`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names the file and says the version must be `4`

#### Scenario: A delegate key that is not a mapping
- **WHEN** the file holds `version: 4` and `delegate: [t3]`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names the file and `delegate`

#### Scenario: An empty delegate key
- **WHEN** the file holds `version: 4` and a line `delegate:` with nothing under it
- **THEN** `lets delegate step instructions --for review-build` reads it without error, and the JSON line has `"resolver":"subagent"`

#### Scenario: Resolvers that are not a list
- **WHEN** the file holds `version: 4` and `delegate.resolvers: t3`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names the file and `delegate.resolvers`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, a top-level key `sync`, and a key `telemetry` under `delegate`, which this `lets` does not know
- **THEN** `lets delegate step run --for review-build` reads it without error and asks the listed resolvers

#### Scenario: A handoff key from an earlier lets
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, and `delegate.handoff.apply.guidance` `Prefer claude.`
- **THEN** `lets delegate step run --for review-build` reads it without error and asks the listed resolvers, and stderr does not contain `handoff`

#### Scenario: run ignores the guidance
- **WHEN** the file holds `version: 4` and `delegate.review-build.guidance: 42`
- **THEN** `lets delegate step run --for review-build` reads it without error and asks the listed resolvers

#### Scenario: step run ignores the step guidance
- **WHEN** the file holds `version: 4` and `delegate.build.guidance: 42`
- **THEN** `lets delegate step run --for build` reads it without error and asks the listed resolvers

#### Scenario: run ignores an old guidance key
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, `delegate.review.code.guidance` `Prefer gpt.` and `delegate.step.build.guidance` `Prefer claude.`
- **THEN** `lets delegate step run --for review-build` and `lets delegate step run --for build` each read it without error and ask the listed resolvers

#### Scenario: A go key under a delegate command
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, and `go.questions: loud`
- **THEN** `lets delegate step run --for review-build` reads it without error and asks the listed resolvers

#### Scenario: The repository's lets config has the old version
- **WHEN** the user's lets config is valid, and `.lets/config.yaml` holds `version: 2`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names `.lets/config.yaml` and says the version must be `4`

### Requirement: A chain where every resolver declines fails the command
When every resolver the config lists declines, `lets delegate` SHALL exit 2, print nothing on stdout, and say on stderr that every resolver declined, naming the config file. The help text of `lets delegate step run` and of `lets delegate step instructions` SHALL name this case under exit 2.

#### Scenario: Only a T3 resolver, run from a terminal
- **WHEN** the config lists only `t3`, and the command runs outside T3 Code
- **THEN** `lets delegate step run --for review-build` exits 2, stdout is empty, and stderr names the config file and says every resolver declined

#### Scenario: An empty list
- **WHEN** the config's `delegate.resolvers` is `[]`
- **THEN** `lets delegate step run --for build` exits 2, stdout is empty, and stderr names the config file and says every resolver declined

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step instructions --help`
- **THEN** the line for exit 2 says that every resolver in the config declined

#### Scenario: The step's help text
- **WHEN** the user runs `lets delegate step run --help`
- **THEN** the line for exit 2 says that every resolver in the config declined

### Requirement: A refused model passes to the next
`run` SHALL take `--model` one or more times, as a ranked list. It SHALL ask the resolver that answers for the first model. While that resolver refuses, `run` SHALL ask the same resolver for the next model, and SHALL stop at the first answer that is not a refusal. It SHALL NOT ask a later resolver in the chain after a refusal. When every model is refused, `run` SHALL exit 3, print nothing on stdout, and print on stderr one line per model, `<model>: <reason>`. This holds for every `--for` value, a reviewer's included. The record line on stderr SHALL name, as `model`, the model the resolver ran, or the `--model` value `lets` asked for when that value names only a family.

#### Scenario: The first model is refused
- **WHEN** the user runs `lets delegate step run --for review-build --model gpt/gpt-6-astra --model gemini` with the other required options, and the resolver refuses `gpt/gpt-6-astra` and answers for `gemini`
- **THEN** the resolver is asked twice, the second time for the family `gemini`, and the command exits 0 with the second answer

#### Scenario: Every model is refused
- **WHEN** the resolver refuses both `--model gpt/gpt-6-astra` and `--model gemini`
- **THEN** `lets delegate step run` exits 3, stdout is empty, and stderr has a line starting `gpt/gpt-6-astra: ` and a line starting `gemini: `

#### Scenario: A failure that is not a refusal
- **WHEN** the reviewer's session fails for the first of two models of `lets delegate step run --for review-build`
- **THEN** the command exits 0 with a `failed` report, and the resolver is not asked for the second model

#### Scenario: A refusal never moves down the chain
- **WHEN** the config lists `t3` then `cli`, and `t3` refuses every model of `lets delegate step run --for review-build`
- **THEN** the command exits 3, and `cli` is not asked

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
An entry of the config's `delegate.resolvers` that is not `t3`, `cli` or `subagent` SHALL stop every `lets delegate step` command before it asks any resolver. The command SHALL exit 2 and print nothing on stdout. Stderr SHALL name the config file, the entry, and the three names. An absolute path is such an entry: `lets` SHALL NOT rewrite it to a name.

#### Scenario: A path from an older lets
- **WHEN** the config lists `/opt/r/old-resolver`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr contains the config file's path, `/opt/r/old-resolver`, `t3`, `cli` and `subagent`

#### Scenario: A name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate step run --for review-build` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

#### Scenario: A bad entry after one that would answer
- **WHEN** the config lists `subagent`, then `/opt/r/old-resolver`
- **THEN** `lets delegate step run --for build --name build-x` with the other required options exits 2, and no prompt is saved under `.workspace/lets-delegate/`

#### Scenario: A step with a name lets does not know
- **WHEN** the config lists `codex`
- **THEN** `lets delegate step run --for build` exits 2, stdout is empty, and stderr contains `codex` and the config file's path

### Requirement: A review hands its session back to the resolver that made it
After a reviewer's session gives its final message, `lets delegate step run --for review-plan` or `--for review-build` SHALL ask the resolver that made the session to finish it: with ok when the tree is clean and the message is not empty, and without ok otherwise, so the session is kept for a person to read. When finishing fails, the report SHALL stand, and stderr SHALL say the session could not be finished, naming its handle.

#### Scenario: A clean review
- **WHEN** `t3` answers a reviewer with handle `thread t-1` and a final message, and the tree is clean
- **THEN** `t3` is asked to finish `thread t-1` with ok, and no other resolver is asked

#### Scenario: An empty final message
- **WHEN** the reviewer's session ends with an empty final message
- **THEN** `lets delegate step run --for review-build` exits 0, stdout is one JSON line with `"outcome":"failed"`, and the resolver is asked to finish the session without ok

#### Scenario: Finishing fails
- **WHEN** the reviewer ends with a clean tree and a final message, and finishing `thread t-1` fails
- **THEN** `lets delegate step run --for review-build` exits 0, prints a `done` report whose `findings` holds the final message, and stderr says it could not finish `thread t-1`

### Requirement: The repository's lets config
`lets` SHALL find the repository root by running `git rev-parse --show-toplevel` in the folder it runs in, and SHALL read the repository's lets config from `.lets/config.yaml` under that root. When the folder is not in a Git repository, or Git cannot answer, `lets` SHALL read only the user's lets config. When the root has no `.lets/config.yaml`, `lets` SHALL read only the user's lets config. When `.lets/config.yaml` exists but cannot be read, such as a folder or a file without read permission, the command SHALL fail as it does for a bad config, and the message SHALL name `.lets/config.yaml`. `lets` SHALL never read settings from `openspec/config.yaml`.

#### Scenario: Run from a subfolder
- **WHEN** the repository root holds `.lets/config.yaml` with `version: 4` and `delegate.resolvers: [cli]`, the user has no lets config, and the user runs `lets delegate step run --for review-build` from the folder `docs/` in that repository
- **THEN** it asks `cli`

#### Scenario: Outside a Git repository
- **WHEN** the folder the command runs in is not in a Git repository, and the user's lets config holds `version: 4` and `delegate.review-build.guidance` `Prefer claude.`
- **THEN** `lets delegate step instructions --for review-build` prints `"guidance":"Prefer claude."`

#### Scenario: No repository's lets config
- **WHEN** the repository has no `.lets/config.yaml`, and the user's lets config holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate step run --for review-build` asks `cli`

#### Scenario: Neither file
- **WHEN** the repository has no `.lets/config.yaml`, and the user has no lets config
- **THEN** `lets delegate step instructions --for review-build` reads no config, and the JSON line has `"resolver":"subagent"` and `"guidance":null`

#### Scenario: A repository's lets config that is a folder
- **WHEN** `.lets/config.yaml` is a folder
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names `.lets/config.yaml`

### Requirement: The repository's value wins, leaf by leaf
`lets` SHALL merge the two files into one config. Where both files hold a mapping at the same key, `lets` SHALL merge the two mappings key by key, at every depth. Where the repository's lets config holds any other value at a key, such as a string, a number or a list, that value SHALL replace the user's value at that key whole, and `lets` SHALL NOT join two lists. A key the repository's lets config does not hold, or holds as null, SHALL keep the user's value. Each command SHALL check only the values in effect after the merge, so a bad user's value that the repository replaces SHALL NOT stop it.

#### Scenario: The repository sets one guidance
- **WHEN** the user's lets config holds `delegate.review-plan.guidance` `Prefer gpt.` and `delegate.review-build.guidance` `Prefer claude.`, and `.lets/config.yaml` holds `version: 4` and `delegate.review-build.guidance` `Use gemini.`
- **THEN** `lets delegate step instructions --for review-build` prints `"guidance":"Use gemini."`, and `lets delegate step instructions --for review-plan` prints `"guidance":"Prefer gpt."`

#### Scenario: The repository's chain replaces the user's
- **WHEN** the user's lets config holds `delegate.resolvers: [t3, subagent]`, `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`, and `cli` declines
- **THEN** `lets delegate step run --for review-build` exits 2 and says every resolver declined, and neither `t3` nor `subagent` is asked

#### Scenario: A null key in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: null`
- **THEN** `lets delegate step run --for review-build` asks `cli`

#### Scenario: The repository replaces a bad user's value
- **WHEN** the user's lets config holds `version: 4` and `delegate.resolvers: [codex]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate step run --for review-build` asks `cli`, and does not exit 2

### Requirement: A message names the file the value came from
When a `lets` message names the config file, because a value in it is bad or because the chain it lists declined, it SHALL name the file that holds that value: `.lets/config.yaml` when the value in effect came from the repository's lets config, and the user's lets config otherwise. When neither file sets the value, the message SHALL name the user's lets config.

#### Scenario: A bad resolver in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [codex]`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names `.lets/config.yaml` and `codex`, and does not name the user's lets config

#### Scenario: A bad guidance in the repository's lets config
- **WHEN** `.lets/config.yaml` holds `version: 4` and `delegate.review-build.guidance: 42`
- **THEN** `lets delegate step instructions --for review-build` exits 2, and stderr names `.lets/config.yaml` and `delegate.review-build.guidance`

#### Scenario: An old guidance key in the repository's lets config
- **WHEN** the user's lets config holds `version: 4` and no `delegate`, and `.lets/config.yaml` holds `version: 4` and `delegate.step.build.guidance` `Prefer claude.`
- **THEN** `lets delegate step instructions --for build` exits 2, and stderr names `.lets/config.yaml`, `delegate.step.build` and `delegate.build`, and does not name the user's lets config

#### Scenario: The repository's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: []`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr says every resolver declined and names `.lets/config.yaml`

#### Scenario: The user's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 4` and no `delegate`, and the user's lets config holds `delegate.resolvers: []`
- **THEN** `lets delegate step run --for build` exits 2, and stderr says every resolver declined and names the user's lets config

### Requirement: A review or step request carries the model the user gave
`lets delegate step run` SHALL require at least one `--model <family[/model]>`. The family SHALL be `gpt`, `claude` or `gemini`. They SHALL ask the resolver for that family and that model. Without `--model`, or when any `--model` is not of that form, they SHALL exit 2 and ask no resolver.

#### Scenario: A review with a model
- **WHEN** the user runs `lets delegate step run --for review-build --model gpt/gpt-6-luna` with the other required options
- **THEN** the resolver is asked for the family `gpt` and the model `gpt-6-luna`

#### Scenario: A review with a bare family
- **WHEN** the user runs `lets delegate step run --for review-build --model claude` with the other required options
- **THEN** the resolver is asked for the family `claude` and no particular model

#### Scenario: A step with a model
- **WHEN** the user runs `lets delegate step run --for build --model claude/claude-opus-5-5` with the other required options
- **THEN** the resolver is asked for the family `claude` and the model `claude-opus-5-5`

#### Scenario: No model
- **WHEN** the user runs `lets delegate step run --for review-build` without `--model`
- **THEN** it exits 2, stderr names `--model`, and no resolver is asked

#### Scenario: An unknown family
- **WHEN** the user runs `lets delegate step run --for review-build --model gpt --model llama/llama-4` with the other required options
- **THEN** it exits 2, stderr names `llama/llama-4`, and no resolver is asked

### Requirement: A resolver that breaks exits 4
When a resolver fails in a way it does not report as a decline, a refusal, a failed session or a timeout, `lets delegate step run` SHALL exit 4, print nothing on stdout, and print the failure's message on stderr. Exit 4 means the outcome is unknown.

#### Scenario: A review that breaks
- **WHEN** the resolver that answers a reviewer fails with the message `boom`
- **THEN** `lets delegate step run --for review-build` exits 4, stdout is empty, and stderr contains `boom`

#### Scenario: A step that breaks
- **WHEN** the resolver that answers a step fails with the message `boom`
- **THEN** `lets delegate step run --for build` exits 4, stdout is empty, and stderr contains `boom`

### Requirement: The chain is the resolvers the config names
`lets delegate` SHALL ask the resolvers the config's `delegate.resolvers` names, in the order listed, and no others. A resolver declines when it cannot run here, and one that cannot run a `step` session declines every `--for` value but `review-plan` and `review-build`, which ask for a read-only session. The first that does not decline SHALL answer, and no later one is asked.

#### Scenario: The first declines
- **WHEN** the config lists `t3` then `cli`, and `t3` declines the reviewer
- **THEN** `cli` is asked, and `lets delegate step run --for review-build` exits 0 with a report that holds `cli`'s answer

#### Scenario: The first answers
- **WHEN** the config lists `t3` then `cli`, and `t3` answers the reviewer
- **THEN** `lets delegate step run --for review-build` prints a report that holds `t3`'s answer, and `cli` is not asked

#### Scenario: A resolver without steps and a step
- **WHEN** the config lists `cli` then `subagent`, `cli` can run here but runs no step, and the user runs `lets delegate step instructions --for build`
- **THEN** `cli` is not asked for its models, and the JSON line has `"resolver":"subagent"`

### Requirement: A version 3 file names each guidance key's new name
When either file of the lets config holds `version: 3`, every `lets delegate`, `lets go questions` and `lets backlog` command SHALL fail as it does for any other wrong version, before it asks any resolver or runs any backend command. Its message SHALL name the file and say that the version must be `4`. For each old guidance key that file holds, the message SHALL also name that key and its new key. An old guidance key is one of the entries listed below, present and not null. Each old key's new key SHALL be:

- `delegate.review.plan`: `delegate.review-plan`
- `delegate.review.code`: `delegate.review-build`
- `delegate.step.shape`: `delegate.shape`
- `delegate.step.plan` and `delegate.step.review-plan`: `delegate.plan`
- `delegate.step.build` and `delegate.step.review-build`: `delegate.build`
- `delegate.step.story`: `delegate.story`

For `delegate.step.review-plan` and `delegate.step.review-build`, the message SHALL also say that the new key is shared with the plan step or the build step.

#### Scenario: A version 3 file with review and step guidance
- **WHEN** the user's lets config holds `version: 3`, `delegate.review.plan.guidance` `Prefer gpt.` and `delegate.step.review-plan.guidance` `Prefer claude.`
- **THEN** `lets delegate step instructions --for review-plan` exits 2, stdout is empty, and stderr names the file, says the version must be `4`, and contains `delegate.review.plan`, `delegate.review-plan`, `delegate.step.review-plan` and `delegate.plan`

#### Scenario: A version 3 file under a run command
- **WHEN** the user's lets config holds `version: 3` and `delegate.review.code.guidance` `Prefer gpt.`
- **THEN** `lets delegate step run --for review-build` exits 2, asks no resolver, and stderr contains `delegate.review.code` and `delegate.review-build`

#### Scenario: A version 3 file with no guidance
- **WHEN** the user's lets config holds `version: 3` and `delegate.resolvers: [cli]`, and nothing else under `delegate`
- **THEN** `lets delegate step run --for review-build` exits 2, and stderr names the file and says the version must be `4`, and does not contain `delegate.review`

#### Scenario: A version 3 file under lets go questions
- **WHEN** the user's lets config holds `version: 3`, `go.questions: auto` and `delegate.step.story.guidance` `Prefer claude.`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr says the version must be `4` and contains `delegate.step.story` and `delegate.story`

#### Scenario: A version 3 repository's lets config under lets backlog
- **WHEN** the user's lets config is valid, `.lets/config.yaml` holds `version: 3` and `delegate.step.build.guidance` `Prefer claude.`, and a user runs `lets backlog ready`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `.lets/config.yaml`, says the version must be `4`, and contains `delegate.step.build` and `delegate.build`, no `gh` command runs, and the exit code is 1

### Requirement: The README explains every guidance key
The README's *Set up delegation* section SHALL hold one table with one row for each guidance key `lets` reads, and no other row. Each row SHALL name the key, the session it steers, the `lets delegate` command and `--for` value that read it, the skill that runs that command, and a sensible value. The section SHALL say that guidance only ranks and filters the listed models, and never changes a skill's steps. It SHALL also say that a review step's own session takes `delegate.plan` or `delegate.build` only until `lets-go` starts each reviewer itself, as stories #354 and #355 plan. The project's Node tests SHALL fail when the table lacks a row for a key that a `--for` value of `lets delegate step instructions` reads, or holds a row for a key that none reads, and the failure SHALL name the key.

#### Scenario: A row per key
- **WHEN** a reader reads the README's *Set up delegation* section
- **THEN** the reader finds one table with rows for `delegate.shape`, `delegate.plan`, `delegate.review-plan`, `delegate.build`, `delegate.review-build` and `delegate.story`, and the sentence that guidance only ranks and filters the listed models

#### Scenario: The rows that share a step
- **WHEN** a reader reads the rows for `delegate.plan` and `delegate.review-plan`
- **THEN** the row for `delegate.plan` names the plan step's session and the review plan step's session, and the row for `delegate.review-plan` names the read-only plan reviewer, `lets delegate step instructions --for review-plan` and `lets-review-plan`

#### Scenario: The shared rows say the rule is temporary
- **WHEN** a reader reads the README's *Set up delegation* section
- **THEN** the reader finds that the review plan step's own session takes `delegate.plan`, and the review build step's own session takes `delegate.build`, until `lets-go` starts each reviewer itself

#### Scenario: A missing row
- **WHEN** the README's guidance table has no row for `delegate.story`
- **THEN** `pnpm test` fails, and the failure names `delegate.story`

#### Scenario: A row for a key lets does not read
- **WHEN** the README's guidance table has a row for `delegate.review.code`
- **THEN** `pnpm test` fails, and the failure names `delegate.review.code`

## ADDED Requirements

### Requirement: Every session names its intent
`instructions`, `run` and `start` SHALL require `--for <intent>`. The intent SHALL be one of the five steps, `shape`, `plan`, `review-plan`, `build` or `review-build`, or `story`, which runs a story run, not a step. `review-plan` and `review-build` SHALL start a reviewer, as *delegate-step* says. Without `--for`, or with any other value, they SHALL exit 2, name `--for` on stderr, and ask no resolver.

#### Scenario: No intent
- **WHEN** the user runs `lets delegate step run --name build-x --prompt-file p.md --effort high --model claude`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: Each step is an intent
- **WHEN** the user runs `lets delegate step instructions --for <step>` once for each of `shape`, `plan`, `review-plan`, `build` and `review-build`
- **THEN** each exits 0, and its JSON line has `"for"` equal to that step

#### Scenario: The story intent
- **WHEN** the user runs `lets delegate step instructions --for story`
- **THEN** it exits 0, and its JSON line has `"for":"story"`

#### Scenario: The old review intents
- **WHEN** the user runs `lets delegate step instructions --for code`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: An old step name
- **WHEN** the user runs `lets delegate step instructions --for apply`
- **THEN** it exits 2, stderr names `--for`, and no resolver is asked

#### Scenario: The help names the story intent and the reviewers
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names the five steps, says that `story` runs a story run, not a step, and says that `review-plan` and `review-build` start a read-only reviewer

### Requirement: One command starts every session
`lets delegate` SHALL have one command group, `step`, with the commands `instructions`, `run`, `start` and `wait`. `lets delegate step run` SHALL start every session `lets delegate` runs: a reviewer for `--for review-plan` and `--for review-build`, and a session that may write files for every other intent. Any other command under `lets delegate`, such as `review` or `handoff`, SHALL be an unknown command: `lets delegate` SHALL exit 2, print nothing on stdout, say on stderr that the command is unknown, and ask no resolver.

#### Scenario: The review command is gone
- **WHEN** the user runs `lets delegate review run --for review-build --name x --prompt-file p.md --source-family claude --effort high --model gpt`
- **THEN** it exits 2, stdout is empty, stderr contains `unknown command 'review'`, and no resolver is asked

#### Scenario: The review instructions are gone
- **WHEN** the user runs `lets delegate review instructions --for review-plan`
- **THEN** it exits 2, stdout is empty, stderr contains `unknown command 'review'`, and no resolver is asked

#### Scenario: The handoff command is gone
- **WHEN** the user runs `lets delegate handoff run --for apply --name build-x --prompt-file p.md --model claude`
- **THEN** it exits 2, stdout is empty, stderr contains `unknown command 'handoff'`, no resolver is asked, and nothing is saved under `.workspace/lets-delegate/`

#### Scenario: The delegate help names one command
- **WHEN** the user runs `lets delegate --help`
- **THEN** the output names `step`, and does not name `review` as a command, nor `handoff`, nor the word `strategy`

#### Scenario: The step help lists its commands
- **WHEN** the user runs `lets delegate step --help`
- **THEN** the output names `instructions`, `run`, `start` and `wait`

## REMOVED Requirements

### Requirement: The commands are grouped into two strategies
**Reason**: `lets delegate review` is removed. `lets delegate step` starts every session, a reviewer included, so the two strategies are one command.
**Migration**: Run `lets delegate step instructions --for review-plan` or `--for review-build` in place of `lets delegate review instructions`, and `lets delegate step run` with the same `--for` value in place of `lets delegate review run`. *One command starts every session* holds the new behavior.

### Requirement: Every review and step names its intent
**Reason**: The `review` command is gone, so `--for` no longer differs between two commands.
**Migration**: *Every session names its intent* holds the one list of intents. Pass `--for review-plan` or `--for review-build` to `lets delegate step` in place of `lets delegate review`.
