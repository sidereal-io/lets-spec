<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- No task adds a test: the change removes tools and words, and adds no behavior.
     Each verify command checks the task's outcome directly. Section 4 runs the
     project's three checks. Design decision 6: the whole change is one `chore:`
     commit, made in task 4.2. -->

## 1. The tools install no bats

- [ ] 1.1 [parallel] [easy] `mise.toml` pins no `bats`, `jq` or `yq`. The pins for `node`, `pnpm`, `gh`, the OpenSpec CLI and lets-spec stay (design decision 1) (verify: `! grep -nE '^(bats|jq|yq) =' mise.toml && grep -q '^gh =' mise.toml`)
- [ ] 1.2 [easy] The flake's `commands` check no longer has `pkgs.bats` in its `nativeBuildInputs`, and keeps `pkgs.jq` and `pkgs.yq-go` for its smoke test. Its comment drops the sentence "No bats file is left to run here, …" and keeps the description of the smoke test (design decisions 1 and 5) (verify: `nix build --no-link .#checks.x86_64-linux.commands`)
- [ ] 1.3 [easy] The flake's dev shell gives only the OpenSpec CLI, `nodejs_26` and `pnpm`: `pkgs.bats`, `pkgs.jq` and `pkgs.yq-go` leave its `packages` (design decision 1) (verify: `nix develop --ignore-environment --command sh -c '! command -v bats && ! command -v jq && ! command -v yq && node --version && pnpm --version && openspec --version'`)

## 2. The tests hold no bats helper

- [ ] 2.1 [parallel] [easy] `tests/support/common.bash` and `tests/support/release.bash` are deleted, and every Node test still passes without them (verify: `test ! -e tests/support/common.bash && test ! -e tests/support/release.bash && pnpm test`)
- [ ] 2.2 [parallel] [easy] The comment on `build` in `tests/release/build.test.ts` says the function runs the release build "as the flake does", and no longer names `release.bash` (design decision 5) (verify: `! grep -n 'release\.bash' tests/release/build.test.ts && node --test tests/release/build.test.ts`)

## 3. The documents name no bats

- [ ] 3.1 [parallel] [easy] The README's *Development* section says that `nix develop` and `mise install` both give Node 26, pnpm and the OpenSpec CLI. In the *Testing* table, the `pnpm test` row reads "The Node tests and the type check", and the `bats tests` row is gone (design decisions 2 and 3) (verify: `! grep -in bats README.md && node --test "tests/contracts/*.test.ts"`)
- [ ] 3.2 [parallel] [easy] The *Checks* block of `AGENTS.md`, above the lets-spec markers, comments `pnpm test` as "the Node tests, then the type check". Nothing between the markers changes, and `CLAUDE.md` stays a link to `AGENTS.md` (design decision 4) (verify: `! grep -in bats AGENTS.md && test "$(readlink CLAUDE.md)" = AGENTS.md`)
- [ ] 3.3 [parallel] [easy] The comment on the *Flake check* step in `.github/workflows/ci.yml` says it runs the Node tests, with no mention of bats (design decision 5) (verify: `! grep -in bats .github/workflows/ci.yml`)

## 4. The story's acceptance [depends-on: 1, 2, 3]

- [ ] 4.1 [easy] `git grep -il bats` finds only archived changes, decision records, `openspec/specs/contract-first-builds/spec.md` and this change's own files, and no file outside those names `common.bash` or `release.bash` (verify: `! git grep -ilE 'bats|common\.bash|release\.bash' -- ':!openspec/changes' ':!docs/decisions' ':!openspec/specs/contract-first-builds/spec.md'`)
- [ ] 4.2 [medium] The project's three checks pass, and `nix flake check` still runs every Node test through its `node-tests` check. Then commit the whole change as one `chore:` commit (design decision 6) (verify: `pnpm test && nix flake check && mise run check`)

## Deviations Ledger
