## ADDED Requirements

### Requirement: The review skills start their reviewer with lets delegate step
`lets-review-plan`, `lets-review-build` and `lets-review-pr` SHALL ask what can run with `lets delegate step instructions --for review-plan` or `--for review-build`, and SHALL start the reviewer with `lets delegate step run` and the same `--for` value. None of them SHALL name `lets delegate review`. After exit 0, each SHALL read the stdout report's `outcome`. For `done`, it SHALL read the findings, and the `Read: <checkout> <head>` line, from the report's `findings`. For `failed`, it SHALL record no review, show the user the report's `reason` and the meta file, and stop. Each skill's reviewer prompt SHALL keep its finding format and its `Read:` line, and SHALL NOT ask the reviewer for a `step-report` block.

#### Scenario: The skills name the one command
- **WHEN** a reader reads `skills/lets-review-plan/SKILL.md`, `skills/lets-review-build/SKILL.md` and `skills/lets-review-pr/SKILL.md`
- **THEN** the reader finds `lets delegate step instructions --for review-plan` or `--for review-build`, and `lets delegate step run --for`, in each, and does not find `lets delegate review` in any

#### Scenario: A done report
- **WHEN** `lets delegate step run --for review-plan` exits 0 with a `done` report whose `findings` ends with `Read: /r 0123456789abcdef0123456789abcdef01234567`
- **THEN** `lets-review-plan` checks the findings and that `Read:` line, as *Check what the review read* says

#### Scenario: A failed report
- **WHEN** `lets delegate step run --for review-build` exits 0 with a `failed` report whose `reason` says the session changed files outside `.workspace/`
- **THEN** `lets-review-build` records no **Code review**, shows the user that reason and the meta file, and stops

## REMOVED Requirements

### Requirement: The review record says what the review was for
**Reason**: `lets delegate review run` is removed. The record of a reviewer is now a rule of `lets delegate step run`.
**Migration**: *delegate-step*'s *The reviewer's record says what the review was for* holds it, for `lets delegate step run --for review-plan` and `--for review-build`.

### Requirement: The review record names the checkout and commit the session read
**Reason**: `lets delegate review run` is removed. The record of a reviewer is now a rule of `lets delegate step run`.
**Migration**: *delegate-step*'s *The reviewer's record names the checkout and commit the session read* holds it.

### Requirement: A review has time to finish
**Reason**: `lets delegate review run` is removed. A reviewer's time limit is now a rule of `lets delegate step run`.
**Migration**: *delegate-step*'s *A reviewer has time to finish* holds the same limits, for `--for review-plan` and `--for review-build`.
