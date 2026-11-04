**Why:** Delegation and backlogs need one architecture decision before the backlog runtime migration can proceed without conflicting contracts.

## Story

[#179 — adapter-architecture](https://github.com/sidereal-io/lets-spec/issues/179): record one built-in adapter model across lets.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Who executes operations? | Code shipped inside lets owns execution, validation, deadlines and recovery across delegation and backlogs; configuration supplies supported provider mappings and options. | User |
| D2 | Which prior decisions change? | Record a common ADR that explicitly supersedes ADR-014 and reconciles ADR-010, ADR-005 and ADR-011, with links explaining which rules remain. | User |
| D3 | What must the ADR cover? | Configuration ownership, definition validation and versioning, selection and discovery, packaging, compatibility, deadlines and errors including unknown outcomes; distinguish adapter packaging from backend tools. | User |
| D4 | What remains settled? | Preserve native ownership, status and exact merge evidence with private local recovery journals; do not reopen storage or claim design. | User |
| D5 | Where does this work end? | Document the architecture and identify executable-specific contract requirements for migration in #180; do not implement that runtime or rewrite or merge PR #172. | User |
| D6 | Which alternatives were rejected? | The agent-executed recipe hybrid and independently installed adapters are not the selected architecture. | User |
| D7 | Who owns vocabulary? | This PR alone carries the exact recovered Adapter, Resolver, Backend and Extension definitions from ae72942bb6546d3694a339196ad3083cee6b3a05. | User |
| D8 | What establishes provider support? | Retain #52's four-provider release obligations; architecture documentation and offline fixtures do not establish production support or replace live acceptance. Do not repeat completed acceptance mutations. | User |
| D9 | Does this chore change runtime behavior? | No. Use skip_specs for this documentation prerequisite, retain the existing runtime specs until #180 migrates them, and explain their executable-specific requirements in the ADR's migration inventory. | User |

## Changes from the story

None.

Confirmed by user: yes
