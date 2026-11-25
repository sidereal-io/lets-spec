<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- Build order follows the lets-verify-contracts skill, not test-first:
     helper contracts and types, then their implementation, then
     black-box tests through `lets sync` run as a program. design.md's
     decision 1 is the row-by-row checklist for section 3: write or
     extend the program tests a unit test file's rows name, then delete
     that file in the same task. lets does not change (D3): a new
     program test that fails means the test is wrong or lets has a bug;
     stop and report it. -->

## 1. Contracts

- [x] 1.1 [medium] `tests/support/lets.ts` declares `letsPackage(t, options?)` and `LetsPackageOptions` (design decision 3), `pathWith(t, programs)` (decision 4), `StandIn.folders()` (decision 5) and `RunLetsOptions.lets` (decision 3), each with a doc comment that states its preconditions, its result and how it fails. New bodies throw `not built yet` (verify: `pnpm check`) (✓ `pnpm check` passed)
- [x] 1.2 [easy] `tests/sync/project.ts` gives `Project` a `bin` field and changes `sync`'s third parameter to `where?: { cwd?: string; lets?: string }` (decision 6). The seven existing calls that pass a folder (two in `tests/sync/setup.test.ts`, five in `tests/sync/skills.test.ts`) pass `{ cwd }`, and every existing program test still passes (verify: `pnpm check && node --test "tests/sync/*.test.ts"`) (✓ `pnpm check` and the 67 program tests passed)

## 2. Helper implementation [depends-on: 1]

- [x] 2.1 [medium] `letsPackage` copies `lets/bin`, `lets/src` and `lets/package.json` into a temporary folder removed after the test, links `node_modules` to `lets/node_modules`, writes `release.json` when given, links each `releases/<flow>`, and throws with a "run pnpm install" message when `lets/node_modules` is missing. `runLets` runs `<options.lets>/bin/lets` when `lets` is set. (verify: `pnpm check && node --test "tests/sync/*.test.ts"`) (✓ `pnpm check` and the 67 program tests passed; a copy run with its own `release.json` printed that version)
- [x] 2.2 [easy] `pathWith` makes a folder with a link to each named program found on `PATH`, and throws naming a program it cannot find. `standIn` logs each call with its folder, `calls()` returns what it did before, and `folders()` returns each call's folder in order (verify: `pnpm check && node --test "tests/sync/*.test.ts"`) (✓ `pnpm check` and the 67 program tests passed)

## 3. Program tests take over each unit test file [depends-on: 2]

Each task works through its file's rows in design decision 1: write
each *New* test, add each *Extend* case, then delete or trim the unit
test file. No task here is `[parallel]`: they share the program test
files.

- [x] 3.1 [complex] Every row of `tests/lets/sync/main.test.ts` has its program test: the new `tests/sync/openspec.test.ts` holds the OpenSpec CLI checks (no CLI on `PATH`, with and without `release.json`; a CLI that exits 1; one call, in the project root, from a sub-folder; a CLI that prints no version; `--check` in both modes; the older-CLI warning from the package's own release and from `WORKFLOW_RELEASE`; `--check` passing with an older CLI); `tests/sync/setup.test.ts` holds the two unowned-skill tests; `tests/sync/skills.test.ts` holds the empty `LETS_SPEC_SKILLS` test and the broken-index test of decision 7. Then `main.test.ts` is deleted (verify: `node --test tests/sync/openspec.test.ts tests/sync/setup.test.ts tests/sync/skills.test.ts && test ! -e tests/lets/sync/main.test.ts`) (✓ the verify command passed: 65 tests, `main.test.ts` gone)
- [x] 3.2 [medium] Every row of `tests/lets/sync/release.test.ts` has its program test: `openspec.test.ts` adds a `release.json` that is not JSON and a CLI the same as or newer than `release.json`; `setup.test.ts` adds the four flow tests (`WORKFLOW_RELEASE` wins over `LETS_SPEC_FLOW`, the default flow, `LETS_SPEC_FLOW=minimal` told apart by a `lets-flow-minimal` skill, and the full missing-flow message). Then `release.test.ts` keeps only the 4 `compareVersions` tests and imports only `compareVersions` (decisions 8 and 9) (verify: `node --test tests/sync/openspec.test.ts tests/sync/setup.test.ts tests/lets/sync/release.test.ts && ! grep -q fake-io tests/lets/sync/release.test.ts`) (✓ the verify command passed: 44 tests; `release.test.ts` holds 4)
- [x] 3.3 [medium] Every row of `tests/lets/sync/config.test.ts` has its program test in `setup.test.ts`: one test runs each form of the `schema:` line (quoted both ways, a trailing comment, an indented key, `schema: # nothing`, CRLF with two lines), plus a folder at the config path, two lines naming `lets-review-code` warned once, `lets-review-code` after a `#` inside quotes, the extra comment cases, and the schema warning listed before the code review warning. `config-0.7.0.yaml` moves to `tests/sync/fixtures/` (decision 10). Then `config.test.ts` is deleted (verify: `node --test tests/sync/setup.test.ts && test ! -e tests/lets/sync/config.test.ts && test -e tests/sync/fixtures/config-0.7.0.yaml`) (✓ the verify command passed: 32 tests)
- [x] 3.4 [easy] Every row of `tests/lets/sync/init.test.ts` and `tests/lets/sync/managed.test.ts` has its program test: the created `openspec/config.yaml` has mode 644 from a read-only release, and `.agents/skills/xlets-build` and `openspec/schemas/mine` are left alone. Then both files are deleted (verify: `node --test tests/sync/setup.test.ts tests/sync/skills.test.ts && test ! -e tests/lets/sync/init.test.ts && test ! -e tests/lets/sync/managed.test.ts`) (✓ the verify command passed: 63 tests)
- [x] 3.5 [complex] Every row of `tests/lets/sync/skills.test.ts` has its program test in `tests/sync/skills.test.ts`: a script with the right bytes and no execute bit is rewritten 755; modes 664 and 775 are left alone and pass `--check`; a file the release dropped is removed; a stale `openspec/schemas/lets-old` is removed and reported; `--check` names an extra skill folder; a folder link, a dangling folder link, and a folder where the release has a file are each replaced, leaving a link's target untouched. Then the unit file is deleted (verify: `node --test tests/sync/skills.test.ts && test ! -e tests/lets/sync/skills.test.ts`) (✓ the verify command passed: 37 tests)
- [x] 3.6 [medium] Every row of `tests/lets/sync/block.test.ts` has its program test: in `tests/sync/rules.test.ts`, two whole blocks and an end marker followed by a space are unpaired, an empty `AGENTS.md` gains a blank line and the rules, `$1 $& $\` $'` in the rules are kept byte for byte, rules that lack a final newline end with the end marker on its own line, and a new `AGENTS.md` starts and ends with the exact marker lines; in `tests/sync/skills.test.ts`, an empty `.gitignore` becomes empty again after switching to committed. Then `block.test.ts` is deleted (verify: `node --test tests/sync/rules.test.ts tests/sync/skills.test.ts && test ! -e tests/lets/sync/block.test.ts`) (✓ the verify command passed: 55 tests)

## 4. Integration [depends-on: 3]

- [x] 4.1 [easy] `tests/lets/sync/fixtures/` is gone with `fake-io.ts`, nothing under `tests/` names it, and `tests/lets/sync/` holds only `release.test.ts` (D9) (verify: `test ! -e tests/lets/sync/fixtures && ! git grep -n 'sync/fixtures/fake-io' tests`) (✓ the verify command passed, and `pnpm check` too)
- [x] 4.2 [medium] Every check passes: `pnpm test`, `mise run check`, and `nix flake check`, whose `node-tests` check runs the program tests with no OpenSpec CLI. The pull request description lists the 4 kept `compareVersions` tests with their reason (D7, D12), and gives the time `node --test "tests/sync/*.test.ts"` took before and after the change (verify: `nix flake check`) (✓ `pnpm test` (911 tests), `mise run check` and `nix flake check` passed; the pull request lists the 4 kept tests and the time, 66–70 s before and 79–87 s after)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
