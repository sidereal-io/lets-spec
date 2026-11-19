## Why

A project that installs lets-spec with mise has to pin the OpenSpec CLI in
its own `mise.toml`, copied by hand from each release's notes. When that pin
falls behind, `lets sync` warns on every run, and agents in the project keep
asking whether to move to a newer OpenSpec. The pin is the one version a mise
project still copies by hand. Removing it removes the bump, the warning and
the agents' questions together.

## What Changes

- The release tarball ships an `openspec` command in `bin/`, beside `lets`.
  It runs the OpenSpec CLI version the release's `release.json` records,
  through `npx --yes @fission-ai/openspec@<version>`. It passes arguments,
  input, output and exit code through. It turns off OpenSpec's check for a
  newer version, as the Nix wrapper does (D1). When `npx` is missing, it fails
  with a message that says so.
- On a tarball install, `lets sync` skips the CLI version check when the
  `openspec` first on `PATH` is that command, so it starts no download.
- On a tarball install, when another `openspec` comes first on `PATH` and its
  version differs, the warning tells the user to remove the
  `npm:@fission-ai/openspec` line from `mise.toml` (D2). When the versions are
  the same, `lets sync` says nothing (D3). Nix installs keep today's warning.
- The `dist` flake check and the CI `mise-smoke` job prove the launcher works.
  `mise-smoke` proves that `openspec --version` prints the `release.json`
  version in a project that pins no OpenSpec.
- The README drops the OpenSpec pin from *With mise* and its bump step from
  *Updating*. *Requirements* says mise installs get the CLI from the release.

Nothing is **BREAKING**. A mise project that keeps its pin keeps working: at
the same version it is silent (D3), and at another version the warning says
which line to remove.

Out of scope: Nix installs, which already get the matching CLI from the flake
module; how a release picks its OpenSpec version, which is still nixpkgs; and
this repository's own `npm:@fission-ai/openspec` pin, which can go at the
first release bump after this ships. #26 is superseded and already closed
(D4).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-sync`: the requirement "The OpenSpec CLI version warning works on
  every install" changes. A tarball install skips the check when its own
  `openspec` comes first on `PATH`, and its warning names the `mise.toml` line
  to remove. A new requirement covers the tarball's `openspec` command.

## Impact

- `flake.nix`: the `dist` folder gains `bin/openspec`; the `dist` check
  asserts that `bin/` holds `lets` and `openspec`, and tests the launcher.
- `lets/src/sync/release.ts` (`openspecVersionWarning`) and
  `lets/src/sync/main.ts`; the `Io` type in `lets/src/io.ts` and its test fake,
  if finding the first `openspec` on `PATH` needs a new method.
- `tests/lets/sync/release.test.ts` and `tests/lets/sync/main.test.ts`.
- `.github/workflows/ci.yml` (`mise-smoke`).
- `README.md` (*Requirements*, *With mise*, *Updating*, *Releases*) and
  `docs/lets-sync.md`, which describes the warning.
- `openspec/discovery.md`: the *Update* stage for Mo no longer depends on #26.
- Runtime dependency: a tarball install's `openspec` needs `npx`, which comes
  with Node, already a requirement. The first run downloads OpenSpec from npm.
