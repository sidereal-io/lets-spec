## Context

`launchThread` in `lets/src/resolvers/t3/t3.ts` runs two git commands in `cwd`. `git rev-parse --path-format=absolute --git-common-dir` gives the main checkout's `.git`; its parent is the main checkout, which `findProject` matches against T3's projects. `git branch --show-current` gives the branch, or an empty string on a detached HEAD. `buildLaunch` then always sends `workspaceStrategy: { type: 'root', branch? }`, which T3 runs in the project's own checkout.

T3 Code 0.1.7's launch request accepts three strategies (`OrchestrationV2ThreadLaunchWorkspaceStrategy` in its server bundle):

- `{ type: 'root', branch? }`: the project checkout.
- `{ type: 'existing_worktree', worktreePath, branch? }`: binds an existing worktree of the project.
- `{ type: 'worktree', baseRef, ... }`: makes a new worktree.

Its WebSocket launch path binds `worktreePath` as given. Only its MCP tool path checks the path against `git worktree list` first.

`review.ts` and `handoff.ts` pass the top level of the caller's checkout as `cwd`. The adapter's tests pass `/r/sub`, a subdirectory, and the adapter does not rely on a top level today.

## Goals / Non-Goals

**Goals:**

- A thread launched from a linked worktree runs in that worktree's top level, on its branch.
- A thread launched from the main checkout sends exactly what it sends today.

**Non-Goals:**

- Checking the worktree against T3's own list before launch (D9).
- Any change to `review.ts`, `handoff.ts`, the kit, or the `cli` and `subagent` resolvers.

## Test Seams

- **Primary test seam:** the adapter, through `createAdapter(io).run(...)` and `.start(...)` in `tests/lets/resolvers/t3/t3.test.ts`. A fake `io` answers the git commands, and the fake WebSocket logs the `orchestration.launchThread` payload, whose `workspaceStrategy` the test asserts.
- **Existing seams reused:** `fakeIo`, `fakeWebSocket`, `launchingIo` and `launched` in the same file. The `buildLaunch` shape test covers the payload alone.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** one function pair in `lets/src/resolvers/t3/t3.ts`, and the `launchThread` request it sends to T3. Sessions from the main checkout send the same request as before. No config, schema, skill or data shape changes.

## Decisions

1. **Find the checkout's top level with `git rev-parse --show-toplevel`.** `launchThread` adds this call. It compares the resolved top level with the main checkout it already derives from `--git-common-dir`. When they differ, `cwd` is in a linked worktree. *Alternatives:* use `cwd` as the worktree path. This breaks when `cwd` is a subdirectory, and the main checkout would then look like a worktree (D7). Or parse `git worktree list --porcelain`. That is more output to parse for the same answer.
2. **Keep it a separate git call.** `--git-common-dir` and `--show-toplevel` could share one `rev-parse` and print two lines. A separate call keeps the `git` helper returning one value, and each failure names the one command that failed. The cost is one more short process per launch.
3. **`buildLaunch` takes `worktreePath: string | null`.** Null sends `{ type: 'root', branch? }`, as today. A path sends `{ type: 'existing_worktree', worktreePath, branch? }`. `branch` is left out when it is null, in both cases (D6). `buildLaunch` stays a pure function of its input, so its shape test covers both strategies.
4. **Find the project as before.** `findProject` still matches the main checkout. A worktree of a repository T3 does not know gets the same `t3 project add <main checkout>` refusal (D8).
5. **Docs.** `docs/resolvers.md` gets one sentence in the `t3` section on where a session runs. Its smoke test gets one step: run the review from a linked worktree, and check that the thread shows that worktree (D11).

No decision here is costly to reverse, so none needs a decision record.

## Risks / Trade-offs

- [T3 changes or drops `existing_worktree` in a later release.] → The smoke test in `docs/resolvers.md` gains a worktree step, so the next T3 update shows the break. The header comment in `t3.ts` already records the protocol version.
- [`--show-toplevel` and `--git-common-dir` spell the same directory differently, for example through a symlink, so the main checkout looks like a worktree.] → Both paths come from git, with absolute paths. If they still differ, the thread runs in the main checkout's real path through `existing_worktree`, which T3 accepts for the main checkout too, so the session still runs in the right checkout.
- [T3 binds a path that is not one of its project's worktrees, because the WebSocket path does not check it.] → The path comes from git in the same repository, so it is always a worktree of that repository.

## Migration & Rollback

N/A. Nothing changes shape. To roll back, revert the change. Threads that are already open are not affected.
