## ADDED Requirements

### Requirement: Review skills distinguish listed models from allowed models

Both review skills SHALL keep the resolver's listed models separate from the allowed models remaining after guidance exclusions. If listed models are nonempty but allowed models are empty, the skill SHALL stop, show the guidance and listed models, and ask the user to choose a model or the subagent step. It SHALL NOT silently fall back. Every fallback SHALL respect guidance exclusions unless the user changes them. Discovery failures and review exit handling SHALL retain their existing stops and required reviews.

#### Scenario: Guidance excludes every listed model
- **WHEN** the resolver lists models but the user's guidance excludes all of them
- **THEN** each review skill stops before running a review or subagent, shows the guidance and listed models, and asks for the user's choice

#### Scenario: Resolver lists no models
- **WHEN** discovery succeeds with no listed models
- **THEN** the skill takes the existing subagent path subject to guidance exclusions

#### Scenario: Fresh-session models are refused
- **WHEN** a review run with allowed models exits 3
- **THEN** the skill takes the existing subagent path subject to guidance exclusions

### Requirement: Build review evaluates the complete author family set

The build review skill SHALL rank allowed models by guidance first, families outside every known author family next, and discovery order last. It SHALL pass the reviewing session's own family as `--source-family` for CLI compatibility. Its pull request report SHALL name the author families and reviewer overlap separately from the CLI's single-family `independent` comparison. Independence from the whole author set SHALL require evidence identifying a reviewer family outside that set. Permitted same-family reviews SHALL remain available in a fresh session or subagent.

#### Scenario: Mixed GPT and Claude authors
- **WHEN** GPT and Claude authored a branch, the current session is GPT, and guidance gives no preference among GPT, Gemini and Claude options
- **THEN** Gemini ranks first, the other options retain discovery order, and `--source-family` is `gpt`

#### Scenario: CLI metadata differs from whole-author independence
- **WHEN** a GPT session reviews a GPT-and-Claude-authored branch through a Claude reviewer and the CLI reports `independent: true`
- **THEN** the pull request report preserves that CLI comparison but reports Claude overlap and independence from all authors as no

### Requirement: Review provenance names actual families and missing inputs

Plan review SHALL describe a fallback subagent's identified family consistently with the tool evidence needed for independence. Build review SHALL identify missing `REVIEW.md` specifically without implying that other project instructions were absent.

#### Scenario: Evidenced other-family subagent
- **WHEN** the plan review subagent's tool output identifies a family outside the author's family
- **THEN** the report names that family and describes an other-family subagent with independence supported by that evidence

#### Scenario: Subagent identity lacks evidence
- **WHEN** the subagent tool does not establish another family
- **THEN** the report does not claim independence or invent an evidenced family

#### Scenario: REVIEW.md is absent
- **WHEN** a build review runs without a project REVIEW.md file
- **THEN** its report names REVIEW.md as absent without claiming all project rules were missing
