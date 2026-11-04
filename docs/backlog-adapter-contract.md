# Backlog adapter contract

This contract defines the `lets backlog` executable boundary. The existing-item
GitHub build implementation is described in [Backlog build commands](backlog-build.md).
The kit tests representative simulations; passing them does not establish
provider support. Production support also requires the live acceptance below.

Shared Backlog, Work item and Packet meanings are in the
[project glossary](../openspec/glossary.md).

## Workflow inventory

The inventory table test checks structure and required mapping names; it does
not prove preservation of every instruction. Review compares the documented
responsibilities with the source skills.

The baseline is `skills/lets-setup-backlog/SKILL.md`,
`skills/lets-shape/SKILL.md`, `skills/lets-build/SKILL.md` and
`overlays/AGENTS.md`. Shared policy owns decisions; adapters translate provider
data and operations; the code host owns branches and pull requests.

| Behavior | Owner | Preserved outcome |
|---|---|---|
| Project discovery | adapter | Enumerate open candidate backlogs linked in either direction; deduplicate scoped identities. Shared policy requires exactly one. |
| Project creation | adapter | Create and link a backlog for the repository owner; report permission failures. |
| Field validation | adapter | Read and validate Kind, Priority, Size and Status mappings with exact shared meanings; preserve extra fields/options. Shared policy requires approval before destructive repair. |
| Item search | adapter | Search and read complete issue bodies, owners, metadata, parents and shared decisions within the selected repository/backlog. |
| Item creation | adapter | Create epics, stories, bugs and chores in the selected backlog and return scoped identity. |
| Targeted update | adapter | Change requested body or shared metadata only, preserving unrelated provider data. |
| Parent-child links | adapter | Create and enumerate epic/story relationships in both directions. |
| Directional blockers | adapter | Write and enumerate blocked-by relationships with item state; related links do not block. Incomplete enumeration cannot establish readiness. |
| Packet validation | shared policy | Require the outcome and Kind-specific packet fields; reject placeholders and route incomplete packets back to shaping. |
| Schema routing | shared policy | Route Chores and qualifying small changes to the minimal schema; retain new-code and shared-decision exceptions. |
| Ready-work ranking | shared policy | Exclude other repositories, non-Todo, Epic, Wont, assigned and blocked items. Rank Must, Should, Could then lowest GitHub issue number today; the portable tie-break will be defined in the protocol. |
| Claim | adapter | Check unassigned ownership, assign the actor and move to In Progress; expose races and partial progress. Shared policy requires verification before work. |
| Release | adapter | Undo this worker's claim and restore Todo after branch creation fails; preserve another worker's ownership. |
| Pull request references | code host | Create one branch and PR per change, stack dependent work, include the issue-closing reference and retain user-owned merge. Adapter identity supplies the reference without requiring a numeric ID. |
| Completion | shared policy | Ready for review remains In Progress. Confirm merge through the code host, then reconcile provider automation or request an idempotent Done update through the adapter. |
| Glossary handoff | shared policy | Check definition owner and merge prerequisites, verify checkpoint ancestry and owned paths, rehearse transfer, preserve user edits and import only verified glossary commits. Git operations belong to the code host; issue handoff text updates belong to the adapter. |

Shaping retains persona, journey, priority and scope decisions, confirmation
checkpoints, issue splitting and glossary ownership decisions. The adapter stores
the resulting packets and metadata. Build retains candidate selection, packet
checks, schema choice and OpenSpec orchestration. Setup retains the decision to
create a missing backlog or repair an existing one. Authentication scope errors
must remain explicit. No operation may select another provider as recovery.

Archive, review, checks, commits, branch creation, PR readiness, rejection and
archive reverts remain workflow/code-host responsibilities. Closing automation
is evidence to reconcile after merge, rather than permission to complete early.

## Protocol 1

Run the configured executable directly, with no shell and no appended arguments.
Write one UTF-8 JSON object to stdin and close stdin. Read one JSON object from
stdout; diagnostics go to stderr and must exclude credentials. Each invocation
is a separate process. The caller supplies an absolute repository `cwd` and
sets the process working directory to it. No adapter may infer another backlog.

Requests contain `protocol: 1`, `operation`, `context`, `input`, and, for a
mutation, a nonempty `mutationId` reused across retries. Read operations reject that
envelope field and never journal or replay their results. Context requires `cwd`,
`provider`, `repository`, `actor` and `session`. Item operations additionally
require `backlog`; backlog.list and backlog.create must omit it. mutation.read
also omits it when reconciling a preselection creation; otherwise it uses the
original selected backlog. Actor identifies the
authenticated account. A **Worker session** is one worker identity, distinct from
that account; the wire field `session` carries it, even when workers share an
account. Backlog and item IDs are opaque, provider-scoped strings.
An item identity is `{provider, backlog, id}`. A **Display reference** is a
human-readable item label, distinct from that scoped identity and optional URL.
The wire field `item.reference` carries the display reference on returned items;
a browser URL is optional.

`lets/src/backlog/protocol.ts` publishes executable required/optional
field definitions in `INPUTS` and `OUTPUTS`; a trailing `?` marks an optional
field. Unknown operation input and result fields are rejected. Those definitions
are the machine-checkable protocol surface. The validators are dependency-free
and usable by adapter authors. Nested item, capability and claim meanings are
specified in the following sections and checked by the scenario suite.

At the adapter's stdin boundary, malformed JSON and unknown operations return
`invalid_request` with effects `none`. Unsupported request protocol versions
return `unsupported` with effects `none`. Local caller validation rejects invalid
requests or invocation limits as `invalid_request`/`none` before execution.
The kit's conservative transport reports start failures, signal termination,
deadlines, output overflow and invalid responses as `unknown_outcome`/`unknown`.
The production caller distinguishes proven absence of mutation effects: a start
failure is `invalid_configuration`/`none`; interrupted read operations are
`transient`/`none`; interrupted writes and invalid responses remain
`unknown_outcome`/`unknown`. These classifications never authorize replay of an
uncertain write. Every caller attempts only the supplied executable. The kit
uses SIGKILL for deadline and output limits;
this stops the launched process, not detached descendants or accepted provider
writes. Combined stdout/stderr limits count raw bytes before UTF-8 decoding.
Unexpected simulation implementation errors also report `unknown_outcome` with
unknown effects; category words in their messages never determine classification.

Success is `{protocol:1, ok:true, result:{...}}` with exit 0. Failure is
`{protocol:1, ok:false, error:{category,message,effects}}` with nonzero exit.
Success cannot contain error and failure cannot contain result. Categories are
invalid_request, invalid_configuration, authentication, permission, not_found,
unsupported, conflict, transient and unknown_outcome. Effects are none, partial
or unknown; unknown_outcome must never promise none. Partial results must be
reconciled using the mutation key and ownership state before proceeding.

Enumerations return `items`, `complete` and `nextCursor`. Complete enumeration
has a null cursor; incomplete enumeration requires a nonempty next cursor.
The caller follows cursors and detects repeated cursors. A provider that cannot
finish a required enumeration reports unsupported; it cannot return an empty
complete result to hide a gap. Readiness requires complete blocker evidence.

The harness imposes a caller-selected positive timeout (default 5 seconds),
a 1 MiB output limit and process termination on timeout/overflow. Invalid JSON,
wrong protocol, signal termination and inconsistent exit/result are contract
failures. A timeout on a mutation is an unknown outcome, even if the process
was killed. Killing the client cannot roll back a provider write.

Example read request:

```json
{"protocol":1,"operation":"item.read","context":{"cwd":"/repo","provider":"beads","backlog":"local","repository":"repo","actor":"me","session":"worker-1"},"input":{"item":{"provider":"beads","backlog":"local","id":"bd-a"}}}
```

Example enumeration response:

```json
{"protocol":1,"ok":true,"result":{"items":[],"complete":true,"nextCursor":null}}
```

[ADR-014](decisions/ADR-014-backlog-adapters-use-an-executable-boundary.md)
records why backlog adapters use an executable boundary while delegation
resolvers remain built into `lets`. Independent authors can choose their
language and release schedule without loading provider dependencies into `lets`.
This extension goal carries the cost of a versioned protocol, separate
installation and conformance checks.

Process isolation is not a sandbox. An adapter can access inherited credentials
and local resources; separating runtime dependencies does not confine that
access. Installing its executable is a repository trust decision.

## Operation semantics

Every operation is confined to context.repository and context.provider. Backlog
discovery lists linked candidate identities in that scope; creation returns a new identity.
The caller selects exactly one and supplies context.backlog on subsequent item
operations. Those operations, including enumeration, are confined to that backlog. Reads
have no effects. Mutations require a key scoped to provider, backlog, repository, actor and session, bound to the
operation and exact input. Discovery creation keys have no backlog component;
reconcile and replay with the original preselection context, never a guessed or
newly selected backlog;
reusing a key with different input is invalid_request.

| Operation | Preconditions and input | Successful result and effects | Recovery |
|---|---|---|---|
| backlog.list | Authenticated repository context; optional cursor | Complete or paged linked backlogs; no writes | Retry reads |
| backlog.create | Permission to create/link; title | Selected backlog ID; creates and links once | Reconcile key before recreate |
| backlog.check | Selected backlog exists | valid and actionable mapping gaps; no writes | Fix configuration explicitly |
| item.search | Query and optional cursor | Scoped items with packet bodies | Retry reads |
| item.read | Existing scoped identity | Full normalized item | not_found stays explicit |
| item.create | Title, body and shared metadata | New normalized item in selected backlog | Reconcile key to avoid duplicates |
| item.update | Identity and targeted patch | Updated item; unrelated fields preserved | Read after uncertainty, reapply desired patch only |
| relationship.write | Two existing identities, kind and desired present boolean | Desired relationship state | Reconcile edge, then set desired state |
| relationship.list | Identity, kind and optional cursor | Directional edges with target state | Require complete evidence |
| candidate.list | Selected repository context | Normalized candidate items | Shared caller filters and ranks |
| claim.acquire | Unowned item | Verified ownership and In Progress state with declared guarantee | Reconcile ownership and status |
| claim.read | Identity | Ownership, session, token, guarantee and status | Read before retry/progression |
| claim.release | Identity and this session's token | released boolean; restores Todo only for own claim | Read ownership before retry |
| reference.write | Identity and code-host reference | Stored reference without duplicate association | Read/reconcile before retry |
| completion.write | Identity and code-host merge evidence | Done after confirmed merge | Read status; already Done succeeds |
| mutation.read | Original mutationId in same scope | state applied, absent or unknown; original result when applied | Unknown blocks retries and progression |
| capability.read | Selected context | Declared support and limits | Unknown capability is a gap |

Authentication and permission failures require intervention; they never cause
fallback. Invalid requests/configuration must be fixed. Conflicts preserve the
current owner's data. Transient reads may retry with bounded backoff. A mutation
with confirmed effects none may retry its original key; partial/unknown effects
require reconciliation. If the provider cannot prove absence or deduplicate a
creation, stop for manual reconciliation rather than issue another create.

## Items and shared metadata

Returned items contain identity, reference, title, body, metadata and owners;
url is optional. Identity comparisons use the full provider/backlog/id tuple,
encoded without delimiter ambiguity. Neither a URL nor a display reference is
an identity. Shared metadata is exactly Kind, Priority, Size and Status, using
the values in `METADATA` in the kit. There is no generic provider-field input.

Mappings associate each shared value with an adapter-local field/value pair.
Each pair must have one meaning. Each mapping declares cardinality one (scalar)
or many (label array). A scalar field cannot hold two shared meanings; a shared
array uses disjoint value sets and initializes as an array even when absent. Reads reject missing or ambiguous values.
The reference mapping simulator accepts scalar fields and label arrays. Updates
remove only the old values owned by the changed mapping; other labels and fields
remain. Production adapters must validate provider field types and permitted
values themselves, including workflow transition constraints.

## Repository configuration

The configuration location is `lets.backlog` under `openspec/config.yaml`, one
object rather than a list. Missing selection means GitHub and executable
`lets-backlog-github`; setup still requires exactly one linked backlog. An
explicit selection requires provider, executable, id and all metadata mappings.
A bare executable name resolves through PATH; a path resolves relative to the
repository root. Resolve once, verify executable permission, and report a
configuration error if unavailable. Do not interpret shell syntax.

Example local selection (value mappings abbreviated here; the executable
examples in config.test.ts contain all values):

```yaml
lets:
  backlog:
    provider: beads
    executable: ./bin/lets-backlog-beads
    id: local
    storage:
      path: .beads
      tracking: ignored
    mappings: # complete Kind/Priority/Size/Status mappings required
```

The adapter validates native provider field IDs, allowed values and transitions
before mutations. The kit checks normalized example configuration and mapping
ambiguity; it does not parse YAML or consume production configuration. The
sync parser continues to read `schema:` only. The backlog runtime parses
selection separately, without changing sync behavior.

Credentials come from provider login tools or environment variables. Do not
commit tokens, passwords or API keys in selection or mappings. Missing login
returns authentication; insufficient scope returns permission. Neither selects
another backlog. Provider tenant/team/project context belongs to the opaque
backlog selection or adapter-specific local configuration, not shared item
fields. The actor in a request must match the authenticated identity.

For local Beads, choose the storage location and tracked/ignored policy
explicitly. The adapter must check that policy before writing, including any
files generated by the selected Beads version. No implicit Git add/commit is
permitted. A tracked choice is not permission to publish secrets.

## Capabilities and selection

Capabilities are named hierarchy, blockers, claims, metadata, references and
completion. Each declares support native, emulated or unsupported and limits.
Emulation requires a nonempty explanation of storage, visibility, permissions,
consistency and any outcome it cannot achieve. Unknown declarations fail closed.
A workflow step checks every required capability before its first mutation.
Native names do not establish support; adapter acceptance must prove outcomes.

Relationships use child/parent, blocked_by and related kinds. blocked_by points
from the blocked item to its prerequisite. Hierarchy is readable both ways;
related links never enter blocker enumeration. Deleting an edge is a desired
state operation. Listing blockers includes their open/closed state and must be
complete before selection proceeds.

The shared caller filters repository, Todo, non-Epic, Must/Should/Could,
unassigned and no open blockers. It ranks Must, Should, Could, then compares
scoped identity tuples lexically by code point. The GitHub profile preserves its
existing same-backlog numeric issue-reference tie-break. Within each GitHub
provider/backlog group, numeric references sort before nonnumeric references;
equal numbers and nonnumeric references fall back to the raw opaque ID. Compare
raw tuple components by Unicode code point, never their JSON encoding.
No locale-dependent collation or provider search ordering determines selection.

Generic item creation starts at Todo. Generic item updates cannot write Status;
claim acquire/release and merge-gated completion own status transitions.

## Claim guarantees

A **Claim** is a worker's recorded ownership of an item, with the backlog
adapter's stated concurrency guarantee.

A claim reports actor, session, token, status and guarantee (atomic or
best-effort). Adapters must state whether ownership verification is session-level
or actor-level. Session and token may correlate local continuation; they must
not be presented as remote session ownership when the provider lacks it.

The native GitHub profile uses assignees and Project Status with private local
journals and explicit continuation handles. It requires no machine-state fields,
metadata branch, repository coordinator or external service. Acquire rejects any
existing assignment, including the same actor. Before work, freshly read sole
actor assignment and In Progress and require original local continuation intent.
Missing local intent never authorizes adopting an assigned item. Assignment
alone without In Progress cannot authorize work.

Record exact attempted operations before writes. Lost responses require
mutation reconciliation before replay. Applied means current native state
satisfies the recorded operation, not proof that this session caused the state.
Absent requires conclusive pre-write or no-effects evidence. Partial native
state remains unknown. A journal alone never proves current ownership.
Release requires original local actor/session/token intent and checks current
native ownership between mutations; conflicting owners or Status stop writes.

GitHub cannot distinguish remote sessions sharing the same actor or detect
assignment removal and reassignment between reads. Release and recovery therefore
provide actor-level best-effort snapshots, never session-level distributed locks.
Other adapters with remote session primitives may enforce stronger provenance.
The simulated kit exercises that stronger profile; its results are not proof
of GitHub session isolation. No adapter may advertise atomic claims without a
provider primitive enforcing ownership under concurrent attempts.

## Completion evidence

A **Pull request reference** is the code-host link associated with an item. It
is distinct from the item's display reference; `reference.write` and merge
evidence use the pull request reference.

**Completion** means moving work to Done after the code host confirms merge.

The caller confirms merge through its code-host integration for the associated
PR reference, then passes that evidence to completion.write. The executable scenarios substitute
this external boundary with caller-supplied fake merge evidence. Evidence includes the exact
reference, merged=true and a nonempty merge commit. A provider issue body or
PR-ready notification is not evidence. Adapters accept this evidence only from
the trusted caller; the protocol is not an authentication mechanism.

Check merge even when provider automation already set Done. After confirmation,
already Done is success without another effect. A lost completion response is
recovered by reading status and retrying the same desired state. Review readiness
and archive leave In Progress; only confirmed merge permits completion.

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
| GitHub Issues/Projects | [Dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies) distinguish blocked-by and blocking and require triage permission. [Sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues) support hierarchy. [Single-select fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-single-select-fields) provide configurable options. | Identity N (issue node ID plus Project scope); hierarchy/blockers N; shared metadata E through Project fields; claim E best-effort; PR reference/completion E through caller evidence. Atomic claim U. Project discovery must inspect both repository and owner listings. | Verify scopes, Project linkage in both directions, full pagination, field IDs/options, sub-issue and dependency direction, assignment/status partial writes, actor-level limits, local continuation, create reconciliation and merge closing automation. |
| Jira Cloud REST v3 | [Issues API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) documents issue fields, parent relationships, assignment and workflow transitions. [Issue links](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/) use inward/outward issues and link types. | Identity N (tenant/project plus opaque ID); hierarchy/blockers N when configured; shared metadata E through native/custom fields; claim E best-effort; references/completion E. Atomic claim U. Tenant permissions and issue-type hierarchy are prerequisites; generic related links are insufficient. | Verify actual parent hierarchy, configured Blocks link direction, field schemas, permitted transitions, account IDs, permissions, pagination, retried link writes, partial claim recovery and merge-triggered automation. |
| Linear GraphQL | [Issue properties](https://linear.app/docs/issue-properties-home) include status, priority, labels, estimates and directional relations. [Parent/sub-issues](https://linear.app/docs/parent-and-sub-issues) represent hierarchy. [Developer API](https://linear.app/developers/graphql) provides authenticated GraphQL access. | Identity N (workspace/team scope plus opaque ID); hierarchy/blockers N; four shared fields E via configured fields/labels; claims E best-effort; references/completion E. Atomic claim U. Wont and Size meanings must be explicit mappings rather than guessed numeric priority or estimates. | Verify workspace/team membership, cursor traversal, relation direction, all mapped values, unrelated label preservation, account/session ownership, rate limits, create deduplication and GitHub automation behavior. |
| Local Beads | [Upstream CLI reference](https://raw.githubusercontent.com/gastownhall/beads/main/docs/CLI_REFERENCE.md), redirected upstream to gastownhall/beads, documents local IDs, child listing, dependency commands, assignment, updates, labels and close operations. | Identity N without browser URL; hierarchy/blockers N for selected CLI version; metadata E through labels/fields; claims E best-effort conservatively; references/completion E. Stronger claims U until version-specific primitives are verified. Storage/tracking policy is explicit. | Pin bd version and storage engine; verify JSON outputs, dependency orientation and related-link distinction, native claim behavior, session provenance, concurrent writers, interrupted writes, close retries and every generated file's tracking policy. |

All profiles assume a selected disposable backlog, sufficient permissions and
complete relationship reads. If those assumptions fail, capability validation
must stop before mutation. The kit's journal models durable reconciliation but
does not provide it for a real provider. No documentation cited here establishes
atomic assignment-plus-status, exactly-once create or session-safe release.

The shared executable lifecycle creates and retries an item, maps metadata,
round-trips hierarchy and blockers, distinguishes related links, verifies claims,
associates a code-host reference, rejects an unmerged completion and completes
idempotently after merge. Broken duplicate-create and ignored-blocker fixtures
must fail those checks. Production support additionally requires automated
adapter tests plus an end-to-end run against the actual configured provider,
including fault injection and cleanup. Offline fake results cannot replace it.
