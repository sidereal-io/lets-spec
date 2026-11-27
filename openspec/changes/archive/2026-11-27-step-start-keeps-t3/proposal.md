## Why

In a T3 Code session, `lets delegate step start` should start the same session that `lets delegate step run` would. It does not: the background step never gets the `t3` resolver (D1, D2). So a `lets-go` epic run cannot start a story run as a T3 thread. In #308's epic run, all five story runs exited 3, and no wave ran in parallel. This is a Must story of epic #339.

## What Changes

- A step that `lets delegate step start` starts from a T3 session resolves `t3`, as `lets delegate step run` does in that session (D1, D3).
- The background step still picks from `delegate.resolvers` in order. A resolver listed before `t3` still wins (D5).
- The background step counts as inside T3 Code only while the T3 server that started it runs. If that server has stopped, `t3` declines and the next resolver answers (D9).
- Nothing changes outside T3 Code (D4). `step run`, `review run` and the `instructions` commands keep their behavior (D3).
- `step start` keeps its output, `{"name":"<name>","pid":<pid>}`, and `lets-go`'s steps, stops and printed lines stay the same (D6).
- A test fails when a step started with `step start` from a T3 session resolves anything other than `t3` (D8).

Out of scope: the `cli` resolver's handling of `agy` permissions and of an empty stdout, and how `lets-go` waits for a child (#326) (D7).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-step`: *step start runs a step in the background* gains a scenario for a T3 session: the background step resolves `t3`, as `step run` would with the same options in the same session.
- `delegate-resolvers`: the rule for when the `t3` resolver counts as inside T3 Code covers a step that `step start` started from inside T3 Code, while the T3 server that started it runs. *The T3 resolver declines outside T3 Code* gains the case where that server has stopped.

## Impact

- `lets/src/delegate/background.ts`: `startStep`, which starts the background `lets delegate step run`.
- `lets/src/resolvers/t3/t3.ts`: `detect()`, which today answers only when the T3 server is an ancestor of the process.
- `lets/src/io.ts`: `spawnDetached`, if the fix needs to pass something to the child.
- Tests: `tests/delegate/background.test.ts` and `tests/lets/resolvers/t3/t3.test.ts`.
- `lets-go`'s epic run (`skills/lets-go/references/epic-run.md`) needs no change: its story runs become T3 threads, and its exit-3 fallback stays (D6).
