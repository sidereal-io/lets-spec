**Why:** The latest user clarification replaces built-in provider execution with an execution hybrid across delegation and backlogs, so the recorded architecture must be corrected before runtime migration.

## Story

[#179 — adapter-architecture](https://github.com/sidereal-io/lets-spec/issues/179): record the execution hybrid across lets.

## Earlier decisions (superseded where noted below)

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

## Clarification decisions — 2026-11-04

The earlier ledger is retained as history. C1 supersedes D1 and D6; C4 supersedes
D7's exact-match requirement while preserving its recovered checkpoint provenance.
The two execution models were different choices. Earlier review approval covered
the earlier choice, not this correction.

| # | Question | Answer | Source |
|---|---|---|---|
| C1 | Who executes backend actions? | lets checks policy and prerequisites and requests bounded actions; the agent uses CLI/MCP backend tools and submits structured results; lets validates and controls sequencing/recovery across delegation and backlogs. | User |
| C2 | What is open to independent authors? | Ship provider definitions for tool usage/mappings and accept custom definitions implementing existing supported operations without a lets release or separate adapter executable; new operations or guarantees require core changes; use one implementation of provider behavior. | User |
| C3 | What proves remote effects? | Schema-valid agent reports and repeat reads reported by the same agent are attributed evidence, not independent proof; required guarantees without independent verification block automatic retry/progression pending reconciliation or manual resolution. | User |
| C4 | What does Adapter mean? | Replace its code-only definition with the explicitly approved integration definition in openspec/glossary.md; #179 / PR #181 remains sole owner and preserves checkpoint/import provenance. | User |
| C5 | What scope changes first? | Reconcile #174/#179/#180 and architecture clauses in #137–#145 before correcting the ADR; retain provider outcomes, dependencies and #52 release obligations; no #180 runtime implementation or unrelated backlog changes. | User |
| C6 | What remains settled? | Native ownership/status, exact merge evidence and private local journals; best-effort claims do not become atomic; do not touch or merge #172 or repeat its completed acceptance mutations. | User |
| C7 | How does the ready PR reopen? | Mark draft, git revert the archive commit, commit fixes, run required review/verification/checks, archive in a separate last commit and mark ready; leave merge to the user. | User |
| C8 | Which independent evidence channel is selected? | Trusted tool-host/generic-runner capture records actual agent-initiated tool requests/results outside the editable report; lets retrieves/verifies action-bound records through that channel, using one definition per integration; #180 must prove fresh claims and exact merge evidence before support claims. | User |
| C9 | What happens without required evidence? | Pause automatic retry/progression and ask the user how to reconcile or whether to stop; approval alone is not remote-state proof; no silent direct-read execution fallback. | User |

## Changes from the story

The corrected #179 packet now documents the execution hybrid. Its previous
built-in execution choice is explicitly superseded. #180 retains the GitHub
runtime migration; delegation runtime follow-up belongs under #174 and is not
claimed complete here. Runtime specs remain skipped for this documentation chore.

Confirmed by user: yes
