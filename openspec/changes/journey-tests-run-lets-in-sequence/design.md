## Context

- Each command group has its own fixture beside its tests, and none of
  them is a `*.test.ts` file:
  - `tests/sync/project.ts`: `useRelease()` builds one small test
    release per test file, in a `before` hook.
  - `tests/backlog/github.ts`: rows for a stand-in `gh` (`LOOKUP_ONE`,
    `itemList`, `json`) and `issue()`, a row that answers every `gh`
    call on one issue from state the stand-in keeps between calls, as
    `issueState()` sets it up. `claim` assigns the user, posts a claim
    comment holding its token, and writes the Status `In Progress` to
    that state.
  - `tests/delegate/repo.ts`: `delegateRepo(t, { user })` makes a Git
    repository with one commit holding `p.md`, a user config home and a
    stand-ins folder. Its `run` calls `runLets` with
    `onlyStandIns: true`, so `PATH` holds only the stand-ins and `git`.
    It also runs the `beforeRemoval` hooks before the folders go.
  - `tests/delegate/steps.ts`: `stepRun`, `stepStart`, `ending`,
    `codexWrite`, `claudeWrite`, `agyWrite`, `cleanUpStep` and
    `untilGone`.
- `backlog()` and `project()` each make a repository of their own, so a
  journey cannot use them as they are. `delegateRepo` takes a stand-ins
  folder that any stand-in can be written into, `gh` and `openspec`
  included.
- `lets sync` creates `openspec/config.yaml` and the other files a
  project needs when they are missing, and calls `openspec --version`.
- `step run` asks for each `--model` in turn, and stops at the first
  that is not refused (`withModels` in `lets/src/delegate/lookup.ts`).
  The `cli` resolver counts a CLI that exits non-zero having printed
  nothing as a refusal (`lets/src/resolvers/cli/cli.ts`).
- `step wait` prints the first of its named steps that ends, as
  `{"name","exit"}`. `lets-go` runs it again with the names still
  running (`skills/lets-go/references/epic-run.md`).
- `pnpm test` and the flake's `node-tests` check run
  `tests/**/*.test.ts`.

## Goals / Non-Goals

**Goals:**

- Each value a command needs comes from what an earlier command in the
  journey printed. The test types in only the stand-ins' data and the
  first command's arguments.
- A failure names the command whose output did not fit the next one:
  each step of a journey checks its exit code before the next runs, and
  the assertion message holds that command's output.
- No test leaves a process running, even when it fails.

**Non-Goals:**

- Checking again what a single-command test checks (D4).
- Any change to `lets` (D5), or a new stand-in (D6).
- `lets backlog complete` (D3), `step instructions --for story` in the
  epic wave, and story worktrees with `--checkout`. The second is not in
  the agreed path (D2). The third needs `git worktree`, which `lets-go`
  runs, not `lets`, and `background.test.ts` already tests it.

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program through
  `delegateRepo(t).run`, in one temporary Git repository per journey,
  with stand-in `gh`, `openspec`, `codex`, `claude` and `agy` in its
  stand-ins folder. The stand-in issue's state, each stand-in's call
  log, the step report files and the step process ids are what the
  tests read.
- **Existing seams reused:** the fixtures listed in Context. The new
  file imports them, and copies none.

## Scrutiny Tier & Blast Radius

- **Tier:** low. One new test file on the patterns the earlier stories
  set, with no deletion and no change to `lets`. Its one hazard, a
  background process left running, has a helper that `background.test.ts`
  already relies on.
- **Blast radius:** a new `tests/journey/` folder and one README row.
  No file under `lets/`, and no existing test, changes.

## Decisions

### 1. One file, `tests/journey/journeys.test.ts`, with two tests

Both journeys go in one file (D7), in a folder of their own, beside the
command groups' folders. The file opens with a comment that says what a
journey test is (D1) and that it checks the joins, not each command.

- *Alternative:* `tests/journeys.test.ts` at the top of `tests/`.
  Rejected: every other test file sits in a group's folder, and the
  README's *Development* table lists the folders.

### 2. The file reuses the command groups' fixtures

It imports `useRelease` from `tests/sync/project.ts`; `LOOKUP_ONE`,
`itemList`, `json`, `issue` and `issueState` from
`tests/backlog/github.ts`; `delegateRepo` and `PROMPT` from
`tests/delegate/repo.ts`; and the argument builders, `ending`,
`cleanUpStep` and `untilGone` from `tests/delegate/steps.ts`. Each
journey makes one `delegateRepo` with the user config
`version: 3\ndelegate: { resolvers: [cli] }\n`, and writes every
stand-in into its `standIns` folder. Every command runs through its
`run`, so `PATH` holds only the stand-ins and `git`.

No part is added to `tests/support/lets.ts` unless the build finds a
need. A helper that only the journeys use, such as one that reads the
one JSON line of a result, lives in the test file.

- *Alternative:* a journey fixture of its own, built from
  `tests/support/lets.ts`. Rejected: it would copy what `delegateRepo`
  and `github.ts` already do, which #308's Shared decisions forbid.
- *Alternative:* move the fixtures into `tests/support/`. Rejected: the
  helper module says command fixtures live beside their tests, and the
  move would touch every test of three groups.

### 3. The story journey

Stand-ins:

- `openspec` answers `--version` with `1.3.0`.
- `gh` answers, in this order: `LOOKUP_ONE`; `itemList` with two
  stories, 149 (Must) and 150 (Should), both Todo; the search for
  ready issues, `issue list --search 'is:open no:assignee -is:blocked'`,
  by prefix, with both; the exact `issue view 149 --json …` call of
  `lets backlog item`, with issue 149, titled
  `story-149 — outcome`; and last `issue()` for 149, from
  `issueState()`.
- `codex` lists `gpt-6-luna`, `agy` lists `gemini-3.8-flash-high`, and
  `claude` lists nothing, as `instructions.test.ts` sets them up.
  Each one's write-mode call for the plan step has a row: `codex` and
  `claude` exit 1 having printed nothing, which is a refusal, and `agy`
  prints a final message whose step report is `outcome: done`.

Steps, each checked for its exit code with the command's output in the
message:

| # | Command | Takes | Keeps |
|---|---|---|---|
| 1 | `lets sync`, with `WORKFLOW_RELEASE` set to the file's release | — | — |
| 2 | `lets sync --check` | the files step 1 wrote | exit 0 |
| 3 | `lets backlog ready` | — | `issues[0].key` |
| 4 | `lets backlog item <key>` | the key from 3 | `key`, and the session name: `title` before ` — `, then `-plan` |
| 5 | `lets backlog claim <key>` | the key from 4 | `result` `claimed`, and `claim`, the token |
| 6 | `lets delegate step instructions --for plan` | — | `options`, in order |
| 7 | `lets delegate step run --for plan --name <session> --prompt-file p.md --effort high`, with `--model <option>` for each option | the options from 6, the name from 4 | stdout and stderr |

The stand-ins' rows for step 7 name the models the listings give, so
the test does not assert the options' values: it passes them on. If
step 6 printed other options, or another order, step 7 would call a CLI
with arguments no row has, and that CLI would exit 127.

At the end, the test checks (D4):

- the stand-in issue's state: `assignees` is `['octocat']`, `status` is
  `['In Progress']`, and it holds one claim comment, whose token is the
  one step 5 printed;
- each family got one write-mode call, with the model step 6 listed:
  `codex` and `agy` after their listing call, `claude` with no listing.
  Since `step run` stops at the first model that is not refused, all
  three calls, with `agy` answering, show that the models were tried in
  the order given;
- step 7's stdout is one JSON line whose `outcome` is `done`, and its
  record line on stderr names the family `gemini`.

### 4. The epic-wave journey

Stand-ins:

- `gh` answers: `LOOKUP_ONE`; `itemList` with epic 52; the exact
  `issue view 52 --json …` call of `lets backlog item`, with open
  sub-issues 53, 54 and 55, titled `story-<n> — outcome`; and, by
  prefix, `issue view 53`, `54` and `55` for `lets backlog waves`, as
  `waves.test.ts` writes them. 53 and 54 name different paths under
  *Relevant code*, and 55 is blocked by 53, so the first wave is 53 and
  54, and 55 waits.
- `codex` has a write-mode row for each first-wave story's session,
  told apart by the session name in its last-message path, as
  `codexWrite(cwd, { name })` builds it. Each writes a final message
  whose step report is `outcome: done` with evidence that names its
  story.

Steps:

| # | Command | Takes | Keeps |
|---|---|---|---|
| 1 | `lets backlog item 52` | — | each sub-issue's `key` and `title` |
| 2 | `lets backlog waves --only <keys>` | the keys from 1, joined by commas | the keys of `waves[0].stories` |
| 3 | `lets delegate step start --for story --name <name>-story --prompt-file p.md --report-file <name>-report.json --meta-file <name>-meta.txt --effort high --model gpt`, for each key from 2 | each story's name: its `title` from 1, before ` — ` | the `name` and `pid` it printed |
| 4 | `lets delegate step wait`, with a `--name` for each step still running, until none is | the names from 3 | each `{"name","exit"}` |

The test calls `cleanUpStep(t, pid)` as soon as step 3 prints a pid,
before any assertion, so a failing test still stops its steps.

At the end, the test checks (D4):

- step 4 named each started step once, each with exit 0;
- each story's report file holds one JSON line whose `outcome` is
  `done` and whose evidence names that story;
- `untilGone(pid)` resolves for every pid step 3 printed.

### 5. The README

The `tests/` row of the README's *Development* table gains a sentence
for `journey/`: tests that run several `lets` commands in sequence, as
`lets-go` does, and feed each one what the last one printed.

## Risks / Trade-offs

- [Risk] `lets sync` with `onlyStandIns` may need a program other than
  `git` and `openspec` on `PATH`, and fail. → The build runs step 1
  first and reads its output. If sync needs another program, the
  journey adds it with `pathWith`, which links a real program, and the
  deviations ledger says which.
- [Risk] A journey test is slow: the story journey builds a release,
  and the epic wave waits on `step wait`'s 2-second poll. → Two tests,
  in one file, which Node runs beside the other files. Each run of
  `lets` keeps `runLets`'s 30-second limit.
- [Risk] When a journey fails, it names no single behavior. → Each
  step checks its exit code with that command's output in the message,
  so the failure names the step and what it printed.
- [Risk] The stand-in rows are tied to the exact `gh` and CLI arguments
  that `lets` uses, so a change to them breaks the journeys as well as
  the single-command tests. → The rows reuse the fixtures' builders,
  so one change fixes both.
- [Trade-off] The epic wave runs both stories in the repository root,
  not in worktrees. → Their sessions write different files, by name.
  `--checkout` keeps its own test in `background.test.ts`.

## Migration & Rollback

N/A. The change adds one test file and a README sentence. Rollback is a
revert of the commits.
