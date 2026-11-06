**Why:** *Check the checkpoint* in `lets-go` numbers its steps 5–10, ends with "repeat steps 1 to 3", which could mean three sections, and lets three failed checks carry on or be repaired, so an agent that owns glossary edits can loop back into earlier checks or fix a patch it should report; story 4 of epic #194 fixes this before later stories move the text into a reference file.

## Story

#199 lets-go-checkpoint-steps — the glossary checkpoint steps number from 1, name what they repeat, and stop on failure, https://github.com/sidereal-io/lets-spec/issues/199

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which files does the story change? | `skills/lets-go/SKILL.md` (*Check the checkpoint* only), `tests/skill-interfaces.bats` and the `lets-go` spec. The glossary text stays in `SKILL.md`. | Evidence: #199 Scope |
| D2 | How are the two sections numbered? | Each from 1: *Check the prerequisite* stays 1–4, *Check the checkpoint* becomes 1–6. Neither refers to the other by step number. | Evidence: #199 Scope, finding A2 |
| D3 | What replaces item 10? | Its first sentence goes. The step becomes: if the owner or the base changed since *Find the source of demand* ran *Check the prerequisite*, run [Check the prerequisite](#check-the-prerequisite) again, by name and link, before *Claim* step 3 claims the issue. | Evidence: #199 Scope, finding B2 |
| D4 | What does the rerun do when it finds an unresolved prerequisite for an issue that `next` picked? | It reports it and stops, as for a named issue. It does not skip the candidate, because *Claim* has no way back into `next` for that case, and nothing is claimed yet. | Assumption (decided by recommendation) |
| D5 | What does a missing checkpoint, or one only in a local checkout, do? | It is reported, and the run stops before the claim. The step no longer says "do not claim until it is recovered" without a stop. | Evidence: #199 Scope, finding B2 |
| D6 | What does a rehearsal that finds a partial or conflicting patch do? | It is reported, and the run stops before the claim. Nothing is repaired. Edits the rehearsal finds already present are still skipped, which is not a failure. | Evidence: #199 Scope, finding B2 |
| D7 | Do the other checks in the section stop on failure too? | Yes. A range that holds other commits, a merge or another path (step 2), context missing from the base (step 3), and owned paths that do not match the shaping baseline (step 4) each report what failed and stop before the claim. User edits stay where they are. | Assumption (decided by recommendation) |
| D8 | Is a failed checkpoint check a row of *Records that disagree*? | No. That table belongs to the walk, which runs after *Start*. The step says "report it, and stop" in place, and *Start* step 7 already says a stop that *Claim* makes stands. | Assumption (decided by recommendation) |
| D9 | How do the tests pin the numbering? | A new helper checks that the first numbered item after each heading, outside code blocks, is `1.`, in every file `skill_files` lists, and names the file and heading that break it. It runs on `lets-go`, with fixture tests for a pass and a named failure. | Assumption (decided by recommendation) |
| D10 | How do the tests pin the wording? | `skill_does_not_say` bans "repeat steps 1 to 3", "Go on with the normal packet, blocker and routing checks", "Resolve a partial or conflicting patch" and "do not claim until it is recovered". `skill_says` checks the named rerun and the stops. | Assumption (decided by recommendation) |
| D11 | How does the spec change? | One added `lets-go` requirement: the checkpoint steps number from 1, the rerun names *Check the prerequisite*, and each failed check reports and stops before the claim, repairing nothing. | Assumption (decided by recommendation) |
| D12 | Does the numbering check also run on other skills? | No. `lets-shape` breaks the same rule in five sections of its glossary handoff, but epic #194 covers `lets-go` only. | Assumption (decided by recommendation) |

## Changes from the story

- Added: every failed check in *Check the checkpoint* stops, not only the two the story names (D7), because "say stop where a check fails" in the Scope covers them.
- Added: the rerun stops for a `next` pick instead of skipping it (D4).
- Added: a structural test that numbered lists in `lets-go` start at 1 after each heading (D9), so A2 cannot come back when later stories move text into `references/`.
- Left out: the same numbering fault in `lets-shape`'s glossary handoff (D12). It is outside epic #194. No issue is filed: the orchestrator records it under **Won't** in #194.
- Nothing was split out.

The orchestrator confirmed this ledger on the user's behalf, 2026-11-05: it keeps the story's outcome and has no open question.

Confirmed by user: yes
