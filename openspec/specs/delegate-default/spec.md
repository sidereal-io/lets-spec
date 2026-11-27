# delegate-default Specification

## Purpose
Says when `lets delegate` asks the built-in default, `subagent`: when there is no config, or where the config's chain lists `subagent`. The default starts no session and chooses no model family.

## Requirements

### Requirement: The default answers when nothing else does
When no config file exists, or the config holds no `delegate.resolvers`, `lets delegate` SHALL ask the default, `subagent`, which is built into `lets`. When the config holds `delegate.resolvers`, `lets delegate` SHALL ask the default only where the chain holds the entry `subagent`, in that position, and only when every resolver before it declines.

#### Scenario: No config
- **WHEN** no config file exists, and the user runs `lets delegate step instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A config with no delegate section
- **WHEN** the config holds only `version: 4`, and the user runs `lets delegate step instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A delegate section with no chain
- **WHEN** the config holds `version: 4` and `delegate.review-build.guidance`, but no `delegate.resolvers`, and the user runs `lets delegate step instructions --for review-build`
- **THEN** it prints a JSON line with `"resolver":"subagent"`

#### Scenario: A listed resolver answers before the default
- **WHEN** the config lists a resolver that answers a reviewer with a final message, then `subagent`
- **THEN** `lets delegate step run --for review-build` exits 0 and prints a `done` report whose `findings` holds that message, and the default is not asked

#### Scenario: A listed resolver declines and the default is next
- **WHEN** the config lists a resolver that declines, then `subagent`
- **THEN** `lets delegate step instructions --for review-build` prints a JSON line with `"resolver":"subagent"`

#### Scenario: The chain leaves the default out
- **WHEN** the config lists one resolver that declines, and no `subagent` entry
- **THEN** `lets delegate step run --for build --name build-x` with the other required options exits 2, and `.workspace/lets-delegate/build-x.prompt.md` is not written

#### Scenario: The default runs with lets's own Node
- **WHEN** the config lists `subagent`, no `node` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x` with the other required options
- **THEN** it exits 3, `.workspace/lets-delegate/build-x.prompt.md` holds the prompt, and stderr contains "subagent"

### Requirement: The default runs no review
When the default answers a reviewer, `lets delegate step run --for review-plan` or `--for review-build` SHALL exit 3, print nothing on stdout, and start no process.

#### Scenario: A review with no resolver installed
- **WHEN** the default answers `lets delegate step run --for review-build --name x --prompt-file p.md --source-family claude --effort high --model gpt`
- **THEN** the command exits 3, stdout is empty, and no process is started

#### Scenario: A family CLI is on PATH
- **WHEN** the default answers a reviewer, and `codex`, `claude` and `agy` are all on `PATH`
- **THEN** the command exits 3, and none of them is run

### Requirement: The default's review answer says what to do
When the default answers a reviewer, `lets delegate step run` SHALL say on stderr that no resolver started a session and that the review runs in a subagent. It SHALL NOT say that no resolver is installed, because the default also answers when an installed resolver declines.

#### Scenario: Reading stderr after exit 3
- **WHEN** the default answers `lets delegate step run --for review-plan`
- **THEN** stderr's text contains "no resolver" and "subagent", and does not contain "installed"

### Requirement: Every lets carries the default
The `lets` of the release tarball, of the Nix `lets` package and of the repository's source tree SHALL each answer as the default with nothing else installed or configured. The default SHALL be part of `lets` itself, and SHALL need no file beside it.

#### Scenario: The release tarball
- **WHEN** a user unpacks the release tarball, and runs its `bin/lets delegate step instructions --for review-build` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The Nix package
- **WHEN** a user runs the Nix package's `lets delegate step instructions --for review-build` with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The source tree
- **WHEN** a developer runs `lets/bin/lets delegate step instructions --for review-build` in this repository with nothing else installed or configured
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

#### Scenario: The program beside lets is gone
- **WHEN** the release folder has no `resolvers/` folder, nothing else is configured, and the user runs `lets delegate step instructions --for review-build`
- **THEN** it exits 0, and the JSON line has `"resolver":"subagent"`

### Requirement: The default answers wherever lets runs
The default, `subagent`, SHALL answer wherever `lets` runs, inside a harness or not, and SHALL never decline. Asked which models it can run, it SHALL list none.

#### Scenario: Instructions in a plain terminal
- **WHEN** no config file exists, the command runs outside any harness, and the user runs `lets delegate step instructions --for review-build`
- **THEN** it exits 0 and prints one JSON line with `"resolver":"subagent"` and `"options":[]`

### Requirement: The default's step saves the prompt and refuses
When the default answers `lets delegate step run` with any `--for` value but `review-plan` and `review-build`, it SHALL save the prompt `lets` composed, with any answers appended, to `.workspace/lets-delegate/<name>.prompt.md` in the repository, then refuse. Asked again for the next `--model`, it SHALL write the same file again and refuse again. The command SHALL exit 3, print nothing on stdout, and start no process. Stderr SHALL say that no resolver started a session, that the step runs in a subagent, and the path of the saved prompt. It SHALL NOT say that no resolver is installed. For a reviewer it SHALL save no prompt, because the review skills run their own prompt file in a subagent.

#### Scenario: A step with no resolver that runs steps
- **WHEN** the default answers `lets delegate step run --for plan --name plan-x --prompt-file p.md --effort high --model claude`, and `p.md` holds `Run plan on x`
- **THEN** the command exits 3, stdout is empty, `.workspace/lets-delegate/plan-x.prompt.md` holds `Run plan on x`, and stderr contains "no resolver", "subagent", `.workspace/lets-delegate/plan-x.prompt.md`, and not "installed"

#### Scenario: A resumed step
- **WHEN** the default answers the same command with `--answers-file a.yaml`, which holds the question `Which schema?` and the answer `lets-minimal`
- **THEN** `.workspace/lets-delegate/plan-x.prompt.md` starts with `Run plan on x` and holds `Which schema?` and `lets-minimal`

#### Scenario: A family CLI is on PATH
- **WHEN** the default answers a step, and `codex`, `claude` and `agy` are all on `PATH`
- **THEN** the command exits 3, and none of them is run

#### Scenario: A reviewer saves no prompt
- **WHEN** the default answers `lets delegate step run --for review-plan --name x-plan-review --prompt-file p.md --source-family claude --effort high --model gpt`
- **THEN** the command exits 3, and `.workspace/lets-delegate/x-plan-review.prompt.md` is not written

### Requirement: The default lists no models for a step
When the default answers `lets delegate step instructions`, the JSON line SHALL have `"resolver":"subagent"` and `"options":[]`.

#### Scenario: Step instructions with no config
- **WHEN** no config file exists, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 0 and prints one JSON line with `"for":"build"`, `"resolver":"subagent"` and `"options":[]`, and no `strategy`
