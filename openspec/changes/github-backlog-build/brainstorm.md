## Story

[#136 — Take an existing GitHub story through the shared backlog boundary](https://github.com/sidereal-io/lets-spec/issues/136).
This is a fresh planning restart for existing draft [PR #172](https://github.com/sidereal-io/lets-spec/pull/172), not another delivery owner.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is this work? | Replan #136 from current main, with the old branch as reference only; resolve product and architecture choices before selecting a replacement. | User, planning restart request |
| D2 | What architecture is currently accepted? | Lets owns policy, sequencing, private recovery and validation; agents execute bounded backend actions using inert provider definitions; shipped and custom definitions share one path. | Evidence: accepted ADR-015 on main 6524fbff |
| D3 | What establishes required remote facts under that decision? | Lets independently retrieves original trusted tool request/response records; agent reports and agent-editable files cannot establish them. No suitable channel means pause, including routine claims and completion. | Evidence: ADR-015, Bounded actions, submissions and evidence |
| D4 | Who runs the workflow? | Lets-go is the sole runner; planning, build and review remain separate steps. | Evidence: accepted ADR-020 |
| D5 | Is the old capture service a requirement? | No. ADR-022 is withdrawn and the separate-account service, root configuration, protected socket and packaging are unaccepted prototypes. Select no replacement implicitly. | User, planning restart request; evidence: PR #172 head b2ebe6a9 |
| D6 | What can happen during this restart? | Planning and read-only investigation; no capture implementation, installation, Project mutation, archive, readiness change, merge or competing PR. | User, planning restart request |
| D7 | What acceptance can qualify a later implementation? | Fresh scoped acceptance in mstelz/test-repo-pls-ignore and mstelz Project 7 after planning and implementation; historical fixtures and PRs cannot be replayed or mutated. | User, planning restart request |
| D8 | Should this restart select another architecture? | Follow the current accepted decisions, retaining earlier decisions where compatible; propose a change only when concrete evidence shows it is necessary. | User, 2026-11-07, clarification after comparing ADR-010 and ADR-015 |

## Changes from the story

The packet's executable transport is superseded by accepted ADR-015. The
restart must preserve the observable lifecycle outcomes while resolving how
the accepted evidence requirement can work in practice. The old branch's
ledger and claims of user confirmation do not confirm this replacement plan.

No new vocabulary definitions or scope split have been agreed. The shared
glossary remains unchanged.

## Open decision

Which existing host interface can satisfy the accepted evidence guarantee,
and what user setup does it actually require? Follow ADR-015 and ADR-020;
do not select another execution strategy or weaken evidence requirements.
ADR-010's retained selection/configuration principles still apply, while
ADR-015 governs the target execution and extension boundary. This does not
select two competing execution paths.

See [the evidence assessment](research.md) for actual interfaces and unresolved
trust properties. Investigate host integration first. No capture implementation
is selected or proven. Reconsidering an ADR is exceptional and needs concrete
evidence of necessity plus an explicit user decision.

The user confirmed proceeding under the current decisions with “Great let's
do it” after D8 was explained. This confirms the architecture and planning
scope, not a capture implementation. Proposal and behavioral specs can now
describe the accepted target; design cannot select an unproven channel.
The issue thread was rechecked before proposal and remains empty.

## Delivery ownership

Keep the change name `github-backlog-build`, issue #136 and PR #172. This
worktree is a local planning workspace based on main, with no new claim or PR.
After agreement, reconcile the approved planning files back into the existing
PR branch, replacing its active plan and clearly separating obsolete material.
Do not import prototype code into this worktree or rewrite the existing branch
as part of this planning restart. Implementation and publication are later work.

Confirmed by user: yes
