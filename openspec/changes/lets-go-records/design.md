## Context

- `lets go` has one command today, `lets go questions`, in `lets/src/go/questions.ts`. It runs through `guarded()` with the prefix `lets go: `, takes its process access from `Deps`, and is registered in `lets/src/main.ts` with a help text, `GO_QUESTIONS_HELP`.
- The only `lets` code that calls `gh` today is the backlog's GitHub adapter, `lets/src/backlog/github.ts`. Its small `ghRunner` turns a run into `ok` or a message, with a 60-second read timeout. No `lets` code runs `git log` yet.
- ADR-021 places a call in `lets` code when the task joins several calls or decides something. Dating four Skip lines joins three `git log` reads, an archive folder lookup, a pull request read, a section parse and one more `git` read, so it moves into `lets`. ADR-021's sentence that pull request reads stay in the skills still holds for the walk's own reads: the done tests keep their `gh pr view`.
- `lets-go`'s *Walk the step table* already links *A stop in an epic run* for its stops. *The step lines* holds no stop. *The step table* and *Placeholders* point `<pr>`, `<sha>` and `<verdict>` at *Read the records*.
- The Node tests run `lets` as a program. `tests/support/lets.ts` gives `runLets`, `git`, `tempDir` and `standIn`, which writes a stand-in program that answers from a table. `tests/backlog/github.ts` puts a stand-in `gh` on `PATH` this way.
- The contract tests in `tests/contracts/` already check each `lets` command a text names (`commands.test.ts`) and each link and anchor (`links.test.ts`). They will check the new text without new code.

## Goals / Non-Goals

**Goals:**

- One read per Skip line, made by code that tests can drive, in place of prose the agent follows.
- A JSON shape that #268 can extend by adding fields to each record, without changing the keys.
- `lets-go`'s text gets shorter: *Read the records* and its commands leave the skill.

**Non-Goals:**

- Deciding whether a step is done, or reporting records that disagree. `lets-go` keeps both, and #268 moves them.
- Reading the flow's schema, the pull request's state or draft flag, or the **Code review** section.
- Changing any Skip line's wording.
- Checking the record fields a text names against `lets go records --help`, as `fields.test.ts` does for `lets backlog`. The text names four fields, and review checks them.

## Test Seams

- **Primary test seam:** `lets go records` run as a program, in `tests/go/records.test.ts`. Each test makes a temporary Git repository with `git`, sets `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` on each commit, puts a stand-in `gh` on `PATH` that answers `pr view` from a table, and asserts the exit code, stdout and stderr. The tests read each expected short hash from the repository with `git log`, so no hash is hard-coded.
- **Existing seams reused:** `tests/support/lets.ts` (`runLets`, `git`, `tempDir`, `standIn`, `pathWith`); the contract tests in `tests/contracts/` for `lets-go`'s new text, unchanged; the help tests' pattern from `tests/go/questions.test.ts`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One new command on the patterns `lets go questions` and the backlog adapter set. It adds a JSON contract that #268 builds on, and a new place where `lets` runs `gh` and `git`. It reads only, and writes nothing.
- **Blast radius:** `lets/src/go/`, `lets/src/main.ts`, `skills/lets-go/SKILL.md`, `skills/lets-go/references/records.md`, `AGENTS.md` (*Fields a text reads*), and the README's `tests/` row. A wrong record makes `lets-go` print a wrong Skip line or stop on a false disagreement. It cannot change a branch, a pull request or the backlog.

## Decisions

### 1. `lets` runs `git` and `gh` itself, through `Deps`

`lets/src/go/records.ts` takes `Pick<Deps, 'io' | 'cwd' | 'stdout' | 'stderr'>` and runs every command with `io.execFile`, as `questions.ts` and the backlog do. It does not go through the backlog adapter: the backlog is the GitHub Project, and a pull request belongs to the code host. A small runner local to `records.ts`, shaped like `ghRunner`, turns each run into its stdout or a failure message.

- *Alternative:* the skill runs `gh pr view` and passes the body to `lets go records` on stdin. That keeps `gh` out of `lets`, but the agent still makes a read, and the command cannot tell "no pull request" from "the agent forgot".
- *Alternative:* share one `gh` runner between the backlog and `go`. Worth it once a third caller appears. Today the two differ in errors: the backlog maps to `not-found` and `backend-failed`, and this command maps to `null` and exit 4.

### 2. The reads

Every `git` command runs at the repository root, found with `git rev-parse --show-toplevel` from `cwd`. The format `%h%x00%as` keeps the hash and the date apart.

| Record | Read |
|---|---|
| `plan` | `git log -1 --diff-filter=A --format=%h%x00%as -- openspec/changes/<name>/tasks.md` |
| `build` | `git log -1 --diff-filter=M --format=%h%x00%as -- openspec/changes/<name>/tasks.md` |
| `review-build` | List `<root>/openspec/changes/archive/`, and keep the names that match `^\d{4}-\d{2}-\d{2}-<name>$`. With exactly one, `git log -1 --diff-filter=A --format=%h%x00%as -- openspec/changes/archive/<folder>/tasks.md`. `io.listDirs` throws when the folder is missing, as in a repository that has archived nothing, so the command checks with `io.exists` first, and a missing folder is a `null` record |
| `review-plan` | `gh pr view <name> --json number,body`, then the section parse below, then `git rev-parse --verify --quiet --end-of-options <sha>^{commit}` and `git log -1 --format=%as <oid>` |
| `pr` | The `number` from the same `gh pr view`, run once for both records |

`git log` printing nothing is a `null` record, not a failure. `git rev-parse --verify --quiet` exits 1 and prints nothing for a commit it cannot find, which is a `null` review plan record. Any other non-zero exit from `git` is exit 4.

These are the commands `references/records.md` gives the agent today, so the Skip lines print what they print now.

### 3. The section parse is a pure function

`planReview(body)` returns `{ sha, verdict }` or `null`. It splits on `\r?\n`, finds the first line equal to `## Plan review` after trailing spaces are trimmed, and stops at the next line that starts `## `. Inside, it takes the first line that starts `Reviewed: ` and the first that starts `- **Verdict:** `, trims each value, and returns `null` when either is missing or empty. A `<sha>` that does not match `^[0-9a-f]{4,40}$` gives a `null` record before `git` sees it, so `HEAD` or `--all` never reaches `git` as a revision or an option. `--end-of-options` stays as a second guard.

These are the rules of `lets-review-plan`'s *Check an earlier review*, which writes and reads the same section.

### 4. "No pull request" is told apart by gh's message

`gh pr view <branch>` exits 1 with `no pull requests found for branch "<branch>"` on stderr when the branch has none. The command treats a non-zero exit whose stderr matches `/no pull requests found/i` as no pull request: `pr` is `null` and so is the review plan record. Any other failure, a timeout of 60 seconds, or stdout that is not JSON with a whole-number `number` and a string `body`, is exit 4 with gh's message.

### 5. Errors and exit codes reuse the kit's

A bad or missing name is a `UsageError`, exit 2: Commander's own error for a missing argument, and a `UsageError` for a name that fails `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`. A failed read is a `SpawnError`, exit 4, whose meaning in the kit is "an error an adapter did not expect". `guarded()` with the prefix `lets go: ` prints the one stderr line. The name check runs before any read, so a name such as `../x` or `--all` never reaches a path or `gh`.

### 6. The output is built in key order

The command builds the object with its keys in step order, and each record with `commit` and `date` first, then `pr`, then `verdict`, and prints `JSON.stringify` of it and a newline. JSON keeps the order, and the tests assert it.

### 7. `lets-go` reads the records in *Walk the step table*

The **Done** bullet of *Walk the step table* says to run `lets go records <name>` at the row, take the record under the row's *Step* key, and fill the Skip line from it. It also holds the two new stops, because that section already links *A stop in an epic run*: a non-zero exit, and a `null` record for a row it settles as done, except review plan on `lets-minimal`. *The step lines* says which record field fills which placeholder. *Placeholders* points `<pr>`, `<sha>` and `<verdict>` at the command. *Records that disagree* swaps its last table row for the `null` record. `references/records.md` loses *Read the records*, and its opening line becomes "Read this file when the records disagree."

The record fields are another program's fields, so the text writes them in plain code font without the word field, as `AGENTS.md`'s *Fields a text reads* says for `lets go questions`. `AGENTS.md` adds `lets go records` to that list.

### 8. No new decision record

The placement of the reads follows ADR-021, and `lets-go` still keeps no log of its own, as ADR-017 says. The JSON shape is a contract, but #268 extends it next and the brainstorm settled it (D2). Nothing here is costly to reverse beyond what those records cover.

## Risks / Trade-offs

- [gh changes its "no pull requests found" message] → The command exits 4 with gh's message instead of printing `null`, so `lets-go` stops and shows it. A stop is loud, not a wrong line. The test pins the message the stand-in gives.
- [Each Skip row runs `gh pr view` again, up to three per run, beside the walk's own read] → A read takes about a second, and a resumed run prints at most four Skip lines. #268 can fold the walk's read into the command.
- [`lets go records` reads the local branch, which can be behind `origin`] → `lets-go` fetches and fast-forwards before it reads any record, as today.
- [A text names a record field that `lets` renames] → No contract test catches it (a non-goal). The help names every field, and the plan review checks the text against it.
- [The skill and `lets` drift: a project syncs the new skill with an old `lets`] → `lets sync` installs both from the same pinned release, so they ship together. An old `lets` makes `lets go records` fail with a usage error, and `lets-go` stops.

## Migration & Rollback

N/A for data. The new skill text needs a `lets` that has `lets go records`, and the release ships both. To roll back, revert the change: the skill's old *Read the records* comes back with it.
