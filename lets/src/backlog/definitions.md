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
