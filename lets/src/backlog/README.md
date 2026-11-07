# Backlog runtime and offline conformance

The runtime requests bounded actions, independently retrieves protected capture,
and applies backlog policy to the captured facts. The GitHub provider definition
is inert JSON consumed by the same loader as custom definitions. There is no
production executable adapter transport or direct provider executor.

Read the [contract](../../../docs/backlog-adapter-contract.md),
[agent command loop](../../../docs/backlog-build.md) and
[capture deployment guide](../../../docs/backlog-capture.md).
Runtime releases bundle `lets` and `lets-capture`. The latter is a separately
administered Linux service; offline tests do not establish a deployed trust
boundary. `flock` from util-linux is required for local workflow serialization.

From a source checkout with Node 26 and installed dependencies:

```sh
pnpm test:backlog
```

The suite covers the action contract, inert definition/configuration loading,
protected capture service/client, durable workflow reservation and native GitHub
lifecycle. `pnpm test` also type-checks and runs repository workflow tests.
`nix flake check` builds the flow and runtime releases.

`fixtures/workflow-driver.ts` is an offline injected tool/capture boundary.
`fake.ts`, `state.ts`, `process.ts`, `transport.ts`, `conformance.ts` and
`recovery.ts` retain representative domain and legacy process-contract tests.
They are not production providers, installed executable adapters or independent
live evidence. The runtime bundle excludes this unused simulation code.

Never run the mutating conformance lifecycle against a normal user backlog.
Live qualification needs a separately authorized disposable scope, actual
protected request/response capture, authentication/ownership evidence, fault
recovery and an exact user-merged PR. Historical executable acceptance cannot
qualify the action workflow.
