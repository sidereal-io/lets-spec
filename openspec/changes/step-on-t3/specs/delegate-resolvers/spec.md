## ADDED Requirements

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
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate step run --for plan --effort medium --model gemini` inside T3 Code, and the catalogue lists `antigravity` with a default of `gemini-3.8-flash-high`
- **THEN** the thread runs `gemini-3.8-flash`, with no effort option

### Requirement: A T3 step ends as a T3 review does
When `t3` answers `lets delegate step run`, it SHALL tell a refusal, a stopped session and a final message apart as it does for a review:
- T3 or the account saying no before any assistant message SHALL be a refusal. `t3` SHALL archive the thread, and the command SHALL try the next `--model`. When every `--model` is refused, it SHALL exit 3.
- A session that stops to ask, that ends with a proposed plan, that fails after an assistant message, or whose run is interrupted, cancelled or rolled back, SHALL be a failed session. The command SHALL exit 0 and print a `failed` report whose `reason` names the thread. `t3` SHALL keep the thread.
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

### Requirement: A timed-out T3 step is stopped
When a step that `t3` answered is still running at the step's time limit, `t3` SHALL ask T3 to stop the thread, as T3 Code's Stop does, and SHALL keep the thread. The command SHALL then exit 6, print nothing on stdout, and name the thread on stderr. When T3 does not accept the stop, the command SHALL still exit 6, and stderr SHALL say that the thread could not be stopped and may still be running.

#### Scenario: The step runs too long
- **WHEN** `t3` answers `lets delegate step run --timeout-minutes 3` with the other required options, and the thread's run has not ended after 3 minutes
- **THEN** T3 is asked to stop that thread, the thread is not archived, the command exits 6, stdout is empty, and stderr names the thread

#### Scenario: The stop fails
- **WHEN** the same step times out, and T3 rejects the request to stop the thread
- **THEN** the command exits 6, stdout is empty, and stderr names the thread and says it could not be stopped

#### Scenario: A review that runs too long is not stopped
- **WHEN** `t3` answers `lets delegate review run --timeout-minutes 3`, and the thread's run has not ended after 3 minutes
- **THEN** the command exits 6, and T3 is not asked to stop the thread

### Requirement: The T3 resolver lists the same models for a step as for a review
Inside T3 Code, `lets delegate step instructions` SHALL answer with `resolver` `t3` and the same `options` as `lets delegate review instructions`.

#### Scenario: Step instructions inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the command runs inside T3 Code, the catalogue lists `codex`, enabled and `ready`, with `gpt-6-luna`, and the user runs `lets delegate step instructions --for plan`
- **THEN** it exits 0, and its JSON line has `"strategy":"step"`, `"resolver":"t3"` and `"options":["gpt/gpt-6-luna"]`

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: The T3 resolver declines every step
**Reason**: `t3` now runs a step in a T3 thread inside T3 Code. *The T3 resolver runs a step in a T3 thread* replaces this requirement, and *The T3 resolver declines outside T3 Code* keeps the decline outside it.
**Migration**: Inside T3 Code, steps now run in T3 threads when `t3` comes first in `delegate.resolvers`. To keep running them through `cli` or `subagent`, list that resolver before `t3`.
