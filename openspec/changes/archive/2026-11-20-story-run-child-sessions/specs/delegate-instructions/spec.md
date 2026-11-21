## MODIFIED Requirements

### Requirement: The guidance comes from the config
`guidance` SHALL be the string at `delegate.<strategy>.<intent>.guidance` in the config, for the strategy of the command and the intent `--for` gives, unchanged: `delegate.review.plan.guidance`, `delegate.review.code.guidance`, `delegate.handoff.apply.guidance`, `delegate.step.<step>.guidance` for one of the five steps, or `delegate.step.story.guidance` for `story`. It SHALL be `null` when there is no config, no `delegate` key, no entry for the strategy, no entry for the intent, or no `guidance` in that entry.

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
- **WHEN** the config holds `delegate.step.build.guidance` `Use claude/claude-opus-5-5.`, and the user runs `lets delegate step instructions --for build`
- **THEN** its JSON line has `"guidance":"Use claude/claude-opus-5-5."`

#### Scenario: Handoff guidance does not reach a step
- **WHEN** the config holds `delegate.handoff.apply.guidance` and no `delegate.step`, and the user runs `lets delegate step instructions --for build`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: A multi-line block
- **WHEN** `delegate.handoff.apply.guidance` is a YAML `|` block of two lines
- **THEN** `lets delegate handoff instructions --for apply` prints both lines in `guidance`, joined by a newline

#### Scenario: Guidance for the story intent
- **WHEN** the config holds `delegate.step.story.guidance` `Prefer claude.` and `delegate.step.build.guidance` `Use gpt.`, and the user runs `lets delegate step instructions --for story`
- **THEN** its JSON line has `"guidance":"Prefer claude."`

#### Scenario: Step guidance does not reach the story intent
- **WHEN** the config holds `delegate.step.build.guidance` and no `delegate.step.story`, and the user runs `lets delegate step instructions --for story`
- **THEN** its JSON line has `"guidance":null`
