**Why:** `lets-go` is the skill every run starts from, and the fifteen changes before this one grew it to 1,100 lines of dense prose; now that its behavior is settled, a plain-language pass makes it readable before the release that ships it.

## Story

#187 lets-go-plain-language — the lets-go skill reads to ISO 24495 plain language, with every pinned line unchanged, https://github.com/sidereal-io/lets-spec/issues/187

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does this chore change? | Only `skills/lets-go/SKILL.md`: its prose, its front-matter description and the prose cells of its tables. No other skill, schema, spec, test or README changes. | Evidence: #187 packet |
| D2 | Does the pass touch the spec? | No. `openspec/specs/lets-go/spec.md` states behavior and fixed lines, and the pass changes neither. The change sets `skip_specs: true`. | Evidence: `openspec/specs/lets-go/spec.md` |
| D3 | What proves "no change in what it does"? | Four diffs against the file at the base commit `5d9870f`: the fenced blocks are identical and in the same order; the set of inline code spans is identical; the headings are identical and in the same order; the set of links is identical. Every command, printed line, path, placeholder and anchor lives in one of those four. The bats suite proves the pinned lines on top. Every task's verify command runs all of it. | Assumption |
| D4 | Does the prose inside fenced blocks change, such as the step prompt frame and *What shape runs*? | No. Those blocks are text `lets-go` writes for a step session to read, so a reworded block changes what the step reads. D3 holds them byte-for-byte. | Assumption |
| D5 | How do the pinned lines stay byte-for-byte? | Each pin in `tests/skill-interfaces.bats` and in the spec's fixed-lines list is inline code, a fenced line, a heading, a table row, or one of the prose phrases tasks.md lists. D3 covers the first four, and `bats tests/skill-interfaces.bats` checks every pin in every task. The negative pins hold too: the file must not come to say `needs an issue number, and stop` or `with a Code review section`. | Evidence: `tests/skill-interfaces.bats`; `openspec/specs/lets-go/spec.md` |
| D6 | Which word for which concept? | `print` a fixed line; `say` something to the user in prose; `show` the user a file or an output. `pick` an issue, a story or a candidate, never `select`. `stop` a run; a step `ends` with its report. `remove` a file or an assignee; `delete` only a branch, which is git's word. `folder`, never `directory`. `repository`, and `repo root` as the phrase every skill shares. `say`, never `tell`. The glossary's *step*, *step report*, *interactivity level* and *packet* keep their meanings. | Assumption |
| D7 | What may the pass do to the structure? | Nothing to the headings, their words or their order, so every anchor and pin holds. Lists and tables keep their rows and their order. Inside a sentence or a paragraph: the condition comes before the action, every pronoun has one plain referent, every sentence holds one idea in at most 30 words, the actor is named, and a cross-reference says what it points at before it points. No instruction is added, cut or moved to another section. | Assumption |
| D8 | Does the front-matter description change? | Yes. It keeps every fact and its "Use when" sentence, in shorter sentences, so the same facts keep the same triggers. Nothing tests it. | Assumption |
| D9 | What is each task's test? | A readability check on the task's sections: no prose sentence over 30 words, and none of the words D6 rules out. It is red today for four of the eight section groups. For the other four, the check, the D3 gate and the bats suite guard the edit, and the edit itself is the review D7 describes. The check is a proxy: a reader is the real test, and the pull request's reviewer reads every commit. | Assumption |
| D10 | What if a sentence reads two ways, and the two mean different behavior? | Keep the reading the spec requires. When the spec is silent, keep the words, and name the sentence in the pull request description for the user. The pass fixes no defect: a fix is a change in what it does. | Assumption |
| D11 | Does the line wrapping change? | Only to stay consistent: prose wraps at about 72 columns, as most of the file does today, and tables and fenced blocks stay as they are. Nothing tests the width. | Assumption |
| D12 | How is the work committed? | One `docs:` commit per task. Each task is a group of neighbouring sections, so a reviewer reads one group per commit. | Assumption |
| D13 | Any new glossary terms? | None. | Evidence: `openspec/glossary.md` |

## Changes from the story

None.

Confirmed by user: no
