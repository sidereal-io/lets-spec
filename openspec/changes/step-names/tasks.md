<!-- One task is one behavior, its test, and the code that passes it.
     Each task is one line: - [ ] X.Y [tags] <behavior> (verify: <command>) -->

## 1. The step intents in `lets`

- [x] 1.1 [easy] `STRATEGIES.step.intents` is `shape`, `plan`, `review-plan`, `build`, `review-build`, from a `STEP_INTENTS` const tuple; `Intent` drops `propose`, `propose-review` and `apply-review`; `StepOptions['for']` is `StepIntent`. The strategies test pins the tuple, and the step, instructions, config and resolver tests pass `plan` or `build` to step calls. (verify: `node --test tests/lets/delegate/strategies.test.ts tests/lets/delegate/step.test.ts tests/lets/delegate/instructions.test.ts tests/lets/delegate/config.test.ts tests/lets/resolvers/cli/delegate.test.ts tests/lets/resolvers/t3/delegate.test.ts && pnpm check`) (✓ the six node test files and `pnpm check` passed)
- [x] 1.2 [easy] `lets delegate step instructions --for apply` exits 2, prints nothing on stdout, and names `--for` on stderr; `--for build` and `--for plan` still work with no config; the `delegate --help` example reads `step: build: guidance:` and the step strategy's help lists the five names. (verify: `node --test tests/lets/delegate/cli.test.ts`) (✓ `node --test tests/lets/delegate/cli.test.ts` passed)

## 2. The skill, the docs and the bats test [depends-on: 1]

- [x] 2.1 [medium] `skills/lets-go/SKILL.md` names the five steps: *The steps* lists them in order and says review plan runs inside plan on `lets-standard` until a later story separates it; the prompt, answers and report file names, `--for` and `--name` values, the step table and the `Done`, `Skipped` and `Failed` lines use the new names in their spoken or kebab-case form as design decision 3 says; the description line too. The bats test pins `Skipped plan:`, `Skipped review plan:` (both forms), `Done review plan:`, `Skipped build:`, `Skipped review build:`, `Done plan: <date>. <evidence>`, `Done build: <date>. <evidence>` and `Done review build: <date>. <evidence>`, and fails on `Skipped propose`, `Skipped apply`, `propose review`, `apply review`, `propose-review`, `apply-review`, `--for propose` and `--for apply`. (verify: `bats tests/skill-interfaces.bats`) (✓ `bats tests/skill-interfaces.bats` passed)
- [x] 2.2 [parallel] [easy] `README.md` says the new names in the `lets-go` section and its skip example, the delegation glossary's *Step* entry, the `--for <step>` list, the config example (`step: build:`), the `step.<step>` guidance paragraph, and heads the flow table's first column *Stage*; `docs/resolvers.md` names `delegate.step.build.guidance`. (verify: `bats tests/skill-interfaces.bats`) (✓ `bats tests/skill-interfaces.bats` passed)

## 3. Sweep and whole-suite check [depends-on: 2]

- [x] 3.1 [easy] No old step name is left outside `openspec/changes/archive/`, `docs/decisions/`, `.agents/`, `openspec/schemas/` and `lets/dist/`: grep for `propose-review`, `apply-review`, `propose review`, `apply review`, `Skipped propose`, `Skipped apply`, `--for propose`, `--for apply`, `delegate.step.apply`, `step.apply` and `for: 'apply'`, keep the hits under `handoff`, and fix the rest, including the comment in `lets/src/delegate/step.ts`. (verify: `! grep -rnE "propose-review|apply-review|propose review|apply review|Skipped propose|Skipped apply|--for propose|delegate\.step\.apply|step\.apply" --include='*.ts' --include='*.md' --include='*.bats' --include='*.nix' lets/src skills tests README.md docs/*.md flake.nix openspec/specs`) (✓ the grep finds only the bats test's list of banned phrases in lets/src, skills, tests, README.md, docs and flake.nix; in a rehearsed archive, openspec/specs keeps only a scenario heading, as design decision 4 allows, and the new exit 2 scenario)
- [ ] 3.2 [easy] The whole suite and the flake pass on the renamed tree. (verify: `pnpm test && nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->

- 2026-11-04, task 2.2: the README's comparison table also says *Planning stages*, not *Planning steps*, and the flow table's lead-in says *stage by stage*. Design decision 7 wants *Step* to mean one thing in the README; these two used it for the flow's stages.
- 2026-11-04, task 3.1: the verify grep cannot pass as written before archive. `tests/skill-interfaces.bats` holds the old names as the phrases it bans, and `openspec/specs` changes only when archive merges the delta specs. I ran the grep on the code, skills, tests and docs, and checked `openspec/specs` after a rehearsed archive in a throwaway worktree.
