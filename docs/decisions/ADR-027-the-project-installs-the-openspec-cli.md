---
id: adr-027
date: 2026-11-19
status: accepted
title: 'ADR-027: The project installs the OpenSpec CLI, and lets sync checks only that it is there and not older'
description: Architecture decision record (ADR) for leaving the OpenSpec CLI's version and installation to each project, with lets sync failing its check when the CLI is missing and warning when it is older than the release's skills
---

# ADR-027: The project installs the OpenSpec CLI, and lets sync checks only that it is there and not older

## Context

Each lets-spec release ships `openspec-*` skills that the release build generates with one version of the OpenSpec CLI, and records that version in the release's `release.json`. The skills tell agents to run `openspec` commands and read their JSON, so a project needs the CLI on `PATH`. Until now, lets-spec asked every project to run exactly that version: the Nix flake put it in the dev shell, and mise projects copied the version from the release notes into `mise.toml`. `lets sync` warned whenever the two versions differed.

OpenSpec releases often: about 25 releases between April and November 2026, including 2.0.0. Comparing 1.13.2, 1.17.0 and 2.1.0 found that the commands the `openspec-*` skills use are the same in all three, and their JSON only gains fields. So a newer CLI with older skills works. Skills generated from a newer CLI than the one installed are the direction that can break: they may ask for a field the older CLI does not print.

## Decision

Each project installs the OpenSpec CLI itself, at any version it likes, for example with mise as `"npm:@fission-ai/openspec" = "latest"`. lets-spec does not pin, ship or download it for projects, and the Nix flake module does not supply it. `lets sync` checks two things only:

- The CLI is installed. When `openspec --version` cannot start or exits non-zero, `lets sync` warns and `lets sync --check` fails.
- The CLI is not older than the version in `release.json`, by semver precedence. When it is older, `lets sync` warns. `--check` does not fail.

`lets sync` keeps copying the `openspec-*` skills from the release. It never generates them with the project's CLI.

## Consequences

- Easier: upgrading lets-spec needs no hand edit of an OpenSpec version. `mise upgrade` and `lets sync` are the whole update, so a scheduled CI job can do it.
- Easier: nothing warns when a project runs a newer CLI, so agents stop asking whether to move OpenSpec.
- Easier: Nix and mise projects install the CLI the same way, and lets-spec ships nothing beyond `lets` and the release files.
- Harder: a project's CLI and the release's skills can differ. A future OpenSpec release that removes a command or field the skills use would break them, and nothing catches that until someone hits it.
- Harder: a Nix project must add an OpenSpec CLI to its dev shell, and its nixpkgs decides the version. An old nixpkgs gives the older-CLI warning.
- Harder: a project that runs `openspec validate --strict` in CI can go red after an OpenSpec upgrade that adds a warning. That project chooses when to upgrade, through its own lockfile.
- Unchanged: this repository still pins its own CLI, because its release build and its `--strict` check need a fixed version.

## Alternatives Considered

### Alternative 1: Publish lets-spec to npm, depending on an exact OpenSpec
- **Pros**: the standard way to ship a Node tool; npm installs and locks the exact CLI with lets.
- **Cons**: a new registry to publish to, with a token and a package name to look after. Every mise project's install line changes.
- **Why not**: it changes how every release is published, to protect an exact match that the version comparison showed is not needed.

### Alternative 2: Put OpenSpec in the release tarball
- **Pros**: mise installs and locks the exact CLI with the tarball, with no new registry.
- **Cons**: the tarball grows from one file to about 15 MB, and stops being one file per command.
- **Why not**: every project pays the size on every upgrade, for the same unneeded exact match.

### Alternative 3: lets sync installs OpenSpec into a cache
- **Pros**: the tarball stays small, and a shipped lockfile pins OpenSpec's dependencies exactly.
- **Cons**: `lets sync` runs on every `cd` in a mise project, so the first one after an upgrade waits for a download. `lets` must handle two syncs at once, half-finished downloads, sandboxes with no network, and old versions. mise neither locks nor prunes the cache.
- **Why not**: it makes `lets` a package manager.

### Alternative 4: An `openspec` launcher that runs `npx` at the exact version
- **Pros**: no download at install time, and the exact version on every call.
- **Cons**: every `openspec` call asks the npm registry, about 0.8 s even when cached. In an agent sandbox that blocks the network, each call waits about 70 s. OpenSpec's dependencies are not locked.
- **Why not**: agents call `openspec` many times in one skill, so the delay lands on every step.

### Alternative 5: Keep pinning, and warn on any difference
- **Pros**: the project's CLI always matches the skills exactly.
- **Cons**: every release that moves OpenSpec needs a hand edit in every mise project, and `lets sync` warns until someone makes it.
- **Why not**: the cost recurs on every release, and the comparison found nothing it protects against in the newer direction.
