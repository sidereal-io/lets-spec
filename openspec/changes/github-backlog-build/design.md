## Context

Main has an offline executable-adapter contract and simulation harness, not the
production request/result runtime described here. The old #172 implementation
is reference material: it still requires a withdrawn capture service. No code
has been imported from it. ADR-015, amended by the user's D10 decision, accepts
submitted tool observations; ADR-020 keeps lets-go as the sole runner.

This design is a replacement plan for #136 / draft #172. It covers existing
GitHub stories. Setup/shaping writes, other production providers and delegation
runtime migration remain outside this slice. Shared conformance must retain
those providers' behavioral coverage without claiming they are implemented.

## Goals / Non-Goals

**Goals:** one bounded agent-executed path for shipped/custom definitions;
explicit integration configuration usable from unchanged T3 and standalone
coding-agent CLIs; checked output translation; durable private recovery; native
best-effort GitHub ownership; exact associated merge before completion.

**Non-Goals:** a capture runner or service, independent output authentication,
T3 changes, another runner, a plugin loader, backend calls executed directly by
Lets, stronger GitHub locking, automatic merges, or new backend implementations.

## Test Seams

- **Primary test seam:** drive a backlog operation through issued action,
  simulated tool submission and the next observable policy result. Reuse
  `tests/lets/backlog/` operation fixtures and behavior inventory.
- **Existing seams reused:** temporary private-state directories for restart
  and crash cases; `tests/skill-interfaces.bats` for sole runner/instruction
  ownership; existing release checks for consumed runtime/definition contents.
- **Live qualification:** after implementation, exercise actual configured tools
  from both required environments in the designated fresh live scope. Offline
  doubles prove contract behavior, not real tool compatibility or provenance.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** public backlog transport/configuration, provider authoring,
  external mutations, recovery data, workflow instructions and release contents.

## Decisions

### 1. Keep one action/submission path

A backlog command checks local prerequisites and records an operation, then
returns either a completed result, a bounded action for the agent, or a typed
stop/recovery result. Each submission resumes that operation; Lets decides
whether another action is needed. The agent never runs an entire provider
workflow from one request. Lets-go consumes this boundary and remains responsible
for the surrounding parts and steps.

The target CLI accepts the supported operation name followed by a JSON request
file. This includes `backlog.list`, `backlog.check`, `capability.read`,
`candidate.list`, `item.read`, `relationship.list`, `claim.acquire`, `claim.read`,
`claim.release`, `reference.write`, `completion.write` and `mutation.read`.
The shared inventory retains setup operations for offline conformance, without
exposing their production journey in this slice. Proposed invocation forms are:

```bash
lets backlog candidate.list --request-file .workspace/backlog-request.json
lets backlog item.read --request-file .workspace/backlog-request.json
lets backlog relationship.list --request-file .workspace/backlog-request.json
lets backlog claim.acquire --request-file .workspace/backlog-request.json
lets backlog claim.read --request-file .workspace/backlog-request.json
lets backlog submit --continuation-file .workspace/backlog-continuation.json --submission-file .workspace/backlog-submission.json
lets backlog resume --continuation-file .workspace/backlog-continuation.json
```

These are interfaces to implement, not commands available on main. Requests carry
operation inputs and scoped identity; no shell interpolation carries JSON.
`--request-file -` and `--submission-file -` accept stdin. Submit requires the
original `--continuation-file` independently of the submitted JSON, so even a
malformed submission can be recorded against its issued action. Resume reads private
operation identity from the continuation file and emits bounded reconciliation
reads or a typed result; it never silently repeats a write. Structured stdout
contains `contractVersion`, `operationId` and `state`, whose values are `action`,
`complete`, `needs-reconciliation` or `failed`. An `action` response carries the
scoped action and its definition; `complete` carries the validated operation
result; the other states carry typed reasons, effects and known remote IDs.
Diagnostics go to stderr. No response itself executes a provider tool.

Skill-interface checks look for the literal `lets backlog backlog.list`,
`lets backlog backlog.check`, `lets backlog candidate.list`,
`lets backlog item.read`, `lets backlog relationship.list`, `lets backlog claim.acquire`,
`lets backlog claim.read`, `lets backlog submit` and `lets backlog resume` in
their owning lets-go procedures or shared action loop. They also check the
`--request-file`, `--submission-file` and `--continuation-file` forms above.
Provider-specific commands belong in the definition, never this loop.

Separate action identity, stable mutation identity and attempt identity. Bind
the request to exact input, operation, definition version/content digest,
provider, repository/backlog/item IDs, actor/session, allowed effects, required
capabilities, issue/expiry times and execution/output limits. Subsequent steps
of a partial mutation retain the original mutation identity. A private
continuation identifies this recorded operation; it is not a remote lock.

A single request/result path follows amended ADR-015. A direct executor fallback
would duplicate provider behavior. A generic capture MCP host would add another
runtime dependency the selected trust contract no longer needs.

### 2. Translate known tool output into a checked contract

The provider definition is inert versioned data. For each supported operation
it describes CLI/MCP tool usage, parameters from the scoped action, prerequisites,
structured output shape, normalized-field mappings and capability limits.
Use a closed declarative projection vocabulary: JSON field paths, array maps,
array selection by equality to scoped IDs, enum maps, tagged unions and explicit
null handling. Bind connection results to `pageInfo`, cursors and `totalCount`
where available; reject contradictory or missing coverage. Unknown projection
operators fail at definition load. No evaluated scripts, shell evaluation by
Lets, load hooks or arbitrary expressions are supported. These mappings derive
the normalized contract in Lets. Agent-supplied normalized data is optional;
when supplied, it must agree with that derivation. Definitions describe backend
translation while core validators own policy and operation semantics.

The shipped GitHub definition uses structured `gh api graphql` queries and
mutations. Do not use `gh project item-list --limit` as proof of complete paging.
Select the configured Project within field-value arrays, handle union/null
values explicitly and traverse each required nested connection. Use submitted
GraphQL `errors[].type` for declared typed-error mappings. Missing or unrecognized
structured errors stay unknown; never derive permission or effect certainty by
matching stderr words. A mutation error can coexist with partial data, so its
category alone cannot establish effects none. Test the shipped definition with
scrubbed real response shapes, including nulls, partial data and nested pages.
These fixtures qualify translation, not live support.

Submissions bind action and attempt identity, reported tool name and arguments,
backend and actor scope, execution outcome and relevant structured output.
They may supply bounded inline output or explicit local `outputFiles` whose
bytes Lets reads as untrusted submitted data. Ordinary shell redirection to
`.workspace/` avoids transcription or harness display truncation. File references
supply no independent provenance. Reject unreadable, changed-during-read or
oversized files and missing required fields. Do not read arbitrary URLs or
follow a definition's request to fetch a result. MCP output can use the same
file form when the host exposes a saved result; otherwise page into bounded
inline submissions. A tool that exposes neither complete form is unavailable
for that action.

Lets stamps issuance and receipt times and checks that the result arrives within
the action's finite acceptance window. It does not demand agent-invented exact
start, end or collection times. Optional observed times cannot override local
receipt time. A fresh verification read must be a new action for the current
transition. This is a trust-based freshness check, not proof that old output
was not replayed by an agent. Read tool versions through preflight when exposed;
MCP server version may be `unreported` if output shape and declared capabilities
qualify. A definition that requires a specific version must prove that
prerequisite or fail, rather than guess it.

Core validators check exact action, input and scope; contract and definition
compatibility; bounds; projection agreement; outcome and effects; scoped IDs;
page and blocker coverage; ownership/status; and exact PR merge data. Required
output cannot be replaced with a receipt ID, screenshot, summary or bare success
assertion. Redact secrets without removing required validation fields; if those
fields cannot be supplied, return insufficient data rather than infer success.

**Trust limit:** these are checks of submitted observations. Lets does not
retrieve an original record independently, authenticate that a call occurred,
or detect plausible fabrication of both output and normalized data. Both hosts
use this same guarantee. This is the user-approved amendment to ADR-015, not an
independent-capture design disguised as adapter translation.

### 3. Configure the integration, independent of agent host

Repository `openspec/config.yaml` owns `lets.backlog.version: 1`, provider and
definition selection, one backlog scope, field/status mappings and any local
storage/tracking policy. Default selection is the shipped GitHub definition;
multiple linked Projects still require explicit selection. A selected Project
is checked against the repository before item operations.

The existing user config owns machine-local options under the backlog command
group: explicit CLI/MCP tool selection, connection names/endpoints and private
state location. Authentication stays with the selected tools. Definition schema
1 declares its stable name/version, supported operation-contract versions,
backend/tool versions and operation mappings. Shipped definitions and explicitly
named custom file sources use the same loader and validators. Relative custom
paths resolve from the owning config file; record the resolved source and digest
in the operation. Do not search PATH for adapters. Ordinary CLI tool lookup is
separate. Changing a definition during a pending mutation requires reconciliation
using its recorded definition; it does not reinterpret old results under new maps.

Consumed objects reject unknown/misplaced selection keys, duplicate/conflicting
sources, unsupported versions and obsolete executable settings before mutation.
Unrelated future user options retain their established tolerance. Errors name
the file/key and migration remedy. No invalid explicit selection falls back.

The shipped GitHub definition describes structured `gh api graphql` output; compatible
custom definitions may describe available MCP tools. A T3 agent can use its
configured CLI or MCP tools just as a standalone agent can. Neither a T3 host
API nor T3 itself is a backlog provider. Validate tool availability, login,
permissions and required bounds through local checks and bounded submitted
preflight reads. Do not claim that a config key alone makes a tool compatible.

### 4. Journal before issuance and reconcile uncertain effects

Use versioned private state under the user's state directory (XDG state home,
otherwise `~/.local/state/lets`), partitioned by canonical repository/worktree
identity and session. Explicit private-path overrides stay machine-local.
Create directories/files with user-only permissions. Store immutable scope,
original input, definition digest, action/mutation IDs, expected effects,
submissions, accepted transitions and outstanding uncertainty. Do not store
credentials or turn this state into a second backlog.

Serialize local transitions with an exclusive local lock and atomic state-file
replacement. The lock records an owner nonce and process identity. Reclaim a
stale lock only after proving its local holder is gone, using owner checks that
avoid PID reuse. If liveness cannot be established, return a bounded lock-busy
result with a remedy. Never delete a possibly live lock or wait indefinitely. Persist an action as issued before returning it. There is at most
one outstanding action per operation. After a crash between persistence and
handoff, assume issuance may have happened. A duplicate accepted submission
returns the recorded acknowledgement without advancing twice; a conflicting
reuse after acceptance fails. Record every submission attempt. A rejected read
submission can be corrected at most twice within the original deadline; changing
the tool or actual read requires a new action. A rejected write submission moves
the mutation to unknown effects immediately; corrected or late output can aid
reconciliation but cannot reauthorize the write. Exhausted read attempts return
a typed failure. Stale/late results can supply reconciliation data
but cannot reactivate expired permission. Local locking offers no remote lock
and no protection against a malicious agent editing private state.

Unknown/partial writes block new writes and work progression. Resume binds a
fresh read to the original mutation and compares native state with recorded
input, effects and deduplication data. It returns applied, demonstrably absent,
partial or unresolved under operation policy. Missing results, expiry and an
agent's no-dispatch assertion alone never establish effects none. A structured
pre-dispatch failure may establish none only when its supplied execution outcome
supports that classification. For an issued `gh` mutation, treat an unstructured
failure as unknown. Only validated structured facts proving no mutation occurred
may establish none; an error category or stderr alone cannot. Do not infer
categories from error-message words.
If observations cannot resolve the original write, stop with known IDs/effects
and bounded reconciliation choices; do not recreate or retry blindly.

Finite core expiry controls acceptance, not the lifetime of remote work. Each
definition must declare tool timeout/cancellation and output limits sufficient
for the requested action. If unavailable, report unsupported before issuance.
For the shipped `gh` path, use the configured harness command timeout and output
limit, declared during preflight; do not assume `gh` has a timeout option or that
GNU `timeout` exists. Host expiry bounds waiting and result acceptance, not
remote execution. If the host cannot supply the required call bound, fail the
prerequisite. No root installation or host patch is needed by this contract.
Check private-state create, lock, atomic replace and durable write access before
issuing an action. An unwritable default state directory produces a prerequisite
failure naming its path and a machine-local configuration or access remedy.
Do not silently choose a different recovery store. Sandbox access must be
configured explicitly; state-directory access is not an assumed host feature.
After issuance, cancellation, overflow or signal termination preserves unknown
remote effects unless subsequent observations resolve them. A timer does not
prove that detached work stopped.

### 5. Preserve the GitHub lifecycle

| Transition | Required submitted observations and core decision |
|---|---|
| Discover/select | Repository and linked Project identities, field IDs/options and permissions. Resolve one Project and validate mappings before writes. |
| Enumerate | All candidate pages, required metadata, assignees and complete directional blocker reads. Reject gaps, repeated/inconsistent cursors and missing fields. Apply shared readiness/ranking; do not delegate policy to the definition. |
| Claim | Fresh current assignees/status, bounded assignment write, bounded In Progress write, then fresh sole-owner/status read. Each write has its own action; partial acquisition remains visible. |
| Work/resume | Immutable item identity plus original private continuation and a new ownership/status read. Existing branches and old claims provide no current authority. |
| Release | Recorded session provenance and a fresh read before each cleanup write. Remove only this claim's owned state; competing ownership stops cleanup. Branch-creation failure uses the same bounded release path. |
| Associate PR | Exact repository/PR identity and native closing relationship to the immutable issue. Preserve branch/stack semantics; a textual mention alone is insufficient. |
| Complete | Fresh exact associated PR merge facts, merged reference/commit and required native closing relationship. An unmerged or unrelated PR cannot authorize Done. If native automation already completed the item, return success without another write. Otherwise request only the needed status update and validate its result. |

GitHub ownership is best-effort at the authenticated actor level. Assignment and
status updates are not atomic. A fresh sole-assignee read can still race with
another worker. GitHub cannot distinguish two sessions using the same actor;
private session provenance prevents accidental local adoption but cannot invent
that remote distinction. No release clears a competing actor or claims stronger
locking. Completion never issues a merge. Archive/readiness leave work In
Progress pending the required merge observations.

Committed change metadata contains only immutable provider/repository/backlog/item
identity and useful references. Private continuation/journal details travel in
private step context; they never enter the packet or committed planning artifacts.
Absent continuation or conflicting scope produces a stop result, not adoption by
item number. Each step returns its established report; only lets-go decides what
step follows. Setup/shaping writes remain with their existing owners.

### 6. Migrate behavioral conformance without importing the prototype

Trace each existing inventory scenario to policy, translation, result validation
and recovery checks. Replace executable stdin/exit/signal supervision cases with
unavailable-tool, malformed/mismatched submission, expiry, overflow and uncertain
termination cases. Retain all four offline provider profiles and their native,
emulated or unsupported declarations. GitHub is this slice's production target;
other profiles are not support claims. Keep setup/create operation semantics in
the shared contract without adding their production journey to this slice.

Release only consumed core runtime and production definitions. Remove unused
adapter-executable bundles, keep conformance fixtures/source out of runtime, and
declare external tools separately. Update authoring/configuration documentation
and lets-go instructions for the new boundary. Do not scatter GitHub command
recipes through step skills. Full repository checks and release inspection are
required before a later push; fresh live acceptance is additional evidence.

## Risks / Trade-offs

- [Submitted observations may be fabricated] → Document the trust assumption;
  do not claim authentication or write tests that promise fabrication detection.
- [Tool schemas/version drift] → Pin declared compatibility and fail required
  mapping checks; do not guess missing fields.
- [Pagination or blocker gaps cause false readiness] → Check explicit page and
  relationship coverage before ranking or claim.
- [Same-actor races and partial writes] → Keep best-effort labeling, fresh reads,
  original mutation identity and conservative reconciliation; no invented lock.
- [Prototype reuse imports rejected assumptions] → Evaluate each retained unit
  against these artifacts; remove unconditional service config/socket use.
- [Large migration hidden by passing fixtures] → Preserve traceable inventory
  and review task sizing before implementation; separate automated and live proof.

## Migration & Rollback

Keep #136 / #172 as the delivery owner and #172 draft. This local worktree
contains planning only. After plan agreement, reconcile these artifacts onto
that existing branch, replacing the active plan and marking rejected service
material obsolete. #136 now carries the GitHub request/result contract, caller and packaging
migration previously assigned to #180. Do not implement that migration twice.
At the later agreed handoff, use lets-shape to revise or close #180 as appropriate
and preserve any remaining distinct scope. This restart makes no issue or Project
change and creates no competing PR. No push, remote rewrite or Project mutation is part of this restart.

Implement from main under the reviewed plan. Reuse old code only after checking
it against the new contract. Remove the unconditional `/etc/lets/capture-client.json`
and protected-socket requirement; do not enable its installer. Reject legacy
executable configuration with migration guidance. Unknown legacy prototype
journals are not automatically replayed or reinterpreted: retain them privately,
stop with an explicit incompatibility/reconciliation remedy and require fresh
native reads before any continued work. New journal schemas reject unsupported
versions without overwriting data.

Rollback restores the prior software/configuration with private state retained
for reconciliation; it never undoes or repeats backend effects automatically.
An outstanding new-format operation requires reconciliation before using an older
runtime. No automatic downgrade or backend rollback is promised.

Later live acceptance uses fresh items only in `mstelz/test-repo-pls-ignore` and
https://github.com/users/mstelz/projects/7. Exercise both required environments
through their actual configured tools, with recorded versions/configurations,
including interrupted claim/recovery and merge-gated completion. Verify each
host's command timeout/output limits and writable shared private-state location;
record an actionable preflight failure if either is unavailable. A merge remains
an explicit user action. Historical fixtures/PRs cannot be replayed or mutated.
The old prototype's passing checks do not qualify this replacement.

## Pending user decisions after plan review

The first independent review found two blocking workflow gaps. They remain open
pending the user's answers; the existing clauses above are not a resolution.

- **C1, resume authority and recovery visibility:** decide whether committed
  identity plus fresh sole-owner/In Progress observations permits a new worker
  session to resume, while private continuation remains required for uncertain
  mutation recovery and release. The proposed correction shares item-keyed
  outstanding mutation state across local worktrees, rather than partitioning
  blocking by session. Cross-machine state visibility remains limited.
- **C2, completion caller:** decide whether lets-go associates a PR when it
  exists and invokes exact-merge completion on the next explicit run after merge.
  That changes the current merged-PR stop path without adding a new runner or
  automatic merge. The alternative removes Lets-owned completion from scope.

Do not implement, claim review approval or start a second review until these
choices are settled and reflected across specs, design, ADR assessment and tasks.
