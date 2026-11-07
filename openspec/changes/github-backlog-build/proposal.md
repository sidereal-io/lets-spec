## Why

Existing GitHub stories need to pass through the shared backlog boundary while
preserving native ownership, safe recovery and completion after merge. The
existing PR prototype depends on a withdrawn capture-service design, so its
active plan must be replaced before implementation continues (D1, D5).

## What Changes

- Deliver the existing-story GitHub journey through Lets policy, bounded
  agent actions and validated results, following amended ADR-015 (D2, D8, D10).
- **BREAKING**: replace executable-adapter transport with one request/result
  contract for shipped and explicitly selected custom provider definitions.
  Reject obsolete executable settings with a migration remedy.
- Preserve complete scoped reads, shared readiness/ranking, native best-effort
  claim/release, private recovery, immutable item identity and exact associated
  PR merge evidence. Missing or uncertain facts stop retry and progression.
- Accept configured adapter submissions of tool output and derive normalized facts;
  Lets validates correlation, mappings, freshness, coverage and workflow rules.
  Amend ADR-015 explicitly to remove independent capture. This trusts submitted
  observations and cannot detect plausible fabricated output (D10).
- Keep lets-go as the only runner and pass identity/recovery context through
  its existing planning, build and review steps (D4).
- Support the workflow from both unchanged T3 and standalone coding-agent
  CLIs through explicit integration configuration. Do not make T3 changes,
  upstream requests or T3-only initial support prerequisites (D9).
- Replace transport-specific conformance tests without dropping behavioral
  guarantees. Require fresh scoped live acceptance after implementation (D7).

## Capabilities

### New Capabilities

- `github-backlog-build`: carry an existing GitHub story through selection,
  claim, work/resume, release, PR association and merge-gated completion.

### Modified Capabilities

- `backlog-adapter-contract`: replace the executable transport and settings
  with bounded actions, inert provider definitions and validated submitted
  tool observations while retaining operation semantics and conformance obligations.
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
