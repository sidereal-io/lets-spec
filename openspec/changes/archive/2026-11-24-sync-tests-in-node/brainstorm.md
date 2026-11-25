## Story

#309 sync-tests-in-node — the lets sync tests run the command from Node's
test runner, and the three sync bats files are gone.
https://github.com/sidereal-io/lets-spec/issues/309

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests move? | The 69 tests in `tests/sync-rules.bats` (18), `tests/sync-setup.bats` (22) and `tests/sync-skills.bats` (29). The three files are then deleted. | Evidence: #309 packet; counted in the files |
| D2 | Do the Node tests of `lets sync` under `tests/lets/sync/` change? | No. #314 retires them. | Evidence: #309 packet, *Scope: out* |
| D3 | How does a moved test run `lets`? | As a black-box test: `lets/bin/lets` run as a program, in a temporary git repository, checking only output, exit code, files and git state. | Evidence: #308 *Shared decisions* |
| D4 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D5 | Where does the shared code for these tests live? | One TypeScript helper module in `tests/support/`. It runs `lets` with a time limit, makes a temporary git repository, builds a test release with `build/build-release.mjs`, makes stand-ins and pins the environment. Later stories extend it. | Evidence: #308 *Shared decisions*; #309 packet |
| D6 | What environment does each test pin? | What `tests/support/common.bash` pins today (locale, git config, author and committer), with `LETS_SPEC_SKILLS` and `WORKFLOW_RELEASE` unset, plus `XDG_CONFIG_HOME` pointed at an empty temporary folder. | Evidence: `tests/support/common.bash`; #308 *Shared decisions* |
| D7 | How many releases does a test file build? | One per file, shared by its tests. Each test gets a fresh repository. Tests that build their own release still do. | Evidence: #309 packet; `tests/support/project.bash` |
| D8 | What does `lets sync` find when it looks for the OpenSpec CLI? | A stand-in `openspec` on `PATH` that prints a version, not the real CLI. The flake's `node-tests` check has no OpenSpec CLI, and without one `lets sync` warns and `lets sync --check` fails. | Evidence: #308 *Shared decisions* name `openspec` as a stand-in; `flake.nix` `node-tests`; `lets/src/sync/main.ts` |
| D9 | Do the Node tests use `yq` or `jq`? | No. They edit YAML as text and read `flows.json` with `JSON.parse`. | Evidence: #309 packet |
| D10 | Do the bats helpers `common.bash` and `release.bash` stay? | Yes, until #310. `tests/release-build.bats`, `tests/openspec-compat.bats` and `tests/skill-interfaces.bats` still load them. | Evidence: the `load` lines of those files |
| D11 | Do `pnpm test` and `nix flake check` still run every test? | Yes. Both already run `node --test "tests/**/*.test.ts"` and `bats tests`, so new Node test files and the remaining bats files are picked up. | Evidence: `package.json`; `flake.nix` `node-tests` and `commands` |
| D12 | Three tests in `tests/sync-rules.bats` check the wording of the release's rules text, and #308 bans such tests except after a regression. What happens to them? | Drop "the rules block names only plain things a project owner knows" and "the rules block says lets-go picks, claims and routes": they only look for phrases in the rules text. Keep "the rules say lets sync rewrites the copies, in both skills modes" as a regression test that names pull request #32, with its wording checks and its check that both skills modes give the same rules. So 67 tests move, not the 69 of D1. (The question said 68, but 69 less 2 is 67.) | Assumption |
| D13 | Only the three sync bats files load `tests/support/project.bash`. Is it deleted with them? | Yes. Nothing else loads it. #310 removes `common.bash` and `release.bash`. | Assumption |
| D14 | The README's *Development* section says `tests/` holds "`*.bats`: end-to-end tests of `lets sync`, …", which is false once this change merges. Does this change fix it? | Yes: only that table row, so the README stays true. The full rewrite of the README, `AGENTS.md` and `.github/workflows/ci.yml` stays with the epic's last story. | Assumption |
| D15 | Do the terms *Black-box test* and *Stand-in* go into `openspec/glossary.md` on this branch? | No. This branch adds no glossary terms, and `openspec/glossary.md` stays unchanged. The terms keep their meaning from #308's *Shared decisions*. | User |

## Changes from the story

- **Cut: two tests of the rules text's wording** (D12). The story moves 69
  tests. Two of them only look for phrases in the release's rules text,
  which #308 bans unless a test guards a regression. 67 tests move.
- **Added: delete `tests/support/project.bash`** (D13). Only the three
  sync bats files load it.
- **Added: fix one row of the README's *Development* table** (D14), so
  it no longer says the bats files test `lets sync`.

Confirmed by user: yes
