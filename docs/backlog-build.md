# Backlog build commands

Run these commands from the code repository root. Each reads one JSON object
from stdin and writes one JSON result to stdout. Use files under `.workspace/`
for inputs. Do not stage those files. Never put a handle or token in artifacts,
issues or PR text.

Every workflow input requires `repository` (the code-host `owner/name`) and
`actor` (the authenticated GitHub login). Obtain those from the code host with
`gh repo view --json nameWithOwner --jq .nameWithOwner` and
`gh api /user --jq .login`. These identify the requested scope; captured facts
must independently confirm the actor. Each issued tool action has a 4500 ms
execution limit, a 1 MiB combined output bound and a three-minute submission
window. A workflow has a one-day bound. An interruption does not undo writes.

## Execute the action loop

A workflow command returns `state: action-required` with a private `workflow`
handle and one `action`. Keep the complete output in `.workspace/`. Write
`{"action": <the exact issued action>}` to a private input file and run
`lets backlog act` with it on stdin. This asks the separately administered
[capture runner](backlog-capture.md) to execute the pinned tool and return
`{"receipt":"<reference>"}`. Do not edit the action or run a parallel write.

Submit `{"workflow":"<original>","actionId":"<issued id>","receipt":"<reference>"}`
to `lets backlog submit`. Lets retrieves the protected capture itself. Repeat
for each next action until `state: complete`, then use its `result` as the
command result in the table below. A tool response pasted by the agent is not
a submission. Missing capture setup fails before any action; do not substitute
a same-account runner or direct provider command.

On uncertain capture, retain the original workflow and action IDs. Run
`lets backlog reconcile` with `{"workflow":"<original>"}` to request fresh
reconciliation reads, then follow the same action/submission loop. Unknown
native state retains the reservation and blocks further writes. Only an applied
or conclusively absent result resolves it. `lets backlog abandon` accepts the
same handle for a read-only workflow; it cannot discard an issued write.

Start `.workspace/backlog-input.json` with those common fields. All other
inputs repeat them. The command table names the additional fields.

| Command | Additional JSON fields | Result |
|---|---|---|
| `lets backlog scope` | none | checked repository/provider/backlog `context` |
| `lets backlog select` | optional `reference`, such as `#136`; omit for next | `context`, provisional `item`, and ranked eligible `candidates`; packet/comment/glossary policy remains pending |
| `lets backlog packet` | scoped `item`, numeric `reference`, or `change` path | normalized `item`, `parent`, `lastEditedAt`, complete `comments` |
| `lets backlog claim` | scoped `item`; optional original `handle` to reconcile an interrupted claim | fresh private continuation `handle` and freshly verified `claim` |
| `lets backlog release` | original `handle` | `released`; requires original local continuation and current native ownership |
| `lets backlog bind` | `handle`, `change` path, explicitly confirmed scoped `item` | immutable versioned identity written to `change/backlog.json` |
| `lets backlog resume` | original `handle`, `change` path | verified recorded `identity` and `handle` |
| `lets backlog reference` | `handle`, `change`, exact PR URL in `reference` | stored PR reference; preserves GitHub closing line |
| `lets backlog complete` | `handle`, active or archived `change`, exact PR URL in `reference` | Done only after code-host merge verification |
| `lets backlog glossary-update` | `handle`, optional bound `change`, complete proposed `body`, stable `mutationId` | item whose only body change is inside its existing Glossary handoff section |

A scoped item is `{"provider":"github","backlog":"<Project node ID>","id":"<issue node ID>"}`.
Copy it from selection or the recorded identity; never replace it with a URL
or issue number. A change path is under this repository's `openspec/changes/`,
including `archive/`. Bind requires an existing change directory. If planning
lives in a separate store, stop before claiming: this release requires the
identity to live under the code repository's change directory and does not
silently write it into another root.

For example, after writing the common fields, select with:

```bash
lets backlog select < .workspace/backlog-input.json
```

After packet and glossary checks, write the selected scoped `item` and common
fields to `.workspace/backlog-claim.json`, then:

```bash
lets backlog claim < .workspace/backlog-claim.json
```

Retain the returned handle in a private input file for bind, resume, release
and handoff. A failed claim can also return `handle`: keep it for reconciliation
or release of proven partial progress. To recover an interrupted claim, first reconcile the outstanding workflow as above, then run
`lets backlog claim` with the original continuation handle: it checks the original key
and freshly verifies ownership before returning. It never creates a new session
for this continuation. Losing it requires manual reconciliation;
an assigned issue is never enough to adopt a claim. The private handle differs from the session and token correlation values. Raw
`request` mutations also require the original private `handle` as a caller-only
field; it is checked locally and omitted from the internal operation envelope.
A new session gets new
authority only through deliberate continuation with the original handle.

`lets backlog request` accepts a full protocol-1 envelope rather than the common
workflow input. It validates current repository selection and runs the operation through the same action/submission boundary. Use it for `candidate.list` when searching
all open scoped packets by title, `relationship.list` for parent/child or
complete directional blocker evidence, and `mutation.read` for an uncertain
mutation's original key and session. Read requests omit `mutationId`; use
`input.mutationId` for reconciliation. The contract defines all envelopes.
Do not issue another mutation while reconciliation is unknown. Applied claim
reconciliation still requires fresh ownership before progression.

Exit 0 means a valid next action, completed result or reconciliation state. Exit 2 means invalid input; exit 1 means another
structured error. Errors contain `category`, `effects`, and `message`.
Effects are none, partial or unknown. Authentication, permission, mapping,
missing trusted tool and identity errors never choose another provider. GitHub
claims are best-effort snapshots; another Project writer can race after a
successful check. Setup and shaping writes are unsupported here.

GitHub needs existing single-select Kind, Priority, Size and Status fields,
with native issue assignees and PR closing links. Private local journals and
explicit continuation handles record attempted operations. No machine-state
Project fields or shared coordinator are required. GitHub cannot distinguish
remote sessions using the same actor or detect reassignment between reads.
Current native ownership and Status must match before progression. Explicit
selection in `lets.backlog` requires provider, versioned definition, id, and complete
native mappings. Missing selection discovers exactly one open linked Project.
No lifecycle operation posts comments or advances shaping's read marker.
