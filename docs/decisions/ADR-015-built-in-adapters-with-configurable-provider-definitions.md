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

## Execution, deadlines and recovery

Built-in code validates operation inputs and results, enforces workflow
preconditions, and reports typed errors with effect certainty. Keep the backlog
categories invalid_request, invalid_configuration, authentication, permission,
not_found, unsupported, conflict, transient and unknown_outcome. Preserve the
existing delegation distinction between decline, refusal and an unknown outcome;
a common architecture does not require identical command result formats.
Unexpected exceptions are unknown outcomes, not classifications inferred from
words in an error message.

Every external operation has a finite code-enforced deadline. Adapter code must
propagate cancellation to backend requests and bound subprocess output and
waiting where it uses backend tools. A timeout must return control without
accepting a later result as permission to progress. A synchronous operation that
cannot be bounded cannot satisfy this contract by merely racing a timer around
it. Process termination and request cancellation do not prove that the backend
rolled back a write or that detached work stopped.

Rejecting input before execution can prove effects `none`. For mutations,
partial progress is `partial` and uncertainty is `unknown`; a deadline, lost
response or unexpected error after dispatch must not promise `none`. Reconcile
before retry or progression using the original operation identity and scope.
Retry bounded read failures or mutations with proven no effects according to
code-owned policy. Never repeat an uncertain creation simply because the caller
stopped waiting. If available evidence cannot resolve it safely, stop for manual
reconciliation rather than guess, change provider or remove someone else's work.
Delegation likewise must expose any known session handle when execution may
have started; it must not start another session merely because waiting failed.

Changing packaging does not change the settled state model. Native ownership
and status remain authoritative; a private local journal records recovery
provenance and uncertain operations, not a replacement backlog or proof of
current ownership. Keep journals private and outside committed project state.
Retain scoped mutation identity, deduplication, current ownership verification,
session-safe release and partial-claim recovery. Best-effort claims remain
best-effort; sequential assignment and status updates do not become atomic
because they now run inside `lets`.

The code host supplies exact associated pull request merge evidence, including
the merged reference and merge commit. A ready PR, archive, issue text or journal
entry cannot substitute for confirmed merge. Completion remains idempotent,
requires merge confirmation even after native closing automation, and leaves
work In Progress until that confirmation. This decision does not reopen claim
or journal storage design.

## Packaging and release evidence

Adapter implementations, supported-definition validation and operation rules
ship as part of `lets`. There are no separately installed adapter packages,
PATH-based adapter lookup or runtime plugin loaders. This does not forbid an
adapter from calling a backend CLI or service. A backend tool such as `gh` or
`bd` remains a separately available dependency where that integration uses it;
it is not an independently installed `lets` adapter. Built-in code constructs
and validates those calls, checks supported backend versions and availability,
and applies the same deadlines and recovery rules. Installing a backend tool
does not register an adapter or make an unsupported provider supported.

Runtime packages include the code their production commands consume. Keep
unused conformance source, test fixtures and contract documentation outside
runtime releases; the repository must retain runnable offline conformance.
Internal calls remove adapter wire-protocol packaging, not backend dependency
constraints, authentication requirements or release evidence.

GitHub remains the default. The multi-backlog release still requires GitHub
Issues/Projects, Jira Cloud, Linear and local Beads. Every adapter needs
repeatable automated checks and a real end-to-end test of its supported version
and configuration before release support is claimed. Offline doubles test shared
behavior and deliberately broken cases; they establish no live support. Backend
boundary tests and scoped live acceptance must prove that migrated behavior
still meets those obligations. Neither this decision nor a packaging change
waives them.

## Migration inventory

This record is the architecture prerequisite, not a runtime migration. The
current backlog kit, contract document and main specs still describe executable
behavior. They remain unchanged here so documentation does not claim that the
new runtime already exists. The follow-up migration (#180) must replace the
mechanism and prove equivalent outcomes, rather than delete its guarantees.

Use the following inventory when migrating
`openspec/specs/backlog-adapter-contract/spec.md`,
`docs/backlog-adapter-contract.md`, the conformance kit and the production caller:

| Current contract requirement or surface | Required migration | Guarantees to retain |
|---|---|---|
| **Contract validation leaves production integrations unchanged**; offline executable harness | Run the shared suite through internal adapter doubles; use backend-boundary tests for actual translation and fault handling. | Credential-free, network-free offline checks, no production mutation from conformance, deliberate negative cases. |
| **Executable boundary separates responsibilities**; stdin/stdout JSON, stderr, process exit/result pairs, signals and startup | Replace the adapter transport with internal request/result validation and typed errors. Remove wire-only serialization and exit-pair tests; test malformed internal results, thrown errors and backend failures instead. | Workflow policy in the shared caller, provider translation in adapters, code-host responsibility for branches and PRs, explicit result validation and unknown-outcome handling. |
| The same requirement's timeout, SIGKILL and combined byte-limit scenarios; contract **Protocol 1** | Enforce finite deadlines and cancellation in code; retain bounded output for backend subprocesses and bounded response handling for backend APIs. Test timeouts, ignored cancellation, overflow and late results at those boundaries. | Returning from a timeout never implies rollback; uncertain effects block retry/progression. A valid result followed by abnormal backend termination cannot silently authorize success. |
| **Configuration separates shared settings from authentication**; executable selection/resolution, repository-relative paths, PATH lookup and `lets-backlog-github` default | Select a shipped adapter by name, validate supported definitions, retain GitHub as the default provider, and reject obsolete executable settings with actionable migration errors. | One selected backlog, scoped provider context, mapping checks before mutation, external authentication, explicit local storage/tracking policy and no silent fallback. |
| **Mutation errors support safe recovery**; unsupported request protocol and malformed JSON scenarios | Replace external protocol negotiation with release-owned internal contracts and supported definition/backend versions. Test unsupported definitions/versions, invalid operation inputs and unexpected internal exceptions. | Typed categories and effect certainty, no message-word classification, deduplication and reconciliation for every mutation, no unsafe repeated create. |
| **Four-provider evidence qualifies conformance claims**; shared executable scenarios and evidence matrix | Move the behavioral lifecycle to internal invocation without reducing the provider variation cases; revise the matrix to distinguish internal tests, backend-boundary tests and live evidence. | GitHub, Jira Cloud, Linear and local Beads remain required. Offline simulations never establish live support. |
| **Runtime releases exclude unused conformance payloads**; standalone adapter bundles and installation | Remove adapter-executable packaging and include only production-consumed built-in code; retain separate backend-tool dependency declarations and version checks. | Repository conformance remains runnable; unused kit source, fixtures and contract docs stay outside runtime releases. |
| Operation inventory, identity, metadata, capabilities, claims, discovery and completion sections | Carry their existing behavioral scenarios through the invocation change; update executable wording where necessary. | Scoped opaque identities and optional URLs, complete pagination/blocker evidence, targeted updates, native/emulated/unsupported declarations, ranking, fresh ownership reads, session-safe release, exact merge evidence and idempotent completion. |

The older requirement names above identify migration targets, not exceptions to
this decision. In particular, protocol version errors disappear only with the
external adapter protocol; unsupported configuration/backend versions still
fail explicitly. The default five-second and 1 MiB values in the offline
process harness are not a substitute for documented production limits and
boundary tests in the migrated caller.

Preserve the separate native-state/private-local-journal design in the
production GitHub path. PR #172 remains ready and unmerged under user control;
this change does not rewrite or merge it, and its completed acceptance mutations
must not be repeated. Its evidence covers its existing implementation. The
migrated path needs its own scoped equivalence evidence before claiming support.
No fixture acceptance mutation is part of recording this decision.

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
