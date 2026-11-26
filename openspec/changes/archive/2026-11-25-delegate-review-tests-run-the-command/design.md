## Context

- `tests/support/lets.ts`, from #309 and #317, runs `lets/bin/lets`
  with a pinned environment and a time limit (`runLets`). With
  `onlyStandIns: true`, `PATH` holds only the stand-ins folder and a
  link to `git`. `standIn` writes a Node program that logs each call's
  arguments, and the variables `logEnv` names, then answers from the
  first table row whose `args` equal the call's. `codex`, `agy` and
  `claude` build on it, but answer only the model listings. A `hang`
  row ends by itself after 60 seconds.
- `review run` reads the lets config, reads the prompt file, finds the
  repository root with `git rev-parse --show-toplevel`, and records
  `git status --porcelain -z --untracked-files=all`. It picks the first
  resolver that does not decline, asks it for each `--model` in turn,
  reads `git rev-parse HEAD` in the checkout, checks the tree again,
  then calls the resolver's `finish` (`lets/src/delegate/review.ts`).
  It never lists models.
- The `cli` resolver runs the family's CLI in the repository root, with
  the prompt on stdin for `codex` and `claude`, and as the argument of
  `-p` for `agy`. `codex` writes its last message to the path after
  `-o`, which is `<repo>/.workspace/lets-delegate/<name>.last-message.md`.
  On `finish` with a clean tree, `cli` removes that file
  (`lets/src/resolvers/cli/cli.ts`).
- lets's process runner (`lets/src/resolvers/kit/io.ts`) always closes
  the child's stdin, starts the child in a process group of its own,
  and stops the group at the timeout with SIGTERM, then SIGKILL after 5
  seconds. A stand-in is a Node program, so SIGTERM ends it at once.
- `--timeout-minutes` takes only whole minutes, at least 1. The `cli`
  resolver's timeout message is `<cmd> did not finish in <n> minutes`.
- `runLets` sets `GIT_CONFIG_GLOBAL=/dev/null`, so no global ignore
  file applies: in a test repository, `.workspace/` shows in
  `git status` as untracked, and the tree check skips it by its path.
- `pnpm test` and the flake's `node-tests` check run
  `node --test "tests/**/*.test.ts"`. Node runs the files in parallel.

## Goals / Non-Goals

**Goals:**

- Every behavior that a deleted test checks has a black-box test, or an
  existing one, that passes before the deleted test goes.
- Each stand-in ability this story adds is one #319 can use for
  `step run` without changing it.
- No result depends on which real CLIs the developer has installed:
  every new test runs with `onlyStandIns: true`.

**Non-Goals:**

- The tests of `step run`, `step start` and `step wait`, the write-mode
  `runCommand` tests, and the cli step tests, which #319 moves (D9).
- The `findRepoRoot` tests, which #320 moves with config reading (D9).
- Moving `tests/delegate/instructions.test.ts` onto this story's setup
  function. It keeps its own.
- Any change to `lets` (D4).

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program through
  `runLets`, in a temporary Git repository with one commit, with
  stand-ins on `PATH` and a real lets config.
- **Existing seams reused:** the helper module `tests/support/lets.ts`.
  The fake-adapter seam in `tests/lets/delegate/fixtures/command-deps.ts`
  stays only for the kept tests of D5 and D9.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. It is test code on #317's pattern, but it extends
  the helper module's contract, which #319 builds on, and it deletes
  about 100 tests.
- **Blast radius:** `tests/support/lets.ts`; new files in
  `tests/delegate/`; deletions in `tests/lets/delegate/` and
  `tests/lets/resolvers/cli/`; one row of the README. No file under
  `lets/` changes.

## Decisions

### 1. A stand-in row can write files and commit, and each call logs its stdin and folder

`tests/support/lets.ts` gets these additions (D6):

```ts
export interface StandInRow {
  // …the fields from #309 and #317…
  /** Files to write, path to text. A relative path is from the call's folder. */
  files?: Record<string, string>;
  /** Makes a commit with this message in the call's folder, after writing `files`. */
  commit?: string;
}

export interface StandIn {
  // …calls() and envs()…
  /** Each call's standard input, in order. Empty text when it got none. */
  inputs(): string[];
  /** The folder each call ran in, in order. */
  cwds(): string[];
}

export interface FamilyOptions extends StandInOptions {
  /** More rows, after the model listing's, such as the answer to a `codex exec`. */
  rows?: StandInRow[];
}
```

- **Order of a call:** log the arguments, the named variables, the
  standard input and the folder; then, for a `hang` row, wait; else
  write `files`, make the commit, print `stdout` and `stderr`, and exit
  with `code`.
- **`files`** creates no folder. A file whose folder is missing fails
  the call with exit 1 and a line on stderr naming the path. So the
  codex test shows that `lets` made the scratch folder before it ran
  `codex`, as the deleted `cli.test.ts` test did.
- **`commit`** runs `git add -- <each path in files>`, then
  `git commit -q --allow-empty -m <commit>`. The stand-in gets lets's
  environment, so git uses the pinned author and finds `git` on the
  stripped `PATH`. When git fails, the call exits 1 with git's stderr.
- **stdin** is always read. lets closes every child's stdin, and a
  detached step gets `/dev/null`, so the read never blocks.
- **`codex`, `agy` and `claude`** take `rows` and append them after the
  listing row. `cannot-start` still makes a program that never runs,
  so it fails every call, not only the listing.
- **`HANG_MS` becomes 120 seconds.** With 60, a stand-in that hangs in
  the timeout test could end by itself at the moment lets times out,
  and the run would read an empty message. With 120, the test can also
  tell that lets stopped the stand-in: the run ends near 60 seconds,
  not 120.

- *Alternative:* match rows by a pattern, not exact arguments.
  Rejected: the exact arguments are the contract with the CLI, and a
  row that does not match already fails loudly with the arguments
  quoted on stderr.
- *Alternative:* a `codex` option that writes the last message to the
  path after `-o`. Rejected: a test must give the exact arguments
  anyway, so it knows the path, and `files` also serves a file outside
  `.workspace/` and #319's report files.

### 2. Two test files and a setup module in `tests/delegate/`

- `tests/delegate/run.test.ts` holds `describe('review run')` and
  `describe('handoff run')`. A comment on the handoff block names #306
  (decision 6).
- `tests/delegate/review-timeout.test.ts` holds the one timeout test
  (decision 5), so Node runs its 60 seconds beside the other files.
- `tests/delegate/repo.ts` exports the setup both use, and #319 can
  use: `delegateRepo(t, setup)` makes a user config home, a Git
  repository with `.lets/config.yaml` when given, a prompt file `p.md`,
  and a stand-ins folder, then commits everything, so the tree is clean
  before the run. `setup.noCommit` leaves the repository with no
  commit. `setup.notInRepo` makes no repository and sets
  `GIT_CEILING_DIRECTORIES` to the folder's parent, as
  `tests/delegate/instructions.test.ts` does, so git finds no
  repository above a temporary folder. It returns the folders, the two config paths, the last
  commit's hash and a function that runs `lets` there with
  `onlyStandIns: true`. It is not a `*.test.ts` file, so the runner
  does not run it.

A test reads the metadata line as the last line of stderr, with
`JSON.parse`, and checks its keys in order.

### 3. The command each family gets is checked in the stand-in's log

Each test gives the exact arguments it expects as the row's `args`,
for example, for a review named `X Plan Review` on `gpt/gpt-6-luna` at
high effort:

```ts
['exec', '-s', 'read-only', '-c', 'model_reasoning_effort="high"', '-m', 'gpt-6-luna',
 '-o', `${cwd}/.workspace/lets-delegate/x-plan-review.last-message.md`, '-']
```

A test of the command then checks `calls()`, `inputs()` and `cwds()`.
The prompt file holds text with quotes and a newline, so the test shows
that stdin and `-p` carry it whole.

### 4. How the hard exits are reached with real programs

| Exit | How the test makes it |
|---|---|
| 3, every model refused | each stand-in row exits 1 and prints nothing on stdout |
| 4, outcome unknown, from an error `lets` does not know | a folder sits where the last-message file goes; `cli` cannot remove it, and `rm` fails with `EISDIR` before `codex` runs |
| 4, the tree cannot be checked | the stand-in's `files` writes text over `.git/index`, so the next `git status` fails; `git rev-parse HEAD` still works |
| 5, session failed | the row prints on stdout, then exits 2; or the final message is blank |
| 6, timeout | decision 5 |
| 7, tree changed | the row's `files` writes `notes.md` at the repository root |

A commit with no files (`commit` alone) moves `HEAD`, so the metadata
line's `commit` shows the session's commit. A repository with no
commit gives `commit: null`.

### 5. The timeout test

Stand-in `claude` hangs on `-p --permission-mode plan --effort low`
(D7). The run uses `--model claude --timeout-minutes 1`, and `runLets`
gets a time limit of 100 seconds. The test checks exit 6, an empty
stdout, the line `lets delegate: claude did not finish in 1 minutes`,
and that the run took less than 90 seconds, so lets stopped the
stand-in rather than waiting for it to end at 120 seconds. It also
checks that the run took at least 55 seconds, so lets waited the whole
minute (added after the code review). `lets` does not change.

### 6. Handoff

`describe('handoff run')`, with a comment naming #306, holds the 4
tests of D5:

1. `[cli]` with every CLI on `PATH` is exit 2, `every resolver
   declined`, and `[cli, subagent]` answers with `subagent`; neither
   calls a stand-in.
2. With `[subagent]`, the name `Fix Login` saves the prompt in
   `.workspace/lets-delegate/fix-login.prompt.md`, and stdout is one
   JSON line with `resolver: subagent`, `handle: null` and
   instructions that hold the prompt and that path.
3. A prompt file that cannot be read is exit 2, naming it.
4. `[subagent, /opt/r/old-resolver]` is exit 2 and saves no prompt.

`tests/lets/delegate/handoff.test.ts` keeps the 5 tests that no `cli`
or `subagent` resolver reaches, under a top comment that says so:
the handle line, a refused model passing to the next, every model
refused is exit 3, a refusal never moves down the chain, and any
other failure is exit 4. Whichever of this
story and #306 merges second deletes the handoff tests.

### 7. Where each deleted test goes

A test is deleted in the task that adds its cover, never before. The
names are short forms of the test names.

**`tests/lets/delegate/review.test.ts`** (40; 37 deleted)

| Deleted tests | Covered by a black-box test that shows |
|---|---|
| prints the final message, then one metadata line | a codex review: stdout, then the metadata line with its 10 keys in order |
| the adapter is asked to run the normalized name, the prompt, the family, the model and the effort; the run request has no reviewers | the codex command (decision 3), with a config that holds `reviewers:`; stdin is the prompt file exactly |
| for: code, and for: plan | the metadata line for `--for plan` |
| a HEAD that cannot be read gives a null commit | a repository with no commit |
| a session that commits gives the commit it made | a stand-in row with `commit` |
| a bare family is asked for with no particular model; a family equal to the source is not independent | claude with `--model claude` and `--source-family claude` |
| the timeout is the one given, else the default by effort | agy's `--print-timeout`: `7m` with `--timeout-minutes 7`, `30m` at medium, `45m` at high |
| a bad `--model` is exit 2 | exit 2 naming it, no stand-in called, the line starting `lets delegate: ` |
| an invalid config; a path from an older lets | exit 2 naming the file, the path and `t3, cli or subagent` |
| every listed resolver declines | `[cli]` with no CLI on `PATH`: exit 2, nothing on stdout |
| the first declines and the next answers; a listed resolver that answers comes before subagent; with no config, exit 3 asking only the default; runs no program but git | `[cli, subagent]` with no CLI, and with codex; no config; `[subagent]` with every CLI on `PATH` and none called |
| run ignores the guidance, even one that is not a string | `guidance: 42` under `delegate.review.code`: exit 0, stdin unchanged |
| finish goes to the same resolver, with ok after a clean tree | a clean codex review removes its last-message file; a dirty one keeps it |
| a refused model passes to the next one | codex refuses `gpt/gpt-6-astra`, agy answers `gemini/gemini-3-pro` |
| every model refused is exit 3; a refusal never moves down the chain | `[cli, subagent]`, codex and claude both refuse: exit 3, one line per model, no subagent line |
| a failed session is exit 5, and the next model is not asked | claude prints, then exits 2; codex is not called |
| past its time is exit 6, and a known outcome-unknown error exit 4 | the timeout test; the `.git/index` test |
| an unexpected failure inside the resolver is exit 4 | the `EISDIR` test |
| an empty final message is exit 5, with finish ok false | claude prints a blank line; codex writes a blank last message, which stays |
| a tree the session changed is exit 7 | codex writes `notes.md`: exit 7, no stdout, the last-message file stays |
| a git status that fails after the session is exit 4 | the `.git/index` test |
| files the user had already changed, and scratch files, do not count | decision 8 |
| a prompt file that cannot be read | exit 2 naming `p.md`, no stand-in called |
| the 7 tests of the repository's chain, version and folder, and the subfolder | the same 7 cases with real config files: a folder at `.lets/config.yaml`, and a run from `docs/` |

It keeps 3 (D9): the checkout somewhere else, a null checkout, and a
finish that fails. `cli` always answers with the repository as its
checkout, and its `finish` fails only for a handle it never makes.

**`tests/lets/delegate/handoff.test.ts`** (24; 19 deleted): the 4 tests
of decision 6 cover what `cli` and `subagent` reach. The config tests
go, because the `review run` tests above cover the same config code
(D5).

**`tests/lets/delegate/guarded.test.ts`** (4; 3 deleted): the exit
code, a known error's line and exit code, and the prefix are in every
exit-2 test above. It keeps "rethrows an error it does not know" (D9).

**`tests/lets/delegate/git.test.ts`** (6; 4 deleted): `repoRoot` by a
run outside a repository, exit 2 naming the folder; `treeStatus` and
`isTreeClean` by decision 8 and the `.git/index` test. It keeps the 2
`findRepoRoot` tests, for #320.

**`tests/lets/delegate/lookup.test.ts`** (6; all deleted, file
removed; D10): first model only, by a codex review given
`--model gpt/gpt-6-luna --model claude` that calls only codex; the next
model on a refusal; a stop at a failure that is not a refusal; every
model refused; an unknown error, by the `EISDIR` test; a known error
keeping its exit code, by exit 5 and exit 6.

**`tests/lets/resolvers/cli/cli.test.ts`**: the 6 read-only
`runCommand` tests, by the command tests of codex, claude and agy; the
3 adapter tests, by the codex review (the handle, the last message, the
scratch folder made first) and the claude command test (its folder,
stdin, and no `CLAUDECODE`, set in the run's environment and named in
`logEnv`). The 6 write-mode tests stay, for #319.

**`tests/lets/resolvers/cli/delegate.test.ts`**: the 19 review and
handoff tests, by the tests above, and these:

- a model the CLI never listed is still tried: the codex review's
  stand-in has the default empty listing, and codex runs with
  `-m gpt-6-luna` (`delegate-resolvers` spec, *A resolver runs a model
  it never listed*);
- codex refusing after an earlier review with the same name: a file at
  the last-message path holds old findings, and codex refuses: exit 3,
  not 5;
- a CLI that cannot start: `claude` as `cannot-start` is exit 3, with
  `claude: cannot run claude: `;
- a clean claude review removes nothing: the scratch folder is the only
  thing it adds to the repository, by `snapshot`.

Its step tests and "finish removes nothing for a process handle whose
id is not a session name" stay (D9).

### 8. The user's own changes and scratch files

Before the run, the test changes a tracked file, adds an untracked file
named `my notes.md`, and stages a rename. The stand-in writes
`.workspace/scratch notes.md`. The review is exit 0. With `-z`, the
paths with spaces stay whole; without it, git would quote them, and the
scratch file would count as a change.

## Risks / Trade-offs

- [A real CLI on the developer's `PATH` changes a result] → Every new
  test uses `onlyStandIns: true`.
- [The timeout test adds about 60 seconds] → Accepted (D7). It has a
  file of its own, so it runs beside the other files.
- [A stand-in that writes `.git/index` depends on git's message] → The
  test checks the start of lets's line,
  `could not check the tree after the session: git status failed in`,
  and exit 4, not git's own words.
- [The rename source that `treeStatus` skips has no black-box cover of
  its own] → Decision 8's staged rename shows the user's rename does
  not count. The skip changes a result only when a session stages a
  rename into `.workspace/`, which passes the tree check today. That is
  a gap in `lets`, not in the tests; this story does not test it, and
  the pull request names it.
- [Deleting a test whose behavior no new test covers] → Decision 7
  names the cover for each one. The build ticks a deletion only with
  its cover passing.
- [This story and #306 both change the handoff tests] → One block and
  5 kept tests (decision 6). Git shows the conflict to whichever merges
  second.
- [#319 needs a stand-in ability this story did not add] → #319 adds it
  to `tests/support/lets.ts`, as this story does to #317's.

## Migration & Rollback

N/A. Only test files and one README row change. Reverting the commits
restores the old tests.
