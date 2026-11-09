# Backlog adapter contract

Lets owns policy, sequencing, validation and private recovery. Agents execute
bounded CLI or MCP actions described by one selected inert GitHub definition.
The same definition covers issues, Projects, repository facts and PR actions.
Lets-go remains the sole runner; steps retain their skills and report fields.
Setup and shaping writes keep their existing owners outside this migration.

Lets trusts submitted tool observations under the user-approved amendment to
[ADR-015](decisions/ADR-015-lets-requests-actions-and-validates-results.md).
It validates scope, mappings, complete observations and workflow permission;
it cannot independently detect convincingly fabricated output. There is no
capture service, provider executable, plugin loader or backend executor in Lets.
The contract needs no host modification or separate code-host connection.

Shared Backlog, Adapter, Work item and Packet meanings are in the
[project glossary](../openspec/glossary.md). Definition authors should also read
[the runtime definition reference](../lets/src/backlog/definitions.md).

## Workflow inventory

The inventory maps responsibilities; its table check alone does not prove
workflow preservation. Source skill tests also check owning procedures,
terminal ordering, delegated context and recovery continuations.

| Behavior | Owner | Preserved outcome |
|---|---|---|
| Project discovery | adapter | Enumerate open candidate backlogs linked in either direction; deduplicate scoped identities. Shared policy validates an explicit selection or requires exactly one. |
| Project creation | adapter | Create and link a backlog for the repository owner; report permission failures. |
| Field validation | adapter | Read and validate Kind, Priority, Size and Status mappings with exact shared meanings; preserve extra fields/options. Shared policy requires approval before destructive repair. |
| Item search | adapter | Search and read complete issue bodies, owners, metadata, parents and shared decisions within the selected repository/backlog. |
| Item creation | adapter | Create epics, stories, bugs and chores in the selected backlog and return scoped identity. |
| Targeted update | adapter | Change requested body or shared metadata only, preserving unrelated provider data. |
| Parent-child links | adapter | Create and enumerate epic/story relationships in both directions. |
| Directional blockers | adapter | Write and enumerate blocked-by relationships with item state; related links do not block. Incomplete enumeration cannot establish readiness. |
| Packet validation | shared policy | Require the outcome and Kind-specific packet fields; reject placeholders and route incomplete packets back to shaping. |
| Schema routing | shared policy | Route Chores and qualifying small changes to the minimal schema; retain new-code and shared-decision exceptions. |
| Ready-work ranking | shared policy | Exclude other repositories, non-Todo, Epic, Wont, assigned and blocked items. Rank Must, Should, Could then lowest GitHub issue number today; other identities use stable scoped code-point ordering. |
| Claim | adapter | Check unassigned ownership, assign the actor and move to In Progress; expose races and partial progress. Shared policy requires verification before work. |
| Release | adapter | Undo this worker's claim and restore Todo after branch creation fails; preserve another worker's ownership. |
| Pull request references | code host | Create one branch and PR per change, stack dependent work, include the issue-closing reference and retain user-owned merge. Adapter identity supplies the reference without requiring a numeric ID. |
| Completion | shared policy | Ready for review remains In Progress. Retained explicit-operation conformance requires exact attributed merge proof. Existing terminal workflow stops add no completion write. |
| Glossary handoff | shared policy | Check definition owner and merge prerequisites, verify checkpoint ancestry and owned paths, rehearse transfer, preserve user edits and import only verified glossary commits. Git operations belong to the code host; issue handoff text updates belong to the adapter. |


Shaping retains persona, journey, priority, confirmation, splitting and glossary
ownership decisions. Lets-go retains readiness, packet checks, schema choice and
OpenSpec orchestration. Repository and PR facts remain attributed code-host
observations even though their actions share the selected GitHub definition.
Authentication or scope failure never selects another connection or provider.

## Bounded action contract

Use `lets backlog <operation> --request-file <path>` for a new request. The JSON
contains `contractVersion: 1`, `operation`, `context` and `input`. Context carries
the absolute repository root as cwd, provider, immutable repository identity,
authenticated actor and selected backlog for item operations. Item identities
are full `{provider, backlog, id}` tuples. URLs and display references are not
identities. The first request may omit context.session; Lets allocates workerId
and returns it before action issuance. Each caller retains its own ID.

Repository identity bootstrap is read-only: `repository.read` accepts exact
owner/name input, that owner/name as context.repository, and no assumed actor.
Validated output supplies the immutable repository and authenticated actor for
later calls. `backlog.list` requires complete linkage observations and applies
the configured selection; ambiguity without a selected linked ID stops.

The caller supplies `--host-file` with actual session observations: available
tool names in tools, timeoutMs and maxOutputBytes. Missing tools, bounds, login,
permissions or writable state fail with an actionable prerequisite. Every
issued action records its selected definition and connection digests, immutable
request/input binding, operation/action/attempt IDs, permitted effects, expiry
and required tool/arguments. Lets durably records it before returning control.

For state action, execute exactly the named tool and structured arguments within
its timeout and output bounds. Save complete structured output, including page
arrays, union/null fields and structured errors. Submit using
`lets backlog submit --continuation-file <path> --submission-file <path>` and
the session host file. Copy the issued envelope fields exactly. Output may be
inline or reference bounded regular local output files; never transcribe facts
into substitute success data. Optional normalized fields must match projections
from that output. Receipt time controls acceptance when tool timestamps are
unavailable. An MCP version may be unreported when its declared shape is valid.

Read operations are recorded as private operation facts. Their records support
duplicate acknowledgement and correction bounds; they do not reserve remote
resources or create a workflow step log. At most two read corrections fit within
the original deadline. Rejected writes, timeout, truncation, termination or
partial structured failures preserve uncertainty rather than proving no effects.

## Operations and policy

| Operation | Existing-story behavior |
|---|---|
| repository.read | Read immutable repository/default branch and actor; read-only owner/name bootstrap discovers identity. |
| backlog.list | Enumerate linked open Projects with complete coverage; core selects a configured linked ID or the sole result. |
| item.search | Resolve scoped issue identities through complete search observations; preserve title-prefix and explicit-number semantics. |
| item.read | Read packet/Project fields and parent identity; includeThread true requires the complete thread, false avoids fetching it. |
| relationship.list | Read child or blocked_by relations with complete directional coverage; related links never establish blockers. |
| candidate.list | Core excludes closed, assigned, blocked, non-Todo, Epic and Wont work; ranks Must, Should, Could then stable identity. |
| claim.acquire | Fresh eligibility, assignment, fresh ownership, Status update and final sole-owner/In Progress verification. |
| claim.read | Read-only current ownership verdict; never acquires, repairs Status or grants release authority. |
| claim.release | Original-record-only cleanup, with fresh authority before each write and a final read. |
| pull-request.read | Read an exact ID or repository/head-qualified branch PR; open first, otherwise newest. |
| pull-request.create | Require a draft, complete preflight, absence check and fresh verification; missing isDraft confirmation is partial effects. |
| pull-request.update | Apply a prepared complete body file while preserving other sections and closing text; verify the exact PR. |
| pull-request.ready | Preserve the existing ready transition, confirm through a fresh read, and never merge. |
| reference.write | Retained read-only shared conformance validates an exact attributed association; no production workflow caller. |
| completion.write | Retained shared conformance gates explicit Done on the exact native merge and closing relation; no terminal caller. |

The remaining setup/shaping operations and four-provider examples remain in the
offline contract inventory; they are not production mutations exposed by this
GitHub migration. INPUTS and OUTPUTS in protocol.ts define required/optional
operation fields. Unknown fields, incompatible versions and scope mismatches
fail explicitly. The internal protocol-1 simulation envelope is a test harness,
not a separately installed adapter transport.

Items retain scoped identity, reference, body, metadata and complete owners.
Parent Epics may have only Kind; their absent Priority, Size and Status do not
prevent a body read. Stories, bugs and chores still require all four fields.
Any supplied metadata value must be valid, and ambiguous fields are rejected.
Shared metadata meanings are Kind, Priority, Size and Status from METADATA;
unknown values or incomplete required facts cannot establish readiness. Generic
Status repair is not an existing-branch resume action. GitHub numeric references
sort numerically within the selected scope; other identities use deterministic
code-point ordering, never locale or provider search order.

## Private recovery

Pending writes reserve native item or PR resources in a shared private store
across local worktrees, irrespective of a new worker or operation ID. PR creation
reserves endpoint/repository/head identity, then retains learned exact PR aliases.
Ordered resource locks, durable atomic records and conservative stale-lock
recovery coordinate local callers. This is not a cross-machine lock or remote
lease. Per-operation request/output scratch cannot overwrite another continuation.

Use `lets backlog resume --operation-id <id>` with the current session host file
to recover after restart, another worktree or scratch loss. Resume uses the
original definition, connection, input and scope, and returns bounded reads only.
A changed default cannot replace the recorded connection. Applied or absent
effects with reservationCleared true permit reevaluation; unresolved effects or
a retained reservation stop with the original ID, known effects and remedy.
One complete reconciliation read releases the reservation whatever it shows, so
the next run starts a new operation with fresh preflight reads.
Never blindly repeat a mutation merely because reconciliation ran.

Duplicate accepted submissions acknowledge their recorded result without
advancing twice. Unsupported journal versions stop without overwrite or replay.
Failures preserve typed categories and effects: none, partial or unknown. Message
keywords never decide outcome classification. A timeout stops waiting; it cannot
roll back a remote mutation or establish its absence.

## Current ownership and release

For ordinary resume, require fresh complete scoped observations showing the
authenticated actor as sole assignee and Status In Progress before unfinished
work. No historic acquisition record, worker session or token is required.
Claim.read clears public session/token fields rather than manufacturing history.
The core verdicts are sole-actor, unassigned, other, multiple, status-mismatch,
unavailable and pending-mutation. Incomplete assignee coverage is unavailable.
A known local pending write takes precedence before backend read issuance.

Existing branches skip Claim. After tree, branch PR, archive and record checks,
the walk checks current ownership before every unfinished step, again after the
previous step returns. Only sole-actor continues. Other verdicts report the
mismatch without repair; the user assigns only themselves and sets In Progress
in GitHub before rerunning. Pending mutations drive read-only resume, followed
by a fresh ownership check only after effects resolve and reservations clear.
Merged/rejected branch-scoped PRs and entirely finished runs retain their stops
without a work-ownership check, extra metadata commit or completion write.
An absent branch receives no historical terminal PR lookup.

Acquisition uses best-effort GitHub assignment and Status writes; only a fresh
sole-owner/In Progress verification authorizes work. Partial acquisition blocks
work and another acquire. Confirmed applied recovery may resume branch creation
only after fresh ownership. Absent/unresolved recovery stops without reacquiring.

Original operation records bind the worker's release authority. Release requires
the original resolved acquisition, actor, worker, item, definition, connection and
token; another session cannot adopt it from current public ownership. It checks
sole actor/In Progress before resetting Todo, then sole actor/Todo before
unassigning, then verifies unassigned/Todo. A mismatch preserves the other
owner's state and reports explicit unreleased/uncertain recovery. Release consumes
the old authority. A branch failure never implies cleanup succeeded.

GitHub's best-effort guarantee is a fresh snapshot, not exclusive execution.
Assignment and Status are separate writes and another worker can race later.
No finite test of those writes establishes atomic claim acquisition.

## Retained completion conformance

Explicit reference/Done contract checks consume attributed PR facts: code-host
provider/repository, canonical PR identity and complete native closing-issue
relations to the exact work item. A supplied merge assertion alone, another PR,
an unrelated commit, missing closing relationship or Done without proof fails.
The associated PR must be MERGED with the requested nonempty merge commit.
Already Done plus valid exact proof succeeds without another status write.
Uncertain completion reconciles by reads rather than repeating the write.

These checks do not add a runner completion caller. Existing native GitHub
closing automation remains responsible for its normal behavior. Archive and
ready transitions retain their existing workflow meaning; the user owns merge.

## Evidence matrix for representative profiles

Evidence checked 2026-11-03. These are dated documentation snapshots, not tested
provider versions. The executable profiles are simulations, not API clients.
N = native documented concept; E = adapter mapping/emulation assumed by this
contract; U = unsupported unless the stated prerequisite is established.
providers.test.ts runs the common lifecycle once and names the four provider
variation cases for scalar/label mappings, references and optional URLs. The
profiles share behavior; they are not four provider API implementations. The separate process, items, capabilities, claims, recovery and
completion tests cover negative and uncertain outcomes.

| Profile | Primary-source facts | Simulated classification and assumptions | Remaining live acceptance |
|---|---|---|---|
| GitHub Issues/Projects | [Dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies) distinguish blocked-by and blocking and require triage permission. [Sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues) support hierarchy. [Single-select fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-single-select-fields) provide configurable options. | Identity N (issue node ID plus Project scope); hierarchy/blockers N; shared metadata E through Project fields; claim E best-effort; PR reference/completion E through caller evidence. Atomic claim U. Project discovery must inspect both repository and owner listings. | Verify scopes, Project linkage in both directions, full pagination, field IDs/options, sub-issue and dependency direction, assignment/status partial writes, durable session provenance, create reconciliation and merge closing automation. |
| Jira Cloud REST v3 | [Issues API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) documents issue fields, parent relationships, assignment and workflow transitions. [Issue links](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/) use inward/outward issues and link types. | Identity N (tenant/project plus opaque ID); hierarchy/blockers N when configured; shared metadata E through native/custom fields; claim E best-effort; references/completion E. Atomic claim U. Tenant permissions and issue-type hierarchy are prerequisites; generic related links are insufficient. | Verify actual parent hierarchy, configured Blocks link direction, field schemas, permitted transitions, account IDs, permissions, pagination, retried link writes, partial claim recovery and merge-triggered automation. |
| Linear GraphQL | [Issue properties](https://linear.app/docs/issue-properties-home) include status, priority, labels, estimates and directional relations. [Parent/sub-issues](https://linear.app/docs/parent-and-sub-issues) represent hierarchy. [Developer API](https://linear.app/developers/graphql) provides authenticated GraphQL access. | Identity N (workspace/team scope plus opaque ID); hierarchy/blockers N; four shared fields E via configured fields/labels; claims E best-effort; references/completion E. Atomic claim U. Wont and Size meanings must be explicit mappings rather than guessed numeric priority or estimates. | Verify workspace/team membership, cursor traversal, relation direction, all mapped values, unrelated label preservation, account/session ownership, rate limits, create deduplication and GitHub automation behavior. |
| Local Beads | [Upstream CLI reference](https://raw.githubusercontent.com/gastownhall/beads/main/docs/CLI_REFERENCE.md), redirected upstream to gastownhall/beads, documents local IDs, child listing, dependency commands, assignment, updates, labels and close operations. | Identity N without browser URL; hierarchy/blockers N for selected CLI version; metadata E through labels/fields; claims E best-effort conservatively; references/completion E. Stronger claims U until version-specific primitives are verified. Storage/tracking policy is explicit. | Pin bd version and storage engine; verify JSON outputs, dependency orientation and related-link distinction, native claim behavior, session provenance, concurrent writers, interrupted writes, close retries and every generated file's tracking policy. |


## Retained provider inventory

GitHub, Jira, Linear and Beads retain their representative offline profiles.
`pull-request.*` is outside the non-GitHub production profiles; the separate
code-host routing decision remains pending. One selected GitHub definition
handles the existing-story production journey's issue, Project, repository and
PR actions. No second code-host connection is selected.

Retained cross-provider reference/completion examples use explicitly attributed
GitHub code-host fixture facts alongside the work item's own backend identity.
They test shared validation, not a live Jira, Linear or Beads integration, and
do not turn those profiles into PR adapters. Native closing-issue acceptance is
qualified only for a separately accepted real configuration.

## Live qualification status

| Host and binding | Offline evidence | Fresh live support |
|---|---|---|
| unchanged T3 with shipped gh CLI | Native output fixtures, bounded engine and CLI scenarios | unqualified until its actual configuration passes fresh acceptance |
| standalone CLI with shipped gh CLI | Same policy and configuration tests | unqualified until its actual configuration passes fresh acceptance |
| Any compatible MCP-only binding | Custom-definition read/write inventory without gh | unqualified until that exact binding passes its own fresh acceptance |
| Jira, Linear and Beads | Representative simulation and attributed code-host conformance | unqualified; non-GitHub production PR routing remains pending |

CLI acceptance does not qualify MCP support. No configuration key or prototype
check establishes live support. Record actual tool/provider/definition versions,
connection selection and enforced timeout/output limits for each accepted host.
An actual delegated step must independently verify its tools and writable shared
state; runner-only access is insufficient. Do not patch a host or install a
capture service to make the test pass.

Fresh acceptance uses only new items in a disposable scope explicitly designated
by the user. Never mutate or replay historical fixture issues or PRs. Exercise
interrupted claim recovery, read-only existing-branch authority, partial PR
creation, prepared review updates and existing terminal stops. Retain operation
IDs for unresolved writes and stop before any blind retry. A user-directed merge
is required for merged-path acceptance; offline merge fixtures cannot substitute
for it. Do not mark a delivery PR ready or archive a change merely because
its offline checks pass.

## Configuration and writable state

Repository selection belongs in openspec/config.yaml under lets.backlog. Version
1 accepts provider, definition, id and optional local storage policy. It
reserves mappings: no definition applies field or status mappings yet, so Lets
rejects the key instead of ignoring it.
Without selection, GitHub and its shipped gh binding apply. A custom
lets.backlog.definition path resolves relative to that config file, not PATH.
It selects inert schema-1 data, never a module or executable. The definition must
cover the required operations, binding, native fields and submitted output shape.
No production non-GitHub routing is implied by an offline profile.

```yaml
lets:
  backlog:
    version: 1
    provider: github
    id: PVT_example
    # Optional, relative to openspec/config.yaml:
    # definition: ../integrations/github.json
```

Machine settings live in $XDG_CONFIG_HOME/lets/config.yaml, or
~/.config/lets/config.yaml. Configure connections under backlog.connections and
the default under backlog.connection. A sole configured connection is the
default when no name is set. Several connections without a valid default fail;
an invalid explicit selection never falls back. A connection's binding must
belong to the repository-selected definition. A custom MCP tool needs its own
compatible declared binding and complete operation mappings; a name alone does
not translate gh arguments or qualify live support. The shipped binding targets
public api.github.com; another endpoint requires a compatible custom definition
that actually targets it. A connection endpoint key alone does not rewrite the
shipped arguments.

```yaml
version: 3
backlog:
  connection: github
  connections:
    github:
      binding: gh
      options:
        timeoutMs: 30000
        maxOutputBytes: 1048576
```

No connection settings are required to select shipped gh. The caller must still
supply actual available tools and enforceable bounds in a private --host-file,
including when delegated; the runtime checks CLI availability too. MCP tool
availability is a trusted session declaration. Configured bounds and session
bounds limit issuance together. Credentials stay with the selected backend tool,
never in repository config, definitions or submitted diagnostics.

`--connection <name>` is for direct lets backlog callers only. Lets-go's syntax
stays unchanged and uses the configured default; steps receive that name as
execution context and verify it independently. Recovery retains its original
connection and definition even after the default changes. Preserve original
options until outstanding effects reconcile; never reinterpret a pending record.
Obsolete adapter/executable/path configuration fails with its file/key and the
inert-definition migration remedy.

Private recovery defaults to $XDG_STATE_HOME/lets, or ~/.local/state/lets.
An absolute machine backlog.stateDir may select another directory shared across
worktrees. It must be user-owned with mode 0700 and allow durable create, locking,
atomic replacement and directory sync; records use private file permissions.
The default path is not assumed writable in an agent sandbox. Grant that session
write and lock access to the selected shared directory, or explicitly configure
a suitable absolute backlog.stateDir. Apply the same remedy to every actual
delegated session. Do not silently relocate the store, weaken its permissions,
delete pending records or replace shared recovery with per-worktree scratch.

Per-operation request/output files live in .workspace/lets-backlog. They are
private scratch, not release or Git content. Losing them does not lose the
original operation ID or justify repeating a write. Keep state available until
all recorded uncertain effects are resolved.
