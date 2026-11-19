---
id: adr-026
date: 2026-11-18
status: accepted
title: 'ADR-026: A tarball install runs the OpenSpec CLI its release records, fetched by npx'
description: Architecture decision record (ADR) for shipping an openspec launcher in the release tarball that fetches the recorded OpenSpec CLI version with npx, so mise projects pin no OpenSpec of their own
---

# ADR-026: A tarball install runs the OpenSpec CLI its release records, fetched by npx

## Context

Each lets-spec release generates its `openspec-*` skills from one OpenSpec
CLI version, and records it in the release's `release.json`. The skills
depend on that version's commands and output. A Nix install gets the
matching CLI from the flake. A project that installs the release tarball
with mise had to pin `npm:@fission-ai/openspec` in its own `mise.toml`,
copied by hand from each release's notes. When the pin fell behind,
`lets sync` warned on every run, and agents in the project asked whether to
upgrade OpenSpec. The tarball is one file per command, with no
`node_modules`, and Node 26 is already a requirement.

## Decision

The release tarball ships `bin/openspec`, a shell script that runs
`npx --yes @fission-ai/openspec@<version>` with the version the release
records, and turns off OpenSpec's update check. Mise projects pin no
OpenSpec: the release they install decides the version.

## Consequences

- Easier: moving to a new release moves OpenSpec too, with no edit in the
  project. The CLI and the skills cannot drift apart unless the project puts
  another `openspec` first on `PATH`.
- Easier: the tarball stays small, and holds no platform-specific files.
- Harder: the first `openspec` run in a fresh environment needs the network,
  to fetch OpenSpec from npm. A project that works offline must run it once
  while online, or keep a pin of its own.
- Harder: OpenSpec's own dependencies resolve at fetch time, with no
  lockfile, as they did with mise's npm backend.
- `lets sync` must check the CLI version without starting a download, so it
  asks the launcher for its version without running `npx`.

## Alternatives Considered

### Alternative 1: Keep the pin in each project
- **Pros**: no new file in the tarball; mise installs the CLI ahead of time,
  so the first run needs no network.
- **Cons**: every release that moves OpenSpec needs a hand edit in every mise
  project, and `lets sync` warns until it is made.
- **Why not**: the pin is the one version a mise project still copies by
  hand, and the cause of the repeated warning and the agents' questions.

### Alternative 2: Ship the OpenSpec CLI inside the tarball
- **Pros**: no network at first run; the exact files are fixed at release
  time.
- **Cons**: the tarball gains OpenSpec's `node_modules`, and the release must
  build and test them for each platform.
- **Why not**: the tarball is built to hold no `node_modules`, so `lets` runs
  on any Node 26 from one file. Shipping the CLI breaks that for one tool.

### Alternative 3: Have mise install OpenSpec as a dependency of the lets-spec tool
- **Pros**: mise would fetch and cache the CLI at install time.
- **Cons**: mise's github backend installs a release's files, and has no way
  for one tool to declare another tool and its version.
- **Why not**: mise offers no such mechanism to build on.
