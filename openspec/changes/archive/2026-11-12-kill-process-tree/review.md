## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (`gemini/gemini-3.8-flash` through the `t3` resolver, thread `c86cfc88-cc25-4586-90c4-0c59e96d925f`; the meta line says `"independent":true`)
- **Independent**: yes. The plan's author is `claude`, and the reviewer is `gemini`.
- **Tool restrictions**: read-only by prompt. The `t3` resolver in the pinned `lets` 0.7.0 opens the thread in the main checkout, so the prompt named this worktree's absolute path, branch and commit. The reviewer answered `Read: /home/andrew/.t3/worktrees/lets-spec/t3-0a89ce71 at 14e13690f4be4e8aa0245bab50bccb20420cbbac`, which is this branch's head at the time of review. The tree stayed clean (`"gitClean":true`), and the review took 386 seconds. No fallback through `delegate_task` was needed.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, `flake.nix`, and the two stacked changes' plans
- **Commit reviewed**: `14e13690`

## Findings

The reviewer's labels are kept. Each finding is checked against the repository.

### 🔴 Critical (blocking)

1. **The signal handler can throw `ESRCH` and leave other groups unsignalled.** Check: process and signal semantics. *The scenario:* `cli`'s `options` runs two listings at once (`lets/src/resolvers/cli/cli.ts`, `Promise.all`). One listing's processes have all exited, but its command has not settled yet, when `lets` gets `SIGINT`. Then `process.kill(-pid, 'SIGINT')` throws, so the other group gets no signal, the handlers stay, and `lets` ends by an uncaught error. *What must be true:* the handler ignores `ESRCH` on each group. — **CONFIRMED.** design.md decision 2 ignored `ESRCH`, but decision 4 did not say so.
2. **`execFile` settles at once after `SIGKILL`, before the processes have ended.** Check: tests in the sandbox. *The scenario:* design.md decision 2 settles as soon as it sends `SIGKILL`. The kernel delivers it asynchronously, so a test that checks the process right after can still find it alive on a loaded machine. *What must be true:* `execFile` checks the group for a short while after `SIGKILL` before it settles. — **CONFIRMED.**

### 🟡 Moderate

3. **The test fixture runs `ps`, which the Nix sandbox lacks.** Check: tests in the sandbox. *The scenario:* `node-tests` in `flake.nix` has only `nodejs_26`, `pnpm`, `pnpmConfigHook` and `git` as inputs, and design.md's fixture rule ran `ps -o stat= -p <pid>`. *What must be true:* on Linux the fixture reads `/proc`. — **CONFIRMED** (`flake.nix`, the `node-tests` derivation).
4. **A command that cannot start has no `pid`, and could join the set of groups or leave its handlers behind.** Check: process and signal semantics. *The scenario:* `spawn` of a missing command gives `child.pid === undefined` and emits only `error`. Then `process.kill(-undefined, …)` throws a `TypeError`. *What must be true:* only a numeric `pid` joins the set, and a failed start removes what it added. — **CONFIRMED.** Decision 1 kept the rejection, but did not say how it relates to the set.

### 📌 Suggestions

5. **The scenario *A child that ignores SIGTERM* asserts which signal the child got.** Check: scenario testability. A test cannot see that `SIGKILL` arrived. It can see when the command exits and that the child is gone. — **CONFIRMED.**
6. **Two sentences pass 30 words, and one hides its actor in the passive.** Check: plain language. `proposal.md` (the *Since #156* sentence, 33 words) and design.md decision 5 (39 words, "are sent"). — **CONFIRMED.**

The reviewer also checked D9: neither #221 nor #102 touches `kit/io.ts`, process groups or how a timeout stops a command.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. design.md decision 4: a command joins the set of groups only once it has a numeric `pid`, and leaves it when it settles or fails to start. The handler ignores `ESRCH` and `EPERM` from each `process.kill(-pid, signal)` (findings 1 and 4).
2. design.md decision 1: a command that `spawn` cannot start never joins the set (finding 4).
3. design.md decision 2: after `SIGKILL`, `execFile` goes on checking the group every 100 ms, and settles when the group is gone, or 1 second after `SIGKILL` at the latest. The zombie risk in Risks / Trade-offs says 6 seconds to match (finding 2).
4. design.md Test Seams, fixture rule: on Linux, read the state from `/proc/<pid>/stat`; run `ps` only where there is no `/proc` (finding 3).
5. `specs/delegate-resolvers/spec.md`, scenario *A child that ignores SIGTERM*: the THEN says the command exits 6 no sooner than 5 seconds and no later than 10 seconds after the time limit, and the child is gone when it exits (finding 5).
6. Split the proposal's *Since #156* sentence, and rewrite design.md decision 5 in the active voice (finding 6).

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed: required change 1, design.md decision 4.
2. Fixed: required change 3, design.md decision 2 and Risks / Trade-offs. The 1-second wait keeps the bound in the spec: 5 seconds of grace, at most 1 second more, well inside 10.
3. Fixed: required change 4, design.md Test Seams. `flake.nix` needs no new input.
4. Fixed: required changes 1 and 2, design.md decisions 1 and 4.
5. Fixed: required change 5.
6. Fixed: required change 6, proposal.md Why and design.md decision 5.
