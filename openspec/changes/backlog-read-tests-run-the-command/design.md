## Context

The tests in scope (D1) drive `run()` from `lets/src/backlog/commands.ts`
with `backlogDeps()` from `tests/lets/backlog/fixtures/fake-gh.ts`. That
fake answers each `gh` call from the first row whose key the call's
arguments, joined by spaces, start with. A test names a row such as
`'api graphql'` or `'issue view 136 '`; the trailing space keeps it off
issue 1360. The fake also records each call's options, which is how
`commands.test.ts:76` sees the timeout.

`tests/support/lets.ts`, written by #309, already has what a black-box
test needs: `runLets`, `tempDir`, `git`, `pinnedEnv` and `standIn`. Its
`standIn` answers only a call whose argument list equals a row's `args`
exactly. Constraints that shape the approach:

- `lets` sends the Project lookup as `gh api graphql -F owner={owner}
  -F name={repo} -f query=<long query> --jq <long filter>`. A test that
  has to give the whole list would copy that query, and break when the
  query is reworded.
- A stand-in is a separate program, so an answer cannot be a function
  of the call, as `fake-gh.ts` allows. No test in scope uses a function
  answer.
- `lets` finds the repository's root with `git rev-parse
  --show-toplevel`, and reads `.lets/config.yaml` there. When git
  cannot say, it reads the user's lets config only
  (`lets/src/delegate/git.ts`, `findRepoRoot`).
- `pinnedEnv` points `XDG_CONFIG_HOME` at a new empty folder, so the
  user's lets config is absent unless a test sets `XDG_CONFIG_HOME` to a
  folder of its own.
- `lets` gives each `gh` call 60 seconds (`READ_TIMEOUT_MS` in
  `lets/src/backlog/github.ts`). D14 keeps the timeout's tests in
  process.
- `node --test "tests/**/*.test.ts"` runs each file in its own process,
  several at once, and the tests in a file one after another.

## Goals / Non-Goals

**Goals:**

- Each deleted test's case is checked by a black-box test, so a
  reviewer can match the two by name.
- #316 can write the tests of `claim`, `release` and `complete` with
  the same stand-in and fixture, without copying them.
- No new tool, and no change to how `pnpm test` or the flake finds the
  tests.

**Non-Goals:**

- New cases beyond those the deleted tests check.
- A stand-in that answers one call differently each time, or that
  matches by pattern. No test in scope needs either; #316 may add one.
- Changes to `lets`, to `fixtures/fake-gh.ts` or
  `fixtures/fake-provider.ts`, or to the tests of `claim`, `release`,
  `complete`, `race` and `reclaim`.

## Test Seams

- **Primary test seam:** `lets/bin/lets backlog …` run as a program by
  `runLets`, in a temporary git repository, with the stand-in `gh` first
  on `PATH`. The tests observe the exit code, standard output and the
  calls the stand-in logged.
- **Existing seams reused:** `tests/support/lets.ts` (`runLets`,
  `tempDir`, `git`, `standIn`). The kept tests still use `run()` with
  `backlogDeps()` and `fakeProvider()`, as they do today.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. Test code only, on the pattern #309 set, but the
  change to `standIn` is a contract that #316 and the later stories
  build on, and about 120 tests are rewritten.
- **Blast radius:** `tests/support/lets.ts`, a new `tests/backlog/`
  folder, the files in `tests/lets/backlog/` that D1 names,
  `package.json`'s `test:backlog` script and one row of `README.md`. No
  file under `lets/` changes.

## Decisions

### 1. A stand-in row can match by the start of the argument list

`StandInRow` gains one optional field:

```ts
export interface StandInRow {
  args: string[];
  /** Match a call whose argument list starts with `args`, element by element. Exact match when absent. */
  prefix?: boolean;
  stdout?: string;
  stderr?: string;
  code?: number;
}
```

The stand-in still answers from the first row that matches, and still
exits 127 for a call that no row matches. A row with no `prefix` behaves
as it does today, so #309's tests do not change. The doc comment on
`standIn` says that a row with `prefix` should come after any more
specific row it would shadow.

*Alternatives:*

- Match a prefix of the joined string, as `fake-gh.ts` does. Element by
  element needs no trailing-space trick: `['issue', 'view', '136']`
  cannot match issue 1360.
- Match by regular expression. Stronger than any test in scope needs,
  and a pattern is harder to read in a test than a list.
- A separate `standInGh` in `tests/support/lets.ts`. D4 puts the
  stand-in `gh` in the helper module; a general row option keeps one
  stand-in for every program, as #308 defines it.

### 2. The backlog fixture lives in `tests/backlog/github.ts`

The header of `tests/support/lets.ts` says command-specific fixtures
live beside their tests, as #309's `tests/sync/project.ts` does. The
file is not named `*.test.ts`, so `node --test` does not run it. It
holds:

- `REPO` and `PROJECT`, with the same values as `fake-gh.ts`.
- `lookup(projects)`: the row `{ args: ['api', 'graphql'], prefix: true }`
  answering `{ repo: REPO, projects }` as JSON, and `LOOKUP_ONE` for one
  Project.
- `json(value)`, `fail(stderr, code?)` and `itemList(items)`, building
  rows as `fake-gh.ts` builds its answers.
- `backlog(t, rows, { config?, repoConfig?, files? })`: makes a
  temporary git repository with `git init`, writes the stand-in `gh`
  from `rows` into its own temporary folder, and writes the user's lets
  config into a third folder, used as `XDG_CONFIG_HOME`, when `config`
  is given. It writes `repoConfig` to `.lets/config.yaml`, and `files`
  at their paths in the repository. It returns:
  - `lets(...args)`: `runLets(['backlog', ...args], …)` in the
    repository, with the stand-in folder and `XDG_CONFIG_HOME` set;
  - `json(result)`: the one JSON object on the result's standard
    output;
  - `calls()`: the stand-in's log;
  - `repo` and `configFile`, the paths a test checks a message names.

The tests' own builders, such as `ready.test.ts`'s `item()` and
`stackRows()`, move with them into the new files, changed only to
build stand-in rows.

*Alternative:* put `backlog()` in `tests/support/lets.ts`. It knows the
Project lookup and `.lets/config.yaml`, which mean nothing to the tests
of `lets delegate` or `lets go`.

### 3. The black-box tests live in `tests/backlog/`, by command

| New file | Takes the tests of |
|---|---|
| `ready.test.ts` | `ready.test.ts` (26), and `policy.test.ts`'s cases of `ready()` |
| `item.test.ts` | `item.test.ts` (17), and `policy.test.ts`'s cases of `itemView()` |
| `find.test.ts` | `find.test.ts` (3), and `cli.test.ts`'s `find` cases |
| `key.test.ts` | `key.test.ts` (6), and `cli.test.ts`'s `key` case |
| `waves.test.ts` | the 13 command tests of `waves.test.ts` |
| `shared.test.ts` | `commands.test.ts`'s rules every command shares: one JSON object, the lookup first, `no-backlog`, `several-backlogs`, `backend-failed`, usage errors (with `cli.test.ts`'s) |
| `provider.test.ts` | `commands.test.ts`'s choice of backlog provider, and `config.test.ts`'s cases of `backlogProviderFor()` |
| `help.test.ts` | the `--help` tests of `commands.test.ts` and `cli.test.ts` (D10) |

Each moved test keeps its name where its case is unchanged, so a
reviewer can match the two. A test that took several cases in a loop,
such as the usage errors, keeps the loop: one test, one run of `lets`
per case.

Where a `policy.test.ts` or `config.test.ts` case is already checked by
a test moved from another file, no second test is added; the pull
request names the test that covers it. For example, "ready keeps the
adapter's order for equal times, and never compares keys" is covered by
"issues created at the same time keep the lowest number first", whose
order 9, 10, 100 a comparison of keys as text would break.

*Alternative:* rewrite the tests in place in `tests/lets/backlog/`. The
files there keep the tests that stay in process, and mixing the two
kinds hides which is which, as #309's design found for `tests/sync/`.

### 4. A test checks the stand-in's log for what `gh` was asked

A test that checked `t.calls()` checks `calls()`: the same argument
lists, in the same order. A test that checked a write was not made, such
as "item writes nothing", checks that every logged call starts with
`api graphql`, `issue view`, `issue list` or `project item-list`. The
test "the Project lookup runs first" checks the first call's first six
arguments and the parts of the query and filter it checks today.

### 5. Hard cases go through the command as follows

| Case | How the test reaches it |
|---|---|
| `gh` cannot start | `runLets` with `env: { PATH: <an empty temporary folder> }`, and no stand-ins. git cannot start either, so `lets` reads only the user's lets config, which is absent; `gh` then fails to start. |
| A read answered with text that is not JSON | A lookup row whose `stdout` is `not json`. |
| A user's lets config that cannot be read, `EISDIR` | `config.yaml` in the `XDG_CONFIG_HOME` folder is a folder. |
| A user's lets config that cannot be read, `EACCES` | `config.yaml` with mode `000`. The test skips, saying why, when the process runs as root, which can read the file anyway. |
| A `lets` block in `openspec/config.yaml` | `files: { 'openspec/config.yaml': … }`. |
| `backlogProviderFor()` cases | One lets config file per case, through `lets backlog find x` or `key 149`. `key` runs no `gh` call, so a case that selects GitHub needs no table. |

The message checks that named `CONFIG_FILE` or `REPO_CONFIG_FILE` name
the real paths `backlog()` returns.

### 6. The kept tests stay where they are, and the pull request lists them

These stay in `tests/lets/backlog/`, with their imports, and the pull
request lists each with its reason (D11):

| File | Kept | Reason |
|---|---|---|
| `waves.test.ts` | the 34 tests of `relevantPaths`, `overlap` and `placeWaves` | pure functions whose cases would each need several items and packets through the command (D7) |
| `ready.test.ts` | the Jira-style keys test | needs a second backlog provider, which no command can load (D13) |
| `item.test.ts` | the two Jira-style keys tests | same (D13) |
| `key.test.ts` | "key asks the selected backlog provider" | same (D13) |
| `commands.test.ts` | "gh that cannot start or times out", narrowed to `TIMED_OUT`; "every gh call has a finite timeout" | a black-box test would wait 60 seconds (D14) |

The other tests in those files, and all of `cli.test.ts`,
`policy.test.ts`, `config.test.ts` and `find.test.ts`, are deleted in the
same commit that adds the black-box tests covering them, so no case is
ever unchecked (#308's shared decisions).

### 7. `test:backlog` runs both folders

`package.json`'s `test:backlog` becomes
`node --test "tests/backlog/*.test.ts" "tests/lets/backlog/*.test.ts"`.
`pnpm test` and the flake's `node-tests` check already run
`tests/**/*.test.ts`, so they need no change.

No decision here is costly to reverse: each is test code that one later
story can change.

## Risks / Trade-offs

- [Each black-box test starts `lets` and one `gh` stand-in per call, each
  a Node process, so about 120 tests may take far longer than the
  in-process ones] → Measure the run of `tests/backlog/` once it is
  written. If one file takes over 30 seconds, run its tests concurrently
  with `describe(…, { concurrency: true })`; each test has its own
  folders, so they share nothing.
- [A prefix row placed first shadows a more specific row after it] → The
  doc comment says to order rows from specific to general, and a call no
  row answers fails loudly with exit 127.
- [The `EACCES` test skips when run as root] → It states why it skips.
  The `EISDIR` test checks the same rule, that an unreadable lets config
  is `unknown-backlog-provider` naming the file, and never skips.
- [The empty `PATH` case depends on `lets` treating a git that cannot
  start as no repository] → That is `findRepoRoot`'s documented
  contract. If it changes, the test fails with `gh`'s error missing
  from the message, not silently.

## Migration & Rollback

N/A. Only tests change. To roll back, revert the branch's commits.
