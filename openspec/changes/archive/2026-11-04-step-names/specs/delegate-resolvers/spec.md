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
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x` with the other required options
- **THEN** the default answers: it exits 3, stderr names `.workspace/lets-delegate/build-x.prompt.md`, and no process is started

### Requirement: The cli resolver lists the bare family when a listing fails
A family's model listing can fail: it exits non-zero, runs past its time limit, or prints what `cli` cannot read. Then `lets delegate review instructions` and `lets delegate step instructions` SHALL list the bare family in that family's place in `options`, and still exit 0. They SHALL name the CLI and the failure on stderr.

#### Scenario: codex is signed out
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` and `claude` are on `PATH`, `codex debug models` exits 1, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, its JSON line has `"options":["gpt","claude"]`, and stderr names `codex`

#### Scenario: codex is signed out, and the user asks for a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` and `claude` are on `PATH`, `codex debug models` exits 1, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 0, its JSON line has `"options":["gpt","claude"]`, and stderr names `codex`

### Requirement: A refusal exits 3
When `t3` or `cli` answers, the harness or the account can say no before the model gives any output. `lets delegate review run`, `lets delegate handoff run` and `lets delegate step run` SHALL treat that as a refusal, and SHALL say why on stderr. A refusal covers a harness that cannot start the session, and a missing harness setup, such as a T3 project. It also covers an account with no access or no tokens left, and a model the harness cannot run. When every `--model` is refused, the command exits 3. The command SHALL exit 4 for `t3` or `cli` only for an outcome it cannot know, such as no reply from T3.

#### Scenario: The CLI refuses the model
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate review run --for code --model gpt/gpt-6-astra`, and codex exits 1 with nothing on stdout
- **THEN** it exits 3, and stderr holds the end of codex's stderr

#### Scenario: The CLI refuses the model for a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, and the user runs `lets delegate step run --for build --model gpt/gpt-6-astra --model claude` with the other required options
- **AND** codex exits 1 with nothing on stdout, and claude prints a final message with a `done` report
- **THEN** codex runs first and claude second, and the command exits 0
- **AND** the record on stderr has `"family"` `claude`

#### Scenario: The CLI cannot start a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate step run --for build --model claude` with the other required options, and `claude` is on `PATH` but cannot be started
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

### Requirement: The T3 resolver declines every step
`t3` SHALL decline every step and the instructions for one, inside T3 Code or not, and SHALL open no thread for it. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: A step inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, the command runs inside T3 Code, and the user runs `lets delegate step run --for build` with every required option
- **THEN** no thread is created, and the default answers

#### Scenario: Step instructions inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the command runs inside T3 Code, and the user runs `lets delegate step instructions --for plan`
- **THEN** it exits 2, stdout is empty, and stderr says every resolver declined

### Requirement: The cli resolver runs a step headless
When `cli` answers `lets delegate step run`, it SHALL run the CLI of the `--model` family as a child process in the repository, in the mode that lets it write files and run commands without a prompt. That is `codex exec --dangerously-bypass-approvals-and-sandbox` for `gpt`, `claude -p --permission-mode bypassPermissions` for `claude`, or `agy --mode accept-edits --dangerously-skip-permissions` for `gemini`. It SHALL pass the prompt, the model, the effort and the time limit as it does for a review. It SHALL wait for the CLI's final message and hand it to `lets delegate step run` as the session's final message, so the step report is read from it. The process SHALL run without the session markers in its environment. The command's JSON line on stderr SHALL have the `--model` family as `family`, and a handle of kind `process`.

#### Scenario: A step with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x --prompt-file p.md --effort high --model gpt/gpt-6-luna`
- **AND** codex writes a final message that ends with a `done` step report
- **THEN** codex runs with `exec`, `--dangerously-bypass-approvals-and-sandbox`, `-c model_reasoning_effort="high"`, `-m gpt-6-luna` and `-o .workspace/lets-delegate/build-x.last-message.md`, with the prompt on stdin and no `-s` option
- **AND** the command exits 0, and stdout is one JSON line with `"outcome":"done"`
- **AND** the JSON line on stderr has `"family":"gpt"`, `"model":"gpt-6-luna"` and a `handle` of kind `process`

#### Scenario: A step with claude on a bare family
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, the user runs `lets delegate step run --for plan --effort high --model claude` with the other required options, and claude prints a final message that ends with a `needs-input` step report
- **THEN** claude runs with `-p`, `--permission-mode bypassPermissions` and `--effort high`, with no `--model` argument and the prompt on stdin, the command exits 0, and stdout is one JSON line with `"outcome":"needs-input"`

#### Scenario: A gemini step at medium effort with its own time limit
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `agy` is on `PATH`, and the user runs `lets delegate step run --for shape --effort medium --timeout-minutes 30 --model gemini/gemini-3.8-flash` with the other required options
- **THEN** agy runs with `--mode accept-edits`, `--dangerously-skip-permissions`, `--effort medium`, `--model gemini-3.8-flash-medium`, `--print-timeout 30m` and the prompt as the argument of `-p`

#### Scenario: The step's process runs in the repository without the session markers
- **WHEN** `cli` answers a step with claude, and the command runs where `CLAUDECODE` is set
- **THEN** claude runs with the repository root as its working directory, with a time limit of 120 minutes, and without `CLAUDECODE` in its environment

### Requirement: The cli resolver cleans up after a step
When a step that `cli` answered ends with a `done` report, `cli` SHALL remove the files it wrote for that session in `.workspace/lets-delegate/`. When the report is `needs-input` or `failed`, it SHALL leave them, so a person can read the final message.

#### Scenario: A done step with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, and `lets delegate step run --for build --name build-x --model gpt` with the other required options ends with codex's final message holding a `done` report
- **THEN** it exits 0, and `.workspace/lets-delegate/build-x.last-message.md` no longer exists

#### Scenario: A step that needs input
- **WHEN** the same step ends with a `needs-input` report
- **THEN** it exits 0, and `.workspace/lets-delegate/build-x.last-message.md` still exists

### Requirement: The cli resolver lists the same models for a step as for a review
`lets delegate step instructions` SHALL answer with `resolver` `cli` and the same `options` as `lets delegate review instructions`, wherever at least one of `codex`, `claude` or `agy` is on `PATH`.

#### Scenario: Step instructions with codex on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, `codex` is on `PATH`, `codex debug models` lists `gpt-6-luna` with `visibility` `list`, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 0, and its JSON line has `"strategy":"step"`, `"resolver":"cli"` and `"options":["gpt/gpt-6-luna"]`
