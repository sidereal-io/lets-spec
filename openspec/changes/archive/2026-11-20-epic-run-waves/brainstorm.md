<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#285 epic-run-waves — the epic run sorts its stories into waves and says why it split them, https://github.com/sidereal-io/lets-spec/issues/285

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story build, and what does it leave out? | Sort the epic's stories into waves, print the waves and each split's reason at the start of the run, and still build one story at a time, wave by wave. Running a wave in parallel (#286) and using affected specs are out. | Evidence: #285 packet, Scope |
| D2 | Does the new term *wave* go in the shared glossary, and with what meaning? | Yes, in `openspec/glossary.md`, because #286 uses it too: a set of an epic's stories an epic run may build at the same time, with no chain of blocked-by links between any two and no overlapping path under Relevant code; sorted when the run starts, built in order. | Assumption |
| D3 | Which stories go into the waves, and which blocked-by links split two stories? | Only the stories not settled when the epic run starts, computed again on each run. A chain splits two stories only when it runs through the epic's stories in this repository; a link through an issue outside the epic splits nothing. | Assumption |
| D4 | When do two stories' Relevant code overlap? | By path only: a code span with no space that holds a `/` or ends in a file extension. Two paths overlap when they are equal or one is a folder holding the other. Other code spans and section names are ignored. | Assumption |
| D5 | Where does a story go when its Relevant code names no path? | It overlaps every story, so it gets a wave of its own, and its reason says its packet names no Relevant code. | Assumption |
| D6 | How are stories placed into waves? | In the epic's order, each in the earliest wave after every wave that holds one of its blockers, moved on while it shares a path with a story in that wave. Its reason names the story it waits for: the blocker or the story it shares a path with. | Assumption |
| D7 | What happens when a wave has stories left that cannot be built? | Each pick passes only the stories of the earliest wave with a story not settled, ranked as today. When that wave has nothing ready, settle each remaining story with the not-built line it gets today, then go on with the next wave. | Assumption |
| D8 | Where are the waves computed? | In a new command, `lets backlog waves --only <keys>`, which reads each story's blockers and packet and prints one JSON object with each wave's stories and each split's reason. The skill prints the lines. | Assumption |
| D9 | What does the epic run print at the start? | `Waves for #<parent>:`, then one `Wave <n>: #a, #b` line per wave, then under each later wave one line per story saying why it waits, such as `#286 waits for #285: blocked by #285.` or `#287 waits for #283: both name skills/lets-go/references/shape.md.` Printed once, after finished stories are settled and before the first Picked line, even with one wave. | Assumption |

## Changes from the story

- Added: the command `lets backlog waves --only <keys>` (D8). The packet's Relevant code already names `lets/src/backlog/commands.ts`; the command gives placement Node tests and lets #286 reuse its output.
- Added: the glossary entry *wave* (D2), committed on this branch on its own.

Confirmed by user: yes
