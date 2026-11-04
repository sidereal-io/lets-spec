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
