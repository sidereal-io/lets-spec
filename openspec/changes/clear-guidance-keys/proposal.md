<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

Mo writes guidance in the lets config to pick the model for each session,
but cannot tell `delegate.step.review-plan` from `delegate.review.plan`.
Both are live, and they steer two nested sessions: the review plan step's
own session, and the read-only reviewer it starts. The keys follow the
command that reads them (ADR-011), so nested sessions get near-identical
keys, and the README never says which session each one steers. A reader
took one for a leftover on 2026-11-24. The `--for` values blur the same
line: `--for plan` under `lets delegate review` means the plan reviewer,
and under `lets delegate step` the plan step.

## What Changes

- **BREAKING:** the guidance keys become one key per step, directly under
  `delegate`: `delegate.shape`, `delegate.plan`, `delegate.review-plan`,
  `delegate.build`, `delegate.review-build` and `delegate.story` (D1).
  Each is a mapping with a `guidance` leaf, such as
  `delegate.plan.guidance` (D4).
- `delegate.review-plan` and `delegate.review-build` steer the read-only
  plan and code reviewers. The review plan and review build steps' own
  sessions take `delegate.plan` and `delegate.build` (D2). No key steers a
  review step's own session apart from plan or build. This rule is
  temporary: epic #352's stories #354 and #355 remove it, when `lets-go`
  starts each reviewer itself.
- **BREAKING:** `lets delegate review` takes `--for review-plan` and
  `--for review-build`, in place of `--for plan` and `--for code`, so
  `--for` always names a step (D9). `--for plan` or `--for code` under
  `review` exits 2, naming the new values. The review record's `for`
  field holds the new value. `lets delegate step` keeps its `--for`
  values. The commands stay as they are.
- **BREAKING:** the lets config moves to `version: 4` (D3). A version 3
  file fails every lets command as a wrong version does today, and the
  message lists each old guidance key in the file with its new key. In a
  version 4 file, `delegate.review` or `delegate.step` makes
  `lets delegate review instructions` and `lets delegate step instructions`
  exit 2, naming each old key and its new one. The run commands ignore
  them (D5).
- The README's *Set up delegation* section gets one table, with a row per
  guidance key: the session it steers, the command that reads it, the
  skill that runs that command, and a sensible value (D6, D7). The
  `lets delegate` help text and `docs/resolvers.md` each get one sentence
  and a pointer to that table (D6).
- A Node test fails when the README's table lacks a row for a key lets
  reads, or has a row for a key it does not read (D8).
- The skills that name a guidance key name its new one:
  `lets-go` (*Run a step*, and the epic run's story run),
  `lets-review-plan`, `lets-review-build` and `lets-review-pr`. The three
  review skills pass `--for review-plan` or `--for review-build` (D9).
- A new decision record replaces ADR-011's rule that each setting sits at
  the path of the command that reads it (D3). ADR-011's one-file layout
  stands.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-config`: the file holds `version: 4`; the guidance keys sit
  directly under `delegate`; `review`'s intents are `review-plan` and
  `review-build`; a version 3 file's message names each old guidance key
  and its new one; the README's guidance table is kept in step with the
  keys lets reads, and says the review steps' shared keys are temporary.
- `delegate-instructions`: `guidance` comes from the key of the step the
  session serves, and an old `delegate.review` or `delegate.step` entry
  stops `instructions` with a message naming the new key.
- `delegate-default`: its scenarios use `version: 4`, a new guidance
  key and `--for review-build`.
- `delegate-review`: the review record's `for` field holds
  `review-plan` or `review-build`.
- `delegate-resolvers`: its scenarios run `lets delegate review` with
  `--for review-plan` or `--for review-build`. No resolver behavior
  changes.
- `go-questions`: a valid file holds `version: 4`, and the old-version
  message says the version must be `4`.
- `lets-backlog`: a valid file holds `version: 4`.
- `lets-go`: *Run a step* names `delegate.<step>.guidance`, with the
  review steps reading `delegate.plan` and `delegate.build`.

## Impact

- Code: `lets/src/delegate/config.ts` (`CONFIG_VERSION`, the `Config`
  type, `checkConfig`, `guidanceFor`, the version message),
  `lets/src/delegate/strategies.ts` (`review`'s intents, and which key
  each strategy and intent reads), `lets/src/delegate/instructions.ts`, and the help text in
  `lets/src/main.ts`.
- Tests: about twenty test files write `version: 3` fixtures, the
  instructions and config tests name old keys, and about ten test files
  run `lets delegate review` with `--for plan` or `--for code`. A new contract test reads
  the README's table.
- Documents: `README.md`, `docs/resolvers.md`, ADR-011 and ADR-007 (their
  notes point to the new record), and a new decision record in
  `docs/decisions/`.
- Skills in `skills/`: `lets-go` (`SKILL.md` and
  `references/epic-run.md`), `lets-review-plan`, `lets-review-build` and
  `lets-review-pr`. This repository's own copies change at the next
  release.
- Users: every user's lets config and every repository's
  `.lets/config.yaml` must move to `version: 4` and rename their guidance
  keys. A file that only sets `delegate.resolvers`, `go` or `backlog`
  needs only the version change. Any script that runs
  `lets delegate review --for plan` or `--for code` must pass the new
  value.
- Depends on #306 (pull request #350), which removes `delegate.handoff`.
