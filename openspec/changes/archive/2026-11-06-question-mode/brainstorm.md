**Why:** "Interactivity level" and its value `recommend` don't say what they control. The values aren't a scale, and `recommend` means `lets-go` accepts recommendations for you. Nothing has shipped since v0.7.0, so the names can change now without breaking anyone.

## Story

#222 question-mode — lets-go's interactivity level becomes the question mode: go.questions, ask or auto. https://github.com/sidereal-io/lets-spec/issues/222

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What replaces each old name? | The packet's table: Question mode, `go.questions`, `ask` and `auto`, `lets go questions` printing `{"questions":…}`, `Questions: <mode>, because …`, *Set the question mode*, `<mode>`, capability `go-questions` | User |
| D2 | Do the old names keep working? | No. No alias, no deprecation warning, no config version bump. `go.level` becomes a key this `lets` doesn't know, which it ignores like any other | User |
| D3 | What does the glossary say? | Question mode: how `lets-go` handles a step's questions. `ask` puts every question to the user; `auto` answers each one that has a recommendation, says what it chose, and asks the rest. `terms.md` gets the same text | User |
| D4 | What are the names in the code? | `QUESTION_MODES`, `QuestionMode`, `questionModeFor`, `GO_QUESTIONS_HELP`; `lets/src/go/questions.ts` and `tests/lets/go/questions.test.ts` | User |
| D5 | How does the spec capability move? | `go-level` removes all four requirements, each pointing to `go-questions`, which adds them restated under the new names | Evidence: openspec/changes/archive/2026-10-24-resolver-specs-by-command |
| D6 | Does a mode word beside an idea still need the question? | Yes. The rule in *Read the request* is unchanged, with the words `ask` and `auto` | Evidence: skills/lets-go/SKILL.md |
| D7 | Are the decision records and archived changes edited? | No. They record history. ADR-011 and ADR-015 keep their wording | User |
| D8 | Does the glossary rename land in this pull request? | Yes, as its own `docs:` commit on this branch | User |

## Changes from the story

None.

Confirmed by user: yes
