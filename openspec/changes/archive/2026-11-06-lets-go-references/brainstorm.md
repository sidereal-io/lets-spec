**Why:** `lets-go`'s `SKILL.md` is 1,416 lines and loads whole on every run, though its glossary handoff, shape, prompt frame, records and subagent fallback serve only some runs; #202 has just settled where each rule lives, so the material can now move without moving a rule twice.

## Story

#203 lets-go-references — lets-go loads its shape, glossary, records, prompt and fallback material only when a run needs it, https://github.com/sidereal-io/lets-spec/issues/203

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What moves? | The five blocks C5 names, as they stand now: glossary (*Glossary preflight*, *Import the glossary checkpoint*); shape (the steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, the `<shape-name>` rules of *The change's name*, *What shape runs*); the prompt (*Write the prompt*); records (*Read the records*, *Records that disagree*); the fallback (*Run a step in a subagent*). Nothing else. | Evidence: #203 Scope, #194 C5 |
| D2 | Is the 400–500 line target a pass condition? | No. C5 measured 1,110 lines; the file is now 1,416. Moving the five blocks leaves about 900. The pull request records the measured count. No follow-up issue is filed. | User |
| D3 | Which files? | One per block in `skills/lets-go/references/`: `glossary-handoff.md`, `shape.md`, `step-prompt.md`, `records.md`, `subagent.md`. Each opens with a title and one line on when a run reads it. | Assumption |
| D4 | What stays of a part whose steps move? | Its `##` heading, its overview row, one sentence linking its steps in `shape.md`, and its `Next:` line. The steps move under a heading of the same name. A moved section that is not a part leaves no heading; each link to it names the file. | Assumption |
| D5 | Where does the shape prompt go? | *What shape runs* goes in `shape.md`, so a run with no shape step never loads it. Shape's two opening lines stay with the frame in `step-prompt.md`. | Assumption |
| D6 | What is "a template the agent copies and fills"? | `step-prompt.md` holds the fill rules, then the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills. Not a bare template file: the placeholder and link checks read `references/*.md`, and need the placeholders inside code. | Assumption |
| D7 | Does every claim load the glossary file? | No. `SKILL.md` says to open `glossary-handoff.md` only when the issue's body has a **Glossary handoff** section. With none, *Check the prerequisite* returns `resolved` and the preflight `no-owned-edits`, as the moved text already says. | Evidence: *Check the prerequisite* and *Glossary preflight*, `skills/lets-go/SKILL.md` |
| D8 | May the moved text change? | Only its heading levels, the links that now cross files, the D7 sentence and the D6 wording. | Evidence: #203 Scope (out) |
| D9 | What may the subagent write (D6)? | It follows the saved prompt, works only in this repository on the branch `<name>`, or the default branch for shape, and makes only the changes that step calls for. This replaces "and may write files". | Evidence: #203 D6 Fix |
| D10 | How are the links checked? | A link in any `lets-go` file to another file, with or without `#anchor`, names a file that exists relative to the linking file, and a heading in that file. The check runs on the source skills and on `lets-go` as installed in both published flows. | Evidence: #203 Scope |
| D11 | Which test helpers change? | `part_section` also reads the same-named section in a reference file, after `SKILL.md`'s, so the checks of a part's steps follow the moved text. `walk_section`, `parts_say_next`, the overview and level-order checks and `placeholder_rows` stay on `SKILL.md`. | Assumption |
| D12 | Which spec requirements change? | `lets-go`: *Exit 3 runs the step in a subagent* (D9), *Every link inside lets-go names one of its headings* (D10), *The lets-go checks read the skill's reference files* (D11), and one new requirement for D1, D4 and D7. | Assumption |

The user decided D2. The orchestrator confirmed every other row on the user's behalf, on 2026-11-06.

## Changes from the story

- The 400–500 line target is no longer a pass condition (D2). The file grew by 306 lines after C5 measured it, and the story moves only the five blocks.
- *Read the report*'s shape paragraphs stay in `SKILL.md`: C5 does not list them.

Confirmed by user: yes
