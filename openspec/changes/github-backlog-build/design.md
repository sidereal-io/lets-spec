## Context

The branch contains an executable GitHub implementation and private native
claim recovery. Main now has separate workflow steps and an accepted
request/result architecture. The shared glossary defines Adapter by its
integration role, rather than its packaging. Existing executable tests and
live records are migration inputs, not evidence for the new boundary.

## Goals / Non-Goals

**Goals:** one GitHub execution path, extensible provider definitions,
explicit bounded actions, independently verified evidence and preservation
of lifecycle guarantees.

**Non-Goals:** new providers, setup/shaping writes, delegation migration,
stronger native locks or automatic merges.

## Test Seams

- **Primary test seam:** the CLI action-request/submission lifecycle, driven
  with offline agent/tool doubles and independently retrieved capture records.
- **Existing seams reused:** selection, native ownership/recovery, identity,
  exact merge tests, workflow interface checks and isolated release checks.
- **Live acceptance:** a new scoped run on the agreed test repository and
  Project through the migrated path, after the capture prerequisite passes.
  Do not reuse or repeat historical acceptance mutations.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** external writes, configuration, durable action and
  identity formats, evidence trust, recovery, workflow steps and releases.

## Decisions

### 1. Replace execution rather than wrapping the old adapter

Lets issues a bounded action only after validating policy, prerequisites,
selected definition and scoped inputs. The agent executes that action with
available backend CLI/MCP tools and submits an attributed result. Lets
validates the submission before it advances the workflow. Remove production
adapter spawning and provider-specific verification calls. Do not keep a
built-in executor beside a recipe for the same operation.

Action requests bind an action/attempt ID, operation, immutable input,
provider/definition version, repository/backlog, actor/session, required
capabilities, finite expiry and byte limits. Mutations also retain the
original mutation identity. Multi-write operations request explicit bounded
steps and checkpoint recovery between them; an operation description must
not authorize an unbounded provider workflow.

### 2. Treat definitions as versioned integration data

Use provider-definition schema version 1 and declare supported operation
contract and backend tool versions. The release catalog and explicitly
selected custom sources use the same validation path. Definitions describe
tool usage and input/output mappings for core-supported operations. They
cannot define policy, retry permission, trust, atomicity or new guarantees.
Loading a definition executes no code, install hook or adapter discovery.

Repository `lets.backlog.version: 1` owns provider/definition selection,
backlog context, field/status mappings and local storage/tracking policy.
User `backlog` settings own machine tool/channel connection options and
private paths. Reject misplaced selection, obsolete executable/path keys,
unknown consumed options and incompatible versions before dispatch. Missing
selection uses the validated shipped GitHub definition; invalid explicit
selection never falls back. Validate mapping types, cardinality and allowed
values against captured backend metadata before mutations.

### 3. Retrieve capture independently of the submitted report

The agent submits a capture reference, not the authoritative capture body.
Lets retrieves the actual request/response and execution outcome through a
trusted harness/tool-host or generic capture service outside the agent's
editable report. Runtime setup establishes channel and tool trust; a
provider definition or an agent-writable file cannot self-certify them.

Check action correlation, actual tool/server identity and arguments, backend
scope, authenticated context, collection time, complete response and outcome.
Use one generic channel for shipped and custom definitions. Check mapped
facts against the captured response; a schema-valid normalized result alone
cannot establish remote state. No separate provider-specific verification
executor is a fallback. Reject forged, editable, mismatched, stale,
replayed, incomplete and unavailable capture.

**Blocking prerequisite:** no concrete trusted channel is established yet.
Resolve its interface, isolation and deployment before implementing dependent
production integration or claiming the plan is ready. If none exists, design
and demonstrate a generic capture service outside the agent's write access.
Resolve who administers capture, the independently retrievable interface,
trusted executable/server identity, authenticated backend context, immutable
record retention and retrieval authorization. Specify finite retrieval and
output bounds, pagination/completeness and unavailable-record handling. A
protected signing key alone does not prove actual tool identity or context.
A service running with agent-editable state or an agent-accessible signing
key is not independent capture. A test double establishes validation behavior
only; it cannot qualify the live trust boundary.

### 4. Preserve sequencing and conservative recovery

Persist issued action identity and intended effects in private recovery state
before returning the action. Missing results after issuance, expiry, tool
failure or lost responses retain unknown effects unless capture proves more.
Late results can inform reconciliation but never reactivate an expired action.
Do not repeat uncertain writes or create a new session to escape uncertainty.

Keep the existing private original continuation handle and immutable change
identity separate. Preserve native assignees and Status with actor-level
best-effort limits. Fresh independently captured sole ownership and In Progress
are required before work or resume. A local journal is recovery provenance,
not remote ownership proof. Release verifies current ownership between steps
and must not clear a competing actor. Assignment alone cannot authorize work.

Required facts unavailable means an explicit pause with the action, effects,
missing evidence and reconciliation choices. User approval alone cannot
replace remote facts or lower the guarantee.

### 5. Serialize durable action transitions across CLI calls

Persist an outstanding-action reservation per original workflow/session and
mutation scope before returning an issued action. Under the existing private
scope lock, compare its generation and expected state, then atomically replace
the journal. Process exit releases the lock, not the reservation. A second
caller with the same continuation receives the existing outstanding action;
it cannot mint another attempt, change its input or accept the result twice.

Use explicit prepared, issued, awaiting-evidence, accepted, expired and
reconciling states. Acceptance requires matching generation/action identity
and the current expected state under that same lock. Persist the validated
capture reference and next checkpoint before acknowledging acceptance. A
crash after remote dispatch leaves an outstanding action to reconcile. A
crash after acceptance replays the accepted local transition, not its remote
mutation. Expiry never frees an uncertain mutation for a fresh attempt.
Tests must interleave two callers and inject both crash windows.

### 6. Keep completion bound to the exact associated PR

Independently captured native closing links bind the recorded item to the
exact repository-qualified PR. Preserve existing PR text when adding its
closing reference. Capture must establish that exact PR merged and its
nonempty merge commit before a Done action, even after native auto-close.
Completion remains idempotent. Archive and readiness leave In Progress.

### 7. Integrate with main's workflow and migrate the contract

Lets-go owns finding, packet checks, routing, claims and glossary handoff.
Lets-plan accepts explicit identity/continuation, binds once the directory
exists, and runs planning. Lets-build resumes the recorded claim and only
implements. Lets-review-build owns verification/archive/readiness. Pass the
private continuation input deliberately through step prompts. An explicit
post-merge continuation completes archived work without selecting new work.
An explicit post-merge completion request is dispatched by lets-go before
its ordinary merged/closed-PR early stop or new-work selection, including on
the default branch. Require the deliberately supplied private continuation
input, matching repository/actor, archived change path and exact associated
PR URL. Run the completion request/submission lifecycle only; an unmerged PR,
missing capture or identity mismatch returns without selecting or claiming work.
Never derive authority from title searches, assignment or scanning storage.
Step prompts pass the deliberately authorized private input's exact path,
repository, actor and current active/archive change path; they never embed
raw handles in reports or committed artifacts. The child validates that input
against recorded identity. If the original private input is inaccessible in
its environment, stop for explicit continuation rather than inventing a new
session or reading shared storage to discover one.

Replace executable transport requirements and their failure scenarios with
action/submission and capture scenarios. Preserve unrelated identity,
metadata, capability, complete pagination, ranking and recovery cases. Keep
source conformance offline. Ship only consumed core code and definitions;
remove the adapter executable bundle, PATH wrappers and obsolete install docs.

## Risks / Trade-offs

- [Capture channel missing] → block dependent integration and support claims;
  request an actual trusted interface, or design and deploy one explicitly.
- [Capture proves a response, not a lock] → validate freshness and completeness;
  retain native best-effort limitations and reread at required checkpoints.
- [Definition changes during recovery] → pin identity/version/content in each
  issued action; reconcile the original input rather than reinterpret it.
- [Timeout after remote writes] → retain unknown effects and the original
  mutation identity; bound waits without claiming cancellation is rollback.
- [Scope overlaps #180] → the user's explicit port instruction consolidates
  GitHub migration into #172; leave delegation and other providers separate.

## Migration & Rollback

Keep the PR draft and the change active while porting. Retain prior plans and
reviews under history/executable-boundary and label old acceptance historical.
Old tests do not qualify the new implementation. Reject obsolete executable
configuration with the exact file/key and migration action; never run or
silently ignore it. Retain native assignments, immutable identity and private
journals for reconciliation. Rollback must not release remote claims or replay
unknown operations. The original PR remains the delivery branch; merge is
user-owned.
