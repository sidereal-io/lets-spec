## Story

#313 bats-is-gone — one runner runs every test, and no tool or document
names bats.
https://github.com/sidereal-io/lets-spec/issues/313

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. The stories
it waits for, #310 and #312, are closed, and no `.bats` file is left in
`tests/`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Does `pnpm test` still run bats? | No. Its script is already `node --test "tests/**/*.test.ts" && tsc --noEmit`; commit a4b6457c removed `bats tests` once no `.bats` file was left. `package.json` does not change. | Evidence: `package.json`; commit a4b6457c |
| D2 | Which `.bash` files in `tests/support/` go? | Both: `common.bash` and `release.bash`. No file loads them now. | Evidence: #313 packet, *Scope: in*; `git grep` finds no `load` of either |
| D3 | Which tools leave `mise.toml`? | `bats`, `jq` and `yq`. Nothing run through mise uses `jq` or `yq`: the flake's checks take them from nixpkgs, and `release.yml` uses the runner's own `jq` without mise. There is no `mise.lock` to update. | Evidence: #313 packet; `flake.nix`; `.github/workflows/release.yml` |
| D4 | What leaves the flake's `commands` check? | Only `pkgs.bats` from its tools. It no longer runs `bats repo/tests`. Its smoke test stays as it is, with `jq` and `yq`, which it uses. | Evidence: #313 packet; `flake.nix` `commands` |
| D5 | What leaves the flake's dev shell? | `pkgs.bats`, `pkgs.jq` and `pkgs.yq-go`. Nothing in the dev workflow uses `jq` or `yq`, and `mise.toml` drops them (D3), so `mise install` and `nix develop` give the same tools and the README names one list for both. | Assumption |
| D6 | Does `nix flake check` still run every Node test? | Yes. The `node-tests` check runs `node --test "tests/**/*.test.ts"` and `pnpm check`, and does not change. | Evidence: `flake.nix` `node-tests` |
| D7 | Which comments and documents change? | The README's *Development* section (the tools sentence and the `pnpm test` and `bats tests` rows of the commands table), the *Checks* block of `AGENTS.md` above the lets-spec markers, the comment on the `commands` check in `flake.nix`, and the *Flake check* comment in `.github/workflows/ci.yml`. The README's `tests/` row already names no bats. | Evidence: #313 packet; `git grep -il bats` |
| D8 | Does the comment in `tests/release/build.test.ts` (line 20) that cites "release.bash's `build`" change? | Yes. It names a file this story deletes, so it says what the helper does without naming `release.bash`. | Assumption |
| D9 | Does any spec change? | No. No spec describes this repository's own test tools. The one scenario that names bats, in `contract-first-builds`, describes another project's tests and stays. | Evidence: #313 packet; `openspec/specs/contract-first-builds/spec.md` |
| D10 | Do archived changes and decision records change? | No. They keep naming bats. | Evidence: #313 packet, *Scope: out* |
| D11 | How is the story accepted? | `pnpm test`, `nix flake check` and `mise run check` pass, and `git grep -il bats` finds only archived changes, decision records, `openspec/specs/contract-first-builds/spec.md` and this change's own files, which move to the archive at the end. | Evidence: #313 packet |
| D12 | Does this story add glossary terms? | No. The epic's terms keep their meaning from #308's *Shared decisions*. | Evidence: archived `sync-tests-in-node` brainstorm, D15 (User) |
| D13 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |

## Changes from the story

- Clarified: `package.json` already runs no bats (D1), so the story's
  first scope item needs no edit.
- Added: the comment in `tests/release/build.test.ts` that names
  `release.bash` (D8). The packet did not list it.
- Added: `jq` and `yq` leave the flake's dev shell as well as
  `mise.toml` (D5). The packet named only `pkgs.bats` for the dev shell.

Confirmed by user: yes
