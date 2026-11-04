## Context

`lets delegate` has two strategies, each one module: `review.ts` runs a read-only session through `adapter.run`, waits, checks the tree and prints the final message; `handoff.ts` starts an interactive session through `adapter.start` and returns at once. `strategies.ts` maps each strategy to its intents and to the kind of session it asks for, a `Kind` of `run` or `start`. `lookup.ts`'s `pick` skips an adapter without `start` when the kind is `start`. `instructions.ts` is shared by both strategies and reads `delegate.<strategy>.<intent>.guidance` through `config.ts`'s `guidanceFor`. `main.ts` builds each strategy's commands with `strategyCommand` and adds the `run` subcommand by hand.

The adapter contract lives in `lets/src/resolvers/kit/adapter.ts`. `subagent` is the default adapter: `run` throws `Refused`, `start` saves the prompt under `.workspace/lets-delegate/` and hands it back. `t3` and `cli` implement `run` and, for `t3`, `start`. Neither may change in this change (#155, #156 do that).

Tests drive each command through `run(options, deps)` with `commandDeps`, whose fake adapters record every call. The real `subagent` adapter runs on a fake io. `cli.test.ts` runs the real entry for help text and usage errors. `tests/skill-interfaces.bats` greps the docs and skills for `lets delegate (review|handoff)` followed by `instructions` or `run`.

`yaml` is already a dependency, for the config. The glossary defines *step*, *step report* and *interactivity level*.

## Goals / Non-Goals

**Goals:**
- One new module per concern: `step.ts` for the command, `report.ts` for reading a report and composing the answers section.
- The report shape is defined once, in `report.ts`, and tested on its own.
- `review` and `handoff` keep their code paths. Shared helpers move only when both strategies already use them.
- `t3` and `cli` compile unchanged and decline every step.

**Non-Goals:**
- Running a step in `t3` or `cli`.
- Any `lets-go` skill text, or a relay of questions to the user.
- Reading or setting the interactivity level in `lets`.
- Folding `review` or `handoff` into `step`.

## Test Seams

- **Primary test seam:** the command seam: `run(options, deps)` of `lets/src/delegate/step.ts` through `commandDeps`, in a new `tests/lets/delegate/step.test.ts`. The fake adapter gains a `step` behaviour and a `steps: false` switch, so a test can say which resolvers run steps.
- **Existing seams reused:** `tests/lets/delegate/strategies.test.ts`, `config.test.ts` and `instructions.test.ts` for the strategy table, the config key and the probe; `tests/lets/resolvers/subagent/subagent.test.ts` on the fake io for the default's step; `tests/lets/delegate/cli.test.ts` for help text and usage errors through the real entry; `tests/skill-interfaces.bats` for the docs. `report.ts` gets its own unit test, `tests/lets/delegate/report.test.ts`, for parsing and the answers section.

## Scrutiny Tier & Blast Radius

- **Tier:** high. The step report is a new contract that `lets-go` and both resolver changes bind to.
- **Blast radius:** `lets/src/delegate/`, `lets/src/main.ts`, the adapter type in `lets/src/resolvers/kit/adapter.ts`, the `subagent` adapter, the test fakes, `docs/resolvers.md` and the README. No data store, no release layout change.

## Decisions

### D-1. A third `Kind`, `step`, and an optional `step` method on the adapter

Add `'step'` to `Kind` and `STRATEGIES.step = { intents: [...five steps], verb: 'step' }`. `Adapter` gains `step?(input: StepInput, options: { timeoutMs }): Promise<{ handle; text }>`, where `StepInput` is `RunInput`: the same fields serve. `pick` skips an adapter without `step` when the kind is `step`, as it does for `start`.

Alternatives: a flag on `run` such as `{ readOnly: false }`. Rejected: `t3` and `cli` would then have to answer a write-capable run today, and the spec gives them no way to decline it. A separate method makes "declines every step" fall out of the existing lookup rule.

### D-2. The report travels in the final message as a fenced `step-report` YAML block

`report.ts` exports `readReport(text): Report`, which finds the last fenced block tagged `step-report`, parses it with `yaml`, and checks the fields for its outcome. A block opens with a line of three or more backticks and `step-report`, and closes with a line of at least as many backticks and nothing else, the CommonMark rule, so a three-backtick quote inside a four-backtick block does not end it. Text after the last block is ignored. Every failure of that check returns `{ outcome: 'failed', reason, message: text }` rather than throwing. The success path returns the typed report. The date on a `done` report is stamped by the command from `io.now()`, so the session never has to know the time.

Alternatives: a report file in `.workspace/`, which fails across harnesses that run elsewhere and leaves a stale file to confuse the next run; JSON instead of YAML, which is harder for a model to write with multi-line questions. This decision is recorded as an ADR: every later story binds to it.

### D-3. Exit 0 means a report; the report says how the step went

`step.ts` maps `SessionFailed` from the adapter to a `failed` report at exit 0, and an unreadable report to a `failed` report at exit 0. `SessionFailed` carries no handle, as `Adapter.run` throws it today, so on that path `step.ts` calls no `finish` and writes `"handle":null` in the stderr record. The adapter keeps its own session, as `t3` keeps a thread whose run failed. `Refused`, `SpawnError`, `TimeoutError` and `UsageError` keep their exit codes through `guarded`. Exit 5 and 7 do not exist for a step. Part of the same ADR.

Alternative: keep review's exit 5 for a failed session. Rejected: a caller would then read failures in two places, stderr and the report.

### D-4. `--answers-file` composes the prompt in `lets`

`report.ts` exports `readAnswers(text, path): Answer[]` and `withAnswers(prompt, answers): string`. The appended section is fixed text: a heading `## Answers`, one line saying these questions from the last step report are settled and must not be asked again, then one list item per pair: `- Q: <question>` and `  A: <answer>`, with every further line of a question or answer indented by two spaces, so a multi-line answer stays inside its item and a line starting `- Q:` inside an answer cannot pass as a new pair. `step.ts` reads the file through `io.readFile` relative to `cwd`, as `readPromptFile` does, and throws `UsageError` naming `--answers-file` when it is missing, not a non-empty list, or a pair lacks a `question` or `answer` with text other than white space.

Alternative: the caller appends the answers itself. Rejected: on exit 3 the subagent fallback would need the composed prompt too, so two writers would own one format.

### D-5. The default saves the composed prompt, then refuses

`subagent.step` writes the prompt to `.workspace/lets-delegate/<name>.prompt.md`, as `start` does, then throws `Refused` with a message that names the file and says to run the step in a subagent. The command exits 3 through `withModels`, with the usual `<model>: <reason>` line per model, so the path appears on stderr. `withModels` asks the subagent once per `--model`, so the file is written once per model with the same content, and the path appears on each refusal line. That is idempotent and reads fine. A write that fails becomes exit 4 through `inAdapter`, as a failed write in `subagent.start` does today. The subagent's `options` stay `[]`.

Alternative: exit 0 with `handle: null` and instructions, as `handoff` does. Rejected: the packet says exit 3, and a report of `done` or `needs-input` from the subagent must come from the caller, not from `lets`.

### D-6. Finish with ok only on `done`

A `needs-input` or `failed` session is handed back without ok, so `t3` keeps the thread and `cli` keeps its files, once they run steps. The failure-to-finish path copies `review.ts`'s `finishSession`, which moves to a shared helper in `lookup.ts` or a new `session.ts` only if the duplicate is exact.

### D-7. `instructions` and the config key follow the existing pattern

`Config.delegate` gains `step?: unknown`, `parseConfig` copies it, `guidanceFor` already takes any `Strategy` and `Intent`, so `delegate.step.<step>.guidance` works once the types widen. `Intent` becomes the union of the eight values. `main.ts` adds `strategyCommand('step', ...)` with its own `run` subcommand, a `STEP_HELP` text, and a 120-minute default for `--timeout-minutes`.

### D-8. The stderr record is the review's line without `independent` and `gitClean`

`{"for","resolver","family","model","handle","durationSeconds"}`, in that order.

## Risks / Trade-offs

- [A model writes the block with a different fence tag or no closing fence] → the result is a `failed` report whose reason names `step-report`, and whose `message` keeps the text, so the caller can see and retry. The docs show the exact block.
- [A `failed` report's `message` can be long on one JSON line] → a caller pipes it to a file as the review skills already do; the report is still one line.
- [The `Intent` union widens, and `Strategy`-specific option types in `main.ts` get looser] → `forOption(strategy)` already restricts `--for` per strategy at the command line, and `strategies.test.ts` pins each table row.
- [The bats regex for `lets delegate (review|handoff)` misses `step` in the docs] → the regex grows to `(review|handoff|step)` in the same task that updates the docs.
- [A session mentions a `step-report` block in its prose, then stops before writing its own] → the last block wins, so the quoted one is read as the report. The docs tell a step to write its report last and to quote none; a wrong report is visible in its `evidence` or `reason`, and the caller retries.
- [`withAnswers` text drifts from what the subagent fallback expects] → one function composes it, and both the resolver path and the saved file come from that function.

## Migration & Rollback

N/A. No config version change: `delegate.step` is a new optional key that an older `lets` ignores. Reverting the change removes the command and the key.

## Open Questions

None.
