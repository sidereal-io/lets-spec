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
