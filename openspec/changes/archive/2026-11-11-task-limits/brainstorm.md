## Story

#232 — task-limits: stop before writing oversized task lists and compare all concurrently eligible tasks for file sharing.
https://github.com/sidereal-io/lets-spec/issues/232

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What happens above twelve tasks? | Write no tasks.md, report the count and slice to move, and wait; the user decides the split in the brainstorm before task planning runs again on the smaller story. | User: #226 Shared decisions, SLR-19; repeated in #232 and explicitly requested for implementation. |
| D2 | Which tasks count for file sharing? | All other tasks in the section and tasks in any other section with no depends-on chain between the sections. | User: #226 Shared decisions, SLR-20; repeated in #232 and explicitly requested for implementation. |
| D3 | What stays unchanged? | Keep the five-to-twelve range, tags, section dependencies and minimal flow's prohibition on parallel tags; limit source edits to lets-write-tasks. | User: #232 scope and acceptance criteria. |

## Changes from the story

None. The user requested implementation through an open pull request using the decisions already recorded in #226. No new policy decision or glossary meaning is introduced. The issue thread has no comments.

Confirmed by user: yes
