<!-- design.md's Decisions say how the help is read, which spans the check
     reads and how each text is rewritten. The new test file is
     tests/contracts/fields.test.ts. Run `pnpm install` once before the
     first test: the tests run lets. -->

## 1. Shared contracts

- [x] 1.1 [medium] In `tests/contracts/texts.ts`, each code span outside fenced code carries `next`: the first word of prose after its closing backticks in the same paragraph, read from the next line when the span ends a line, with punctuation after the word left off, and empty when punctuation follows the span or the next line is blank or opens a fence, as design.md's *The word after a span* says. `Text.spans` becomes a `Span` type with a doc comment; #311's checks still pass unchanged (verify: `node --test "tests/contracts/*.test.ts"`) (✓ `node --test "tests/contracts/*.test.ts"` passed, 48 tests)
- [x] 1.2 [medium] `backlogFields(help)` in `tests/contracts/fields.test.ts` returns each field and its values from a help text, by design.md's *Reading the help*. A small help text written for the test shows each form it reads: a shape across two lines, `name: a|b` values, a trailing `?`, values after a `:` that are not fields, a name before `: [`, and a `where <name> is a, b (aside) or c.` sentence. A second test shows that the real `lets backlog --help` gives at least one field and one value (verify: `node --test tests/contracts/fields.test.ts`) (✓ `node --test tests/contracts/fields.test.ts` passed, 7 tests; the real help gives 26 fields)

## 2. The check [depends-on: 1]

- [x] 2.1 [medium] A field span whose name `lets backlog --help` does not print is a finding `{ file, name }`, by design.md's *Which spans the check reads*. Small texts show one finding each for `` `nonsense` field `` and `` `sub-issues` field ``, and none for `` `claim` field ``, `` `claim` field. ``, `` `message` fields ``, a span and its word on two lines that name a printed field, `` `nonsense`, field `` or a span with no word field after it (verify: `node --test tests/contracts/fields.test.ts`) (✓ `node --test tests/contracts/fields.test.ts` passed, 11 tests)
- [x] 2.2 [medium] A value span whose field `lets backlog --help` prints, and whose value the help does not give that field, is a finding. Small texts show one finding each for `result: bogus` and `kind: Epic`, and none for `result: taken`, `error: no-backlog`, `key: null`, `result: <result>`, `ask: true` or `skip_specs: true` (D9, D12) (verify: `node --test tests/contracts/fields.test.ts`) (✓ `node --test tests/contracts/fields.test.ts` passed, 15 tests)
- [ ] 2.3 [easy] One test runs both checks over every text `readTexts(repo)` gives and expects no finding (D6) (verify: `node --test tests/contracts/fields.test.ts`)

## 3. Rewrite the texts [depends-on: 2]

Before 3.1, write a probe in `.workspace/` that lists every code span in the texts whose text is a field or value the help prints, or a `field: value` pair, with its file and line, as design.md's *Rewriting the texts* says. Each task below rewrites the reads of `lets backlog` output in its files by the rule, leaves reads of `gh`, OpenSpec and step reports as they are, and keeps each instruction's meaning.

- [ ] 3.1 [parallel] [complex] `skills/lets-go/SKILL.md` reads every `lets backlog` field and value by the rule: the placeholder table, the error codes, `key`, the issue and item reads, the claim and release results and their `write` values, and the ready-issue search (D8) (verify: `node --test tests/contracts/fields.test.ts`)
- [ ] 3.2 [parallel] [medium] `skills/lets-go/references/epic-run.md` and `skills/lets-go/references/glossary-handoff.md` read every `lets backlog` field and value by the rule, including the waves file's fields and the release results, such as `result: failed` in place of `"result": "failed"` (D8) (verify: `node --test tests/contracts/fields.test.ts`)
- [ ] 3.3 [parallel] [medium] The other texts the probe lists, such as `skills/lets-plan/SKILL.md`, `skills/lets-shape/SKILL.md` and `README.md`, read every `lets backlog` field and value by the rule (D8) (verify: `node --test tests/contracts/fields.test.ts`)

## 4. Rule and integration [depends-on: 3]

- [ ] 4.1 [easy] `AGENTS.md` has a *Fields a text reads* section before the lets-spec block, with the rule (D3), the value spans the check reads (D12), the fields and values left in plain code font (D2, D5), the advice to give each field its own word field, and a link to `tests/contracts/fields.test.ts` (D11). The `contracts/` row of the README's *Layout* table names fields and values among what the checks cover (verify: `grep -n 'Fields a text reads' AGENTS.md && node --test tests/contracts/links.test.ts`)
- [ ] 4.2 [medium] Every check passes: `pnpm test`, `mise run check` and `nix flake check`. The pull request lists the probe's spans, each marked rewritten or left alone with the program that prints it, and says this story kept no unit test and deleted no test (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->

- 2026-11-25, task 1.1: added `tests/contracts/texts.test.ts`, eight
  small tests of the `next` word, one for each way a paragraph can go on
  after a span. The field check's tests in 2.1 do not reach a blank next
  line, a fence, the end of the file or a span across a line break, and
  test-first needs each behavior seen failing. The pull request lists it
  as a kept test of a pure split, with no fake.
