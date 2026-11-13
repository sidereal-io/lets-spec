## ADDED Requirements

### Requirement: Plan verdicts cover unresolved findings

Plan review SHALL use REVISE when any open Critical or Moderate finding has no listed small, unambiguous fix. It SHALL use APPROVE_WITH_CHANGES when every open finding has such a listed fix, and APPROVE when no finding is open. Suggestions alone SHALL NOT force REVISE: they can be fixed or declined with a reason. Severity SHALL NOT change merely to fit a verdict. Critical rebuttals SHALL retain file-and-line evidence; Moderate rebuttals SHALL retain a reason. Required changes SHALL retain fix commits and completion checks. Two consecutive REVISE verdicts SHALL stop for the user.

#### Scenario: Moderate finding needs a design decision
- **WHEN** a Moderate finding remains open without a listed small, unambiguous fix
- **THEN** the verdict is REVISE, even with no Critical findings, and the revised plan requires a fresh full review

#### Scenario: All open findings have listed fixes
- **WHEN** every open finding, including any Critical finding, has a listed small, unambiguous fix
- **THEN** the verdict is APPROVE_WITH_CHANGES and completion requires each listed change's valid fix commit in the rebuttals without another review

#### Scenario: No findings remain open
- **WHEN** findings are absent or have been fixed or rebutted under their severity rules
- **THEN** the verdict is APPROVE

#### Scenario: Only a Suggestion remains
- **WHEN** a Suggestion has no listed small edit and no Critical or Moderate finding remains open
- **THEN** the author can decline it with a one-line reason and complete the review without REVISE

#### Scenario: Critical rebuttal lacks evidence
- **WHEN** a Critical rebuttal lacks contradicting file-and-line evidence and no listed change fixes the finding
- **THEN** the finding remains open, APPROVE is forbidden, and the verdict is REVISE

#### Scenario: Consecutive revisions
- **WHEN** two full review rounds return REVISE, including rounds driven only by Moderate findings
- **THEN** the skill stops and asks the user

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
