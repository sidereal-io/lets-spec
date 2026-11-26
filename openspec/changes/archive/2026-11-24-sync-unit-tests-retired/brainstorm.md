<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#314 sync-unit-tests-retired — each lets sync behavior has one test,
through the command.
https://github.com/sidereal-io/lets-spec/issues/314

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. This story
stacks on #309 (`sync-tests-in-node`, pull request #322), which wrote
the program tests in `tests/sync/` and the helper module
`tests/support/lets.ts`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which tests does this story retire? | The 94 tests under `tests/lets/sync/`: `main.test.ts` (24), `config.test.ts` (17), `release.test.ts` (17), `skills.test.ts` (16), `block.test.ts` (11), `managed.test.ts` (6) and `init.test.ts` (3). | Evidence: #314 packet; counted in the files |
| D2 | What happens to each one? | It is deleted once a program test in `tests/sync/` checks the same behavior. Where none does, a program test is written first. A unit test stays only by the rule in D7. | Evidence: #314 packet; #308 *Shared decisions* |
| D3 | Does `lets` change? | No. | Evidence: #314 *Scope: out*; #308 *Shared decisions* |
| D4 | May this story extend `tests/support/lets.ts`? | Yes, for what a program test needs, such as a stand-in that records the folder it ran in. It never copies the module. | Evidence: #308 *Shared decisions* |
| D5 | Which behaviors of the 94 tests have no program test today? | The OpenSpec CLI checks (not on `PATH`, exits non-zero, runs once in the project root, `--check` with a missing CLI in both modes), the `release.json` version warning, the flow choice (`LETS_SPEC_FLOW`, and `WORKFLOW_RELEASE` winning over it), an empty `LETS_SPEC_SKILLS`, a failed `git ls-files`, a release that ships a skill lets sync does not own, a folder at the config path, `schema:` forms (quoted, commented, indented, CRLF), `lets-review-code` inside quotes, the order of the config warnings, the mode of a created init file, and six copy cases (execute bit only, write or group bits only, a file the release dropped, a folder link, a dangling folder link, a folder where the release has a file). | Evidence: `tests/lets/sync/*.test.ts` compared with `tests/sync/*.test.ts` |
| D6 | Can a program test reach a failed `git ls-files` with real git? | Yes. A broken `.git/index` makes `git ls-files` exit 128 while `git rev-parse` still works. | Evidence: tried in a scratch repository |
| D7 | Which unit tests stay? | Only the 4 `compareVersions` tests in `release.test.ts`: a pure semver comparison with many branches, each of which would otherwise need a package copy and a full sync run. The 11 `block.ts` tests and the 6 `schemaOf` tests go, because program tests reach each branch by writing one file and running `lets sync`; the marker-text test only compares constants. | Assumption: lets-go accepted the step's recommendation; the user did not decide |
| D8 | How does a program test reach the `release.json` version warning and the flow's release folder, which `lets` reads beside its own package? | The helper runs a copy of the `lets` package (`bin/`, `src/`, `package.json`, a link to `node_modules`) in a temporary folder with its own `release.json` and `releases/<flow>`. `lets` does not change, and every behavior stays tested in `pnpm test`. | Assumption: lets-go accepted the step's recommendation; the user did not decide |
| D9 | What happens to `tests/lets/sync/fixtures/`? | `fake-io.ts` is deleted: only the retired tests import it. `config-0.7.0.yaml` stays in use, because `tests/sync/setup.test.ts` reads it; the design says where it lives. | Evidence: `grep -rn "sync/fixtures" tests lets` |
| D10 | Does this story add glossary terms? | No. *Black-box test* and *stand-in* keep their meaning from #308's *Shared decisions*, and `openspec/glossary.md` stays unchanged. | Evidence: `openspec/changes/archive/2026-11-24-sync-tests-in-node/brainstorm.md` D15 |
| D11 | Do the specs change? | No. The `lets-sync` spec's scenarios are what the program tests must cover. | Evidence: #314 *Scope: out* |
| D12 | Where are the kept unit tests listed? | In the pull request description, each with its reason. | Evidence: #314 packet; #308 *Shared decisions* |

## Changes from the story

- **Changed: `block.ts`'s 11 tests go** (D7). The packet guessed they
  would stay. By #308's rule they do not: the program tests in
  `tests/sync/rules.test.ts` and `tests/sync/skills.test.ts` already
  reach almost every branch by writing one file and running `lets sync`.
- **Added: `config-0.7.0.yaml` is kept** (D9). The packet lists only
  `fake-io.ts` among the fixtures.

Confirmed by user: yes
