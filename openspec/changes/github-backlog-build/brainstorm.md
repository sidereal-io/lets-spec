## Story

#136 github-backlog-build — Take an existing GitHub story through the shared backlog boundary

https://github.com/sidereal-io/lets-spec/issues/136

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which execution model governs the revised PR? | Port #172 to the accepted request/result architecture in ADR-015. Replace the executable boundary rather than retaining a second execution path. | User, 2026-11-07 |
| D2 | Who owns the work? | Lets owns policy, sequencing, validation and private recovery. Provider definitions describe tool usage and mappings. Agents execute bounded requested actions and submit structured results. | ADR-015 |
| D3 | Which behavior must survive? | Preserve readiness/ranking, complete scoped reads, packet/comment/glossary policy, native ownership, private continuation, release, immutable identity and exact merge-gated completion. | #136; ADR-015 |
| D4 | What establishes required remote facts? | Independent trusted capture of actual tool requests and responses. Reports, editable files and local journals cannot prove ownership or merge. Without capture, pause retry and progression. | ADR-015; #180 |
| D5 | How does this fit main's workflow? | Lets-go selects and claims; lets-plan plans; lets-build implements; lets-review-build verifies, archives and marks ready. Pass explicit private continuation through those steps. | ADR-020 |
| D6 | What is outside this port? | Setup/shaping writes, new providers, delegation runtime migration, claim/storage redesign and automatic PR merging. | #136; #180; ADR-015 |
| D7 | What evidence can be reused? | Preserve old acceptance as historical evidence only. Never repeat its mutations. The new architecture needs its own automated and fresh scoped live acceptance. | #180 |

## Changes from the story

The user explicitly chose to port #172, incorporating the GitHub execution
migration described in #180 into this PR. The old packet's executable
transport is superseded by ADR-015. #180's earlier exclusion of rewriting
#172 is superseded by that explicit instruction; unrelated provider and
delegation work stays outside this change.

## Capture implementation assumption

The repository and available tool catalog do not identify an established
trusted capture channel. The user has been asked for an existing service
interface. If none exists, a generic capture service must be designed and
deployed outside the agent's write access. Its trust, tool identity and
request/response provenance must be demonstrated before routine claims
or completion can progress. Approval alone cannot establish those facts.
The selected implementation assumption is a generic separately administered
runner, specified in the design. No system-service installation is authorized
by this assumption. Deployment and live qualification remain required gates;
pure/offline implementation can proceed after review of the concrete design.

Confirmed by user: yes
