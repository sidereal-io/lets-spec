<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `lets go` has one subcommand today, `lets go questions`, in
  `lets/src/go/questions.ts`. It is registered in `lets/src/main.ts`
  under a `go` command whose summary is "settings for the lets-go
  skill". It prints one JSON line and uses the exit codes in
  `lets/src/resolvers/kit/errors.ts`.
- `lets/src/main.ts` parses with Commander and calls `exitOverride()`,
  so a Commander usage error exits 2 with Commander's own `error: ...`
  line on stderr.
- `lets-go` names the shape step in prose: *The shape step's name* in
  `skills/lets-go/references/shape.md`. Four places then check that the
  prompt file holds this idea: states 2 and 3 of *Find the input's
  discovery*, step 3 of *Run the shape step*, and the second removal
  paragraph of *Read the report* in `SKILL.md`. *Read the request* in
  `SKILL.md` checks for a letter or digit itself.
- `<shape-name>` and `<slug>` are rows in the `## Placeholders` table of
  `SKILL.md`. The contract test `tests/contracts/commands.test.ts`
  checks every `lets` command a skill names against `lets --help`, so
  the new command must be registered before the skill names it.
- `skills/` is the source. `.agents/skills/` gets the change at the next
  release, so this repository's own `lets-go` keeps the old rule until
  then.

## Goals / Non-Goals

**Goals:**

- One function in the `lets` CLI owns the shape step's name and its
  answers path. The skill reads the command's JSON and builds no name.
- Every file named after an idea's shape step is unique to that idea,
  so no check has to read a prompt file.

**Non-Goals:**

- Moving the rest of `references/shape.md` into `SKILL.md`. Another
  story of epic #263 does that.
- Migrating old answers files to the new names.
- Changing the `.workspace/lets-go/<session>-...` layout, or the names
  of steps other than shape.

## Test Seams

- **Primary test seam:** `lets go shape-name` run as a program, through
  `runLets` in `tests/support/lets.ts`, in a new
  `tests/go/shape-name.test.ts`. Each scenario of the `go-shape-name`
  spec becomes one test that asserts the exit code, stdout and stderr.
- **Existing seams reused:** the contract tests in `tests/contracts/`,
  unchanged. `commands.test.ts` proves the skill names a real command
  and flags, `links.test.ts` that no link points at the removed heading,
  and `fields.test.ts` that the skill names no `lets backlog` field
  that does not exist.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** one new, read-only `lets` subcommand; the shape
  parts of the `lets-go` skill text; the `lets-go` spec. No other
  command, schema or skill changes. The only data effect is that a
  stopped idea run's local answers file is not found after upgrade.

## Decisions

### The hash input and length

`<hash>` is the first 8 lower-case hexadecimal digits of the SHA-256 of
the cleaned words joined with single spaces, encoded as UTF-8. Node's
`node:crypto` provides SHA-256, so there is no new dependency.

- **Why join with spaces:** the words hold only letters and digits, so a
  space can never be part of a word, and two different word lists can
  never join to the same text.
- **Why 8 digits:** 32 bits makes a clash between two ideas on one
  machine with the same first five words extremely unlikely, and keeps
  the file names short. A longer hash buys nothing a person can notice.
- **Alternatives:** a hash of the raw text (rejected in D2: retyping in
  another case would lose the answers); a counter or registry file
  (rejected: it needs state, and the same idea must always get the same
  name without reading anything).

### One clean-up function for slug and hash

One function turns the idea into words. Both the slug (the first five
words) and the hash (all the words) come from its result, so they can
never disagree on what counts as a word.

- Split on `/\s+/u`, lower-case with `String.prototype.toLowerCase()`,
  which ignores the locale, and keep the characters that match
  `/[\p{L}\p{N}]/u`. This is today's rule: letters and digits in any
  script.
- An idea with no words is rejected with
  `lets go: an idea needs at least one letter or digit`, through the
  same `lets go: ` prefix that `lets go questions` uses.

### Option parsing

- `--issue <i>` and `--idea <text>` are ordinary Commander options.
  Each has an argument parser that rejects a second use, and
  `--issue`'s parser rejects a key that is empty or holds anything but
  letters, digits and hyphens. A rejected value exits 2 with Commander's
  message, as other `lets` options do.
- The action checks that exactly one option was given. If not, it
  prints `lets go: give exactly one of --issue and --idea` and exits 2.
- The command reads no file and does not look for the repository, so it
  works the same in any folder. The answers path is always relative to
  the repository root, because `lets-go` runs every command from there.

### The skill runs the command once per input

`lets-go` runs `lets go shape-name` where it needs a name, and keeps the
`name` and `answers` it prints:

- *Read the request*, for an idea: `--idea` with the idea, quoted the
  way `lets backlog key` is quoted. A non-zero exit stops the run with
  the command's stderr. This replaces the letter-or-digit check.
- *Check the issue*, before a shape step for an issue: `--issue <i>`.
- *Find the input's discovery*, state 3, and *Read the report*, for an
  epic's `Input:` line that names another input: the command for that
  input.
- *Read the report*, after an `epic #<parent>` line: `--issue <parent>`.

The four prompt-file checks go, and so do the section *The shape step's
name* and the `<slug>` placeholder. The `<shape-name>` row says the
command sets it.

### The go command's summary

The `go` command's summary becomes "helpers for the lets-go skill", and
its description says it reads settings and names steps. "Settings" no
longer covers both subcommands.

## Risks / Trade-offs

- [A run that stopped on an idea before the upgrade loses its answers
  file] → The next shape round starts with no answers and asks its
  questions again. The old file stays in `.workspace/`, which git
  ignores. The pull request description says so.
- [Two different ideas with the same first five words get the same
  hash] → The chance is about one in four billion per pair. The result
  would be today's behaviour without the prompt-file check: the second
  idea's round starts with the first idea's answers.
- [This repository's own `lets-go` keeps the old rule until the next
  release] → Expected for every skill change here. Nothing in the old
  rule depends on the new command.
- [The new name makes file names longer] → 9 characters more. The names
  stay well under file-system limits, because the slug is capped at five
  words.

## Migration & Rollback

- **Migration:** none. Old answers files are left in place and ignored.
- **Rollback:** revert the pull request. Answers files written under the
  new names are then ignored in the same way.
