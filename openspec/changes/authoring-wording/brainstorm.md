**Why:** Agents copying authoring guidance can lose a scenario, misread an ADR's status or look for an artifact their flow does not have; #233 corrects the four findings from #226.

## Story

[#233: authoring-wording — an agent copying the spec, ADR and brainstorm guidance keeps every scenario, every supersession and the right capability path](https://github.com/sidereal-io/lets-spec/issues/233)

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What must the MODIFIED example retain? | Keep the unchanged signed-out scenario beside the updated CSV-or-JSON success scenario, with the same requirement heading and WHEN/THEN format. | User |
| D2 | Where do flows put implementation decisions? | Make the design reference conditional; flows without design follow their schema's ledger requirements, preserving one-line rows and confirmation rules. | User |
| D3 | What does an ADR readability rewrite preserve? | Preserve the recorded decision, reasons and supersession relationships; keep the rewrite requirement and never-delete rule. | User |
| D4 | Where does capability-path guidance belong? | Promote it before the existing-requirement section, preserving all guidance and keeping requirement preservation under the existing-requirement procedure. | User |

## Changes from the story

None. No new domain terms. Add regression checks as a self-contained block in tests/skill-interfaces.bats. Run all three required repository checks before the first push; the orchestrator reviews the open PR with another model afterward.

Confirmed by user: yes
