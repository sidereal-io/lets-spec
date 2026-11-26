## Context

- `tests/contracts/texts.ts` (from #311) reads every text an agent reads
  (D6) and splits each into prose, code spans, fenced code lines and
  headings. A code span is a `Piece`: its line and its text. It does not
  record the words after the span, so a check cannot yet tell whether
  the word field follows it.
- `lets backlog --help` prints one shape per result, such as
  `{ result: claimed, claim } | { result: taken, assignees }`. A value
  given to a field is written `field: value`, with alternatives joined
  by `|`, as in `write: assign|claim|delete-claim|unassign|status`. The
  error codes are not in a shape: they are a sentence, `where error is
  no-backlog, several-backlogs (with projects: [{ title, url }]),
  backend-failed, not-found or unknown-backlog-provider.`
- A probe of that help, with the rules below, finds 26 fields, `projects` among them. Five
  have values: `result`, `write`, `error`, and `key` and `label`, whose
  only value is `null` (from `key`'s `{ key: null, label: null }`).
- Today two texts follow the rule (D3): `lets-go` writes the `claim`
  field twice. About 120 code spans in the texts name a word the help
  prints, such as `taken`, `issues` or `blockedBy`. Most of them read
  `lets backlog` output. Others read a `gh`, OpenSpec or step-report
  field of the same name, such as `state` from `gh pr view` or `reason`
  from a step report.
- `tests/support/lets.ts` already has `runLets` and `repo`. `lets` runs
  only after `pnpm install`, as for every other Node test.
- This repository's `AGENTS.md` has its own sections, then the lets-spec
  block between `<!-- BEGIN lets-spec rules ... -->` and
  `<!-- END lets-spec rules -->`. `CLAUDE.md` is a symbolic link to it.

## Goals / Non-Goals

**Goals:**

- One Node test over every text, whose findings name the file and the
  field or value span that `lets backlog` does not print.
- Expected fields and values read from the help that `lets backlog
  --help` prints, at each run (D1).
- The check seen to fail, and seen to pass the spans it must leave
  alone, on small texts written for the test (D9).
- Every text that reads `lets backlog` output written by the rule, so
  the check covers it.

**Non-Goals:**

- Telling which command a text reads: a name passes when any `lets
  backlog` command prints it (D4).
- Finding a field written without the rule. The rule is what makes a
  read visible to the check; review catches a read written another way.
- Checking a field or value of `gh`, OpenSpec, `lets delegate`,
  `lets go questions` or a step report (D2). These stay in plain code
  font, so the check never reads them.

## Test Seams

- **Primary test seam:** the texts as files on disk, read by a check
  function in `tests/contracts/fields.test.ts` that takes a root folder,
  as #311's checks do. The real texts are checked in the source tree.
  The same function runs on a small folder of texts in `tempDir` to
  show the check fails and passes.
- **Existing seams reused:** `readTexts`, `tempDir`, `runLets` and
  `repo`. The help comes from the real `lets backlog --help`, run once
  per test file.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. No product code changes, but the rewrite touches
  the instructions `lets-go` follows at every claim, and a wrong rewrite
  sends an agent the wrong way.
- **Blast radius:** `tests/contracts/texts.ts` and a new test file; the
  skills, references and documents that read `lets backlog` output;
  `AGENTS.md` and the README's *Layout* table.

## Decisions

### Reading the help

The check runs `lets backlog --help` once, from `repo`, and reads two
things from what it prints:

- **Fields.** Every name inside a `{ … }` shape, across lines, and every
  name followed by `: [` or `: {`, such as `projects` in the error
  sentence. A trailing `?`, as in `claim?`, is not part of the name.
- **Values.** In a shape, `name: v1|v2|…` gives the field `name` each
  value. A sentence `where <name> is v1, v2 … or vn.` gives `<name>`
  each value, after dropping each `( … )` aside.

The parse is a pure function, `backlogFields(help)`, in the test file.
It returns a map from each field to the set of its values.

Alternative: read the shapes from `HELP_BODY` in
`lets/src/backlog/commands.ts`. Rejected: it ties the test to how `lets`
is built inside, which D1 rules out. The help is what a caller sees.

### Which spans the check reads

- **A field span** is a code span outside fenced code that holds only a
  name, letters, digits and `_`, and is followed in the same paragraph
  by the word `field` or `fields`, even across a line break. It is a
  finding when the name is not one of the help's fields (D3, D4).
- **A value span** is a code span holding `<name>: <value>`, with one
  space after the colon. It is read only when `<name>` is one of the
  help's fields (D12). It is then a finding when `<value>` is not one of
  that field's values. A field that the help gives no values, such as
  `kind`, has none, so `kind: Epic` is a finding: a backend value is
  written in plain code font (D5). A value that holds a placeholder,
  such as `result: <result>`, passes: it names no value.
- A finding is `{ file, name }`, as in #311's checks. `name` is the
  span's text, so a field finding reads `nonsense` and a value finding
  reads `result: bogus`.

Accepting `fields` lets a text write "the `write` and `message`
fields". Only the span right before the word is read, so the
`AGENTS.md` rule tells writers to give each field its own word, as in
"the `write` field and the `message` field", when they want both
checked.

### The word after a span

`texts.ts` gains one property on each code span: `next`, the first
word of prose after its closing backticks in the same paragraph. When
the span ends a line, `next` is the first word of the next line, unless
that line is blank or opens a fence. Punctuation right after the span,
such as `,` or `)`, gives an empty `next`, so "`claim`, field" is not a
field span. The type of `Text.spans` becomes a `Span`, a `Piece` with
`next`. #311's checks read only `line` and `text`, so they do not
change.

Alternative: search each raw line with a regular expression for
`` `name` field ``. Rejected: it misses a span and its word on two
lines, and the fenced-code rules already live in `texts.ts`.

### Rewriting the texts

The implementer finds the reads with a probe: list every code span in
the texts whose text is one of the help's fields or values, or a
`field: value` pair, with its file and line. For each, decide from the
paragraph which program printed it:

- A read of `lets backlog` output is rewritten by the rule: "its
  `issues`" becomes "its `issues` field"; "On `taken`" becomes "On
  `result: taken`"; `"result": "failed"` becomes `result: failed`; an
  error code becomes `error: no-backlog`.
- A read of anything else, such as `state` from `gh pr view` or `reason`
  from a step report, stays as it is.
- A read of a field or value that `lets backlog` does not print is
  fixed to the name the help gives (D8), or the text is changed so it
  no longer reads it.

The probe is a scratch script in `.workspace/`, not a test. Its list
goes in the pull request, so review can see which spans changed and
which were left alone.

### Where the rule is written

`AGENTS.md` gains a section before the lets-spec block, *Fields a text
reads*, with the rule (D3), the spans the check reads (D12), the cases
left in plain code font (D2, D5) and the test file that checks it
(D11). The README's *Layout* table adds fields and values to its
`contracts/` row.

## Risks / Trade-offs

- [A change to the help's wording, such as rewriting the error
  sentence, makes the parse find fewer values] → The real-text test then
  reports each value span that reads one of them, so the break is loud.
  A test of `backlogFields` on a small help text, written for the test,
  shows each form it reads: a shape across lines, `a|b` values, `: [`,
  and the `where … is` sentence.
- [If `lets` renamed a field such as `result`, value spans on it would
  stop being read, and pass] → Accepted in D12. Each field span on the
  old name still fails, and review reads the rest.
- [A rewrite changes what a skill tells the agent to do] → Each rewrite
  only adds the word field or the field's name; the pull request lists
  every span changed, and the plan review and build review read them.
- [A text reading a `gh` or step-report field writes it by the rule by
  mistake, and passes because `lets backlog` prints a field of the same
  name, such as `state` or `reason`] → Accepted in D4. The `AGENTS.md`
  rule says to use the form for `lets backlog` output only.

## Migration & Rollback

N/A. Nothing changes shape. Reverting the commits removes the check and
restores the old wording.
