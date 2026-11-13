## Context

The source skill routes first reviews past author identification. Effort sits under the fallback, and finding labels sit under OpenSpec-only checks. Its REVISE rule excludes unresolved Moderate findings.

## Goals / Non-Goals

**Goals:** Give a fresh reviewer one path through preparation and a usable disposition for every supported finding set.

**Non-Goals:** CLI changes, report-format changes, broader wording edits or changes to `lets-review-build`.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, using `skill_says` and `skill_does_not_say` for short tokens, with heading/order checks where location matters.
- **Existing seams reused:** Bats skill-interface helpers. Reader-task walkthroughs check meaning beyond those structural guards.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** One source skill; no executable interface changes.

## Decisions

1. Route both first-review entry points through Find the author, then continue to Run the review. Move effort selection to the start of Run the review, before discovery and either execution path.
2. Move the existing ranked finding format into the common prompt section. Leave mandatory concern generation under For an OpenSpec change. Moving the text preserves its contract without repeating it.
3. Extend REVISE to open Critical or Moderate findings without a listed fix. Keep APPROVE and APPROVE_WITH_CHANGES criteria and fix-commit checks. Explain Suggestion-only disposition using the existing right to decline. Keep severity independent of verdict choice.
4. Align the unsupported Critical rebuttal with the listed-fix branch: it remains open and requires REVISE only when no listed change fixes it. Moderate findings remain open when neither fixed nor rebutted with a reason. Reuse existing round and completion rules rather than restating them.

## Risks / Trade-offs

- [Token checks cannot establish comprehension] → Walk through first reviews, both execution paths, standalone output, Moderate-only decisions, listed fixes, Critical rebuttals, Suggestions and two consecutive REVISE rounds; report the limits of these author walkthroughs.
- [Moving shared output could widen mandatory concern generation] → Keep that request with the OpenSpec-only checks and verify section order.

## Migration & Rollback

N/A. Revert the skill and test commits to roll back.
