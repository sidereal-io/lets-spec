<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `lets/src/delegate/config.ts` reads the lets config.
  `readLetsConfig` reads the user's lets config, finds the repository
  root with `git rev-parse --show-toplevel`, reads `.lets/config.yaml`
  there, checks each file with `parseDocument`, and merges them with
  `mergeDocuments`. `readConfig` then checks the `delegate` section with
  `checkConfig`. `guidanceFor` reads the guidance for one intent, and
  `questionModeFor` reads `go.questions`. Every error is a `UsageError`,
  exit 2, whose message starts with the file that `fileOf` names.
- `lets go questions` (`lets/src/go/questions.ts`) reads only `version`
  and `go`, and prints `{"questions":<value>}`. Its errors are one line,
  `lets go: <file>: <message>.`. It is the shortest way to see what the
  merged config holds.
- `lets delegate <strategy> instructions --for <intent>` reads the whole
  config, then asks the chain. With no `delegate.resolvers`, the chain is
  `[subagent]` (`lets/src/delegate/lookup.ts`), and `subagent` answers at
  once and runs no program. So a test sees that a config was accepted
  when the JSON line says `"resolver":"subagent"`.
- `configDir` (`lets/src/config-dir.ts`) gives `$XDG_CONFIG_HOME/lets`,
  or `~/.config/lets` when `XDG_CONFIG_HOME` is unset or empty. `lets`
  finds `~` with Node's `os.homedir()`, which reads `HOME`.
- `tests/support/lets.ts` runs `lets/bin/lets` as a program. Its
  `pinnedEnv` sets `XDG_CONFIG_HOME` to a new empty folder for each run,
  but does not set `HOME` or `T3CODE_HOME`. A run option set to
  `undefined` removes a variable.
- `tests/delegate/repo.ts`, from #318, makes the folders for one test:
  a user config home, a Git repository with one commit and an optional
  `.lets/config.yaml`, or a plain folder outside any repository, and a
  stand-ins folder. Its `run` runs `lets` with only the stand-ins and
  `git` on `PATH`, and takes `cwd` and `env` per run.
- `tests/delegate/instructions.test.ts`, from #317, already tests the
  guidance through `lets delegate <strategy> instructions`, with its own
  `instructions(t, strategy, intent, setup)` helper. `run.test.ts` and
  `step.test.ts` already test how the repository's chain replaces the
  user's, a null chain, a bad resolver in either file, a repository's
  lets config with version 2 or that is a folder, and a run from a
  subfolder.

## Goals / Non-Goals

**Goals:**

- Every behavior the 59 removed tests checked is checked by a black-box
  test, except the one the ledger lets go (D6).
- Each removed test is named in the pull request beside the test that
  now covers it.
- No test result depends on the developer's own lets config, home
  folder or T3 server.

**Non-Goals:**

- No change to `lets` (D7), so no new way into it for a test.
- No change to `tests/support/lets.ts` or `tests/delegate/repo.ts`. Both
  already do what these tests need.
- No new tests of `lets go --help` or `lets go questions --help`. The
  `lets go` tests in `tests/lets/delegate/cli.test.ts` cover them (D10).
- No tests of `backlog` in the config (D3), or of the T3 token file (D8).

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program, through
  `runLets` in `tests/support/lets.ts`. The tests read stdout, stderr
  and the exit code.
- **Existing seams reused:** `delegateRepo` in `tests/delegate/repo.ts`
  for the folders, and the `instructions` helper in
  `tests/delegate/instructions.test.ts`.

## Scrutiny Tier & Blast Radius

- **Tier:** low. Tests only, on patterns #317 and #318 set.
- **Blast radius:** `tests/go/questions.test.ts` (new),
  `tests/delegate/instructions.test.ts`, the three deleted test files,
  and one row of the README. `lets` does not change.

## Decisions

### 1. Two places for the new tests

The tests go where the command they run is tested:

- **`tests/go/questions.test.ts`, new,** runs `lets go questions`. It
  holds the place of the user's lets config, what a file must be, how
  the two files merge, which file an error names, and `go.questions`.
  These rules hold for every command, and `lets go questions` shows
  them with the fewest moving parts: it asks no resolver and prints the
  value in effect.
- **`tests/delegate/instructions.test.ts`** gets a new
  `describe('the delegate section of the lets config')`. It holds the
  rules only the delegate commands check: the chain's entries, a bad
  `delegate` or `delegate.resolvers`, and the guidance cases the file
  does not test yet.

Rejected: one new `tests/config/` folder for all of it. The tests run
two commands, and each already has a folder. A third place would split
the guidance tests from the rest of `instructions`.

Rejected: a new `tests/delegate/config.test.ts`. It would need the
`instructions` helper, which lives in `instructions.test.ts`, so it
would copy it or move it.

### 2. `tests/go/questions.test.ts` uses `delegateRepo`

`delegateRepo` already makes every folder these tests need: a user
config home, a repository with `.lets/config.yaml`, a plain folder
outside any repository, and a run with only `git` on `PATH`. The tests
call `repo.run(['go', 'questions'], { cwd, env })`. The `p.md` it writes
does not change what `lets go questions` prints.

The file adds two local helpers, and no others:

- `printed(result)` asserts exit 0, empty stderr and one line on
  stdout, and returns its `questions` value.
- `rejected(result, file, ...named)` asserts exit 2, empty stdout, and
  one stderr line that starts `lets go: <file>: ` and holds each of
  `named`.

Rejected: a new setup in `tests/support/lets.ts`. #308's rule is one
helper module that later stories extend, and `delegateRepo` already does
the job. Moving it to `tests/support/` would touch every delegate test
for no change in behavior. A later story may move it.

### 3. How a test sets the place of the user's lets config

- **`XDG_CONFIG_HOME` set:** the default. `delegateRepo` points it at
  `repo.home`, and `repo.userConfig` is `<home>/lets/config.yaml`.
- **`XDG_CONFIG_HOME` unset or empty:** the run's `env` is
  `{ XDG_CONFIG_HOME: undefined, HOME: <h> }` or
  `{ XDG_CONFIG_HOME: '', HOME: <h> }`, with `<h>` a new temporary
  folder. The test writes `<h>/.config/lets/config.yaml` itself.
- The same test also writes a file under `repo.home` with another value.
  A run with `XDG_CONFIG_HOME` set and `HOME: <h>` shows that the file
  under `<h>/.config` is not read. Without `HOME: <h>`, that run would
  show nothing, because `HOME` would still be the developer's own home.
  So each place is shown to win only when it should, and no test writes
  under the developer's home.

### 4. Keeping the developer's T3 out of a result

`HOME` and `T3CODE_HOME` are not pinned, so a chain that lists `t3` could
reach the T3 server the developer is running. Only one new test lists
`t3` in a chain that is asked: the one that shows all three names are
valid. It sets `T3CODE_HOME` to an empty temporary folder, so `t3`
finds no server and declines. Every other new test leaves `t3` out of
any chain that is asked. A test whose config is rejected before the
chain is asked, such as `[t3, codex]`, needs no such guard.

### 5. What the new tests are

`tests/go/questions.test.ts`, by `describe`:

| Group | Test | What it shows |
|---|---|---|
| where the user's lets config is | Q1 | The file under `XDG_CONFIG_HOME` is read, and a file under `$HOME/.config` is not. |
| | Q2 | With `XDG_CONFIG_HOME` unset, and with it empty, the file under `$HOME/.config` is read. |
| | Q3 | With no file, or only `config.json`, it prints `null`. |
| what a file must be | Q4 | Not YAML, a list, `version: 2`, `version: "3"` and no `version` each exit 2 naming the user's file and the reason. |
| | Q5 | A YAML error ends with where the parser stopped, as one sentence: `line 3, column 1.` |
| | Q6 | A user's or a repository's lets config that is a folder exits 2, naming that file and `EISDIR`. |
| | Q7 | A repository's lets config with `version: 2` exits 2, naming it. |
| go.questions | Q8 | `ask` and `auto` each print as one JSON line. |
| | Q9 | It prints `null` for no `go`, `go:`, `go: null`, `go: {}`, `questions:`, `questions: null`, `go.verbose` alone and `go.level` alone. |
| | Q10 | `go.level: loud` beside `questions: auto` prints `auto`. |
| | Q11 | `go: auto`, `go: [ask]`, and `questions` of `loud`, `[ask]`, `Ask`, `3` and `recommend` each exit 2 with one `lets go:` line naming the file, the key and the value. |
| | Q12 | A `delegate` the delegate commands reject, `delegate: [t3]` among them, and other top-level keys do not stop it. |
| | Q13 | With `[cli]` as the chain and stand-in `codex`, `claude` and `agy` on `PATH`, no stand-in is called. |
| the repository's lets config | Q14 | The repository's `go.questions` wins over the user's. |
| | Q15 | The user's value stays when the repository has no `go`, or `go: null`. |
| | Q16 | With only a repository's lets config, its value is printed. |
| | Q17 | Run from `docs/`, it reads `.lets/config.yaml` at the root. |
| | Q18 | Outside a Git repository, it reads only the user's lets config. |
| | Q19 | A bad `go.questions` in the repository's lets config exits 2, naming that file, the key and the value, and not the user's file. |
| | Q20 | A mapping at `go.questions` in the repository's lets config exits 2, naming that file, alone and over the user's `ask`. |
| | Q21 | `go: 7` in the repository's lets config replaces the user's `go` mapping whole: exit 2, naming that file and `go must be a mapping`. |
| | Q22 | A bad user's `go.questions` under a `go: {}` the repository merges into exits 2, naming the user's file. |
| | Q23 | A YAML alias that holds itself, in the repository's lets config alone and under a key the user's lets config also holds, prints the value in effect and does not loop. |

`tests/delegate/instructions.test.ts`, in the new `describe`, each run
as `lets delegate review instructions --for code` unless it says
otherwise:

| Test | What it shows |
|---|---|
| I1 | `[t3, cli, subagent]` is a valid chain: with `T3CODE_HOME` empty and no CLI, `subagent` answers (decision 4). |
| I2 | `version: 3` alone, `delegate:`, `delegate: null`, `delegate: {}` and `resolvers:` with nothing each give no chain, so `subagent` answers. |
| I3 | A second entry of `codex`, `T3`, `7` or `/opt/r/old-resolver` exits 2, naming the user's file, `delegate.resolvers[1]`, the entry and `t3, cli or subagent`. |
| I4 | Each of the 12 bad documents of the old test exits 2, naming the user's file and the bad value. |
| I5 | A key `lets` does not know, at the top level and under `delegate`, is ignored. |
| I6 | A `go.questions: loud` is ignored. |
| I7 | `step instructions --for build` ignores `review.code.guidance: 42` and `handoff: apply`. |
| I8 | The guidance is `null` when a level is missing: `delegate.review:` with nothing, `review.code` with only `other`, `review.code: {}`, and only `handoff.apply`. |
| I9 | `review: [a]` and `review.code: text` exit 2, naming the user's file and the dotted key, and run no listing. |
| I10 | A repository's `review: [a]` over the user's `review.code.guidance` exits 2, naming the repository's file. |
| I11 | The user's `[cli]` chain, with no CLI, declines, and the message names the user's file, when the repository's lets config sets only `resolvers: null` and a guidance. |
| I12 | In `describe('handoff instructions')`: `step instructions --for build` gets no guidance from `delegate.handoff.apply`. It sits in that block so #306 deletes it with handoff. |

### 6. Where each removed test goes

`tests/lets/delegate/config.test.ts`, by its test name. *Existing* means
a black-box test that is already on this branch; `I` and `Q` are the new
tests above.

| Removed test | Covered by |
|---|---|
| under `~/.config` when `XDG_CONFIG_HOME` is unset | Q2 |
| under `XDG_CONFIG_HOME` when it is set | Q1 |
| no config file reads as null | Q3 |
| a valid config reads as its chain of names, in order | I1; existing *when subagent comes first, it answers, and cli is never asked* for the order |
| no delegate key, or a null one, has no chain | I2 |
| a delegate key with no resolvers, or null ones, has no chain | I2 |
| an entry that is not t3, cli or subagent | I3 |
| an empty chain is a valid config | existing *an empty chain declines every delegation* |
| a key this lets does not know is ignored | I5 |
| review and handoff under delegate are kept as written, unchecked | I7 |
| step under delegate is kept as written, unchecked | existing *a bad entry for another intent, or for another strategy, is not checked*; existing *a step ignores the guidance* in `step.test.ts` |
| guidanceFor gives the guidance for the strategy and the intent | existing *the guidance for the intent comes from the user's lets config* |
| guidanceFor gives the guidance for a step | existing *a step's guidance comes from delegate.step* |
| guidanceFor gives a step no guidance from handoff | I12 |
| guidanceFor keeps a multi-line block whole | existing *a multi-line block keeps its lines* |
| guidanceFor gives null when any level is missing | I2 runs print `guidance: null`; I8; existing *guidance for another intent, or for another strategy, is null* |
| guidanceFor rejects a bad level | I9; existing *bad guidance for the intent is exit 2* |
| guidanceFor ignores a bad entry for another intent or strategy | existing *a bad entry for another intent, or for another strategy, is not checked* |
| an invalid config is a usage error that names the file and the bad value | I4 |
| a config.json with no config.yaml is not read | Q3 |
| a config that is not YAML says where the parser stopped | Q5 |
| parseDocument gives the checked mapping, every key as written | Q12 |
| parseDocument rejects a document that is not a version 3 mapping | Q4 |
| checkConfig drops a go key | I6 |
| questionModeFor gives the question mode the config sets | Q8 |
| questionModeFor gives null when the config sets no question mode | Q9 |
| questionModeFor ignores the old level key under go | Q9, Q10 |
| questionModeFor rejects a bad go or go.questions | Q11 |
| mergeDocuments merges mappings key by key, at every depth | existing *the repository's guidance for one intent wins, and the user's guidance for another stays* |
| mergeDocuments lets a repository string, number or list replace the user's value whole | Q14 (string), Q21 (number), existing *the repository's chain replaces the user's whole* in `run.test.ts` (list), I10 (list over a mapping). The old test's `backlog: 7` is not shown, because no command in this story reads `backlog` (D3). |
| mergeDocuments keeps the user's value where the repository's key is null or absent | Q15; existing *a null chain in the repository's lets config keeps the user's chain* |
| mergeDocuments gives the one document there is, or null for none | Q16, Q18, Q3 |
| fileOf names the repository's lets config for a value that came from it | Q19; existing *a bad resolver in the repository's lets config* and *bad guidance … a number in the repository's config* |
| fileOf names the repository's lets config below a value the repository replaced whole | I10 shows the repository's file is named for the key it replaced, `delegate.review`. A key below it is **not shown**: `guidanceFor` stops at a `delegate.review` that is not a mapping, and every other check stops at its own container, so no command asks for the file of a key below a value that is not a mapping. |
| fileOf names the user's lets config for a value the user set, or that neither file sets | I11 for a value the user set. A key neither file sets: **deleted without cover** (D6). |
| readLetsConfig reads the repository's lets config at the root, over the user's | Q14, I11 |
| readLetsConfig asks git for the root of the folder it runs in | Q17; existing *a review run from a subfolder* |
| readLetsConfig reads only the user's lets config outside a Git repository | Q18; existing *outside a Git repository, instructions read only the user's lets config* |
| readLetsConfig reads only the user's lets config when the repository has none | Q8 and Q15 run in a repository with no `.lets/config.yaml` |
| readLetsConfig gives a null document when there is neither file | Q3 |
| readLetsConfig rejects a repository's lets config with the old version | Q7; existing *a repository's lets config with the old version* |
| readLetsConfig rejects a lets config that cannot be read | Q6 |
| fileOf names the repository's lets config for a mapping it set where a value is expected | Q20 |
| fileOf names the user's lets config for a value the user set under a mapping the repository merged into | Q22 |
| mergeDocuments keeps a recursive alias in the repository's lets config | Q23 |
| mergeDocuments merges a recursive alias the user's lets config shares a key with | Q23, which shows the run ends. The merged value under the alias is not shown, because no command prints it. |

`tests/lets/go/questions.test.ts`:

| Removed test | Covered by |
|---|---|
| prints the question mode the config sets as one JSON line | Q8 |
| prints a null question mode when no config file exists | Q3 |
| prints a null question mode when the config sets none | Q9 |
| reads the file under XDG_CONFIG_HOME | Q1 |
| ignores a delegate chain the delegate commands would reject | Q12 |
| asks no resolver | Q13 |
| a bad config exits 2 with one lets go line | Q4, Q11 |
| prints the repository's question mode over the user's | Q14 |
| prints the user's question mode when the repository's lets config has no go | Q15 |
| a bad question mode in the repository's lets config exits 2 | Q19 |
| a question mode that is a mapping in the repository's lets config | Q20 |

`tests/lets/config-dir.test.ts`:

| Removed test | Covered by |
|---|---|
| the config folder is under XDG_CONFIG_HOME when it is set | Q1 |
| the config folder is under ~/.config when XDG_CONFIG_HOME is unset or empty | Q2 |

### 7. No unit test stays

By the user's answer (D6), every case moves, though `parseDocument`,
`checkConfig` and `mergeDocuments` are pure functions. This departs from
#308's rule that a story never deletes a test whose behavior no
black-box test covers, for the one `fileOf` case above. The pull request
says so, and names the case.

## Risks / Trade-offs

- [A chain with `t3` reaches the developer's running T3 server, because
  `HOME` and `T3CODE_HOME` are not pinned] → Decision 4: only I1 asks
  `t3`, and it sets `T3CODE_HOME` to an empty folder.
- [A test that points `HOME` at a temporary folder changes how `git` or
  Node behave] → `pinnedEnv` already sets `GIT_CONFIG_GLOBAL=/dev/null`
  and `GIT_CONFIG_NOSYSTEM=1`, so `git` reads nothing from `HOME`. Only
  the runs of Q1 and Q2 change `HOME`.
- [A recursive YAML alias makes `lets` loop, and the test hangs] →
  `runLets` stops a run at 30 seconds and fails the test with a message.
- [A behavior a removed test checked is lost] → Decision 6 names the
  cover of each removed test. Three parts of old tests are not shown:
  `backlog: 7` (D3), the merged value under a recursive alias, and
  `fileOf` for a key below a value the repository replaced whole. No
  command reads any of them. The `fileOf` case for a key neither file
  sets goes without cover (D6). The pull request lists all four.
- [Many runs of `lets` slow the suite] → About 70 runs, each a short
  Node process. Node runs the test files in parallel, as it does today.
- [`Q5` checks the YAML library's text, `line 3, column 1.`] → The
  removed test checked the same text, so a change of the library breaks
  no more than before.

## Migration & Rollback

N/A. Only tests change. To undo, revert the commits.
