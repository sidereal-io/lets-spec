# delegate-resolvers Specification

## Purpose
Says what the `t3` and `cli` resolvers built into `lets` do when a `lets delegate` command asks them: when each declines, which models it lists, and how it runs, refuses, times out and cleans up a session.

## Requirements

### Requirement: One resolver runs every family CLI on PATH
`lets` SHALL have a resolver named `cli`. When the config lists it, it SHALL answer with `resolver` `cli` and its `options` wherever at least one of `codex`, `claude` or `agy` is on `PATH`. It SHALL NOT check which harness it runs in.

#### Scenario: One CLI on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, and neither `codex` nor `agy` is, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and its JSON line has `"resolver":"cli"` and `"options":["claude"]`

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the command runs inside T3 Code with `codex` on `PATH`, `codex debug models` lists `gpt-6-luna` with `visibility` `list`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and its JSON line has `"resolver":"cli"` and `"options":["gpt/gpt-6-luna"]`

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

### Requirement: The cli resolver runs a review headless
When `cli` answers `lets delegate review run`, it SHALL run the CLI of the `--model` family as a child process in its read-only mode. That is `codex exec` with the read-only sandbox for `gpt`, `claude -p` in plan mode for `claude`, or `agy -p` in plan mode for `gemini`. It SHALL pass the review's effort. It SHALL pass the model part of `--model` unchanged, and SHALL add the effort to a `gemini` model as `<model>-<effort>`. It SHALL pass no model when `--model` is a bare family. The command SHALL print the CLI's final message. Its JSON line on stderr SHALL have the `--model` family as `family`, and a handle of kind `process`.

#### Scenario: A review with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` is on `PATH`, the user runs `lets delegate review run --for code --model gpt/gpt-6-luna`, and codex ends with a final message
- **THEN** codex runs with `-m gpt-6-luna`, the command exits 0 and prints codex's final message, and its JSON line on stderr has `"family":"gpt"`, `"model":"gpt-6-luna"` and a `handle` of kind `process`

#### Scenario: A bare family
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, and the user runs `lets delegate review run --for code --model claude`
- **THEN** claude runs with no `--model` argument, and the JSON line on stderr has `"family":"claude"`

#### Scenario: A gemini model at high effort
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `agy` is on `PATH`, and the user runs `lets delegate review run --for code --effort high --model gemini/gemini-3.8-flash`
- **THEN** agy runs with `--model gemini-3.8-flash-high`

#### Scenario: A review leaves the tree unchanged
- **WHEN** a review that `cli` answers ends
- **THEN** no file outside `.workspace/` has changed

#### Scenario: The CLI fails
- **WHEN** `cli` answers a review, and the CLI prints on stdout and then exits non-zero, or exits 0 with an empty final message
- **THEN** `lets delegate review run` exits 5, and stderr says why

#### Scenario: The CLI cannot start
- **WHEN** `cli` answers a review, and the family's CLI is on `PATH` but cannot be started
- **THEN** `lets delegate review run` exits 3, as a refusal, and stderr names the CLI

#### Scenario: The review runs too long
- **WHEN** `cli` answers a review, and the CLI is still running after the review's timeout
- **THEN** `cli` stops the CLI's process, and `lets delegate review run` exits 6

### Requirement: The cli resolver declines every handoff
`cli` SHALL decline every handoff and the instructions for one, even when a family CLI is on `PATH`, and SHALL run no CLI and no listing command for it. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: A handoff with CLIs on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex`, `claude` and `agy` are on `PATH`, and the user runs `lets delegate handoff run --for apply` with every required option
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no process is started

#### Scenario: Handoff instructions with codex on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, `codex` is on `PATH`, and the user runs `lets delegate handoff instructions --for apply`
- **THEN** its JSON line has `"resolver":"subagent"`, and `codex` is not run

### Requirement: The cli resolver cleans up after a review
When a review that `cli` answered ends with a clean tree and a final message, `cli` SHALL remove the files it wrote for that session in `.workspace/lets-delegate/`. When the review ends otherwise, it SHALL leave them.

#### Scenario: Finishing a review with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, and `lets delegate review run --for code --name cli-resolver --model gpt` ends with a clean tree and codex's final message
- **THEN** it exits 0, and `.workspace/lets-delegate/cli-resolver.last-message.md` no longer exists

#### Scenario: Finishing a review that changed the tree
- **WHEN** the same review ends having changed a file outside `.workspace/`
- **THEN** it exits 7, and `.workspace/lets-delegate/cli-resolver.last-message.md` still exists

### Requirement: T3 Code has its own resolver
`lets` SHALL have a resolver named `t3`, which answers only for T3 Code. Inside T3 Code, it SHALL answer with `resolver` `t3` and its `options`. It SHALL find the process's parents both on a system with `/proc`, such as Linux, and on one without, such as macOS. `lets` SHALL NOT have a resolver for herdr.

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the command runs in a process whose ancestor is the running T3 server
- **AND** T3's catalogue lists only disabled provider instances, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

#### Scenario: Inside T3 Code on a system with no /proc
- **WHEN** the same command runs on a system with no `/proc`, where `ps -o ppid= -p <pid>` shows that the running T3 server is the process's ancestor
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

### Requirement: The T3 resolver opens a session in a T3 thread
Inside T3 Code, when `t3` answers `lets delegate review run` or `lets delegate handoff run`, it SHALL open a session in a T3 thread that runs the `--model`. It SHALL send the model part of `--model` to T3 unchanged. For a `gemini` model, it SHALL send no effort, because T3 offers no effort option for Gemini; a review's `--effort` does not apply.

A bare family SHALL run a model from T3's catalogue, chosen from that family's provider instance, when `t3` lists that instance (see "The T3 resolver lists the models T3 Code can run now"):
- the visible model that the catalogue marks as the default;
- or else, when no visible model is the default, the first visible model.

A visible model is one the user has not hidden in T3 Code. A custom model is always visible. For `gemini`, the chosen model SHALL have its `-low`, `-medium` or `-high` suffix removed.

#### Scenario: A review inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for code --model claude/claude-opus-5-5` inside T3 Code, and the session ends with a final message
- **THEN** the thread runs `claude-opus-5-5`, the command exits 0, and its JSON line on stderr has `"family":"claude"` and a `handle` of kind `thread`

#### Scenario: A handoff inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate handoff run --for apply --model gpt/gpt-6-luna` inside T3 Code, and the project has a default model of `claude-opus-5-5`
- **THEN** the thread runs `gpt-6-luna`

#### Scenario: A gemini review runs the model as given
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the user runs `lets delegate review run --for plan --effort medium --model gemini/gemini-4-argon` inside T3 Code
- **THEN** the thread runs `gemini-4-argon`, with no effort option

#### Scenario: A bare family runs the catalogue's default
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-6-luna` and a default of `gpt-5.6-terra`
- **AND** T3's `model-manifest.json` gives `codex` no default, and the user runs `lets delegate handoff run --for apply --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-5.6-terra`

#### Scenario: A bare family with no default runs the first visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-5.6-terra` as its default, then `gpt-6-luna`
- **AND** the user has hidden `gpt-5.6-terra` in T3 Code, and runs `lets delegate handoff run --for apply --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-6-luna`

#### Scenario: A bare gemini review runs the default without its effort
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **AND** the user runs `lets delegate review run --for plan --effort low --model gemini` inside T3 Code
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

#### Scenario: A bare gemini handoff runs the default without its effort
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **AND** the user runs `lets delegate handoff run --for apply --model gemini` inside T3 Code
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

### Requirement: The T3 resolver declines outside T3 Code
When the process is not inside T3 Code, `t3` SHALL decline every review, handoff and step, and the instructions for each, and SHALL start no session. It SHALL NOT look for any other harness. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: Inside herdr
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for code` with every required option inside herdr, and no T3 server is its ancestor
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no thread is created

#### Scenario: While T3 Code runs elsewhere
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the T3 server is running, and the user runs `lets delegate review instructions --for code` in a terminal that the server did not start
- **THEN** it exits 2, stdout is empty, and stderr says every resolver declined

#### Scenario: A step outside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, no T3 server is the process's ancestor, and the user runs `lets delegate step run --for build` with every required option
- **THEN** no thread is created, and the default answers

### Requirement: The cli resolver lists the models each CLI reports
`cli` SHALL list its `options` family by family, in the order `gpt`, `claude`, `gemini`, for each family whose CLI is on `PATH`:
- `gpt`: `gpt/<slug>` for each model that `codex debug models` reports with `visibility` `list`, in the order codex reports them.
- `claude`: the bare family `claude`.
- `gemini`: `gemini/<model>` for each id that `agy models` reports starting with `gemini-`, with its `-low`, `-medium` or `-high` suffix removed, once per model, in the order agy first reports them.

#### Scenario: Every CLI on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex debug models` reports `gpt-reserve` with `visibility` `hide` and `gpt-6-luna` with `visibility` `list`, `agy models` reports `gemini-3.8-flash-high`, `gemini-3.8-flash-low` and `claude-sonnet-4-6`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna","claude","gemini/gemini-3.8-flash"]`

### Requirement: The cli resolver lists the bare family when a listing fails
A family's model listing can fail: it exits non-zero, runs past its time limit, or prints what `cli` cannot read. Then `lets delegate review instructions` and `lets delegate step instructions` SHALL list the bare family in that family's place in `options`, and still exit 0. They SHALL name the CLI and the failure on stderr.

#### Scenario: codex is signed out
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` and `claude` are on `PATH`, `codex debug models` exits 1, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, its JSON line has `"options":["gpt","claude"]`, and stderr names `codex`

#### Scenario: codex is signed out, and the user asks for a step
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` and `claude` are on `PATH`, `codex debug models` exits 1, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 0, its JSON line has `"options":["gpt","claude"]`, and stderr names `codex`

### Requirement: The T3 resolver lists the models T3 Code can run now
Inside T3 Code, `t3` SHALL list its `options` from the model catalogue that the running T3 server gives its composer. It SHALL NOT read T3's `model-manifest.json`.

It SHALL list a provider instance only when all of these hold:
- the instance is enabled;
- its status is `ready` or `warning`;
- T3 does not mark it `unavailable`;
- its id is `codex`, `claudeAgent` or `antigravity`, the instances that `t3` runs the families `gpt`, `claude` and `gemini` on.

It SHALL list the instances in the catalogue's order. For each one, it SHALL list `<family>/<model>` for each visible model, with any visible default model first. A visible model is one the user has not hidden in T3 Code, and a custom model is always visible. It SHALL list each `gemini` model once, with any `-low`, `-medium` or `-high` suffix removed. It SHALL skip a model whose id is empty or holds white space, after any suffix is removed.

#### Scenario: Reading the catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and every instance in the catalogue is enabled and `ready`
- **AND** the catalogue lists `codex` with `gpt-6-luna` and a default of `gpt-5.6-terra`, then `claudeAgent` with `claude-opus-5-5` and a default of `claude-fable-5-1`, then `antigravity` with `gemini-4-argon` and `gemini-3.8-flash`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-5.6-terra","gpt/gpt-6-luna","claude/claude-fable-5-1","claude/claude-opus-5-5","gemini/gemini-4-argon","gemini/gemini-3.8-flash"]`

#### Scenario: Disabled and failing instances
- **WHEN** the catalogue lists `codex` disabled with `gpt-6-luna`, `claudeAgent` with status `error` and `claude-opus-5-5`, and `antigravity` with status `warning` and `gemini-4-argon`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-4-argon"]`

#### Scenario: An unavailable instance
- **WHEN** the catalogue lists `antigravity`, enabled and `ready`, with `gemini-4-argon`, and T3 marks it `unavailable`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":[]`

#### Scenario: Model ids that cannot run
- **WHEN** the catalogue lists `codex`, `ready`, with the custom models `my model` and `""`, then `gpt-6-luna`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

#### Scenario: Hidden models
- **WHEN** the catalogue lists `claudeAgent`, `ready`, with `claude-opus-5-5`, the default `claude-opus-4-5`, and the custom model `claude-lab`
- **AND** the user has hidden `claude-opus-4-5` and `claude-lab` in T3 Code, and runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["claude/claude-opus-5-5","claude/claude-lab"]`

#### Scenario: An instance t3 does not run
- **WHEN** the catalogue lists `cursor`, then a second Codex instance `codex_work`, then `codex`, each enabled and `ready` with one model
- **AND** `codex` lists `gpt-6-luna`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

#### Scenario: Gemini models with an effort suffix
- **WHEN** the catalogue lists `antigravity`, `ready`, with `gemini-3.8-flash-high` and `gemini-3.8-flash-low`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-3.8-flash"]`

#### Scenario: The manifest lists a model the catalogue lacks
- **WHEN** T3's `model-manifest.json` lists `codex` with `gpt-6-astra`, and the catalogue lists `codex`, `ready`, with only `gpt-6-luna`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

### Requirement: The T3 resolver lists no models when T3 gives no catalogue
Inside T3 Code, `t3` SHALL list no `options` when it has no catalogue 10 seconds after it starts asking. The 10 seconds SHALL include issuing a token, requesting a ticket, and waiting for the reply. It SHALL also list no `options` when T3 refuses the request, or the reply holds no list of providers. In each case the command SHALL exit 0, and stderr SHALL say why `t3` lists no models.

#### Scenario: T3 does not reply
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server accepts the WebSocket but never replies
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** within 15 seconds it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

#### Scenario: T3 does not answer the ticket request
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server never answers the request for a WebSocket ticket
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** within 15 seconds it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

#### Scenario: T3 refuses the request
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 refuses the WebSocket with the message `unsupported orchestration protocol`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** it exits 0, its JSON line has `"options":[]`, and stderr contains `unsupported orchestration protocol`

#### Scenario: The reply has another shape
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 answers the catalogue request with `{"instances":[]}`
- **AND** the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

### Requirement: The T3 resolver refuses a bare family T3 lists no model for
Inside T3 Code, when `--model` names a bare family, `t3` SHALL refuse that model in three cases:
- `t3` does not list the family's provider instance: it is missing, disabled, `unavailable`, or in status `error`;
- the instance has no visible model in the catalogue;
- `t3` has no catalogue 10 seconds after it starts asking.

It SHALL start no thread, and SHALL say why on stderr. When it refuses every `--model`, the command exits 3.

#### Scenario: No visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with no models
- **AND** the user runs `lets delegate handoff run --for apply --model gpt` inside T3 Code
- **THEN** it exits 3, stderr names `codex`, and T3 receives no request to start a thread

#### Scenario: A failing instance
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `claudeAgent` with status `error` and a default of `claude-fable-5-1`
- **AND** the user runs `lets delegate handoff run --for apply --model claude --model gpt` inside T3 Code, and the catalogue lists `codex`, `ready`, with `gpt-6-luna`
- **THEN** T3 receives one request to start a thread, and that thread runs `gpt-6-luna`

#### Scenario: No catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server never replies to the catalogue request
- **AND** the user runs `lets delegate handoff run --for apply --model claude` inside T3 Code
- **THEN** within 15 seconds it exits 3, stderr says that T3 gave no model catalogue, and T3 receives no request to start a thread

### Requirement: A resolver runs a model it never listed
`t3` and `cli` SHALL try a `--model` that is not in their `options`, and SHALL NOT refuse it for that reason alone.

#### Scenario: A model the listing lacks
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex debug models` does not list `gpt-6-astra`, and the user runs `lets delegate review run --for code --model gpt/gpt-6-astra`
- **THEN** codex runs with `-m gpt-6-astra`

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

### Requirement: The T3 resolver archives a refused thread
When `t3` refuses a model for a thread it started, it SHALL archive that thread first. When it cannot, it SHALL still refuse, and stderr SHALL name the thread.

#### Scenario: A refused model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 fails the run of the thread that `lets delegate review run --for code`, with every required option, started, before any assistant message
- **THEN** the thread is archived, and the command exits 3

### Requirement: The T3 resolver keeps its token beside the lets config
`t3` SHALL read and write its T3 token at `$XDG_CONFIG_HOME/lets/t3-token` when `XDG_CONFIG_HOME` is set and not empty, and at `~/.config/lets/t3-token` otherwise. This is the folder that holds `lets`'s own `config.yaml`. It SHALL NOT read a token from the other path.

#### Scenario: XDG_CONFIG_HOME is set
- **WHEN** `t3` needs a token for a `lets delegate` command, `XDG_CONFIG_HOME` is `/cfg`, and `/cfg/lets/t3-token` holds `tok`
- **THEN** it uses `tok`, and issues no new token

#### Scenario: XDG_CONFIG_HOME is unset
- **WHEN** `t3` needs a token for a `lets delegate` command, `XDG_CONFIG_HOME` is unset, and no token is stored
- **THEN** it issues a token and writes it to `~/.config/lets/t3-token`

#### Scenario: XDG_CONFIG_HOME is empty
- **WHEN** `t3` needs a token for a `lets delegate` command, `XDG_CONFIG_HOME` is the empty string, and `~/.config/lets/t3-token` holds `tok`
- **THEN** it uses `tok`, and issues no new token

#### Scenario: A token is stored only at the old path
- **WHEN** `t3` needs a token for a `lets delegate` command, `XDG_CONFIG_HOME` is `/cfg`, `/cfg/lets/t3-token` does not exist, and `~/.config/lets/t3-token` holds `old`
- **THEN** it issues a new token and writes it to `/cfg/lets/t3-token`, and does not use `old`

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

### Requirement: The T3 resolver opens a session in the checkout that asked for it
When `t3` answers `lets delegate review run` or `lets delegate handoff run`, it SHALL open the thread in the git checkout that holds the command's working directory:
- From a linked git worktree, the thread SHALL run in that worktree's top-level directory, on the worktree's current branch. It SHALL NOT run in the main checkout.
- From the main checkout, the thread SHALL run in T3's project checkout, on the main checkout's current branch.
- When the checkout has a detached HEAD, the thread SHALL run in the same checkout, with no branch.

In every case, the thread SHALL belong to the T3 project for the main checkout. When T3 has no project for the main checkout, `t3` SHALL refuse as "A refusal exits 3" says, and stderr SHALL name the main checkout.

#### Scenario: A review from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for the main checkout `/r`
- **AND** the user runs `lets delegate review run --for code` with every required option inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`, in the project for `/r`

#### Scenario: A handoff from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for the main checkout `/r`
- **AND** the user runs `lets delegate handoff run --for apply --model gpt/gpt-6-luna` inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`

#### Scenario: A review from a subdirectory of a linked worktree
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers from `/w/fix-login/lets`, inside the linked worktree `/w/fix-login`
- **THEN** the thread runs in `/w/fix-login`, not in `/w/fix-login/lets`

#### Scenario: A linked worktree with a detached HEAD
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, which has a detached HEAD
- **THEN** the thread runs in `/w/fix-login`, with no branch

#### Scenario: A review from the main checkout
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for `/r`
- **AND** the user runs `lets delegate review run --for code` with every required option inside T3 Code, in `/r` on branch `main`
- **THEN** the thread runs in the project checkout, on branch `main`, with no worktree

#### Scenario: A linked worktree of a repository T3 has no project for
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has no project for the main checkout `/r`
- **AND** the user runs `lets delegate review run --for code` with every required option inside T3 Code, in the linked worktree `/w/fix-login`
- **THEN** it exits 3, `t3` creates no thread, and stderr names `/r`

### Requirement: The T3 resolver runs a review in default mode
When `t3` answers `lets delegate review run`, it SHALL open the thread in T3's default interaction mode, never in plan mode, whatever `--for` says. A review that changes files outside `.workspace/` SHALL still exit 7, as for every resolver.

#### Scenario: A plan review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for plan --effort medium --model gemini/gemini-4-argon` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

#### Scenario: A code review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

### Requirement: A T3 review that returns a plan exits 5
A run can end holding a proposed plan. Then `lets delegate review run` SHALL exit 5 and print nothing on stdout. Its stderr SHALL say `the session returned a plan, not a result`, followed by the thread's id. `t3` SHALL NOT archive the thread, so a person can read it. A run that holds no proposed plan SHALL be read as it is today.

#### Scenario: The run ends with a proposed plan
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code
- **AND** the thread's run completes holding a proposed plan and a final message
- **THEN** the command exits 5, stdout is empty, stderr says `the session returned a plan, not a result (thread <id>)`, and the thread is not archived

#### Scenario: The run ends with findings
- **WHEN** the same review's run completes with a final message and no proposed plan
- **THEN** the command exits 0 and prints the final message

### Requirement: The T3 resolver names the checkout T3 ran the review in
When `t3` answers `lets delegate review run`, the review's `checkout` SHALL be the checkout T3 records for the thread: the thread's worktree when T3 records one, or else the T3 project's root. It SHALL NOT be the checkout `t3` asked for, when T3 records another.

#### Scenario: T3 runs the review in the worktree it was asked for
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread in `/w/fix-login`
- **THEN** the JSON line on stderr has `"checkout":"/w/fix-login"`

#### Scenario: T3 runs the review in the project's root instead
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread with no worktree, in the project whose root is `/r`
- **THEN** the JSON line on stderr has `"checkout":"/r"`

### Requirement: A T3 review stops to ask only with a pending request
When `t3` answers `lets delegate review run`, it SHALL treat the session as stopped to ask only when T3 holds a pending request for the thread. Then the command SHALL exit 5 at once, print nothing on stdout, and say `the session stopped to ask` on stderr, followed by the thread's id. A run that T3 shows as `waiting` with no pending request SHALL NOT end the review. `t3` SHALL keep waiting for that run to end, until the review's time limit.

#### Scenario: The run shows waiting for a moment, then completes
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with every required option inside T3 Code
- **AND** T3 shows the thread's run as `waiting`, with no pending request, and then as completed with a final message and no proposed plan
- **THEN** the command exits 0 and prints the final message

#### Scenario: The session asks a question
- **WHEN** the same review's run is `waiting` or running, and T3 holds a pending request for the thread
- **THEN** the command exits 5, stdout is empty, and stderr says `the session stopped to ask (thread <id>)`

#### Scenario: The run stays waiting
- **WHEN** the same review's run stays `waiting`, with no pending request, past the review's time limit
- **THEN** the command exits 6, stdout is empty, and stderr names the thread

### Requirement: A timed-out cli session stops every process it started
When a review or a step that `cli` answers runs past its time limit, `cli` SHALL stop the CLI and every process the CLI started that is still in the CLI's process group. It SHALL send them `SIGTERM`, and SHALL send `SIGKILL` 5 seconds later to any that is still running. The command SHALL exit 6 within 10 seconds of the time limit, even when a process outside the group still holds the CLI's output.

#### Scenario: A step whose CLI started a child
- **WHEN** `cli` answers a step with `--timeout-minutes 3`, and after 3 minutes the CLI and a child process it started are both still running
- **THEN** neither the CLI nor the child is running when the command exits, the command exits 6, and stdout is empty

#### Scenario: A review whose CLI started a child
- **WHEN** `cli` answers a review, and after the review's time limit the CLI and a child process it started are both still running
- **THEN** neither the CLI nor the child is running when `lets delegate review run` exits, and it exits 6

#### Scenario: A child that ignores SIGTERM
- **WHEN** `cli` answers a step, and the CLI's child ignores `SIGTERM` and is still running after the step's time limit
- **THEN** the command exits 6 no sooner than 5 seconds and no later than 10 seconds after the time limit, and the child is no longer running when it exits

#### Scenario: A process outside the group holds the output
- **WHEN** `cli` answers a step, the CLI has started a process in a new session that holds the CLI's stdout open, and the CLI is still running after the step's time limit
- **THEN** the command exits 6 within 10 seconds of the time limit

### Requirement: A signal to lets reaches every process a cli session started
While a review or a step that `cli` answers is running, when `lets` gets `SIGINT`, `SIGTERM` or `SIGHUP`, it SHALL send the same signal to the CLI and every process the CLI started that is still in the CLI's process group. Then `lets` SHALL end as that signal ends it when no session runs.

#### Scenario: Ctrl-C during a step
- **WHEN** `cli` answers a step, the CLI has started a child process, and `lets` gets `SIGINT`
- **THEN** the CLI and the child each get `SIGINT`, and `lets` ends by `SIGINT`

#### Scenario: lets is told to stop during a review
- **WHEN** `cli` answers a review, the CLI has started a child process, and `lets` gets `SIGTERM`
- **THEN** the CLI and the child each get `SIGTERM`, and `lets` ends by `SIGTERM`

### Requirement: The T3 resolver runs a step in a T3 thread
Inside T3 Code, when `t3` answers `lets delegate step run`, it SHALL open a new T3 thread for the step and wait for the thread's final message, which `lets delegate step run` reads the step report from. The thread SHALL:
- run in the git checkout that holds the command's working directory. From a linked git worktree, it SHALL run in that worktree's top-level directory, on the worktree's current branch, and SHALL NOT run in the main checkout;
- run in T3's default interaction mode, not plan mode, with full access, so the session can write files and run commands without a prompt;
- run the `--model` as a review does: the model part sent to T3 unchanged, a bare family as the model `t3` would pick for a review, and `--effort` as T3's effort option, with no effort for a `gemini` model.

The command's JSON line on stderr SHALL have a `handle` of kind `thread`.

#### Scenario: A step from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate step run --for build --name build-x --prompt-file p.md --effort high --model gpt/gpt-6-luna` inside T3 Code, in a linked worktree at `/w/feature` on branch `feature`
- **AND** the thread's final message ends with a `done` step report
- **THEN** T3 is asked for one new thread in the worktree `/w/feature`, on branch `feature`, in default mode, running `gpt-6-luna` with effort `high`
- **AND** the command exits 0, stdout is one JSON line with `"outcome":"done"`, and the JSON line on stderr has `"resolver":"t3"`, `"family":"gpt"`, `"model":"gpt-6-luna"` and a `handle` of kind `thread`

#### Scenario: A step from the main checkout
- **WHEN** the same step runs from the main checkout of the repository that T3's project names
- **THEN** T3 is asked for a thread in the project's own checkout, on its current branch

#### Scenario: A gemini step
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate step run --for plan --effort medium --model gemini` with the other required options inside T3 Code, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

### Requirement: A T3 step ends as a T3 review does
When `t3` answers `lets delegate step run`, it SHALL tell a refusal, a stopped session and a final message apart as it does for a review:
- T3 or the account saying no before any assistant message SHALL be a refusal. `t3` SHALL archive the thread, and the command SHALL try the next `--model`. When every `--model` is refused, it SHALL exit 3.
- A session SHALL be a failed session when it stops to ask, ends with a proposed plan or fails after an assistant message. So SHALL a session whose run is interrupted, cancelled or rolled back. The command SHALL exit 0 and print a `failed` report whose `reason` names the thread. `t3` SHALL keep the thread.
- A step whose report is `done` SHALL have its thread archived. A step whose report is `needs-input` or `failed` SHALL keep its thread, so a person can read it.

#### Scenario: The model is refused, and the next one runs
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate step run --for build --model gpt/gpt-6-astra --model claude` with the other required options inside T3 Code
- **AND** T3 fails the first thread's run with no assistant message, and the second thread's final message ends with a `done` step report
- **THEN** the first thread is archived, the command exits 0, and the JSON line on stderr has `"family":"claude"`

#### Scenario: Every model is refused
- **WHEN** T3 fails the run of the only thread a step started, with no assistant message
- **THEN** the thread is archived, the command exits 3, stdout is empty, and stderr holds T3's failure message

#### Scenario: The session stops to ask
- **WHEN** `t3` answers a step, and T3 holds a pending request for the thread
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that says `the session stopped to ask` and names the thread, the thread is not archived, and the record on stderr has `"handle":null`

#### Scenario: A done step
- **WHEN** a step thread's final message ends with a `done` step report
- **THEN** the thread is archived

#### Scenario: A step that needs input
- **WHEN** a step thread's final message ends with a `needs-input` step report
- **THEN** the command exits 0 with that report, and the thread is not archived

### Requirement: A timed-out T3 session is stopped
When a step or a review that `t3` answered is still running at its time limit, `t3` SHALL ask T3 to stop the thread, as T3 Code's Stop does, and SHALL keep the thread. The command SHALL then exit 6, print nothing on stdout, and name the thread on stderr. `t3` SHALL wait at most 10 seconds for T3 to accept the stop. When T3 rejects the stop or does not answer in time, the command SHALL still exit 6. Its stderr SHALL then say that the thread could not be stopped and may still be running.

#### Scenario: The step runs too long
- **WHEN** `t3` answers `lets delegate step run --timeout-minutes 3` with the other required options, and the thread's run has not ended after 3 minutes
- **THEN** T3 is asked to stop that thread, the thread is not archived, the command exits 6, stdout is empty, and stderr names the thread

#### Scenario: The stop fails
- **WHEN** the same step times out, and T3 rejects the request to stop the thread
- **THEN** the command exits 6, stdout is empty, and stderr names the thread and says it could not be stopped

#### Scenario: T3 does not answer the stop
- **WHEN** the same step times out, and T3 does not answer the request to stop the thread
- **THEN** the command exits 6 no more than 10 seconds after the time limit, and stderr names the thread and says it could not be stopped

#### Scenario: The review runs too long
- **WHEN** `t3` answers `lets delegate review run --timeout-minutes 3` with the other required options, and the thread's run has not ended after 3 minutes
- **THEN** T3 is asked to stop that thread, the thread is not archived, the command exits 6, and stdout is empty

### Requirement: The T3 resolver lists the same models for a step as for a review
Inside T3 Code, `lets delegate step instructions` SHALL answer with `resolver` `t3` and the same `options` as `lets delegate review instructions`.

#### Scenario: Step instructions inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the command runs inside T3 Code, the catalogue lists `codex`, enabled and `ready`, with `gpt-6-luna`, and the user runs `lets delegate step instructions --for plan`
- **THEN** it exits 0, and its JSON line has `"strategy":"step"`, `"resolver":"t3"` and `"options":["gpt/gpt-6-luna"]`
