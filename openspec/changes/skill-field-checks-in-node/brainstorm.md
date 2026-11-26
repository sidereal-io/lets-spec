## Story

#328 skill-field-checks-in-node — a text that reads a JSON field or result
value a lets command does not print fails a Node test.
https://github.com/sidereal-io/lets-spec/issues/328

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Split from
#311, whose contract-check module in `tests/contracts/` this story
extends.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where do the expected fields and values come from? | From each command's `--help`, read from the `{ field, field: value }` shapes it prints. Never from a typed list. | User |
| D2 | Which commands does the check cover? | `lets backlog` only. The fields of `lets delegate`, `lets go questions` and the step report are left to review. | User |
| D3 | How does a text name a field or value it reads from a `lets` command? | A field: a code span holding the name, then the word field, as in the `claim` field. A value: one code span holding `field: value`, as in `result: taken` or `error: no-backlog`. | User |
| D4 | Does a field or value pass when any covered command prints it, or only the command the text is reading? | Any covered command. | Assumption |
| D5 | What about fields and values the `lets backlog` help does not list, such as the entries of `blockedBy` and `parent`, or `OPEN` and `Epic`? | Outside the rule: a text writes them in plain code font without the word field, and review checks them. | Assumption |
| D6 | Which texts does the check read? | The texts #311's checks read: each skill's files, each schema's `schema.yaml` and templates, `overlays/AGENTS.md`, `README.md` and `docs/*.md`. | Evidence: #328 packet, *Scope*; `tests/contracts/texts.ts` `textPaths` |
| D7 | Does `lets` change? | No. | Evidence: #308 *Shared decisions*; D1, D2, D5 |
| D8 | Is rewriting the texts that read `lets backlog` output to follow D3 in scope, and fixing any that reads a field or value `lets backlog` does not print? | Yes. | Evidence: #328 packet, *Scope: in* |
| D9 | How is the check seen to fail? | A test runs it on a small text written for the test, with one field and one value `lets backlog` does not print, and expects a finding for each. | Evidence: #328 packet, *Scope: in* |
| D10 | Does any test look for a fixed sentence? | No. | Evidence: #328 packet, *Scope: out*; #308 *Shared decisions* |
| D11 | Where is the writing rule (D3) written down for the people and agents who edit the texts? | In this repository's own `AGENTS.md`, outside the lets-spec markers, with the `contracts/` row of the README's *Layout* table naming the new check. | Assumption |

## Changes from the story

- **Cut: the fields of `lets delegate`, `lets go questions` and the step
  report.** Only the `lets backlog` help writes each output shape in a
  form a test can read. The others list their fields in prose, and
  rewriting that help would change `lets` (D2, D7). No new issue: review
  keeps checking them.
- **Cut: nested fields and backend values** that the `lets backlog` help
  does not list (D5).

Confirmed by user: yes
