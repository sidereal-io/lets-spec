---
id: adr-022
date: 2026-11-07
status: withdrawn
title: 'ADR-022: Protected capture runs under a separate account'
description: Architecture decision record for a generic independently administered tool capture service
---

# ADR-022: Protected capture runs under a separate account

## Withdrawal, 2026-11-07

The user asked to step back from this proposal and reopen the capture design.
The separate-account service was introduced by the agent during PR #172. It
was never accepted as a project decision. It does not govern implementation
or require installation. The accepted request/result architecture remains
unchanged; no replacement capture implementation has been selected.

The proposal below is retained as history. Existing service code and deployment
examples are unaccepted prototype work. Do not install them or treat their
passing offline tests as approval of this approach.

## Context

The accepted [request/result architecture](ADR-015-lets-requests-actions-and-validates-results.md)
requires Lets to retrieve the actual tool request and response independently.
The agent initiates execution and submits a reference. Its own output file,
report or signing key cannot prove backend ownership or merge. The available
harness has no established protected capture API. A capture boundary is needed
before the migrated GitHub workflow can establish its required remote facts.

## Withdrawn proposal

Provide one generic Linux capture runner under a separately administered,
unprivileged OS account. The agent connects to its protected Unix socket. The
runner pins the tool executable digest, argv and authentication context from
protected administrator setup. It executes bounded requests without a shell,
records dispatch reservations durably, and retains immutable original receipts.
Lets independently retrieves those receipts and checks their correlation with
its issued actions. Provider definitions cannot register trusted tools.

The runner performs no backlog policy or provider verification calls. The
selected definition remains the single translation into tool input and captured
output. Lets owns native lifecycle rules, sequencing and private recovery.

An operator must review and approve installation of the service, credentials
and client trust file. The agent must be unable to edit the service's files,
impersonate its account or control its processes. Offline socket fixtures do
not establish that deployment. Keep this record proposed until that trust
boundary and fresh scoped backend evidence are qualified.

## Consequences

- The original captured request/result can be checked across CLI exits without
  trusting agent-authored reports or replaying a backend write.
- One capture channel serves shipped and custom definition data. Backend CLI
  dependencies remain separate from Lets' policy implementation.
- Deployment now requires a dedicated account, protected executable and
  credentials, socket permissions, durable service state and operator ownership.
- Qualification initially targets Linux. Same-account or agent-administrable
  deployments cannot claim independent evidence.
- A crash after dispatch can leave a permanently unknown receipt. Native-state
  reconciliation must use separately identified reads while retaining the
  original write reservation. Deleting service state is not recovery.
- Capture attests tool observations. It does not add atomic GitHub claims,
  distinguish remote sessions sharing an actor, or prevent later native races.

## Alternatives considered

### Use a protected harness capture API

This would avoid another service and could cover MCP tools as well as CLIs.
No such API has been established in this environment. A future implementation
may replace this transport after proving the same evidence and recovery rules.

### Sign captures in the agent process

This is easier to install, but an agent-accessible key and output remain
agent-controlled. They cannot establish the independent provenance required
for claim ownership or exact PR merge evidence.

### Let Lets execute separate GitHub verification reads

This can observe current native state, but duplicates provider execution and
bypasses the selected definition/capture path. It would reverse the accepted
execution boundary rather than implement it.
