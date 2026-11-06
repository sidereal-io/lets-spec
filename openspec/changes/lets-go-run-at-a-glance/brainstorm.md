## Story

#200 lets-go-run-at-a-glance — lets-go opens with the whole run as named parts, and each part says what comes next, https://github.com/sidereal-io/lets-spec/issues/200

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story change, and what stays as it is? | It restructures `skills/lets-go/SKILL.md`, its tests and the `lets-go` spec. What the run does stays the same, apart from B7 (D9) and the Project query (D10). The stops that callers override ("set that stop aside", "the stop stands") stay for `lets-go-procedures-return` (#201). Duplicated rules stay for `lets-go-one-rule-once` (#202). Nothing moves into `references/` (#203). | Evidence: #200 Scope and Findings |
| D2 | What do we call the named pieces of a run? | **Part**, defined in `openspec/glossary.md`. Not *step* (a session of its own), *stage* (a journey stage) or *phase* (a discovery phase). The intro's "stops part way" is reworded, so it does not read as the term. | User |
| D3 | Which parts does the run have, and in what order? | Read the settings (*Start* step 1) → Read the request (step 2) → Check the issue (steps 3–5) → Start from an idea and Run the shape step, when the request or the packet needs them → Route (step 6) → Enter the branch (steps 7–9) → Set the level (step 10) → Walk the step table → End of the run. Existing section names stay where a section exists. The `## Start` heading goes. | Assumption (decided by recommendation) |
| D4 | What does the overview hold, and where does it sit? | One table, right after the opening paragraphs and before `## Placeholders`. One row per part: the part, what it does, whether it runs in this session or a fresh one, what comes next, and when it stops. | Assumption (decided by recommendation) |
| D5 | What does the entry table decide? | The branch (default branch, or another branch) against the request (a number, an idea, or nothing). Each cell names the part the run goes to next, or the stop. It holds the six cases *Start* step 2 has today, with the same results. | Assumption (decided by recommendation) |
| D6 | How does each part say what comes next? | Every part but the last ends with a line that starts `Next:` and links the part or parts that follow, with the condition for each. A procedure that a part calls, such as *Claim*, says it returns to the part that ran it. It gets no `Next:` line. | Assumption (decided by recommendation) |
| D7 | Which references by step number go? | All of them in `lets-go`: the cross-section references, the placeholders table's *Where the run sets it* column, and the two `lets-shape` steps the shape prompt names by number, which it names by their bold titles instead (**Find or create the issue**, **Confirm, then write**). Numbered lists stay. A test checks that no `lets-go` prose says `step` followed by a number. | Assumption (decided by recommendation) |
| D8 | Where does shape sit (C4)? | Shape leaves the step table. The table keeps four rows: plan, review plan, build and review build. Shape is described with the parts that run before the walk. *Check the issue* prints shape's `Skipped` or `Done` line, as *Start* step 5 does today. Shape is still a step: it runs in its own session and reports. | Assumption (decided by recommendation) |
| D9 | What does *Read the report* do for a failed step (B7)? | The shape case comes first: there is no branch, so it names none. For any other step, it prints the pull request's URL only when the branch has a pull request. | Evidence: #200 Findings, B7 |
| D10 | How often does the Project query run? | Once per run. When an earlier pass of *Find the source of demand* in this run set `<project>`, `<owner>` and `<repo>`, the next pass uses them. | Evidence: #200 Findings, C2 ("the repeated Project query") |
| D11 | How do the tests change? | `start_step` gives way to a helper that reads one part's section. The blocker-order check reads *Check the issue*. New checks: the overview has one row per part, every part but the last ends with `Next:`, the entry table has its six cases, the step table has no shape row, and no prose says `step` with a number. `walk_section` and the `lets go level` order check stay. | Assumption (decided by recommendation) |
| D12 | Where does the agreed term go? | `openspec/glossary.md`, as its own `docs:` commit on this branch. | Evidence: #200 Scope |
| D13 | Does the glossary's **Step** entry change? | Yes. It opens "One unit of work that `lets-go` runs in its own session", in place of "One stage of the workflow", so *stage* keeps its one meaning. Same `docs:` commit as **Part**. | User |

## Changes from the story

- Added: the placeholders table's *Where the run sets it* column, and the two `lets-shape` step numbers inside the shape prompt, lose their step numbers too (D7). The issue's count of 20 dates from commit `8136183`. Today `lets-go` has about 33.
- Added: a test that bans `step` followed by a number in `lets-go` prose (D7), so the references cannot come back.
- Added: the glossary's **Step** entry no longer says *stage* (D13).
- Nothing was cut, and nothing was split out. The story fits in about ten tasks.

The user chose D2 and D13. The orchestrator confirmed the rest of this ledger on the user's behalf, 2026-11-05: it keeps the story's outcome.

Confirmed by user: yes
