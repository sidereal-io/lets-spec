# delegate-review Specification

## Purpose
Says what `lets delegate review run` records about a finished review, so a skill can report who reviewed the work and what the review was for.

## Requirements

### Requirement: The review record says what the review was for
When `lets delegate review run` exits 0, the JSON line it prints on stderr SHALL hold `for`, the intent that `--for` gives, as its first field. The line SHALL still hold `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`.

#### Scenario: A code review
- **WHEN** a resolver answers a run, and the user runs `lets delegate review run --for code`
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"code",` and holds `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`

#### Scenario: A plan review
- **WHEN** a resolver answers a run, and the user runs `lets delegate review run --for plan`
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"plan",` and holds `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`

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

### Requirement: Plan verdicts cover unresolved findings

Plan review SHALL use REVISE when any open Critical or Moderate finding has no listed small, unambiguous fix. It SHALL use APPROVE_WITH_CHANGES when every open finding has such a listed fix, and APPROVE when no finding is open. Suggestions alone SHALL NOT force REVISE: they can be fixed or declined with a reason. Existing rebuttal, fix-commit and two-REVISE rules SHALL be unchanged.

#### Scenario: Moderate finding needs a design decision
- **WHEN** a Moderate finding remains open without a listed small, unambiguous fix
- **THEN** the verdict is REVISE, even with no Critical findings, and the revised plan requires a fresh full review

#### Scenario: All open findings have listed fixes
- **WHEN** every open finding, including any Critical finding, has a listed small, unambiguous fix
- **THEN** the verdict is APPROVE_WITH_CHANGES and completion requires each listed change's valid fix commit in the rebuttals without another review

#### Scenario: No findings remain open
- **WHEN** findings are absent, or each was rebutted under its severity rule or declined as a Suggestion
- **THEN** the verdict is APPROVE

#### Scenario: Only a Suggestion remains
- **WHEN** a Suggestion has no listed small edit and no Critical or Moderate finding remains open
- **THEN** the author can decline it with a one-line reason and complete the review without REVISE

#### Scenario: Critical rebuttal lacks evidence
- **WHEN** a Critical rebuttal lacks contradicting file-and-line evidence and no listed change fixes the finding
- **THEN** the finding remains open, APPROVE is forbidden, and the verdict is REVISE

### Requirement: New plan reviews expose common preparation

Every new plan review SHALL reach author identification before model ranking and effort selection before either command or subagent review. Every review prompt SHALL request ranked findings labeled Critical, Moderate or Suggestion with a concern, scenario and what must be true. The mandatory request for a substantive concern and an unanticipated failure mode SHALL remain limited to OpenSpec changes.

#### Scenario: First review of an OpenSpec change
- **WHEN** the pull request has no Plan review section
- **THEN** the new-review route identifies the author before ranking reviewers and chooses effort before execution

#### Scenario: An earlier review requires a new round
- **WHEN** Check an earlier review calls for a new full review round
- **THEN** the round identifies the author before ranking and selects effort before execution

#### Scenario: Standalone skill or ADR review
- **WHEN** the user requests a standalone skill or ADR review
- **THEN** it uses the same author, effort and finding-format preparation without acquiring OpenSpec-only mandatory concern generation

#### Scenario: Subagent fallback
- **WHEN** the command path cannot run and the skill uses the permitted subagent fallback
- **THEN** the same previously selected effort applies

### Requirement: Archive preserves a covering code review

`lets-review-build`'s *Check an earlier review* SHALL not call a review
stale for this change's archive commit when it moves the change folder into
`openspec/changes/archive/` and its only changes outside `openspec/changes/`
are merges into `openspec/specs/` that match its delta specs as they stood
at `<head-sha>`.

#### Scenario: Matching archive
- **WHEN** this change's archive commit moves the change folder into the archive and only merges its delta specs as they stood at `<head-sha>` outside `openspec/changes/`
- **THEN** no new review is required for that commit

#### Scenario: Archive includes an unrelated file
- **WHEN** an archive commit also changes a source file and is not a listed fix
- **THEN** a new review is required

#### Scenario: Spec merge differs from the reviewed delta
- **WHEN** an archive commit merges spec text that differs from the delta specs at `<head-sha>`
- **THEN** a new review is required
