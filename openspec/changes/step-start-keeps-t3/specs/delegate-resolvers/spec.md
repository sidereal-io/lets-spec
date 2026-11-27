## MODIFIED Requirements

### Requirement: T3 Code has its own resolver
`lets` SHALL have a resolver named `t3`, which answers only for T3 Code. Inside T3 Code, it SHALL answer with `resolver` `t3` and its `options`. A process is inside T3 Code when the running T3 server is one of its ancestors. A background step that `lets delegate step start` started from inside T3 Code is inside T3 Code too, for as long as the T3 server that was an ancestor of `step start` still runs. It SHALL find the process's parents both on a system with `/proc`, such as Linux, and on one without, such as macOS. `lets` SHALL NOT have a resolver for herdr.

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]` and the command runs in a process whose ancestor is the running T3 server
- **AND** T3's catalogue lists only disabled provider instances, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

#### Scenario: Inside T3 Code on a system with no /proc
- **WHEN** the same command runs on a system with no `/proc`, where `ps -o ppid= -p <pid>` shows that the running T3 server is the process's ancestor
- **THEN** it exits 0, its JSON line has `"resolver":"t3"` and `"options":[]`, and stderr is empty

#### Scenario: A background step started inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate step start --for plan` with every required option in a process whose ancestor is the running T3 server, and `step start` has exited before the background step picks its resolver
- **THEN** `t3` answers the background step, and a T3 thread runs the session

### Requirement: The T3 resolver declines outside T3 Code
When the process is not inside T3 Code, `t3` SHALL decline every review, handoff and step, and the instructions for each, and SHALL start no session. It SHALL NOT look for any other harness. A background step that `lets delegate step start` started from inside T3 Code is no longer inside T3 Code once the T3 server that was an ancestor of `step start` has stopped, even when another T3 server has started since. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: Inside herdr
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the user runs `lets delegate review run --for code` with every required option inside herdr, and no T3 server is its ancestor
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no thread is created

#### Scenario: While T3 Code runs elsewhere
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the T3 server is running, and the user runs `lets delegate review instructions --for code` in a terminal that the server did not start
- **THEN** it exits 2, stdout is empty, and stderr says every resolver declined

#### Scenario: A step outside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, no T3 server is the process's ancestor, and the user runs `lets delegate step run --for build` with every required option
- **THEN** no thread is created, and the default answers

#### Scenario: A background step whose T3 server has stopped
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, the user runs `lets delegate step start --for build` with every required option inside T3 Code, and the T3 server that was the ancestor of `step start` stops before the background step picks its resolver
- **THEN** `t3` declines and creates no thread, and the default answers the background step, as it would answer `lets delegate step run` outside T3 Code
