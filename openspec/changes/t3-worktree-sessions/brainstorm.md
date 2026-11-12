## Story

#123 t3-worktree-sessions — a t3 session runs in the worktree that started it.
https://github.com/sidereal-io/lets-spec/issues/123

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which sessions does the fix cover? | Reviews (`run`) and handoffs (`start`) through the `t3` resolver. `t3` runs no step yet, so a step is out; #155 adds steps on top of this fix. | Evidence: `lets/src/resolvers/t3/t3.ts`, `docs/resolvers.md` |
| D2 | What is out of scope? | Naming the checkout and commit in the review's output, plan mode and the time limit (#221). The `cli` resolver, which already runs in `cwd`. | Evidence: #123 Scope |
| D3 | When does `cwd` count as a linked worktree? | When the top level of `cwd` is not the main checkout, which `t3` already finds from `--git-common-dir`. | Evidence: `launchThread` in `t3.ts` |
| D4 | What does `t3` send from a linked worktree? | `workspaceStrategy: { type: 'existing_worktree', worktreePath: <worktree top level>, branch }`. T3 Code 0.1.7 accepts this shape for a new thread. | Evidence: T3 Code 0.1.7 server bundle, `OrchestrationV2ThreadLaunchWorkspaceStrategy` |
| D5 | What does `t3` send from the main checkout? | The same as today: `{ type: 'root', branch }`. | Evidence: #123 Expected |
| D6 | What if the worktree has a detached HEAD? | Send `existing_worktree` with no `branch`, as `root` already does with no branch. | Assumption |
| D7 | What if `cwd` is a subdirectory of the worktree? | `worktreePath` is the worktree's top level, never `cwd` itself. Callers pass the top level today, but the resolver should not rely on it. | Assumption |
| D8 | Which T3 project does a worktree session use? | The main checkout's project, as today. A repository with no T3 project is still refused with the `t3 project add` hint, naming the main checkout. | Evidence: `findProject` in `t3.ts` |
| D9 | Should `t3` check that T3 lists the worktree before it launches? | No. Git has already shown the worktree belongs to the project's repository. If T3 refuses the launch, that error passes through as it does today. | Assumption |
| D10 | How is the fix accepted? | A unit test for each case: a review and a handoff from a linked worktree, the main checkout unchanged, and a detached HEAD in a worktree. A new requirement in `delegate-resolvers`, *The T3 resolver opens a session in the checkout that asked for it*, with a scenario for each case. *The T3 resolver opens a session in a T3 thread* stays as it is. | Evidence: #227 Shared decisions |
| D11 | Do the docs change? | Yes. `docs/resolvers.md` says that a session started from a linked worktree runs in that worktree, and its smoke test checks this. No skill or schema changes. | Assumption |
| D12 | When does this repository benefit? | At the next release. This repository runs the pinned 0.7.0 `lets`, so its own reviews keep the fault until the pin moves. | Evidence: `CLAUDE.md`, #227 Scope |

## Changes from the story

- Added: the `docs/resolvers.md` note and smoke-test step (D11). The packet names only the code, the spec and the tests.
- Added: the detached HEAD and subdirectory cases (D6, D7), so the behavior is defined for every `cwd`.
- No split: about six tasks.

The user delegated the brainstorm for epic #227: the agent decides and records its recommendations, and asks only where it has none. Every question here had a recommendation, so no question went to the user.

Confirmed by user: yes
