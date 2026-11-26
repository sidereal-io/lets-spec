<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

Every test in the repository now runs under Node's test runner: the
stories before this one in epic #308 deleted the last `.bats` file. But
bats is still installed by `mise.toml` and the flake, two bats helper
files are left in `tests/support/`, and the README, `AGENTS.md`, the
flake and CI still describe bats tests. A maintainer who reads them
looks for tests that do not exist, and installs a tool nothing runs.

## What Changes

- **Removed from the tools:** the `bats`, `jq` and `yq` pins in
  `mise.toml` (D3); `pkgs.bats` from the flake's `commands` check
  (D4); `pkgs.bats`, `pkgs.jq` and `pkgs.yq-go` from the flake's dev
  shell (D5).
- **Removed from the tests:** `tests/support/common.bash` and
  `tests/support/release.bash`, which no file loads (D2).
- **Reworded:** the README's *Development* section, the *Checks* block
  of `AGENTS.md` above the lets-spec markers, the comment on the
  flake's `commands` check, the *Flake check* comment in
  `.github/workflows/ci.yml` (D7), and the comment in
  `tests/release/build.test.ts` that names `release.bash` (D8).
- **Unchanged:** `package.json`, whose `test` script already runs no
  bats (D1); the smoke test in the `commands` check, which still uses
  `jq` and `yq` (D4); the flake's `node-tests` check (D6); `lets` (D13);
  archived changes and decision records (D10).

No spec requirement changes (D9), so the change sets
`skip_specs: true`.

## Capabilities

### New Capabilities

None. This change removes a tool and the words that describe it.

### Modified Capabilities

None. No spec describes this repository's own test tools. The one
scenario that names bats, in `contract-first-builds`, describes another
project's tests and stays (D9).

## Impact

- **Developer tools:** `mise install` and `nix develop` no longer
  install bats, `jq` or `yq`. Both give the same list of tools.
- **Checks:** `pnpm test`, `nix flake check` and `mise run check` run
  the same tests as before. The `commands` check loses one unused
  input.
- **Documents:** the README, `AGENTS.md` (read through the `CLAUDE.md`
  link) and two comments in config files.
- **Acceptance:** after this change, `git grep -il bats` finds only
  archived changes, decision records,
  `openspec/specs/contract-first-builds/spec.md` and this change's own
  files (D11).
