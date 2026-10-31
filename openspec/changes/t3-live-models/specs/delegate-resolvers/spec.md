## MODIFIED Requirements

### Requirement: T3 Code has its own resolver
`lets` SHALL have a resolver named `t3`, which answers only for T3 Code. Inside T3 Code, it SHALL answer with `resolver` `t3` and its `options`. It SHALL find the process's parents both on a system with `/proc`, such as Linux, and on one without, such as macOS. `lets` SHALL NOT have a resolver for herdr.

#### Scenario: Inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the command runs in a process whose ancestor is the running T3 server, T3's catalogue has no provider that `t3` can list, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and its JSON line has `"resolver":"t3"` and `"options":[]`

#### Scenario: Inside T3 Code on a system with no /proc
- **WHEN** the same command runs on a system with no `/proc`, where `ps -o ppid= -p <pid>` shows that the running T3 server is the process's ancestor
- **THEN** it exits 0, and its JSON line has `"resolver":"t3"` and `"options":[]`

## ADDED Requirements

### Requirement: The T3 resolver lists the models T3 Code can run now
Inside T3 Code, `t3` SHALL list its `options` from the model catalogue that the running T3 server gives its composer. It SHALL list each provider that is enabled and whose state is `ready` or `warning`, in the catalogue's order. For each one, it lists `<family>/<model>` for each model in the catalogue, with the model the catalogue marks as that provider's default first. It SHALL leave out a model the user hid in T3 Code, and a provider that has no family in `lets`. It SHALL list each `gemini` model once, with any `-low`, `-medium` or `-high` suffix removed. It SHALL NOT read T3's `model-manifest.json`.

#### Scenario: Reading the catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the catalogue lists `codex` with `gpt-6-luna` and a default of `gpt-5.6-terra`, then `claudeAgent` with `claude-opus-5-5` and `claude-fable-5-1` and a default of `claude-fable-5-1`, then `antigravity` with `gemini-4-argon` and `gemini-3.8-flash`, every provider enabled and `ready`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-5.6-terra","gpt/gpt-6-luna","claude/claude-fable-5-1","claude/claude-opus-5-5","gemini/gemini-4-argon","gemini/gemini-3.8-flash"]`

#### Scenario: A disabled or failing provider
- **WHEN** the catalogue lists `codex` as disabled with `gpt-6-luna`, `claudeAgent` in state `error` with `claude-opus-5-5`, and `antigravity` in state `warning` with `gemini-4-argon`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-4-argon"]`

#### Scenario: A hidden model
- **WHEN** the catalogue lists `claudeAgent`, `ready`, with `claude-opus-5-5` and `claude-opus-4-5`, the user has hidden `claude-opus-4-5` in T3 Code, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["claude/claude-opus-5-5"]`

#### Scenario: A provider with no family in lets
- **WHEN** the catalogue lists `cursor`, enabled and `ready`, with `composer-2`, then `codex`, `ready`, with `gpt-6-luna`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

#### Scenario: Gemini models with an effort suffix
- **WHEN** the catalogue lists `antigravity`, `ready`, with `gemini-3.8-flash-high` and `gemini-3.8-flash-low`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gemini/gemini-3.8-flash"]`

#### Scenario: The manifest lists a model the catalogue lacks
- **WHEN** T3's `model-manifest.json` lists `codex` with `gpt-6-astra`, the catalogue lists `codex`, `ready`, with `gpt-6-luna` only, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** its JSON line has `"options":["gpt/gpt-6-luna"]`

### Requirement: The T3 resolver lists no models when T3 cannot give its catalogue
Inside T3 Code, when the T3 server refuses the request for its catalogue, or gives no catalogue within 10 seconds, `t3` SHALL list no `options`. The command SHALL exit 0, and SHALL say on stderr why `t3` lists no models.

#### Scenario: T3 does not answer
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the T3 server accepts the connection but sends no catalogue, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** within 15 seconds it exits 0, its JSON line has `"options":[]`, and stderr says that T3 gave no model catalogue

#### Scenario: T3 refuses the request
- **WHEN** the config's `delegate.resolvers` is `[t3]`, T3 refuses the WebSocket connection with the message `unsupported orchestration protocol`, and the user runs `lets delegate review instructions --for code` inside T3 Code
- **THEN** it exits 0, its JSON line has `"options":[]`, and stderr contains `unsupported orchestration protocol`

### Requirement: The T3 resolver runs the catalogue's default for a bare family
Inside T3 Code, when `--model` names a bare family, `t3` SHALL run the model that T3's catalogue marks as that family's provider default. When the catalogue marks no default for that provider, `t3` SHALL name no model, and T3 runs its own choice.

#### Scenario: A bare family
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the catalogue marks `gpt-5.6-terra` as the `codex` default, T3's `model-manifest.json` gives no `codex` default, and the user runs `lets delegate handoff run --for apply --model gpt` inside T3 Code
- **THEN** the thread runs `gpt-5.6-terra`

#### Scenario: No default in the catalogue
- **WHEN** the config's `delegate.resolvers` is `[t3]`, the catalogue lists `claudeAgent` with no default, and the user runs `lets delegate handoff run --for apply --model claude` inside T3 Code
- **THEN** T3 receives a request to start the thread that names the `claudeAgent` provider and no model

## REMOVED Requirements

### Requirement: The T3 resolver lists the models in its manifest
**Reason**: T3's downloaded model manifest is not the catalogue the composer offers, so it listed models T3 Code could not run and left out models it could.
**Migration**: None for callers: `options` keeps its shape. "The T3 resolver lists the models T3 Code can run now" replaces this requirement, and lists from the running T3 server's catalogue instead.
