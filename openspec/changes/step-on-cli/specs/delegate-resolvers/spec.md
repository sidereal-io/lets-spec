## ADDED Requirements

### Requirement: The cli resolver runs a step headless
When `cli` answers `lets delegate step run`, it SHALL run the CLI of the `--model` family as a child process in the repository, in the mode that lets it write files and run commands without a prompt. That is `codex exec --dangerously-bypass-approvals-and-sandbox` for `gpt`, `claude -p --permission-mode bypassPermissions` for `claude`, or `agy -p --mode accept-edits --dangerously-skip-permissions` for `gemini`. It SHALL pass the prompt, the model, the effort and the time limit as it does for a review. It SHALL wait for the CLI's final message and hand it to `lets delegate step run` as the session's final message, so the step report is read from it. The process SHALL run without the session markers in its environment. The command's JSON line on stderr SHALL have the `--model` family as `family`, and a handle of kind `process`.

#### Scenario: A step with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` is on `PATH`, the user runs `lets delegate step run --for apply --name build-x --prompt-file p.md --effort high --model gpt/gpt-6-luna`, and codex writes a final message that ends with a `done` step report
- **THEN** codex runs with `exec`, `--dangerously-bypass-approvals-and-sandbox`, `-c model_reasoning_effort="high"`, `-m gpt-6-luna` and `-o .workspace/lets-delegate/build-x.last-message.md`, with the prompt on stdin and no `-s` option, the command exits 0, stdout is one JSON line with `"outcome":"done"`, and the JSON line on stderr has `"family":"gpt"`, `"model":"gpt-6-luna"` and a `handle` of kind `process`

#### Scenario: A step with claude on a bare family
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, the user runs `lets delegate step run --for propose --effort high --model claude` with the other required options, and claude prints a final message that ends with a `needs-input` step report
- **THEN** claude runs with `-p`, `--permission-mode bypassPermissions` and `--effort high`, with no `--model` argument and the prompt on stdin, the command exits 0, and stdout is one JSON line with `"outcome":"needs-input"`

#### Scenario: A gemini step at medium effort with its own time limit
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `agy` is on `PATH`, and the user runs `lets delegate step run --for shape --effort medium --timeout-minutes 30 --model gemini/gemini-3.8-flash` with the other required options
- **THEN** agy runs with `--mode accept-edits`, `--dangerously-skip-permissions`, `--effort medium`, `--model gemini-3.8-flash-medium`, `--print-timeout 30m` and the prompt as the argument of `-p`

#### Scenario: The step's process runs in the repository without the session markers
- **WHEN** `cli` answers a step with claude, and the command runs where `CLAUDECODE` is set
- **THEN** claude runs with the repository root as its working directory, with a time limit of 120 minutes, and without `CLAUDECODE` in its environment

### Requirement: A step through the cli resolver fails and times out as a review does
When `cli` answers a step, a CLI that prints and then exits non-zero SHALL be a failed session: `lets delegate step run` exits 0, prints a `failed` report whose `reason` names the CLI and its exit code, and its record on stderr has `"handle":null`. A CLI that exits 0 with an empty final message SHALL give a `failed` report at exit 0 whose `reason` names `step-report`. A CLI still running after the step's time limit SHALL be stopped, and the command SHALL exit 6 with an empty stdout.

#### Scenario: The CLI prints and then fails
- **WHEN** `cli` answers a step with claude, and claude prints half an answer and exits 2 with `rate limited` on stderr
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that holds `claude failed: exit 2: rate limited`, and the record on stderr has `"handle":null`

#### Scenario: The CLI ends with an empty message
- **WHEN** `cli` answers a step with codex, and codex exits 0 without writing its last-message file
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"` and a `reason` that names `step-report`

#### Scenario: The step runs too long
- **WHEN** `cli` answers a step with `--timeout-minutes 3`, and the CLI is still running after 3 minutes
- **THEN** `cli` stops the CLI's process, the command exits 6, stdout is empty, and stderr says the CLI did not finish in 3 minutes

### Requirement: The cli resolver cleans up after a step
When a step that `cli` answered ends with a `done` report, `cli` SHALL remove the files it wrote for that session in `.workspace/lets-delegate/`. When the report is `needs-input` or `failed`, it SHALL leave them, so a person can read the final message.

#### Scenario: A done step with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, and `lets delegate step run --for apply --name build-x --model gpt` with the other required options ends with codex's final message holding a `done` report
- **THEN** it exits 0, and `.workspace/lets-delegate/build-x.last-message.md` no longer exists

#### Scenario: A step that needs input
- **WHEN** the same step ends with a `needs-input` report
- **THEN** it exits 0, and `.workspace/lets-delegate/build-x.last-message.md` still exists

### Requirement: The cli resolver lists the same models for a step as for a review
`lets delegate step instructions` SHALL answer with `resolver` `cli` and the same `options` as `lets delegate review instructions`, wherever at least one of `codex`, `claude` or `agy` is on `PATH`.

#### Scenario: Step instructions with codex on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, `codex` is on `PATH`, `codex debug models` lists `gpt-6-luna` with `visibility` `list`, and the user runs `lets delegate step instructions --for apply`
- **THEN** it exits 0, and its JSON line has `"strategy":"step"`, `"resolver":"cli"` and `"options":["gpt/gpt-6-luna"]`

## MODIFIED Requirements

### Requirement: The cli resolver declines when no family CLI is on PATH
When none of `codex`, `claude` or `agy` is on `PATH`, `cli` SHALL decline every review, every step and their instructions, and SHALL start no process. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: No family CLI
- **WHEN** the config's `delegate.resolvers` is `[cli]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate review run --for code` with every required option
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no process is started

#### Scenario: No family CLI, and the default next
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"resolver":"subagent"`, and no process is started

#### Scenario: No family CLI, and a step
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate step run --for apply --name build-x` with the other required options
- **THEN** the default answers: it exits 3, stderr names `.workspace/lets-delegate/build-x.prompt.md`, and no process is started

### Requirement: A refusal exits 3
When `t3` or `cli` answers, the harness or the account can say no before the model gives any output. `lets delegate review run`, `lets delegate handoff run` and `lets delegate step run` SHALL treat that as a refusal, and SHALL say why on stderr. A refusal covers a harness that cannot start the session, and a missing harness setup, such as a T3 project. It also covers an account with no access or no tokens left, and a model the harness cannot run. When every `--model` is refused, the command exits 3. The command SHALL exit 4 for `t3` or `cli` only for an outcome it cannot know, such as no reply from T3.

#### Scenario: The CLI refuses the model
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate review run --for code --model gpt/gpt-6-astra`, and codex exits 1 with nothing on stdout
- **THEN** it exits 3, and stderr holds the end of codex's stderr

#### Scenario: The CLI refuses the model for a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate step run --for apply --model gpt/gpt-6-astra --model claude` with the other required options, codex exits 1 with nothing on stdout, and claude prints a final message with a `done` report
- **THEN** claude runs, the command exits 0, and stderr has a line that starts `lets delegate: gpt/gpt-6-astra: ` and the record's `"family":"claude"`

#### Scenario: The CLI cannot start a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate step run --for apply --model claude` with the other required options, and `claude` is on `PATH` but cannot be started
- **THEN** it exits 3, stdout is empty, and stderr names `claude`

#### Scenario: A refusal after an earlier run with the same name
- **WHEN** an earlier `gpt` review named `x` left `.workspace/lets-delegate/x.last-message.md`, and a new `lets delegate review run --for code --name x --model gpt/gpt-6-astra` that `cli` answers gets a codex that exits 1 without writing that file
- **THEN** it exits 3, not 5

#### Scenario: T3 has no project for the repository
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code in a repository that T3 has no project for
- **THEN** it exits 3, no thread is created, and stderr names the repository

#### Scenario: T3 fails the run before any message
- **WHEN** `t3` answers a review and starts a thread, and T3 marks its run failed with no assistant message
- **THEN** `lets delegate review run` exits 3, and stderr holds T3's failure message

#### Scenario: T3 does not reply
- **WHEN** `t3` answers a review, and T3 does not answer the request to start a thread in time
- **THEN** `lets delegate review run` exits 4

## REMOVED Requirements

### Requirement: The cli resolver declines every step
**Reason**: `cli` now runs a step headless, in each family's write mode (see "The cli resolver runs a step headless").
**Migration**: A step with a family CLI on `PATH` now runs through `cli` instead of falling through to the next resolver. To keep steps out of `cli`, list `cli` after the resolver that should run them, or leave it out. Keep `subagent` after `cli` for a terminal with no family CLI.
