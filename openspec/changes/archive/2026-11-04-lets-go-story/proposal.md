## Why

`lets-go` runs only a Chore. Most work is a Story or a Bug, so most work still goes through `lets-build`, one step at a time, with the user driving each session. The relay from #149 and the resume from #150 are in place, so `lets-go` can now take every Kind and pick how often it asks (D1, D3).

## What Changes

- `lets-go` takes a Chore, a Bug or a Story. The Kind gate in Start goes. An Epic still stops, as `lets-build`'s *Confirm the packet* says (D1). For a Story, Start reads the parent epic's **Shared decisions**, as *Confirm the packet* does (D2).
- `lets-go` picks the interactivity level from the Kind: `recommend` for a Chore or a Bug, `ask` for a Story (D3). It prints `Interactivity: <level>, because #<i> is a <Kind>.` (D4).
- The user can name `ask` or `recommend` in the request that starts the run. Then the line says `because you asked for it`. The level holds for that run only (D4, D5).
- At `ask`, the relay puts every question to the user, one at a time, with the step's recommendation as the suggested answer. The answer is written as the user gave it, so the step records it as `User` (D6). The step prompt names the level and what the `lets-go` session does with it; the step's own rules do not change (D7).
- Propose review stays inside the propose step, as the `lets-standard` schema's `review` artifact (D8). When propose ran in this run, its line reads `Done propose review: ...` instead of `Skipped propose review: ...` (D9).
- An open blocker stops the run only while the change's branch does not exist. On an existing branch, `lets-go` names the open blockers and goes on (D10).
- The `lets-go` routing row in `overlays/AGENTS.md` and the README becomes `Take a shaped story, bug or chore to a ready pull request in one run`. The README's `lets-go` section drops "chores only" (D11).

Nothing in `lets-build`, `lets-review-plan`, `lets-review-code` or `flows.json` changes (D12, D13).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the Kinds it runs; the level it picks, prints and accepts from the user; what the relay does at `ask`; the propose review line after a propose that ran; the blocker rule on an existing branch; the routing row text; the fixed strings the tests check.

## Impact

- `skills/lets-go/SKILL.md`: the description, Start, *Write the prompt*, *Relay the questions* and *End of the run*.
- `openspec/specs/lets-go/spec.md`: the modified requirements, and its `## Purpose`, which still says "for a shaped chore" and which a delta cannot change.
- `tests/skill-interfaces.bats`: the new fixed strings and the new routing row text.
- `overlays/AGENTS.md` and `README.md`: the routing row and the `lets-go` section.
- No code in `lets/` changes. The pinned `lets` 0.7.0 has no `step` command, so the tests check the skill's prose, as in #149 and #150 (D15).
