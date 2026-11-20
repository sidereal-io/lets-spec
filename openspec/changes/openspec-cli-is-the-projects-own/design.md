<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `openspecVersionWarning` in `lets/src/sync/release.ts` reads the package's `release.json`, runs `openspec --version` with the release folder as its working directory, and returns a warning when the two versions differ. It returns `null` when `release.json` is absent or unreadable, when the command fails, or when no version is found. So today a missing CLI is silent.
- `steps` in `lets/src/sync/main.ts` has the project's root, `root`, from `git rev-parse --show-toplevel`, before the `--check` branch.
- mise's shims pick a tool by the working directory's mise config. The comment in the `mise-smoke` job of `.github/workflows/ci.yml` says so. The release folder has no mise config, so a shim run there falls back to the user's global tools, or to none.
- `steps` in `lets/src/sync/main.ts` calls it only on a plain `lets sync`, after the other warnings. The `--check` branch returns earlier and never runs `openspec`.
- `io.execFile` reports a command that cannot start (`ENOENT`, `EACCES`) as `code: null`, and a command that ran and failed as its exit code.
- nixpkgs packages OpenSpec only recently: nixos-25.11 and older have no `openspec`, nixos-26.05 has 1.4.1, and nixos-unstable has 1.13.2, the version this release records.
- The test fake in `tests/lets/sync/fixtures/fake-io.ts` treats `openspec` as unable to start unless a test passes `openspec`. Most tests in `tests/lets/sync/main.test.ts` pass none, and some assert that stderr is empty.
- The `commands` flake check gets `openspec` on `PATH` only from `packages.default`, the `standard` bundle. Its bats tests and sample projects run `openspec` and `lets sync`. The `dist` check adds `packages.openspec` itself. The dev shell adds it too.
- CI's `mise-smoke` job installs this repository's mise tools, including `"npm:@fission-ai/openspec" = "1.13.2"`, and fails when `lets sync` prints `OpenSpec CLI on PATH`.

## Goals / Non-Goals

**Goals:**

- `lets sync` and `lets sync --check` run `openspec --version` once each, and report the missing-CLI problem or the older-CLI warning as the spec says.
- The flake supplies no OpenSpec CLI to projects, and its own checks keep one on `PATH`.
- Every place that tells a project to pin the CLI, or to copy its version from the release notes, says instead to install a CLI that is not older.

**Non-Goals:**

- Adding a semver library. The comparison needs about 20 lines.
- Changing how the release build picks its OpenSpec version, or this repository's own mise pin (D6).
- The README's *Automate updates* section.

## Test Seams

- **Primary test seam:** the `run` function in `lets/src/sync/main.ts`, driven through `tests/lets/sync/main.test.ts` with the fake IO. It covers every spec scenario: the missing CLI in both modes and both commands, the older, equal, newer and unversioned CLI, and no `release.json`.
- **Existing seams reused:** `tests/lets/sync/release.test.ts` for the version comparison as a pure function, since prerelease and build-metadata cases are cheaper there. The `commands` flake check proves the packaged `lets` with a real fake `openspec` script. `mise-smoke` proves that a mise project with a current CLI gets no OpenSpec message.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `lets sync` and `lets sync --check` in every project, through one new problem line and one changed warning. The flake module's `packages` and the flake's `bundle`, which every Nix project's dev shell uses. The release notes line. No data or file layout changes.

## Decisions

### 1. One probe, two messages

`release.ts` gets a probe that runs `openspec --version` with the project's root as its working directory, and returns one of three results: missing (the command could not start, or exited non-zero), installed with a version, or installed with no version found. `steps` runs it once it has `root` and before the `--check` branch, since both branches need it.

The probe runs in the project, not the release folder, because the project installs the CLI (D1). A mise shim there finds the project's own mise config. In the release folder it would find none, and the new check would report a CLI the project has as missing, and fail `--check`.

- `--check` adds the missing-CLI failure line to its `failures`, so it exits 1 with the other failures.
- Plain `lets sync` adds the missing-CLI problem to its `warnings`, or, when the CLI is installed, the older-CLI warning from `release.json`.

`openspecVersionWarning` becomes a function of the probe's version and the package's `release.json`, and no longer runs the command. Alternative: keep one function that both runs the command and builds the message, and call it twice. Rejected: `--check` would run `openspec` for a message it then throws away, and the missing and older cases would be tangled in one `null`. Alternative: keep the release folder as the working directory. Rejected for the shim failure above.

### 2. A small semver comparison in `release.ts`

The comparison parses `major.minor.patch`, an optional `-prerelease` and an optional `+build`, and orders them by semver precedence (D9). Prerelease identifiers compare as semver says: numeric ones as numbers, others as text, and a shorter list first when all else is equal. `VERSION` already matches this shape. Alternative: add the `semver` package. Rejected: `lets` ships as one bundled file with no `node_modules`, and one function does not justify a dependency.

### 3. The flake keeps `packages.openspec` for itself

`bundle` drops `openspec`, so `packages.default`, `packages.standard`, `packages.minimal` and the module's `packages` no longer put it on `PATH` (D5). `packages.openspec` stays: `openspec-skills` builds from `pkgs.openspec`, the dev shell and the `dist` check use the wrapped one. The `commands` check adds `(packagesFor pkgs).openspec` to its `nativeBuildInputs`, because its bats tests and sample projects run `openspec`.

The `commands` check then proves the new behavior with the packaged `lets`:

- a fake `openspec` that prints `0.0.1` gives the older-CLI warning;
- a fake that prints `999.0.0` gives no OpenSpec message;
- a fake that exits 1, as a broken mise shim does, gives the missing-CLI problem from `lets sync`, and exit 1 from `lets sync --check`. A fake is simpler than building a `PATH` with no `openspec`, and the spec counts both as missing.

The `flake-module` check asserts that the module's `packages` hold no `openspec` program, so the break cannot come back by accident.

### 4. The unit-test fake defaults to an installed CLI

`fakeIo` keeps its `openspec` option, but a test that wants a missing CLI says so. `setup` in `main.test.ts` passes an installed CLI by default, so the existing tests that expect empty stderr keep their meaning. Alternative: leave the default as missing and edit each test. Rejected: it would add the missing-CLI line to many tests that are about something else.

### 5. Messages and docs

The three message texts are D8's, word for word. The release workflow writes `OpenSpec CLI: <version> or later` (D11). The README and `docs/lets-sync.md` changes follow D10 and D12:

- *Requirements*: the OpenSpec CLI row says "The version the release was generated from, or later".
- The line under the table says the flake supplies `gh` and Node, and that every project installs the OpenSpec CLI itself.
- *With Nix*: the example adds a `nixpkgs-unstable` flake input, following `github:NixOS/nixpkgs/nixos-unstable`, and puts its `openspec` beside `config.letsSpec.packages` (D10). The text says why: stable channels have no `openspec`, or one older than the release's. It also says to update that input if `lets sync` says the CLI is older.
- *With mise*: the example uses `"npm:@fission-ai/openspec" = "latest"`, and the paragraph drops the pin advice.
- *Updating*: *With Nix* says to add `openspec` from a nixos-unstable input, as *With Nix* shows, if the dev shell has none. *With mise* drops the step that sets the CLI version.
- *Development*: the `nix/flake-module.nix` row no longer says it supplies the OpenSpec CLI. *Releases* says the notes name the oldest CLI the release supports.
- `docs/lets-sync.md`: the warning list names the missing CLI and the older CLI, and the `--check` section names the missing-CLI failure.

### 6. The decision itself gets a record

lets-spec stops managing the version of the OpenSpec CLI in projects (D1, from #277). This is costly to reverse: projects drop their pins and Nix projects add their own CLI. The ADR step records it.

## Risks / Trade-offs

- [A Nix project upgrades and its dev shell has no `openspec`] → `lets sync` in its shell hook now says so, with an install hint. The README's *Updating → With Nix* section and the PR's *Breaking for Nix projects* section, copied into the release notes, say what to add.
- [A project takes `openspec` from a stable nixpkgs channel] → it gets no package, or 1.4.1, and the older-CLI warning. The README tells Nix projects to use a nixos-unstable input (D10), and the warning says which version to reach.
- [nixos-unstable moves ahead of a project's lock, or lags the release's version for a while] → the project updates its input when `lets sync` warns. A newer CLI is silent (D4).
- [`lets sync` runs with `PATH` holding only mise shims] → the probe runs in the project's root, so a shim reads the project's mise config and finds the project's CLI. Run in the release folder, it would find no config and report the CLI as missing.
- [A newer CLI with older skills could still break one day] → #277 found that the interface only gained fields across 1.13.2 to 2.1.0. The warning still catches the risky direction, skills newer than the CLI.
- [`--check` now runs `openspec` in CI] → It is one fast call. A CI job that runs `lets sync --check` without installing the CLI now fails, which is the point (D3).

## Migration & Rollback

- **Mise projects:** may change their pin to `"latest"`, or keep an exact version. Nothing breaks either way.
- **Nix projects:** add `openspec` from a nixos-unstable input to their dev shell's `packages` after the upgrade. Until then, `lets sync` warns and `lets sync --check` fails.
- **Rollback:** revert the change. The previous release's flake puts the CLI back in the bundle, and its warning goes back to exact matching.
