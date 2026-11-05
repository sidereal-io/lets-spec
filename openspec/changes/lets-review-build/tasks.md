<!-- One task is one behavior, its test, and the code that passes it.
     Each task is one line: - [ ] X.Y [tags] <behavior> (verify: <command>) -->

## 1. The skill and the flow

- [ ] 1.1 [medium] `skills/lets-review-build/SKILL.md` holds `lets-review-code`'s sections as they are, with a *Start* that reads the pull request's body and reviews only when there is no **Code review** section or *Check an earlier review* says to, and a *Finish the change* that follows the project's `operationGuidance`, runs the `openspec-verify-change` skill, archives with the `openspec-archive-change` skill as its own `chore:` commit, and runs `gh pr ready`; `skills/lets-review-code/` goes; the `standard` flow in `flows.json` ships `lets-review-build` in its place; `tests/support/release.bash`'s fixture ships it; in `tests/skill-interfaces.bats` each `lets-review-code` pin names `lets-review-build`, the flow-ships comment says the skill is reached through `lets-build`'s *Finish the change*, and new checks pin `**Code review**`, the two OpenSpec skill names and `gh pr ready` in the new skill. (verify: `bats tests/skill-interfaces.bats`)
- [ ] 1.2 [easy] `skills/lets-build/SKILL.md`'s *Finish the change* reads the `schema:` line of `openspec/config.yaml`; on `lets-standard` it invokes the `lets-review-build` skill and stops when it is done; on any other schema it keeps its four steps, without the sentence that names the project's rules as where the code review lives. The test pins `` `lets-review-build` skill `` and `openspec/config.yaml` in `lets-build`, and fails when any file under `skills/`, `schemas/` or `overlays/`, or `flows.json`, says `lets-review-code`. (verify: `bats tests/skill-interfaces.bats`)

## 2. The config rule and lets sync [depends-on: 1]

- [ ] 2.1 [easy] `overlays/openspec/config.d/lets-standard.yaml` loses its `operations.archive` entry and the comment above it; `tests/release-build.bats` checks that neither release's config has an `operations` key; `tests/openspec-compat.bats`'s three archive-guidance tests become one that checks the CLI returns no guidance from the standard flow's config. (verify: `bats tests/release-build.bats tests/openspec-compat.bats`)
- [ ] 2.2 [medium] `checkConfig` in `lets/src/sync/config.ts` returns the D6 warning, with the config path first, when a line holds `lets-review-code` and does not start with `#` after any spaces, and nothing for a comment line or a clean config; `tests/lets/sync/config.test.ts` covers the release 0.7.0 rule, a comment, a clean config and the warning's order after a schema warning. (verify: `node --test tests/lets/sync/config.test.ts`)
- [ ] 2.3 [easy] `tests/sync-setup.bats` checks the real `lets sync` lists the problem for the 0.7.0 config with exit 0, lists none when the name sits in a comment, and that `lets sync --check` exits 0 with the name in the config; `docs/lets-sync.md`'s list of what `lets sync` warns about names a config that still names `lets-review-code`. (verify: `bats tests/sync-setup.bats`)

## 3. The README and the whole-suite check [depends-on: 2]

- [ ] 3.1 [easy] `README.md`'s flows table names `lets-review-build` in *Skills it adds*, says `Yes` and `No` with no link in *Independent code review*, names `lets-review-build` in stages 9 and 10, and loses its *Turning the code review off* section; the test fails when `README.md` says `lets-review-code` or `#turning-the-code-review-off`. (verify: `bats tests/skill-interfaces.bats`)
- [ ] 3.2 [easy] No `lets-review-code` is left in `skills/`, `schemas/`, `overlays/`, `flows.json` or `README.md`; then the whole suite and the flake pass. (verify: `! grep -rn lets-review-code skills schemas overlays flows.json README.md && pnpm test && nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
