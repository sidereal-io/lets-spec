## Context

The implementation is prose consumed by agents. Both skills use resolver `options`, guidance, repeated `--model` flags and an exit-3 fallback. The CLI compares the reviewer to one `--source-family`; the build skill already recognizes multiple author families. #220 and #230 will build on these same files later.

## Goals / Non-Goals

**Goals:** Resolve only SLR-10, SLR-11 and SLR-14 at their existing decision points.

**Non-Goals:** CLI changes, new parser formats, changes to review verdicts, or changes to archive review freshness.

## Test Seams

- **Primary test seam:** Source-skill interface assertions in `tests/skill-interfaces.bats`.
- **Existing seams reused:** `skill_says` and `skill_does_not_say`; a self-contained appended block for #229. Update the two existing assertions that encode the replaced selection wording.
- **Reader walkthroughs:** Trace excluded-all discovery, empty discovery, exit 3, mixed GPT/Claude authors, evidenced other-family subagent, and missing REVIEW.md. These are author walkthroughs, not human usability tests.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** Two review skills and their interface checks; no executable CLI changes.

## Decisions

1. Name resolver `options` the **listed models** and the filtered result the **allowed models**. Check excluded-all before delegation. Keep empty-discovery and exit-3 paths, but require guidance-compliant fallback; if none is available, stop and ask. A user selecting a previously excluded model must change the exclusion explicitly.
2. Retain all known build author families for ranking and reporting. Use the current session's family only for CLI compatibility. Explain the GPT/Claude example directly so the single-family metadata cannot be mistaken for full independence.
3. Describe the identified plan subagent family and classify same/other only with evidence. Name missing REVIEW.md without changing the review's other inputs.
4. Keep tests beside the existing skill interface suite. Literal assertions protect the instructions' decision points; reader walkthroughs cover their interpretation. No new policy evaluator is introduced.

## Risks / Trade-offs

- [Text assertions do not prove comprehension] → Record author walkthroughs and the lack of human usability evidence.
- [CLI metadata can overstate independence from mixed authors] → Report its compatibility comparison and whole-author overlap separately.
- [Concurrent sibling edits] → Confine source edits to the named findings and append tests as one block.

## Migration & Rollback

No migration. Revert the skill and test commits to roll back. The release workflow distributes source skills normally.
