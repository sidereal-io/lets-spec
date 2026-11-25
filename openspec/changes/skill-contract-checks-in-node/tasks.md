<!-- Build order follows the lets-verify-contracts skill, not test-first:
     each task takes one behavior through its contract, its code and the
     test that proves it. design.md's Decisions say what each check reads
     and how it decides. Where a check finds a broken name in a real text,
     the same task fixes the name and keeps the text's meaning (D9). -->

## 1. Shared contracts

- [x] 1.1 [medium] `tests/contracts/texts.ts` reads the texts of design.md's *Layout* decision once each, under a root folder a test can choose: for each file, its prose outside fenced code and code spans, its code spans, its fenced code lines and its headings with their anchors by GitHub's rule, and a `Finding` type that names a file and a name. `tests/support/lets.ts` exports `letsCommandTree()`, which runs `lets --help` and each command's `--help` in parallel and returns each command path with its subcommands and options, leaving out commander's built-in `help` command. Each export has a doc comment that says what it returns and how it fails (verify: `pnpm check`) (✓ `pnpm check` passed)

## 2. Checks [depends-on: 1]

- [x] 2.1 [parallel] [medium] `tests/contracts/commands.test.ts`: every `lets` command and flag a text names is in `letsCommandTree()`, by design.md's *Commands and flags* rules. Small texts show one finding each for an unknown subcommand, an unknown flag and a mention that ends on a command with subcommands below the top level, such as `lets delegate review --for plan`, and no finding for `lets delegate` alone, `--`, a placeholder or `lets delegate step --for` in a small text at `skills/lets-go/references/terms.md` (verify: `node --test tests/contracts/commands.test.ts`) (✓ `node --test tests/contracts/commands.test.ts` passed)
- [x] 2.2 [medium] `tests/contracts/links.test.ts`, source tree: every link in a skill's `SKILL.md` or reference file resolves inside `skills/`, and every link in `README.md` and `docs/*.md` resolves in the repository, file and anchor. Small texts show one finding each for a missing file, a missing heading in the same file, a missing heading in another file and a link that leaves `skills/`, and none for a URL, a placeholder, an emoji heading or a second heading of the same name. The README's link to the deleted `docs/upgrading.md` is fixed (verify: `node --test tests/contracts/links.test.ts`) (✓ `node --test tests/contracts/links.test.ts` passed)
- [x] 2.3 [complex] `tests/contracts/links.test.ts`, published flows: for each flow in `flows.json`, a release built once with its schemas and skills, in which every link in each installed skill's files resolves from its own folder, and every link in each `schema.yaml` and in `fragments/AGENTS.md` resolves from the overlay's root, each by real path and inside the overlay. A small release-shaped folder shows one finding for a link to a skill the flow leaves out (verify: `node --test tests/contracts/links.test.ts`) (✓ `node --test tests/contracts/links.test.ts` passed)
- [x] 2.4 [medium] `tests/contracts/skills.test.ts`: each `` `<name>` skill `` a text names is a folder of `skills/` or an `openspec-*` name; each skill a flow's schemas or config name is one `flows.json` ships with that flow; and each skill's `name:` is its folder. Small texts show one finding for each of the three (verify: `node --test tests/contracts/skills.test.ts`) (✓ `node --test tests/contracts/skills.test.ts` passed)
- [x] 2.5 [medium] `tests/contracts/skills.test.ts`: each skill a flow ships, other than an entry point the routing table in `overlays/AGENTS.md` names, is named by that flow's schemas, its config or one of its shipped skills. A small flow shows one finding for a shipped skill nothing names (verify: `node --test tests/contracts/skills.test.ts`) (✓ `node --test tests/contracts/skills.test.ts` passed)
- [ ] 2.6 [parallel] [easy] `tests/contracts/templates.test.ts`: each `openspec/schemas/<schema>/templates/<file>.md` a text names is a file in `schemas/`. A small text shows one finding for a template that does not exist (verify: `node --test tests/contracts/templates.test.ts`)
- [ ] 2.7 [parallel] [medium] `tests/contracts/gh.test.ts`: each `gh <group> <command>` a text names is one the real `gh` knows by its usage line, and each `gh api` endpoint is one `gh api --help` shows. A small text shows one finding for an unknown command, and the test fails with a message that names `gh` when `gh` is not on `PATH` (verify: `node --test tests/contracts/gh.test.ts`)

## 3. Integration [depends-on: 2]

- [ ] 3.1 [easy] The flake's `node-tests` check has `pkgs.gh` among its inputs, and its comment no longer says the tests use no real `gh` (D8) (verify: `nix build .#checks.x86_64-linux.node-tests`)
- [ ] 3.2 [medium] Every check passes: `pnpm test`, `mise run check` and `nix flake check`, with `tests/skill-interfaces.bats` unchanged and still running (D4). The pull request lists each bats test this change replaces with its Node test, as design.md's table does, and says this story kept no unit test and deleted no test (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
