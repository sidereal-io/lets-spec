## Context

Two bats files move to Node's test runner:

- `tests/release-build.bats` (16 tests) runs `build/build-release.mjs`
  and `lets/build.mjs`, then checks the folders, files and messages they
  leave. It loads `common.bash` and `release.bash` (for `build` and
  `generated_skills`), and reads YAML with `yq` and `flows.json` with
  `jq`.
- `tests/openspec-compat.bats` (14 tests) runs the real `openspec`
  program on a project linked to each schema, `lets-standard` and
  `lets-minimal`, and checks what the CLI reports and writes. Most tests
  loop over both schemas inside one test. It reads each schema's
  artifact list with `yq` and the CLI's JSON with `jq`, and runs every
  `openspec` call with standard input from `/dev/null`.

The helper module `tests/support/lets.ts`, from #309, already has
`pinnedEnv`, `runLets`, `tempDir`, `git`, `buildRelease`, `standIn` and
`snapshot`. `tests/sync/project.ts` has a private `makeReadOnly`.

Constraints that shape the approach:

- `runLets` runs only `lets/bin/lets`. These tests run `node`,
  `openspec` and the built `lets` bundle, and need the exit code and
  output of a build that fails. `buildRelease` throws on failure.
- bats `run` puts both streams into one `$output`, and `$(…)` drops the
  final newlines. Some checks compare exact text.
- jq's `length` gives 0 for `null`. "archive returns no guidance from
  the standard flow's config" passes today when `operationGuidance` is
  absent, `null` or empty.
- `diff -r` compares the paths and contents of two trees, not modes.
- The flake's `node-tests` check has `node`, `pnpm` and `git`, and
  installs the workspace's packages, so `esbuild` is there for
  `lets/build.mjs`. It has no `openspec` (D7).
- `tsconfig.json` type-checks everything in `tests/`.

## Goals / Non-Goals

**Goals:**

- Each moved test checks what its bats test checks, under the same
  name, so a reviewer can compare the two side by side.
- What both new folders need goes into `tests/support/lets.ts`. What
  one test file needs stays in that file.
- The tests run in `pnpm test` and the flake's `node-tests` check, and
  fail clearly when `openspec` is missing (D10).

**Non-Goals:**

- New checks beyond what the bats tests make. One exception: the setup
  steps throw when a command fails, where bats ignored the failure
  (decision 6).
- Changes to `build/build-release.mjs`, `lets/build.mjs`, the schemas,
  `lets` or the remaining bats file and its helpers (D3, D6).
- A check of the OpenSpec CLI's version (D11).

## Test Seams

- **Primary test seam:** the programs themselves, run by the helper's
  new `run`: `node build/build-release.mjs`, `node lets/build.mjs`, the
  built bundle, and `openspec`. The tests observe exit code, standard
  output, standard error and the files left in a temporary folder.
- **Existing seams reused:** `tests/support/lets.ts` (`pinnedEnv`,
  `tempDir`, `buildRelease`), and the way `tests/sync/` runs a program
  from a Node test.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. Test code only, on the patterns #309 set, but it
  changes the shared helper module, one flake check's inputs and the
  root `package.json`.
- **Blast radius:** `tests/support/lets.ts`, `tests/sync/project.ts`
  (one function moves out), two new folders, the two bats files,
  `package.json`, `pnpm-lock.yaml`, the `node-tests` check in
  `flake.nix`, and one row of `README.md`.

## Decisions

### 1. The tests live in `tests/release/build.test.ts` and `tests/openspec/compat.test.ts`

One Node file for each bats file, in folders beside `tests/sync/`, with
the bats test names. The file names follow the bats files' names, so a
reader can find where a test went. Helpers that only one file uses,
such as `newChange` or `writeArtifact`, stay at the top of that file:
there is no second test file to share them with.

*Alternatives:* one fixture module per folder, as `tests/sync/project.ts`
is; or put both files in one folder. A fixture module pays off only when
several test files share it. One folder would mix two programs under
test.

### 2. The helper module gains `run`, `makeReadOnly`, `generatedSkills` and `tree`

| Export | What it does |
|---|---|
| `run(program, args, options)` | Runs `program` with `args` in `options.cwd`, with the pinned environment and `options.env` on top, and standard input closed, as `</dev/null` gives. Resolves to `{ code, stdout, stderr, output }`, where `output` is `stdout + stderr`, whatever the exit code. Rejects when the program cannot be started, with a message that names it. Node reports a missing `options.cwd` with the same `ENOENT` as a missing program, so the message says the program is not on `PATH` only when `options.cwd` exists, and otherwise says the folder is missing. It also rejects when the run passes its time limit: 30 seconds unless `options.timeoutMs` says otherwise. |
| `makeReadOnly(dir)` | Moves here from `tests/sync/project.ts`, unchanged. The release test "the build works from a read-only source, as in the Nix store" needs it too. |
| `generatedSkills(dir)` | Makes the folder that stands in for the generated `openspec-*` skills and returns its path, as `release.bash`'s `generated_skills` does. `buildRelease` calls it. |
| `tree(dir)` | Every path under `dir`, sorted, with its type and a hash of its content or link target, without modes. Two trees with equal `tree` text pass `diff -r`. |

`runLets` becomes a call to `run` with `process.execPath` and
`lets/bin/lets`, and keeps its contract, including `standIns`. It also
gets standard input closed. No sync test reads standard input, so none
changes.

*Alternatives:* reuse `snapshot` for the tree comparisons; or keep
`run` private to each test file. `snapshot` also compares modes, which
`diff -r` does not, so a schema copied with other modes would fail a
test that passes today. A private `run` in each file copies the time
limit and the environment, which #308 forbids.

### 3. The tests read YAML with the `yaml` package and JSON with `JSON.parse`

`parse` from `yaml` (D12) reads `schema.yaml` for each artifact's `id`,
`requires` and `generates`, and a release's `openspec/config.yaml` for
`schema` and `operations`. `JSON.parse` reads `flows.json` and the
CLI's `--json` output. No test uses `yq` or `jq`.

### 4. The OpenSpec tests run `openspec` from `PATH`, and fail when it is missing

`tests/openspec/compat.test.ts` has one local runner, `openspec(args,
cwd)`, which calls `run('openspec', …)` with `OPENSPEC_TELEMETRY=0` and
`OPENSPEC_NO_UPDATE_CHECK=1` (D5). A `before` hook runs
`openspec --version`. When `run` rejects because the program is not on
`PATH`, or `openspec --version` exits non-zero, as a broken mise shim
does, the hook throws `the OpenSpec CLI is missing from PATH: install
it with mise, or run inside nix develop`, and every test in the file
fails (D10). There is no version check (D11).

Each test keeps its loop over both schemas, as in bats. Every failure
message names the schema, as the bats `echo "$schema: …"` does, so a
reader can tell which schema failed.

*Alternative:* one subtest per schema. It reports each schema on its
own line, but changes the count of tests a reviewer compares with bats.

### 5. Output checks follow the bats checks exactly

- A check that `$output` holds a text checks that `output` holds it.
- A check that `$output` equals a text compares it with `output`
  without its final newlines, as `$(…)` and `run` drop them.
- Where bats sent one stream to a file, the Node test reads that
  stream: standard error for "the standard flow's config names no
  operation the CLI rejects", standard output for each `--json` call.
- "archive returns no guidance from the standard flow's config" treats
  a missing or `null` `operationGuidance` as empty, as jq's `length`
  does.
- `diff -r` becomes equal `tree` text, `diff` and `cmp` of one file
  become equal `Buffer`s, and `ls` becomes a sorted `readdirSync`.
  JavaScript's default sort matches `LC_ALL=C` for these ASCII names.
- `[ -x ]` becomes an `accessSync` with `X_OK`.

### 6. Setup steps throw when a command fails

`newChange` runs `openspec new change demo`, and the JSON readers run
`openspec status` and `openspec instructions`. Bats ignored their exit
codes, and a later check failed with a confusing message. In Node, a
setup step throws with the command's output when it exits non-zero or
prints JSON that does not parse. The checks themselves stay as they
are: archive's refusal, for example, is still judged by its output,
because "archive can report refusal without a nonzero exit".

### 7. The flake's `node-tests` check adds `(packagesFor pkgs).openspec`

It is the flake's wrapper around nixpkgs' `openspec`, which sets
`OPENSPEC_NO_UPDATE_CHECK=1`, as the `commands` check uses (D7). The
check's comment stops saying it runs no real program: it now runs the
real OpenSpec CLI. The `commands` check keeps `bats tests` and its
inputs (D8).

### 8. `yaml` is added to the root `package.json` as `^2.9.1`

`pnpm add -D -w yaml@^2.9.1` writes the root `package.json` and the
root importer of `pnpm-lock.yaml`. `lets` already locks the same
version, so no package is fetched that was not before (D12).

No decision here needs an architecture decision record: each one lives
in test code or the test setup, and is cheap to change.

## Risks / Trade-offs

- [The lockfile change alters the flake's `pnpmDeps` hash, and
  `nix flake check` fails on a hash mismatch.] → The set of packages is
  the same, so the hash should hold. If it does not, the builder puts
  the hash that Nix reports into `flake.nix` in the lockfile's commit,
  task 1.2.
- [A `before` hook that throws may report the file's tests as skipped
  rather than failed, so `pnpm test` could pass.] → The builder checks
  it once, with `openspec` taken off `PATH`, and confirms that
  `node --test` exits non-zero. If the hook does not fail the run, each
  test checks for the CLI itself.
- [Closing standard input in `runLets` changes how a sync test behaves.]
  → No `lets sync` path reads standard input. The full sync suite runs
  in the same task, so a change shows at once.
- [The OpenSpec CLI is slower under Nix, and a run passes the 30-second
  limit.] → Each call is one short CLI run, as in bats today. A slow
  call fails with a message that names it; the limit can then be raised
  for that runner only.
- [Node's runner runs test files in parallel, and the OpenSpec tests
  compete with the sync tests for time.] → Each OpenSpec test works in
  its own temporary folder and shares no state with another file.
- [A check is moved with a subtle change, such as a stream or a final
  newline.] → Decision 5 lists each conversion. The bats file stays in
  git history for comparison, and the review compares test by test.

## Migration & Rollback

N/A. Rolling back is reverting the commits: the two bats files come
back from git, and nothing outside `tests/`, the root `package.json`,
`pnpm-lock.yaml`, one flake check and one README row changes.
