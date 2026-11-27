<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: One resolver runs every family CLI on PATH
`lets` SHALL have a resolver named `cli`. When the config lists it, it SHALL answer with `resolver` `cli` and its `options` wherever at least one of `codex`, `claude` or `agy` is on `PATH`. It SHALL NOT check which harness it runs in.

#### Scenario: One CLI on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, and neither `codex` nor `agy` is, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it exits 0, and its JSON line has `"resolver":"cli"` and `"options":["claude"]`

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the command runs inside T3 Code with `codex` on `PATH`, `codex debug models` lists `gpt-6-luna` with `visibility` `list`, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it exits 0, and its JSON line has `"resolver":"cli"` and `"options":["gpt/gpt-6-luna"]`

### Requirement: The cli resolver declines when no family CLI is on PATH
When none of `codex`, `claude` or `agy` is on `PATH`, `cli` SHALL decline every review, every step and their instructions, and SHALL start no process. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: No family CLI
- **WHEN** the config's `delegate.resolvers` is `[cli]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate review run --for review-build` with every required option
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no process is started

#### Scenario: No family CLI, and the default next
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate review instructions --for review-build`
- **THEN** its JSON line has `"resolver":"subagent"`, and no process is started

#### Scenario: No family CLI, and a step
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, none of `codex`, `claude` or `agy` is on `PATH`, and the user runs `lets delegate step run --for build --name build-x` with the other required options
- **THEN** the default answers: it exits 3, stderr names `.workspace/lets-delegate/build-x.prompt.md`, and no process is started

### Requirement: The cli resolver runs a review headless
When `cli` answers `lets delegate review run`, it SHALL run the CLI of the `--model` family as a child process in its read-only mode. That is `codex exec` with the read-only sandbox for `gpt`, `claude -p` in plan mode for `claude`, or `agy -p` in plan mode for `gemini`. It SHALL pass the review's effort. It SHALL pass the model part of `--model` unchanged, and SHALL add the effort to a `gemini` model as `<model>-<effort>`. It SHALL pass no model when `--model` is a bare family. The command SHALL print the CLI's final message. Its JSON line on stderr SHALL have the `--model` family as `family`, and a handle of kind `process`.

#### Scenario: A review with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` is on `PATH`, the user runs `lets delegate review run --for review-build --model gpt/gpt-6-luna`, and codex ends with a final message
- **THEN** codex runs with `-m gpt-6-luna`, the command exits 0 and prints codex's final message, and its JSON line on stderr has `"family":"gpt"`, `"model":"gpt-6-luna"` and a `handle` of kind `process`

#### Scenario: A bare family
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `claude` is on `PATH`, and the user runs `lets delegate review run --for review-build --model claude`
- **THEN** claude runs with no `--model` argument, and the JSON line on stderr has `"family":"claude"`

#### Scenario: A gemini model at high effort
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `agy` is on `PATH`, and the user runs `lets delegate review run --for review-build --effort high --model gemini/gemini-3.8-flash`
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

### Requirement: The cli resolver cleans up after a review
When a review that `cli` answered ends with a clean tree and a final message, `cli` SHALL remove the files it wrote for that session in `.workspace/lets-delegate/`. When the review ends otherwise, it SHALL leave them.

#### Scenario: Finishing a review with codex
- **WHEN** the config's `delegate.resolvers` is `[cli]`, and `lets delegate review run --for review-build --name cli-resolver --model gpt` ends with a clean tree and codex's final message
- **THEN** it exits 0, and `.workspace/lets-delegate/cli-resolver.last-message.md` no longer exists

#### Scenario: Finishing a review that changed the tree
- **WHEN** the same review ends having changed a file outside `.workspace/`
- **THEN** it exits 7, and `.workspace/lets-delegate/cli-resolver.last-message.md` still exists

### Requirement: T3 Code has its own resolver
`lets` SHALL have a resolver named `t3`, which answers only for T3 Code. Inside T3 Code, it SHALL answer with `resolver` `t3` and its `options`. It SHALL find the process's parents both on a system with `/proc`, such as Linux, and on one without, such as macOS. `lets` SHALL NOT have a resolver for herdr.

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the command runs in a process whose ancestor is the running T3 server
- **AND** T3's catalogue lists only disabled provider instances, and the user runs `lets delegate review instructions --for review-build`
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

#### Scenario: Inside T3 Code on a system with no /proc
- **WHEN** the same command runs on a system with no `/proc`, where `ps -o ppid= -p <pid>` shows that the running T3 server is the process's ancestor
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

### Requirement: The T3 resolver declines outside T3 Code
When the process is not inside T3 Code, `t3` SHALL decline every review and step, and the instructions for each, and SHALL start no session. It SHALL NOT look for any other harness. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: Inside herdr
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for review-build` with every required option inside herdr, and no T3 server is its ancestor
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no thread is created

#### Scenario: While T3 Code runs elsewhere
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the T3 server is running, and the user runs `lets delegate review instructions --for review-build` in a terminal that the server did not start
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
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex debug models` reports `gpt-reserve` with `visibility` `hide` and `gpt-6-luna` with `visibility` `list`, `agy models` reports `gemini-3.8-flash-high`, `gemini-3.8-flash-low` and `claude-sonnet-4-6`, and the user runs `lets delegate review instructions --for review-build`
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna","claude","gemini/gemini-3.8-flash"]`

### Requirement: The cli resolver lists the bare family when a listing fails
A family's model listing can fail: it exits non-zero, runs past its time limit, or prints what `cli` cannot read. Then `lets delegate review instructions` and `lets delegate step instructions` SHALL list the bare family in that family's place in `options`, and still exit 0. They SHALL name the CLI and the failure on stderr.

#### Scenario: codex is signed out
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex` and `claude` are on `PATH`, `codex debug models` exits 1, and the user runs `lets delegate review instructions --for review-build`
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
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-5.6-terra","gpt/gpt-6-luna","claude/claude-fable-5-1","claude/claude-opus-5-5","gemini/gemini-4-argon","gemini/gemini-3.8-flash"]`

#### Scenario: Disabled and failing instances
- **WHEN** the catalogue lists `codex` disabled with `gpt-6-luna`, `claudeAgent` with status `error` and `claude-opus-5-5`, and `antigravity` with status `warning` and `gemini-4-argon`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-4-argon"]`

#### Scenario: An unavailable instance
- **WHEN** the catalogue lists `antigravity`, enabled and `ready`, with `gemini-4-argon`, and T3 marks it `unavailable`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":[]`

#### Scenario: Model ids that cannot run
- **WHEN** the catalogue lists `codex`, `ready`, with the custom models `my model` and `""`, then `gpt-6-luna`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

#### Scenario: Hidden models
- **WHEN** the catalogue lists `claudeAgent`, `ready`, with `claude-opus-5-5`, the default `claude-opus-4-5`, and the custom model `claude-lab`
- **AND** the user has hidden `claude-opus-4-5` and `claude-lab` in T3 Code, and runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["claude/claude-opus-5-5","claude/claude-lab"]`

#### Scenario: An instance t3 does not run
- **WHEN** the catalogue lists `cursor`, then a second Codex instance `codex_work`, then `codex`, each enabled and `ready` with one model
- **AND** `codex` lists `gpt-6-luna`, and the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

#### Scenario: Gemini models with an effort suffix
- **WHEN** the catalogue lists `antigravity`, `ready`, with `gemini-3.8-flash-high` and `gemini-3.8-flash-low`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-3.8-flash"]`

#### Scenario: The manifest lists a model the catalogue lacks
- **WHEN** T3's `model-manifest.json` lists `codex` with `gpt-6-astra`, and the catalogue lists `codex`, `ready`, with only `gpt-6-luna`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

### Requirement: The T3 resolver lists no models when T3 gives no catalogue
Inside T3 Code, `t3` SHALL list no `options` when it has no catalogue 10 seconds after it starts asking. The 10 seconds SHALL include issuing a token, requesting a ticket, and waiting for the reply. It SHALL also list no `options` when T3 refuses the request, or the reply holds no list of providers. In each case the command SHALL exit 0, and stderr SHALL say why `t3` lists no models.

#### Scenario: T3 does not reply
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server accepts the WebSocket but never replies
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** within 15 seconds it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

#### Scenario: T3 does not answer the ticket request
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server never answers the request for a WebSocket ticket
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** within 15 seconds it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

#### Scenario: T3 refuses the request
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 refuses the WebSocket with the message `unsupported orchestration protocol`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** it exits 0, its JSON line has `"options":[]`, and stderr contains `unsupported orchestration protocol`

#### Scenario: The reply has another shape
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 answers the catalogue request with `{"instances":[]}`
- **AND** the user runs `lets delegate review instructions --for review-build` inside T3 Code
- **THEN** it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

### Requirement: The T3 resolver refuses a bare family T3 lists no model for
Inside T3 Code, when `--model` names a bare family, `t3` SHALL refuse that model in three cases:
- `t3` does not list the family's provider instance: it is missing, disabled, `unavailable`, or in status `error`;
- the instance has no visible model in the catalogue;
- `t3` has no catalogue 10 seconds after it starts asking.

It SHALL start no thread, and SHALL say why on stderr. When it refuses every `--model`, the command exits 3.

#### Scenario: No visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with no models
- **AND** the user runs `lets delegate review run --for review-build --model gpt` inside T3 Code
- **THEN** it exits 3, stderr names `codex`, and T3 receives no request to start a thread

#### Scenario: A failing instance
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `claudeAgent` with status `error` and a default of `claude-fable-5-1`
- **AND** the user runs `lets delegate review run --for review-build --model claude --model gpt` inside T3 Code, and the catalogue lists `codex`, `ready`, with `gpt-6-luna`
- **THEN** T3 receives one request to start a thread, and that thread runs `gpt-6-luna`

#### Scenario: No catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server never replies to the catalogue request
- **AND** the user runs `lets delegate review run --for review-build --model claude` inside T3 Code
- **THEN** within 15 seconds it exits 3, stderr says that T3 gave no model catalogue, and T3 receives no request to start a thread

### Requirement: A resolver runs a model it never listed
`t3` and `cli` SHALL try a `--model` that is not in their `options`, and SHALL NOT refuse it for that reason alone.

#### Scenario: A model the listing lacks
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex debug models` does not list `gpt-6-astra`, and the user runs `lets delegate review run --for review-build --model gpt/gpt-6-astra`
- **THEN** codex runs with `-m gpt-6-astra`

### Requirement: A refusal exits 3
When `t3` or `cli` answers, the harness or the account can say no before the model gives any output. `lets delegate review run` and `lets delegate step run` SHALL treat that as a refusal, and SHALL say why on stderr. A refusal covers a harness that cannot start the session, and a missing harness setup, such as a T3 project. It also covers an account with no access or no tokens left, and a model the harness cannot run. When every `--model` is refused, the command exits 3. The command SHALL exit 4 for `t3` or `cli` only for an outcome it cannot know, such as no reply from T3.

#### Scenario: The CLI refuses the model
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate review run --for review-build --model gpt/gpt-6-astra`, and codex exits 1 with nothing on stdout
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
- **WHEN** an earlier `gpt` review named `x` left `.workspace/lets-delegate/x.last-message.md`, and a new `lets delegate review run --for review-build --name x --model gpt/gpt-6-astra` that `cli` answers gets a codex that exits 1 without writing that file
- **THEN** it exits 3, not 5

#### Scenario: T3 has no project for the repository
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for review-build` with every required option inside T3 Code in a repository that T3 has no project for
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
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 fails the run of the thread that `lets delegate review run --for review-build`, with every required option, started, before any assistant message
- **THEN** the thread is archived, and the command exits 3

### Requirement: The T3 resolver runs a review in default mode
When `t3` answers `lets delegate review run`, it SHALL open the thread in T3's default interaction mode, never in plan mode, whatever `--for` says. A review that changes files outside `.workspace/` SHALL still exit 7, as for every resolver.

#### Scenario: A plan review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for review-plan --effort medium --model gemini/gemini-4-argon` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

#### Scenario: A code review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for review-build --model gpt/gpt-6-luna` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

### Requirement: A T3 review that returns a plan exits 5
A run can end holding a proposed plan. Then `lets delegate review run` SHALL exit 5 and print nothing on stdout. Its stderr SHALL say `the session returned a plan, not a result`, followed by the thread's id. `t3` SHALL NOT archive the thread, so a person can read it. A run that holds no proposed plan SHALL be read as it is today.

#### Scenario: The run ends with a proposed plan
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for review-build` with every required option inside T3 Code
- **AND** the thread's run completes holding a proposed plan and a final message
- **THEN** the command exits 5, stdout is empty, stderr says `the session returned a plan, not a result (thread <id>)`, and the thread is not archived

#### Scenario: The run ends with findings
- **WHEN** the same review's run completes with a final message and no proposed plan
- **THEN** the command exits 0 and prints the final message

### Requirement: The T3 resolver names the checkout T3 ran the review in
When `t3` answers `lets delegate review run`, the review's `checkout` SHALL be the checkout T3 records for the thread: the thread's worktree when T3 records one, or else the T3 project's root. It SHALL NOT be the checkout `t3` asked for, when T3 records another.

#### Scenario: T3 runs the review in the worktree it was asked for
- **WHEN** the user runs `lets delegate review run --for review-build` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread in `/w/fix-login`
- **THEN** the JSON line on stderr has `"checkout":"/w/fix-login"`

#### Scenario: T3 runs the review in the project's root instead
- **WHEN** the user runs `lets delegate review run --for review-build` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread with no worktree, in the project whose root is `/r`
- **THEN** the JSON line on stderr has `"checkout":"/r"`

### Requirement: A T3 review stops to ask only with a pending request
When `t3` answers `lets delegate review run`, it SHALL treat the session as stopped to ask only when T3 holds a pending request for the thread. Then the command SHALL exit 5 at once, print nothing on stdout, and say `the session stopped to ask` on stderr, followed by the thread's id. A run that T3 shows as `waiting` with no pending request SHALL NOT end the review. `t3` SHALL keep waiting for that run to end, until the review's time limit.

#### Scenario: The run shows waiting for a moment, then completes
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for review-build --model gpt/gpt-6-luna` with every required option inside T3 Code
- **AND** T3 shows the thread's run as `waiting`, with no pending request, and then as completed with a final message and no proposed plan
- **THEN** the command exits 0 and prints the final message

#### Scenario: The session asks a question
- **WHEN** the same review's run is `waiting` or running, and T3 holds a pending request for the thread
- **THEN** the command exits 5, stdout is empty, and stderr says `the session stopped to ask (thread <id>)`

#### Scenario: The run stays waiting
- **WHEN** the same review's run stays `waiting`, with no pending request, past the review's time limit
- **THEN** the command exits 6, stdout is empty, and stderr names the thread

### Requirement: The T3 resolver runs a review in a T3 thread
Inside T3 Code, when `t3` answers `lets delegate review run`, it SHALL open a session in a T3 thread that runs the `--model`. It SHALL send the model part of `--model` to T3 unchanged. For a `gemini` model, it SHALL send no effort, because T3 offers no effort option for Gemini; a review's `--effort` does not apply.

A bare family SHALL run a model from T3's catalogue, chosen from that family's provider instance, when `t3` lists that instance (see "The T3 resolver lists the models T3 Code can run now"):
- the visible model that the catalogue marks as the default;
- or else, when no visible model is the default, the first visible model.

A visible model is one the user has not hidden in T3 Code. A custom model is always visible. For `gemini`, the chosen model SHALL have its `-low`, `-medium` or `-high` suffix removed.

#### Scenario: A review inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for review-build --model claude/claude-opus-5-5` inside T3 Code, the project has a default model of `gpt-6-luna`, and the session ends with a final message
- **THEN** the thread runs `claude-opus-5-5`, the command exits 0, and its JSON line on stderr has `"family":"claude"` and a `handle` of kind `thread`

#### Scenario: A gemini review runs the model as given
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the user runs `lets delegate review run --for review-plan --effort medium --model gemini/gemini-4-argon` inside T3 Code
- **THEN** the thread runs `gemini-4-argon`, with no effort option

#### Scenario: A bare family runs the catalogue's default
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-6-luna` and a default of `gpt-5.6-terra`
- **AND** T3's `model-manifest.json` gives `codex` no default, and the user runs `lets delegate review run --for review-build --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-5.6-terra`

#### Scenario: A bare family with no default runs the first visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-5.6-terra` as its default, then `gpt-6-luna`
- **AND** the user has hidden `gpt-5.6-terra` in T3 Code, and runs `lets delegate review run --for review-build --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-6-luna`

#### Scenario: A bare gemini review runs the default without its effort
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **AND** the user runs `lets delegate review run --for review-plan --effort low --model gemini` inside T3 Code
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

### Requirement: The T3 resolver opens a review in the checkout that asked for it
When `t3` answers `lets delegate review run`, it SHALL open the thread in the git checkout that holds the command's working directory:
- From a linked git worktree, the thread SHALL run in that worktree's top-level directory, on the worktree's current branch. It SHALL NOT run in the main checkout.
- From the main checkout, the thread SHALL run in T3's project checkout, on the main checkout's current branch.
- When the checkout has a detached HEAD, the thread SHALL run in the same checkout, with no branch.

In every case, the thread SHALL belong to the T3 project for the main checkout. When T3 has no project for the main checkout, `t3` SHALL refuse as "A refusal exits 3" says, and stderr SHALL name the main checkout.

#### Scenario: A review from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for the main checkout `/r`
- **AND** the user runs `lets delegate review run --for review-build` with every required option inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`, in the project for `/r`

#### Scenario: A review from a subdirectory of a linked worktree
- **WHEN** the user runs `lets delegate review run --for review-build` that `t3` answers from `/w/fix-login/lets`, inside the linked worktree `/w/fix-login`
- **THEN** the thread runs in `/w/fix-login`, not in `/w/fix-login/lets`

#### Scenario: A linked worktree with a detached HEAD
- **WHEN** the user runs `lets delegate review run --for review-build` that `t3` answers in the linked worktree `/w/fix-login`, which has a detached HEAD
- **THEN** the thread runs in `/w/fix-login`, with no branch

#### Scenario: A review from the main checkout
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for `/r`
- **AND** the user runs `lets delegate review run --for review-build` with every required option inside T3 Code, in `/r` on branch `main`
- **THEN** the thread runs in the project checkout, on branch `main`, with no worktree

#### Scenario: A linked worktree of a repository T3 has no project for
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has no project for the main checkout `/r`
- **AND** the user runs `lets delegate review run --for review-build` with every required option inside T3 Code, in the linked worktree `/w/fix-login`
- **THEN** it exits 3, `t3` creates no thread, and stderr names `/r`
