## Why

Existing GitHub stories need to pass through the shared backlog boundary while
preserving native ownership, safe recovery and completion after merge. The
existing PR prototype depends on a withdrawn capture-service design, so its
active plan must be replaced before implementation continues (D1, D5).

## What Changes

- Deliver the existing-story GitHub journey through Lets policy, bounded
  agent actions and validated results, following accepted ADR-015 (D2, D8).
- **BREAKING**: replace executable-adapter transport with one request/result
  contract for shipped and explicitly selected custom provider definitions.
  Reject obsolete executable settings with a migration remedy.
- Preserve complete scoped reads, shared readiness/ranking, native best-effort
  claim/release, private recovery, immutable item identity and exact associated
  PR merge evidence. Missing or uncertain facts stop retry and progression.
- Require independent retrieval of original tool records for required remote
  facts. Qualify an actual channel before claiming a usable GitHub path;
  ordinary history views and agent-created receipts do not qualify (D3).
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
  with bounded actions, inert provider definitions and independently retrieved
  evidence while retaining operation semantics and conformance obligations.
- `lets-go`: route existing-story backlog operations through the shared
  request/result path while preserving sole runner and step ownership.

## Impact

Affects backlog contracts/runtime, definition loading, machine and repository
configuration, conformance, workflow instructions and release contents.
Backend CLI/MCP authentication remains with those tools. No root installation,
service, socket, protected credential deployment or platform restriction is
selected by this proposal. Backend and machine tool/channel choices are
explicit configuration, not implicit selection based on the agent host.

The scope is #136 and existing draft PR #172. No competing PR, new claim or
Project mutation belongs to this restart. Setup/shaping writes, other backend
implementations and delegation migration remain outside this GitHub slice.
Shared contract changes must preserve their operation coverage. See
[research.md](research.md) for the evidence and [design.md](design.md) for the
specific unresolved prerequisite. This proposal does not claim implementation
readiness or live support.
