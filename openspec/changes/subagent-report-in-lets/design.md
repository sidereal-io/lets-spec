## Context

- `lets/src/delegate/report.ts` holds `readReport(text)`, which finds the
  last `step-report` block and checks it. It returns a `failed` report
  with `reason` and `message` when the text holds no valid report.
- `lets/src/delegate/step.ts` calls `readReport` on the session's final
  message, then adds `date` to a `done` report with its private
  `isoSeconds(io.now())`, and prints the result as one JSON line. That
  last part, the date and the print, is the only piece of the report
  path that `report.ts` does not already own.
- `lets/src/main.ts` defines the `lets delegate step` family with
  Commander: `instructions`, `run`, `start` and `wait`, each with a help
  constant such as `STEP_HELP`. A missing required option is a
  `CommanderError`, which `main.ts` turns into exit 2.
- The default resolver, `lets/src/resolvers/subagent/subagent.ts`,
  refuses a step with the message `no resolver started a session here,
  so no fresh session can run. Run the step in a subagent with the prompt
  saved in <path>.` The tests match it with
  `/no resolver.*subagent.*\.workspace\/lets-delegate\/<name>\.prompt\.md/`.
- `skills/lets-go/references/subagent.md` has five steps. Step 1 runs
  the subagent; steps 2 to 5 restate the parser, add the date with
  `date -u` and write the JSON line by hand.
- Two contract tests constrain the order of work.
  `tests/contracts/commands.test.ts` fails when a skill names a `lets`
  command that `lets --help` does not list. `tests/contracts/terms.test.ts`
  fails when `skills/lets-go/references/terms.md` does not copy a
  glossary entry word for word. So the skill text and the glossary can
  only name `lets delegate step read` once the command exists.

## Goals / Non-Goals

**Goals:**

- `step run` and `step read` print the same line for the same final
  message, from one function, so they cannot drift.
- `step read` runs wherever `step run` exited 3: no config, no resolver,
  no Git repository needed.
- lets-go's subagent path becomes "run the subagent, save its message,
  run one command".

**Non-Goals:**

- No change to the review skills' subagent paths (D8).
- No record line on stderr for `step read`: no session ran, so there is
  no resolver, model, handle or duration to record.
- No skill-text test for `subagent.md`. Epic #263 asks for behaviour
  tests, not wording tests. The commands contract test already proves
  that the command and flag the skill names exist.

## Test Seams

- **Primary test seam:** `lets` run as a program, in
  `tests/delegate/` (the pattern of `tests/delegate/step.test.ts`). A new
  `tests/delegate/read.test.ts` writes a message file, runs
  `lets delegate step read --message-file`, and checks the exit code,
  stdout and stderr. It covers every scenario of the two new
  `delegate-step` requirements, with `assertClockDate` for the date.
- **Existing seams reused:**
  - `tests/journey/journeys.test.ts` for the join lets-go relies on:
    `step run` with no config exits 3 and names the saved prompt and
    `step read`; a message file then goes through `step read`, and its
    stdout is the report. This also checks the scenario *The same report
    as step run* at the level that matters to lets-go.
  - `tests/lets/delegate/cli.test.ts` for the help texts of `step read`
    and `step run`.
  - `tests/lets/resolvers/subagent/subagent.test.ts` and
    `tests/delegate/step.test.ts` for the default's refusal text.
  - `tests/contracts/` runs unchanged and checks the skill and glossary
    edits.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** one new `lets delegate step` subcommand that only
  reads a file and prints; two help or error strings; one reference file
  of `lets-go`; one glossary entry and its copy. No resolver, config or
  backlog code changes.

## Decisions

### D-1. One function prints a step report for both commands

Move the date and the JSON print out of `step.ts` into `report.ts`, as
an exported function such as `printedReport(report, now)` that returns
the line to print. `step run` and `step read` both call it after
`readReport`.

- *Alternative:* `step read` adds the date with its own code. Rejected:
  the line the two print would be written twice, the drift this story
  removes from the skill.
- *Alternative:* `step read` calls into `step.ts`. Rejected: `step.ts`
  is the session path; `report.ts` already owns the report's shape.

### D-2. The command lives in its own module

A new `lets/src/delegate/read.ts` exports `read({ messageFile }, deps)`.
It runs under `guarded`, like every other delegate command, so a
`UsageError` becomes exit 2 with one line on stderr. It reads the file
with `deps.io.readFile(resolve(deps.cwd, messageFile))`. A `null` result
throws `UsageError('cannot read --message-file <path>')`, the same form
`readAnswersFile` uses. It calls neither `readConfig` nor `repoRoot`, so
a broken config or a folder outside Git does not stop it.

An empty file is readable: it gives the `failed` report for a final
message with no `step-report` block, as `step run` does.

### D-3. Commander handles the missing option

`--message-file <path>` is a `requiredOption`. Commander then prints
`required option '--message-file <path>' not specified`, which names
the flag, and `main.ts` exits 2. No code of ours is needed for it.

### D-4. The pointers at exit 3 (D3)

- The default's refusal text gains one sentence after the saved prompt's
  path: `Then run lets delegate step read --message-file <file> on its
  final message.` The existing regexes still match, because the new text
  comes after the path.
- The exit 3 entry of `STEP_HELP` gains: when no resolver started a
  session, run the saved prompt in a subagent, and
  `lets delegate step read` reads its step report.
- A new `STEP_READ_HELP` says what `step read` reads, that it prints the
  report by the rules `lets delegate step run` uses, and lists exit 0
  and 2.

### D-5. lets-go saves the message with its file tool

`subagent.md` tells the agent to write the subagent's final message,
unchanged, to `.workspace/lets-go/<session>-message.md` with its file
writing tool, not with a shell heredoc or `echo`. Then it runs:

```bash
lets delegate step read --message-file .workspace/lets-go/<session>-message.md \
  > .workspace/lets-go/<session>-report.json
```

At exit 0 the report file is read as *Read the report* reads one from
`step run`. At any other code, the agent shows stderr, names the step
and stops. The epic-run walk text in `epic-run.md` already says every
walk command runs from `<path>`, so it needs no change (D7).

### D-6. The glossary edit lands with the skill edit

The *Step report* entry in `openspec/glossary.md` and its copy in
`skills/lets-go/references/terms.md` change in the same commit, after
the command exists (D10). The brainstorm first wrote the glossary edit
alone, and `terms.test.ts` failed; that commit was reverted.

No ADR: these choices follow ADR-022's step strategy and add no new
contract beyond the spec.

## Risks / Trade-offs

- [An agent pastes the message into a shell command, and quotes or
  backticks break it] → `subagent.md` says to use the file tool, and
  `step read` takes only a path.
- [The subagent's message is long, and the agent trims it before saving]
  → `subagent.md` says to save it unchanged. `step read` reads only the
  last block, so text before it does no harm.
- [`step read` prints a date later than the subagent finished] → The
  date is when `lets` printed the report, as for `step run`. The gap is
  seconds.

## Migration & Rollback

N/A. The command is new, and nothing reads the old prose. To roll back,
revert the pull request: lets-go goes back to parsing the report by
hand.
