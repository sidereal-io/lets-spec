## Context

`lets` reads one user-level config, `~/.config/lets/config.yaml`. `lets/src/delegate/config.ts` parses it. `parseConfig` checks the document and its `version`, then the `delegate` section, and drops every other key. `guidanceFor` reads `delegate.<strategy>.<intent>.guidance` lazily, so a bad guidance stops only the command that reads it. The config has `version: 3`, and the *delegate-config* spec promises that the delegate commands ignore keys they do not read.

`lets/src/main.ts` is the commander program. It has two groups, `sync` and `delegate`. Each delegate command runs inside `guarded`, which turns a `UsageError` into exit 2 and one line on stderr with the prefix `lets delegate: `.

`skills/lets-go/SKILL.md` reads the request in *Start* step 2, claims the issue in step 7, and picks the level in step 10 and in *Run the shape step* step 2. The pick comes from the request or the Kind, and never asks the user. The *lets-go* spec lists the fixed lines that `tests/skill-interfaces.bats` checks in the skill's prose.

## Goals / Non-Goals

**Goals:**
- One key, `go.level`, and one command, `lets go level`, that prints it.
- A config without `go` behaves as before, and a bad `go.level` stops nothing but `lets go level`.
- The skill picks the level in one place, in one order, with one line per source.

**Non-Goals:**
- A level per Kind, or per step.
- Any other `lets go` command, or any other key under `go`.
- Changing how a step relays questions once the level is set.

## Test Seams

- **Primary test seam:** the command's `run` function with fake deps, in a new `tests/lets/go/level.test.ts`, through the `commandDeps` fixture `tests/lets/delegate/fixtures/command-deps.ts` already provides.
- **Existing seams reused:** `tests/lets/delegate/config.test.ts` for `parseDocument` and `levelFor` together, the pair the command calls, and for `parseConfig` as before; `tests/lets/delegate/cli.test.ts` for the help text and the bad-value exit through the real entry; `tests/skill-interfaces.bats` for the skill's fixed lines.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** `lets/src/delegate/config.ts`, a new `lets/src/go/level.ts`, `lets/src/main.ts`, `skills/lets-go/SKILL.md`, `README.md`, and their tests. No data, no protocol, no resolver changes.

## Decisions

- **`parseConfig` splits in two, and `go` never reaches `Config`.** `parseDocument` checks the YAML, the mapping and `version`, and returns the checked mapping. `parseConfig` calls it, then checks `delegate` as today, and still drops `go`. A new `levelFor(document, path)` reads `go` from the checked mapping. It gives `null` for an absent or null `go` or `go.level`, the string for `ask` or `recommend`, and otherwise throws a `UsageError` that names the dotted key. `lets go level` calls `parseDocument`, then `levelFor`, so a bad `delegate` section does not stop it. Alternative: keep `go` on `Config`, as `review`, `handoff` and `step` are kept. Rejected: no `lets delegate` command reads it, so the field would have no production reader, and its tests would run through a seam the command does not use. Alternative: validate `go` inside `parseConfig`. Rejected: a bad `go.level` would then stop every delegate command, against the *delegate-config* promise.
- **The command lives in `lets/src/go/level.ts`, under a `go` group in `main.ts`.** The group is named after the skill, as `delegate` is named after its commands, so `go.level` sits at the path of the command that reads it (ADR-011). Alternative: a `level` field on `lets delegate step instructions`. Rejected: the level is picked before the first step's prompt is written, and is not a delegation setting.
- **Errors go through `guarded` with the prefix `lets go: `.** `guarded` takes the prefix as a parameter, defaulting to `lets delegate: `, so the exit codes and the one-line stderr stay shared. Alternative: a copy of `guarded` under `go/`. Rejected: two copies of one rule.
- **The skill runs `lets go level` once, in *Start* step 2, when it reads the request.** That is before any GitHub read and before *Claim*, so a bad config stops the run before it assigns an issue, sets its Status or creates a branch. *Start* step 10 and *Run the shape step* step 2 read the kept value. After a shape step, the pick runs again in the same order without rerunning the command. Alternative: run the command at the first pick. Rejected: on a shaped issue the first pick is step 10, after *Claim* has already changed GitHub and Git.
- **The README shows the key in two places.** The `lets-go` section says how to set a default. The config example under *Set up delegation* gains a `go` section, and the section's closing sentence changes: `go` is read by `lets go level`, and other keys are ignored. Without that edit the sentence would call settings beside `delegate` future work while the example shows one.
- **The line for the config's level names the key.** `Interactivity: <level>, because your lets config sets go.level.` tells the user where to change it. It joins the fixed lines the skill-interfaces test checks.

## Risks / Trade-offs

- [A user sets `go.level: recommend` and a Story's brainstorm runs with fewer questions than they expect] → The level line says the config picked it and names the key.
- [The `delegate` help in `main.ts` shows the config without `go`] → The `lets go level` help shows the key, and the README's example shows both sections together.
- [A bad `go.level` is found late, after the run has changed GitHub] → The command runs in *Start* step 2, before any GitHub call.
- [Splitting `parseConfig` changes a function every delegate command calls] → `parseConfig`'s behavior is unchanged; the existing config tests cover it, and the new tests cover `parseDocument` with `levelFor`.

## Migration & Rollback

N/A. The config version stays `3`. A file without `go` reads as before. Rolling back removes the command and the key's reader; a file that still holds `go` is ignored by the older `lets`.
