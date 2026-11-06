## Why

`lets-go`'s procedures stop on their own, and the parts that run them then override the stop with "set that stop aside" or "the stop stands". An agent that follows a procedure faithfully takes the wrong path. Story 6 of epic #194 makes each procedure return a result and lets the part decide. It also fixes B3, B4 and B5 here, because they sit in the same text. #200 gave the run named parts, so each part can now state its own actions.

## What Changes

- Every procedure under `## Procedures` returns a named result, such as `complete`, `needs-shape` or `epic`, with what the part needs. No procedure says to stop or names a part to go to (D2, D3).
- Each part names the results it can get and the action for each: go on, run another part, or say what the result carries and stop. No part keeps a catch-all such as "any other stop stands" (D4).
- No "set aside" or stop that "stands" is left in `lets-go`, and a test keeps them out (D5).
- Shape runs before *Claim* only for an idea or an issue the user named, never for an issue that `next` picked (D6). `next` skips a candidate whose packet is not complete (D7).
- *Check the issue* looks for the change's branch once per issue, before the packet check. When the packet needs shaping and the branch exists, the run says to run `lets-shape` and stops, on any branch (D8, D9). Shape still runs at most once per run (D10).
- A lost claim on a picked issue leaves that issue out and runs `next` again. After three lost claims, the run stops (D11, D12).
- The overview's *Stops when* column restates each part's stops as results (D13).
- `openspec/glossary.md` defines **Procedure** (D14).
- The tests follow the new wording and check the results, the banned idioms, the branch lookup's order, `next`'s packet check and the cap on lost claims (D15).

The run does the same work as before, apart from the bug fixes B3, B4 and B5. Duplicated rules stay for #202, and nothing moves into `references/` (D1). The claim's own race is not closed here: it is being shaped as a separate bug. No breaking change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: procedures return results, and the parts that run them decide whether to stop. Shape runs before *Claim* only for an idea or a named issue. `next` skips a candidate whose packet is not complete. The branch lookup comes before the packet check, and decides between shaping and stopping. A lost claim drops the issue, and three lost claims stop the run. Requirements that set a stop aside or let it stand are reworded to state the action.

## Impact

- `skills/lets-go/SKILL.md`: the procedures, the parts that run them, and the overview table. Both published flows ship it, so `nix flake check` builds the change.
- `tests/skill-interfaces.bats`: reworded phrases, and new checks.
- `openspec/glossary.md`: the **Procedure** entry, committed after the brainstorm.
- No other skill, no code under `lets/`, and no dependency changes.
