<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

`lets delegate` today has two command groups, built from one table in
`lets/src/delegate/strategies.ts`:

- `review` (`instructions`, `run`) in `review.ts`. It asks the resolver
  for a read-only session through the adapter's `run` method. It notes
  `git status` before the session and compares it afterwards, prints the
  final message as is, and exits 5 for a failed session or an empty
  message, and 7 for a changed tree. Its record line holds `independent`,
  `checkout`, `commit` and `gitClean`. Its time limit is
  `DEFAULT_TIMEOUT_MINUTES` in `resolvers/kit/adapter.ts`: 30 minutes, or
  45 at `high`.
- `step` (`instructions`, `run`, `start`, `wait`) in `step.ts` and
  `background.ts`. It asks for a session that may write, through the
  adapter's optional `step` method. It reads the last step-report block,
  turns a failed session into a `failed` report at exit 0, and gives 120
  minutes, or 600 for a story.

`STRATEGIES` maps each strategy to its intents and to the kind of session
it asks for (`run` or `step`). `GUIDANCE_KEYS` maps each strategy and
intent to a guidance key. Under `step`, `review-plan` and `review-build`
map to `plan` and `build`: the temporary rule from #307.
`config.ts` builds the version 3 migration message from `GUIDANCE_KEYS`,
and `tests/contracts/guidance-table.test.ts` reads `GUIDANCE_KEY_NAMES`.

The three adapters keep both methods: `t3` and `cli` run either kind of
session; `subagent` refuses both, and saves the prompt only for `step`.

Constraints:

- `pick(kind)` skips an adapter without `step` only when asked for a
  `step` session, so a reviewer must keep asking for `run`.
- `tests/contracts/commands.test.ts` fails on any text that names a
  `lets` command that `lets --help` does not list. Removing `review`
  therefore fails every skill and document that still names it, which is
  the check this change relies on.
- An ADR-031 plan review found that deriving old guidance keys from the
  live table goes wrong once the table changes. The same trap applies
  here.

## Goals / Non-Goals

**Goals:**

- One command group, `lets delegate step`, whose `--for` value alone
  decides the kind of session, the report, the record line, the options
  it accepts and the time limit.
- One set of exit codes: 0, 2, 3, 4 and 6.
- Each `--for` value reads the guidance key of the same name.
- No change to the adapter contract: `run` and `step` stay as they are.

**Non-Goals:**

- Making `lets-go` start the reviewer itself. That is #354 and #355.
- A separate command for a story run.
- Structured findings in the reviewer's report. D2 returns the final
  message whole; #354 can add structure later.
- Changing what the review skills ask their reviewer, beyond reading the
  report instead of the raw message.

## Test Seams

- **Primary test seam:** `tests/delegate/`, which runs the built `lets`
  as a program in a real Git repository, with stand-in `codex`, `claude`
  and `agy` on `PATH` (`run.test.ts`, `step.test.ts`,
  `review-timeout.test.ts`, `step-timeout.test.ts`, `background.test.ts`,
  `instructions.test.ts`). The reviewer cases in `run.test.ts` move to
  `lets delegate step run --for review-plan` or `--for review-build`.
- **Existing seams reused:**
  - `tests/lets/delegate/` with `fixtures/command-deps.ts`, a fake
    resolver, for the cases `cli` and `subagent` cannot reach: another
    checkout, a `null` checkout, a failing finish, a session that fails
    without a handle. `review.test.ts` folds into `step.test.ts`.
  - `tests/lets/resolvers/t3/delegate.test.ts` for the `t3` cases that
    exit 5 today: a returned plan and a pending request.
  - `tests/contracts/`: `commands.test.ts` catches every text that still
    names `lets delegate review`; `guidance-table.test.ts` keeps the
    README table in step with the keys; a new check in `skills.test.ts`
    covers *The review skills start their reviewer with lets delegate
    step*.
  - The smoke checks in `flake.nix`, which call
    `lets delegate review instructions` today.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** the `lets delegate` command line, its stdout report
  and its exit codes, which every skill that delegates reads; the code
  in `lets/src/delegate/`, `lets/src/main.ts` and
  `lets/src/resolvers/kit/`; four skills (`lets-review-plan`,
  `lets-review-build`, `lets-review-pr`, `lets-go`); the README,
  `docs/resolvers.md` and the flake's smoke checks. No data, no
  authorization, no adapter contract.

## Decisions

### The `--for` value is the only switch

Replace `STRATEGIES` with one list of intents and one function that says
what each needs:

```ts
export const INTENTS = ['shape', 'plan', 'review-plan', 'build', 'review-build', 'story'] as const;
export const REVIEWER_INTENTS = ['review-plan', 'review-build'] as const;
export const isReviewer = (intent: Intent) => (REVIEWER_INTENTS as readonly string[]).includes(intent);
export const kindFor = (intent: Intent): Kind => (isReviewer(intent) ? 'run' : 'step');
```

`instructions` and `run` call `pick(kindFor(intent))`, so a resolver
without `step` still answers a reviewer. `GUIDANCE_KEYS` becomes one
`Record<Intent, string>` in which each intent maps to its own name. It
stays a table, not an identity function, so the help text and the
README contract test keep one place to read.

Alternative: keep `Strategy` as an internal type with one member. It
keeps a word the glossary dropped and buys nothing.

### `review.ts` folds into `step.ts`

`step()` reads the config, the prompt and the repo root as today, then
branches once:

- **Reviewer** (`isReviewer(intent)`): note `treeStatus` before; call
  `adapter.run`; on a `SessionFailed` in the call, a `failed` report
  with a `null` handle, as a step does; otherwise read `headCommit` of
  the reported checkout, then `isTreeClean`. The report is `failed`
  when the message is blank (reason names the handle) or the tree
  changed (reason names the handle); otherwise
  `{ outcome: 'done', findings: text, date }`. Finish with ok only for
  `done`. Print the record line with `independent`, `checkout`,
  `commit` and `gitClean` on every exit 0. When `git status` itself
  fails afterwards, finish without ok and exit 4, as `review run` does
  today.
- **Step**: unchanged.

The tree check still runs after a failed session, so `gitClean` is true
or false on every reviewer record. Its result only changes the reason
when the session gave a message.

`Report` gains a fourth member, `{ outcome: 'done'; findings: string }`,
so one printer writes both done shapes and adds `date`.

Alternative: a second module for the reviewer called from `step.ts`.
The two paths share the config, prompt, model loop, finish and printing,
so one function with one branch is shorter and easier to test.

### Exits 5 and 7 leave the code

`EXIT.session` and `EXIT.dirty` are removed from
`resolvers/kit/errors.ts`, and `exitCodeOf` no longer maps
`SessionFailed`. Every `run` call that can throw it sits inside the
model loop, which turns it into a `failed` report. Anything else that
throws `SessionFailed`, such as `options()`, is turned into a
`SpawnError` by `inAdapter`, so it exits 4: the outcome is unknown. The
`SessionFailed` class stays, because the adapters use it to say a
session failed.

### Options that only a reviewer takes

`--source-family` becomes an optional commander option with the three
families as choices. A shared check, `checkIntentOptions`, runs in
`step run` and in `step start` before anything is asked or spawned:

- a reviewer with no `--source-family`: `UsageError` naming it;
- another intent with `--source-family`: `UsageError` naming it;
- a reviewer with `--answers-file`: `UsageError` naming it.

`step start` passes `--source-family` through to the background
`step run`. The last rule is not in the brainstorm. It follows from D2:
a reviewer cannot report needs-input, so answers have nothing to resume,
and silently appending them to a review prompt would hide a caller's
mistake.

### Time limits by intent

`timeoutFor(intent, effort, timeoutMinutes)` returns the override, else
the review limit for a reviewer (moved from `adapter.ts` into `step.ts`
as `REVIEW_TIMEOUT_MINUTES`), else 600 for `story`, else 120. The
adapters never read the constant, so moving it changes no resolver.

### `instructions` prints no `strategy`

The line becomes `{ for, resolver, options, guidance }`. No skill reads
`strategy`. Keeping it as a constant `"step"` would mislead a reader
into thinking another value exists.

### The version 3 migration lists its keys

`config.ts` builds the "old key → new key" message from
`GUIDANCE_KEYS.step`. Once each intent maps to itself, that derivation
would say `delegate.step.review-plan` → `delegate.review-plan`, against
*A version 3 file names each guidance key's new name*. The migration gets
its own literal table of the eight old keys and their new names, and
reads nothing from `GUIDANCE_KEYS`.

### `lets-go` maps a step to its `--for` value

*The change's name* and *Run a step* in `skills/lets-go/SKILL.md` gain
`<for>`: `<step>` for shape, plan and build, `plan` for review plan,
`build` for review build. `step instructions` and `step run` take
`--for <for>`; `--name`, the prompt, report and meta files keep
`<session>`, so `<name>-review-plan` still names everything a review
step leaves behind. The text says why: `--for review-plan` and
`--for review-build` start a read-only reviewer, which the review step's
own skill starts. That sentence keeps `--for review-plan` in the prose,
which *The prose holds the fixed lines the tests check* lists.

### The review skills read the report

`lets-review-plan`, `lets-review-build` and `lets-review-pr` change only
where they call the command and read its output:

- `lets delegate step instructions --for review-plan` or
  `--for review-build`;
- `lets delegate step run` with the same options, stdout to
  `.workspace/<…>-review-report.json` in place of the raw file;
- after exit 0, read `outcome`. For `done`, the findings and the
  `Read:` line come from `findings`. For `failed`, record no review,
  show the `reason` and the meta file, and stop;
- the exit list loses 5 and 7.

Their prompts, finding formats and subagent paths do not change.

## Risks / Trade-offs

- [A caller outside this repository still runs `lets delegate review`,
  reads `strategy`, or acts on exit 5 or 7] → The breaking changes are
  marked in the proposal and the decision record. `lets delegate review`
  fails at once with `unknown command 'review'`, exit 2, so nothing runs
  half-way. The skills that ship with lets-spec move in the same change.
- [A reviewer's findings are now inside JSON, so a skill that `cat`s the
  file sees escaped text] → The skills read `findings` from the JSON
  line; the scenario in *A reviewer's final message is its findings*
  pins that the text comes back unchanged.
- [Until #355, a review step's record line says `for: plan` or
  `for: build`, so a person reading the meta file cannot tell a review
  step from a plan step by `for`] → The session name still says
  `<name>-review-plan`. Accepted in D1.
- [Folding two code paths into one function makes `step()` longer] →
  One branch at the call to the adapter; the tree check, the done report
  and the record line live in small helpers beside it.
- [Removing `SessionFailed` from `exitCodeOf` turns a stray throw into
  exit 4 instead of 5] → Exit 4 means "outcome unknown", which is true
  for a failure lets did not expect there.

## Migration & Rollback

- **Users:** replace `lets delegate review instructions` with
  `lets delegate step instructions`, and `lets delegate review run` with
  `lets delegate step run`, keeping `--for review-plan` or
  `--for review-build` and `--source-family`. Read the JSON report on
  stdout: `findings` holds what the old command printed. Treat a
  `failed` report as the old exits 5 and 7.
- **Config:** none. The guidance keys and `version: 4` do not change.
- **Rollback:** revert the change's commits. Nothing persists outside
  `.workspace/`.
