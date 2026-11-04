## Context

`lets/src/resolvers/cli/cli.ts` is one adapter. Its `runCommand` builds the read-only command for a family: `codex exec -s read-only`, `claude -p --permission-mode plan`, or `agy --mode plan`, each with the effort, the model, and where the final message comes from. `run` makes the scratch folder, removes a stale last-message file, and runs the command through `io.execFile` with the scrubbed environment. Then it maps the result: a start failure or a silent non-zero exit to `Refused`, a non-zero exit after output to `SessionFailed`, a timeout to `TimeoutError`. `finish` removes the last-message file on ok. The adapter has no `start` and no `step`, so `pick` skips it for handoffs and steps.

`lets/src/delegate/step.ts` already calls `adapter.step` with a `StepInput`, which is a `RunInput`, and a `timeoutMs` of 120 minutes by default. It maps `SessionFailed` to a `failed` report at exit 0 with no handle, reads the report from the text it gets, and finishes with ok only on `done`. `Refused`, `TimeoutError` and `SpawnError` keep their exit codes. Nothing in `step.ts`, `lookup.ts` or the kit needs to change.

The three CLIs on this machine offer these headless modes. `codex exec` takes `-s read-only|workspace-write|danger-full-access`, `--approve-for-me` and `--dangerously-bypass-approvals-and-sandbox`. `claude -p` takes `--permission-mode` with `plan`, `acceptEdits`, `auto`, `bypassPermissions`, `manual` and `dontAsk`, and denies anything that would prompt when nobody answers prompts. `agy -p` takes `--mode plan|accept-edits|auto` and `--dangerously-skip-permissions`.

Tests drive the adapter two ways. `tests/lets/resolvers/cli/cli.test.ts` pins `runCommand`'s output and the adapter's `options` and `run` on `fakeIo`. `tests/lets/resolvers/cli/delegate.test.ts` runs each command through `commandDeps` with the real adapter on `fakeIo`. There, `commands` says which CLIs are on `PATH`, and `results` scripts what each child process does. Two of those tests pin that `cli` declines steps.

## Goals / Non-Goals

**Goals:**
- Add `step` to the `cli` adapter with one shared command builder, so `run` and `step` differ only in the mode flags (D10).
- Keep every existing review test green, apart from the two that pin the old decline.
- Make each family's write mode one visible table in the code and in the docs.

**Non-Goals:**
- A sandbox or an allow-list of commands inside `lets` (D3).
- Reading the step's report in the adapter: `step.ts` owns that.
- Any change to `t3`, `subagent`, the kit, or the `lets delegate` commands.

## Test Seams

- **Primary test seam:** `lets delegate step run` through `run(options, deps)` of `lets/src/delegate/step.ts`, with `commandDeps` and the real `cli` adapter on `fakeIo`, in `tests/lets/resolvers/cli/delegate.test.ts`. The fake CLIs are `fakeIo`'s `commands` and `results`: a scripted child writes a last-message file or prints on stdout, exits non-zero, cannot start, or times out. This is where the spec's scenarios are asserted end to end: the arguments, the report on stdout, the record on stderr, the exit code and the files left behind.
- **Existing seams reused:** `tests/lets/resolvers/cli/cli.test.ts` for the exact argument list each family gets in write mode, as it already does for read-only mode. `tests/skill-interfaces.bats` for the docs' command names and the README's links.

## Scrutiny Tier & Blast Radius

- **Tier:** high. The code change is small and follows the adapter's own pattern, but it crosses a trust boundary: a step runs a CLI with no sandbox and no prompt, with the user's own rights, on the user's machine.
- **Blast radius:** `lets/src/resolvers/cli/cli.ts`, its two test files, `docs/resolvers.md` and the README's resolver table. No data store, no config shape, no other resolver.

## Decisions

### D-1. One builder with a mode, and one private runner behind `run` and `step`

`runCommand` gains a `mode: 'read-only' | 'write'` field. In `read-only` it returns the commands it returns today. In `write` it returns `codex exec --dangerously-bypass-approvals-and-sandbox …` with no `-s`, `claude -p --permission-mode bypassPermissions …`, and `agy --mode accept-edits --dangerously-skip-permissions …`. Everything else stays: the effort, the model, `-o` for codex, `--print-timeout` for agy, the prompt on stdin or as `-p`'s argument. The body of today's `run` becomes a private `execute(input, { timeoutMs }, mode)`. `run` calls it with `read-only` and `step` with `write`. ADR-016 allows exactly this: the contract sees two methods, the adapter shares one function.

Alternatives: a second builder `stepCommand` that copies `runCommand`. Rejected: six command lines to keep in step, where the three pairs differ by one or two flags.

### D-2. The write mode is the one that never prompts

A step is `lets-build` or `lets-shape` in a session: it commits, pushes, runs `gh`, and runs the project's checks. Headless, a CLI cannot ask, so any mode that would prompt either fails the command or denies it. For `claude -p`, `acceptEdits` auto-approves edits but every Bash command would prompt, and with nobody to answer it is denied, so `git commit` fails. For codex, `workspace-write` blocks the network, so `git push` and `gh` fail, and keeps the `.git/` folder read-only, so `git commit` fails too. `--approve-for-me` routes each escalation through codex's automatic reviewer, whose verdicts differ by version and are not something a test can pin. For agy, `accept-edits` names the mode that writes files, and `--dangerously-skip-permissions` approves the commands; `auto` is documented only by its name.

So the write mode is the bypass mode of each CLI (D2). Some CLIs refuse to start in that mode, for example `claude` under a managed setting that disables bypass, or as root. Such a CLI exits non-zero with nothing printed, which is already a refusal. The command tries the next `--model`, and exits 3 when none is left. The docs say plainly that a step through `cli` runs with the user's rights, and that listing `cli` in `delegate.resolvers` is the opt-in (D3). This is the one decision in this change a reviewer should weigh. It is not costly to reverse: three flags in one table, and the tests that pin them.

### D-3. Errors map as the review's do, and the empty message is left to the report reader

`execute` throws the same classes in the same cases. `step.ts` already turns `SessionFailed` into a `failed` report at exit 0 with `handle: null`, and `Refused` and `TimeoutError` into exits 3 and 6. An empty final message needs no new check: `readReport('')` returns a `failed` report whose reason names `step-report`. So the `failed: exit N: <stderr>` message that `review run` prints on stderr at exit 5 is, for a step, the report's `reason`.

Alternative: throw a `SessionFailed` for an empty message, as `review.ts` does. Rejected: it would put the same case on two paths with two reasons, and ADR-014 wants one place to read a failure.

The `printed` test stays the review's: output on stdout or in the last-message file means the model ran, so a non-zero exit after it is a failed session, not a refusal. The plan review asked whether codex should count only its last-message file, since codex also prints progress on stdout. No: the `delegate-resolvers` spec pins that a CLI which prints and then exits non-zero is exit 5 for a review, the shared function serves both, and #156 asks for the review's exit codes. An empty final message at exit 0 drops the CLI's stderr, for a step as for a review today. The caller still sees `failed` with a reason, and the CLI's own log when it keeps one.

### D-4. The step's files are the review's files

The last-message file for codex is `.workspace/lets-delegate/<name>.last-message.md`, removed before the run so a stale one cannot hide a refusal, and removed by `finish` on ok. `step.ts` finishes with ok only on `done`, so a `needs-input` or `failed` step keeps the file. No new file, no new handle kind: `{ kind: 'process', id: <name> }`.

### D-5. The docs show a step beside a review

`docs/resolvers.md`'s `cli` section gets a "How a step runs" table with the three commands, one sentence on what the step may do and that this is the user's opt-in, and the resolver table's step column says "A child process of that CLI, in its write mode". The README's table changes the same cell. `tests/skill-interfaces.bats` already accepts `lets delegate step` in prose.

## Risks / Trade-offs

- [A CLI renames or drops its bypass flag in a later version] → the CLI exits non-zero before any output, which is a refusal with the CLI's stderr on `lets`'s stderr; the smoke check in `docs/resolvers.md` can be run after a CLI update, as it is for `t3`.
- [A step through `cli` can run any command the user can] → the docs say so where `cli` is described and where the config lists it; a user who wants steps elsewhere lists `cli` after that resolver or leaves it out; reviews are untouched and stay read-only.
- [agy's `accept-edits` with `--dangerously-skip-permissions` still prompts for something headless] → the step ends as a failed session or a timeout, both visible to the caller with agy's stderr; the mode is one cell in the table to change.
- [A step and a review with the same `--name` share one last-message path] → the names come from `lets-go`, which suffixes the step, and the stale file is removed before each run.
- [A step's final message is long, and claude or agy print it on stdout] → `execFile` already allows 64 MiB.
- [The time limit kills only the CLI's own process, and a child it started, such as a hung `nix flake check`, lives on with write access] → the kit's `execFile` has done this for reviews since it was written, and a CLI with its write mode starts more children. The fix is to kill the process group in `lets/src/resolvers/kit/io.ts`, which serves every resolver and is outside this story. Until then, agy stops itself through `--print-timeout`, and the caller sees exit 6 and can inspect the tree.

## Migration & Rollback

N/A. No config, file or protocol changes shape. Reverting the change restores the decline.
