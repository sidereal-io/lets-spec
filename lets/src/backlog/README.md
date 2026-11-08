# Backlog runtime and offline conformance

The runtime issues bounded actions from an inert configured definition,
validates agent-submitted observations and stores private recovery. It executes
no backend tools. The shipped GitHub definition covers the existing-story
workflow's issue, Project, repository and PR actions. Read
[the contract](../../../docs/backlog-adapter-contract.md) and
[definition authoring](definitions.md) before configuring another binding.

From a source checkout with Node 26:

```sh
pnpm test:backlog
```

The suite includes the production request/submit/resume engine, native GitHub
output fixtures, CLI invocation, compatible custom MCP inventory and negative
scope, ownership, uncertainty and recovery cases. These are offline checks.
They do not qualify a live configuration or make CLI acceptance prove MCP support.

The four-provider fake, profiles, process harness and conformance lifecycle are
retained test-only examples. They are not a production adapter executable, API
client or recovery implementation. Attributed code-host fixtures remain distinct
from the work item's backend. Non-GitHub production PR routing is pending.
Run those examples only in disposable local fixture directories, never against
historical or normal backlog items. Scratch belongs under .workspace/.

Runtime release packaging consumes the real engine and shipped definition;
unused simulation payloads and tests stay in the source checkout. Recovery lives
in a shared private state directory, not committed workflow metadata. Lets-go
alone sequences workflow steps and owns their recovery continuations.
