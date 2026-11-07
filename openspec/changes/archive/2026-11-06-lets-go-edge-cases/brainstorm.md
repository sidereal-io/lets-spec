**Why:** Four rare inputs make `lets-go` lose part of an idea, loop with
nobody deciding, route an archived change again, or give every
punctuation-only idea the same name, so each needs an explicit rule
before #206 rewraps the file.

## Story

#205 lets-go-edge-cases — lets-go has an explicit rule for each rare
input the review found, https://github.com/sidereal-io/lets-spec/issues/205

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story change? | B8a, B8b, B8c and B8e, each with an explicit rule in `skills/lets-go/SKILL.md`, a test in `tests/skill-interfaces.bats` and a change to the `lets-go` spec. Nothing else changes. | Evidence: #205 Scope and Findings |
| D2 | Are B8d and B8f still open on the base? | No. #202 (`lets-go-one-rule-once`) closed both. *Set the level* gives any Kind other than Chore or Bug `ask` (B8d), and the review plan row's done test reads `lets-minimal` first (B8f). This story leaves them as they are. | Evidence: `skills/lets-go/SKILL.md` *Set the level* and *Walk the step table*; `openspec/changes/archive/2026-11-06-lets-go-one-rule-once/brainstorm.md` D3 and D11 |
| D3 | When is a leading or trailing `ask` or `recommend` the level (B8a)? | When the rest of the request is a number or nothing, it is the level, as now. When the rest is words on the default branch, ask the user whether the word names the level or is part of the idea, and show both readings. Take it off only when the user says it names the level. Quoting the idea and requiring a separator were the alternatives: both still lose the word in `ask before deleting the branch`. | Assumption (decided by recommendation) |
| D4 | Does that question break "Never ask the user which level to use"? | No. It asks what the request's words say, not which level to pick, and it is asked at either level, as *Start from an idea* asks about a match. On another branch, words stop the run anyway, so no question is asked there. *Set the level*'s sentence stays. | Assumption (decided by recommendation) |
| D5 | What limits a step's rounds at `recommend` (B8b)? | After a step's fifth `needs-input` report in this run, `lets-go` relays every later question of that step as at `ask`, and prints `Interactivity: ask for the rest of this step, because it asked for input five times.` once. The count is per step and per run. The repeated-question stop stays. | Assumption (decided by recommendation) |
| D6 | Where does `<schema>` come from for an archived change (B8c)? | From the first that exists: `openspec/changes/<name>/.openspec.yaml`, then the archive folder's `.openspec.yaml` (`openspec/changes/archive/<YYYY-MM-DD>-<name>/`), then the schema *Route* picked. Archive keeps the file, so the change keeps the schema it was built with. | Evidence: `openspec/changes/archive/2026-11-06-lets-go-plain-words/.openspec.yaml` |
| D7 | What happens to an idea with no letters or digits (B8e)? | *Read the request* stops it on the default branch: it says that an idea needs at least one letter or digit, claims nothing and runs no step. A letter in any script counts. The stop comes before the discovery query and the title search, so `idea-` is never made. A fallback name was the alternative: such an idea gives a search and a shape step nothing to work with. | Assumption (decided by recommendation) |
| D8 | Which spec requirements change? | *lets-go takes one issue number or an idea* (B8a, B8e); *An entry table says where the run goes after the request* (its sentence on taking the level off); *lets-go relays a needs-input report at the recommend level* and *A run ends on done, failed, or a repeated question* (B8b); *Review plan runs as a step, or is not in the route* (B8c, its last sentence and the archived `lets-minimal` scenario). | Evidence: `openspec/specs/lets-go/spec.md` |
| D9 | What else must the edit keep true? | The overview row for *Read the request* names the new stop. No new placeholder is needed. New and reworded lines wrap at 72 columns; old lines keep their wrap for #206. A test that pins a reworded sentence is updated with it. | Evidence: `tests/skill-interfaces.bats`; #206 Scope |
| D10 | Does the story add or change a glossary term? | No. "Round" stays a plain word, as the skill already uses it. | Evidence: `openspec/glossary.md` |

## Changes from the story

- B8d and B8f are named closed by #202, not reopened (D2). The story's
  Scope already left them out.
- B8a's Expected is met by a question rather than a parsing rule (D3):
  no rule on the words alone can tell `ask before deleting the branch`
  from `ask add a --quiet flag`.

The orchestrator confirmed this ledger on the user's behalf on
2026-11-06: the user lets it confirm a ledger that keeps the story's
outcome and has no open question.

Confirmed by user: yes
