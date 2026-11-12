## Why

Fresh agents can propose before checking prerequisites, overwrite a saved schema, claim PR readiness from an archive folder, or change an idea while quoting it for the shell. #228 corrects those instructions without changing workflow policy (D1–D2).

## What Changes

- Put the planning stop before proposing and separate creation from continuation.
- Explain how to stop on unusable build-state output and report only archive evidence.
- Explain literal arguments for the current idea search.
- Limit the prior-claim rule to change outputs and link shaping's permitted outputs.
- Add interface checks and record representative reader walkthroughs (D4).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. These are wording corrections preserving the existing workflow, so this change sets `skip_specs: true`. The `lets-go`, `lets-backlog` and `plain-language` specs remain context.

## Impact

Only `skills/lets-plan/SKILL.md`, `skills/lets-build/SKILL.md`, the source-of-demand section of `skills/lets-go/SKILL.md`, and a separate block in `tests/skill-interfaces.bats`. No CLI, schema, parser, permission or dependency changes. The Claim section remains unchanged (D3).
