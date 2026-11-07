## Why

Several `lets-go` rules are written in two to five places: the level, the printed lines, the branch check, the prerequisite check, and the Project stops. Copies drift apart, and each copy is one more place for an agent to choose wrongly. The walk also takes a step's `done` report on trust, so build can run on a plan nobody approved (B6). Story 7 of epic #194 writes each rule once and checks each report. It comes now because #201 gave each rule an obvious home: a part or a procedure.

## What Changes

- The level is defined once, in *Set the level*, and *Run the shape step* links to it. Any Kind other than Chore or Bug gets `ask`, as a Story does (B8d). The redundant "set it again here" goes (D3).
- Each step's `Done`, `Skipped` and `Failed` line, and the `<date>` and `<evidence>` rule, are defined in one section. The parts that print a line link to it (D4). `Done shape` prints once per run, even after a lost claim (D5).
- The branch check runs only in *Check the issue*. *Claim* loses its own check and its `branch-exists` result (D6).
- The Project query runs once, in *Read the settings*. That part stops when it finds no Project or several, before any other stop. *Find the source of demand* no longer returns `no-project` or `several-projects`, and four parts lose the bullets that handled them (D7).
- *Check the prerequisite* no longer runs a third time inside *Claim*. *Claim*'s preflight runs only *Check the checkpoint* (D8). A picked issue's packet and prerequisite are still checked again in *Check the issue*, from the one written rule (D9).
- Each row of the walk has one done test, an ordered list where the first match decides. The step table loses its *Done when* column (D10). Review plan's test reads `lets-minimal` first, then the archive folder, then the **Plan review** section (D11, B8f).
- After a `done` report from plan, review plan, build or review build, the walk runs the row's done test again. If it fails, the step has failed, with the reason "the step reported done, but `<record>` says otherwise" (D12, B6). Shape already gets this check (D13).
- Branches that never run go: *Find the source of demand*'s "return to *Claim*" and `lets-minimal`'s "once plan is done". The `MERGED` and `CLOSED` stops stay, and now say when they run (D14).
- The tests follow the new wording, and check each of the above (D16).

The run does the same work as before, apart from B6, B8d and B8f, and the earlier Project stop (D7). The blocker read and **Shared decisions** are written once already (D2). Nothing moves into `references/` (#203), and terms at first use stay for #204 (D1). There is no new glossary term (D17), and no breaking change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the Project query and its stops move to *Read the settings*, and *Find the source of demand* loses two results. *Claim* loses its branch check and `branch-exists`, and its preflight no longer checks the prerequisite again. Any Kind other than Chore, Bug or Epic runs as a Story, at `ask`. A `done` report is checked against the row's record. Review plan's done test has a stated order. The `MERGED` and `CLOSED` stops say when they run. The requirement that let a stop "stand" or be "set aside" states the action instead (D15).

## Impact

- `skills/lets-go/SKILL.md`: *Read the settings*, the four parts that handled the Project stops, *Check the issue*, *Pick the first ready story*, *Enter the branch*, *Set the level*, *Run the shape step*, the walk, the step table, *End of the run*, *Read the report*, and the procedures *Find the source of demand*, *Glossary preflight* and *Claim*. Both published flows ship it, so `nix flake check` builds the change.
- `tests/skill-interfaces.bats`: reworded phrases, and new checks.
- `openspec/specs/lets-go/spec.md`, through the delta spec.
- No other skill, no code under `lets/`, and no dependency changes.
