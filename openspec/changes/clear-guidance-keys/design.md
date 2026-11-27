<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `lets/src/delegate/config.ts` reads the lets config. `parseDocument`
  checks each file's `version` against `CONFIG_VERSION` (3) and throws a
  `UsageError` naming the file. `checkConfig` keeps `delegate.resolvers`
  and copies `delegate.review` and `delegate.step` unchecked.
  `guidanceFor(config, strategy, intent, fileOf)` walks
  `delegate.<strategy>.<intent>.guidance` and names the bad key on a
  wrong type.
- Every reader of the config goes through `readLetsConfig`, which calls
  `parseDocument` on each file before the merge: `lets delegate` review,
  step and instructions, `lets go questions`
  (`lets/src/go/questions.ts`) and `lets backlog`
  (`lets/src/backlog/config.ts`). `lets backlog` wraps any `UsageError`
  in `unknown-backlog-provider` and keeps its message. So a version
  message written in `parseDocument` reaches every command with no
  change to the callers.
- `lets/src/delegate/strategies.ts` holds `STRATEGIES`, each strategy's
  intents: `plan` and `code` for `review`, the five steps and `story`
  for `step`. The `--for` choices in `lets/src/main.ts` come from it, and
  commander rejects any other value with a message that lists the
  choices. No resolver reads the intent.
- `lets/src/main.ts` holds the help: `DELEGATE_HELP`, with a
  `version: 3` example and the `delegate.<strategy>.<intent>.guidance`
  sentence, and `INSTRUCTIONS_HELP`, shared by both `instructions`
  commands, which names the same pattern.
- About twenty test files write `version: 3` fixtures. Only
  `tests/delegate/instructions.test.ts` and `tests/lets/delegate/*` name
  guidance keys. About ten test files run `review` with `--for plan` or
  `--for code`, mostly `tests/delegate/` and `tests/lets/`.
- The README, `docs/resolvers.md` and four skills in `skills/` name the
  old keys. `docs/resolvers.md`, `lets-review-plan`, `lets-review-build`
  and `lets-review-pr` also run `review` with `--for plan` or
  `--for code`. The copies in `.agents/skills/` come from the pinned release
  and are not edited.

## Goals / Non-Goals

**Goals:**

- `--for` always names a step: `review` takes `review-plan` and
  `review-build` (D9).
- One table in code says which guidance key each strategy and intent
  reads. Everything else is derived from it: `guidanceFor`, the rename
  messages, the help lines and the README test.
- A user with an old config gets one message that says exactly what to
  rename, from whichever command they run first.

**Non-Goals:**

- No change to the commands, their options, or `step`'s `--for` values
  (D9). No special message for `review --for plan` or `--for code`:
  commander's message already lists the new choices.
- No reading of version 3 files and no automatic migration (D5).
- No effort setting (#88); the mapping shape only leaves room for it
  (D4).
- No change to what any skill does with the guidance, only which key it
  names.

## Test Seams

- **Primary test seam:** `lets` run as a program with a real lets
  config, through `tests/support/lets.ts` (`runLets`). It covers
  `review`'s new `--for` values, the guidance mapping, the old-key stop in `instructions`, the version 3
  message under `lets delegate` and `lets go questions`, and the help
  text.
- **Existing seams reused:** `tests/delegate/instructions.test.ts` for
  guidance and old keys, `tests/go/questions.test.ts` and
  `tests/backlog/provider.test.ts` for the version 3 message from the
  other command groups. The README check is a new contract test in
  `tests/contracts/`, built on `tests/contracts/texts.ts` like the other
  contract checks: a findings function that takes a root folder, run
  once against the repository and once against a small folder per
  failure case.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the lets config contract, so every user's
  `~/.config/lets/config.yaml` and every repository's `.lets/config.yaml`
  (version and guidance keys), and every caller of `lets delegate
  review` (its `--for` values). In code: `lets/src/delegate/config.ts`,
  `strategies.ts`, `instructions.ts` and `main.ts`. In docs and skills:
  the README, `docs/resolvers.md`, two ADRs plus a new one, and the
  `lets-go`, `lets-review-plan`, `lets-review-build` and `lets-review-pr`
  skills. No resolver, backlog backend or step behavior changes; the
  resolvers never read the intent.

## Decisions

### review takes review-plan and review-build

`STRATEGIES.review.intents` becomes `['review-plan', 'review-build']`,
and the `Intent` type drops `code`. `--for` takes its choices from
`STRATEGIES`, so `review --for plan` or `--for code` exits 2 with
commander's message, which names `--for` and the two new values. The
review record's `for` field is the value given, so it now reads
`review-plan` or `review-build`. `step` keeps its intents, so
`review-plan` and `review-build` are now intents of both strategies:
under `review` they start the read-only reviewer, and under `step` the
review step's own session.

Alternative: accept the old values as aliases for one release.
Rejected: D9 replaces the old values rather than adding to them, and
the only callers in lets-spec are the three review skills, which change
in the same release.

### One table maps strategy and intent to a guidance key

`strategies.ts` gains `GUIDANCE_KEYS`, typed so each strategy maps every
one of its intents:

| Strategy | Intent | Key |
|---|---|---|
| `review` | `review-plan` | `review-plan` |
| `review` | `review-build` | `review-build` |
| `step` | `shape` | `shape` |
| `step` | `plan`, `review-plan` | `plan` |
| `step` | `build`, `review-build` | `build` |
| `step` | `story` | `story` |

A helper `guidanceKey(strategy, intent)` reads it. The README test, the
help text and the rename list all iterate this table, so a new intent
cannot ship without a key, and a key cannot appear in the README
without being read.

The two `step` rows that map `review-plan` to `plan` and `review-build`
to `build` are temporary. Epic #352's stories #354 and #355 have
`lets-go` start each reviewer itself, so the review step's own session
goes away; each story deletes its row.

Alternative: the key is the intent, with no table. Rejected: under
`step`, `review-plan` and `review-build` read `plan` and `build` until
#354 and #355 ship, so a name rule needs exceptions that a table states
plainly. Once both have shipped, the table could give way to that rule.

### The old keys and their new names are derived, not listed

The old key for each pair is `delegate.<strategy>.<intent>`, and its
new key is `delegate.<guidanceKey(strategy, intent)>`. A function
`oldGuidanceKeys(delegate)` returns, for a `delegate` mapping, each
present, non-null old key with its new key, in `STRATEGIES` order. For
`step` with `review-plan` or `review-build`, it marks the new key as
shared with the plan step or the build step, so the message can say so.

Alternative: a hand-written rename table. Rejected: it would be a
second copy of the mapping that could drift.

### parseDocument writes the version 3 message

`CONFIG_VERSION` becomes 4. When a file's `version` is 3,
`parseDocument` throws one `UsageError` of this form:

```text
<path>: version must be 4, got 3. Rename delegate.review.plan to delegate.review-plan, and delegate.step.review-plan to delegate.plan, which the plan step shares. Then set version: 4. See "Set up delegation" in the lets-spec README.
```

With no old keys, the rename sentence is left out. Any other wrong
version keeps today's message with the new number. The check runs per
file, before the merge, so each file's message names only its own keys.
Because `parseDocument` already sits under every reader, every command
fails the same way, and `lets backlog` passes the message on inside
`unknown-backlog-provider` (D5).

### instructions rejects delegate.review and delegate.step in version 4

`checkConfig` keeps the six guidance keys and `review` and `step` as the
user wrote them, still unchecked, so `run` and `step run` never stop on
them. `instructions.ts` calls a new `checkNoOldGuidance(config, fileOf)`
before `guidanceFor`. When `delegate.review` or `delegate.step` is
present and not null, it throws one `UsageError` with one line per old
key, each `<file>: delegate.review.code is no longer read; rename it to
delegate.review-build.`, where `<file>` is `fileOf` for that key. An
entry with no old key under it, such as `delegate.step: 42`, gives one
line naming `delegate.step` and saying `lets` no longer reads it. The
check ignores `--for`: a user who left any old key behind hears about
it from the first `instructions` call, which `lets-go` makes before
every step.

Alternative: stop `run` too. Rejected by D5: `run` ignores guidance
today, and `lets-go` always runs `instructions` first.

### guidanceFor reads the new key

`guidanceFor` keeps its signature, reads `delegate[guidanceKey(strategy,
intent)]`, and names `delegate.<key>` or `delegate.<key>.guidance` in
its errors. The `Config` type's `delegate` holds `resolvers`, the six
guidance keys as `unknown`, and `review` and `step` as `unknown`.

### The help lines come from the table

`DELEGATE_HELP` shows a `version: 4` example with `review-build` and
`build` guidance, says in one sentence how `review-plan` and `plan`
(and `review-build` and `build`) differ, and points to the README's
*Set up delegation* section. `INSTRUCTIONS_HELP` becomes one text per
strategy, each listing `--for <intent>: delegate.<key>.guidance` from
`GUIDANCE_KEYS`.

### The README table and its test

The README's *Set up delegation* section gets one table, whose first
column is headed `Key` and holds each key as a code span, such as
`delegate.review-plan`. The other columns are the session it steers,
the command and `--for` value that read it, the skill that runs that
command, and a sensible value (D7). The table replaces the
`delegate.<strategy>.<intent>.guidance` paragraph. A sentence under the
table says that the review steps' own sessions take `delegate.plan` and
`delegate.build` only until `lets-go` starts each reviewer itself
(#354, #355). The example config
moves to `version: 4` and the new keys, as does the repository config
example.

The test, `tests/contracts/guidance-table.test.ts`, reads the README,
finds the *Set up delegation* section, takes the first table in it whose
header starts with `Key`, and collects the code span in each row's first
cell. It compares that set with `delegate.<key>` for every key in
`GUIDANCE_KEYS`, and reports each missing and each extra key by name. A
missing section or table is a finding too.

### A new decision record replaces ADR-011's key rule

ADR-031, *Each guidance key names the step it steers*, records that
guidance sits at `delegate.<step>.guidance` for the five steps and
`delegate.story`, with the reviewers at `delegate.review-plan` and
`delegate.review-build`, that `review`'s `--for` values name the same
steps, and that a review step's own session shares the plan or build
key until #354 and #355 remove that session. ADR-011's one-file layout and command-group
sections stand; its rule that each setting sits at the path of the
command that reads it is superseded for guidance. ADR-011 and ADR-007
each get a note pointing to ADR-031. The ADR step writes it.

### Fixtures move to version 4 in bulk

Every test fixture that writes `version: 3` as a valid config moves to
`version: 4`. Every test that runs `review` with `--for plan` or
`--for code` moves to `--for review-plan` or `--for review-build` in
the commit that changes the intents. Tests that check a wrong version keep `version: 2` and
expect `4` in the message, and new tests cover `version: 3`. This is a
mechanical commit of its own, so the behavior commits stay readable.

## Risks / Trade-offs

- [Every user's config breaks at the next release] → The message names
  each key to rename and the README section; the release notes say the
  same. `lets-go` reaches the message on its first `instructions` call.
- [A config shared between machines on two `lets` releases cannot be
  valid for both] → Accepted by D3. The repository's `.lets/config.yaml`
  and the pinned release move together; a user's own file moves when
  they upgrade.
- [A review step's own session can no longer be steered apart from plan
  or build] → Accepted by the user (D2). The README row for
  `delegate.plan` and `delegate.build` says both sessions use it, so the
  value can be chosen for both. It lasts only until #354 and #355
  remove that session.
- [A skill from an older release passes `review --for plan` or
  `--for code` to a newer `lets`] → The skills and `lets` ship in one
  release. A mismatch exits 2 with the new values named, so it fails
  loudly, not silently.
- [The README test reads Markdown by hand and could miss a reshaped
  table] → It fails when it finds no table, so a reshaped table is a
  failing check, not a silent pass.

## Migration & Rollback

- Users: set `version: 4`, then rename each guidance key as the message
  lists. A file with no guidance needs only the version change.
- This repository has no `.lets/config.yaml`, so nothing here migrates.
  The `.agents/skills/` copies keep naming the old keys until the next
  release, which ships the new skills and the new `lets` together.
- Rollback: revert the change's commits. Users who moved to version 4
  move back to version 3 and the old keys.
