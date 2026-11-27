## 1. The t3 resolver knows a detached step's T3 server

- [x] 1.1 [easy] `t3`'s `detect()` is true when `LETS_T3_SERVER_PID` in its io's `env` equals the pid in `server-runtime.json`, that pid is alive, and it is not an ancestor of the process (design decision 2) (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed)
- [x] 1.2 [easy] `t3`'s `detect()` is false when `LETS_T3_SERVER_PID` matches the runtime file's pid but that server is no longer alive: the server has stopped (D9, design decision 2) (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`) (✓ `node --test tests/lets/resolvers/t3/t3.test.ts` passed; fails with the liveness check removed)
- [ ] 1.3 [easy] `t3`'s `detect()` is false when `LETS_T3_SERVER_PID` names a pid other than the one the runtime file names, as after T3 restarts, even though the new server is alive (design decision 2) (verify: `node --test tests/lets/resolvers/t3/t3.test.ts`)
- [ ] 1.4 [medium] `Adapter` in `lets/src/resolvers/kit/adapter.ts` gains the optional `detachedEnv?(): Record<string, string>`. `t3`'s returns `{ LETS_T3_SERVER_PID: "<runtime pid>" }` when `detect()` is true, and `{}` when it is false or when reading the runtime file or the parent processes throws. The adapter's header comment says that only `lets delegate step start` sets the variable (design decision 3) (verify: `node --test tests/lets/resolvers/t3/t3.test.ts && pnpm check`)

## 2. step start passes the hint to its background step [depends-on: 1]

- [ ] 2.1 [complex] In `tests/delegate/background.test.ts`, a stand-in T3 server: a temporary `T3CODE_HOME` whose `userdata/server-runtime.json` names the test process's pid, and whose `userdata/statev2.sqlite` is built from `tests/lets/resolvers/t3/fixtures/t3-schema.sql` with no project. With `delegate.resolvers` `[t3, cli]` and a `claude` stand-in, `lets delegate step start --for build` exits 0, and once the step ends its meta file holds `t3 has no project for` and no record line with `"resolver":"cli"`. It fails before the fix. Make it pass: `startStep` merges the `detachedEnv` of every adapter in `deps.resolvers` over `deps.env` for `spawnDetached` (D8, design decisions 1 and 3) (verify: `node --test tests/delegate/background.test.ts`)
- [ ] 2.2 [easy] Outside T3 Code, with no `server-runtime.json` under `T3CODE_HOME` and `delegate.resolvers` `[t3, cli]`, a step started with `lets delegate step start` ends with a record line holding `"resolver":"cli"` in its meta file. This guards D4 and may pass at once (verify: `node --test tests/delegate/background.test.ts`)
- [ ] 2.3 [easy] Inside the stand-in T3 server from 2.1, with `delegate.resolvers` `[cli, t3]`, a step started with `lets delegate step start` ends with a record line holding `"resolver":"cli"`, as `lets delegate step run` would. This guards D5 and may pass at once (verify: `node --test tests/delegate/background.test.ts`)

## 3. Integration [depends-on: 2]

- [ ] 3.1 [easy] Every project check passes: the Node tests and type check, the flake checks, and OpenSpec validation with warnings as failures (verify: `pnpm test && nix flake check && mise run check`)

## Deviations Ledger
