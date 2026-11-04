# Backlog build commands

Run these commands from the code repository root. Each reads one JSON object
from stdin and writes one JSON result to stdout. Use files under `.workspace/`
for inputs. Do not stage those files. Never put a handle or token in artifacts,
issues or PR text.

Every workflow input requires `repository` (the code-host `owner/name`) and
`actor` (the authenticated GitHub login). Obtain those from the code host with
`gh repo view --json nameWithOwner --jq .nameWithOwner` and
`gh api /user --jq .login`. Optional `timeoutMs` sets a positive per-adapter
invocation deadline. GitHub workflow commands default to 180000 to cover
complete verified claims; other providers and the bare transport default to
5000. Larger backlogs can explicitly raise this bounded deadline. An interruption does not undo remote writes.

Start `.workspace/backlog-input.json` with those common fields. All other
inputs repeat them. The command table names the additional fields.

| Command | Additional JSON fields | Result |
|---|---|---|
| `lets backlog select` | optional `reference`, such as `#136`; omit for next | `context`, provisional `item`, and ranked eligible `candidates`; packet/comment/glossary policy remains pending |
| `lets backlog packet` | scoped `item`, numeric `reference`, or `change` path | normalized `item`, `parent`, `lastEditedAt`, complete `comments` |
| `lets backlog claim` | scoped `item`; optional original `handle` to reconcile an interrupted claim | fresh private continuation `handle` and freshly verified `claim` |
| `lets backlog release` | original `handle` | `released`; requires original local continuation and current native ownership |
| `lets backlog bind` | `handle`, `change` path, explicitly confirmed scoped `item` | immutable versioned identity written to `change/backlog.json` |
| `lets backlog resume` | original `handle`, `change` path | verified recorded `identity` and `handle` |
| `lets backlog reference` | `handle`, `change`, exact PR URL in `reference` | stored PR reference; preserves GitHub closing line |
| `lets backlog complete` | `handle`, active or archived `change`, exact PR URL in `reference` | Done only after code-host merge verification |
| `lets backlog glossary-update` | `handle`, `change`, complete proposed `body`, stable `mutationId` | item whose only body change is inside its existing Glossary handoff section |

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
or release of proven partial progress. To recover an interrupted claim, repeat
`lets backlog claim` with that explicit handle: it reconciles the original key
and freshly verifies ownership before returning. It never creates a new session
for this continuation. Losing it requires manual reconciliation;
an assigned issue is never enough to adopt a claim. The private handle differs from the session and token correlation values. Raw
`request` mutations also require the original private `handle` as a caller-only
field; it is checked locally and omitted from the adapter envelope.
A new session gets new
authority only through deliberate continuation with the original handle.

`lets backlog request` accepts a full protocol-1 envelope rather than the common
workflow input. It validates current repository selection and passes the
request to the selected executable. Use it for `candidate.list` when searching
all open scoped packets by title, `relationship.list` for parent/child or
complete directional blocker evidence, and `mutation.read` for an uncertain
mutation's original key and session. Read requests omit `mutationId`; use
`input.mutationId` for reconciliation. The contract defines all envelopes.
Do not issue another mutation while reconciliation is unknown. Applied claim
reconciliation still requires fresh ownership before progression.

Exit 0 means a result. Exit 2 means invalid input; exit 1 means another
structured error. Errors contain `category`, `effects`, and `message`.
Effects are none, partial or unknown. Authentication, permission, mapping,
missing executable and identity errors never choose another provider. GitHub
claims are best-effort snapshots; another Project writer can race after a
successful check. Setup and shaping writes are unsupported here.

GitHub needs existing single-select Kind, Priority, Size and Status fields,
with native issue assignees and PR closing links. Private local journals and
explicit continuation handles record attempted operations. No machine-state
Project fields or shared coordinator are required. GitHub cannot distinguish
remote sessions using the same actor or detect reassignment between reads.
Current native ownership and Status must match before progression. Explicit
selection in `lets.backlog` requires provider, executable, id, and complete
native mappings. Missing selection discovers exactly one open linked Project.
No lifecycle operation posts comments or advances shaping's read marker.
