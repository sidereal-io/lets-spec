## Story

[#136 — Take an existing GitHub story through the shared backlog boundary](https://github.com/sidereal-io/lets-spec/issues/136).
This is a fresh planning restart for existing draft [PR #172](https://github.com/sidereal-io/lets-spec/pull/172), not another delivery owner.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is this work? | Replan #136 from current main, with the old branch as reference only; resolve product and architecture choices before selecting a replacement. | User, planning restart request |
| D2 | What architecture is currently accepted? | Lets owns policy, sequencing, private recovery and validation; agents execute bounded backend actions using inert provider definitions; shipped and custom definitions share one path. | Evidence: accepted ADR-015 on main 6524fbff |
| D3 | What established required remote facts before this restart’s amendment? | Lets independently retrieves original trusted tool request/response records; agent reports and agent-editable files cannot establish them. No suitable channel means pause, including routine claims and completion. | Historical evidence: main ADR-015; superseded by D10 below |
| D4 | Who runs the workflow? | Lets-go is the sole runner; planning, build and review remain separate steps. | Evidence: accepted ADR-020 |
| D5 | Is the old capture service a requirement? | No. ADR-022 is withdrawn and the separate-account service, root configuration, protected socket and packaging are unaccepted prototypes. Select no replacement implicitly. | User, planning restart request; evidence: PR #172 head b2ebe6a9 |
| D6 | What can happen during this restart? | Planning and read-only investigation; no capture implementation, installation, Project mutation, archive, readiness change, merge or competing PR. | User, planning restart request |
| D7 | What acceptance can qualify a later implementation? | Fresh scoped acceptance in mstelz/test-repo-pls-ignore and mstelz Project 7 after planning and implementation; historical fixtures and PRs cannot be replayed or mutated. | User, planning restart request |
| D8 | Should this restart select another architecture? | Follow the current accepted decisions, retaining earlier decisions where compatible; propose a change only when concrete evidence shows it is necessary. | User, 2026-11-07, clarification after comparing ADR-010 and ADR-015 |
| D9 | Which agent environments must work? | Both T3 and standalone coding-agent CLIs, through explicit configuration of integrations; no T3 code changes or requests to its maintainers, and no T3-first support restriction. | User, 2026-11-07, host support clarification |

| D10 | Must Lets independently retrieve original tool capture? | No. The configured adapter translates tool output into a submitted contract; Lets validates that contract and workflow rules. Explicitly revise ADR-015’s evidence clause, retaining policy/recovery ownership. This trusts submitted observations and cannot detect convincingly fabricated output. | User, 2026-11-07, explicit “yes” to the stated trust-model amendment |

## Changes from the story

The packet's executable transport is superseded by accepted ADR-015. The
restart preserves observable lifecycle outcomes while amending the evidence
trust requirement as explicitly approved in D10. The old branch's
ledger and claims of user confirmation do not confirm this replacement plan.

No new vocabulary definitions or scope split have been agreed. The shared
glossary remains unchanged.

## Resolved evidence decision

D10 resolves the capture prerequisite. Use ordinary configured CLI/MCP tool
output, adapter translation and code-owned contract validation. No new capture
system is selected or required. D9's cross-host support and D4's sole runner
remain in force. ADR-010's retained configuration principles and amended
ADR-015's execution boundary describe one strategy.

The user approved this specific amendment after the independent-capture versus
submitted-output distinction was explained. Earlier “Great let's do it” confirmed
planning scope; it did not approve a capture implementation. Research records
why the former evidence clause needed explicit reconsideration. The issue thread
was rechecked before proposal and remains empty.

## Delivery ownership

Keep the change name `github-backlog-build`, issue #136 and PR #172. This
worktree is a local planning workspace based on main, with no new claim or PR.
After agreement, reconcile the approved planning files back into the existing
PR branch, replacing its active plan and clearly separating obsolete material.
Do not import prototype code into this worktree or rewrite the existing branch
as part of this planning restart. Implementation and publication are later work.

Confirmed by user: yes
