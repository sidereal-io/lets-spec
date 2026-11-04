## MODIFIED Requirements

### Requirement: The instructions command
`lets delegate review instructions --for <plan|code>`, `lets delegate handoff instructions --for apply` and `lets delegate step instructions --for <step>` SHALL ask the resolvers which models they can run now. Each SHALL print one JSON line on stdout, then exit 0. The line SHALL hold `strategy` (`review`, `handoff` or `step`), `for` (the intent given), `resolver` and `options` from the resolver that answered, and `guidance`. They SHALL start no session.

#### Scenario: A resolver with models
- **WHEN** the config lists `t3`, which can run `gpt/gpt-6-luna` and `claude`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and stdout is one JSON line with `"strategy":"review"`, `"for":"code"`, `"resolver":"t3"` and `"options":["gpt/gpt-6-luna","claude"]`

#### Scenario: No config
- **WHEN** no config file exists, and the user runs `lets delegate handoff instructions --for apply`
- **THEN** it exits 0, and its JSON line has `"strategy":"handoff"`, `"for":"apply"`, `"resolver":"subagent"` and `"options":[]`

#### Scenario: Step instructions from a resolver with models
- **WHEN** the config lists `t3`, which runs steps and can run `gpt/gpt-6-luna` and `claude`, and the user runs `lets delegate step instructions --for propose`
- **THEN** it exits 0, and stdout is one JSON line with `"strategy":"step"`, `"for":"propose"`, `"resolver":"t3"` and `"options":["gpt/gpt-6-luna","claude"]`

#### Scenario: Nothing is started
- **WHEN** the user runs `lets delegate review instructions --for plan`
- **THEN** no resolver is asked to run, start or finish a session

### Requirement: The probe names the verb it is for
`instructions` SHALL ask each resolver about the kind of session its strategy starts: a read-only session for `review instructions`, an interactive one for `handoff instructions`, and a `step` session for `step instructions`. The resolver that answers SHALL be the first, in lookup order, that does not decline that kind of session.

#### Scenario: A review asks for run
- **WHEN** the config lists `cli`, a family CLI is on `PATH`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"resolver":"cli"`

#### Scenario: A resolver that only runs headless
- **WHEN** the config lists `cli`, a family CLI is on `PATH`, then `subagent`, and the user runs `lets delegate handoff instructions --for apply`
- **THEN** its JSON line has `"resolver":"subagent"` and `"options":[]`

#### Scenario: A resolver that runs no step
- **WHEN** the config lists `t3`, which runs reviews here but no step, then `subagent`, and the user runs `lets delegate step instructions --for apply`
- **THEN** its JSON line has `"resolver":"subagent"` and `"options":[]`

### Requirement: The guidance comes from the config
`guidance` SHALL be the string at `delegate.<strategy>.<intent>.guidance` in the config, for the strategy of the command and the intent `--for` gives, unchanged: `delegate.review.plan.guidance`, `delegate.review.code.guidance`, `delegate.handoff.apply.guidance`, or `delegate.step.<step>.guidance` for one of the five steps. It SHALL be `null` when there is no config, no `delegate` key, no entry for the strategy, no entry for the intent, or no `guidance` in that entry.

#### Scenario: Guidance for the intent
- **WHEN** the config holds `delegate.review.code.guidance` `Use the strongest gpt model.`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"guidance":"Use the strongest gpt model."`

#### Scenario: Guidance for another intent only
- **WHEN** the config holds `delegate.review.code.guidance` and nothing for `plan`, and the user runs `lets delegate review instructions --for plan`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: Guidance for the other strategy only
- **WHEN** the config holds `delegate.handoff.apply.guidance` and no `delegate.review`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: Guidance for a step
- **WHEN** the config holds `delegate.step.apply.guidance` `Use claude/claude-opus-5-5.`, and the user runs `lets delegate step instructions --for apply`
- **THEN** its JSON line has `"guidance":"Use claude/claude-opus-5-5."`

#### Scenario: Handoff guidance does not reach a step
- **WHEN** the config holds `delegate.handoff.apply.guidance` and no `delegate.step`, and the user runs `lets delegate step instructions --for apply`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: A multi-line block
- **WHEN** `delegate.handoff.apply.guidance` is a YAML `|` block of two lines
- **THEN** `lets delegate handoff instructions --for apply` prints both lines in `guidance`, joined by a newline
