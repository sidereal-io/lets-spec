**Why:** Parallel sessions can both claim the same issue, so claiming must select one owner before either session starts work.

## Story

#215 lets-go-claim-race — two sessions that claim the same issue at once end with one owner
https://github.com/sidereal-io/lets-spec/issues/215

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What chooses the owner? | A comment with a unique run token; the earliest active claim comment wins before Status changes, including under one login. | Evidence: #215 |
| D2 | What can a loser remove? | Its own comment and, only when the winner uses another login, its own assignment; never the winner's assignment or Status. | Evidence: #215 |
| D3 | What prevents an already assigned issue from changing? | Return taken immediately after the assignee read, before any write. | Evidence: #226 SLR-01 folded into #215 |
| D4 | Where does arbitration run now? | In lets backlog claim, which replaced the skill's direct GitHub mutations; return a claim identifier for session-specific release. | Evidence: lets/src/backlog/policy.ts and commit 35b2b02d |
| D5 | Do claim comments require shaping? | Recognize a fixed first line in the shared comment reference and exempt valid claim comments from unread-comment gating. | Evidence: #215 |
| D6 | What stays outside this story? | Lost-claim retry policy, idea search, sibling stories, generated skills and schemas; append interface checks as a self-contained block. | User |

## Changes from the story

Claiming moved into lets backlog after the issue was written. Apply the race fix in that CLI and update only its skill instructions, release paths and shared comment handling. No story is split out.

Confirmed by user: yes

## Remaining risk

GitHub comment reads can lag behind writes. Arbitration assumes each
post-write read includes earlier claims; delayed reads can let two sessions
win. Another read reduces that window but cannot guarantee visibility.
GitHub offers no atomic claim operation. This remains a limit of comment
arbitration, including cleanup reads.
