## Story

#156 step-on-cli — the cli resolver runs a step headless with write access, and returns its report. https://github.com/sidereal-io/lets-spec/issues/156

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does this story add? | One method, `step`, on the `cli` adapter, as ADR-016 fixes the contract. `detect`, `options`, `run` and `finish` keep their behaviour, and no `lets delegate` command changes. | Evidence: `docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md`; `lets/src/resolvers/kit/adapter.ts` |
| D2 | In which mode does each CLI run a step? | The mode in which the CLI runs every command a step needs and never prompts. That is `codex exec --dangerously-bypass-approvals-and-sandbox` for `gpt`, `claude -p --permission-mode bypassPermissions` for `claude`, and `agy --mode accept-edits --dangerously-skip-permissions` for `gemini`. An edits-only mode is not enough. A step commits, pushes and runs `gh`. Headless `claude -p` denies every command that would prompt. Codex's `workspace-write` sandbox blocks the network and keeps `.git/` read-only. | Assumption |
| D3 | Does `lets` limit what a step may touch outside the repository? | No. A step through `cli` runs with the user's own rights, as a subagent would. The user opts in by listing `cli` in `delegate.resolvers`, and the docs say so. | Assumption |
| D4 | How does the step hand back its report? | As a review hands back its findings. The prompt goes the same way: codex on stdin, claude on stdin, agy as the argument of `-p`. Codex writes its last message to `.workspace/lets-delegate/<name>.last-message.md`; claude and agy print it on stdout. `cli` returns that text, and `lets delegate step run` reads the `step-report` block from it. | Evidence: `lets/src/resolvers/cli/cli.ts`; `lets/src/delegate/step.ts` |
| D5 | Which exit codes does a step through `cli` give? | The adapter throws what it throws for a review: `Refused` when the CLI cannot start or exits non-zero having printed nothing, `SessionFailed` when it prints and then exits non-zero, `TimeoutError` past the limit. `step run` maps them to 3, a `failed` report at exit 0, and 6. An empty final message is a `failed` report at exit 0: it holds no `step-report` block. | Evidence: `openspec/specs/delegate-step/spec.md`; `lets/src/delegate/step.ts` |
| D6 | Which model and effort does the step pass? | The same as a review: the model part of `--model` unchanged with `-m` or `--model`, no model for a bare family, the effort with `-c model_reasoning_effort` or `--effort`, and the effort added to a gemini model as `<model>-<effort>`. | Evidence: `lets/src/resolvers/cli/cli.ts`; `openspec/specs/delegate-resolvers/spec.md` |
| D7 | How long may a step run, and how does each CLI learn it? | `step run` gives the limit: 120 minutes, or `--timeout-minutes`. `cli` stops the process at that limit, and gives agy the same limit as `--print-timeout`, as for a review. | Evidence: `openspec/specs/delegate-step/spec.md`; `lets/src/resolvers/cli/cli.ts` |
| D8 | What is the handle, and what does finishing do? | The handle is `process <name>`, as for a review. Finishing with ok removes `<name>.last-message.md`. A step that needs input or failed is finished without ok, so the file stays for a person to read. | Evidence: `lets/src/resolvers/cli/cli.ts`; `openspec/specs/delegate-step/spec.md` |
| D9 | When does `cli` decline a step, and what does `step instructions` list? | `cli` answers a step wherever at least one of `codex`, `claude` or `agy` is on `PATH`, and declines otherwise: the rule it has for a review. `step instructions` lists the same options as `review instructions`. The requirement that `cli` declines every step goes. | Evidence: `openspec/specs/delegate-resolvers/spec.md`; `lets/src/delegate/lookup.ts` |
| D10 | Do `run` and `step` share code? | Yes. One private function builds the command for both, with a switch between the read-only mode and the write mode. The contract does not see it. | Evidence: `docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md` |
| D11 | Does the step's process get the session markers? | No. It gets the same scrubbed environment as a review's process, so a step that runs `lets delegate` itself is not taken for a child session. | Evidence: `lets/src/resolvers/kit/env.ts`; `lets/src/resolvers/cli/cli.ts` |
| D12 | How is it tested? | Unit tests pin each family's step command line in `tests/lets/resolvers/cli/cli.test.ts`. `tests/lets/resolvers/cli/delegate.test.ts` drives `lets delegate step run` through the real `cli` adapter on the kit's fake io, whose fake CLIs answer with a `step-report`, refuse, fail, or run too long. No test runs a real CLI. | Evidence: #156 packet; `tests/lets/resolvers/cli/` |
| D13 | Which docs change? | `docs/resolvers.md`: the resolver table's step column for `cli`, the `cli` section's text, and a table of how a step runs beside the review's. The README's resolver table. | Evidence: #156 packet; `tests/skill-interfaces.bats` |
| D14 | What stays out? | An interactive session: `cli` still has no `start` and declines every handoff. The `t3` resolver: that is #155. | Evidence: #156 packet |

## Changes from the story

None.

Confirmed by user: yes
