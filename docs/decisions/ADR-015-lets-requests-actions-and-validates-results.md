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
The file is renamed to match the corrected decision; the earlier name remains
in Git history.

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

## Configuration, definitions and discovery

Only lets reads and validates lets configuration, then supplies the selected,
validated definition and scoped action inputs to the agent. Definitions and
backend output are integration data, not authority to override core policy.
Backend tools retain their own login configuration.

| Scope | Authoritative home | Contents |
|---|---|---|
| User and machine | `$XDG_CONFIG_HOME/lets/config.yaml`, otherwise `~/.config/lets/config.yaml` | Explicit delegation resolver chain and command-shaped settings; machine-local tool availability, endpoint/connection options and private paths for delegation and backlog tools. |
| Repository | `lets.backlog` in `openspec/config.yaml` | One backlog provider/definition selection, repository/backlog context, field/status mappings and explicit local storage/tracking policy. |
| Provider definition | Shipped catalog or explicitly configured custom definition source | Supported-operation tool usage, input/result mappings, prerequisite/tool versions, capability declarations, limits and evidence requirements compatible with core policy. |

Machine-local backlog options belong in the existing user file under its backlog
command group. They cannot override repository provider/backlog selection,
mappings or storage/tracking policy. Known misplaced selection keys are errors,
not ignored settings or fallback to GitHub. Credentials stay in backend login
tools, private credential stores or environment variables, never committed
configuration/definitions. Private recovery journals are runtime data, not config.
This defines ownership; exact new machine option keys are a runtime contract to
implement and test, not existing parser behavior.

Select definitions explicitly by stable name/source and version from the shipped
catalog or configured custom sources. Custom definitions must implement only the
operations/core guarantees supported by the running release. Unknown names,
ambiguous sources, duplicate conflicting names and incompatible versions fail
with actionable errors before requesting backend mutation. Loading a custom
definition must not run install hooks, discover adapter executables on PATH or
load arbitrary code into lets. A selected backend CLI may itself resolve through
normal tool lookup; that is distinct from adapter discovery.

Keep ADR-005's explicit resolver order: ask only the configured chain, append
nothing and retain `subagent` as the no-config default. A resolver may decline
when it does not apply. Refusal and ranked-model retry remain governed by core
policy. Custom delegation definitions extend the available names without changing
that ordering rule. Backlogs select one provider, defaulting to the shipped GitHub
definition when selection is absent. An invalid explicit selection never silently
becomes a default or another provider. No matching available tool means an
explicit prerequisite failure, not permission to substitute another backend.

Definition discovery lists the shipped catalog and explicitly configured sources.
Backend discovery is a separate bounded read action: available models, linked
backlogs, field IDs, permissions and allowed transitions within configured scope.
It neither installs definitions nor authorizes new operations. Backlog discovery
may precede selection of a backlog ID; item operations require exactly one
selected backlog. Ambiguity needs explicit resolution. A capability declaration
cannot upgrade a best-effort primitive to atomic support or make incomplete
pagination/blocker evidence complete.

### Validation and compatibility

The release owns supported operations, request/result validators and compatible
definition schemas. Definition authors own tool usage and mappings; users own
selected sources and configured values. Shipped and custom definitions use the
same validation and conformance rules. No provider-specific workflow policy or
second implementation of operations belongs in the definition.

Use an explicit provider-definition schema version, initially 1 for this target,
and declare supported lets operation-contract versions and backend API/tool
versions. This is distinct from the existing user-file version (currently 3),
repository `lets.backlog.version` (initial target version 1) and OpenSpec's
workflow `schema:` key. Missing/unsupported definition or explicit repository
versions require an actionable migration error before mutation; absent backlog
selection uses validated release defaults. Breaking changes to an owning format
increment that format's version and document migration. Do not silently interpret
a newer definition under older semantics.

Provider-definition objects for delegation do not exist in the current runtime.
The resolver chain and user guidance are not such objects. The migration must
implement and document their schema, source registration and consumed options;
this ADR does not claim that adding keys to today's config enables the target.
Repository backlog versioning likewise remains implementation work in #180.

Validate consumed definition structure, required tool/context inputs, operation
names, result/evidence mappings, option types, cardinality, ambiguous field/value
mappings, allowed transitions, capabilities and limits. Validate local facts
before requesting backend actions; backend-dependent facts need bounded read
actions and independently checkable evidence for required guarantees before
mutation. Reject unknown options within consumed objects. Preserve ADR-011's
tolerance for unrelated future settings, including unrelated delegation keys;
known misplaced selections and obsolete executable settings remain errors.

Reject obsolete adapter executable/path settings with the file/key and supported
migration action; do not run them, interpret their shell syntax or silently ignore
them. Migrating an existing integration means extracting its backend translation
into a provider definition and using the shared request/result path, not keeping
the old executor behind a new name. Backend CLI dependencies may remain.
Invalid local configuration has no mutation effects. Missing tools, login or
permissions name the selected integration and remedy without fallback. Errors
must not expose credentials or private journal contents.

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

## Packaging, release evidence and migration

Lets ships core policy, request/result and evidence validators, sequencing and
private local recovery plus the supported provider-definition catalog. Custom
definitions may be configured independently; they do not require an adapter
executable or a runtime plugin loader. Backend CLIs, MCP servers and services
remain external tool dependencies with declared availability/version/authentication
requirements. Installing a tool neither registers an adapter nor establishes
provider support. Retiring standalone adapters changes user setup and authoring;
provide actionable configuration migration rather than silently running or
ignoring the old executable settings.

Runtime packages include production-consumed code and shipped definitions. Keep
unused conformance source, fixtures and contract documentation out of runtime
releases; keep offline conformance runnable in the repository. One release
contains one execution path for an integration; do not ship built-in execution
and a recipe implementation in parallel as two sources of provider behavior.

GitHub remains the default. #52's release requires GitHub Issues/Projects, Jira
Cloud, Linear and local Beads. Each integration needs repeatable automated tests
and real end-to-end acceptance for its declared versions/configurations before
support is claimed. Offline doubles, schema checks and a definition in a catalog
do not establish live support. Test tool translation, independently verifiable
evidence, uncertain effects and recovery, not just well-formed agent reports.

### Contract migration inventory

This chore documents the architecture; it does not change runtime behavior or
main specs. The executable kit, `openspec/specs/backlog-adapter-contract/spec.md`
and `docs/backlog-adapter-contract.md` remain migration inputs. Their behavioral
guarantees remain in force; transport-specific requirements must be replaced,
not treated as already satisfied by this decision.

| Existing requirement or surface | Required target migration | Guarantees retained |
|---|---|---|
| **Contract validation leaves production integrations unchanged**; offline executable harness | Exercise policy/action requests, simulated agent/tool submissions and independent verifier evidence; keep checks offline and credentials-free. | No production mutation from conformance; deliberate negative cases must fail. |
| **Executable boundary separates responsibilities**; stdin/stdout JSON, stderr, exit/result pairs, signals and startup | Replace adapter process transport with a versioned bounded-action/submission contract. Test malformed, mismatched, stale, replayed and missing results plus unavailable tools. | Shared policy remains in lets; backend translation stays in definitions; code host owns branches/PRs; untrusted reports cannot authorize progression. |
| That requirement's deadline, SIGKILL and byte-limit scenarios; **Protocol 1** | Replace process supervision with core request expiry/bounded waits and declared bounded tool calls/results. Test ignored cancellation, overflow, late effects and late submissions. | Timeout never proves rollback or effects none; unknown outcomes block retry/progression. A tool that cannot meet required limits is unavailable for that action. |
| **Configuration separates shared settings from authentication**; executable resolution and default | Select shipped or explicit custom definitions; implement schema/source/version checks, machine tool options and actionable rejection of obsolete executable keys. | One backlog; GitHub default; no silent selection fallback; external auth; mappings and local storage/tracking checked before mutation. |
| **Mutation errors support safe recovery**; protocol/JSON failures | Validate requests/submissions and independently check required evidence. Retain typed errors and effect certainty; test forged/unverifiable receipts and same-agent repeated observations. | No error-message inference; original mutation identity, deduplication and reconciliation; no blind repeated create or session launch. |
| **Four-provider evidence qualifies conformance claims**; profiles and evidence matrix | Distinguish policy tests, agent/tool translation tests, independent verification tests and live acceptance for each provider/configuration. | All four providers remain release requirements; offline profiles are not production integrations. |
| **Runtime releases exclude unused conformance payloads**; executable bundles | Package core validators/recovery and production definitions; remove obsolete adapter-executable bundles and declare backend-tool dependencies separately. | Offline checks remain runnable; unused kit source, fixtures and docs remain outside runtime packages. |
| Operation inventory, identity, metadata, capabilities and discovery | Carry complete behavioral scenarios through the request/result boundary, with operation-specific evidence requirements. | Scoped opaque identities, optional URLs, targeted field updates, pagination and complete blocker evidence, native/emulated/unsupported declarations and deterministic ranking. |
| Claims and recovery | Model dispatch uncertainty, partial acquisition, reconciliation and fresh independent ownership/status checks before progression; preserve private local journals. | Native state is authoritative; session-safe release, no stronger locks, best-effort stays best-effort. A journal replay is not current ownership proof. |
| References and completion | Verify the exact associated code-host PR merge independently before completion requests; test native auto-close and lost responses. | Exact merged reference/commit, merge-gated completion, idempotence and In Progress until confirmed merge. |

#180 implements the GitHub build migration after #179 and #136. It must migrate
the production caller, contract, conformance invocation and packaging and prove
its own equivalence. #137–#144 retain their provider outcomes and acceptance
obligations; #145 covers definition authoring for both capabilities. Its delegation
part requires the delegation runtime migration below, not merely #180. Until that
follow-up is shaped and its prerequisite is resolved, #145 is not ready for its
full scope. When shaping the follow-up, request a direct blocked-by link on #145;
absence of that link does not make the prerequisite resolved.

Delegation needs its own runtime migration under #174. Current built-in
`t3`/`cli`/`subagent` implementations and lookup are not the target's custom
definition registry. Provider-definition objects, bounded action submission and
independent evidence verification do not yet exist there. Existing T3 launch/
dispatch, token issuance and Git helper deadline gaps also remain. Shape that
follow-up before implementing it; #180's GitHub work neither implements delegation
nor proves project-wide compliance. No new runtime story is silently included
in this documentation correction.

Preserve the native-state/private-local-journal production design. PR #172
remains ready/unmerged under user control; do not rewrite or merge it. Its
completed native acceptance is historical evidence for its implementation;
never repeat those mutations. Fixture PR #14 was user-merged. Recording this
architecture requires no acceptance mutations. Later migrated behavior needs
separate scoped equivalence evidence before a support claim.

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
