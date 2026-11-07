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

The target CLI surface is `lets backlog <operation>` to begin a supported
operation, `lets backlog submit` to consume a structured submission, and
`lets backlog resume` to inspect/reconcile a private continuation. These are
proposed interfaces to implement, not commands available on current main.
Submissions use JSON input through a file or stdin rather than interpolated
shell arguments. Responses use versioned structured JSON, with diagnostics on
stderr. Resume emits reads or a stop result; it never silently repeats a write.
Only the supported core operation inventory is accepted; arbitrary provider
commands are not a public operation.

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
Use explicit JSON field paths and enum/value maps for machine-checkable
projections; no evaluated scripts, shell evaluation by Lets, load hooks or
arbitrary mapping expressions. The agent uses the description to execute the
call and populate the operation-specific normalized result. Lets applies the
same declared projections and compares required fields against supplied output.
An unsupported output shape needs an actionable compatibility error, not a
successful parse of an invented normalized result.

The submission includes matching action/attempt identity; actual reported tool
name/server or CLI and version; arguments; actor/backend/scope; start/end and
collection times; exit/termination or MCP error outcome; relevant structured
output; normalized data or typed error; effect certainty and remote IDs. Arrays
and paginated reads retain page/cursor relationships and the fields needed to
check coverage. Required output cannot be replaced with a receipt identifier,
screenshot, summary or a bare `success: true`. Exclude credentials and unrelated
output; redact secrets without removing fields needed for validation. Overflow
or redaction of required fields yields insufficient data, never inferred success.

Core validators check the envelope and operation data: exact action/input/scope,
version compatibility, bounded sizes, deadlines, source-field agreement,
noncontradictory outcome/effects, scoped identities, pagination, directional
blockers, ownership/status and exact PR merge data. Fresh verification reads are
new actions issued for the current transition; historical journal entries do
not qualify. Submitted collection time must fall within the read action window.

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

The shipped GitHub definition describes structured `gh` output; compatible
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
replacement. Persist an action as issued before returning it. There is at most
one outstanding action per operation. After a crash between persistence and
handoff, assume issuance may have happened. A duplicate accepted submission
returns the recorded acknowledgement without advancing twice; a conflicting
reuse of an action ID fails. Stale/late results can supply reconciliation data
but cannot reactivate expired permission. Local locking offers no remote lock
and no protection against a malicious agent editing private state.

Unknown/partial writes block new writes and work progression. Resume binds a
fresh read to the original mutation and compares native state with recorded
input, effects and deduplication data. It returns applied, demonstrably absent,
partial or unresolved under operation policy. Missing results, expiry and an
agent's no-dispatch assertion alone never establish effects none. A structured
pre-dispatch failure may establish none only when its supplied execution outcome
supports that classification. Do not infer categories from error-message words.
If observations cannot resolve the original write, stop with known IDs/effects
and bounded reconciliation choices; do not recreate or retry blindly.

Finite core expiry controls acceptance, not the lifetime of remote work. Each
definition must declare tool timeout/cancellation and output limits sufficient
for the requested action. If unavailable, report unsupported before issuance.
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
material obsolete. Do not create a second PR or silently include #180's work
under competing ownership. Coordinate its migration responsibility in the same
handoff. No push, remote rewrite or Project mutation is part of this restart.

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
including interrupted claim/recovery and merge-gated completion. A merge remains
an explicit user action. Historical fixtures/PRs cannot be replayed or mutated.
The old prototype's passing checks do not qualify this replacement.
