## 1. The reader in lets

- [x] 1.1 [easy] `parseDocument` returns the checked mapping for a valid document, and throws a `UsageError` that names the file for bad YAML, a non-mapping, or a `version` other than 3; `parseConfig` calls it and still reads, checks and drops keys exactly as before, including a `go.level: loud` beside a valid `delegate` (verify: `node --test tests/lets/delegate/config.test.ts`) (✓ `node --test tests/lets/delegate/config.test.ts` passed)
- [x] 1.2 [easy] `levelFor` gives `null` for no `go`, a null `go`, no `go.level`, a null `go.level`, and a `go` with only unknown keys; gives `ask` or `recommend` as written; and throws a `UsageError` that names the file and `go` or `go.level` for a non-mapping `go` or any other level (verify: `node --test tests/lets/delegate/config.test.ts`) (✓ `node --test tests/lets/delegate/config.test.ts` passed)
- [x] 1.3 [easy] `guarded` prints its one stderr line with a caller-given prefix, and keeps `lets delegate: ` as the default (verify: `node --test tests/lets/delegate/guarded.test.ts`) (✓ `node --test tests/lets/delegate/guarded.test.ts` passed)
- [x] 1.4 [medium] `lets go level`'s `run` prints `{"level":<value>}` as one JSON line and exits 0 for each `levelFor` case, including no config file and the file under `XDG_CONFIG_HOME`; exits 2 with an empty stdout and a `lets go: ` line naming the file and the key for a bad level; exits 0 when `delegate.resolvers` holds `codex`; and calls no resolver method (verify: `node --test tests/lets/go/level.test.ts`) (✓ `node --test tests/lets/go/level.test.ts` passed)
- [x] 1.5 [easy] `main.ts` wires the `go` group and the `level` command: `lets go --help` names `level`; `lets go level --help` names `config.yaml`, `go.level`, `ask`, `recommend` and the exit codes 0 and 2; and `lets go level` with a `go.level: loud` config exits 2 through the real entry (verify: `node --test tests/lets/delegate/cli.test.ts`) (✓ `node --test tests/lets/delegate/cli.test.ts` passed)

## 2. The skill and the README [depends-on: 1]

- [ ] 2.1 [medium] `skills/lets-go/SKILL.md`: *Start* step 2 runs `lets go level` once, before any GitHub call, and stops on a non-zero exit showing its stderr; step 10 and *Run the shape step* step 2 pick the request's level, then the kept config level, then the Kind's or `ask`, and print the matching line, including `Interactivity: <level>, because your lets config sets go.level.`; the skill-interfaces test checks the two new fixed lines (verify: `bats tests/skill-interfaces.bats`)
- [ ] 2.2 [parallel] [easy] `README.md`: the `lets-go` section says how `go.level` sets a default and that a named level still wins; the config example under *Set up delegation* gains `go.level`, and the section's closing sentence says `go` is read by `lets go level` and other keys are ignored (verify: `grep -q 'go.level' README.md && bats tests/skill-interfaces.bats`)

## 3. Integration [depends-on: 2]

- [ ] 3.1 [easy] The whole suite, the type check and the flake pass with the new command and the edited skill (verify: `pnpm test && nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
