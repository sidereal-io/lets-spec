## Context

- The `dist` derivation in `flake.nix` builds the folder the release tarball
  is made from: `bin/lets` (the bundle, `#!/usr/bin/env node`),
  `releases/<flow>/` and `release.json`. `release.json` comes from
  `releaseJson`, whose `openspec` field is `pkgs.openspec.version`. The `dist`
  check asserts that `bin/` holds only `lets`.
- The mise github backend puts the tarball's `bin/` on `PATH`. On this
  machine, `mise bin-paths` lists
  `~/.local/share/mise/installs/github-sidereal-io-lets-spec/0.8.0/bin`, and
  `which lets` finds `~/.local/share/mise/shims/lets`. So a project can reach
  a new `bin/openspec` either directly on `PATH` (`mise activate`) or through a
  mise shim. A shim is a link to the mise binary, not to the file it runs.
- `lets` finds its package root as the folder above its bundle
  (`lets/src/main.ts`): the tarball's root for a tarball install, and the
  `lets-cli` store path for a Nix install. Only the tarball has
  `bin/openspec` there.
- `openspecVersionWarning` (`lets/src/sync/release.ts`) reads
  `<packageRoot>/release.json`, runs `openspec --version` through
  `io.execFile`, and returns one warning text. `io.execFile`'s `env` option
  replaces the whole environment.
- `lets sync` runs on every `cd` in a mise project, through the `enter` hook.
  So anything it runs must be fast and work offline.

## Goals / Non-Goals

**Goals:**

- A tarball's `bin/openspec` that hands over to `npx` with no wrapper process
  left in between.
- A version check that never starts `npx`, whether the launcher is reached
  directly or through a mise shim.
- One source for the OpenSpec version in the tarball: the value that writes
  `release.json`.

**Non-Goals:**

- Shipping the OpenSpec CLI itself, or caching it ahead of the first run.
- Windows. The flake builds for Linux and macOS, and `bin/lets` already
  relies on a shebang.
- Any change to the Nix packages, the flake module or the Nix warning text.

## Test Seams

- **Primary test seam:** the `dist` flake check. It runs the tarball folder as
  a project would, so it can drive `bin/openspec` and `bin/lets sync` with a
  fake `npx` and a fake `openspec` on `PATH`, and assert on their output,
  exit codes and calls. The sandbox has no network, which suits fakes.
- **Existing seams reused:** `tests/lets/sync/release.test.ts`, for the
  warning text on each install kind, with the existing fake `Io`; and the CI
  `mise-smoke` job, the one place with network, for a real `npx` run.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the release tarball's `bin/`, `lets sync`'s version check,
  the `dist` check, the `mise-smoke` job and the README. A tarball install now
  fetches OpenSpec from npm at first use. Projects already did that through
  mise's npm backend, so the source is not new.

## Decisions

### The launcher is a POSIX shell script with the version written in

The `dist` derivation writes `bin/openspec` as a `#!/bin/sh` script, with
`pkgs.openspec.version` written into it: the same value `releaseJson`
records. The script exports `OPENSPEC_NO_UPDATE_CHECK=1` (D1), checks
`command -v npx`, and ends with
`exec npx --yes "@fission-ai/openspec@<version>" "$@"`. `exec` replaces the
shell with `npx`, so input, output, signals and the exit code pass through
with no code of ours. The `dist` check asserts that the version in the
script equals `release.json`'s `openspec`.

Alternatives:

- Read `release.json` at run time. A shell script cannot parse JSON without
  `jq`, which a project may not have.
- A Node launcher. It can read `release.json`, but it must forward signals,
  a terminal and the exit code by hand, and it adds a second bundle to build.
- Ship the CLI in the tarball. That needs `node_modules`, which the tarball
  avoids on purpose.

When `npx` is missing, the script exits 127, the shell's code for a missing
command, and writes:
`openspec: this release runs the OpenSpec CLI <version> with npx, and npx is not on PATH. Install Node, which includes npx.`
The story asked only for a message that says so. This text is an assumption
the plan review can change.

### `lets sync` asks the launcher for its version through a probe variable

`lets sync` runs `openspec --version` with `LETS_SPEC_OPENSPEC_PROBE=1` added
to its environment. When the launcher sees that variable, it prints its
written-in version and exits 0, before it looks for `npx`. Any other
`openspec` ignores the variable and prints its real version. So:

- The launcher, reached directly or through a mise shim, answers the pinned
  version at once. The versions match, and `lets sync` stays silent and
  starts no download.
- A pinned `npm:@fission-ai/openspec` that comes first answers its own
  version. It is silent at the same version (D3), and warns at another (D2).

`lets sync` sets the variable on every install. On Nix it changes nothing.

Alternatives:

- Walk `PATH` and compare the first `openspec`'s real path with
  `<packageRoot>/bin/openspec`. Through a mise shim, the real path is the mise
  binary, so the check falls back to running the launcher and `npx` anyway.
  It also needs a new `realpath` method on `Io`.
- Always run `openspec --version`. Through the launcher, that starts `npx`
  on every `lets sync`, and fails offline.

### The launcher's presence marks a tarball install

`openspecVersionWarning` picks the warning text by whether
`<packageRoot>/bin/openspec` exists: the mise text (D2) when it does, and
today's text, ending `Pin the CLI to <pinned>.`, when it does not. The Nix
`lets-cli` package and the source tree have no `bin/openspec`.

Alternative: an `install` field in `release.json`. `lets-cli` and `dist`
share one `release.json` today, so that needs two files to tell apart.

## Risks / Trade-offs

- [The first `openspec` run in a fresh project downloads OpenSpec, and fails
  offline] → `npx`'s own error passes through. The README says that the
  first run needs the network, as `mise install` did for the old pin.
- [`npx` resolves OpenSpec's dependencies at run time, with no lockfile, so
  they can differ between machines] → The same is true of mise's npm
  backend today. The OpenSpec version itself is exact.
- [`npx` writes notices, such as `npm warn`, that could break `--json`
  output] → `npm` writes them to stderr. `mise-smoke` runs a real
  `openspec ... --json` and parses stdout.
- [A project keeps its `npm:@fission-ai/openspec` pin, and mise puts it first]
  → The warning names the line to remove (D2), unless the versions match
  (D3).
- [Someone sets `LETS_SPEC_OPENSPEC_PROBE` in their shell, and `openspec`
  stops working] → The `LETS_SPEC_` prefix keeps it out of the way. The
  README does not document it, since only `lets` sets it.

## Migration & Rollback

A mise project removes the `"npm:@fission-ai/openspec"` line from
`mise.toml` when it moves to the release that ships this, as the README's
*Updating* section says. A project that keeps the line keeps working.

To roll back, revert the change and publish a release. Projects on the new
release that removed their pin add it back, and the warning from an older
release tells them the version.

This repository keeps its own pin until its first release bump after this
ships. That bump is out of scope.
