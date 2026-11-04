---
id: adr-015
date: 2026-11-04
status: accepted
title: 'ADR-015: lets requests actions and validates agent-submitted results'
description: One execution hybrid for delegation and backlogs, with open provider definitions and code-owned policy, sequencing, recovery and validation
---

# ADR-015: lets requests actions and validates agent-submitted results

## Context and correction history

Delegation currently executes built-in adapters. The backlog contract describes
separately installed executables. Users need one architecture across both, with
integrations that independent authors can add without waiting for a lets release.

The first version of this record selected built-in provider execution with
configurable field/status mappings and rejected agent-executed recipes. That
was the agreement recorded in #174/#179 and PR #181 at a912eec. The latest user
clarification supersedes that selection with the execution hybrid below. The
two choices are not equivalent. Earlier reviews approved the earlier choice;
they do not approve this correction. Git history preserves the original record.
The filename is retained so existing links continue to resolve.

The shared glossary's original code-only Adapter definition came from published
checkpoint ae72942bb6546d3694a339196ad3083cee6b3a05, imported as
1b791a0597d538a1ea15f0f76d2e73e5bbd79e01. The user explicitly approved replacing
that definition across delegation and backlogs. The glossary-only correction
is d695d02fa3fa135d3b3c322eed2cf7f7868eb3de. #179 / PR #181 remains the sole
owner; the original checkpoint is provenance, not the current definition.

## Decision

Use the execution hybrid project-wide:

1. `lets` checks policy and prerequisites and requests a bounded action.
2. The agent calls available backend CLI/MCP tools using the selected provider
   definition, then submits a structured result with attributed evidence.
3. `lets` validates the submission, reconciles effects where needed and decides
   whether the workflow may progress.

`lets` owns supported operations, their semantics, policy, sequencing, private
local recovery and validation. Provider definitions describe backend tool usage,
input/output translation and field/status mappings. They do not define readiness,
ranking, retry permission, completion rules or new guarantees. The agent executes
the requested action; it cannot authorize itself to advance the workflow.
The code host continues to own branches, pull requests and merge evidence.

Ship definitions and permit explicitly selected third-party/custom definitions
that implement existing supported operations without a lets release or a
separately packaged adapter executable. A new core operation or guarantee
requires core changes. Use the same request/result path for shipped and custom
integrations. Do not maintain a built-in provider executor beside an agent recipe
for the same integration, or copy provider commands into every workflow skill.

Adapter, Resolver, Backend and Extension use the shared glossary. An adapter is
an integration, not necessarily code shipped inside lets. Its provider definition
is the agent-facing description of tool usage and mappings; neither the definition
alone nor its packaging establishes backend support or proof of remote effects.

This supersedes [ADR-014](ADR-014-backlog-adapters-use-an-executable-boundary.md).
ADR-010's built-in execution and closed registry become historical implementation
choices, replaced by this target for delegation as well as backlogs. ADR-005's
explicit resolver order, no implicit fallback and no adapter lookup on PATH
remain. ADR-011's user configuration ownership remains, with repository backlog
selection separately scoped below. Existing implementations and runtime specs
are migration inputs, not evidence that this target is already implemented.

## Bounded actions, submissions and evidence

These are target contract rules, not current runtime compliance claims. Before
requesting an action, lets validates the definition, operation, inputs, actor,
selected scope and prerequisites. It records the operation identity and intended
effects in its private local journal before handing control to the agent.

Each request binds a unique action/attempt identity to the workflow step,
operation and exact input, provider/definition version, repository/backlog or
harness scope, actor/session, required capabilities, finite deadline and allowed
effects. Mutation identities retain their original scope and input across
reconciliation. A request authorizes only that action, not later workflow steps,
additional writes, tool substitution that changes scope, or retries. Read-only
requests permit no writes. Multi-step mutations need explicit bounded steps and
partial-effect recovery; an agent must not turn one request into an unbounded
provider workflow.

The agent checks tool availability and uses the definition's tool usage and
mappings within those limits. It submits the matching action identity, normalized
result or typed error, effect certainty, timing/dispatch information, any remote
identities/session handles, and evidence provenance. Evidence records its source,
collection time, scope, request correlation and relevant backend revision or
receipt where available. Redact secrets; do not publish private journal contents.
Statements supplied by the agent must remain distinguishable from independently
verified tool/backend evidence.

Lets checks schema and operation-specific invariants, identity/scope/input
correlation, definition compatibility, deadline, expected state and evidence
requirements before accepting a submission. Reject mismatched, malformed,
replayed, stale and late submissions as authorization to progress. Preserve any
useful effect evidence for reconciliation instead of treating rejection as proof
that no action occurred. Missing results never mean success or effects none.

### What can establish remote state

| Evidence | What lets can conclude |
|---|---|
| Locally validated request, stored action identity and journal | What was requested and previously recorded; not current remote state or proof that dispatch did not happen. |
| Schema-valid agent report, copied output, screenshot or a second read reported by the same agent | Attributed observations that can aid reconciliation; not independent proof of writes, absence, ownership or merge. |
| Backend receipt or observation verifiable through an independent trusted channel | Only the facts its provenance, scope, revision and freshness actually establish. An unverifiable receipt copied into a report stays attributed evidence. |
| Fresh independent ownership/status read or exact code-host merge observation | The observed scoped state at that time; a snapshot is not an exclusive lock or a guarantee against later races. |

Lets may independently check local structure, mappings against validated metadata,
request correlation, deadlines and sequencing. Remote facts require evidence it
can independently verify through a trusted backend/tool channel or verifiable
backend attestation; parsing the agent's text is not such a channel. The runtime
migration must identify each verification channel and its trust/freshness limits.
An independent read can use the same backend, but must not rely solely on the
executing agent's account of that read. This does not require a second provider
implementation: verification checks the required facts through the common
operation/evidence contract.

If a required remote-state guarantee cannot be independently established, lets
blocks automatic retry and progression pending reconciliation or manual
resolution. Manual resolution must establish and record the missing facts and
provenance under the existing guarantee; an approval or edited report alone does
not waive evidence requirements. Definitions cannot self-certify trust, atomicity,
complete blocker enumeration or exact merge evidence. Where the available tools
cannot establish the required guarantee, report the limitation and stop rather
than silently lower it.

### Deadlines, errors and reconciliation

Lets enforces finite waits and request expiry and rejects expired results as
permission to progress. The agent must use bounded CLI/MCP calls and available
cancellation, with declared output/result size limits. If a tool cannot bound the
requested action, that capability is unavailable for this contract; do not claim
that racing a timer stops its work. Lets cannot force a tool it does not control
to stop. Expiry, cancellation and process termination do not prove rollback or
that detached work stopped. Session creation and waiting are bounded actions;
a valid handoff may return a handle without bounding the entire session lifetime.

Keep backlog error categories invalid_request, invalid_configuration,
authentication, permission, not_found, unsupported, conflict, transient and
unknown_outcome, and effects none, partial or unknown. Preserve delegation's
decline/refusal/unknown distinction; common architecture need not impose identical
command output. Derive classifications from validated facts, never category words
in an exception message. A post-dispatch timeout, lost response, unexpected failure
or expired action has unknown effects unless independently resolved. Local
rejection before an action is issued can establish none; after issuance, a claim
of no dispatch needs evidence, not merely an agent assertion.

Partial or unknown effects block retry and progression. Reconcile the original
operation identity and scope against native state and available deduplication
provenance before requesting another action. Retry reads or mutations proven to
have no effects only under bounded core policy. Never recreate uncertain items
or launch another session merely because a response or wait failed. Expose known
session handles and partial effects. Late results may aid reconciliation but do
not reactivate an expired request. If absence, ownership or deduplication cannot
be established, require manual reconciliation rather than guess or switch provider.

Native ownership/status remain authoritative. Private local journals record
recovery provenance and uncertainty; they are neither a replacement backlog nor
proof of current ownership. Keep them private and outside committed project state.
Retain scoped mutation identity, fresh ownership verification before work,
session-safe release and partial-claim recovery. Best-effort claims remain
best-effort; assignment followed by status writes is not atomic and supplies no
new lock. Never release or repair another session's ownership.

Completion requires independently confirmed merge of the exact associated PR,
including merged reference and merge commit, even after native closing automation.
Ready PRs, archives, issue text, agent reports and journal entries do not substitute
for that evidence. Completion remains idempotent; archive/readiness leave work
In Progress until confirmed merge. This decision does not reopen the settled
native-state/private-local-journal design.

## Consequences

- Independent authors can integrate another backend for existing operations
  through a provider definition without changing or releasing lets.
- Shared policy, sequencing, recovery and validators remain in code, while one
  provider definition describes its backend translation for every workflow.
- Execution depends on agent tool availability and correct action interpretation.
  Schema validation alone cannot establish remote truth. Missing independent
  evidence can stop a workflow for manual reconciliation.
- Maintainers must version definitions and the request/result contract, validate
  evidence provenance, reject stale results and retain private recovery state.
- The design adds no credential sandbox or stronger backend locking primitive.
  Available tools may retain credentials and permissions outside lets.

## Alternatives considered

### Built-in provider execution with configurable mappings

This was the earlier selection. It offers direct calls and code-controlled
execution, but new providers require core changes/releases and definitions cannot
describe new backend tool usage. It does not meet the clarified openness goal.
It is replaced rather than retained as a second implementation of each provider.

### Independently installed executable adapters

They allow independent languages/releases but require adapter installation,
process supervision and a public executable protocol beside agent tool use.
Provider definitions preserve independent integration authoring without requiring
another adapter executable. Existing executable users must migrate selection and
invocation; retiring the transport must not discard behavioral guarantees.
Backend CLIs remain valid tool dependencies, distinct from adapter executables.

### Dynamically loaded plugins

They permit independent releases but require a loader and runtime compatibility
for outside code inside lets. Explicit provider definitions and the agent's
available tools meet the extension goal without that loading boundary.

### Unrestricted recipes or direct provider commands in each skill

These duplicate policy, sequencing and recovery and allow prose to authorize
unsupported behavior. The selected hybrid keeps those decisions in lets and
bounds each requested action; definitions only describe backend translation.
