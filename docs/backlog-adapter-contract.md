# Backlog action and result contract

Lets owns backlog policy and sequencing. A selected definition translates a
bounded fact request into inert tool input. The agent executes the issued
action through the protected runner and submits its capture reference. Lets
retrieves the original capture independently before it accepts backend facts.
[ADR-015](decisions/ADR-015-lets-requests-actions-and-validates-results.md)
supersedes the former executable adapter boundary.

Shared meanings are in the [project glossary](../openspec/glossary.md).
[Build commands](backlog-build.md) describe the agent loop;
[capture deployment](backlog-capture.md) describes the required trust boundary.
The current implementation covers existing GitHub items. Setup, shaping writes,
other providers and delegation runtime migration remain separate work.

## Responsibilities

| Behavior | Owner | Required result |
|---|---|---|
| Project discovery | Lets, using captured definition facts | Enumerate open Projects linked in either direction and deduplicate; require exactly one unless explicitly configured. |
| Field validation | Lets | Validate complete Kind, Priority, Size and Status mappings; preserve unrelated fields and options. |
| Item search | Lets, using captured definition facts | Complete scoped issue body, parent, comments, owners, metadata and directional blockers; detect incomplete or repeated cursors. |
| Ready-work ranking | Lets and the calling skill | Exclude foreign, non-Todo, Epic, Wont, assigned and blocked items; rank Must, Should, Could, then numeric GitHub issue reference. Packet and glossary checks precede claiming. |
| Claim | Lets | Bound native assignee/Status writes, preserve original private continuation, verify current native ownership, and stop on uncertainty. |
| Release | Lets | Undo only the original current claim; preserve replacement owners and partial-effect uncertainty. |
| Project creation | setup/shaping | Remains in the setup skill, outside this existing-item runtime. |
| Item creation | setup/shaping | Shaping owns issue creation, packet decisions and parent relationships. |
| Targeted update | Lets | Limit build body changes to Glossary handoff and preserve unrelated text and native data. |
| Parent-child links | Lets / shaping | Captured reads are complete; shaping owns link writes. |
| Directional blockers | Lets / shaping | Complete captured blocked-by reads govern readiness; shaping owns writes. |
| Packet validation | lets-go | Require complete Kind-specific lines and human judgment of comments. |
| Schema routing | lets-go | Retain Chore/small-change routes and new-code/shared-decision exceptions. |
| Pull request references | Lets / code host | Code host owns PR creation; Lets checks exact native closing links and association. |
| Planning/build | lets-plan / lets-build | Plan and implement the recorded scoped identity on its branch. |
| Review/archive/readiness | lets-review-build | Review, verify, archive and mark ready; retain In Progress. |
| Merge | User | Merge explicitly; readiness is insufficient. |
| Completion | Lets | Require exact associated PR, complete native closing links, captured merged state and exact merge commit before Done, including already-Done and reconciliation paths. |
| Glossary handoff | Calling skill and Lets | Preserve owner/checkpoint decisions and Git verification; bound body edits to the existing Glossary handoff section. |

## Configuration and definitions

`lets.backlog` in `openspec/config.yaml` is one object. Omission selects the
shipped GitHub definition and discovers one linked open Project. An explicit
selection requires provider, versioned definition, one backlog ID and all
metadata mappings:

```yaml
lets:
  backlog:
    version: 1
    provider: github
    definition:
      name: github
      version: 1
      # source: integrations/github.json # optional custom JSON, relative to repo
    id: PVT_example
    mappings: # complete Kind/Priority/Size/Status mappings; see items.ts
```

The production loader consumes both shipped and custom definitions through the
same validation path. Unknown settings, obsolete `executable`, incompatible
versions/provider, incomplete mappings and missing trusted tools fail without
fallback. Credentials and tool registration belong to protected administrator
configuration, never repository definitions or environment overrides.

A definition contains `version`, `name`, `provider`, `contract`,
`backendVersions` and the complete `facts` inventory. Each fact names a logical
`tool`, its core-checked `mode`, an input template and a capture-result mapping.
The shipped catalog is `lets/src/backlog/definitions/github.json`.

Templates construct objects/arrays from constants and JSON pointers:
`{"$input":""}` selects scoped inputs; `{"$path":"/data"}` selects captured
response data. Result mappings may construct objects or use
`{"$each":{"path":"/nodes","template":{"id":{"$path":"/id"}}}}`.
Every result leaf must come from capture; literal ownership, permission or merge
values are rejected. Missing pointers fail. Bounds limit template depth,
node count, arrays and output. No imports, executable expressions, shell text,
policy fields or trust declarations are accepted. Contract v1 fixes mutation
input templates to the shipped bounded GitHub shapes: a custom definition
cannot redirect a mutation or replace its scoped inputs.

## Actions and submissions

An issued action includes version, opaque ID, workflow, sequence, fact name,
provider/repository/actor/session/backlog scope, pinned tool identity and argv,
exact stdin, read/write mode, issue/expiry times, timeout, output bound and a
canonical digest. It permits one exact operation. Lets reconstructs the expected scope/input and compares it with the
independently captured request; editable journals cannot supply backend facts.

A workflow returns either:

```json
{"state":"action-required","workflow":"<private>","action":{"version":1,"id":"<action>","...":"bounded action fields"}}
```

or `{"state":"complete","result":{...}}`. Submit only
`{"workflow":"<private>","actionId":"<action>","receipt":"<reference>"}`.
A copied capture body is rejected. Submission checks exact original action,
tool/authentication context, stdin, timing, dispatch, output bytes and exit
state. Malformed, replayed, late, mismatched, unavailable or incomplete capture
cannot authorize progression. A rejected action with independently proven
no dispatch has no effects; otherwise uncertainty remains conservative.

Private workflow checkpoints retain the original input, configuration digest,
action descriptors and capture references. An OS file lock serializes active
callers; a durable reservation survives command exits and crashes. Transaction
checkpoints are replayed idempotently after interruption. Replay retrieves
protected historical capture again rather than treating editable cached results
as evidence. Historical expiry does not turn accepted capture into a new
submission. New actions and final ownership/merge checkpoints require fresh
capture. Changed selection or definition pauses the original workflow.

An uncertain write retains its reservation. Explicit reconciliation uses the
original mutation journal and separately identified read actions. It cannot
issue a new write or borrow another worker's provenance. Applied or conclusively
absent native evidence resolves it; partial state remains unknown. A read-only
workflow can be abandoned with its original private handle. Issued writes
cannot be abandoned to bypass reconciliation.

## Native GitHub lifecycle

The internal operation schema remains in `protocol.ts`: backlog discovery and
checks; item search/read; candidate, capability and relationship reads; claim
acquire/read/release; reference/completion writes; limited item body update;
and mutation reconciliation. Setup/shaping creation operations report
unsupported. Raw request mutations require the original private continuation
handle in addition to their operation scope and mutation key.

Item identity is `{provider,backlog,id}`. Display references, URLs, titles and
branch names cannot replace it. `backlog.json` records immutable versioned
identity with the change and survives archive. A legacy change requires explicit
binding to a confirmed identity and original continuation, never title matching.

GitHub claims use native assignees and Project Status. Acquire rejects any
assignment, including the same actor. Original private actor/session/token intent
plus fresh sole actor assignment and In Progress are required before work.
Release checks ownership between effects and preserves replacement owners.
Local journals describe attempted operations; they do not prove remote ownership.

GitHub has no remote session primitive. These are actor-level best-effort
snapshots: two sessions sharing an account and reassignment between reads cannot
be distinguished. There are no coordinator branches or machine-state Project
fields. The protected capture service attests executed requests and responses;
it does not strengthen GitHub's concurrency primitive.

A PR association requires the exact native closing-issue link in the recorded
repository. Completion verifies the exact associated PR URL, merged=true and
nonempty matching merge commit through captured reads inside the core, including
raw requests and reconciliation. Readiness and archive leave In Progress.
No lifecycle operation posts comments or advances shaping's read marker.

## Verification and limits

`pnpm test:backlog` covers the action/submission contract, definition loader,
configuration, durable reservations, protected runner/client and native lifecycle.
Socket/process fixtures and the older generic executable simulations are offline
tests. The latter retain domain-conformance coverage; they are not installed
providers or production transports. Runtime bundles exclude unused kit source.

Production qualification additionally requires the deployed independent account,
protected setup/socket/credentials, immutable executable, actual authentication
context, fresh scoped claim/release evidence, fault recovery, complete pagination,
unrelated-data preservation and exact merged-PR evidence. Historical executable
acceptance does not qualify this port. An agent-editable report, private journal,
local signing key or same-account runner cannot substitute for this evidence.
