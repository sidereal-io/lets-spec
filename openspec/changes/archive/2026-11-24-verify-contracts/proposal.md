## Why

The build step uses `lets-test-first`, which asks for a failing unit test
before every piece of code. That fixes a design's internal structure before
anyone understands it, and invites mocks of the project's own code. The
replacement skill's text is ready in #304, so the build can now fix contracts
first and test only at public boundaries.

## What Changes

- **New skill `lets-verify-contracts`.** `skills/lets-verify-contracts/SKILL.md`
  holds #304's source text word for word: constrain (contracts and types),
  synthesize (code), verify (black-box and invariant tests) (D1).
- **BREAKING: `lets-test-first` is removed,** with its two references. A
  project's next `lets sync` deletes its copy, as it does for any skill a
  release stops shipping (D1).
- **Both apply instructions work each task through the three phases** of
  `lets-verify-contracts`, in place of red-green cycles (D2). Each also says:
  - expected values must not come from the code's own logic, and code takes
    its external clients as inputs so a test can substitute them (D4);
  - with no compiler or type checker, Phase 1 ends once the contracts are
    written down, and Phase 3's failing black-box test shows what the code
    must do (D5).
- **`lets-write-tasks` sizes a task as one behavior through all three
  phases.** Its verify command runs that behavior's black-box test, or the
  type check for a shared-contracts task. A task checks only the spec
  requirements it covers; the integration task checks that every requirement
  has a black-box or invariant test (D6, D7). "Shared contracts first" stays.
- **Everything that names the old skill names the new one:** the
  `lets-minimal` description, `lets-build`, `flows.json`, the `flake.nix`
  checks, the README and the tests (D2).
- Out of scope: the review skills, archived changes, and ADR-020's text (D3).

## Capabilities

### New Capabilities
- `contract-first-builds`: how the build step works a task (contracts, then
  code, then black-box and invariant tests), what the apply instructions add
  to the skill, and which skill each flow ships for it.

### Modified Capabilities
- `task-planning`: a task is one behavior taken through contract, code and
  black-box test; its verify command and requirement check change to match.

## Impact

- Skills: adds `skills/lets-verify-contracts/`; removes
  `skills/lets-test-first/`; edits `skills/lets-build/SKILL.md` and
  `skills/lets-write-tasks/SKILL.md`.
- Schemas: the apply instruction in `schemas/lets-standard/schema.yaml` and
  `schemas/lets-minimal/schema.yaml`, and `lets-minimal`'s description.
- Release: `flows.json` ships the new skill in both flows; `flake.nix` checks
  for it after `lets sync`.
- Tests: `tests/skill-interfaces.bats`, `tests/release-build.bats`,
  `tests/support/release.bash` and `tests/sync-skills.bats` use the old name.
- Docs: `README.md` skill and flow tables.
- Projects that use Let's Spec: their next `lets sync` swaps the skill. Their
  in-progress task lists written for red-green cycles still build, because a
  task's verify command still runs.
