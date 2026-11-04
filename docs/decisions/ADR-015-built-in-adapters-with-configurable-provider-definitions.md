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

## Configuration, selection and discovery

Only `lets` reads and validates its configuration. It passes validated inputs
to built-in adapters; adapters do not find alternate configuration files.
There are two scopes, each with one owner:

| Scope | Authoritative location | Contents |
|---|---|---|
| User and machine | `$XDG_CONFIG_HOME/lets/config.yaml`, otherwise `~/.config/lets/config.yaml` | Delegation resolver chain and command-shaped settings, including guidance and supported machine options |
| Repository | `lets.backlog` in `openspec/config.yaml` | One backlog provider and selection, repository/provider context, supported mappings and options, and local storage/tracking policy where needed |

ADR-011's one user file remains the home for machine settings. It does not move
repository backlog data into that file. A duplicate setting in the wrong scope
is not an override; report it as invalid configuration when it belongs to the
consumed configuration surface. Credentials stay in provider login tools,
private credential storage or the environment, never committed definitions.
Private recovery journals are runtime data, not provider configuration.

ADR-005's explicit resolver order and ADR-010's built-in names remain. Ask only
the listed resolver chain, in order, with `subagent` as the no-config default;
append no resolver and discover no adapter on PATH. A resolver can decline when
it does not apply. A refusal from a selected resolver does not select a different
resolver; the existing ranked-model policy remains in code. Backlogs select one
built-in provider by name, defaulting to GitHub when absent. Invalid explicit
selection never becomes the default or another provider.

Selection and discovery have different jobs. The shipped registry establishes
which adapter names exist. Configuration selects from that registry. Selected
adapter code can discover backend capabilities, available models, linked
backlogs, field IDs and allowed transitions within its configured scope.
Discovery does not install adapters or authorize new behavior. Backlog discovery
can run before a backlog ID is chosen; item operations require exactly one
selected backlog. Ambiguous or incomplete discovery requires explicit resolution,
not a guessed selection. A definition cannot upgrade unsupported behavior to
native or atomic support.

### Supported definitions and compatibility

The `lets` release owns the schema, defaults, supported provider options and
validation code for definitions. Users own the values in their configured
scopes. Definitions contain data such as field/value mappings and documented
provider options, not templated command lines or executable operation bodies.
Configurable data may vary only within the behavior supported by that release.

Use the owning configuration format's version rules. Preserve the existing
user-file version contract (currently version 3); this ADR alone changes no
parser or version. A breaking definition-format change requires a documented
versioned migration, and an unsupported version must be rejected before use.
Publish supported schema and backend API/tool version constraints with the
release. An internal interface is coupled to the `lets` release, not a public
independently versioned adapter wire protocol. Concrete migration syntax belongs
to the implementation and its tests, not a second configuration file.

Validate consumed definitions before operations: provider names, option types,
required context, mapping completeness, field cardinality and ambiguity, allowed
values and transitions, and required capabilities. Validate local structure
before backend calls; use scoped read-only backend checks for facts that cannot
be checked locally, before mutation. Reject unknown options within a consumed
provider definition so spelling mistakes cannot silently alter behavior. Keep
ADR-011's tolerance for unrelated settings outside that consumed surface; do not
reinterpret an ignored future key as executable instructions.

Reject obsolete adapter executable/path settings with an error naming the file,
key, unsupported value and supported built-in replacement or migration action.
Do not run the executable, interpret shell syntax, silently ignore the setting,
or fall back to another adapter. Invalid configuration and unsupported versions
have no mutation effects. Missing backend tools, login or permissions name the
selected provider and the remedy; they do not trigger provider fallback. Sanitize
errors so neither credentials nor private journal content appears in diagnostics.

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
