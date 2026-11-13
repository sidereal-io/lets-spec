## Context

The Size section says to report an oversized story without specifying whether `tasks.md` is written. The Tags table uses "neighbours" without defining concurrency across sections. The user has settled both policies in #226. Tests already inspect skill interfaces in `tests/skill-interfaces.bats`.

## Goals / Non-Goals

**Goals:** Make each stop, next action and file comparison explicit beside its controlling rule.

**Non-Goals:** Change parsers, schemas, command formats, the task range, dependency scheduling or minimal flow permissions. Edit unrelated skill prose.

## Test Seams

- **Primary test seam:** source skill prose checked by Bats.
- **Existing seams reused:** `tests/skill-interfaces.bats`, with a self-contained task-limits block that appends safely beside sibling stories' tests.
- **Reader tasks:** author walkthroughs cover thirteen tasks, twelve tasks, resumption, nonadjacent conflicts, independent sections, shared prerequisites and transitive dependencies in either direction. Static assertions protect the explicit contract; they cannot establish comprehension. No human usability trial is claimed.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** one shared skill's size and parallel eligibility guidance; interface assertions only.

## Decisions

1. Expand the Size bullet in place. Say no writing or committing `tasks.md`, report count and slice, then wait. Task planning runs again on the smaller story after the user's brainstorm split decision. A separate procedure would move the stop away from its condition.
2. Replace "neighbours" in the Tags table with all concurrently eligible tasks; define section scope immediately below. Clarify that a dependency chain in either direction includes indirect dependencies. Add the first/third shared-file example to prevent an adjacent-only reading.
3. Keep checks in one appended block with no shared helper. Check the size/output proximity and concurrency key phrases in two tests. Keep one guard for the minimal flow; avoid whole-sentence assertions.

## Risks / Trade-offs

- [Static prose tests can overfit wording] → Assert only the actionable policy clauses; accompany them with recorded reader walkthroughs.
- [An example could imply dependency changes] → Explain existing dependency chains without adding syntax or scheduling rules.
- [Shared test-file merge conflicts] → Keep the two checks in one self-contained block.

## Migration & Rollback

N/A. No data or interface migration. The next release distributes the source skill; reverting this change restores the prior prose.
