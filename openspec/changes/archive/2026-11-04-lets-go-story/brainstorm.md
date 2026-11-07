## Story

#152 lets-go-story — lets-go takes a Story or a Bug through all five steps, at the interactivity level it picks from the Kind. https://github.com/sidereal-io/lets-spec/issues/152

The user delegated this brainstorm to the orchestrating session on 2026-11-04 and asked for a recommendation on every question. Each recommendation is recorded as an `Assumption`, so the plan review checks it. The issue has no comments. The packet was last edited on 2026-11-04.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which Kinds does `lets-go` run now? | A Chore, a Bug or a Story. The Kind gate in Start goes, with its "#152 adds" line. An Epic still stops, as `lets-build`'s *Confirm the packet* says: an epic is built through its stories. A Bug's packet is checked by that section's Bug lines; it has no parent to read. | Evidence: #152 packet; `skills/lets-build/SKILL.md` |
| D2 | What does Start read for a Story? | The parent epic's **Shared decisions**, as *Confirm the packet* does, because *Route* needs them. The "read no parent epic" rule goes. | Evidence: `skills/lets-build/SKILL.md` |
| D3 | Which level does each Kind get? | A Chore or a Bug gets `recommend`. A Story gets `ask`. | Evidence: #148 Shared decisions |
| D4 | What does the level line say? | `Interactivity: <level>, because #<i> is a <Kind>.`, such as `Interactivity: ask, because #152 is a Story.` When the user named the level, `Interactivity: <level>, because you asked for it.` | Assumption |
| D5 | How does the user change the level? | By naming `ask` or `recommend` in the request that starts the run, with the issue number. `lets-go` never asks which level to use. The level holds for that run only: a later run picks from the Kind again unless the user names one, because `lets-go` keeps no state (ADR-017). A default in the `lets` config is #159. | Assumption |
| D6 | What does `ask` mean for the relay? | Every question goes to the user, one at a time, in the report's order, with the step's recommendation shown as the suggested answer. The answer is written as the user gave it, with no "accepted by `lets-go`" marker, even when they take the recommendation, so the step records it as `User`. At `recommend` the relay works as today. | Evidence: ADR-015; #148 Shared decisions; Assumption |
| D7 | Does the step prompt change with the level? | Only the lines that name the level and say what the `lets-go` session does with it. At both levels the step lists every open question with a recommendation where it has one, and never decides one. | Evidence: ADR-015 |
| D8 | Does propose review run as its own step session? | No. In `lets-standard` it runs inside the propose step, as the schema's `review` artifact: `lets-review-plan` already runs it in a fresh session of another family, and the schema writes `tasks.md` only after its verdict. `lets-go` reports it as its own line, dated from the `review.md` commit as #150 set. On `lets-minimal` the line says it is not in the route. | Evidence: `openspec/schemas/lets-standard/schema.yaml`; Assumption |
| D9 | What does the propose review line say when propose ran in this run? | `Done propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).` The `Skipped` form stays for a run that skipped propose. Both read the same `git log`. | Assumption |
| D10 | Does an open blocker stop the run? | Only while the change's branch does not exist. `lets-build`'s stop asks the user to stack the branch by hand; when the branch exists, locally or on `origin`, they have. `lets-go` then names the open blockers and goes on. Every other stop `lets-build` makes stands. | Assumption |
| D11 | Which routing rows change? | The `lets-go` row in `overlays/AGENTS.md` and the README's usage table becomes `Take a shaped story, bug or chore to a ready pull request in one run`. The `lets-build` row stays; #157 decides `lets-build`. The README's `lets-go` section drops "chores only", and says the levels and how to name one. | Evidence: #152 packet; `tests/skill-interfaces.bats` |
| D12 | Do `lets-review-plan` or `lets-review-code` change? | No. A step's prompt already forbids asking in its session, so a review skill's "stop and ask the user" ends the step with a `needs-input` report, and the relay asks. | Evidence: `skills/lets-review-plan/SKILL.md`; `skills/lets-go/SKILL.md` |
| D13 | What changes in files? | `skills/lets-go/SKILL.md`: the description, Start, *Write the prompt*, *Relay the questions* and *End of the run*. `openspec/specs/lets-go/spec.md`: the modified requirements, and its `## Purpose` line, which a delta cannot change. `tests/skill-interfaces.bats`: the new fixed strings and the new row text. `overlays/AGENTS.md` and `README.md`: the rows and the section. `flows.json` and `lets-build` are unchanged. | Evidence: #152 packet |
| D14 | New glossary terms? | None. The *Step* entry says a step runs through the `step` strategy; with D8, propose review runs inside the propose step through the `review` strategy. The entry is left for the user to settle. | Assumption |
| D15 | Can it run here now? | No. The pinned `lets` 0.7.0 has no `step` command. The tests check the skill's prose, as in #149 and #150. | Evidence: `mise.toml` |

## Changes from the story

Added: an open blocker no longer stops a run on a change's branch that already exists (D10). Without it, a stacked story could not run, and most stories in this repository stack.

Confirmed by user: yes
