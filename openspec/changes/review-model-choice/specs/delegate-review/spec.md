## ADDED Requirements

### Requirement: Review skills distinguish listed models from allowed models

Both review skills SHALL distinguish listed models from allowed models after guidance exclusions. With listed models but none allowed, they SHALL stop, show the guidance and listed models, and ask which listed model to allow for this run. They SHALL offer the subagent step only if a permitted subagent can run. The user's model choice SHALL change exclusions for this run without editing config. Fallbacks SHALL respect the resulting exclusions. Existing discovery-error stops, exit handling and required reviews SHALL remain.

#### Scenario: Guidance excludes every listed model
- **WHEN** the resolver lists models but the user's guidance excludes all of them
- **THEN** each skill shows the guidance and listed models, asks which model to allow for this run (or offers a permitted subagent), and waits before resuming selection

#### Scenario: Resolver lists no models
- **WHEN** discovery succeeds with no listed models
- **THEN** the skill takes the existing subagent path subject to guidance exclusions

#### Scenario: Fresh-session models are refused
- **WHEN** a review run with allowed models exits 3
- **THEN** the skill takes the existing subagent path subject to guidance exclusions

#### Scenario: No permitted fallback can run
- **WHEN** discovery lists no models or a review exits 3, and no permitted subagent can run
- **THEN** the skill stops and asks the user, returning `needs-input` in a `lets-go` step so the caller asks

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
