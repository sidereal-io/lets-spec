## Why

The review skills do not distinguish an empty discovery result from a list emptied by the user's exclusions. Build reviews can also overstate independence when several model families authored the branch, and provenance reports can misdescribe the reviewer's family or missing inputs.

## What Changes

- Separate listed models from allowed models in both review skills and ask the user when guidance excludes all listed models (D1).
- Rank build reviewers against every author family, pass the session's own family as the CLI compatibility value, and report overlap independently of CLI metadata (D2).
- Describe the actual evidenced subagent family and name REVIEW.md specifically when absent (D3).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-review`: define skill model selection and provenance reporting, preserving the CLI interface and existing exit handling.

## Impact

Source skills `skills/lets-review-plan/SKILL.md` and `skills/lets-review-build/SKILL.md`, with regression checks in a self-contained block in `tests/skill-interfaces.bats`. No CLI or dependency changes. Findings carried by #220 and #230 are excluded.
