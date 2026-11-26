## Why

`lets-go` makes the shape step's name by hand: an agent follows a slug
rule written in prose, and four separate checks guard against two ideas
that share their first five words, and so share an answers file. This is
the last hand-run rule in the shape path now that #264 has landed. Epic
#263 moves such fixed rules into the `lets` CLI, so each is written once
and run the same way every time.

## What Changes

- **New command `lets go shape-name`.** It takes `--issue <i>` or
  `--idea <text>`, exactly one, and prints one JSON line with the shape
  step's `name` and its `answers` path, relative to the repository root
  (D3). It exits 2 with a message on neither option, both, or an idea
  with no letter or digit (D3, D4).
- **BREAKING (local files only): idea names gain a hash.** An idea's name
  becomes `idea-<slug>-<hash>`, where the hash covers all of the idea's
  words after the slug's clean-up, so every file named after the shape
  step is unique to its idea (D1, D2). Issue names stay `issue-<i>`. A
  run that stopped before this change, on the same machine, no longer
  finds its idea's answers file, and its next shape round starts with no
  answers.
- **`lets-go` uses the command.** Each place that makes a
  `<shape-name>` runs `lets go shape-name` and reads its JSON instead.
- **`lets-go` drops its slug rules.** *The shape step's name*, the
  `<slug>` placeholder and the slug rule in the `lets-go` spec go.
- **`lets-go` drops its four "the prompt file holds this idea" checks**:
  in *Find the input's discovery* (twice), step 3 of *Run the shape
  step*, and the answers-file removal in *Read the report* (D1).
- ***Read the request* stops on the command's error** for an idea with
  no letter or digit, with the same message as today. The rule is then
  written only in the `lets` CLI (D4).
- **No printed line changes.** The shape name appears only in file
  paths and in the `--name` given to `lets delegate step run` (D5).

## Capabilities

### New Capabilities

- `go-shape-name`: `lets go shape-name` prints the shape step's name
  and answers-file path for an issue or an idea, and rejects bad input.

### Modified Capabilities

- `lets-go`: the shape step's name comes from `lets go shape-name`; the
  slug rule and the checks that a prompt file holds the idea go; *Read
  the request* takes the letter-or-digit stop from the command; the
  scenarios that name idea files use the new name form.

## Impact

- **Code:** a new `lets/src/go/shape-name.ts`, registered beside
  `lets go questions` in `lets/src/main.ts`, with its help text.
- **Skill:** `skills/lets-go/SKILL.md` and
  `skills/lets-go/references/shape.md`. The change reaches this
  repository's own copy in `.agents/skills/` at the next release.
- **Specs:** a new `openspec/specs/go-shape-name/spec.md`, and changes
  to `openspec/specs/lets-go/spec.md`.
- **Tests:** a new Node test, `tests/go/shape-name.test.ts`. The
  contract tests in `tests/contracts/` check the new command name in
  the skill text (D6).
- **Users:** none visible. A stopped idea run's answers file is lost
  once, on upgrade.
- **Size:** the pull request records `wc -l` for `SKILL.md` and for the
  whole skill, as epic #263 asks.
