## Why

An agent that follows `lets-go` can take a wrong path, because the skill jumps by step number in three numbering schemes. `## Start` runs for half the file, and nothing shows the whole run in one place. Story 5 of epic #194 gives the run named parts, so every later story in the epic writes into one frame. The tests can take the restructure now that `lets-go-tests-pin-behaviour` has landed.

## What Changes

- `lets-go` calls the pieces of a run *parts*. `openspec/glossary.md` defines the term, and its **Step** entry no longer says *stage* (D2, D13).
- `## Start` gives way to named parts, in today's order: *Read the settings*, *Read the request*, *Check the issue*, *Start from an idea* and *Run the shape step* when needed, *Route*, *Enter the branch*, *Set the level*, *Walk the step table* and *End of the run* (D3).
- The skill opens with an overview table of the parts: what each does, where it runs, what comes next and when it stops (D4).
- An entry table decides where a run goes after it reads the request: the branch against the request, six cases, with today's results (D5).
- Every part but the last ends with a `Next:` line. A procedure such as *Claim* returns to the part that ran it (D6).
- No `lets-go` prose refers to a step by its number. Names and links replace the references in the prose, in the placeholders table, and in the shape prompt's two references to `lets-shape` steps (D7).
- Shape leaves the step table, which keeps four rows. Shape is described with the parts that run before the walk, and is still a step (D8).
- *Read the report* handles a failed shape first, and prints the pull request's URL only when the branch has one (D9).
- The Project query runs once per run (D10).
- The tests read parts, not *Start*'s numbered steps, and check the overview, the entry table, the `Next:` lines, the four-row step table and the ban on step numbers (D11).

Nothing else the run does changes. The stops that callers override stay for #201, the duplicated rules for #202, and nothing moves into `references/` (D1). No breaking change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the skill describes the run as named parts, with an overview and an entry table. Each part says what comes next, and no prose refers to a step by number or names *Start*. Every link inside the skill resolves. Shape leaves the step table. A failed report prints a URL only when a pull request exists. The Project query runs once per run. Requirements that name *Start* or its numbered steps are reworded to name the parts.

## Impact

- `skills/lets-go/SKILL.md`: restructured. Both published flows ship it, so `nix flake check` builds the change.
- `tests/skill-interfaces.bats`: `start_step` is replaced, and new checks are added. `walk_section` and the `lets go level` order check stay.
- `openspec/glossary.md`: the **Part** entry and the reworded **Step** entry, committed with the brainstorm.
- No other skill, no code under `lets/`, and no dependency changes.
