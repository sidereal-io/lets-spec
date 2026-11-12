## ADDED Requirements

### Requirement: The T3 resolver opens a session in the checkout that asked for it
When `t3` answers `lets delegate review run` or `lets delegate handoff run`, it SHALL open the thread in the git checkout that holds the command's working directory:
- From a linked git worktree, the thread SHALL run in that worktree's top-level directory, on the worktree's current branch. It SHALL NOT run in the main checkout.
- From the main checkout, the thread SHALL run in T3's project checkout, on the main checkout's current branch.
- When the checkout has a detached HEAD, the thread SHALL run in the same checkout, with no branch.

The thread SHALL belong to the T3 project for the main checkout in both cases. When T3 has no project for the main checkout, `t3` SHALL refuse as "A refusal exits 3" says, and stderr SHALL name the main checkout.

#### Scenario: A review from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, T3 has a project for the main checkout `/r`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`, in the project for `/r`

#### Scenario: A handoff from a linked worktree
- **WHEN** the config's `delegate.resolvers` is `[t3]`, T3 has a project for the main checkout `/r`, and the user runs `lets delegate handoff run --for apply --model gpt/gpt-6-luna` inside T3 Code, in the linked worktree `/w/fix-login` on branch `fix-login`
- **THEN** the thread runs in `/w/fix-login`, on branch `fix-login`

#### Scenario: A review from a subdirectory of a linked worktree
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers from `/w/fix-login/lets`, inside the linked worktree `/w/fix-login`
- **THEN** the thread runs in `/w/fix-login`, not in `/w/fix-login/lets`

#### Scenario: A linked worktree with a detached HEAD
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, which has a detached HEAD
- **THEN** the thread runs in `/w/fix-login`, with no branch

#### Scenario: A review from the main checkout
- **WHEN** the config's `delegate.resolvers` is `[t3]`, T3 has a project for `/r`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code, in `/r` on branch `main`
- **THEN** the thread runs in the project checkout, on branch `main`, with no worktree

#### Scenario: A linked worktree of a repository T3 has no project for
- **WHEN** the config's `delegate.resolvers` is `[t3]`, T3 has no project for the main checkout `/r`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code, in the linked worktree `/w/fix-login`
- **THEN** it exits 3, no thread is created, and stderr names `/r`
