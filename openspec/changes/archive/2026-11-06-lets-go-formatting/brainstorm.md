**Why:** `lets-go` has 61 prose lines past its 72-column wrap and
writes the same kind of reference in several ways, so an agent or a
reader cannot tell a link from a name; the last story of #194 fixes both
once the earlier stories have stopped moving the text.

## Story

#206 lets-go-formatting — lets-go wraps at 72 columns and uses one
convention for each kind of reference,
https://github.com/sidereal-io/lets-spec/issues/206

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story change? | Findings A3 and A4 of #194, in `skills/lets-go/SKILL.md` and its six reference files, with their tests and spec. No rewording. A1 and A2 are not in this story: #197 and #199 closed them. | Evidence: #206 Scope and Findings |
| D2 | How much of A3 is still open on the base? | All of it but its blocker. #198 lets the exit-3 sentence wrap (*The exit-3 sentence may wrap*), but `SKILL.md` L860 is still 87 columns. #203 grew links with file paths, and #204 shortened the description but kept it one line. The base has 61 prose lines over 72 in six files, five lines that hold only a link, and six in `terms.md`. | Evidence: `skills/lets-go/` at `7263de4`; `openspec/specs/lets-go/spec.md` |
| D3 | Which lines may run past 72 columns? | The frontmatter; table rows; lines inside fenced code blocks; a line that holds one link and nothing else but indent, a list marker and closing punctuation; and all of `terms.md`. Every skill keeps its description on one line, and `description_short` reads it there. Breaking a command or a printed line changes it. The link checks and `first_term_links` read line by line. `terms.md` is a word-for-word copy of `openspec/glossary.md`, which this story does not touch. | Assumption (decided by recommendation) |
| D4 | What is a column? | One character (Unicode code point), not one byte, so `ログを直す` counts five. | Assumption (decided by recommendation) |
| D5 | How does the wrap stay fixed? | A new skill-interfaces check fails on a line past 72 columns outside the D3 exceptions, and names the file, the line number and the length. | Assumption (decided by recommendation) |
| D6 | What form does a section reference take? | A link, every time, in prose and in table cells, the overview's *Next* column included. A section of another skill links into that skill: *Check an earlier review* to `../lets-review-plan/SKILL.md`, *Finish the change* to `../lets-review-build/SKILL.md`. About 105 italic references remain on the base. Linking only the first mention in a section was the alternative: it needs a check that tracks sections, and the story asks for every one. | Evidence: #206 Scope; *lets-go refers to no step by its number* ("by its name and a link") |
| D7 | Does a check hold D6? | Yes. A new skill-interfaces check fails on italic text, outside code, that equals a heading of a `lets-go` file or of a section it links in another skill, and names the file, the line and the text. | Assumption (decided by recommendation) |
| D8 | What about a heading inside the step prompt frame, *What to run*? | It is not a section of a file, so it cannot be a link. Write the literal heading in a code span, `## What to run`, as `records.md` already writes `## Plan review`: the agent writes or searches for that exact text. | Assumption (decided by recommendation) |
| D9 | What form does a step name take? | Plain words in prose: shape, plan, review plan, build, review build. Code font stays for `--for` values, file names, config keys and the step table's *Step* column, as *The step table* already says. Three are left on the base: `shape.md` L60, `SKILL.md` L528 and L889. No new check: the cases are few, and a pattern cannot tell prose from a `--for` value. | Evidence: `SKILL.md` *The step table* |
| D10 | What form does a pull request section name take? | Bold, such as **Code review** and **Plan review**. Two are left in code font: `SKILL.md` L458 and `records.md` L64. A literal to search for (`## Plan review`) and a printed line stay code. A check fails on a code span that holds only `Code review` or `Plan review`. | Evidence: #206 Scope; Assumption (decided by recommendation) for the check |
| D11 | What form does a printed line take? | A whole line the run prints sits in a `text` block. A part of a line, such as the `Records disagree:` prefix or a line named in prose, and a line in a table cell are code spans. Left on the base: the inline `Picked` line at `SKILL.md` L207 (`shape.md` L85 has its twin in a block) and the two `Failed` examples at `SKILL.md` L802–L804. No new check. | Assumption (decided by recommendation) |
| D12 | What else changes with the text? | Every test pin and spec string that quotes a changed reference changes with it, such as about 20 pins with an italic section name in `tests/skill-interfaces.bats`. The guards in the stack keep passing: placeholders, step numbers, lists, links, `first_term_links`, `terms.md` against the glossary. New spec requirements state the wrap and the convention for each kind of reference. | Evidence: `tests/skill-interfaces.bats`; `openspec/specs/lets-go/spec.md` |
| D13 | Is the story one change? | Yes, about nine tasks: two checks, the wrap in each file, and one pass for each kind of reference. | Assumption (decided by recommendation) |
| D14 | Does the story add or change a glossary term? | No. "Section reference" and "printed line" stay plain words. | Evidence: `openspec/glossary.md` |

## Changes from the story

- `terms.md` keeps the glossary's wrap, though the story names the
  reference files (D3).
- The frontmatter description stays one line, though A3 names it (D3).
- Added: checks that hold the wrap, the section links and the pull
  request section names (D5, D7, D10).
- The Project's Size XS understates the work: about 105 references
  become links. The story is not split (D13).

The orchestrator confirmed this ledger on the user's behalf on
2026-11-06: the user lets it confirm a ledger that keeps the story's
outcome and has no open question.

Confirmed by user: yes
