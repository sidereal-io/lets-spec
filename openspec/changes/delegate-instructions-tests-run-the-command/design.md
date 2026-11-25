## Context

- `tests/support/lets.ts`, from #309, runs `lets/bin/lets` with a pinned
  environment and a time limit (`runLets`), and writes stand-in programs
  that answer from a table and log their arguments (`standIn`). It puts
  the stand-ins folder first on `PATH`, ahead of the real `PATH`.
- The `cli` resolver looks for `codex`, `claude` and `agy` on the real
  `process.env.PATH` (`lets/src/resolvers/kit/io.ts`, `commandExists`).
  The maintainer's machine has all three, so with the real `PATH` a test
  would find them whenever its stand-in is missing.
- `lets delegate <strategy> instructions` runs only two kinds of
  program: `git rev-parse --show-toplevel`, to find the repository's
  lets config, and the model listings `codex debug models` and
  `agy models`. Each listing has a fixed limit of 20 seconds, and the
  two run at the same time (`LISTING_TIMEOUT_MS` in
  `lets/src/resolvers/cli/cli.ts`). A listing runs without the session
  markers, such as `CLAUDECODE`, in its environment.
- `runLets` gives each run a new, empty `XDG_CONFIG_HOME`. A test that
  needs a user config passes its own folder through `options.env`,
  which `runLets` applies last.
- The flake's `node-tests` check runs every `tests/**/*.test.ts` in the
  Nix sandbox, with `nodejs_26`, `pnpm` and `git` and nothing else.

## Goals / Non-Goals

**Goals:**

- Every behavior that the moved tests check has a black-box test, or an
  existing one, before the moved test is deleted.
- No test result depends on which real CLIs the developer has
  installed.
- The stand-ins `codex`, `claude` and `agy` are ones #318 and #319 can
  extend for `run`, `start` and `wait`.

**Non-Goals:**

- Moving the tests of `run`, `start` and `wait`, the `runCommand`
  tests in `tests/lets/resolvers/cli/cli.test.ts`, or the `withModels`
  and `inAdapter` tests (D8).
- Moving `tests/lets/delegate/cli.test.ts` onto the helper module. It
  is already black-box; a later story may move it.
- Any change to `lets` (D4).

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program through
  `runLets`, in a temporary folder, with stand-ins on `PATH` and a real
  lets config.
- **Existing seams reused:** the helper module `tests/support/lets.ts`.
  The fake-adapter seam in `tests/lets/delegate/fixtures/command-deps.ts`
  stays only for the 3 tests of D10.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. It is test code on #309's pattern, but it extends
  the helper module's contract, which #318 and #319 build on.
- **Blast radius:** `tests/support/lets.ts`, a new
  `tests/delegate/instructions.test.ts`, and deletions in
  `tests/lets/delegate/` and `tests/lets/resolvers/{cli,subagent}/`. No
  file under `lets/` changes.

## Decisions

### 1. A `PATH` that holds only the stand-ins and `git`

`RunLetsOptions` gets `onlyStandIns?: boolean`. When it is true, `PATH`
is the stand-ins folder (when given), then a folder that holds only a
link named `git` to the `git` found on this process's `PATH`. The
helper module makes that folder once per process. When `git` is not on
this process's `PATH`, `runLets` rejects and says so.

A test with no stand-in at all passes `onlyStandIns: true` and no
`standIns`: then `lets` finds no family CLI.

- *Alternative:* remove from `PATH` each folder that holds `codex`,
  `claude` or `agy`. Rejected: on the maintainer's machine `claude` and
  `agy` share `~/.nix-profile/bin` with other tools, and on another
  machine `/usr/bin` may hold a CLI and `git` together.
- *Alternative:* make this the default for every run. Rejected: the
  `lets sync` tests from #309 rely on the real `PATH`, and this story
  does not need to change them.

### 2. Stand-in harness CLIs in the helper module

`tests/support/lets.ts` exports three functions, built on `standIn`
(D5). Each writes its program into `dir` and returns the `StandIn`:

```ts
export interface CodexModel { slug: string; visibility: 'list' | 'hide' }
/** How a model listing fails. */
export type ListingFailure = 'signed-out' | 'unreadable' | 'cannot-start' | 'hangs';
export interface FamilyOptions { logEnv?: string[] }

export function codex(dir: string, listing?: CodexModel[] | ListingFailure, options?: FamilyOptions): StandIn;
export function agy(dir: string, listing?: string[] | ListingFailure, options?: FamilyOptions): StandIn;
export function claude(dir: string, options?: FamilyOptions): StandIn;
```

- `codex` answers `debug models` with `{"models":[{"slug","visibility"}…]}`,
  in the order given. `agy` answers `models` with the line
  `Fetching available models...`, then one line per id,
  `<id>\t<label>`, as the fake listing in `cli.test.ts` does. The
  default listing is empty.
- `claude` has no listing, so its table is empty.
- The failures: `signed-out` exits 1 with `not logged in` on stderr;
  `unreadable` exits 0 and prints `not json`; `hangs` logs the call and
  does not exit (decision 3); `cannot-start` writes an executable file
  whose `#!` line names an interpreter that does not exist, so starting
  it fails with `ENOENT`. Its `calls()` is always empty.
- Each later delegate story adds rows for the commands it runs, such
  as `codex exec`, to these functions rather than writing its own.

### 3. Two additions to `standIn`

- **`StandInRow.hang?: boolean`.** The program logs the call, then
  waits. It exits by itself after 60 seconds, so a `lets` that fails to
  stop it leaves no process behind for long.
- **`standIn(dir, name, table, options?: { logEnv?: string[] })`.** For
  each call the program also logs the value of each variable named in
  `logEnv`. `StandIn.envs()` returns one record per call, in order,
  with `undefined` for a variable that is not set. A stand-in logs no
  variable unless it is named, so no token from the developer's
  environment is written to disk.

`calls()` keeps its type, so the `lets sync` tests do not change.

### 4. One black-box test file

The new tests go in `tests/delegate/instructions.test.ts`, beside
#309's `tests/sync/`. Each test makes its own folders with `tempDir(t)`:

- a user config home, passed as `XDG_CONFIG_HOME`, holding
  `lets/config.yaml` when the test gives one;
- a Git repository made with `git init`, holding `.lets/config.yaml`
  when the test gives one, or a folder that is not in a repository;
- a stand-ins folder.

A small function at the top of the file runs
`lets delegate <strategy> instructions --for <intent>` with these and
`onlyStandIns: true`, and returns the `LetsResult`. The JSON line is
read with `JSON.parse` on the whole of stdout, after checking that
stdout is exactly one line.

The test of a folder outside a repository sets `GIT_CEILING_DIRECTORIES`
to that folder's parent, so a temporary folder inside some repository
does not change the result.

### 5. The time-limit test needs no new way in

Stand-in `codex` and `agy` both use `hangs` (D11). The run has a time
limit of 35 seconds through `runLets`'s `timeoutMs`. If the two
listings ran one after the other, the run would need more than 40
seconds and fail that limit. The test checks that `options` is
`["gpt","gemini"]`, that stderr has two lines starting
`lets delegate: `, one naming `codex` and one naming `agy`, and that
each stand-in was called once.

### 6. Where each moved test goes

A test is deleted in the same task that adds the black-box test of its
behavior. "Existing" means a test already in
`tests/lets/delegate/cli.test.ts`.

| From | Tests | Covered by |
|---|---|---|
| `instructions.test.ts` | the JSON line, for a review and for a step; starts nothing; declines pass down the chain; every resolver declines; warnings | new tests with `cli`, stand-ins and `[cli, subagent]` |
| `instructions.test.ts` | the 12 guidance and malformed-config tests, and the 3 tests of the user's and the repository's config | new tests with a real user config and `.lets/config.yaml` |
| `instructions.test.ts` | no config, for a review, a handoff or a step; a resolver listed by path | existing: "with no config, review instructions --for plan…", "with no config, step instructions prints…", "a resolver listed by path is exit 2…" |
| `instructions.test.ts` | of the tests above, the 8 that use handoff | the 2 handoff tests of D9; the rest are rewritten with `review` or `step`, which test the same code |
| `lookup.test.ts` | the 9 chain tests | new tests: `[cli, subagent]` and `[subagent, cli]`, an empty chain, every resolver declining in the user's and in the repository's config |
| `lookup.test.ts` | "an adapter whose detect throws" | moves to the D10 file (decision 7) |
| `strategies.test.ts` | all 5 | deleted (D7): the intents by the existing `--help` and `--for` tests, the kinds of session by the new review, handoff and step tests |
| `resolvers/cli/delegate.test.ts` | the 7 instructions tests | new tests with stand-in CLIs, `T3CODE_HOME` set for "inside another harness" |
| `resolvers/cli/cli.test.ts` | the 7 `options` tests | new tests of listing order, hidden slugs, gemini efforts, each failure, the session markers and the time limit |
| `resolvers/subagent/subagent.test.ts` | "named subagent, always detects and lists no models" | a new test with `[subagent]` and every CLI on `PATH` |

Two of these are rewritten, not only moved:

- "a strategy entry that is not a mapping" uses `review: code`, so it
  names `delegate.review`, not `delegate.handoff`.
- "handoff guidance does not reach a step" becomes "review guidance
  does not reach a step". "Guidance for the other strategy only" uses
  `step` guidance with a review. Both test one strategy's guidance not
  reaching another, which does not depend on handoff.

### 7. The kept fake-adapter tests stay in `instructions.test.ts`

`tests/lets/delegate/instructions.test.ts` keeps the 3 tests of D10:
a step skips a resolver that runs no step; an `options` call that fails
unexpectedly exits 4; a `detect` that throws exits 4. The third moves
from `lookup.test.ts`, written through the command's `run` so that all
three check the exit code. Two of the three are there already, so this
file moves the fewest tests. The file's top comment says why each test
uses a fake adapter. `lookup.test.ts` then holds only the 6 tests of
D8.

### 8. The handoff tests are easy to delete

The 2 handoff tests of D9 sit in one `describe('handoff instructions')`
block, with a comment that names #306. Whichever of this story and #306
merges second deletes the block.

## Risks / Trade-offs

- [A real CLI on the developer's `PATH` changes a result] → Every new
  test runs with `onlyStandIns: true` (decision 1).
- [`git` is needed but missing from the stripped `PATH`] → The `git`
  folder links the real one. A missing `git` rejects with a message,
  not a wrong result.
- [The time-limit test adds about 20 seconds] → Accepted (D11). Node's
  runner runs test files in parallel, so the suite's wall time grows by
  less when another file is slower.
- [A `lets` that fails to stop a hanging listing leaves a process] →
  A hanging stand-in exits by itself after 60 seconds (decision 3).
- [This story and #306 both change the handoff tests] → One block to
  delete (decision 8). Git shows the conflict to whichever merges
  second.
- [Deleting a test whose behavior no new test covers] → Decision 6
  names the cover for each one. The build ticks a deletion only with
  its cover passing.

## Migration & Rollback

N/A. Only test files change. Reverting the commits restores the old
tests.
