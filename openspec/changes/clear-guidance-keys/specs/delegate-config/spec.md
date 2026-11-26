<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The config file
The user's lets config SHALL be one YAML document at `$XDG_CONFIG_HOME/lets/config.yaml` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/config.yaml` otherwise. The repository's lets config SHALL be one YAML document at `.lets/config.yaml` in the repository root; *The repository's lets config* says how `lets` finds it. Each file SHALL be a mapping that holds `version` `4`. Each MAY hold `delegate`, a mapping of the settings for `lets delegate`. `delegate` MAY hold `resolvers`, the chain: a list of the resolvers to ask, in order. Each entry SHALL be the name of a resolver built into `lets`: `t3`, `cli` or `subagent`. The list MAY be empty. `delegate` MAY hold one guidance key per step: `shape`, `plan`, `review-plan`, `build`, `review-build` and `story`. Only `instructions` reads them; *delegate-instructions* says which session each one steers. The document MAY hold `go`, a mapping of the settings for `lets go`, which only `lets go questions` reads; *go-questions* says what it holds. The document MAY hold `backlog`, which only `lets backlog` reads; *lets-backlog* says what it holds. The config is the two files merged, as *The repository's value wins, leaf by leaf* says. A `delegate` or `delegate.resolvers` that is null SHALL count as absent. Every `lets delegate review` and `lets delegate step` command SHALL ignore any other key, at the top level or under `delegate`, and SHALL print no message about it, except that `instructions` rejects `delegate.review` and `delegate.step`, as *delegate-instructions* says. They SHALL exit 2 with a message that names the file and the bad value in each of these cases:

- either document is not YAML, or is not a mapping
- either document's `version` is not the number `4`
- the `delegate` in effect is not a mapping
- the `delegate.resolvers` in effect is not a list

#### Scenario: A valid config
- **WHEN** the file holds `version: 4` and `delegate.resolvers` listing `t3` and `subagent`, and `t3` declines
- **THEN** `lets delegate review run --for code` reads it without error, and asks `t3`, then the default, in that order

#### Scenario: The file under XDG_CONFIG_HOME
- **WHEN** `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: The file under the home folder
- **WHEN** `XDG_CONFIG_HOME` is the empty string, and `~/.config/lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: An invalid config
- **WHEN** the file's `delegate.resolvers` holds `bin/old-resolver`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `bin/old-resolver`

#### Scenario: The old version
- **WHEN** the file holds `version: 2`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and says the version must be `4`

#### Scenario: A delegate key that is not a mapping
- **WHEN** the file holds `version: 4` and `delegate: [t3]`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `delegate`

#### Scenario: An empty delegate key
- **WHEN** the file holds `version: 4` and a line `delegate:` with nothing under it
- **THEN** `lets delegate review instructions --for code` reads it without error, and the JSON line has `"resolver":"subagent"`

#### Scenario: Resolvers that are not a list
- **WHEN** the file holds `version: 4` and `delegate.resolvers: t3`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and `delegate.resolvers`

#### Scenario: A key from a later lets
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, a top-level key `sync`, and a key `telemetry` under `delegate`, which this `lets` does not know
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: A handoff key from an earlier lets
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, and `delegate.handoff.apply.guidance` `Prefer claude.`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers, and stderr does not contain `handoff`

#### Scenario: run ignores the guidance
- **WHEN** the file holds `version: 4` and `delegate.review-build.guidance: 42`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: step run ignores the step guidance
- **WHEN** the file holds `version: 4` and `delegate.build.guidance: 42`
- **THEN** `lets delegate step run --for build` reads it without error and asks the listed resolvers

#### Scenario: run ignores an old guidance key
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, `delegate.review.code.guidance` `Prefer gpt.` and `delegate.step.build.guidance` `Prefer claude.`
- **THEN** `lets delegate review run --for code` and `lets delegate step run --for build` each read it without error and ask the listed resolvers

#### Scenario: A go key under a delegate command
- **WHEN** the file holds `version: 4`, a valid `delegate.resolvers`, and `go.questions: loud`
- **THEN** `lets delegate review run --for code` reads it without error and asks the listed resolvers

#### Scenario: The repository's lets config has the old version
- **WHEN** the user's lets config is valid, and `.lets/config.yaml` holds `version: 2`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml` and says the version must be `4`

### Requirement: The repository's lets config
`lets` SHALL find the repository root by running `git rev-parse --show-toplevel` in the folder it runs in, and SHALL read the repository's lets config from `.lets/config.yaml` under that root. When the folder is not in a Git repository, or Git cannot answer, `lets` SHALL read only the user's lets config. When the root has no `.lets/config.yaml`, `lets` SHALL read only the user's lets config. When `.lets/config.yaml` exists but cannot be read, such as a folder or a file without read permission, the command SHALL fail as it does for a bad config, and the message SHALL name `.lets/config.yaml`. `lets` SHALL never read settings from `openspec/config.yaml`.

#### Scenario: Run from a subfolder
- **WHEN** the repository root holds `.lets/config.yaml` with `version: 4` and `delegate.resolvers: [cli]`, the user has no lets config, and the user runs `lets delegate review run --for code` from the folder `docs/` in that repository
- **THEN** it asks `cli`

#### Scenario: Outside a Git repository
- **WHEN** the folder the command runs in is not in a Git repository, and the user's lets config holds `version: 4` and `delegate.review-build.guidance` `Prefer claude.`
- **THEN** `lets delegate review instructions --for code` prints `"guidance":"Prefer claude."`

#### Scenario: No repository's lets config
- **WHEN** the repository has no `.lets/config.yaml`, and the user's lets config holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: Neither file
- **WHEN** the repository has no `.lets/config.yaml`, and the user has no lets config
- **THEN** `lets delegate review instructions --for code` reads no config, and the JSON line has `"resolver":"subagent"` and `"guidance":null`

#### Scenario: A repository's lets config that is a folder
- **WHEN** `.lets/config.yaml` is a folder
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml`

### Requirement: The repository's value wins, leaf by leaf
`lets` SHALL merge the two files into one config. Where both files hold a mapping at the same key, `lets` SHALL merge the two mappings key by key, at every depth. Where the repository's lets config holds any other value at a key, such as a string, a number or a list, that value SHALL replace the user's value at that key whole, and `lets` SHALL NOT join two lists. A key the repository's lets config does not hold, or holds as null, SHALL keep the user's value. Each command SHALL check only the values in effect after the merge, so a bad user's value that the repository replaces SHALL NOT stop it.

#### Scenario: The repository sets one guidance
- **WHEN** the user's lets config holds `delegate.review-plan.guidance` `Prefer gpt.` and `delegate.review-build.guidance` `Prefer claude.`, and `.lets/config.yaml` holds `version: 4` and `delegate.review-build.guidance` `Use gemini.`
- **THEN** `lets delegate review instructions --for code` prints `"guidance":"Use gemini."`, and `lets delegate review instructions --for plan` prints `"guidance":"Prefer gpt."`

#### Scenario: The repository's chain replaces the user's
- **WHEN** the user's lets config holds `delegate.resolvers: [t3, subagent]`, `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`, and `cli` declines
- **THEN** `lets delegate review run --for code` exits 2 and says every resolver declined, and neither `t3` nor `subagent` is asked

#### Scenario: A null key in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: null`
- **THEN** `lets delegate review run --for code` asks `cli`

#### Scenario: The repository replaces a bad user's value
- **WHEN** the user's lets config holds `version: 4` and `delegate.resolvers: [codex]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [cli]`
- **THEN** `lets delegate review run --for code` asks `cli`, and does not exit 2

### Requirement: A message names the file the value came from
When a `lets` message names the config file, because a value in it is bad or because the chain it lists declined, it SHALL name the file that holds that value: `.lets/config.yaml` when the value in effect came from the repository's lets config, and the user's lets config otherwise. When neither file sets the value, the message SHALL name the user's lets config.

#### Scenario: A bad resolver in the repository's lets config
- **WHEN** the user's lets config holds `delegate.resolvers: [cli]`, and `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: [codex]`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names `.lets/config.yaml` and `codex`, and does not name the user's lets config

#### Scenario: A bad guidance in the repository's lets config
- **WHEN** `.lets/config.yaml` holds `version: 4` and `delegate.review-build.guidance: 42`
- **THEN** `lets delegate review instructions --for code` exits 2, and stderr names `.lets/config.yaml` and `delegate.review-build.guidance`

#### Scenario: An old guidance key in the repository's lets config
- **WHEN** the user's lets config holds `version: 4` and no `delegate`, and `.lets/config.yaml` holds `version: 4` and `delegate.step.build.guidance` `Prefer claude.`
- **THEN** `lets delegate step instructions --for build` exits 2, and stderr names `.lets/config.yaml`, `delegate.step.build` and `delegate.build`, and does not name the user's lets config

#### Scenario: The repository's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 4` and `delegate.resolvers: []`
- **THEN** `lets delegate review run --for code` exits 2, and stderr says every resolver declined and names `.lets/config.yaml`

#### Scenario: The user's chain declines
- **WHEN** `.lets/config.yaml` holds `version: 4` and no `delegate`, and the user's lets config holds `delegate.resolvers: []`
- **THEN** `lets delegate step run --for build` exits 2, and stderr says every resolver declined and names the user's lets config

## ADDED Requirements

### Requirement: A version 3 file names each guidance key's new name
When either file of the lets config holds `version: 3`, every `lets delegate`, `lets go questions` and `lets backlog` command SHALL fail as it does for any other wrong version, before it asks any resolver or runs any backend command. Its message SHALL name the file and say that the version must be `4`. For each old guidance key that file holds, the message SHALL also name that key and its new key. An old guidance key is an entry under `delegate.review` or `delegate.step` that names an intent of that strategy, present and not null. Each old key's new key SHALL be:

- `delegate.review.plan`: `delegate.review-plan`
- `delegate.review.code`: `delegate.review-build`
- `delegate.step.shape`: `delegate.shape`
- `delegate.step.plan` and `delegate.step.review-plan`: `delegate.plan`
- `delegate.step.build` and `delegate.step.review-build`: `delegate.build`
- `delegate.step.story`: `delegate.story`

For `delegate.step.review-plan` and `delegate.step.review-build`, the message SHALL also say that the new key is shared with the plan step or the build step.

#### Scenario: A version 3 file with review and step guidance
- **WHEN** the user's lets config holds `version: 3`, `delegate.review.plan.guidance` `Prefer gpt.` and `delegate.step.review-plan.guidance` `Prefer claude.`
- **THEN** `lets delegate review instructions --for plan` exits 2, stdout is empty, and stderr names the file, says the version must be `4`, and contains `delegate.review.plan`, `delegate.review-plan`, `delegate.step.review-plan` and `delegate.plan`

#### Scenario: A version 3 file under a run command
- **WHEN** the user's lets config holds `version: 3` and `delegate.review.code.guidance` `Prefer gpt.`
- **THEN** `lets delegate review run --for code` exits 2, asks no resolver, and stderr contains `delegate.review.code` and `delegate.review-build`

#### Scenario: A version 3 file with no guidance
- **WHEN** the user's lets config holds `version: 3` and `delegate.resolvers: [cli]`, and nothing else under `delegate`
- **THEN** `lets delegate review run --for code` exits 2, and stderr names the file and says the version must be `4`, and does not contain `delegate.review`

#### Scenario: A version 3 file under lets go questions
- **WHEN** the user's lets config holds `version: 3`, `go.questions: auto` and `delegate.step.story.guidance` `Prefer claude.`
- **THEN** `lets go questions` exits 2, stdout is empty, and stderr says the version must be `4` and contains `delegate.step.story` and `delegate.story`

#### Scenario: A version 3 repository's lets config under lets backlog
- **WHEN** the user's lets config is valid, `.lets/config.yaml` holds `version: 3` and `delegate.step.build.guidance` `Prefer claude.`, and a user runs `lets backlog ready`
- **THEN** stdout holds `"error": "unknown-backlog-provider"` with a `message` that names `.lets/config.yaml`, says the version must be `4`, and contains `delegate.step.build` and `delegate.build`, no `gh` command runs, and the exit code is 1

### Requirement: The README explains every guidance key
The README's *Set up delegation* section SHALL hold one table with one row for each guidance key `lets` reads, and no other row. Each row SHALL name the key, the session it steers, the `lets delegate` command and `--for` value that read it, the skill that runs that command, and a sensible value. The section SHALL say that guidance only ranks and filters the listed models, and never changes a skill's steps. The project's Node tests SHALL fail when the table lacks a row for a key that a strategy and intent of `lets delegate` reads, or holds a row for a key that none reads, and the failure SHALL name the key.

#### Scenario: A row per key
- **WHEN** a reader reads the README's *Set up delegation* section
- **THEN** the reader finds one table with rows for `delegate.shape`, `delegate.plan`, `delegate.review-plan`, `delegate.build`, `delegate.review-build` and `delegate.story`, and the sentence that guidance only ranks and filters the listed models

#### Scenario: The rows that share a step
- **WHEN** a reader reads the rows for `delegate.plan` and `delegate.review-plan`
- **THEN** the row for `delegate.plan` names the plan step's session and the review plan step's session, and the row for `delegate.review-plan` names the read-only plan reviewer and `lets-review-plan`

#### Scenario: A missing row
- **WHEN** the README's guidance table has no row for `delegate.story`
- **THEN** `pnpm test` fails, and the failure names `delegate.story`

#### Scenario: A row for a key lets does not read
- **WHEN** the README's guidance table has a row for `delegate.review.code`
- **THEN** `pnpm test` fails, and the failure names `delegate.review.code`

### Requirement: The help and the resolvers guide point to the table
`lets delegate --help` SHALL show a config example that holds `version: 4` and guidance under the new keys. It SHALL say, in one sentence, that `delegate.review-plan` steers the plan reviewer while the review plan step's own session takes `delegate.plan`, and that `delegate.review-build` and `delegate.build` pair the same way. It SHALL point to the README's *Set up delegation* section for the full table. The *The step's guidance* section of `docs/resolvers.md` SHALL say the same in one sentence, and link to that section.

#### Scenario: The delegate help
- **WHEN** the user runs `lets delegate --help`
- **THEN** the output contains `version: 4`, `delegate.review-plan`, `delegate.plan`, `delegate.review-build`, `delegate.build` and `Set up delegation`, and does not contain `delegate.step` or `delegate.<strategy>`

#### Scenario: The resolvers guide
- **WHEN** a reader reads *The step's guidance* in `docs/resolvers.md`
- **THEN** the reader finds `delegate.review-plan` and `delegate.plan`, and a link to `../README.md#set-up-delegation`, and does not find `delegate.step.`
