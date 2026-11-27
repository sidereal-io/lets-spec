## Why

When no fresh session can run a step, `lets delegate step run` exits 3
and lets-go runs the step in a subagent. lets-go must then read the
subagent's step report by hand. `skills/lets-go/references/subagent.md`
writes out in prose the same rules that `lets/src/delegate/report.ts`
already applies to a session's report, so the two can drift, and an agent
can read a report differently from `lets`. This is the last *Could* of
epic #263, which moves each fixed algorithm out of the skill and into the
command that owns it.

## What Changes

- **New command `lets delegate step read --message-file <path>`** (D1,
  D2). It reads a subagent's final message from a file and prints the
  step report as one JSON line, exactly as `lets delegate step run`
  prints it. It uses the same parser and rules: the last `step-report`
  block, the three outcomes, `ask: true` kept and `ask: false` dropped,
  `date` on a `done` report, and a `failed` report with a `reason` and
  the `message` when the final message holds no valid report (D4).
- **Its exit codes** (D5). Exit 0 means a report is on stdout, whatever
  its outcome. A usage error, such as no `--message-file` or a file that
  cannot be read, is exit 2 with nothing on stdout.
- **`lets` points to it at exit 3** (D3). The default's stderr line and
  the exit 3 entry of `lets delegate step run --help` name
  `lets delegate step read`.
- **lets-go runs the command** (D2, D6). In
  `skills/lets-go/references/subagent.md`, steps 2 to 5 become one
  command, whose stdout lets-go saves to
  `.workspace/lets-go/<session>-report.json`. The file keeps only how to
  run the subagent. In an epic run's walk, the command runs from the
  story's worktree, like every other walk command (D7).
- **The lets-go requirement checks behaviour** (D9). *Exit 3 runs the
  step in a subagent* says what a run does, and drops its copy of the
  report rules, which `delegate-step` already holds.
- **The glossary's *Step report* entry** names both commands, with its
  copy in `skills/lets-go/references/terms.md`. Its meaning does not
  change (D10).
- The pull request records `wc -l` for `skills/lets-go/SKILL.md` and for
  the whole skill, before and after (D11).

Not changed: what a run does for the user (its steps, stops, questions
and printed lines), the resolvers, when exit 3 happens, and the review
skills' subagent paths (D8).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-step`: adds `lets delegate step read`, which prints the step
  report from a final message by the rules `step run` uses, and its exit
  codes. The help text of `step run` names `step read` at exit 3.
- `delegate-default`: the stderr line of the default's step refusal
  names `lets delegate step read` as well as the saved prompt.
- `lets-go`: *Exit 3 runs the step in a subagent* says that lets-go runs
  `lets delegate step read` on the subagent's final message and saves
  its stdout as the report, in place of the rules it lists today.

## Impact

- **Code:** `lets/src/main.ts` (the new subcommand, its help, and the
  `step run` help), a new `lets/src/delegate/read.ts` or similar that
  calls `readReport` in `lets/src/delegate/report.ts`, and the default's
  refusal text in `lets/src/resolvers/subagent/subagent.ts`.
- **Skills:** `skills/lets-go/references/subagent.md`, and
  `skills/lets-go/references/terms.md` for the glossary copy.
- **Docs:** `openspec/glossary.md`.
- **Tests:** new tests for `step read` under `tests/delegate/` and
  `tests/lets/delegate/`; updated tests for the default's stderr line and
  the `step run` help text. The contract tests in `tests/contracts/`
  check that the skill names only commands and flags `lets` has.
- **Users:** none visible. A run looks the same; only the place that
  reads the subagent's report moves.
