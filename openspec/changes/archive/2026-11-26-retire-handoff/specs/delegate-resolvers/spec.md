## MODIFIED Requirements

### Requirement: The T3 resolver declines outside T3 Code
When the process is not inside T3 Code, `t3` SHALL decline every review and step, and the instructions for each, and SHALL start no session. It SHALL NOT look for any other harness. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: Inside herdr
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for code` with every required option inside herdr, and no T3 server is its ancestor
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no thread is created

#### Scenario: While T3 Code runs elsewhere
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the T3 server is running, and the user runs `lets delegate review instructions --for code` in a terminal that the server did not start
- **THEN** it exits 2, stdout is empty, and stderr says every resolver declined

#### Scenario: A step outside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, no T3 server is the process's ancestor, and the user runs `lets delegate step run --for build` with every required option
- **THEN** no thread is created, and the default answers

### Requirement: The T3 resolver refuses a bare family T3 lists no model for
Inside T3 Code, when `--model` names a bare family, `t3` SHALL refuse that model in three cases:
- `t3` does not list the family's provider instance: it is missing, disabled, `unavailable`, or in status `error`;
- the instance has no visible model in the catalogue;
- `t3` has no catalogue 10 seconds after it starts asking.

It SHALL start no thread, and SHALL say why on stderr. When it refuses every `--model`, the command exits 3.

#### Scenario: No visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with no models
- **AND** the user runs `lets delegate review run --for code --model gpt` inside T3 Code
- **THEN** it exits 3, stderr names `codex`, and T3 receives no request to start a thread

#### Scenario: A failing instance
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `claudeAgent` with status `error` and a default of `claude-fable-5-1`
- **AND** the user runs `lets delegate review run --for code --model claude --model gpt` inside T3 Code, and the catalogue lists `codex`, `ready`, with `gpt-6-luna`
- **THEN** T3 receives one request to start a thread, and that thread runs `gpt-6-luna`

#### Scenario: No catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the T3 server never replies to the catalogue request
- **AND** the user runs `lets delegate review run --for code --model claude` inside T3 Code
- **THEN** within 15 seconds it exits 3, stderr says that T3 gave no model catalogue, and T3 receives no request to start a thread

### Requirement: A refusal exits 3
When `t3` or `cli` answers, the harness or the account can say no before the model gives any output. `lets delegate review run` and `lets delegate step run` SHALL treat that as a refusal, and SHALL say why on stderr. A refusal covers a harness that cannot start the session, and a missing harness setup, such as a T3 project. It also covers an account with no access or no tokens left, and a model the harness cannot run. When every `--model` is refused, the command exits 3. The command SHALL exit 4 for `t3` or `cli` only for an outcome it cannot know, such as no reply from T3.

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

## ADDED Requirements

### Requirement: The T3 resolver runs a review in a T3 thread
Inside T3 Code, when `t3` answers `lets delegate review run`, it SHALL open a session in a T3 thread that runs the `--model`. It SHALL send the model part of `--model` to T3 unchanged. For a `gemini` model, it SHALL send no effort, because T3 offers no effort option for Gemini; a review's `--effort` does not apply.

A bare family SHALL run a model from T3's catalogue, chosen from that family's provider instance, when `t3` lists that instance (see "The T3 resolver lists the models T3 Code can run now"):
- the visible model that the catalogue marks as the default;
- or else, when no visible model is the default, the first visible model.

A visible model is one the user has not hidden in T3 Code. A custom model is always visible. For `gemini`, the chosen model SHALL have its `-low`, `-medium` or `-high` suffix removed.

#### Scenario: A review inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for code --model claude/claude-opus-5-5` inside T3 Code, the project has a default model of `gpt-6-luna`, and the session ends with a final message
- **THEN** the thread runs `claude-opus-5-5`, the command exits 0, and its JSON line on stderr has `"family":"claude"` and a `handle` of kind `thread`

#### Scenario: A gemini review runs the model as given
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the user runs `lets delegate review run --for plan --effort medium --model gemini/gemini-4-argon` inside T3 Code
- **THEN** the thread runs `gemini-4-argon`, with no effort option

#### Scenario: A bare family runs the catalogue's default
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-6-luna` and a default of `gpt-5.6-terra`
- **AND** T3's `model-manifest.json` gives `codex` no default, and the user runs `lets delegate review run --for code --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-5.6-terra`

#### Scenario: A bare family with no default runs the first visible model
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `codex` with `gpt-5.6-terra` as its default, then `gpt-6-luna`
- **AND** the user has hidden `gpt-5.6-terra` in T3 Code, and runs `lets delegate review run --for code --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-6-luna`

#### Scenario: A bare gemini review runs the default without its effort
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **AND** the user runs `lets delegate review run --for plan --effort low --model gemini` inside T3 Code
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

### Requirement: The T3 resolver opens a review in the checkout that asked for it
When `t3` answers `lets delegate review run`, it SHALL open the thread in the git checkout that holds the command's working directory:
- From a linked git worktree, the thread SHALL run in that worktree's top-level directory, on the worktree's current branch. It SHALL NOT run in the main checkout.
- From the main checkout, the thread SHALL run in T3's project checkout, on the main checkout's current branch.
- When the checkout has a detached HEAD, the thread SHALL run in the same checkout, with no branch.

In every case, the thread SHALL belong to the T3 project for the main checkout. When T3 has no project for the main checkout, `t3` SHALL refuse as "A refusal exits 3" says, and stderr SHALL name the main checkout.

#### Scenario: A review from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and T3 has a project for the main checkout `/r`
- **AND** the user runs `lets delegate review run --for code` with every required option inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`, in the project for `/r`

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

## REMOVED Requirements

### Requirement: The T3 resolver opens a session in a T3 thread
**Reason**: Replaced by *The T3 resolver runs a review in a T3 thread*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *A handoff inside T3 Code* moved into *A review inside T3 Code*, the two bare-family scenarios now run a review, and *A bare gemini handoff runs the default without its effort* is gone because *A bare gemini review runs the default without its effort* covers it.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: The T3 resolver opens a session in the checkout that asked for it
**Reason**: Replaced by *The T3 resolver opens a review in the checkout that asked for it*, without the handoff strategy. OpenSpec refuses a MODIFIED requirement that drops or renames a scenario, so the requirement moves under a new name. Apart from the strategy, the rule is unchanged: its scenario *A handoff from a linked worktree* is gone because *A review from a linked worktree* covers it.
**Migration**: None for `review` and `step`. `lets delegate handoff` is gone; run the work as a `lets-go` step instead.

### Requirement: The cli resolver declines every handoff
**Reason**: `lets delegate handoff` is gone, so no resolver is asked for a handoff.
**Migration**: None. `cli` still runs reviews and steps headless, as *The cli resolver runs a review headless* and *The cli resolver runs a step headless* say.
