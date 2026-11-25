## Story

#310 build-and-openspec-tests-in-node — the release build and OpenSpec
tests run from Node's test runner, and their bats files are gone.
https://github.com/sidereal-io/lets-spec/issues/310

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#309 (`sync-tests-in-node`), which wrote the helper module
`tests/support/lets.ts`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests move? | The 16 tests in `tests/release-build.bats` and the 14 in `tests/openspec-compat.bats`, each with the check it has today. The two files are then deleted. | Evidence: #310 packet; counted in the files |
| D2 | Do these tests run the real OpenSpec CLI or a stand-in? | The real `openspec` program on `PATH`. These tests exist to run it. | Evidence: #310 packet, *Scope: out* |
| D3 | Do `build/build-release.mjs`, the schemas or `lets` change? | No. | Evidence: #310 packet, *Scope: out*; #308 *Shared decisions* |
| D4 | Where does the shared code for these tests live? | In the helper module `tests/support/lets.ts`, which #309 wrote. This story extends it and never copies it. | Evidence: #308 *Shared decisions* |
| D5 | What environment does each test pin? | What the helper's `pinnedEnv` pins, plus `OPENSPEC_TELEMETRY=0` and `OPENSPEC_NO_UPDATE_CHECK=1`, as `tests/openspec-compat.bats` sets today. Each run of a program has a time limit. | Evidence: `tests/support/lets.ts`; `tests/openspec-compat.bats`; #308 *Shared decisions* |
| D6 | Are `tests/support/common.bash` and `tests/support/release.bash` deleted? | No. `tests/skill-interfaces.bats` still loads both (its lines 1 and 3509), so they stay until that file goes. | Evidence: the `load` lines of `tests/skill-interfaces.bats`; #310 packet, *Scope: in* |
| D7 | Does the flake's `node-tests` check get the OpenSpec CLI? | Yes: the flake's pinned `openspec` package, as the `commands` check already has. | Evidence: #310 packet, *Scope: in*; `flake.nix` |
| D8 | Do `pnpm test` and the flake's `commands` check still run bats? | Yes. `tests/skill-interfaces.bats` remains, so `bats tests` stays in both, and the `commands` check keeps `bats`, `jq` and `yq`. | Evidence: `package.json`; `flake.nix` `commands` |
| D9 | Do the terms *Black-box test* and *Stand-in* go into `openspec/glossary.md`? | No. This branch adds no glossary terms. The terms keep their meaning from #308's *Shared decisions*. | Evidence: archived `sync-tests-in-node` brainstorm, D15 (User) |
| D10 | When no `openspec` program is on `PATH`, do the OpenSpec tests fail or skip? | Fail, with a message that says the OpenSpec CLI is missing from `PATH`. A skip would let `pnpm test` pass without the schema checks; the bats tests fail in the same case today. | Assumption |
| D11 | Which OpenSpec version must the tests run? | Whichever `openspec` is on `PATH`, with no version check: 1.13.2 from `mise.toml` under `pnpm test`, 2.0.0 from nixpkgs under `nix flake check`, as the bats tests do now. Making the two pins agree is outside this story. | Assumption |
| D12 | How do the Node tests read each schema's artifact list (`id`, `requires`, `generates`) from `schema.yaml`? | With the `yaml` package, added as a root devDependency at `^2.9.1`, the version `lets` already uses. It adds no new package to the lockfile, and it reads the schema as the CLI does. | Assumption |
| D13 | Does this change fix the `README.md` row (line 730) that says `*.bats` tests the release build and each schema? | Yes, that row only: it names the new Node test folders and says `*.bats` now holds only the prose checks. The full rewrite of the README, `AGENTS.md` and `ci.yml` stays with the epic's last story, as #309 did. | Assumption |

## Changes from the story

- Added: the `yaml` package as a root devDependency (D12). The packet did not name a new dependency.
- Added: the one `README.md` row that describes `*.bats` (D13). The rest of the documentation stays with the epic's last story.
- Clarified: the packet says the tests run "the version `mise.toml` and the flake pin", but the two pins differ. The tests run whichever `openspec` is on `PATH` (D11).

Confirmed by user: yes
