## Story

#159 lets-go-default-level — a default interactivity level in the lets config replaces the Kind's default, https://github.com/sidereal-io/lets-spec/issues/159

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where does the key live in the `lets` config? | In a new top-level section `go`, as `go.level`, beside `delegate`. ADR-011 gives each command group its own section, and the level is `lets-go`'s setting, not a delegation setting. | Evidence: `docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md` |
| D2 | How does `lets-go` read it? | Through a new command, `lets go level`. It prints one JSON line, `{"level":"ask"}`, `{"level":"recommend"}` or `{"level":null}`, and exits 0. It is the only `lets go` command this story adds. | Assumption |
| D3 | Which values are valid? | `ask` and `recommend`. An absent or null `go`, or an absent or null `go.level`, is `null`. Any other value, or a `go` that is not a mapping, makes `lets go level` exit 2 and name the file and the key on stderr. | Assumption |
| D4 | Do the `lets delegate` commands check `go`? | No. They ignore every key they do not read, so a bad `go.level` never stops a delegation. Only `lets go level` reads it. | Evidence: `openspec/specs/delegate-config/spec.md` |
| D5 | What is the order of precedence? | The level named in the request wins. Then `go.level`. Then the Kind: `recommend` for a Chore or a Bug, `ask` for a Story. | Evidence: issue #159 |
| D6 | Does `go.level` also set the shape step's level? | Yes. Before shape there is no Kind, so the fallback is `ask`. The key replaces that fallback too, and a named level still wins. | Assumption |
| D7 | What does the level line say when the config picked the level? | `Interactivity: <level>, because your lets config sets go.level.` The two existing lines stay as they are. | Assumption |
| D8 | What happens when `lets go level` exits non-zero? | `lets-go` shows the user its stderr and stops, before it runs any step. | Assumption |
| D9 | Does the config version change? | No. `version` stays `3`. An older `lets` ignores `go`, and a file without `go` behaves as before. | Evidence: `openspec/specs/delegate-config/spec.md` |
| D10 | Where is the behavior documented? | A new spec `go-level` for the command and the key. Deltas on `delegate-config` for the file's shape, and on `lets-go` for the pick, the new line and the fixed lines. The README's `lets-go` section says how to set a default, and the config example under *Set up delegation* shows `go.level`. | Assumption |
| D11 | Does this need an ADR? | No. ADR-011 already decides where a new setting goes, and this story follows it. | Assumption |
| D12 | Any new glossary terms? | None. The key sets the existing *Interactivity level*; it is not a new concept. | Evidence: `openspec/glossary.md` |

## Changes from the story

- Added: `go.level` also replaces the `ask` fallback before a shape step (D6). The story names only the Kind's default, and shape has no Kind yet.

Confirmed by user: no
