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
