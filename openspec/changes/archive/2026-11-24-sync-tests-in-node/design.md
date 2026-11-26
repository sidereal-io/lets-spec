## Context

Today three bats files test `lets sync` as a program. They load three
helpers in `tests/support/`:

- `common.bash` pins the locale, git config, author and committer, and
  unsets `WORKFLOW_RELEASE` and `LETS_SPEC_SKILLS`.
- `release.bash` builds a test release with `build/build-release.mjs`,
  from a fixture list of four skills, plus a folder that stands in for
  the generated `openspec-*` skills. It adds a script with mode 755 to
  one skill, then makes the release read-only, as in the Nix store.
- `project.bash` builds one release per file, gives each test a fresh
  git repository holding `openspec/config.yaml` set to `lets-standard`,
  and offers `sync_project`, `init_project`, `rules_in`, `fragment`,
  `shipped_skills`, `snapshot` and `edit_config` (which calls `yq`).

Constraints that shape the approach:

- bats `run` puts standard output and standard error into one
  `$output`. Many checks are "`$output` holds this text" or "`$output`
  is empty".
- The tests `cd` into the project. In Node, `process.chdir` changes the
  whole process, so a helper must pass a working folder to each command
  instead.
- `lets sync` runs `openspec --version`. The flake's `node-tests` check
  has no OpenSpec CLI (D8). The source tree has no `release.json`, so
  any version the stand-in prints gives no version warning.
- Without `WORKFLOW_RELEASE`, `lets sync` looks for
  `lets/releases/<flow>`, where the flow comes from `LETS_SPEC_FLOW`.
  The source tree has no `lets/releases/`.
- `tsconfig.json` type-checks everything in `tests/`, so new helper and
  test files must pass `tsc --noEmit`.
- `node --test "tests/**/*.test.ts"` runs each file in its own process,
  several at once. Tests inside a file run one after another.

## Goals / Non-Goals

**Goals:**

- One helper module that later stories (#310, #311, #314 and the other
  command groups) extend without copying it.
- Each moved test checks what its bats test checks, through `lets` run
  as a program, so a reviewer can compare the two side by side.
- The moved tests run in `pnpm test` and in the flake's `node-tests`
  check with no new tool.

**Non-Goals:**

- New tests or new checks beyond what the bats tests do. One exception:
  the helper fails a run of `lets` that passes its time limit.
- Changes to `lets`, to `tests/lets/sync/`, or to the remaining bats
  files and their helpers.
- A stand-in feature that no test in this story uses, such as several
  answers for one stand-in. The stand-in takes a table from the start,
  because #308 defines it that way and #310 needs it.

## Test Seams

- **Primary test seam:** `lets/bin/lets` run as a program by Node's
  `execFile`, in a temporary git repository, with a test release named
  by `WORKFLOW_RELEASE`. The tests observe exit code, standard output,
  standard error, files and git state.
- **Existing seams reused:** `build/build-release.mjs`, run as
  `tests/support/release.bash` runs it today. The way
  `tests/lets/backlog/cli.test.ts` runs `lets` from a Node test.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. The change is test code only, on patterns the
  project has, but the helper module is a contract every later story of
  #308 builds on.
- **Blast radius:** `tests/support/`, a new `tests/sync/` folder, the
  three sync bats files, and one row of `README.md`. No file under
  `lets/` or `build/` changes.

## Decisions

### 1. The helper module is `tests/support/lets.ts`, and holds only what any command's tests need

It exports:

| Export | What it does |
|---|---|
| `pinnedEnv(extra?)` | The environment for one test: `process.env` without `WORKFLOW_RELEASE`, `LETS_SPEC_SKILLS` and `LETS_SPEC_FLOW`, plus `LC_ALL=C`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, the test author and committer, and `XDG_CONFIG_HOME` set to an empty temporary folder (D6). |
| `runLets(args, options)` | Runs `process.execPath lets/bin/lets <args>` in `options.cwd`, with the pinned environment, `options.standIns` (the folder that `standIn` wrote to, if any) first on `PATH`, and `options.env` on top. Resolves to `{ code, stdout, stderr, output }`, where `output` is `stdout + stderr`. Rejects when the run passes its time limit, 30 seconds unless `options.timeoutMs` says otherwise, with a message that names the command. |
| `tempDir(t)` | Makes a temporary folder and removes it after the test or the file. It makes the tree writable first, because a test release is read-only. |
| `git(cwd, ...args)` | Runs git with the pinned environment. Returns `{ code, stdout, stderr }` and does not throw, so a test can check `git check-ignore`'s exit code. |
| `buildRelease(out, schemas, skills)` | Runs `build/build-release.mjs` on this repository, with a stand-in folder for the generated `openspec-*` skills, as `release.bash`'s `build` does. |
| `standIn(dir, name, table)` | Writes an executable program called `name` into `dir`. `table` is a list of rows `{ args: string[], stdout?: string, stderr?: string, code?: number }`. For each call, it logs the arguments and answers from the first row whose `args` equals the call's argument list. A call that matches no row exits 127 and says so on standard error. Returns `calls()`, which reads the log as one argument list per call (`string[][]`). |
| `snapshot(dir)` | Every path under `dir` with its type, mode and a hash of its content or its link target, plus `.git/info/exclude`, but not git's objects, as `project.bash`'s `snapshot` does. |

Each export has a doc comment that states its preconditions, its result
and how it fails.

*Alternatives:* one module that also holds the sync fixture; or a
folder of small modules. The sync fixture (four skills, a script, a
`lets-standard` config) means nothing to the tests of `lets backlog`,
so it would mislead later stories. A folder of modules splits one small
contract across files. #308 asks for one module.

### 2. The sync fixture lives in `tests/sync/project.ts`, beside the tests that use it

It holds what `release.bash`'s `make_release` and `project.bash` add
for `lets sync`:

- `makeRelease(dir, extraSkills?)`: the four fixture skills, the 755
  script in `lets-verify-contracts`, any extra skills, then read-only.
- `useRelease()`: a `before` hook that builds one release per test file
  (D7), in a `tempDir` that is removed after the file. It returns
  `release()`, which gives the release's path, for the tests that compare
  files with it or copy it, as the bats tests use `$release`.
- `project(t)`: a fresh git repository with
  `openspec/config.yaml` = `schema: lets-standard\n`, and a stand-in
  `openspec` that prints a version (D8). It passes the stand-in folder to
  `runLets` as `standIns`. It returns an object with
  `path`, `read`, `write`, `git`, `sync(args?, env?, cwd?)` and
  `init()`, which runs `lets sync` and checks that it exits 0.
- `rulesIn(text)`, `fragment()`, `shippedSkills()`, `releaseFiles()`.
- `setSchema(text, value)`: replaces or removes the `schema:` line, in
  place of `yq` (D9).

The file is not named `*.test.ts`, so `node --test` does not run it.

### 3. The tests live in `tests/sync/`, one file per bats file, with the bats test names

`tests/sync/rules.test.ts`, `setup.test.ts` and `skills.test.ts`. Each
test keeps its bats name, so a reviewer can match the two. The folder is
new because `tests/lets/sync/` holds the tests with fakes, which #314
retires (D2).

*Alternative:* put them in `tests/lets/sync/`. Mixing the two kinds of
test there makes #314's work harder to see.

### 4. Checks on `$output` become checks on `output`, which is standard output followed by standard error

A bats check that `$output` holds a text checks that `output` holds it.
A check that `$output` is empty checks that both streams are empty. A
check on one stream is a stronger check than today's, so the moved
tests do not add one.

*Alternatives:* run `lets` with both streams sent to one file, as bats
does; or check each message on its own stream. One file keeps the order
the program wrote, but loses the two streams, which later stories need
to read `lets backlog`'s JSON from standard output. Checking each stream
adds checks that the bats tests do not make.

### 5. Each test passes its working folder; no test calls `process.chdir`

`project.sync()` runs in the project root unless the test passes `cwd`,
as "sync works on the whole project when run from a folder inside it"
and the clone and worktree tests do.

### 6. The stand-in is a Node script that names `process.execPath` in its first line

The Nix sandbox may have no `/usr/bin/env`, so `#!/usr/bin/env node`
can fail there. The table goes in a JSON file beside the script. A
shell script would need its own matching code for the table.

### 7. Text that bats builds with `printf` stays byte for byte

Tests such as "sync replaces stale rules, and keeps every byte around
them" and "ignored mode keeps every byte of the project's own
gitignore" build their input from escaped strings. The Node tests write
the same bytes from string literals and compare files as `Buffer`s. A
failure message names the inputs, as the bats `printf '%q'` does.

### 8. The regression test names pull request #32

"the rules say lets sync rewrites the copies, in both skills modes"
keeps its phrase checks and its check that both modes give the same
rules (D12). A comment above it says it guards the regression fixed in
pull request #32, so a later reader can tell why the sentence is fixed.

No decision here needs an architecture decision record: each one lives
in test code and is cheap to change.

## Risks / Trade-offs

- [A check that relied on the order of the two streams in `$output`
  could pass where bats failed, or fail where it passed.] → The builder
  checks each ordered match, such as `"problem(s) to fix"*".gitignore
  has …"`, and keeps it only when both parts are on the same stream.
- [The stand-in's first line is too long for the kernel's limit.] →
  Linux allows 255 bytes, and a Nix store path to `node` is under 100.
  If it fails, the helper writes a `/bin/sh` script that runs the Node
  script.
- [A test release left read-only breaks clean-up, and temporary folders
  pile up.] → `tempDir` makes the tree writable before it removes it,
  as `common.bash`'s `teardown` does.
- [Builds per file make the suite slower than bats.] → One release per
  file, as today (D7). Only "sync preserves project vocabulary while
  installing the real reference" builds full releases, as it does today.
- [The time limit cannot be tested without a `lets` that hangs.] → It
  is not tested in this story. A later story with a stand-in that hangs
  can test it.
- [`pnpm test` on a developer's machine finds a real `openspec` if the
  stand-in is missing.] → Every `project(t)` writes the stand-in, so the
  real CLI is never on the tests' `PATH` first.

## Migration & Rollback

N/A. Rolling back is reverting the commits: the bats files come back
from git, and nothing outside `tests/` and one README row changes.
