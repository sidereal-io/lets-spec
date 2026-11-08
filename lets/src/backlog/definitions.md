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
