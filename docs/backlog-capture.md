> **Withdrawn deployment proposal:** ADR-022 was withdrawn at the user's
> request on 2026-11-07. This guide and `packaging/capture/` describe an
> unaccepted prototype. Do not install it. Capture design is reopened;
> no replacement is selected. ADR-015's evidence requirements remain in force.

# Independent backlog capture

The action workflow requires a separately administered capture runner. The
runner executes a pinned tool, keeps the original request and response, and
returns a reference. Lets retrieves that reference directly over a protected
Unix socket. An agent report or copied receipt cannot establish backend facts.

This implementation targets Linux. The example deployment has not been
installed or qualified by the offline tests. An operator must approve and
install the reviewed files before a live workflow can claim independent
capture. A temporary runner under the agent's own account is only a test double.

## Files to review

The deployment examples are in `packaging/capture/`:

- `lets-capture.service` runs as the dedicated `lets-capture` account.
- `capture-service.json.example` pins tool identity and its permission rule.
- `capture-client.json.example` establishes client trust.
- `gh-environment.json.example` shows the protected credential format.

Replace the example UID, executable digest and authentication-context name with
operator-verified values. The logical tool ID must match the selected provider
definition. Keep executable, argv, digest and authentication identical in the
service and client files. A definition cannot register a trusted tool.

## Operator setup

These are deployment instructions for review; creating the files does not
install or authorize a service.

1. Create a dedicated system account and group named `lets-capture`. Give the
   agent account membership in that group so it can connect to the socket.
   Give the service account no administrative privilege. The agent must be a
   different unprivileged account and must have no ability to become the
   service account, edit its files or control its processes.
2. Install the reviewed lets release under `/opt/lets`, including its
   `bin/lets-capture` entry. Install a real, fixed copy of the supported `gh`
   executable at `/opt/lets-capture/bin/gh`. All executable paths and their
   ancestors must be owned by root, have no group or other write permission,
   and contain no symlinks. Use the SHA-256 of that exact installed executable
   in both configuration files. Review the Node runtime and executable
   dependencies as part of the installation; a tool digest does not attest
   the whole operating system.
3. Create `/etc/lets` owned by root, mode `0755`. Install
   `capture-service.json` and `capture-client.json` there, owned by root, mode
   `0644`. Client setup always comes from `/etc/lets/capture-client.json`.
   Environment variables, repository files and command flags cannot replace it.
4. Put the real scoped credential environment in
   `/etc/lets/gh-environment.json`, owned by the service account, mode `0600`.
   Never commit credentials. Set the authentication name to identify the real
   account/context used by this credential. Create the protected `gh-config`
   directory under `/var/lib/lets-capture` for any required tool configuration.
   The runner supplies only this environment, with no inherited variables.
5. Install the reviewed unit under `/etc/systemd/system/lets-capture.service`.
   The unit creates `/run/lets-capture` as service-owned `0750` and
   `/var/lib/lets-capture` as service-owned `0700`. The socket is service-owned
   `0660`; only its group can connect. The state directory remains inaccessible
   to agent group members. No agent-writable ancestor is allowed for setup,
   executable, credentials, state or socket directories.
6. After operator approval, load and start the unit using normal systemd
   administration. Do not run a second instance on the same state directory.
   The unit cleans the old socket after the service has stopped. Retain state
   across restarts and upgrades. Never delete a reservation to retry a write.
7. Verify the deployed UID, permissions, immutable executable and real
   authenticated actor. Then conduct a separately authorized scoped live run
   with fresh ownership/status and exact merged-PR evidence. Record the tested
   release and configuration. Offline tests do not satisfy this qualification.

The credential file is an environment object with string values. Loader
injection variables are rejected. Keep it minimal; any additional tool
configuration belongs to the operator's protected account, never to the agent's
checkout. Rotate credentials and executable pins through an operator review.

## Wire contract and recovery

`POST /execute` accepts the original version-1 action and returns
`{"reference":"<action-id>"}`. It cannot choose an executable, argv or
credential context outside the administrator's exact pinned rule. The runner
uses no shell and fixes its working directory to its protected state directory.
The GraphQL classifier parses the actual `query` with a token limit, permits
only `query` and optional `variables` input keys, requires exactly one operation,
and requires its kind to match the issued read or write permission. Multiple
operations, subscriptions and `operationName` overrides are rejected before
execution. Comments, fragments and strings cannot disguise a mutation as a read.

The runner durably creates an exclusive reservation before dispatch. Concurrent
or repeated identical requests return the same reference; changed requests
with the same ID conflict. A crash during dispatch leaves a permanent unknown
reservation. Restart never reruns it. The final capture is a separate exclusive
file; the API has no insert, update or delete operation for receipts.

`GET /receipts/<action-id>` returns the original capture or the reservation's
unknown outcome. The client bounds retrieval and validates correlation, tool,
input, collection time, completeness and outcome. A submitted receipt body is
never an alternative source. The process deadline and combined raw stdout and
stderr limit bound collection. Timeout, overflow, signal or lost response means
unknown effects; termination does not prove rollback or stop remote work.

Receipts are private audit evidence for the actual tool invocation and its
response. They do not create a remote lock or prove current ownership forever.
The local recovery journal records workflow provenance. Fresh captured backend
reads still establish native ownership and exact merge facts at the required
checkpoints. Unknown writes retain their original identity and require
reconciliation before another write.

Offline fixture tests can run with:

```sh
node --test tests/lets/backlog/capture-service.test.ts tests/lets/backlog/capture-client.test.ts
```

Their explicit programmatic system-boundary substitutions are test seams. No
production CLI or environment option enables those substitutions.

`POST /settle` accepts an original action and atomically reserves a rejected,
non-dispatched outcome if that action has never been reserved. An existing
reservation always wins, including an in-flight or unknown dispatch. Settlement
never executes a tool and prevents any later execution of that action ID.
This lets recovery distinguish a cancelled action from an unknown write without
trusting an agent's assertion that it did not run. Expired actions can be settled;
their structure, digest and tool permissions still have to match.
