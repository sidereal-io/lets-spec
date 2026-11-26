<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- No task adds a test: the change removes tools and words, and adds no behavior.
     Each verify command checks the task's outcome directly. Section 4 runs the
     project's three checks. Design decision 6: the whole change is one `chore:`
     commit, made in task 4.2. -->

## 1. The tools install no bats

- [x] 1.1 [parallel] [easy] `mise.toml` pins no `bats`, `jq` or `yq`. The pins for `node`, `pnpm`, `gh`, the OpenSpec CLI and lets-spec stay (design decision 1) (verify: `! grep -nE '^(bats|jq|yq) =' mise.toml && grep -q '^gh =' mise.toml`) (✓ verify grep passed)
- [x] 1.2 [easy] The flake's `commands` check no longer has `pkgs.bats` in its `nativeBuildInputs`, and keeps `pkgs.jq` and `pkgs.yq-go` for its smoke test. Its comment drops the sentence "No bats file is left to run here, …" and keeps the description of the smoke test (design decisions 1 and 5) (verify: `! grep -A2 '"commands-check"' flake.nix | grep -q 'pkgs\.bats' && ! grep -q 'No bats file is left' flake.nix && nix build --no-link ".#checks.$(nix eval --raw --impure --expr builtins.currentSystem).commands"`) (✓ verify greps and `nix build` of the `commands` check passed)
- [x] 1.3 [easy] The flake's dev shell gives only the OpenSpec CLI, `nodejs_26` and `pnpm`: `pkgs.bats`, `pkgs.jq` and `pkgs.yq-go` leave its `packages` (design decision 1) (verify: `nix develop --ignore-environment --command sh -c '! command -v bats && ! command -v jq && ! command -v yq && node --version && pnpm --version && openspec --version'`) (✓ `nix develop --ignore-environment` verify passed: no bats, jq or yq; node v26.11.1, pnpm 12.9.0, openspec 1.13.2)

## 2. The tests hold no bats helper

- [x] 2.1 [easy] `tests/support/common.bash` and `tests/support/release.bash` are deleted, and every Node test still passes without them (verify: `test ! -e tests/support/common.bash && test ! -e tests/support/release.bash && pnpm test`) (✓ files absent; `pnpm test` passed, 827 tests)
- [x] 2.2 [parallel] [easy] The comment on `build` in `tests/release/build.test.ts` says the function runs the release build "as the flake does", and no longer names `release.bash` (design decision 5) (verify: `! grep -n 'release\.bash' tests/release/build.test.ts && node --test tests/release/build.test.ts`) (✓ verify grep and `node --test tests/release/build.test.ts` passed, 16 tests)

## 3. The documents name no bats

- [x] 3.1 [parallel] [easy] The README's *Development* section says that `nix develop` and `mise install` both give Node 26, pnpm and the OpenSpec CLI. In the *Testing* table, the `pnpm test` row reads "The Node tests and the type check", and the `bats tests` row is gone (design decisions 2 and 3) (verify: `! grep -in bats README.md && node --test "tests/contracts/*.test.ts"`) (✓ verify grep and `node --test "tests/contracts/*.test.ts"` passed, 40 tests)
- [x] 3.2 [parallel] [easy] The *Checks* block of `AGENTS.md`, above the lets-spec markers, comments `pnpm test` as "the Node tests, then the type check". Nothing between the markers changes, and `CLAUDE.md` stays a link to `AGENTS.md` (design decision 4) (verify: `! grep -in bats AGENTS.md && test "$(readlink CLAUDE.md)" = AGENTS.md`) (✓ verify grep and `readlink CLAUDE.md` check passed)
- [x] 3.3 [parallel] [easy] The comment on the *Flake check* step in `.github/workflows/ci.yml` says it runs the Node tests, with no mention of bats (design decision 5) (verify: `! grep -in bats .github/workflows/ci.yml`) (✓ verify grep passed)

## 4. The story's acceptance [depends-on: 1, 2, 3]

- [x] 4.1 [easy] `git grep -il bats` finds only archived changes, decision records, `openspec/specs/contract-first-builds/spec.md` and this change's own files, and no file outside those names `common.bash` or `release.bash` (verify: `! git grep -ilE 'bats|common\.bash|release\.bash' -- ':!openspec/changes' ':!docs/decisions' ':!openspec/specs/contract-first-builds/spec.md'`) (✓ verify `git grep` found no file)
- [x] 4.2 [medium] The project's three checks pass, and `nix flake check` still runs every Node test through its `node-tests` check. Then commit the whole change as one `chore:` commit (design decision 6) (verify: `pnpm test && nix flake check && mise run check`) (✓ `pnpm test` (827 tests), `nix flake check` ("all checks passed!", node-tests included) and `mise run check` (19 passed) all passed)

## Deviations Ledger
