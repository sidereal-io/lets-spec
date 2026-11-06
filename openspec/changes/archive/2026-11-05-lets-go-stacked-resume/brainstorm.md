**Why:** An agent that resumes a stacked change with `lets-go` reads the blocker stop in *Find the source of demand* before *Start* step 3's exception, so it can stop on its own blocker, and the epic fixes this first because every resume of a stacked change is exposed until the lower pull request merges.

## Story

#196 lets-go-stacked-resume — a stacked change resumes past its open blocker, https://github.com/sidereal-io/lets-spec/issues/196

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which skills change? | `skills/lets-go/SKILL.md` and its tests only. `lets-build` keeps its case 1 stop: it has no stacking exception, and its users stack by hand. | Evidence: #196 **Scope**; `skills/lets-build/SKILL.md` |
| D2 | Where does the blocker rule go? | *Start* step 3 reads the blockers with `gh issue view <i> --json title,blockedBy`, looks for the change's branch when one is open, and decides, all before it runs *Find the source of demand*. | Assumption (decided by recommendation) |
| D3 | What does case 1 of *Find the source of demand* say now? | It takes the named issue and says that *Start* step 3 has already read its blockers and decided whether an open one stops the run. It has no blocker stop of its own, because in `lets-go` case 1 runs only from step 3. | Assumption (decided by recommendation); Evidence: `skills/lets-go/SKILL.md` *Start* steps 2–3 and the shape and `next` paths, which all go on from the blocker read |
| D4 | Which stop "stands" on a stacked branch? | The prerequisite stop, named as such: when *Check the prerequisite* finds an unresolved owner or checkpoint for the named issue, the run reports it and stops, even on a stacked branch. The phrase "its stop stands" goes. | Assumption (decided by recommendation) |
| D5 | Who decides what comes after the section? | *Start*. The section's last line, "Otherwise, go on to [Confirm the packet]", becomes a return to the *Start* step that ran it, so step 4 decides. The section's other stops are left as they are. | Assumption (decided by recommendation); Evidence: #196 **Scope** puts the other stops in `lets-go-procedures-return` |
| D6 | Does the `lets-go` spec change? | Yes. MODIFIED *Start finds, confirms, routes and claims the issue*: the blocker read comes before *Find the source of demand*, and on a stacked branch the prerequisite stop still applies. Two scenarios are added: a stacked story with an unresolved prerequisite stops, and the skill states the blocker rule before the call. | Assumption (decided by recommendation) |
| D7 | How do the tests change? | The pinned phrase at `tests/skill-interfaces.bats` line 467 is replaced by the new wording. A new test checks that, in *Start*, the blocker read comes before the call to *Find the source of demand*, and that the skill no longer says "its stop stands", case 1's "say so and stop", or the section's "go on to [Confirm the packet]". | Assumption (decided by recommendation) |
| D8 | Does the glossary change? | No. "Stacked" is already defined by the workflow rules in `AGENTS.md`, and the fix adds no term. | Evidence: `AGENTS.md` *Workflow*; `openspec/glossary.md` |

## Changes from the story

None.

Confirmed by user: yes
