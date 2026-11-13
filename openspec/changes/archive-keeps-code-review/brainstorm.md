**Why:** Archiving merges reviewed delta specs outside `openspec/changes/`, so rule 3 currently makes a completed code review look stale.

## Story

[#220 — archive-keeps-code-review](https://github.com/sidereal-io/lets-spec/issues/220)

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which archive changes keep the review current? | Exempt an archive commit only when its changes outside `openspec/changes/` are merges into `openspec/specs/` that match this change's reviewed delta specs. | User |
| D2 | What stays outside the exemption? | Keep the listed-fix check and every other review trigger; archive reverts and plan review are out of scope. | User |
| D3 | How will we check the correction? | Use a small token-based Bats check and walk through a matching archive, an unrelated file change and a mismatched spec merge. | User |

## Changes from the story

None.

Confirmed by user: yes
