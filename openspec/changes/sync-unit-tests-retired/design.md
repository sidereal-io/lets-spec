<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `tests/lets/sync/` holds 94 tests. They call `run`, `checkConfig`,
  `syncSkills` and other functions of `lets/src/sync/` with the fake
  file system in `fixtures/fake-io.ts`, or with real folders.
- `tests/sync/` holds 67 program tests from #322. They run
  `lets/bin/lets sync` through `runLets` in `tests/support/lets.ts`, in a
  fresh git repository that `project(t)` in `tests/sync/project.ts`
  makes. Each file builds one test release, read-only as in the Nix
  store. A stand-in `openspec` that prints `1.3.0` is first on `PATH`.
- `lets` reads two things beside its own package, which the source tree
  does not have: `release.json`, and `releases/<flow>/` when
  `WORKFLOW_RELEASE` is unset. `packageRoot` is the folder above
  `lets/src/main.ts`.
- `lets` must not change (D3). A new program test runs against
  today's `lets`, so it should pass the first time it runs.
- The testing method is `skills/lets-verify-contracts/SKILL.md`:
  helper contracts and types first, then black-box tests through the
  command. A unit test stays only for a pure function with complex
  branching (D7).

## Goals / Non-Goals

**Goals:**

- Every behavior one of the 94 tests checks is checked by a program
  test, before that test is deleted. The table in decision 1 is the
  checklist.
- The helper module gains only general tools, which later stories of
  #308 can use for other commands.

**Non-Goals:**

- No change to `lets`, to its specs, or to the bats files.
- No new checks beyond what the 94 tests check today.
- No change to the unit tests of other commands, or to their fakes in
  `tests/lets/resolvers/kit/fixtures/` and `tests/lets/delegate/fixtures/`.

## Test Seams

- **Primary test seam:** the `lets sync` command, run as a program by
  `runLets` in `tests/support/lets.ts`.
- **Existing seams reused:** `project(t)`, `makeRelease` and
  `useRelease` in `tests/sync/project.ts`; `standIn`, `snapshot`,
  `tempDir` and `git` in `tests/support/lets.ts`. The only unit seam
  left is `compareVersions` (D7).

## Scrutiny Tier & Blast Radius

- **Tier:** medium. The change touches only tests, but it deletes 90
  of them. The reviewer must check that no behavior loses its only test.
- **Blast radius:** `tests/support/lets.ts` (shared by every program
  test), `tests/sync/`, `tests/lets/sync/`. `lets` and the specs are
  untouched.

## Decisions

### 1. Each retired test maps to one program test

The build works through this table, file by file. *Covered* means a
program test already checks the behavior: delete the unit test. *Extend*
means add a case to the named program test first. *New* means write
the named program test first. A test name in quotes is the program
test's name. Files: `setup` is `tests/sync/setup.test.ts`, `rules` and
`skills` likewise, and `openspec` is the new `tests/sync/openspec.test.ts`
(decision 2).

**`main.test.ts` (24)**

| Unit test | Program test |
|---|---|
| no WORKFLOW_RELEASE is a usage error | Covered: setup "sync refuses to run without a release" |
| a folder that is not a release is refused | Covered: setup "sync refuses a folder that is not a release" |
| a release with two schemas is accepted | Covered: setup "sync copies every schema a release holds" |
| a release with no schema is refused | Covered: setup "sync refuses a release that holds no schema" |
| a release whose config names a schema it does not ship | Covered: setup, same name |
| outside a git repo nothing is written | Covered: setup "sync warns and exits 0 outside a git repo" |
| inside a git repo a valid run exits 0 quietly | Covered: skills "a second sync is quiet and changes nothing" |
| a CLI older than release.json is a warning in the footer | New: openspec, the package's own release, older CLI warns |
| a WORKFLOW_RELEASE outside the package still warns | New: openspec, `WORKFLOW_RELEASE` set, older CLI warns |
| no openspec on PATH is a problem to fix | New: openspec, no CLI, exact standard error |
| … with a release.json | New: openspec, no CLI with a `release.json`, exact standard error |
| an openspec that exits non-zero counts as missing | New: openspec, stand-in exits 1 |
| openspec --version runs once, in the project root | New: openspec, run from a sub-folder, one call in the root |
| an openspec that prints no version gets no CLI message | New: openspec, stand-in prints nothing |
| check fails on a missing openspec, committed mode | New: openspec |
| check fails on a missing openspec, ignored mode | New: openspec |
| check passes with an installed openspec | Covered: rules "check passes when the rules are current" |
| check passes with an openspec older than release.json | New: openspec |
| an empty LETS_SPEC_SKILLS means committed | New: skills, `LETS_SPEC_SKILLS=''` writes no `.gitignore` block and says "Commit them." |
| ignored mode, tracked copies are a problem | Covered: skills "switching to ignored says what to untrack until the copies are untracked" |
| ignored mode, no tracked copies, no problem | Covered: the same test's last run |
| ignored mode, a failed git ls-files counts as nothing tracked | New: skills, decision 7 |
| a release that ships an unowned skill writes nothing | New: setup, exit 1, the message, and `snapshot` unchanged |
| ignored mode, check refuses an unowned skill | New: setup |

**`config.test.ts` (17)**

| Unit test | Program test |
|---|---|
| reads a bare value | Covered: setup "a config sync just created needs no settings" |
| reads a quoted value | New: setup "sync reads each form of the schema line", one run per form |
| ignores a trailing comment | New: the same test |
| ignores an indented schema key | New: the same test, warns "sets no schema" |
| an empty value is null | Covered: setup "sync warns when the config has a schema it cannot read"; `schema: # nothing` goes in the new test |
| uses the first top-level schema line, tolerates CRLF | New: the same test |
| checkConfig warns when the config is missing | Covered: setup "sync keeps a config link that points nowhere, and warns" |
| … when no schema is set | Covered: setup "sync warns when the config sets no schema" |
| … on a wrong schema | Covered: setup "sync warns when the config names another schema" |
| … quiet for the right schema, quoted or commented | New: the forms test |
| … a folder at the config path is missing | New: setup |
| … the code review rule release 0.7.0 wrote | Covered: setup "sync lists the code review rule release 0.7.0 wrote, once" |
| … warns once however many lines name it | New: setup, two lines name `lets-review-code`, one warning |
| … ignores lets-review-code in a comment | Extend: setup "sync ignores lets-review-code in the config's comments" with an indented comment and `y: "a" # lets-review-code` |
| … lets-review-code after a # inside quotes | New: setup, double and single quotes |
| … quiet for the standard config this release writes | Covered: setup "a config sync just created needs no settings" |
| … a schema problem, then the lets-review-code problem | Extend: setup "sync lists a wrong schema beside the code review rule" checks the order |

**`release.test.ts` (17)**

| Unit test | Program test |
|---|---|
| WORKFLOW_RELEASE wins over the flow | New: setup, `LETS_SPEC_FLOW=jira` with `WORKFLOW_RELEASE` set exits 0 |
| the default flow is standard under packageRoot/releases | New: setup, package copy with `releases/standard`, no `WORKFLOW_RELEASE` |
| LETS_SPEC_FLOW picks the flow | New: setup, package copy with `releases/standard` and `releases/minimal`, told apart by an extra skill |
| a missing flow names the variable | New: setup, `LETS_SPEC_FLOW=jira`, the full message with `<repo>/lets/releases/jira` |
| no release.json means no version warning | Covered: every program test runs the source tree, which has none, and sees no warning |
| a release.json that is not JSON | New: openspec |
| an unknown CLI version | Covered by the New openspec test for a stand-in that prints nothing |
| the same version | New: openspec "same or newer", two runs |
| the same version with build metadata | Kept: `compareVersions` "build metadata is ignored" (decision 8) |
| a newer CLI | New: the "same or newer" test |
| an older CLI is warned about | New: the two openspec older-CLI tests above |
| an older patch, compared as a number | Kept: `compareVersions` "compare … as numbers" |
| a prerelease of the recorded version | Kept: `compareVersions` "a prerelease is older" |
| 4 `compareVersions` tests | Kept (D7) |

**`init.test.ts` (3)**

| Unit test | Program test |
|---|---|
| each missing init file is copied and named, an existing one kept | Covered: setup "sync creates each file the project needs" and "sync never edits the project's own config". Extend the first: the created config has mode 644, from a read-only release |
| linkClaude links both paths once | Covered: setup "sync creates each file …" and skills "a second sync is quiet" |
| checkClaude warns about each wrong link | Covered: setup "sync keeps a CLAUDE.md that is a file" and "… a .claude/skills that is a folder" |

**`managed.test.ts` (6)**

| Unit test | Program test |
|---|---|
| lets-, openspec- skills and lets- schemas are managed | Covered: skills "sync copies each skill and the schema into the project" |
| a project skill of another name is not managed | Extend: skills "a skill of another name is left alone" also writes `.agents/skills/xlets-build` and `openspec/schemas/mine` |
| releasePaths lists each skill folder and the schema | Covered: skills "sync copies each skill …" |
| a release that ships an unmanaged name is refused | Covered by the New setup unowned-skill test |
| projectPaths lists the managed paths, links included | Covered: skills "a project synced by the linked layout becomes copied" and "a skill the new release no longer ships is removed" |
| projectPaths is empty in a bare project | Covered: every first sync |

**`skills.test.ts` (16)**

| Unit test | Program test |
|---|---|
| a missing file is written 0755 or 0644 | Covered: skills "a script keeps its executable bit" |
| in the ignored mode, written files are ignored by git | Covered: skills "ignored mode writes the gitignore block …" |
| a differing file is rewritten and counted | Covered: skills "a changed file is rewritten and reported" |
| right bytes, no execute bit, is rewritten | New: skills, `chmod 644` the script, sync writes 1 file, mode 755 |
| a mode that differs only in write or group bits is left alone | New: skills, modes 664 and 775, `--check` passes, sync writes nothing |
| an identical tree writes nothing | Covered: skills "a second sync is quiet and changes nothing" |
| a file the release no longer has is removed | New: skills, an extra file in `lets-build` is removed |
| lets-spawn loses the skill, scripts and all | Covered: skills "a skill the new release no longer ships is removed" |
| a managed path the release does not ship is removed and reported | Extend: skills "a skill the new release no longer ships is removed" also writes `openspec/schemas/lets-old`, which is removed and reported. The link case is covered by the linked-layout test |
| a symlink at a managed path is replaced by files | Covered: skills "a project synced by the linked layout becomes copied" |
| a path not ours by name is kept | Covered: skills "a skill of another name is left alone" |
| checkSkills names each stale, missing or extra file | Covered: skills "--check fails on a stale file …" and "… on a missing skill and on an extra file". Extend the second with an extra skill folder `.agents/skills/lets-old` |
| on disk, a read-only script is copied 755, and updated | Covered: skills "a script keeps its executable bit" and "a changed file is rewritten" |
| on disk, a folder link inside a managed path | New: skills, the link's target is untouched, the folder is real, `--check` passes after |
| on disk, a dangling folder link inside a managed path | New: skills |
| on disk, a folder where the release has a file | New: skills, `--check` names it, sync replaces it, `--check` passes |

**`block.test.ts` (11)**

| Unit test | Program test |
|---|---|
| absent, missing, current, stale and unpaired told apart | Covered: the rules tests for each state. Extend rules "sync leaves rules with an unpaired marker unchanged" with two whole blocks |
| begin marker as a prefix, end marker as a whole line | Prefix covered: rules "sync rewrites a 0.4.0 rules block once". Extend the unpaired test with an end marker followed by a space |
| a block with the 0.4.0 begin line is stale | Covered: rules and skills 0.4.0 tests |
| missing appends after a blank line, ends a last line | Covered: rules "sync appends the rules after a blank line" and "sync ends the project's last line". Extend the first with an empty `AGENTS.md` |
| stale replaces only the lines between the markers | Covered: rules "sync replaces stale rules, and keeps every byte around them" |
| current and unpaired return the text unchanged | Covered: rules "sync leaves current rules unchanged" and the unpaired test |
| a body with a backslash and a dollar sign | Extend: rules "sync keeps a backslash in the rules as written" adds `$1 $& $\` $'` to the line |
| renderBlock adds the newline a body lacks | New: rules, a release whose rules lack a final newline still ends the block with the end marker on its own line |
| removeBlock leaves the project lines | Covered: skills "switching to committed …" tests. Extend "… leaves an empty gitignore" to start from an empty `.gitignore`, which leaves a blank line before the block |
| the skills block renders the three patterns | Covered: skills "ignored mode writes the gitignore block …" compares the whole file |
| the marker definitions match the bash script | Extend: rules "sync creates AGENTS.md holding only the rules block" checks the exact begin and end lines. The skills markers are covered by the whole-file check above; the links markers by the skills tests that write them |

Rows marked Extend are gaps the planning found beyond D5. Each is a case in an existing test,
by D2's rule that no test goes before its behavior has a program test.

### 2. Where the new program tests go

- `tests/sync/openspec.test.ts`, new: the OpenSpec CLI checks and the
  version warning. They share the package copy (decision 3) and the
  `PATH` without the CLI (decision 4), which no other file needs.
- `tests/sync/setup.test.ts`: the flow choice, the unowned skill and
  the config warnings, beside the release and config tests already
  there.
- `tests/sync/skills.test.ts`: the copy cases, the empty
  `LETS_SPEC_SKILLS` and the failed `git ls-files`.
- `tests/sync/rules.test.ts`: the rules-block cases.

Alternative: one new file for every new test. Rejected: a reader looks
for a behavior beside the tests of the same part of `lets sync`.

### 3. A copy of the lets package for `release.json` and `releases/` (D8)

New in `tests/support/lets.ts`:

```ts
export interface LetsPackageOptions {
  /** The text of release.json. No file when absent. A string, so a test can write one that is not JSON. */
  releaseJson?: string;
  /** Each flow's release folder, linked as releases/<flow>. */
  releases?: Record<string, string>;
}
/** A copy of lets/ (bin/, src/, package.json, a link to lets/node_modules) in a temporary folder removed after `t`. Returns its folder. Throws when lets/node_modules is missing, and says to run pnpm install. */
export function letsPackage(t: TestContext, options?: LetsPackageOptions): string;
```

`RunLetsOptions` gains `lets?: string`, the package folder whose
`bin/lets` runs; `<repo>/lets` when absent. The release folders are
links, because `findRelease` checks `releases/<flow>` with `stat`,
which follows a link. Building a second release costs a build; the
flow test builds one with `makeRelease(dir, ['lets-flow-minimal'])` so
it can tell the two flows apart by the skill.

Alternative: copy the whole `lets/` folder. Rejected: `node_modules`
holds links into the pnpm store, and a copy is slow and gains nothing.

### 4. A `PATH` without the OpenSpec CLI

New in `tests/support/lets.ts`:

```ts
/** A new folder, removed after `t`, holding a link to each of `programs` as found on this process's PATH. Set PATH to it to run lets with only those programs. Throws when a program is not on PATH. */
export function pathWith(t: TestContext, programs: string[]): string;
```

A test passes `{ PATH: pathWith(t, ['git']) }` as its environment
change. `options.env` is applied after the stand-in folder is added, so
this `PATH` holds no stand-in and no real `openspec`, whatever the
machine has installed. `lets sync` starts only `git` and `openspec`,
and `runLets` starts Node by its full path.

Alternative: rely on the test machine having no OpenSpec CLI.
Rejected: a developer's machine has one, through mise.

### 5. A stand-in records the folder each call ran in

`standIn` logs each call as `{ args, cwd }`. `StandIn.calls()` returns
what it does today. A new `StandIn.folders(): string[]` returns the
folder of each call, in order. The CLI is outside `lets`, so which
folder `lets` starts it in is observable behavior: a mise shim picks
its tool by that folder (ADR-027).

### 6. `Project` exposes its stand-in folder and the package to run

In `tests/sync/project.ts`:

- `Project.bin`: the folder of the project's stand-ins, first on
  `PATH`. A test replaces the `openspec` stand-in with
  `standIn(p.bin, 'openspec', rows)`.
- `Project.sync(args?, env?, where?: { cwd?: string; lets?: string })`
  replaces the third parameter `cwd`. The three calls that pass a
  `cwd` today change to `{ cwd }`.

### 7. A failed `git ls-files` comes from a broken index (D6)

The test commits a synced project, writes bytes that are not an index
into `.git/index`, then runs `lets sync` in the ignored mode. It first
checks that `git ls-files` exits non-zero and `git rev-parse
--show-toplevel` exits 0, so a git that recovers the index fails the
test rather than passing it with nothing proved. Then it checks the
run exits 0 and its output lacks "git still tracks".

### 8. Version comparisons stay in the kept unit tests

The program tests check the wiring: an older CLI warns, the same and a
newer one do not, and an unreadable `release.json` or version gives no
warning. The comparison rules, such as numbers compared as numbers,
prereleases and build metadata, are the 4 kept `compareVersions` tests
(D7). Each would otherwise be another package copy and sync run.

### 9. The kept unit tests stay in `tests/lets/sync/release.test.ts`

The file keeps only the 4 `compareVersions` tests, and imports only
`compareVersions`. It mirrors `lets/src/sync/release.ts`, as the other
unit tests under `tests/lets/` mirror their sources.

### 10. `config-0.7.0.yaml` moves to `tests/sync/fixtures/`

`tests/sync/setup.test.ts` is its only reader (D9), so it moves beside
that test, and the path in `setup.test.ts` changes.
`tests/lets/sync/fixtures/` then goes, with `fake-io.ts`.

### 11. New tests first, deletions last

Each unit test file goes in the same commit as the program tests that
take over its behaviors, so no commit leaves a behavior untested. A new
program test should pass on its first run, because `lets` does not
change. If one fails, the test is wrong or `lets` has a bug: stop and
report it, and never change `lets` in this change (D3).

## Risks / Trade-offs

- [A unit test is deleted while its behavior has no program test] →
  The build ticks each row of decision 1, and the pull request lists
  the kept tests (D12). The review checks the table against the diff.
- [`pathWith` links `git`, and a git started through a link may not
  find its helpers in the Nix sandbox] → `nix flake check` runs the
  tests. If it fails there, write a Node stand-in that runs the real
  git by its full path instead of a link.
- [A package copy misses a file `lets` reads at run time] → The test
  then fails loudly, rather than passing. Copy what is missing.
- [The broken-index trick stops working with a later git] → Decision 7's
  first check fails the test with a clear message.
- [About 30 more program tests make `pnpm test` slower] → Each runs one
  or two syncs against a release built once per file. Measure the time
  before and after, and say it in the pull request.

## Migration & Rollback

N/A. Only tests change. Reverting the change's commits restores the
unit tests.
