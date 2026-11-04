## Why

`lets go` runs each step of the workflow in its own session through `lets delegate step run`. Today only the default resolver answers a step, and it only saves the prompt for a subagent. In a plain terminal, with no T3 Code, Mo cannot get a step from another model family. The `cli` resolver already runs reviews headless through `codex`, `claude` and `agy`, and ADR-016 has settled the contract it extends: one method per kind of session. This change adds that method, so each resolver changes once.

## What Changes

- The `cli` resolver gains a `step` method, and nothing else in its contract changes (D1).
- A step runs the CLI of the `--model` family as a child process, in the mode that lets it write files and run commands without a prompt: `codex exec --dangerously-bypass-approvals-and-sandbox`, `claude -p --permission-mode bypassPermissions`, or `agy --mode accept-edits --dangerously-skip-permissions` with the prompt as the argument of `-p` (D2). `lets` adds no sandbox of its own (D3).
- The prompt, the final message, the model, the effort, the time limit, the handle and the environment follow the review's path (D4, D6, D7, D8, D11). The session's final message is what `lets delegate step run` reads the step report from (D4).
- The adapter throws the same errors as for a review, so a step through `cli` gives the exit codes the `delegate-step` spec fixes: 3 for a refusal, 6 for a timeout, and a `failed` report at exit 0 for a session that fails after it prints (D5).
- `cli` answers a step, and `step instructions`, wherever one family CLI is on `PATH`, as it does for a review. The requirement that `cli` declines every step is removed (D9).
- `docs/resolvers.md` and the README's resolver table say that `cli` runs steps, in which mode, and with what rights (D3, D13).

No breaking change. `review` and `handoff` through `cli` are unchanged, and `cli` still declines every handoff (D14).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: `cli` runs a step headless in each family's write mode and returns its final message; it lists its models and declines by the rule it has for a review; its exit codes and cleanup for a step follow the review's; the requirement "The cli resolver declines every step" is removed.

## Impact

- `lets/src/resolvers/cli/cli.ts`: the `step` method, and the command builder shared with `run` (D10). No other source file changes: `lets/src/delegate/step.ts` already calls `adapter.step`, and `lets/src/resolvers/kit/adapter.ts` already declares it.
- `tests/lets/resolvers/cli/cli.test.ts` and `tests/lets/resolvers/cli/delegate.test.ts`: the step command lines, and `step run` through the real adapter on fake CLIs (D12). The two tests that pin "declines every step" are replaced.
- `docs/resolvers.md`, `README.md`.
- No new dependency. The `t3` resolver (#155) and the `lets-go` skill are untouched.
