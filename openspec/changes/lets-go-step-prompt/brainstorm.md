## Story

#344 lets-go-step-prompt — lets go step-prompt writes a step's prompt, and lets-go drops its prompt frame.
https://github.com/sidereal-io/lets-spec/issues/344

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which prompts does `lets go step-prompt` write? | The four walk steps (plan, review plan, build, review build), the shape step in its issue and idea forms, and the epic run's story prompt, so no copy of the frame or the `## Stack` text stays in the skill. | Assumption |
| D2 | How does the command give lets-go the prompt? | As plain text on stdout. lets-go redirects it to `.workspace/lets-go/<session>-prompt.md`, the file it already passes to `lets delegate step run`. The command writes no file. | Assumption |
| D3 | Where does the command get each value? | From flags, for every value lets-go already holds: the step, change name, issue and URL, schema, route line, question mode, the idea and whether the title search ran, and the three stack values. It finds the plain-language path under the repo root itself, exits 2 when that file is missing, and makes no backlog lookup. | Assumption |
| D4 | What happens to `references/step-prompt.md`? | Its remainder, the command line and the rule for when a story is stacked, folds into *Run a step* in `SKILL.md`, and the file is deleted. | Assumption |
| D5 | Does the prompts' text change? | No. The command prints the same text the frames give today; only where the text is written moves. | Evidence: #344 packet, Scope (out: changing the prompt's text) |
| D6 | Does a run look different to the user? | No. The steps, stops, questions and printed lines stay the same. | Evidence: #263 Shared decisions |
| D7 | Do the requirements and tests that this story touches check wording? | No. They are rewritten to check what a run does, not exact sentences. | Evidence: #263 Shared decisions |
| D8 | Is there a size target? | No. The pull request records `wc -l` for `SKILL.md` and for the whole skill. | Evidence: #263 Shared decisions |

## Changes from the story

- **Added: the epic run's story prompt** (D1). The packet left it out unless the plan found it is the same frame. It builds its `## Stack` section from the same text as the step prompt, so leaving it out would keep a copy of that text in `references/epic-run.md`.
- **Changed: `references/step-prompt.md` is deleted** (D4), where the packet kept a short file with what the command cannot know. A reference file that only points back to `SKILL.md` is the kind of stub #263 removes.

Confirmed by user: yes
