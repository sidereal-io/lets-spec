## Why

`lets-go` picks the interactivity level from the Kind on every run: `recommend` for a Chore or a Bug, `ask` for a Story. A user who always wants the same level has to name it on every run, or forget and get the other one. The pick exists for every Kind since #152, so a default can now sit beside it.

## What Changes

- A new key in the `lets` config, `go.level`, holds the user's default interactivity level, `ask` or `recommend` (D1, D3).
- A new command, `lets go level`, reads the key and prints it as one JSON line. It is the only `lets go` command this change adds (D2). A bad value makes it exit 2 and name the file and the key (D3). The `lets delegate` commands keep ignoring `go` (D4).
- `lets-go` runs `lets go level` once, when it reads the request, before it asks GitHub for anything. A level named in the request still wins. Then the config's level. Then the Kind's default, or `ask` before a shape step (D5, D6). When the config picked the level, the line reads `Interactivity: <level>, because your lets config sets go.level.` (D7). When the command fails, `lets-go` shows its stderr and stops (D8).
- The README says how to set a default, and the config example shows `go.level` (D10).
- The config version stays `3` (D9). No ADR (D11). No new glossary term (D12).

## Capabilities

### New Capabilities
- `go-level`: the `lets go level` command, and the `go.level` key it reads from the `lets` config.

### Modified Capabilities
- `delegate-config`: *The config file* may hold a `go` section, which the `lets delegate` commands ignore.
- `lets-go`: *lets-go picks the interactivity level and says why* gains the command, the config's level between the request's and the Kind's, and the new line. *Start reuses lets-build* lists `lets go level` among the commands Start adds. *The prose holds the fixed lines the tests check* gains the new line and the command.

## Impact

- `lets/src/delegate/config.ts`: split the document check out of `parseConfig`, and add a reader for `go.level`.
- `lets/src/go/level.ts`, new: the command. `lets/src/main.ts`: the `lets go` group and its help.
- `skills/lets-go/SKILL.md`: *Start* steps 2 and 10, and *Run the shape step* step 2.
- `README.md`: the `lets-go` section, and the config example and closing sentence under *Set up delegation*.
- Tests: `tests/lets/delegate/config.test.ts`, `tests/lets/delegate/cli.test.ts`, a new `tests/lets/go/level.test.ts`, and `tests/skill-interfaces.bats`.
- No dependency, API or data change. Nothing breaks for a config without `go`.
