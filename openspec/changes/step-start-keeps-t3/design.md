## Context

- `t3`'s `detect()` in `lets/src/resolvers/t3/t3.ts` answers when three things hold: `server-runtime.json` exists under T3's userdata folder, the server pid it names is alive, and that pid is an ancestor of this process (`isAncestor`).
- `startStep` in `lets/src/delegate/background.ts` starts `lets delegate step run` with `io.spawnDetached` and exits. `spawnDetached` in `lets/src/io.ts` passes the `env` it is given to the child, which is `deps.env` today.
- Once `step start` exits, the child is reparented to init or a subreaper. Its parent chain no longer reaches the T3 server, so `detect()` is false (D2). Running the child without `detached: true` would not help: reparenting happens either way.
- `background.ts` knows nothing about any resolver. It reaches them only through `deps.resolvers`, the adapters built into `lets`.
- The `Adapter` type in `lets/src/resolvers/kit/adapter.ts` has no way for a resolver to hand context to a detached child.

## Goals / Non-Goals

**Goals:**

- The detached `step run` sees the same `t3` answer that `step run` would see in the process where `step start` ran.
- The background step still runs the normal pick over `delegate.resolvers` (D5), so the T3 server's state when the step picks decides the answer (D9).
- `background.ts` stays free of resolver-specific code.

**Non-Goals:**

- No change to how `step run`, `review run` or the `instructions` commands detect `t3` in an attached process (D3).
- No new command-line option, and no change to the run record, the report file or `step start`'s printed line (D6).
- No change to the `cli` or `subagent` resolvers (D7).

## Test Seams

- **Primary test seam:** the real-process suite in `tests/delegate/background.test.ts`. It runs `lets delegate step start` as a program, so the child really is detached, which is the bug (D2). The test process stands in as the T3 server: a temporary `T3CODE_HOME` holds a `server-runtime.json` that names the test's own pid, and a `statev2.sqlite` built from `tests/lets/resolvers/t3/fixtures/t3-schema.sql` with no project. The config is `[t3, cli]` with a `claude` stand-in on `PATH`. When `t3` answers the background step, it refuses with `t3 has no project for <root>` before it opens any WebSocket, and the meta file holds that text. Before the fix, `cli` answers and the meta file's record line has `"resolver":"cli"`. This is the test D8 asks for.
- **Existing seams reused:** `tests/lets/resolvers/t3/t3.test.ts` drives `detect()` and the new hook on the kit's fake io. It covers the cases the real-process suite cannot set up cheaply: the server has stopped, the server has restarted with a new pid, and no marker at all.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One package, but it adds an optional member to the `Adapter` contract and widens when `t3` counts as inside T3 Code.
- **Blast radius:** `lets/src/resolvers/kit/adapter.ts`, `lets/src/resolvers/t3/t3.ts` and `lets/src/delegate/background.ts`. Every other resolver and command is untouched. A wrong answer here makes a background step pick `t3` or not pick it; it cannot change what an attached command does.

## Decisions

### 1. Carry T3 context to the child in an environment variable

`step start` sets `LETS_T3_SERVER_PID=<pid>` in the detached child's environment, where `<pid>` is the pid in `server-runtime.json`. It sets it only when `t3`'s `detect()` is true in `step start`'s own process.

Alternatives:

- **Pick the resolver in `step start` and pass `--resolver t3` to the child.** Rejected: the child could not fall back when the server has stopped (D9), and it adds an option to `step run`.
- **Write the context into the run record and have `step run` read it.** Rejected: `step run` would need to know it was started by `step start`, and the record is `step wait`'s, not the resolver's.
- **Rely on an environment variable that T3 itself sets in its agent processes.** Rejected: T3 documents none, and the adapter already treats T3's internals as private and moving.

An environment variable is inherited by every process the child starts, such as a `cli` session that runs `lets` again. Those processes would see `t3` too. That matches today's behavior in an attached T3 session, where every descendant has the server as an ancestor.

### 2. `detect()` accepts the marker only for the same live server

`detect()` becomes: `runtime !== null && io.processAlive(runtime.pid) && (isAncestor(io, runtime.pid) || io.env.LETS_T3_SERVER_PID === String(runtime.pid))`.

- The server stopped: `processAlive` is false, so `t3` declines (D9).
- The server restarted: `server-runtime.json` names a new pid, which no longer matches the marker, so `t3` declines. This is the spec's "even when another T3 server has started since".
- No marker: behavior is as today.

### 3. A generic adapter hook, `detachedEnv`

`Adapter` gains an optional member, `detachedEnv?(): Record<string, string>`: the environment a detached child needs to stay in this harness. `t3` returns `{ LETS_T3_SERVER_PID: String(runtime.pid) }` when `detect()` is true, and `{}` otherwise. `startStep` calls `detachedEnv` on every adapter in `deps.resolvers` and merges the results over `deps.env` for `spawnDetached`. It asks every built-in adapter, not only the configured chain, because `startStep` loads no config today and the child does its own pick. The hook never throws: `t3`'s returns `{}` when reading the runtime file or the parent processes fails, because a failed hint must not stop the step from starting, and the child's pick still runs.

Alternative: have `background.ts` call `readRuntime` and `isAncestor` itself. Rejected: it would tie the background code to one resolver.

This is not costly to reverse: the hook is optional and internal to `lets`, and the variable is read in one place. It needs no ADR.

## Risks / Trade-offs

- [A user sets `LETS_T3_SERVER_PID` by hand in a terminal T3 did not start, while T3 runs] → `t3` answers there. The variable is internal and undocumented for users; name it in the adapter's header comment as set by `step start` only.
- [T3 stops, `server-runtime.json` stays behind, and an unrelated process reuses the pid] → `detect()` is true, and the step fails at T3's WebSocket with a refusal, exit 3. The same stale-file risk exists today for ancestry; the window is small, so accept it.
- [A detached child that starts its own background step] → it passes the marker on, because `detect()` is true in the child too. That is intended: it is still inside the same T3 server.

## Migration & Rollback

N/A. No stored data changes shape. Rolling back the commit restores the old behavior: background steps pick the next resolver after `t3`.
