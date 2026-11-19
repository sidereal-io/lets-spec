## 1. The tarball's openspec launcher

Every task here edits the `dist` derivation and the `dist` check in
`flake.nix`, so they run in order. The check runs in the Nix sandbox, with no
network: put a fake `npx` first on `PATH` to observe what the launcher runs.
See design.md, "The launcher is a POSIX shell script with the version
written in".

- [ ] 1.1 [medium] The release folder's `bin/openspec` is a `#!/bin/sh` script that runs `npx --yes @fission-ai/openspec@<version>` with its arguments, where `<version>` is the `openspec` value in `release.json`; the `dist` check asserts that `bin/` holds `lets` and `openspec`, and that a fake `npx` printing its arguments shows `--yes @fission-ai/openspec@<version> list --json` for `bin/openspec list --json` (verify: nix build .#checks.x86_64-linux.dist)
- [ ] 1.2 [easy] `bin/openspec` sets `OPENSPEC_NO_UPDATE_CHECK=1` for the CLI it runs; the `dist` check asserts that a fake `npx` printing that variable prints `1` (verify: nix build .#checks.x86_64-linux.dist)
- [ ] 1.3 [easy] `bin/openspec` passes stdin and the exit code through; the `dist` check feeds `hello` to a fake `npx` that copies stdin to stdout and exits 3, and asserts stdout `hello` and exit code 3 (verify: nix build .#checks.x86_64-linux.dist)
- [ ] 1.4 [easy] With no `npx` on `PATH`, `bin/openspec --version` exits 127 and writes `openspec: this release runs the OpenSpec CLI <version> with npx, and npx is not on PATH. Install Node, which includes npx.` to stderr; the `dist` check asserts both (verify: nix build .#checks.x86_64-linux.dist)
- [ ] 1.5 [easy] With `LETS_SPEC_OPENSPEC_PROBE=1` set, `bin/openspec --version` prints the `release.json` version and exits 0 without running `npx`, even when no `npx` is on `PATH`; with the variable set and any other arguments, such as `list --json`, it runs `npx` as usual; the `dist` check asserts both (verify: nix build .#checks.x86_64-linux.dist)

## 2. The lets sync version check

`openspecVersionWarning` in `lets/src/sync/release.ts`, its call in
`lets/src/sync/main.ts`, and their tests. See design.md, "`lets sync` asks
the launcher for its version through a probe variable" and "The launcher's
presence marks a tarball install".

- [ ] 2.1 [easy] `lets sync` runs `openspec --version` with `LETS_SPEC_OPENSPEC_PROBE=1` added to its whole environment (`io.execFile`'s `env` replaces it): `openspecVersionWarning` takes an `env`, and `main.ts` passes `deps.env`; a test in `tests/lets/sync/release.test.ts` reads the call from the fake `Io`'s `calls` and asserts the variable and that `PATH` is kept. Widen the `calls` type in `tests/lets/sync/fixtures/fake-io.ts` to `{ cwd?: string; env?: Record<string, string | undefined> }` so the type check accepts the test (verify: node --test tests/lets/sync/release.test.ts && pnpm check)
- [ ] 2.2 [medium] When `<packageRoot>/bin/openspec` exists and the versions differ, the warning is `the OpenSpec CLI on PATH is <found>, but this release's openspec-* skills were generated from <pinned>. Remove the "npm:@fission-ai/openspec" line from mise.toml, or any other openspec that comes before this release's on PATH.`; without that file the warning keeps `Pin the CLI to <pinned>.`, and equal versions stay silent on both (verify: node --test tests/lets/sync/release.test.ts tests/lets/sync/main.test.ts)

## 3. End-to-end checks [depends-on: 1, 2]

- [ ] 3.1 [medium] The `dist` check runs `node bin/lets sync` with the folder's `bin/` first on `PATH` and an `npx` that records each call, and asserts no OpenSpec warning and no `npx` call; with a fake `openspec` first that prints `0.0.1`, stderr holds the mise warning text; with one that prints the `release.json` version, stderr holds no OpenSpec warning (verify: nix build .#checks.x86_64-linux.dist)
- [ ] 3.2 [medium] The CI `mise-smoke` job drops this repository's OpenSpec pin (for example with `MISE_DISABLE_TOOLS=npm:@fission-ai/openspec` before `mise env`), asserts that `command -v openspec` is `result/bin/openspec`, that `openspec --version` prints `jq -r .openspec result/release.json`, and that `openspec list --json` prints JSON `jq` parses, then runs `lets sync` with no OpenSpec warning as today (verify: nix build .#dist && [ -x result/bin/openspec ] && [ "$(result/bin/openspec --version)" = "$(jq -r .openspec result/release.json)" ])

## 4. Documents [depends-on: 2]

- [ ] 4.1 [parallel] [easy] The README's *With mise* example and text drop the OpenSpec pin, *Updating* drops its "Set the OpenSpec CLI" step and tells a project to remove an old `npm:@fission-ai/openspec` line, *Requirements* says mise installs get the CLI from the release and that its first run needs the network, and *Releases* says `bin/` holds `lets` and `openspec` (verify: ! grep -nF '"npm:@fission-ai/openspec" = ' README.md)
- [ ] 4.2 [parallel] [easy] `docs/lets-sync.md` describes both warning texts and when a tarball install stays silent, and the *Update* stage in `openspec/discovery.md` no longer names the OpenSpec version warning (#26) as its gap (verify: mise run check)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
