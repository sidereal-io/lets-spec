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
Lets, stronger GitHub locking, automatic merges, new backend implementations,
committed runner metadata or automatic completion on a terminal-PR stop.

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
`candidate.list`, `item.search`, `item.read`, `relationship.list`, `claim.acquire`, `claim.read`,
`claim.release`, `reference.write`, `completion.write` and `mutation.read`.
The shared inventory retains setup operations for offline conformance, without
exposing their production journey in this slice. The related repository/PR
interface and its migrated callers are specified in section 6. Proposed invocation forms are:

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
of a partial mutation retain the original mutation identity. A continuation file is a scratch handle for the private **recovery record**
that identifies this recorded operation; it is not a remote lock.

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
otherwise `~/.local/state/lets`). One user-configured store is shared by all
local worktrees and agent hosts. Key item operations by backend endpoint,
provider, repository ID, backlog ID and item ID, not checkout path or session.
Discovery operations use their scoped repository key until an item is selected.
Keep worktree and worker provenance as fields. Private-path overrides are
machine-local and must select the same store across these worktrees; no
repository or per-worktree override creates an invisible second journal.
Create directories/files with user-only permissions. Store immutable scope,
original input, definition digest, action/mutation IDs, expected effects,
submissions, accepted transitions and outstanding uncertainty. Do not store
credentials or turn this state into a second backlog.

Serialize local transitions with an exclusive local lock and atomic state-file
replacement. The lock records an owner nonce and process identity. Reclaim a
stale lock only after proving its local holder is gone, using owner checks that
avoid PID reuse. If liveness cannot be established, return a bounded lock-busy
result with a remedy. Never delete a possibly live lock or wait indefinitely. Persist an action as
issued before returning it. There is at most
one outstanding action per operation. A mutation reserves its scoped item in
this shared store before issuance. Every invocation checks that item's pending
operations, regardless of actor, worktree or worker session; another invocation
cannot bypass an uncertain write by creating a new operation ID. Reads needed
for reconciliation remain allowed. Clear the reservation only after validating
effects and durably recording the final transition. After a crash between
persistence and handoff, assume issuance may have happened. A duplicate accepted submission
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
issuing an action. Backend-dependent prerequisites such as login or permissions
are checked through separately bounded preflight reads; these reads require
local safety checks, not the backend condition they are checking. No affected
mutation is issued until those preflight observations qualify. An unwritable default state directory produces a prerequisite
failure naming its path and a machine-local configuration or access remedy.
Do not silently choose a different recovery store. Sandbox access must be
configured explicitly; state-directory access is not an assumed host feature.
After issuance, cancellation, overflow or signal termination preserves unknown
remote effects unless subsequent observations resolve them. A timer does not
prove that detached work stopped.

### 5. Preserve the GitHub lifecycle

| Transition | Required observations and shared decision |
|---|---|
| Discover and select | Repository and linked Project identities, field options and permissions. Resolve one selected Project before writes. |
| Enumerate | Complete candidates, metadata, assignees and directional blockers. Apply shared ranking, packet and glossary policy. |
| Claim a new branch | Fresh assignees and status; bounded assignment and In Progress actions; fresh sole-owner verification. Preserve partial acquisition and the current branch-failure release caller. |
| Resume an existing branch | Skip Claim. Resolve the issue by the existing title/branch rule, check shared pending mutations, and freshly read assignees and status. Continue unfinished work only for the authenticated sole assignee with In Progress. Stop on a mismatch or missing facts without changing assignment or status. |
| Release | Original recovery record and a fresh ownership read before each cleanup write. Never remove another actor's assignment or reset their status. |
| Read merged or rejected PR | Preserve the existing branch-scoped terminal stop. Report merged or rejected and run no step or completion write. Do not infer current work from historical closing PRs. |
| Actual completion request | Retain the shared contract's exact associated merge gate and idempotent recovery in conformance. This does not introduce a production caller at the terminal stop. |

The user explicitly approved the read-only resume check in D14. It implements
ADR-015's accepted ownership rule without a new claim strategy. In particular,
a hand-stacked branch with an unassigned Todo issue pauses and explains that the
issue must be assigned to the authenticated actor alone and be In Progress.
The runner does not repair this mismatch. An existing branch with an open
blocker still follows the current hand-stack path through packet and glossary
checks; before unfinished work, the same read-only ownership check applies.

Keep the runner's existing order: branch lookup, packet and glossary checks,
route, enter or update the branch, and walk. At the start of the walk, check
the tree, then the branch's PR, then the archive. Preserve the existing merged
and rejected stops there. Perform the ownership check only before the first
unfinished step that would continue work, after those stops and the ordinary
record checks. A terminal or entirely finished run does not require assignment
or In Progress and never writes Done. Refresh the ownership check when a later
step would start after a preceding step returns, so an intervening ownership
change stops work. Known unresolved mutation effects still block progression.

Resolve immutable backend IDs on each invocation using scoped `item.read` or
`item.search`. Retain the existing branch title matching and explicit-issue
validation. Carry validated scope in memory and request scratch files, not a
new committed `identity.json`. ADR-017's Git and PR records still determine the
next step. Do not add runner commits, pushes, metadata backfills or a workflow
log. A legacy branch needs no original recovery record for ordinary resume.
It still requires the same fresh read, and public item identity never grants
authority to release a historic claim.

A **worker session** is the contract's worker identity in `context.session`.
Lets-go creates it for its own invocation and uses it for that invocation's
backend operations. It is not a step label or harness session ID. Do not pass
it through delegated step sessions: each step keeps its established report
contract and owns its own bounded calls when needed. Keep original worker
provenance in recovery records rather than adopting it during resume.

The shared store is private to one configured user on one machine. Local
worktrees see pending item mutations through that store. Another machine
cannot see them; fresh native reads guard ordinary resume there, and any known
uncertainty or conflicting observations stop affected progression. A fresh
read cannot prove that an unseen worker with the same actor has stopped.
GitHub assignment remains best-effort and supplies no exclusive remote lock.

### 6. Replace callouts without adding workflow policy

Keep the eleven runner parts and five step skills. Backlog calls use the
selected backlog definition. Repository and PR calls use a selected code-host
definition and the same core bounded-action, submission and recovery engine.
The code-host definition supplies merge facts for any shared completion checks;
it need not be the backlog provider. Offline Jira, Linear and Beads profiles
can therefore pair with GitHub code-host fixtures. Neither definition becomes
a runner, an executable adapter or a plugin loader.

Repository selection under `lets.backlog` may name a `codeHost` object with
`provider`, `definition` and repository scope. GitHub is the validated default
for this GitHub journey. Machine-local connection options for that role live
under `backlog.codeHost` in the existing user config, separately from backlog
tool selection. Validate consumed keys, versions and scopes before actions;
invalid explicit selection never falls back. The code-host definition uses
the same inert definition schema. Authentication stays with its CLI/MCP tool.

The target commands are `lets codehost repository.read`,
`lets codehost pull-request.read`, `lets codehost pull-request.create`,
`lets codehost pull-request.update` and `lets codehost pull-request.ready`.
Each takes `--request-file .workspace/codehost-request.json`. They return the
same action/result states as backlog commands. Submission and recovery use
`lets backlog submit` and `lets backlog resume`, whose continuation binds the
role and definition; these names do not route code-host facts to a backlog
provider. No command merges a PR. No tool is invoked directly by the core.

Code-host requests carry `contractVersion`, `operation`, `context` and `input`.
Context binds the exact repository, authenticated actor, worker ID and selected
code-host role. A PR read takes either an exact PR ID or a branch name within
that repository, never both; zero branch matches returns absent and multiple
matches returns ambiguity. Create takes title, body-file reference, base and
head refs; update takes exact PR identity and prepared body-file reference;
ready takes exact PR identity. Validate file bounds and bind the content digest
before issuing a write. Every PR result binds its repository and immutable PR
ID. Structured failures distinguish absent PRs, authentication and unavailable
facts; a failed read is never treated as absent. The common action envelope
adds the operation/action/attempt correlation and limits described above.

| Current callout | Replacement and required result |
|---|---|
| Default repository and branch | `repository.read`: exact repository ID, owner/name, URL and default branch. Local branch operations remain Git. |
| Branch issue search, idea and discovery search | `item.search`: scoped state/title/body filters, complete matching items and their IDs. Preserve the existing exact prefix and discovery Input matching in shared policy. |
| Packet, Project fields, issue date and parent body | `item.read`: scoped identity, body, timestamps, Kind/Priority/Size/Status, assignees and parent. Parent body is a separate scoped item read. No fixed 500-item Project scan remains in Confirm the packet. |
| Thread freshness and glossary handoff | `item.read` and `relationship.list`: bounded comment/edit observations and complete parent/child/blocker data; code-host `pull-request.read` supplies prerequisite PR facts. Preserve ADR-012's evidence-only comments. |
| PR state, URL, body, base, head and merge facts | `pull-request.read`: exact repository/PR identity or unambiguous branch lookup, state, draft flag, body, URL, base/head refs and SHAs, merge ref/commit when applicable. No historical closing-PR scan is added. |
| Draft PR created during planning | `pull-request.create`: existing title/body/base/head inputs and returned exact identity/URL; preserve `Closes #<n>` and user-owned merge. Reconcile uncertain creation before retry. |
| Plan/build review body sections | `pull-request.update`: exact PR and prepared body-file input. Preserve other sections and closing text using the existing fresh-read-and-replace procedure. Reconcile uncertain writes. |
| Ready for review | `pull-request.ready`: exact PR identity, bounded ready action and fresh draft-state confirmation, owned by lets-review-build. |

The `pull-request.read` projection reports unavailable fields explicitly.
Merge fields are required only for an operation that needs merge proof, not for
the existing MERGED terminal message. A PR missing its expected closing text is
reported by the existing planning/review rules; do not introduce a new runner
stop or association operation before the next step. GitHub `reference.write`
in shared conformance validates the supplied association and performs no remote
write. The step that creates or edits the PR still owns its closing text.
A feature-branch merge does not prove issue completion; the existing merged
message is not a claim that Project status is Done. Users retain the existing
native closing and Project automation behavior.

Inventory every callout reachable from the existing-story path: lets-go and its
references, lets-plan, lets-build, lets-review-plan, lets-review-build and the
schema instructions that open the draft PR. Replace the relevant read/write
instructions and exact-string tests together. The owning step may perform its
existing code-host action; it never gains claim or workflow sequencing policy.
No hard-coded `gh` dependency remains in this journey, including packet and
parent reads. A selected CLI definition may use `gh`; a compatible MCP-only
configuration must not require it. Both required agent hosts use this interface.

Setup and shape production mutations, independent collaborator-PR review and
delegation resolver migration remain outside this existing-story slice. Keep
their behavior in the shared inventory and do not claim those callers have
migrated. Idea/needs-shape routes keep their current handoff to shaping rather
than disappearing or gaining a new stop. Future caller migration must preserve
the same shared contract and current owner; no competing PR is created here.

### 7. Migrate behavioral conformance without importing the prototype

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
stop affected uncertain mutations with an explicit incompatibility or
reconciliation remedy. Ordinary legacy resume without a journal instead uses
the fresh-read binding rule above; absence of a journal alone is not a blocker. New journal schemas reject unsupported
versions without overwriting data.

Rollback restores the prior software/configuration with private state retained
for reconciliation; it never undoes or repeats backend effects automatically.
An outstanding new-format operation requires reconciliation before using an older
runtime. No automatic downgrade or backend rollback is promised.

Later live acceptance uses fresh items only in `mstelz/test-repo-pls-ignore` and
https://github.com/users/mstelz/projects/7. Exercise both required environments
through their actual configured tools, with recorded versions/configurations,
including interrupted claim recovery, read-only existing-branch resume,
review/PR writes and the existing terminal stops. Exact-merge completion
remains covered by the shared offline contract; this plan adds no live
completion caller to lets-go. Verify each
host's command timeout/output limits and writable shared private-state location;
record an actionable preflight failure if either is unavailable. A merge remains
an explicit user action. Historical fixtures/PRs cannot be replayed or mutated.
The old prototype's passing checks do not qualify this replacement.

## Review corrections

D13 removes the added terminal-completion path and committed identity file.
D14 resolves the hand-stack ownership conflict with a read-only check, not an
automatic claim. Round-two findings and their disposition are in research.md.
The plan still requires independent review; prior REVISE verdicts are not
approval or permission to implement or publish.
