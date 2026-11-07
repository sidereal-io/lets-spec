## ADDED Requirements

### Requirement: The cli resolver declines every step
`cli` SHALL decline every step and the instructions for one, even when a family CLI is on `PATH`, and SHALL run no CLI and no listing command for it. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: A step with CLIs on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli]`, `codex`, `claude` and `agy` are on `PATH`, and the user runs `lets delegate step run --for apply` with every required option
- **THEN** it exits 2, stdout is empty, stderr says every resolver declined, and no process is started

#### Scenario: Step instructions with codex on PATH
- **WHEN** the config's `delegate.resolvers` is `[cli, subagent]`, `codex` is on `PATH`, and the user runs `lets delegate step instructions --for apply`
- **THEN** its JSON line has `"resolver":"subagent"`, and `codex` is not run

### Requirement: The T3 resolver declines every step
`t3` SHALL decline every step and the instructions for one, inside T3 Code or not, and SHALL open no thread for it. The next resolver in the chain answers, or the command exits 2 when none is left.

#### Scenario: A step inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, the command runs inside T3 Code, and the user runs `lets delegate step run --for apply` with every required option
- **THEN** no thread is created, and the default answers

#### Scenario: Step instructions inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the command runs inside T3 Code, and the user runs `lets delegate step instructions --for propose`
- **THEN** it exits 2, stdout is empty, and stderr says every resolver declined
