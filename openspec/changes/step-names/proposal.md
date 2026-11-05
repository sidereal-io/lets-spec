## Why

`lets-go`, the glossary, the `lets` command and the README name the steps in OpenSpec's words, and disagree with each other: four steps in the skill, five in the records. Every later story in epic #148 names the steps, and `lets delegate step --for` is user-facing, so the names must settle first. This change renames once, mechanically, before any step changes shape.

## What Changes

- **BREAKING** `lets delegate step instructions` and `lets delegate step run` take `--for shape`, `plan`, `review-plan`, `build` or `review-build`, and nothing else (D1). `--for propose`, `propose-review`, `apply` and `apply-review` under `step` exit 2 (D3). The `review` and `handoff` strategies keep their intents.
- **BREAKING** The step guidance keys follow: `delegate.step.plan.guidance`, `delegate.step.build.guidance` and so on. `lets` reads no old key such as `delegate.step.apply.guidance`, and gives no warning (D5).
- `lets-go` names the five steps. Its `Skipped`, `Done` and `Failed` lines use the spoken names, such as `Skipped review plan:` and `Done build:` (D2). Its prompt, answers and report files, and its `--name` values, use `plan`, `build` and `review-build`. It still runs review plan inside plan on `lets-standard` (D4).
- The glossary's *Step* entry lists the five names. It is already committed on this branch (D1).
- The README and `docs/resolvers.md` say the same names, in the `lets-go` section, the delegation glossary, the step list, the config example and the guidance key (D2). The README's flow table keeps its rows and heads its first column *Stage* (D9).
- The tests pin the new strings, and one test checks that an old name under `step` exits 2 (D8).
- Archived changes and ADR-017 and ADR-018 keep the old names (D6).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-config`: the `--for` requirement lists the five new step intents, and the step scenarios use them.
- `delegate-instructions`: the guidance requirement names `delegate.step.<step>.guidance` for the new steps, and the step scenarios use them.
- `delegate-step`: the step scenarios use the new names in `--for` and in the record.
- `delegate-resolvers`: the step scenarios for `cli` and `t3` use the new names.
- `delegate-default`: the default's step scenarios use the new names.
- `lets-go`: the step order, the skip and done lines, the prompt and answers file names, the `--for` and `--name` values, and the end-of-run lines use the new names (D7).

## Impact

- `lets/src/delegate/strategies.ts` and the help text in `lets/src/main.ts`.
- `skills/lets-go/SKILL.md`, `README.md`, `docs/resolvers.md`.
- `tests/lets/delegate/`, `tests/lets/resolvers/cli/`, `tests/lets/resolvers/t3/` and `tests/skill-interfaces.bats`.
- Users of `lets` who put `delegate.step.<old name>.guidance` in their config, or call `lets delegate step` with an old name. This repository's own copies in `.agents/skills/` change at the next release.
