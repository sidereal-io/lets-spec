## Why

Existing GitHub stories need to pass through the shared backlog boundary while
preserving the current workflow and its existing ownership and recovery behavior. The
existing PR prototype depends on a withdrawn capture-service design, so its
active plan must be replaced before implementation continues (D1, D5).

## What Changes

- Deliver the existing-story GitHub journey through Lets policy, bounded
  agent actions and validated results, following amended ADR-015 (D2, D8, D10).
- **BREAKING**: replace executable-adapter transport with one request/result
  contract for shipped and explicitly selected custom provider definitions.
  Reject obsolete executable settings with a migration remedy.
- Preserve complete scoped reads, shared readiness/ranking, native best-effort
  claim/release and private recovery. Keep existing branch and issue lookup,
  step selection, review, stack and terminal-PR behavior. Do not add runner
  actions merely because the shared contract defines them.
- Accept configured adapter submissions of tool output and derive normalized facts;
  Lets validates correlation, mappings, freshness, coverage and workflow rules.
  Amend ADR-015 explicitly to remove independent capture. This trusts submitted
  observations and cannot detect plausible fabricated output (D10).
- Keep lets-go as the only runner and preserve its existing resume behavior.
  The adapter supplies backend facts; shared workflow policy decides when to
  continue. Private recovery is for uncertain operations, not an extra login
  requirement for ordinary resume (D4, D12).
- On an existing branch, perform the user-approved read-only ownership and
  status check before unfinished work. A mismatch stops without reassigning,
  claiming again or changing status (D14). Keep ADR-015's existing rule.
- Replace the existing-story journey's remaining repository and PR callouts,
  including step and review callers, through the configured code-host boundary.
  This uses the same bounded action engine; it does not execute tools in Lets.
- Preserve today’s merged and rejected PR stops. Do not add a terminal
  completion write, historical PR lookup or committed identity file. Keep the
  shared contract’s merge-gated completion guarantee for any actual completion
  request; defining that operation does not make lets-go call it.
- Support the workflow from both unchanged T3 and standalone coding-agent
  CLIs through explicit integration configuration. Do not make T3 changes,
  upstream requests or T3-only initial support prerequisites (D9).
- Replace transport-specific conformance tests without dropping behavioral
  guarantees. Require fresh scoped live acceptance after implementation (D7).

## Capabilities

### New Capabilities

- `github-backlog-build`: carry an existing GitHub story through selection,
  claim, work/resume and release while preserving existing PR and finishing
  behavior through the appropriate configured integration.

### Modified Capabilities

- `backlog-adapter-contract`: replace the executable transport and settings
  with bounded actions, inert provider definitions and validated submitted
  tool observations while retaining operation semantics and conformance obligations.
- `issue-comments`: keep labels, markers and shaping behavior while routing
  lets-go and brainstorm thread reads through complete adapter observations.
- `lets-go`: route existing-story backlog operations through the shared
  request/result path while preserving sole runner and step ownership.

## Impact

Affects backlog contracts/runtime, definition loading, machine and repository
configuration, conformance, workflow instructions and release contents.
Backend CLI/MCP authentication remains with those tools. No root installation,
service, socket, protected credential deployment or platform restriction is
selected by this proposal. Backend and machine tool choices are
explicit configuration, not implicit selection based on the agent host.

The scope is #136 and existing draft PR #172. No competing PR, new claim or
Project mutation belongs to this restart. Setup/shaping writes, other backend
implementations and delegation migration remain outside this GitHub slice.
Shared contract changes must preserve their operation coverage. See
[research.md](research.md) for the evidence and [design.md](design.md) for the
replacement contract and recovery design. This proposal does not claim
implementation or live support.
