## Context

The shaping skill is an executable instruction interface for fresh agents. Its parent template shares the phase syntax. Existing Bats tests inspect skill interfaces. Six sibling worktrees may append tests to the same file.

## Goals / Non-Goals

**Goals:** Implement D1–D4 in the source skill and template with focused regression checks.

**Non-Goals:** Other review findings, CLI changes, new publication rights, or glossary definitions.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, reading source instructions.
- **Existing seams reused:** Bats and the repository's `skill_says` helper.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** Shaping checkpoints, one issue template, and interface tests.

## Decisions

1. Extend the existing phase list and checkpoint after Stories. Explicitly route `finalize` in Resume; retain Finalize's current order.
2. Keep status classification separate from issue-link replacement. Reuse the existing three code-based meanings.
3. During code inspection, develop candidate vocabulary without writing it. Once sizing passes, agree and write definitions with the existing method. This narrow exception implements the user's size-before-write decision without changing glossary ownership or checkpoint recovery.
4. Define `<owner>` locally beside the existing command, preserving its syntax and permission guard.
5. Append a single labeled test block to reduce conflict with sibling stories. Tests inspect the instructional contract; author walkthroughs separately check reader tasks.

## Risks / Trade-offs

- [Text assertions cannot establish comprehension] → Walk through the recovery scenarios and report that human usability was not tested.
- [A pre-sizing write could survive in general glossary guidance] → Make the single-issue exception explicit where definitions are developed and at sizing.

## Migration & Rollback

No data migration. Existing parents retain their recorded phases. Revert this change to undo the instruction changes.
