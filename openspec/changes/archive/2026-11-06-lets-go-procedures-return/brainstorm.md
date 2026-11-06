## Story

#201 lets-go-procedures-return — each lets-go procedure returns a result, and the part that calls it decides whether to stop, https://github.com/sidereal-io/lets-spec/issues/201

The issue has no comments. The packet was last edited on 2026-11-05.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story change, and what stays as it is? | It changes `skills/lets-go/SKILL.md`, its tests and the `lets-go` spec. The procedures return results, the parts act on them, and B3, B4 and B5 are fixed. Duplicated rules stay for #202, such as *Claim*'s own branch check. Nothing moves into `references/` (#203). Terms at first use stay for #204. | Evidence: #201 Scope and Findings |
| D2 | Which procedures return a result? | Every section under `## Procedures`: *Find the source of demand*, *Confirm the packet*, both checks of *Glossary preflight*, *Claim*, *Import the glossary checkpoint* (with its recovery) and *Commit the discovery map*. The checks, *Claim* and the import also stop on their own today, and *Enter the branch* says "A stop it makes stands". A procedure with one outcome only says it returns. | Assumption (decided by recommendation) |
| D3 | What is a result? | A named outcome in backticks, hyphenated like a step report's `needs-input`, such as `complete`, `needs-shape` or `epic`. It carries what the part needs: the issue, who has it, or what to tell the user. Each procedure ends by listing its results and saying it returns to the part that ran it. It never says to stop, and names no part to go to. The design picks the names. | Assumption (decided by recommendation) |
| D4 | How does a part act on a result? | It names each result the procedure can return there, and its action: go on, run another part, or say what the result carries and stop. No catch-all such as "any other stop stands". | Assumption (decided by recommendation) |
| D5 | Which idioms go (D3)? | Every "set aside", every stop that "stands" or "stand", and "The lines printed for the lost issue stand". Each becomes the action itself. A test bans them in `lets-go`. | Evidence: #201 Findings, D3 |
| D6 | When may shape run before *Claim* (B3)? | For an idea, and for an issue the user named. Never for an issue that `next` or *Pick the first ready story* picked. This changes the Scope line. | User |
| D7 | What does `next` do with a candidate whose packet is not complete (B3)? | Skips it. A candidate is ready only when *Check the prerequisite* resolves and *Confirm the packet* returns `complete`, checked in rank order until one passes. If a picked issue's packet stops being complete before *Check the issue* reads it, for example because of a new comment, say to run `lets-shape` on it, and stop. | Evidence: #201 Findings, B3 (Fix) |
| D8 | When does the run look for the change's branch (B4)? | Once per issue, in *Check the issue*, after the blocker read and before *Find the source of demand* and *Confirm the packet*. It looks every time, not only when a blocker is open. *Enter the branch* uses what it found. | Evidence: #201 Findings, B4 (Fix) |
| D9 | What happens when the packet needs shaping and the change's branch exists (B4)? | Say that the change has started on `<name>`, and to run `lets-shape` on the issue. Then stop. The outcome is the same on the default branch and on the change's branch. | Evidence: `skills/lets-go/SKILL.md`, *Run the shape step* (a change's branch stops today) |
| D10 | How often can shape run in one run? | At most once, as today. A second `needs-shape` says to run `lets-shape`, and stops. | Evidence: `openspec/specs/lets-go/spec.md`, *The shape step shapes an idea or an unshaped issue* |
| D11 | What happens after a lost claim (B5)? | *Claim* returns `taken` with who has the issue. For an issue the user named, say who has it, and stop. For an issue `next` or *Pick the first ready story* picked, leave out every issue lost in this run and run both `next` commands again with the same narrowing. Take the first, print the same form of `Picked` line as the first pick, and go on from *Check the issue*. Keep the lines already printed. | Evidence: #201 Findings, B5 (Fix) |
| D12 | How many lost claims stop a run (B5)? | Three. After the third, say that other sessions keep taking the picked issues and to run `lets-go` again, and stop. | Assumption (decided by recommendation) |
| D13 | What happens to the overview table? | Its *Stops when* column restates each part's stops as results, such as "*Confirm the packet* returns `epic`". *Next* changes only where a part's next changes. | Evidence: #200 brainstorm D4; the overview's own rule |
| D14 | Does **Procedure** go in the glossary? | Yes, tentatively, in `openspec/glossary.md`: "A section of `lets-go` that a part runs in the `lets-go` session, such as *Claim*. It returns a result to the part that ran it, such as `complete` or `needs-shape`. It never stops the run and never picks what comes next: the part decides. A procedure is not a part and not a step." Committed on its own as `docs:`. | User |
| D15 | How do the tests change? | The pinned phrases change with the wording: `the prerequisite stop stands, even on a stacked branch` and ``run `next` again with the same candidates``. New checks: each procedure lists its results and says no stop; no override idiom is left; the branch lookup comes before the packet check in *Check the issue*; `next` checks the packet; three lost claims stop. The #200 checks stay. | Assumption (decided by recommendation) |

## Changes from the story

- Changed: the Scope line "shape runs before *Claim* only for an idea (B3)" now reads "only for an idea or an issue the user named" (D6). Three reasons. Shaping a named issue is a feature: the `lets-go-from-idea` brainstorm (D4), five spec scenarios and the skill's description rely on it. The epic rules out changing what `lets-go` does beyond the bug fixes. And the race B3 shows comes from `next`, which never shapes now (D7). The user chose this over stopping on an unshaped named issue, or assigning it before shaping.
- Added: *Glossary preflight*, *Claim*, *Import the glossary checkpoint* and *Commit the discovery map* return results too, not only the three procedures the Scope names (D2). The story's outcome says each procedure returns a result.
- Added: a glossary entry for **Procedure** (D14).
- Out of scope: the claim is a race of its own. *Claim* checks the assignees and then assigns, and the two are not atomic, so two sessions can both pass the check. This story only caps lost claims at three (D12). The race is being shaped as a separate bug.
- Nothing was cut, and nothing was split out. The story fits in about ten tasks.

The user chose D6 and D14, and kept D12. The orchestrator confirmed the rest of this ledger on the user's behalf, 2026-11-06.

Confirmed by user: yes
