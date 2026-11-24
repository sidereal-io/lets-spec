<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#304 verify-contracts — builds fix contracts first and verify at public boundaries, https://github.com/sidereal-io/lets-spec/issues/304

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What replaces `lets-test-first` in the build step? | A new skill, `skills/lets-verify-contracts/SKILL.md`, holding the issue's source text word for word. `skills/lets-test-first/` and its two references are removed; `lets sync` already deletes a skill a release stops shipping. | Evidence: #304 body, Scope; `lets/src/sync/skills.ts` |
| D2 | What points at the new skill instead of the old one? | The apply instructions in `lets-standard` and `lets-minimal`, the `lets-minimal` description, `lets-build` (description and apply step), `flows.json`, the `flake.nix` skill checks, the README, and the tests that name `lets-test-first`. | Evidence: #304 body, Scope; `grep lets-test-first` |
| D3 | What stays out of scope? | The review skills (`lets-review-build`, `lets-review-plan`, `lets-review-pr`), archived changes and ADR-020's text. A new decision record supersedes ADR-020 only if the design calls for one. | Evidence: #304 body, Scope |
| D4 | Does anything from the old references, `best-practices.md` and `collaborators.md`, carry over? | Yes, two points, as one short paragraph in both the `lets-standard` and `lets-minimal` apply instructions: expected values must not come from the code's own logic, and code takes its external clients as inputs so tests can substitute them. Everything else in the two references is dropped. | User |
| D5 | What does Phase 1's "red state via compiler" ask of a project with no compiler or type checker, such as shell scripts tested with bats? | Both apply instructions say: run the static checks the project has (type checker or linter). With none, Phase 1 ends once the contracts are written down (signatures, usage text, spec scenarios), and Phase 3's failing black-box test shows what the code must do. | User |
| D6 | In `lets-write-tasks`, what is one task? | One behavior, taken through all three phases: contract, then code, then a black-box test. Its verify command runs that test, or the type check for a shared-contracts task. The "shared contracts first" ordering stays. Tasks split by phase are rejected: they leave code tasks that cannot be checked on their own. | User |
| D7 | Does the skill's exit criterion "every requirement in the spec is covered by a test" apply per task or only at the end? | Per task, check only the requirements that task covers. The integration task, which runs last, checks that every requirement has a black-box or invariant test. | User |

## Changes from the story

- Added: the two carried-over points (D4) go into both apply instructions, because the new SKILL.md is copied word for word and cannot link a reference.
- Added: the no-compiler rule (D5) and the per-task exit check (D7) go into the apply instructions and `lets-write-tasks`, for the same reason.

Confirmed by user: yes
