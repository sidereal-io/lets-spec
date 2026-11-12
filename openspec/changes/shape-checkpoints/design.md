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
3. Keep glossary sizing and blocker ownership in `shared-domain-language`; use `discovery-checkpoints` for phase and journey recovery. Agree and write candidate definitions after sizing passes.
4. Define `<owner>` locally beside the existing command, preserving its syntax and permission guard.
5. Keep six token checks in one labeled Bats block; use reader walkthroughs to check meaning.

## Risks / Trade-offs

- [Text assertions cannot establish comprehension] → Walk through the recovery scenarios and report that human usability was not tested.
- [A pre-sizing write could survive in general glossary guidance] → Make the single-issue exception explicit where definitions are developed and at sizing.

## Migration & Rollback

No data migration. Existing parents retain their recorded phases. Revert this change to undo the instruction changes.
