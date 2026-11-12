## Why

A fresh agent cannot tell whether to write an oversized task list or which tasks to compare before using `[parallel]`. This change implements SLR-19 and SLR-20 from epic #226 so the next action follows the user's decisions.

## What Changes

- Stop before writing or committing `tasks.md` above twelve tasks, report the count and proposed slice, and resume after the user decides the split in the brainstorm (D1).
- Compare files against every task that could run at the same time, including other sections without a dependency chain (D2).
- Preserve the task range, tag syntax, dependency ordering and minimal flow restrictions (D3).

## Capabilities

### New Capabilities

- `task-planning`: size stops and file-sharing eligibility for task lists.

### Modified Capabilities

None. Existing `plain-language` requirements apply as context and stay unchanged.

## Impact

Source instructions in `skills/lets-write-tasks/SKILL.md` and a self-contained block in `tests/skill-interfaces.bats`. No CLI, parser, schema, generated copy or dependency changes.
