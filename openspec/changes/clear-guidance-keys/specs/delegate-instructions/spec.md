<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: Malformed guidance stops the command
`instructions` SHALL exit 2, print nothing on stdout, and name the config file and the bad key on stderr in each of these cases:

- the guidance key that the command's strategy and intent read, as *The guidance is the config entry for the intent* says, is present and is not a mapping
- that key's `guidance` is present and is not a string

It SHALL NOT check the other guidance keys, nor any key under `delegate` that is not a guidance key, such as `handoff`. *An old guidance key stops instructions* says how it treats `delegate.review` and `delegate.step`.

#### Scenario: A number for guidance
- **WHEN** the config holds `delegate.review-build.guidance: 42`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 2, stdout is empty, and stderr names the config file and `delegate.review-build.guidance`

#### Scenario: A strategy entry that is not a mapping
- **WHEN** the config holds `delegate.review-build: code`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 2, stdout is empty, and stderr names the config file and `delegate.review-build`

#### Scenario: A bad entry the review plan step reads
- **WHEN** the config holds `delegate.plan.guidance: 42`, and the user runs `lets delegate step instructions --for review-plan`
- **THEN** it exits 2, stdout is empty, and stderr names the config file and `delegate.plan.guidance`

#### Scenario: A bad entry for another intent
- **WHEN** the config holds `delegate.review-plan.guidance: [a, b]`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0

#### Scenario: A bad entry for the other strategy
- **WHEN** the config holds `delegate.build: 42`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0

#### Scenario: A handoff entry from an earlier lets
- **WHEN** the config holds `delegate.handoff: 42`, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 0, and stderr does not contain `handoff`

### Requirement: The guidance is the config entry for the intent
`guidance` SHALL be the string at `delegate.<key>.guidance` in the config, unchanged, where `<key>` is the guidance key for the command's strategy and the intent `--for` gives:

- `review` with `plan`: `review-plan`, which steers the read-only plan reviewer
- `review` with `code`: `review-build`, which steers the read-only code reviewer
- `step` with `shape`: `shape`
- `step` with `plan` or `review-plan`: `plan`, which steers the plan step's session and the review plan step's session
- `step` with `build` or `review-build`: `build`, which steers the build step's session and the review build step's session
- `step` with `story`: `story`, which steers the child `lets-go` session of a story run

It SHALL be `null` when there is no config, no `delegate` key, no entry at that guidance key, or no `guidance` in that entry. The help text of `lets delegate review instructions` and `lets delegate step instructions` SHALL name the guidance key for each of its intents.

#### Scenario: Guidance for the intent
- **WHEN** the config holds `delegate.review-build.guidance` `Use the strongest gpt model.`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"guidance":"Use the strongest gpt model."`

#### Scenario: Guidance for the plan reviewer
- **WHEN** the config holds `delegate.review-plan.guidance` `Prefer gpt.`, and the user runs `lets delegate review instructions --for plan`
- **THEN** its JSON line has `"guidance":"Prefer gpt."`

#### Scenario: Guidance for another intent only
- **WHEN** the config holds `delegate.review-build.guidance` and nothing at `delegate.review-plan`, and the user runs `lets delegate review instructions --for plan`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: Plan step guidance does not reach the plan reviewer
- **WHEN** the config holds `delegate.plan.guidance` `Prefer claude.` and nothing at `delegate.review-plan`, and the user runs `lets delegate review instructions --for plan`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: Guidance for the other strategy only
- **WHEN** the config holds `delegate.build.guidance` and nothing at `delegate.review-build`, and the user runs `lets delegate review instructions --for code`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: Guidance for a step
- **WHEN** the config holds `delegate.build.guidance` `Use claude/claude-opus-5-5.`, and the user runs `lets delegate step instructions --for build`
- **THEN** its JSON line has `"guidance":"Use claude/claude-opus-5-5."`

#### Scenario: The review plan step takes the plan guidance
- **WHEN** the config holds `delegate.plan.guidance` `Prefer claude.` and `delegate.review-plan.guidance` `Prefer gpt.`, and the user runs `lets delegate step instructions --for review-plan`
- **THEN** its JSON line has `"for":"review-plan"` and `"guidance":"Prefer claude."`

#### Scenario: The review build step takes the build guidance
- **WHEN** the config holds `delegate.build.guidance` `Prefer claude.` and `delegate.review-build.guidance` `Prefer gpt.`, and the user runs `lets delegate step instructions --for review-build`
- **THEN** its JSON line has `"for":"review-build"` and `"guidance":"Prefer claude."`

#### Scenario: Review guidance does not reach a step
- **WHEN** the config holds `delegate.review-build.guidance` and nothing at `delegate.build`, and the user runs `lets delegate step instructions --for build`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: A multi-line block
- **WHEN** `delegate.review-build.guidance` is a YAML `|` block of two lines
- **THEN** `lets delegate review instructions --for code` prints both lines in `guidance`, joined by a newline

#### Scenario: Guidance for the story intent
- **WHEN** the config holds `delegate.story.guidance` `Prefer claude.` and `delegate.build.guidance` `Use gpt.`, and the user runs `lets delegate step instructions --for story`
- **THEN** its JSON line has `"guidance":"Prefer claude."`

#### Scenario: Step guidance does not reach the story intent
- **WHEN** the config holds `delegate.build.guidance` and nothing at `delegate.story`, and the user runs `lets delegate step instructions --for story`
- **THEN** its JSON line has `"guidance":null`

#### Scenario: The help names the keys
- **WHEN** the user runs `lets delegate step instructions --help`
- **THEN** the output names `delegate.shape`, `delegate.plan`, `delegate.build` and `delegate.story`, and does not contain `delegate.<strategy>`

## ADDED Requirements

### Requirement: An old guidance key stops instructions
When the config in effect holds `delegate.review` or `delegate.step`, present and not null, `lets delegate review instructions` and `lets delegate step instructions` SHALL exit 2, print nothing on stdout, and ask no resolver, whatever intent `--for` gives. Stderr SHALL name the file that holds the key, as *delegate-config*'s *A message names the file the value came from* says. For each old guidance key under it, stderr SHALL name the old key and its new key, as *delegate-config*'s *A version 3 file names each guidance key's new name* lists them. When the entry holds no old guidance key, such as `delegate.step: 42`, stderr SHALL name `delegate.review` or `delegate.step` and say that `lets` no longer reads it.

#### Scenario: Review guidance under the old key
- **WHEN** the config holds `version: 4` and `delegate.review.code.guidance` `Prefer gpt.`, and the user runs `lets delegate step instructions --for build`
- **THEN** it exits 2, stdout is empty, no resolver is asked, and stderr names the config file, `delegate.review.code` and `delegate.review-build`

#### Scenario: A review step's old key
- **WHEN** the config holds `version: 4` and `delegate.step.review-build.guidance` `Prefer claude.`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 2, and stderr names `delegate.step.review-build` and `delegate.build`

#### Scenario: An old entry that holds no old key
- **WHEN** the config holds `version: 4` and `delegate.step: 42`, and the user runs `lets delegate step instructions --for plan`
- **THEN** it exits 2, and stderr names `delegate.step`

#### Scenario: A null old entry
- **WHEN** the config holds `version: 4`, `delegate.review: null` and `delegate.review-build.guidance` `Prefer gpt.`, and the user runs `lets delegate review instructions --for code`
- **THEN** it exits 0, and its JSON line has `"guidance":"Prefer gpt."`
