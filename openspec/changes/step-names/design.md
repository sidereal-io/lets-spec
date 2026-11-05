## Context

`lets delegate` has three strategies. Each takes `--for <intent>`, and `STRATEGIES` in `lets/src/delegate/strategies.ts` lists the intents per strategy. Commander builds the `--for` choices from that list, so an intent that is not listed exits 2 before any resolver is asked. The config reader looks guidance up by strategy, then intent, as `delegate.<strategy>.<intent>.guidance`, and keeps unknown keys as written. The `Intent` type is one union across the three strategies; `plan` is already a review intent.

`lets-go` names its steps in prose, in printed lines, in the `--for` and `--name` values it passes, and in the files it writes under `.workspace/lets-go/`. The `lets-go` spec and `tests/skill-interfaces.bats` pin those strings. The delegate specs' scenarios run steps with `--for apply` and `--for propose`.

This change is the first of six stacked on #177. The five that follow edit the same files, so this one changes names only.

## Goals / Non-Goals

**Goals:**
- One set of step names in code, skill, specs, docs and tests, as the ledger's D1 and D2 say.
- An old step name under `lets delegate step` fails fast, at `--for`.
- The diff is mechanical, so the stacked stories rebase onto it cleanly.

**Non-Goals:**
- Changing what any step does, or when `lets-go` runs it. Review plan still runs inside plan (D4).
- Aliases, warnings or migration for old `--for` values or old config keys (D5).
- Renaming the `review` or `handoff` intents, or the `openspec-propose` and `openspec-apply-change` skills, which keep OpenSpec's names (D3).
- Rewriting archived changes or decision records (D6).

## Test Seams

- **Primary test seam:** `tests/lets/delegate/cli.test.ts`, which runs the real `lets` command and checks `--for`'s choices, the help text and the subagent fallback; and `tests/skill-interfaces.bats`, which reads `skills/lets-go/SKILL.md` for the printed lines and command forms.
- **Existing seams reused:** `tests/lets/delegate/strategies.test.ts`, `instructions.test.ts`, `step.test.ts`, `config.test.ts`, and the resolver tests in `tests/lets/resolvers/cli/` and `tests/lets/resolvers/t3/`, which pass `for:` to the step command in process.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** the `step` strategy's intents and help text in `lets`; the `lets-go` skill; the README and `docs/resolvers.md`; the six specs the proposal lists; and any user config that holds `delegate.step.<old name>.guidance`.

## Decisions

1. **One `Intent` union, with `plan` shared.** `Intent` gains `review-plan`, `build` and `review-build`, loses `propose`, `propose-review` and `apply-review`, and keeps `plan`, `code` and `apply`. `review` uses `plan`; `step` uses it too. Alternative: a separate `StepIntent` type. Rejected: the guidance lookup and the record line are keyed by strategy and intent, so nothing collides, and the union is what `forOption` already reads.
2. **Rename in place, with no aliases.** `--for apply` under `step` exits 2 like any other bad choice, and `delegate.step.apply.guidance` is simply not read. Alternative: accept the old names for one release and warn. Rejected: `lets` is pre-1.0 with one known user, and an alias needs tests of its own and a second change to remove it.
3. **Spoken form in prose, kebab-case in identifiers.** Printed lines say `Skipped review plan:`; `--for`, `--name`, file names and config keys say `review-plan`. This follows the packet's own examples and keeps every identifier one shell word.
4. **Requirement headings rename; scenario headings do not.** The two `lets-go` requirements named after a step rename through a `RENAMED` section, with the `MODIFIED` block under the new heading. Scenario headings keep their old names, because `openspec validate` refuses a `MODIFIED` block whose scenario names differ from the main spec's. A scenario's heading is a label; its WHEN and THEN carry the new names.
5. **The `lets-go` skill keeps its shape.** Its *The steps* section lists the five names in order, says shape runs inside *Start*, and says review plan runs inside plan on `lets-standard` until a later story separates it. No section moves. The story that splits review plan out edits that one paragraph.
6. **Tests pin the rename from three sides.** The strategies test lists the five intents. A cli test checks that `step instructions --for apply` exits 2 and names `--for`. The bats test pins the five skip lines, `--for shape`, and fails if the skill still says `Skipped propose` or `Skipped apply`.
7. **The README's flow table heads its first column *Stage*.** Its rows are OpenSpec artifacts and the finishing work, not the five steps, so they stay. The README's own glossary of delegation terms gives *Step* its new examples.

None of these is costly to reverse, so the ADR step records none.

## Risks / Trade-offs

- [A user's `delegate.step.apply.guidance` stops being read, with no warning] → The proposal marks it **BREAKING**, and the README's config example and `--for` paragraph show the new keys.
- [An old name survives somewhere the packet did not list] → The last task greps the repository for `propose-review`, `apply-review`, `Skipped propose`, `Skipped apply` and `--for propose` outside `openspec/changes/archive/`, `docs/decisions/` and the synced copies, and fixes what it finds.
- [Scenario headings in the main specs keep old names] → Accepted; the validator forces it, and the headings are labels.
- [The five stacked stories above conflict on rebase] → None exists yet. This change goes first for that reason.

## Migration & Rollback

No data changes shape. A user renames `delegate.step.propose`, `propose-review`, `apply` and `apply-review` in their `lets` config to `plan`, `review-plan`, `build` and `review-build` by hand. Rollback is reverting the branch's commits.
