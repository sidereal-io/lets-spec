## Why

Shaping can repeat confirmed stories on resume, mislabel incomplete code after removing a closed link, or stop with glossary edits lacking an issue. #231 fixes these recovery gaps using #226's settled decisions.

## What Changes

- Record Finalize as the next phase after confirmed Stories (D1).
- Size single issues before writing glossary definitions and explain oversized recovery (D2).
- Preserve code-based journey status when removing closed links (D3).
- Identify the glossary owner issue beside the blocker command (D4).

## Capabilities

### New Capabilities

- `shaping-recovery`: durable phase checkpoints, size-stop recovery and code-based map status.

### Modified Capabilities

None.

## Impact

Only `skills/lets-shape/SKILL.md`, its issue template and a self-contained block in `tests/skill-interfaces.bats` change. No CLI commands, dependencies or publication permissions change.
