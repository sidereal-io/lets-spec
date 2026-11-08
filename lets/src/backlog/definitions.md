# Provider definitions

A provider definition is data. Schema version 1 declares `name`, `version`,
`contractVersions`, `backend`, `bindings` and `operations`. Backend and tool
versions are explicit lists. Bindings name a CLI or MCP tool; they never load
code. Only existing operation names are accepted.

Select exactly one source. The loader records its resolved location and content
digest. Invalid explicit sources fail without falling back to the shipped
provider. Load hooks and extra definition keys are rejected.

Definition compatibility is an offline check. It does not qualify live support
for a tool connection or establish that submitted output is authentic.

Repository selection belongs in `openspec/config.yaml` under `lets.backlog`,
with `version: 1`. It selects `provider` (default `github`), optional Project
`id`, `definition`, `mappings`, and local `storage`. A custom definition is a
JSON file; relative paths resolve beside the repository config, with no search.

Machine settings belong under `backlog` in the existing version 3 user config.
They cannot select another provider, Project, mapping or definition. `stateDir`
must be an absolute path shared by local worktrees. The default is
`$XDG_STATE_HOME/lets`, or `~/.local/state/lets`.

Old `executable`, `adapter`, and adapter `path` settings are rejected with their
file and key. Remove them, select `lets.backlog.definition` when a custom
provider is needed, and configure backend tools under `backlog.connections`.
No adapter program is discovered or started.

Operation definitions use `operations.<operation>.actions.<action>.bindings`.
Each declared binding has inert `arguments` and a `projection`. A field-path
projection is `{ "op": "path", "path": ["data", "result"] }`. Unknown
operators fail when the definition loads. Projected results pass the same
operation validators for custom and shipped definitions. Optional submitted
normalization must equal the derived result; it cannot replace missing fields.

Submissions may supply `output` inline or `outputFiles` as explicit local JSON
paths. Lets reads regular files within the issued combined byte limit and
checks for changes during reading. One file supplies one JSON value; several
files supply an array of values for a paginated projection. Files are untrusted
submitted observations, with no independent provenance. Tool redirection into
operation-specific workspace scratch avoids transcription and display limits.

Before issuing actions, Lets requires a private, user-owned state directory
(mode 0700), exclusive lock creation, durable writes and atomic replacement.
A sandbox must grant those operations at the configured shared path. If access
fails, configure machine `backlog.stateDir` to an accessible shared private
location or grant access to the existing one. Do not choose a per-worktree
store or delete recovery records to bypass outstanding mutations.

Machine `backlog.connections` maps names to `{ binding, options }`. Options may
set the endpoint and finite `timeoutMs`, `maxOutputBytes`, and `acceptanceMs`.
Bindings must already be declared by the repository-selected definition.
`backlog.connection` names the default. Without connection settings the shipped
`gh` binding is implicit; one configured entry becomes the default; several
require a default name. Invalid selection never falls back. Direct backlog
callers may select `--connection`; lets-go retains its existing request syntax
and uses the configured default.

The CLI uses `lets backlog <operation> --request-file <path>` (`-` reads stdin).
It emits one JSON response with action, complete, needs-reconciliation or failed
state. It never starts the backend tool. The caller executes only the returned
action within its declared bounds, saves complete output and submits it with
`lets backlog submit --continuation-file <path> --submission-file <path>`.
Continuations are returned and saved separately under
`.workspace/lets-backlog/<operation-id>/continuation.json`.

Use `lets backlog resume --operation-id <id>` after scratch loss, or
`--continuation-file <path>` while the original scratch remains. Recovery uses
the recorded definition and connection, including when the default changes.
It issues bounded reads; a resumed action never repeats the uncertain write.
These interfaces do not qualify a live tool configuration. Production GitHub
translation and mutation sequencing are separate implementation tasks.

The closed projection vocabulary includes `path` (current value), `scope`
(issued context), `literal`, `object`, `array`, `at` (change the current value),
`map`, `select` (exactly one equality match), `enum`, tagged `union`, explicit
`nullable`, `text` (primitive with a fixed prefix), and `connection`. Paths
contain field names or array indexes; prototype-related names are forbidden.
Unknown operators, extra fields and excessive nesting fail definition loading.
Arguments may be a constant string array or a projection of the operation input.
Lets returns the resulting argument array as data; it performs no shell expansion.

`connection` requires nodes and pageInfo, a false hasNextPage, and an endCursor
that is null or text. When totalCount is supplied it must equal the observed
node count. A final page may still have an endCursor. Truncated connections do
not establish coverage. Tagged unions require an explicit case for every
observed member; a nullable mapping accepts an explicit null, not missing data.

The shipped GitHub item query addresses the immutable issue ID and selects the
configured Project within its Project-item connection. Its translation fixture
is a scrubbed real GraphQL issue response: identifiers, actor, URLs and packet
text have been replaced. Added cases exercise irrelevant Projects, explicit
null nodes, unknown union members and incomplete connections. Structured
GraphQL errors stop progression even alongside usable partial data. Declared
error types determine the category; unknown types retain unknown effects.
These fixtures verify translation only and do not qualify live support.

A translation may declare `observations.actor` and `observations.repository`
as projections of the submitted remote output. Core compares these with the
issued context before accepting the result. The shipped issue and discovery
queries both read the authenticated viewer and immutable repository ID.
Project discovery uses the repository's projectsV2 connection. Selection waits
for complete discovery, accepts a sole linked Project, or requires an explicit
`lets.backlog.id` when several are linked. An unlinked explicit ID fails without
selecting another Project.

`connection` also accepts an ordered array of connection pages. It requires
hasNextPage on every intermediate page, a final page, distinct nonempty cursors
and no repeated node IDs. Supplied totalCount must stay stable and equal the
combined node count. `filter` uses the same path/equality vocabulary as select
but returns all matches. Candidate translation uses it to keep issues belonging
to the scoped repository, after explicitly handling the content union.

The shipped candidate query uses bounded `gh api graphql --paginate --slurp`
output. Each page checks the authenticated viewer and Project identity
(`observations.backlog`). Nested assignee, Project-membership and field-value
connections must also be complete; an incomplete nested connection stops the
operation. Output limits apply to the entire submitted page array, and a
structured error on any page stops progression. A missing intermediate page
cannot satisfy totalCount coverage.

Candidate submissions include repository identity, native issue state and
complete directional blocker facts (`blockers.complete` and scoped
`blockers.open` identities). The shipped query validates every blockedBy
connection and accepts only OPEN or CLOSED states. Core selection requires
complete enumeration and applies shared readiness and ranking to open issues:
unassigned Todo stories, bugs or chores with Must, Should or Could priority
and no open blockers. Priority comes first, then the stable scoped issue order.
Closed issues remain in enumeration observations but cannot be selected.
Custom definitions must supply the same required facts.

`claim.acquire` maps separate `preflight`, `assign`, `read-assignment`, `status`
and `verify` actions. Preflight supplies a complete eligible item plus
`item.claimContext`: authenticated actor ID, Project item ID, Status field ID,
Todo/In Progress option IDs and complete linked Project IDs. Core records those
IDs in the issued action's bound claim state. Assignment uses the authenticated
actor ID; a fresh sole-owner/Todo read must follow before the status write.
Mutation acknowledgements prove only scoped responses. They cannot authorize
work without fresh final verification. A failure after confirmed assignment
preserves partial effects and the private reservation for recovery.

The final `verify` action is read-only. Core returns a claim only when that
fresh item has exactly the authenticated actor as owner and In Progress status.
The returned token names the private operation record; it is not a remote lease.
Its worker session records this acquisition, not exclusive GitHub ownership.
Native acquisition recovery uses the recorded definition's verification read,
never the assignment or status action. Confirmed sole ownership/In Progress
resolves applied effects; a sole-owner Todo item remains partial. Empty or
conflicting ownership cannot prove an issued write absent. Once reconciliation
clears a reservation, the caller must still check fresh work authority.

`item.read` accepts optional `includeThread`, default false. The `read` action
reads the issue body, metadata, creation/edit times and parent identity without
requesting comments. `includeThread: true` selects `read-thread`, which returns
all comment pages under the same combined output and time bounds. Comments keep
their URL, author type/login, association, body and creation/edit times so the
existing comment labels and read-marker rules can use the original facts.
Deleted authors remain explicit nulls. Required thread facts cannot be omitted
by a custom mapping. Parent bodies use a separate ordinary scoped issue read;
no Project-wide item scan is needed. Thread-page cases and the absent parent
are synthetic extensions to the scrubbed issue fixture.

Branch PR selection belongs to core. It qualifies repository, head repository
and head ref before sorting matching PRs: OPEN first, then newest createdAt.
Several historic or open matches do not add an ambiguity stop. No matching PR
returns null; malformed observations remain failures rather than absence.

Repository and exact-PR queries use the same selected GitHub definition. Their
fixtures were scrubbed from actual repository and draft-PR reads; mutation
response wrappers are synthetic. Nullable mergeCommit maps to its oid when
present. GitHub GraphQL exposes no mergeRef field; that normalized observation
remains explicitly null rather than being invented from the PR number.

PR creation always requests draft:true. An observed PR identity without
isDraft:true produces partial effects and requires reconciliation, never another
creation. A `path` may explicitly set `optional: true` to retain a missing value
for such core classification; this does not waive required result validation.
Prepared body content comes from the bounded local file read by core, not from
shell interpolation or an agent's summary.

PR write operations use core sequencing. Before mutation, the definition must
map preflight, read-existing, the specific write, and verify actions. Preflight
returns repository facts. Read-existing uses a complete branch lookup for
creation, or the exact PR for update/ready. An existing qualified branch PR
prevents another creation. Only a matching accepted submission issues the next
action, and an identical prior submission returns its recorded acknowledgement.

Core reads bodyFile as a bounded UTF-8 regular file, detects concurrent file
changes and records the bytes and SHA-256 digest before issuing any action.
Later file edits cannot replace this prepared body. Each issued write is
followed by a fresh exact-PR read that confirms the requested body or draft
state. All actions retain the original operation and worker identity. The
shared store reserves the resource throughout the sequence; no backend tool is
executed by Lets.

An uncertain PR creation is found by its repository/head resource key even
from another worker or checkout. Resume preserves the original definition,
connection, prepared body and worker provenance, and issues a branch PR read
only. A matching repository, head, base, body and draft confirms application.
An absent PR after an issued write is still unresolved: a read does not prove
that detached work has stopped. A mismatched body or missing draft effect keeps
the reservation. A journal stage before any write can resolve as absent.

When a PR ID becomes known, core registers its exact-PR alias while retaining
the repository/head reservation. Registration is serialized with PR operation
admission without reserving unrelated PRs. Replaying a submission that already
caused write issuance returns recovery, not another copy of write permission.
A PR identity learned from a partial write result selects an exact-PR recovery
read. It survives subsequent resumes; a later branch match cannot replace it.
Conflicting recorded identities or repository scope fail without another write.

An uncertain body update resumes with an exact-PR read and compares its body
with the recorded prepared bytes. It needs no original scratch or body file.
Only an exact match clears the reservation as applied. An absent PR or other
remote edits remain unresolved; recovery never restores a stale body or removes
unrelated sections or closing text. Callers must reread after reconciliation
before preparing any subsequent update.

Ready uses markPullRequestReadyForReview, followed by a fresh exact-PR read
confirming isDraft:false. A mutation result that still reports draft is partial,
not completion. Uncertain ready operations resume with exact reads only; a PR
that remains draft keeps the reservation. Neither the write nor recovery
requests a merge. Workflow ownership of this transition remains with the review
build step.

Directional relationships use native Issue connections: blocked_by reads
blockedBy; child reads subIssues. The read and read-child action mappings retain
that distinction. Every page binds the issued issue ID, repository and viewer,
and connection coverage must be complete before shared readiness can treat
missing blockers as empty. Native OPEN issues remain open prerequisites and
CLOSED issues normalize as Done. Unknown issue states fail mapping. Unsupported
relationship kinds have no implicit mapping to blockers or parent links.
