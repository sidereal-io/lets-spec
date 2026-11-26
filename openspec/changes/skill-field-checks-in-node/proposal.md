## Why

Agents act on the fields and result values the skills tell them to read
from `lets backlog`. If `lets` renames `taken`, a skill that still reads
`result: taken` sends an agent the wrong way, and no reviewer reliably
sees it. #311 added Node checks for commands, flags, links, skills and
`gh` commands, but none for fields and values: no rule could find them in
a text without many false hits. The brainstorm agreed one way to write
them (D3), so a test can now check them.

## What Changes

- **A writing rule** for a field or value a text reads from `lets
  backlog`: a field is a code span followed by the word field, as in the
  `claim` field; a value is one code span holding `field: value`, as in
  `result: taken` (D3). It is written in this repository's `AGENTS.md`,
  outside the lets-spec markers, and says which value spans the check
  reads (D11, D12).
- **A new Node contract check** in `tests/contracts/`, over the same
  texts as #311's checks (D6):
  - each field written by the rule is one that `lets backlog --help`
    prints, in any of its commands' shapes (D1, D4);
  - each value span whose field `lets backlog` prints holds a value the
    help gives that field. Every other value span passes, such as
    `ask: true` or `skip_specs: true` (D12).
  The expected names come from the help, never from a typed list (D1).
- **The check is seen to fail.** A test runs it on a small text written
  for the test, with one field and one value that `lets backlog` does not
  print, and expects a finding for each (D9).
- **Texts are rewritten** to follow the rule wherever they read `lets
  backlog` output, chiefly `lets-go` and its references, `lets-plan` and
  `lets-shape`. A text that reads a field or value `lets backlog` does
  not print is fixed (D8).
- **The README's *Layout* table** names the new check in its
  `contracts/` row (D11).

Out of scope: the fields of `lets delegate`, `lets go questions` and the
step report (D2); nested fields and backend values the help does not
list, such as the entries of `blockedBy`, `OPEN` and `Epic` (D5); any
test that looks for a fixed sentence (D10); and the checks #311 already
covers.

`lets` does not change (D7), and no spec requirement changes. The change
sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change adds a test of the texts lets-spec ships and a writing
rule for its contributors. It adds no behavior.

### Modified Capabilities

None. A rewritten text reads the same field or value as before; only the
way it is written changes (D8).

## Impact

- **Tests:** a new `*.test.ts` file in `tests/contracts/`, and a small
  change to `tests/contracts/texts.ts` if the check needs to know which
  word follows a code span. `pnpm test` already runs every
  `tests/**/*.test.ts` file.
- **Texts:** the skills, references and documents that read `lets
  backlog` output.
- **Documents:** `AGENTS.md` (outside the lets-spec markers) and the
  README's *Layout* table.
- **Unchanged:** `lets` and its help text, `flows.json`, the bats tests,
  and `openspec/glossary.md`.
