## Story

#325 step-start-keeps-t3 — a step or a story run started with lets delegate step start in a T3 session runs as a T3 thread.
https://github.com/sidereal-io/lets-spec/issues/325

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Is this a bug against an existing rule, or new behavior? | A bug: `lets delegate step start` must start "the session that `lets delegate step run` would run with the same options". In a T3 session it does not. | Evidence: openspec/specs/delegate-step/spec.md, *step start runs a step in the background* |
| D2 | Why does the background step miss `t3`? | `step start` spawns `step run` detached and exits. The `t3` resolver answers only when the T3 server is an ancestor of the process, so the orphaned child fails that check. | Evidence: lets/src/resolvers/t3/t3.ts `detect()`, lets/src/delegate/background.ts, lets/src/io.ts `spawnDetached` |
| D3 | Which commands does the fix cover? | Only `lets delegate step start`: it is the only command that starts `lets` detached. `step run`, `review run` and `step instructions` already resolve `t3` in a T3 session. | Evidence: lets/src/io.ts, lets/src/delegate/background.ts (sole caller of `spawnDetached`); #325 **How to reproduce** |
| D4 | What happens outside T3 Code? | Nothing changes: `t3` still declines, and the next resolver in `delegate.resolvers` answers. | Evidence: openspec/specs/delegate-resolvers/spec.md, *The T3 resolver declines outside T3 Code* |
| D5 | Does the resolver order still apply? | Yes. The background step picks from `delegate.resolvers` in order, as `step run` would in the same session. A resolver listed before `t3` still wins. | Evidence: openspec/specs/delegate-step/spec.md, *step start runs a step in the background*; lets/src/delegate/lookup.ts `pick` |
| D6 | Do `lets-go`'s steps, stops or printed lines change? | No. `step start` still prints `{"name":"<name>","pid":<pid>}`, and epic-run.md keeps its exit-3 fallback for a story whose child cannot start. | Evidence: #339 *Shared decisions* |
| D7 | What is out of scope? | The `cli` resolver's handling of `agy` permissions and of an empty stdout, and how `lets-go` waits for a child (#326). | Evidence: #325 **Scope** |
| D8 | What shows the bug is fixed? | A test that fails when a step started with `step start` from a T3 session resolves any resolver other than `t3`. | Evidence: #325 **Scope** |
| D9 | If the T3 server that ran `step start` has stopped when the background step picks its resolver, what happens? | The step counts as inside T3 Code only while that server runs. Once it has stopped, `t3` declines and the next resolver in `delegate.resolvers` answers, as `step run` would. | Assumption |

## Changes from the story

None.

Confirmed by user: yes
