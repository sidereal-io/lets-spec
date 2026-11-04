---
id: adr-015
date: 2026-11-04
status: accepted
title: 'ADR-015: Built-in adapters use configurable provider definitions'
description: One architecture for delegation and backlogs, with execution in lets and supported mappings and options in configuration
---

# ADR-015: Built-in adapters use configurable provider definitions

## Context

Delegation already calls adapters inside `lets`. The backlog contract instead
specified separately installed executables, with a JSON protocol, process
management and independent releases. Maintaining both models would give one
project two answers to who owns execution, configuration and recovery.

Backlog providers differ in their fields, status values, identifiers and tools.
Users need to configure those differences without rewriting the shared
workflow. That need does not require configurable operation implementations.
An agent executing provider recipes would create another implementation of
validation, deadlines and uncertain-write recovery beside the code.

## Decision

`lets` ships the adapter code for both delegation and backlogs. It executes
operations through internal interfaces. Configuration supplies supported
provider definitions: mappings and options understood by that shipped code.
It cannot supply arbitrary operation recipes, scripts, executable adapters or
loaded plugins. Adding a provider operation implementation requires a change
to `lets` and a release.

The shared glossary defines Adapter, Resolver, Backend and Extension. A resolver
is a delegation adapter; an extension does not imply independent installation.
`lets` owns workflow policy and operation execution, validation, deadlines and
recovery. Provider adapters translate operations and data. The backend is the
system or tool they use. The code host retains branches, pull requests and
merge evidence.

This supersedes [ADR-014](ADR-014-backlog-adapters-use-an-executable-boundary.md).
The following sections reconcile the existing delegation decisions and define
the common rules for the migration.

## Consequences

- Users install one adapter implementation with `lets`. Supported field and
  status mappings can change without duplicating provider operations.
- Delegation and backlog tests can substitute adapters directly and exercise
  shared behavior without an external adapter protocol.
- New provider code and dependencies must fit the `lets` package and release
  process. Independent authors contribute integrations to that release rather
  than install arbitrary adapter implementations.
- Configuration needs a supported schema and validation. A definition cannot
  express a new capability just because its backend has a command for it.
- In-process execution removes an adapter process boundary. Maintainers must
  enforce deadlines and recovery in code rather than rely on killing an
  external adapter. Neither model supplies a credential sandbox.

## Alternatives considered

### Independently installed executable adapters

These allow separate languages and releases, but retain a public wire protocol,
process supervision, installation paths and compatibility work for backlogs
alone. We choose one shipped execution model across both capabilities instead.

### Dynamically loaded plugins

These allow independent releases without a subprocess protocol, but introduce
loading, discovery and runtime compatibility rules while executing outside
code inside `lets`. The selected model keeps executable behavior in the release.

### Agent-executed recipes with shared code helpers

Provider definitions could describe commands and let the agent perform them,
while code supplies some checks. This hybrid makes correct execution and
recovery depend on both prose interpretation and code. It duplicates operation
semantics and cannot give one code-owned deadline and recovery path. Provider
definitions therefore remain data; the agent invokes the shared workflow.
