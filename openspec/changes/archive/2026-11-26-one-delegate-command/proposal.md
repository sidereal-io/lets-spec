<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

`lets delegate` has two commands that start a session: `review` starts a
read-only reviewer, and `step` starts a session that may write. Since
#307 gave each step its own guidance key, the `--for` value already says
which kind of session to start. The second command only adds a second set
of `--for` values, options and exit codes for Mo to learn and for Andrew
to maintain. Epic #352's un-nesting stories, #354 and #355, are written
against one command, so this story comes first.

## What Changes

- `lets delegate step instructions`, `run`, `start` and `wait` take
  `--for review-plan` and `--for review-build`, which start a **reviewer**:
  a read-only session, checked afterwards for changes outside
  `.workspace/`. These two values always mean the reviewer, and read the
  `delegate.review-plan` and `delegate.review-build` guidance keys.
- The reviewer's final message comes back whole as the findings of a
  `done` report on stdout: one JSON line holding `outcome`, `findings` and
  `date` (D2). The reviewer writes no step-report block, and cannot report
  needs-input.
- A reviewer session that fails, gives an empty final message, or changes
  a file outside `.workspace/` exits 0 with a `failed` report whose
  reason says what happened. The session is kept for a person to read
  (D3).
- A reviewer has 30 minutes, or 45 at effort `high`, unless
  `--timeout-minutes` says otherwise. Every other step keeps 120 minutes,
  and a story keeps 600 (D4).
- `--source-family` is required for `--for review-plan` and
  `--for review-build`, and exits 2 with any other `--for` value. The
  reviewer's record line keeps `independent`, `checkout`, `commit` and
  `gitClean`. Other record lines stay as they are (D5).
- **BREAKING:** `lets delegate review instructions` and
  `lets delegate review run` are removed, with their `--for` values.
- **BREAKING:** exit codes 5 (the session failed) and 7 (the session
  changed files) are removed from `lets delegate`. Exits 3, 4 and 6 keep
  their meaning (D3).
- **BREAKING:** `lets delegate step instructions` no longer prints a
  `strategy`, because there is only one command.
- The temporary rule from #307 leaves the code: `--for review-plan` no
  longer reads `delegate.plan`, and `--for review-build` no longer reads
  `delegate.build`.
- `lets-go` starts a review step's own session with `--for plan` (review
  plan) or `--for build` (review build), and keeps the session names
  `<name>-review-plan` and `<name>-review-build`. Until #355, that
  session's record line says `for: plan` or `for: build` (D1).
- `lets-review-plan`, `lets-review-build` and `lets-review-pr` start their
  reviewer with `lets delegate step`, read the findings from the done
  report, and keep their finding formats. `lets-review-plan` and
  `lets-review-build` also keep the `Read: <checkout> <head>` line;
  `lets-review-pr`'s role prompts have none.
- The README, `docs/resolvers.md` and the command help describe the one
  command.

Out of scope, as the story says: who starts the reviewer in a `lets-go`
run, which stays the review step's own session until #354 and #355; and
a command of its own for a story run.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-step`: `step run` starts a reviewer for `--for review-plan`
  and `--for review-build`: its read-only session, tree check, done and
  failed reports, record line, `--source-family` and time limit. It gains
  the three command requirements of `delegate-review`, rewritten for
  `step run` (D6).
- `delegate-review`: loses its three command requirements. Its purpose
  becomes what the review skills do, and its skill requirements name
  `lets delegate step` in place of `lets delegate review` (D6).
- `delegate-instructions`: one `instructions` command, with no
  `strategy` in its output. The probe asks for a read-only session for
  the reviewer values, and each `--for` value reads its own guidance key.
- `delegate-config`: the commands are no longer grouped into two
  strategies; scenarios that use `lets delegate review` use
  `lets delegate step` with a reviewer value.
- `delegate-resolvers`: the `cli` and `t3` reviewer requirements name
  `lets delegate step run --for review-plan` or `--for review-build`; a
  session that fails, returns a plan, stops to ask or changes files gives
  a `failed` report in place of exit 5 or 7.
- `delegate-default`: the default's answer to a reviewer is reached
  through `lets delegate step`.
- `lets-go`: a review step's own session runs with `--for plan` or
  `--for build` (D1).

## Impact

- **Code:** `lets/src/delegate/` (`review.ts` folds into `step.ts`;
  `strategies.ts`, `instructions.ts`, `background.ts` and `lookup.ts`
  change), `lets/src/main.ts` (commands and help),
  `lets/src/resolvers/kit/errors.ts` (exit codes 5 and 7),
  `lets/src/resolvers/kit/adapter.ts` (the review time limit). The
  resolver adapters keep their `run` and `step` methods.
- **Skills:** `lets-review-plan`, `lets-review-build`, `lets-review-pr`
  and `lets-go`, with its references.
- **Documents:** `README.md`, `docs/resolvers.md`, and a decision record
  that supersedes ADR-007's two strategies.
- **Tests:** the tests under `tests/delegate/` and `tests/lets/delegate/`,
  the resolver tests that run reviews, `tests/contracts/commands.test.ts`,
  and the smoke checks in `flake.nix`.
- **Users:** a script or skill that calls `lets delegate review`, reads
  `strategy`, or acts on exit 5 or 7 breaks. The skills that ship with
  lets-spec move in this change.
