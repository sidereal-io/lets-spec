## Context

- `tests/delegate/repo.ts`, from #318, makes the setup for one test: a
  user config home, a Git repository with one commit, `p.md` holding
  `PROMPT` (quotes and a newline), an optional `.lets/config.yaml`, and
  a stand-ins folder. Its `run` calls `runLets` with
  `onlyStandIns: true`, so `PATH` holds only the stand-ins and `git`.
- A stand-in row in `tests/support/lets.ts` matches a call by its exact
  arguments. It can print, exit with a code, write `files`, make a
  `commit`, or `hang`. A hanging stand-in ends at a signal, or by itself
  after 120 seconds. Each call logs its arguments, the variables
  `logEnv` names, its stdin and its folder, before it answers.
- `step run` checks `--model` in the option parser, reads the config,
  the prompt file and the answers file, finds the repository root, and
  asks the first resolver that does not decline. It runs the session in
  the root, reads the step report from the final message, finishes the
  session with `ok` only for a done report, prints the report, then the
  record line. With the hidden `--exit-file`, it writes
  `{"exit":<code>,"endedAt":<ms>}` last (`lets/src/delegate/step.ts`).
- The `cli` resolver runs a step in the CLI's write mode:
  `codex exec --dangerously-bypass-approvals-and-sandbox …`,
  `claude -p --permission-mode bypassPermissions …`, and
  `agy --mode accept-edits --dangerously-skip-permissions …`. `agy`
  gets the time limit as `--print-timeout <n>m`, so its arguments show
  the time limit `lets` chose. `subagent` saves the composed prompt in
  `.workspace/lets-delegate/<name>.prompt.md` and refuses, so a step is
  exit 3.
- `step start` runs `lets delegate step run` as a detached process,
  with the report file and meta file as its stdout and stderr, in the
  root of `--checkout`. It writes the run record
  `.workspace/lets-delegate/<name>.run.json` and prints
  `{"name","pid"}`. `step wait` polls the run files every 2 seconds
  (`lets/src/delegate/background.ts`).
- While a CLI runs, `lets` passes SIGINT, SIGTERM and SIGHUP on to the
  CLI's process group, then ends by the same signal
  (`lets/src/resolvers/kit/io.ts`). So SIGTERM to a background step
  ends its stand-in too, and leaves no exit file: to `step wait`, that
  step was killed.
- Commander rejects a missing required option or a bad `--model` before
  the command starts, with exit 2 and a line that starts `error:`, not
  `lets delegate: ` (#318's deviation ledger).
- Node runs test files in parallel. Tests inside one file run one at a
  time, unless a `describe` sets `concurrency`.

## Goals / Non-Goals

**Goals:**

- Every behavior a deleted test checks has a black-box test that passes
  before the deleted test goes.
- No test leaves a background process behind, even when it fails.
- No test waits on a fixed sleep: a test that needs a step to be
  running waits until the stand-in has logged its call.
- No result depends on which real CLIs the developer has installed:
  every new test runs with `onlyStandIns: true`.

**Non-Goals:**

- Any change to `lets` (D4), the T3 tests (D3) or `report.test.ts` (D5).
- Any new stand-in ability. The rows #318 added are enough.
- Moving `tests/delegate/run.test.ts` onto this story's helpers.

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program through
  `delegateRepo(t).run`, in a temporary Git repository, with stand-ins
  on `PATH` and a real lets config. For `step start` and `step wait`,
  the files the commands share are part of the seam: the run record,
  the report file, the meta file and the exit file.
- **Existing seams reused:** `tests/support/lets.ts` and
  `tests/delegate/repo.ts`. The fake-adapter seam in
  `tests/lets/delegate/fixtures/command-deps.ts` stays only for the one
  kept test of D9.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. It is test code on #318's pattern, but it adds
  tests of real background processes, which can leak or race, and it
  deletes about 85 tests.
- **Blast radius:** new files in `tests/delegate/`; deletions in
  `tests/lets/delegate/` and `tests/lets/resolvers/cli/`; unused parts
  of `tests/lets/delegate/fixtures/`; one README row. No file under
  `lets/` changes.

## Decisions

### 1. Three test files and one helper module

- `tests/delegate/step.test.ts`: `describe('step run')`.
- `tests/delegate/background.test.ts`: `describe('step start')` and
  `describe('step wait')`.
- `tests/delegate/step-timeout.test.ts`: the two timeout tests of
  decision 5, in one `describe` with `concurrency: true`, so they take
  about 60 seconds together, not 120.
- `tests/delegate/steps.ts`: helpers the three files share. Not a
  `*.test.ts` file, so the runner does not run it.

`step run` and the background commands get files of their own because
Node runs files in parallel, and the background tests spend most of
their time waiting on `step wait`'s 2-second poll.

- *Alternative:* add the tests to `tests/delegate/run.test.ts`.
  Rejected: that file already holds 500 lines of review and handoff
  tests, and one file runs its tests in series.

### 2. What `tests/delegate/steps.ts` holds

```ts
/** The arguments of `lets delegate step run`: build, named Build X, on p.md, at high effort, on claude, unless `over` says otherwise. */
export function stepRun(over?: StepArgs): string[];
/** The arguments of `lets delegate step start`: stepRun's, then --report-file r.json and --meta-file m.txt, unless `over` says otherwise. */
export function stepStart(over?: StartArgs): string[];
/** A final message: prose, then a step-report block holding `yaml`. */
export function ending(yaml: string): string;
/** The write-mode arguments lets gives codex, claude and agy for a step. */
export function codexWrite(cwd: string, over?: …): string[];
export function claudeWrite(effort?: string, model?: string): string[];
export function agyWrite(effort: string, timeout: string, prompt: string, model?: string): string[];
/** Resolves once `stand` has logged `count` calls; rejects after `ms`, saying how many it saw. */
export function untilCalled(stand: StandIn, count?: number, ms?: number): Promise<void>;
/** Resolves once no process has id `pid`; rejects after `ms`. */
export function untilGone(pid: number, ms?: number): Promise<void>;
/** Sends SIGTERM to the background step `pid` now, and again after the test when it still runs. */
export function stopStep(t: TestContext, pid: number): void;
/** Checks `value` by decision 4: an ISO 8601 UTC date to the second, or whole milliseconds, between `before` and `after`. */
export function assertClock(value: string | number, before: number, after: number): void;
```

The exact option types are the build's choice. Each export has a doc
comment that says what it needs, what it gives and how it fails.

### 3. How a background test starts, holds and stops a step

- **A step that ends at once:** its stand-in answers with a report.
  The test runs `step wait`, which returns when the exit file appears.
- **A step that still runs:** its stand-in row `hang`s. The test
  waits with `untilCalled` until the stand-in has logged its call, so
  the step is surely running and `lets` is passing signals on.
- **Stopping a step:** `stopStep` sends SIGTERM to the pid that `step
  start` printed. `lets` passes it to the stand-in, then ends by the
  signal, with no exit file. That is how the tests make a killed step,
  and how each test that holds a running step cleans up.
- **No leaks:** every test that starts a step calls `stopStep(t, pid)`
  or registers its pid with `t.after`, so a test that fails half-way
  still stops what it started.
- **Two answers on one stand-in:** rows match by exact arguments, so a
  test that needs one start to hang and the next to answer gives them
  different `--model` values, such as `claude/claude-slow` and
  `claude`.

- *Alternative:* a new stand-in row that waits for a file, as a gate
  the test opens. Rejected: SIGTERM and `hang` already give both a
  running and a killed step, and the gate would be one more ability to
  maintain.
- *Alternative:* SIGKILL to the pid. Rejected: `lets` cannot pass
  SIGKILL on, so the stand-in would run on for 120 seconds.

### 4. Values from the real clock (D7)

The test takes `Date.now()` just before and just after the run. A done
report's `date` must match `^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$` and fall
between `before` rounded down to the second and `after`. `endedAt` in
the exit file and `startedAt` in the run record must be whole numbers
of milliseconds between `before` and `after`. The record line's
`durationSeconds` must be a whole number, 0 or more.

### 5. The two timeout tests

Both use `--timeout-minutes 1` and a `runLets` time limit of 100
seconds. Each checks that the command took at least 55 and less than 90
seconds, as `review-timeout.test.ts` does.

1. **`step run`:** stand-in `claude` hangs on `claudeWrite('low')`.
   The run, with `--exit-file e.json`, is exit 6, prints nothing on
   stdout, and prints `lets delegate: claude did not finish in 1
   minutes`. `e.json` records exit 6.
2. **`step wait`:** a started step whose stand-in hangs. `step wait
   --name <name> --timeout-minutes 1` is exit 6, prints nothing on
   stdout, and names the step and `each still runs`. Afterwards the
   step's pid is still alive and it has no exit file. Then the test
   stops it, and a second `step wait` is exit 0 naming it with exit 4.

### 6. Where each deleted test goes

A test is deleted in the task that adds its cover, never before. The
names are short forms of the test names. "claude", "codex" and "agy"
are the stand-ins, with the config `[cli]` unless the row says so.

**`tests/lets/delegate/step.test.ts`** (39; 38 deleted)

| Deleted tests | Covered by a black-box test that shows |
|---|---|
| asked with the normalized name, the prompt, the root, the model and the effort | codex for `--name 'Build X'` run from `docs/`: its arguments hold `-m gpt-6-luna`, the effort and the path `<root>/.workspace/lets-delegate/build-x.last-message.md`; its stdin is `p.md`; its folder is the root |
| 120 minutes at every effort; `--timeout-minutes` for a step; 600 for a story; `--timeout-minutes` for a story | agy's `--print-timeout`: `120m` at low, medium and high; `30m` with `--timeout-minutes 30`; `600m` for `--for story`; `900m` for a story with `--timeout-minutes 900` |
| a done report with the clock's date | claude prints a done report: exit 0, stdout one line starting `{"outcome":"done",`, the evidence, and `date` by decision 4 |
| the record names the session | the record line's keys in order, `for: plan`, `resolver: cli`, family, model, `handle: {kind: process, id: build-x}`, `durationSeconds` by decision 4 |
| a bare family is the record's model | `--model claude`: `model: claude` |
| needs-input in order; ask true and false | claude prints each: the questions in order, `"ask":true` kept, `ask: false` dropped |
| a failed report from the session | claude prints a failed report: exit 0, printed as given |
| no report is a failed report holding the message | claude prints `I stopped.`: reason names `step-report`, `message` is the text |
| the resolver reports failed: its reason, and no handle to finish | claude prints, then exits 2: a failed report naming `claude failed: exit 2`, and `handle: null` |
| done finished with ok; not done finished without | codex: a done step removes its last-message file; needs-input, failed and no report each keep it |
| a bad `--model` | exit 2, nothing on stdout, the bad value on stderr, no stand-in called |
| a name lets does not know in the config | `resolvers: [codex]`: exit 2 naming the user config and `codex` |
| guidance not read, even 42 | `guidance: 42` under `delegate.step.build`: exit 0 |
| every resolver declines | `[cli]` with no CLI on `PATH`: exit 2, `every resolver declined` and the config path |
| a resolver that runs no step passes it on | `[cli, subagent]` with no CLI: subagent answers, exit 3 |
| a refused model passes to the next | codex refuses `gpt/gpt-6-astra` (exit 1, no stdout), claude answers: done, record `family: claude` |
| every model refused is exit 3 naming each | codex and agy both refuse: exit 3, one line per model |
| a refusal never moves down the chain | `[cli, subagent]`, codex refuses: exit 3, and no `.prompt.md` saved |
| an unexpected failure is exit 4 | a folder at codex's last-message path: exit 4 with `EISDIR`, codex not called |
| past its time is exit 6 | decision 5, test 1 |
| no git status; changed files do not count | claude writes `notes.md`, and in another test commits `a.md`: each exit 0 with a done report |
| `--answers-file` sends the prompt and the answers | claude's stdin is `PROMPT`, a blank line, then the `## Answers` section, exactly |
| without it, the prompt is unchanged | claude's stdin is `PROMPT` |
| an answers file missing, a mapping, empty, blank | each exit 2 naming `--answers-file a.yaml`, no stand-in called |
| no config: subagent saves the composed prompt, exit 3 | the saved prompt holds `PROMPT` and the answer; stderr names the path, not `installed` |
| the repository's chain wins; a bad resolver there | user `[subagent]`, repo `[cli]`: record `resolver: cli`; repo `[codex]`: exit 2 naming `.lets/config.yaml` |
| `--exit-file`: exit 0 and the clock; exit 2 for an unreadable prompt; read from the working directory; none without it | the exit file's JSON by decision 4; `{"exit":2,…}`; `e.json` from `docs/` lands in `docs/`; no `*.exit.json` anywhere |
| `--help` does not name `--exit-file` | `step run --help`: names `--answers-file`, not `exit-file` |

It keeps "a finish that fails is reported, and the report stands", under
a top comment saying why: `cli`'s finish only removes a file the session
wrote, so no `cli` or `subagent` run makes it fail (D9).

**`tests/lets/delegate/background.test.ts`** (29; all deleted, file
removed)

| Deleted tests | Covered by a black-box test that shows |
|---|---|
| a story run in a worktree starts at once, name and pid | a real `git worktree add .workspace/lets-go/worktrees/fix-x`: `step start --for story --name 'Fix X' --checkout …` is exit 0 with `{"name":"fix-x","pid":<n>}`; the stand-in ran in the worktree |
| the process is lets running step run, paths absolute, no option step run lacks | started from `docs/` with `--model gpt/gpt-6-astra --model gemini`, `--timeout-minutes 900` and `--answers-file a.yaml`: codex refuses the first model, agy runs the second with `--print-timeout 900m` and the answers in `-p`, and the step ends exit 0. A path left relative, or an option step run lacks, would fail the step |
| every `--model`, `--timeout-minutes` and `--answers-file` go to step run | the same test |
| without `--checkout`, the root | started from `docs/`: the stand-in ran in the root |
| paths from the working directory; runs kept under the root | started from `docs/`: the report and meta files are in `docs/`; the run record is in `<root>/.workspace/lets-delegate/` |
| the run record | its keys and values, `pid` equal to the printed one, `startedAt` by decision 4 |
| no `--report-file`; no `--meta-file` | each exit 2 naming the flag, nothing on stdout, no run record |
| an unreadable prompt file; an unreadable answers file; a bad `--model` | each exit 2 naming it, no run record, no stand-in called |
| a name that still runs | a hanging step: a second start is exit 2 naming the name and the pid, and the stand-in was called once |
| a name that has ended starts again, replacing the old run | a second start after `step wait`: a new pid in the run record, no old exit file before it ends, and its answers file reached the stand-in |
| a name whose process is gone with no exit file starts again | a stopped step, after `untilGone`: a second start is exit 0 |
| a process that cannot start | none; deleted (D9). The test of a folder at the report path shows exit 4, nothing on stdout and no run record |
| step wait names the first of two to end | `a` hangs, `b` answers: `--name a --name b` names `b` |
| names a step that ended before it started | a second `step wait` after the first names it at once |
| of two ended steps, the one that ended first | `a`, then `b`, each waited for: `--name b --name a` names `a` |
| changes neither report nor meta file of a step with an exit code | both files the same before and after a second `step wait` |
| a step gone with no exit code is exit 4, with a line at the end of its meta file | a stopped step whose meta file the test fills with `lets delegate: no answer\n`: `{"exit":4}`, the killed line after that text |
| a killed step is reported once | a second wait: exit 4 again, one killed line |
| a killed step counts as ended when found | `b` ends; then `a` is stopped: `--name a --name b` names `b` |
| an unknown name; no name | exit 2 naming `c-story`; exit 2 naming `--name` |
| a time limit that passes is exit 6 | decision 5, test 2 |
| a step that ends before the time limit | `--timeout-minutes 1` on a step that answers: exit 0, well under a minute |
| a name longer than 32 characters | `openspec-cli-is-the-projects-own-story` and `…-own-other-story` both start and both end; `step wait` names each as it was started |
| a step that ended and cannot start again leaves no run record | a folder at `r.json` on the second start: exit 4; then `step wait` is exit 2 |
| report or meta files that cannot be opened | a folder at `r.json`, and in another case at `m.txt`: exit 4, `fix-x could not start: EISDIR`, nothing on stdout, no run record |
| the killed line after a meta file that ends mid-line | a stopped step whose meta file the test fills with `half a li`: the killed line on a line of its own |

**`tests/lets/resolvers/cli/delegate.test.ts`** (13; 12 deleted): no
CLI on `PATH` under `[cli, subagent]`; the codex, claude and agy write
commands; the folder, stdin, 120 minutes and no `CLAUDECODE` (set in
the run's environment and named in `logEnv`); a CLI that prints then
exits 2; codex with no last message; the timeout; a refusal handed to
the next model; a CLI that cannot start (`unstartable`, exit 3 naming
`claude`); the last-message file removed after done and kept after
needs-input. Each is a row of the `step.test.ts` table above or of the
next paragraph. It keeps "finish removes nothing for a process handle
whose id is not a session name" (D11).

**`tests/lets/resolvers/cli/cli.test.ts`** (6; all deleted, file
removed): the write-mode commands, each checked as a stand-in's exact
arguments: codex with and without `-m`; claude with and without
`--model`; agy with `--model gemini-3.8-flash-high` at high effort, and
with no model at `--print-timeout 120m`. The prompt is `PROMPT`, so
stdin and `-p` show it whole.

**`tests/lets/delegate/source-tree.test.ts`** (1; deleted, D6): covered
by `review run`'s "with no lets config, subagent is the only resolver
asked" and `step run`'s no-config test.

### 7. What is left of `tests/lets/delegate/fixtures/`

After the moves, the build removes each export, option and fake-io
field that no test imports or uses, such as `spawnDetached`, `alive`
and `roots` when only the deleted background tests used them. `pnpm
check` and `git grep` show what is unused. The folder stays (D10).

## Risks / Trade-offs

- [A background step outlives a failed test] → `stopStep` and
  `t.after` stop every pid a test started (decision 3).
- [A test races a background step, such as stopping it before `lets`
  has started the stand-in] → `untilCalled` waits for the stand-in's
  logged call before any signal, and `untilGone` waits for the process
  to end before a test counts it gone. Both reject with a message after
  their own time limit, so a race fails the test instead of hanging it.
- [A stopped background process stays a zombie, so `step wait` and
  `untilGone` still see it alive] → The step start process has exited,
  so the orphan goes to the system's init, which reaps it. In the Nix
  sandbox, the builder's shell is that init. If `nix flake check`
  shows a zombie, the build stops and asks, because the fix would
  change `lets` or the approach.
- [`step wait`'s 2-second poll makes the background file slow] → Node
  runs it beside the other files. Tests wait only on steps that end at
  once, except the two timeout tests.
- [The timeout file adds about 60 seconds] → Accepted (D8). Its two
  tests run at the same time, beside `review-timeout.test.ts`.
- [Deleting a test whose behavior no new test covers] → Decision 6
  names the cover for each. The build ticks a deletion only with its
  cover passing.

## Migration & Rollback

N/A. Only test files and one README row change. Reverting the commits
restores the old tests.
