<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- Build order follows the lets-verify-contracts skill
     (skills/lets-verify-contracts/SKILL.md), not test-first: each task
     takes one check through its contract, its code and the tests that
     prove it, on the real texts and on a small folder written for the
     test. Every test is a Node test run by node --test; write no bats
     test. The spec deltas are already written: archive applies them, and
     no task edits openspec/specs/. design.md's Decisions say what each
     check reads and how it decides. -->

## 1. Node checks that replace the last bats name checks

- [x] 1.1 [medium] `tests/contracts/skills.test.ts` has `requiredSkillFindings(root)`, by design.md's *The skills each flow must ship (D2)*: each skill that the routing table in `overlays/AGENTS.md` or a file of `skills/lets-go/` names, and that is a folder of `skills/`, ships in every flow. A routing-table entry point has no exemption. Any other such skill is exempt when a schema names it and the flow ships none of the schemas that name it. Each finding is `{ file: 'flows.json', name: <skill> }`. The check passes on this repository. Small projects show one finding for a skill `lets-go` names that a flow leaves out, one for a routing-table entry point a flow leaves out even though another flow's schema names it, and none for a skill that only another flow's schema names (verify: `node --test tests/contracts/skills.test.ts`) (✓ `node --test tests/contracts/skills.test.ts` passed, 13 tests; `pnpm exec tsc --noEmit` passed; the repository test failed when `lets-shape` and `lets-plan` were taken out of `minimal`)
- [x] 1.2 [parallel] [medium] `tests/contracts/terms.test.ts` has `termFindings(terms, glossary)`, by design.md's *The glossary copy (D3)*: each `##` heading of `skills/lets-go/references/terms.md` outside code is a term, and the glossary must have a `##` heading for it whose text, with whitespace collapsed, is the same. Each finding names `terms.md` and the term. The check passes on `terms.md` and `openspec/glossary.md`. Small pairs show one finding for a *Procedure* entry whose text differs, and one for a term the glossary lacks (verify: `node --test tests/contracts/terms.test.ts`) (✓ `node --test tests/contracts/terms.test.ts` passed, 4 tests; `pnpm exec tsc --noEmit` passed; the repository test failed, naming `Part`, when one word of `terms.md` changed)

## 2. The bats file goes [depends-on: 1]

- [x] 2.1 [medium] `tests/skill-interfaces.bats` is deleted, after one last search of it for each test whose body checks a flow (`flow_skills`), a build (`build "$out"`, `cmp`), a file (`[ -f`, `[ -e`, `[ -d`), a link (`assert_reference_links`) or the glossary copy (`terms_match_glossary`). Each test the search finds is in design.md's table *What replaces each bats test of a name or a link*. If one is not, stop and report it as a gap, without deleting the file. The other bats files and `tests/support/common.bash` stay (verify: `test ! -e tests/skill-interfaces.bats && bats tests`) (✓ `test ! -e tests/skill-interfaces.bats && bats tests` passed, 30 of 30; the search of each test body found 23 tests, each in design.md's table, and no gap)
- [x] 2.2 [parallel] [easy] The tests row of the README's *Development* table names `contracts/`, the Node checks of each command, link, skill, template and `gh` command a text names, and says that the `*.bats` files test the release build and each schema with the OpenSpec CLI, as design.md's *The README* says (verify: `grep -n "contracts/" README.md && node --test tests/contracts/links.test.ts tests/contracts/commands.test.ts`) (✓ the grep found line 728; `node --test tests/contracts/links.test.ts tests/contracts/commands.test.ts` passed, 18 tests)

## 3. Integration [depends-on: 2]

- [x] 3.1 [medium] Every check passes: `pnpm test`, `mise run check` and `nix flake check`. Nothing outside `openspec/` and `docs/decisions/` names `skill-interfaces`; `openspec/specs/` stops naming it when archive applies this change's deltas. The pull request lists each bats test of a name or a link with what replaces it, as design.md's table does, and says that this story added no unit test and kept none (verify: `nix flake check`) (✓ `nix flake check` passed; `pnpm test` passed, 1009 Node tests and 30 bats tests; `mise run check` passed, 19 of 19; `git grep skill-interfaces` outside `openspec/` and `docs/decisions/` found nothing; pull request #331 holds the table)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
