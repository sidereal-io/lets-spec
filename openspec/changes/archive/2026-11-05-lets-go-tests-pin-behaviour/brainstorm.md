**Why:** The `lets-go` tests read only `SKILL.md`, and some pin a step number, a heading level, an exact table header or one physical line. So every later story in epic #194 that moves text into `references/` or restructures the skill would have to rewrite the tests first. This story loosens them now, without changing what they check the skill does.

## Story

#198 lets-go-tests-pin-behaviour — the lets-go tests check what the skill does, and read its reference files, https://github.com/sidereal-io/lets-spec/issues/198

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which files does the story change? | `tests/skill-interfaces.bats` and the `lets-go` spec. The text of `skills/lets-go/SKILL.md` stays as it is. | Evidence: #198 Scope |
| D2 | Which files does a check of a skill's text read? | The skill's `SKILL.md` and every `references/*.md` in its folder, as one text with whitespace collapsed. One helper prints that text, and `skill_says` uses it, so the change reaches every skill that `skill_says` checks. | Assumption (decided by recommendation) |
| D3 | How do the checks for wording that must not appear read the skill? | Through a new helper, `skill_does_not_say`, that reads the same text as `skill_says`, so a removed phrase cannot come back in a reference file. The one case-insensitive check stays case-insensitive. | Assumption (decided by recommendation) |
| D4 | How does the exit-3 check change? | It checks the same sentence through `skill_says` for `lets-review-build`, `lets-review-plan` and `lets-go`, so the sentence can wrap. Its start is the spec's pinned `**3**: no fresh session can run here`, so that line stays checked. | Evidence: #198 Scope |
| D5 | When does the heading test count a section as present? | When a heading with that exact name, at any level, is in `SKILL.md` or in a reference file. | Assumption (decided by recommendation) |
| D6 | What replaces the exact step-table header pin? | A check that `plan`, `review-plan`, `build` and `review-build` each have exactly one row, all in one table, in `SKILL.md` or a reference file. A `shape` row is allowed, not required. The header leaves the spec's list of fixed lines. | Assumption (decided by recommendation) |
| D7 | What does the lost-race test pin? | `run \`next\` again with the same candidates`. It no longer pins "go on from *Start* step 3 with the new issue": the story that rewrites that text (B5) pins where the run goes on. | Assumption (decided by recommendation) |
| D8 | Does the rule that `lets go level` comes before the first GitHub call change? | No. It still compares line numbers in `SKILL.md`, which an agent reads first. | Evidence: #198 Scope |
| D9 | Do the placeholder checks from #197 read the reference files? | Yes. No placeholder sits outside code in any file. Each placeholder in any file has one row in `SKILL.md`'s Placeholders table. The old names are banned in every file. | Assumption (decided by recommendation) |
| D10 | Do the checks that grep a table row of `lets-go` read the reference files? | Yes: `step_row`, the archive-folder row, the archived-change row and the `Build is done` ban. | Assumption (decided by recommendation) |
| D11 | Which checks stay on `SKILL.md` alone? | `start_step`, `walk_section`, the place of the Placeholders table, the `lets go level` order and the link checks. They test reading order or relative links, and the stories that rewrite those parts (#200, #201, #203) change them. | Evidence: #198 Scope |
| D12 | How is the new reading tested while `lets-go` has no reference file? | Fixture tests in a temporary skills folder: `skill_says` finds a string that wraps in a reference file; `skill_does_not_say` fails on a phrase in a reference file; the heading check finds a heading in a reference file; the step-table check fails on a step with two rows. | Assumption (decided by recommendation) |
| D13 | How does the spec change? | One added requirement: the `lets-go` checks read `SKILL.md` and its reference files, match across line breaks, and accept a heading at any level. The fixed-lines requirement is modified to say a string may be in either and may wrap, and to drop the table header. | Assumption (decided by recommendation) |

## Changes from the story

- Added: the forbidden-wording checks, the placeholder checks and the table-row checks also read the reference files (D3, D9, D10). The title says the tests read the skill's reference files; checking presence there but absence only in `SKILL.md` would let a removed phrase return in a reference.
- Added: fixture tests for the new reading (D12), because no `lets-go` reference file exists yet to exercise it.
- Added: the step-table header pin becomes a check of the step rows (D6), and the lost-race pin drops its step number (D7). Both are findings in C1 that the Scope did not list.
- Left to later stories: `start_step`, `walk_section` and the link checks (D11).
- Nothing was split out.

The orchestrator confirmed this ledger on the user's behalf, 2026-11-05: it keeps the story's outcome and has no open question.

Confirmed by user: yes
