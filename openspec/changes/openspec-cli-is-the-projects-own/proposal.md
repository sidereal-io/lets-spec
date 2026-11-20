<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

Today each project must pin the OpenSpec CLI to the exact version in the release notes. Every release that moves OpenSpec needs a hand edit in every mise project, and `lets sync` warns until someone makes it. #277 found that the commands and JSON the `openspec-*` skills use only gain fields between versions, so an exact match costs more than it protects. lets-spec stops managing the CLI for projects (D1).

## What Changes

- **New:** `lets sync` checks that the OpenSpec CLI is installed. It is missing when `openspec --version`, run in the project's root, cannot start or exits non-zero (D7). `lets sync` then warns, says how to install it, and exits 0. `lets sync --check` fails, in both skills modes (D3, D8). The check runs even when the package has no `release.json` (D7).
- **Changed:** the version warning fires only when the CLI is older than the `openspec` version in `release.json`, by semver precedence (D4, D9). It tells the user to upgrade, no longer to pin. An equal or newer CLI is silent, and so is a CLI whose version is unknown. `--check` does not fail on an older CLI (D4).
- **Unchanged:** `lets sync` still copies the `openspec-*` skills from the release and never runs `openspec init` or `openspec update` (D2). This repository keeps its own OpenSpec pin and release build (D6).
- **BREAKING for Nix projects:** the flake module's `packages` and the flake's `bundle` no longer include the OpenSpec CLI (D5). A Nix project adds `openspec` from a nixos-unstable input, since stable channels have none or an older one (D10). The flake keeps its `packages.openspec` output for its own build and checks.
- **Docs:** the README (*Requirements*, *With Nix*, *With mise*, *Updating*, *Development*) and `docs/lets-sync.md` describe the new behavior and drop the pin and its bump step (D10, D12). The pull request description carries a *Breaking for Nix projects* section for the next release's notes (D12).
- **Release notes:** the release workflow writes `OpenSpec CLI: <version> or later`, so nobody reads the version as a pin (D11).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-sync`: the requirement "The OpenSpec CLI version warning works on every install" changes. It gains a missing-CLI warning and a missing-CLI `--check` failure, and its version warning fires only for an older CLI, with new text.

## Impact

- **Code:** `lets/src/sync/release.ts` (`openspecVersionWarning` and a new missing-CLI check); `lets/src/sync/main.ts` (the warnings, and the `--check` branch).
- **Tests:** `tests/lets/sync/release.test.ts`, `tests/lets/sync/main.test.ts`; the flake checks in `flake.nix` that drive the warning with a fake `openspec`; the CI `mise-smoke` job in `.github/workflows/ci.yml`.
- **Nix:** `nix/flake-module.nix` (`packages` and its description); `flake.nix` (`bundle`).
- **Release:** `.github/workflows/release.yml`, the notes line.
- **Docs:** `README.md`, `docs/lets-sync.md`.
- **Projects:** mise projects can drop their exact pin. Nix projects must add an OpenSpec CLI after they upgrade.
