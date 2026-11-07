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

The concrete service, trust setup, wire operations and resumption design are
specified below. Building and testing those components does not require an
existing deployed service. Installing the service requires operator approval
of the completed deployment artifact. Qualifying live support requires the
separate-account deployment, trusted real tool/authentication and live evidence.
A test double never qualifies that trust boundary.

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

## Concrete capture and resumption design, 2026-11-07

No existing capture interface has been identified. The implementation choice
is a generic protected local runner, administered separately from the agent.
This is an engineering assumption within ADR-015, not user approval to install
a system service. Prepare the implementation and deployment files first;
operator approval and demonstrated isolation gate installation/live acceptance.
The pure and offline implementation does not require a pre-existing service.

### Capture service

Ship a generic lets-capture entry that listens on a Unix socket. An operator
installs it under a separate OS account with a private state directory,
protected credential context and administrator-owned tool configuration.
The client trusts only an administrator-owned setup file and verifies the
socket ownership and protected directory. No environment variable, repository
file or provider definition can replace that trust setup in production.

The administrator pins each available tool's absolute immutable executable,
digest, fixed argv, authentication-context ID and environment/credential source.
The runner validates ownership/write permissions of configuration, executable
and parent paths. It clears inherited environment, fixes cwd to its protected
state directory and uses no shell. Agent input supplies only stdin data and the
bounded action identity. Definitions cannot mark a tool trusted. For the GitHub
tool, the installed command is gh api graphql --hostname api.github.com
--input -, with protected authentication. The administrator's tool rule
requires a query for a read action and a mutation for a write action.

POST /execute accepts a version-1 action with ID, immutable request digest,
logical tool ID, expected trusted executable digest/authentication context,
stdin, effects permission, issue/expiry times and byte/deadline limits. Before
execution the runner durably reserves the action ID and records dispatched
uncertainty. Duplicate IDs with different input are conflicts. Identical
requests return the original record or its pending/unknown status, never
execute again. Bound execution and combined output; termination is not rollback.

GET /receipts/<id> returns the service's original immutable capture, not an
agent-supplied replacement. Records bind actual pinned executable/argv/stdin,
action digest, timestamps, authentication context, exit/signal/byte outcome
and stdout/stderr. No API can insert, edit or delete a receipt. Retrieval is
bounded. Service restart never reruns a dispatched reservation. The client
retrieves the record and compares actual tool/input to the issued action.
A copied record in a submitted report is ignored as authority.

Offline tests use an injected runner client and fake tools. These are test
seams, not production environment flags and not proof of deployed isolation.
Live qualification requires an operator-approved separate-account deployment,
pinned real gh and real fresh claim and exact merged-PR capture. If deployment
or authentication is unavailable, the implementation remains draft and reports
the missing facts; do not lower the guarantee or perform direct verifier reads.

### One definition and generic capture path

Move GitHub tool documents out of executable gh.ts into an inert shipped
provider definition. Each supported semantic fact/action names a trusted
logical tool, immutable stdin template, read/write mode and output mapping.
The only template language is constants, JSON-pointer substitution and
object/array construction, with bounded nesting/size. It has no arbitrary
code, imports, shell, policy, loops or trust declarations. Compatible explicit
custom definitions use the same interpreter and validation without a release.

The existing native lifecycle is reexpressed as shared state policy over
normalized backend facts: authenticated actor/repository permissions, linked
backlogs, native mapped fields, item membership/content/owners/relations,
PR closing links and exact merge facts. Only the definition translates tool
requests and captured native responses. The core never invokes gh or an
adapter process. Supplied agent-normalized facts do not replace mapped facts
from the independently retrieved capture. Configuration pins definition source,
version and content digest in each workflow, and rejects obsolete executable
selection. Retain the original behavior tests while moving their seam.

### Resumable CLI

Existing lets backlog workflow commands start a private workflow and return
{state:action-required, workflow:<opaque handle>, action:<bounded action>}.
The agent calls the runner with that action, then lets backlog submit with
{workflow, actionId, receipt:<reference>}. Lets retrieves the original capture,
validates it and returns the next action or {state:complete,result:...}.
A submit never accepts a report body as capture. An explicit abandon operation
can end a read-only workflow; an issued write remains reconciliation-required.

The CLI persists one outstanding workflow reservation per repository to keep
concurrent invocations from crossing native writes. The reservation survives
process exit. Submission and issuing the next action use one scope lock,
generation comparison and atomic journal replacement. Same input can recover
the outstanding workflow only with its private handle; a new caller cannot
adopt it by scanning storage. Accepted submission replay returns the same
checkpoint without remote replay. Expired issued writes remain uncertain.

To preserve current native recovery while making calls resumable, run the
core workflow against a journal transaction and an ordered action transcript.
Replay only previously captured results to reconstruct the next checkpoint;
never replay a tool invocation. Snapshot initial private state and pin config,
definition and inputs. Allocate random session/mutation IDs deterministically
from a persisted per-workflow ID sequence. Journal writes at each yield commit
atomically with the outstanding action; replay reconstructs from the initial
snapshot and commits only changed keys. Suspension is a distinct control-flow
signal and must propagate through mutation catch blocks unchanged. It is not
an operation failure or permission to reconcile early. Immutable change binding
is idempotent; no other filesystem writes occur outside journal checkpoints.

Reject divergent action transcripts, changed configuration/definitions, missing
or repeated action IDs, stale captures and changed continuation inputs. Bound
workflow lifetime/transcript size and output. On crash after service execution,
retrieve that action's existing service receipt; never start another attempt.
On crash after local acceptance, replay the accepted checkpoint. At the end of
a claim, require the latest captured ownership and Status reads; old cached
journal facts never authorize starting or resuming work.

### Required review corrections

- Replace the old stale-PID symlink takeover. Use an OS-released exclusive
  flock lock held by a fixed no-shell helper process for the callback lifetime.
  Closing the parent pipe ends the helper; OS lock release requires no stale
  unlink. Missing flock is an actionable prerequisite error, never an unsafe
  fallback. Declare/package that platform dependency and test simultaneous
  stale-owner recovery. Live qualification is scoped to Linux initially.
- An issued write with a permanently unavailable receipt enters reconciling
  while retaining the original reservation, action and mutation identity.
  That state can issue separately identified read actions to observe native
  effects. No write can be issued until those captured reads resolve the
  original operation. Absent is allowed only with trusted no-dispatch/no-effect
  evidence. Native partial state remains unknown. An explicit reconcile
  command never silently abandons the write or creates a new claim session.
- Historical replay reuses persisted action descriptors and previously accepted
  outcomes; it is not a new submission or proof of current state. Check expiry
  when accepting a new capture. Required fresh ownership and exact merge
  checkpoints always request new captures rather than adopting historical
  facts. Test delayed replay and stale final-ownership refusal separately.
- Parse the actual submitted GraphQL document using the standard parser.
  Support exactly one operation, with no operationName override and no extra
  input fields beyond query/variables. Require operation kind to match the
  issued read/write permission. Reject ambiguous/multiple operations before
  execution; neither string prefixes nor keyword presence establish read safety.
