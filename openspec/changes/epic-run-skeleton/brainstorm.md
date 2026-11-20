## Story

#279 epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story.
https://github.com/sidereal-io/lets-spec/issues/279

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which stories can an epic run build? | The epic's open sub-issues that `next` would take, ranked as `next` ranks them, with `lets backlog ready --only <keys>`. After each story the run ranks them again and picks the next. | Evidence: #279 Scope; `skills/lets-go/references/shape.md` (*Pick the first ready story*) |
| D2 | Does the skeleton build a story whose blocker is still open? | No. `lets backlog ready` leaves it out, and the run reports it, not built, with its blocker. Stacking on a blocker's branch is #280. | Evidence: #279 Scope; `lets/src/backlog/commands.ts` (`ready`) |
| D3 | Where can an epic run start? | Only on the default branch: on a change's branch a number must name that branch's issue, and an epic has no branch. | Evidence: `skills/lets-go/SKILL.md` (*Read the request*) |
| D4 | The glossary's *Story run* and *Epic run* describe the epic's end state: child sessions and shaping an empty epic. Narrow them? | No. Keep both definitions in `openspec/glossary.md` as imported. The lets-go spec and design say that this change walks each story run in the epic run's own session and does not shape an empty epic yet; #284 and #283 add those parts. | Assumption |
| D5 | At the end of an epic run, which stories get a line, and what does it say? | One line for every open sub-issue the epic had when the run started, in the order the run settled them. Built: `#<story> <name>: <PR URL>`. Not built: `#<story> <name>: not built, <reason>`, such as `blocked by #279`, `assigned to <login>`, `its packet is not complete` or `in another repository`. | Assumption |
| D6 | What happens when a story's step fails, or the walk stops for that story (records disagree, pull request merged or closed)? | The epic run stops at that story and prints every line. That story gets `failed at <step>: <reason>` or `stopped: <reason>`. Each story it never reached gets `not built, the epic run stopped at #<story>`. Going on past a failure is #281. | Assumption |
| D7 | Does the epic run claim the epic itself? | No, only each story it builds. Each story's claim already stops two runs from building the same story. | Assumption |
| D8 | What happens when another session claims a story first? | The story gets `not built, taken by <login>`, and the run picks again with `--exclude`. The three-lost-claims stop does not apply inside an epic run: the epic's set of stories is fixed, so the run always ends. | Assumption |
| D9 | Which of *Check the issue*'s checks run on the epic itself, before the epic run starts? | The blocker check runs as today, so an open blocker on the epic with no branch stops the run. *Check the prerequisite* does not run on the epic: each story's own check runs when the run ranks it, and #279 passes because it owns the definitions. | Assumption |
| D10 | What does `lets-go` do with an epic that has no open sub-issues? | Say that `#<parent>` has no open stories, that `lets-go` does not shape an empty epic yet, and to run the `lets-shape` skill on it. Claim nothing, and stop. | Assumption |

## Changes from the story

- **Added:** a story that fails or stops ends the epic run (D6). #281 makes the run go on past a failure.
- **Added:** the three-lost-claims stop does not apply inside an epic run (D8).
- **Added:** the epic's own *Check the prerequisite* is skipped (D9).
- **Added:** an epic with no open stories gets a message that points to `lets-shape` (D10). Shaping an empty epic is #283.
- **Clarified:** the glossary terms stay as defined; this change does not use child sessions (#284) or shape an empty epic (#283) (D4).

Confirmed by lets-go under question mode auto, on the user's instruction; rows marked Assumption were not decided by the user.

Confirmed by user: yes
