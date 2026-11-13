**Why:** Archiving merges reviewed delta specs outside `openspec/changes/`, so rule 3 currently makes a completed code review look stale.

## Story

[#220 — archive-keeps-code-review](https://github.com/sidereal-io/lets-spec/issues/220)

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which archive changes keep the review current? | Exempt this change's archive commit only when its changes outside `openspec/changes/` are merges into `openspec/specs/` that match its delta specs as they stood at `<head-sha>`. | User |
| D2 | What stays outside the exemption? | Keep the listed-fix check and every other review trigger; archive reverts and plan review are out of scope. | User |
| D3 | How will we check the correction? | Use a small token-based Bats check and walk through a matching archive, an unrelated file change and a mismatched spec merge. | User |

## Changes from the story

The exemption requires matching the delta specs at `<head-sha>`, stricter than the issue's Scope line, which only names the capabilities.

Confirmed by user: yes
