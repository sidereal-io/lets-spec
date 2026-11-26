<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

Mo writes guidance in the lets config to pick the model for each session,
but cannot tell `delegate.step.review-plan` from `delegate.review.plan`.
Both are live, and they steer two nested sessions: the review plan step's
own session, and the read-only reviewer it starts. The keys follow the
command that reads them (ADR-011), so nested sessions get near-identical
keys, and the README never says which session each one steers. A reader
took one for a leftover on 2026-11-24.

## What Changes

- **BREAKING:** the guidance keys become one key per step, directly under
  `delegate`: `delegate.shape`, `delegate.plan`, `delegate.review-plan`,
  `delegate.build`, `delegate.review-build` and `delegate.story` (D1).
  Each is a mapping with a `guidance` leaf, such as
  `delegate.plan.guidance` (D4).
- `delegate.review-plan` and `delegate.review-build` steer the read-only
  plan and code reviewers. The review plan and review build steps' own
  sessions take `delegate.plan` and `delegate.build` (D2). No key steers a
  review step's own session apart from plan or build.
- The commands and their `--for` values stay as they are; only the key
  each one reads changes (D9).
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
  `lets-review-plan`, `lets-review-build` and `lets-review-pr`.
- A new decision record replaces ADR-011's rule that each setting sits at
  the path of the command that reads it (D3). ADR-011's one-file layout
  stands.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-config`: the file holds `version: 4`; the guidance keys sit
  directly under `delegate`; a version 3 file's message names each old
  guidance key and its new one; the README's guidance table is kept in
  step with the keys lets reads.
- `delegate-instructions`: `guidance` comes from the key of the step the
  session serves, and an old `delegate.review` or `delegate.step` entry
  stops `instructions` with a message naming the new key.
- `delegate-default`: its scenarios use `version: 4` and a new guidance
  key.
- `go-questions`: a valid file holds `version: 4`, and the old-version
  message says the version must be `4`.
- `lets-backlog`: a valid file holds `version: 4`.
- `lets-go`: *Run a step* names `delegate.<step>.guidance`, with the
  review steps reading `delegate.plan` and `delegate.build`.

## Impact

- Code: `lets/src/delegate/config.ts` (`CONFIG_VERSION`, the `Config`
  type, `checkConfig`, `guidanceFor`, the version message),
  `lets/src/delegate/strategies.ts` (which key each strategy and intent
  reads), `lets/src/delegate/instructions.ts`, and the help text in
  `lets/src/main.ts`.
- Tests: about twenty test files write `version: 3` fixtures, and the
  instructions and config tests name old keys. A new contract test reads
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
  needs only the version change.
- Depends on #306 (pull request #350), which removes `delegate.handoff`.
