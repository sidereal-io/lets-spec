# Backlog adapter contract Specification

## Purpose

Define the shared backlog adapter boundary and its conformance guarantees, preserving the GitHub workflow while accommodating GitHub, Jira Cloud, Linear and local Beads.

## Requirements

### Requirement: Contract validation leaves production integrations unchanged
The backlog adapter contract SHALL provide versioned bounded-action and result
definitions and an offline conformance harness. Conformance SHALL exercise core
policy, agent/tool translation and submitted tool-output validation
without credentials, network access, production mutation or workflow migration.

#### Scenario: Contract work ships
- **WHEN** a maintainer runs conformance without provider credentials or network access
- **THEN** local simulated action, result and tool-output cases execute successfully
- **AND** no production calls or migration occur

### Requirement: Bounded action boundary separates responsibilities
The contract SHALL replace executable-adapter process transport with bounded
action requests and structured result submissions. Lets SHALL own policy,
sequencing, private recovery and validation; inert provider definitions SHALL
describe tool usage and translation; agents SHALL execute the requested actions;
the code host SHALL own branches, pull requests and merge observations.

Each action SHALL bind unique action/attempt identity, operation, exact input,
provider/definition version, actor/session, scope, allowed effects, required
capabilities, finite deadline and declared tool/output limits. A result SHALL
carry matching identity, execution outcome or typed error, effect certainty and
attributed tool output. Lets SHALL derive normalized data from declared inert
projections and reject any inconsistent optional agent-supplied normalization.
Lets SHALL stamp issuance and receipt times; unavailable exact tool times or
MCP server versions SHALL NOT be fabricated. Required tool versions SHALL be
checked through preflight when the definition requires them. An action SHALL NOT authorize additional
writes, later steps or retries. Multi-write operations SHALL use explicit bounded
steps and partial-effect recovery.

Legacy scenario titles below preserve main's migration identifiers; their
bodies specify the replacement action contract, not adapter process supervision.

#### Scenario: Fake adapter handles a request
- **WHEN** a simulated agent executes a supported bounded action and submits a matching result with required tool output
- **THEN** Lets validates operation-specific invariants before allowing the next transition

#### Scenario: Broken process boundary
- **WHEN** a result is malformed, mismatched, stale, replayed or late
- **THEN** Lets rejects it as permission to progress while retaining useful effect evidence for reconciliation

#### Scenario: Executable cannot start
- **WHEN** the selected definition requires a tool that is unavailable before action issuance
- **THEN** Lets reports the prerequisite failure with no issued mutation and no backend substitution

#### Scenario: Combined diagnostic and response output exceeds its limit
- **WHEN** an issued tool call overflows its declared result bound, ignores cancellation or outlives its deadline
- **THEN** Lets does not infer rollback or no effects and requires reconciliation before retry or progression

#### Scenario: Signal interrupts an invocation
- **WHEN** a reported tool call returns response bytes but terminates by signal without establishing the requested outcome
- **THEN** Lets rejects those bytes as proof of success and retains unknown effects until validated reconciliation

#### Scenario: Adapter ignores graceful termination
- **WHEN** an agent-initiated tool ignores cancellation and exceeds its action deadline
- **THEN** Lets expires the action without claiming the tool or remote effects stopped and blocks retry/progression until reconciliation

#### Scenario: Tool cannot provide a required bound
- **WHEN** a selected tool cannot meet the action's required execution or result limits
- **THEN** Lets reports that capability as unavailable instead of claiming that a timer stops the remote work

### Requirement: Contract covers the full backlog workflow
The contract SHALL define inputs, outputs, preconditions, side effects and failure outcomes for setup/checking, discovery and work-item reading/searching, creation and targeted updates, metadata, parent/child and directional blocker relationships, candidate enumeration, claiming/release, pull request references and completion. Shared policy SHALL retain packet validation, routing and ready-work ranking rather than delegating those decisions to provider-specific rules.

#### Scenario: GitHub behavior inventory
- **WHEN** the contract's operation inventory is checked against the current setup, shaping, build and finishing instructions
- **THEN** every existing GitHub workflow behavior is mapped to a contract operation or an explicitly retained shared-policy/code-host responsibility

#### Scenario: Readiness remains shared policy
- **WHEN** candidates include a Wont, an Epic, an assigned item, an item with an open blocker and eligible Must/Should/Could items
- **THEN** the worked conformance scenario excludes ineligible items and ranks eligible items by Must, Should, Could and the documented stable tie-break
- **AND** an unavailable blocker check is reported as a required capability gap rather than an empty blocker list

### Requirement: Shared identity works without browser URLs
The contract SHALL identify items by provider- and backlog-scoped opaque IDs, with a display reference and an optional browser URL. Relationships, claims and pull request references SHALL work without numeric GitHub references or browser URLs.

#### Scenario: Local item has no URL
- **WHEN** a fake local Beads item has a scoped ID and display reference but no browser URL
- **THEN** reading, linking and claiming it succeed without manufacturing a URL

#### Scenario: Equal IDs in different backlogs
- **WHEN** two items share a provider-local ID but belong to different backlog scopes
- **THEN** the harness treats them as different items

### Requirement: Shared metadata preserves current meanings
The contract SHALL define Kind as Epic/Story/Bug/Chore, Priority as Must/Should/Could/Wont, Size as XS/S/M/L/XL and Status as Todo/In Progress/Done. Provider storage and configured mappings SHALL remain behind the adapter. The shared contract SHALL exclude a general provider-specific field surface. Targeted updates SHALL preserve unrelated provider data.

#### Scenario: Provider mapping preserves meaning
- **WHEN** a fake provider stores normalized priority and size through configured labels or native fields
- **THEN** reading the item returns the original shared values
- **AND** changing its status preserves unrelated labels and fields

#### Scenario: Ambiguous mapping
- **WHEN** configured provider values cannot unambiguously represent a required shared value
- **THEN** validation reports an actionable configuration error rather than silently choosing a different meaning

#### Scenario: Stored mapping cardinality is wrong
- **WHEN** a stored metadata field has a scalar value for a many-value mapping or an array for a scalar mapping
- **THEN** reading it reports an actionable configuration error

### Requirement: Capabilities preserve workflow outcomes
The contract SHALL declare capabilities as native, emulated or unsupported, including emulation limits and claim guarantees. It SHALL preserve the existing GitHub behavior inventory and report an explicit gap when a current workflow step cannot achieve its required outcome. Conformance SHALL test the declared guarantee rather than infer support from the provider name.

#### Scenario: Required relationship is unsupported
- **WHEN** shaping needs parent/child relationships and the adapter declares them unsupported
- **THEN** the operation stops with a capability error before creating an incomplete hierarchy

#### Scenario: Emulated relationship is equivalent
- **WHEN** an adapter declares an emulated directional blocker relationship
- **THEN** the suite verifies that it can be written and read with its direction intact and distinguished from a non-blocking related link

### Requirement: Configuration separates shared settings from authentication
The contract SHALL place repository provider/definition selection, backlog
scope and local storage/tracking policy under `lets.backlog` in
`openspec/config.yaml`, with repository version 1 for this contract. Machine
connection/tool options and private paths SHALL live under the backlog command
group of Lets' existing user configuration, without overriding repository
selection. Credentials SHALL remain with backend login tools, private credential
stores or environment variables and SHALL NOT enter committed definitions.

`lets.backlog` SHALL reserve the `mappings` key for configured field/status
mappings. Until a definition applies them, Lets SHALL reject a configured
`mappings` value, naming the key, rather than accept and ignore it.

Shipped and explicitly selected custom inert definitions SHALL share one
validation path with definition schema version 1, supported operation-contract
versions and declared backend/tool versions. Definitions SHALL NOT execute load
hooks, introduce core operations or self-certify trust/guarantees. Missing
selection SHALL use validated GitHub defaults; invalid explicit selection,
ambiguous/conflicting sources, unknown consumed options, misplaced selection,
unsupported versions and obsolete executable settings SHALL fail actionably
before mutation without fallback. Unrelated future user settings SHALL retain
their existing tolerance.

#### Scenario: Explicit configuration is invalid
- **WHEN** the selected definition is invalid or `lets.backlog.mappings` is set
- **THEN** validation identifies the file/key or selected source and requests no mutation or fallback

#### Scenario: Provider authentication is missing
- **WHEN** the selected backend lacks required login
- **THEN** Lets names the integration and remedy without exposing credentials

#### Scenario: Custom definition uses supported operations
- **WHEN** an explicitly selected compatible custom definition implements an existing supported operation
- **THEN** the same request/result and evidence validators apply without a new adapter executable or Lets release

#### Scenario: Old executable selection remains configured
- **WHEN** a consumed setting names an obsolete adapter executable or path
- **THEN** Lets rejects that setting with its location and migration action rather than running or ignoring it

### Requirement: Claims report their actual guarantee
The contract SHALL permit documented best-effort claims that check ownership, assign and verify, and use stronger claims where supported. It SHALL distinguish the authenticated actor from a claim/session identity, define release ownership and partial-failure recovery, and stop progression on ownership conflicts or unresolved outcomes. It SHALL NOT claim that best-effort verification guarantees exclusive execution.

`claim.read` SHALL return the complete assignee set, current status, declared
claim guarantee and core verdict: `sole-actor`, `unassigned`, `other`, `multiple`,
`status-mismatch`, `unavailable` or `pending-mutation`. Ordinary resume SHALL
compare the authenticated actor only. Release SHALL check original worker
provenance and any provider-supported session and token; ordinary resume SHALL
NOT require those historic session or token values. Required incomplete assignee data
SHALL produce `unavailable`, never a false sole-owner verdict.

#### Scenario: Two assignees include the authenticated actor
- **WHEN** a complete claim.read returns the authenticated actor and another assignee
- **THEN** the core returns multiple and authorizes no work or ownership write

#### Scenario: New worker resumes current ownership
- **WHEN** a fresh read shows the authenticated actor alone and In Progress, with no pending mutation but a different historic session or token
- **THEN** ordinary resume returns sole-actor without granting historic release authority

#### Scenario: Another worker owns the item
- **WHEN** a claim finds an existing owner
- **THEN** it reports a conflict without overwriting that ownership or authorizing a build

#### Scenario: Claim response is lost
- **WHEN** a claim write times out after the fake provider accepts it
- **THEN** the scenario reconciles ownership before retrying or progressing

#### Scenario: Claim spans separate updates
- **WHEN** assignment succeeds but moving the item to In Progress fails
- **THEN** the result exposes partial progress and the documented recovery preserves ownership belonging to other workers

### Requirement: Mutation errors support safe recovery
The contract SHALL distinguish invalid_request, invalid_configuration,
authentication, permission, not_found, unsupported, conflict, transient and
unknown_outcome with effects none, partial or unknown. Classifications SHALL
derive from validated facts rather than error-message keywords. Unknown or
partial mutation outcomes SHALL block retry and progression until reconciliation
of the original mutation identity, input and scope. A missing result or an
agent assertion of no dispatch SHALL NOT establish effects none.

One complete validated reconciliation read SHALL end the block, whatever it
shows. Applied or absent effects resolve the operation. A partial or unresolved
result SHALL be reported with its observation and SHALL also release the
reservation, so no operation stays blocked for good. A later request then
starts a new operation whose own preflight reads current state; it SHALL NOT
repeat the original write blindly. A reconciliation read with missing facts
settles nothing and SHALL keep the block.

#### Scenario: Create response is lost
- **WHEN** a simulated backend creates an item but its response is lost
- **THEN** reconciliation establishes the existing item's identity before another creation can be authorized

#### Scenario: Permission failure
- **WHEN** validated submitted tool output establishes a denied update
- **THEN** Lets identifies the permission failure without switching provider

#### Scenario: Unsupported request protocol
- **WHEN** a submission names an unsupported operation-contract version
- **THEN** Lets reports unsupported and does not accept it as permission to progress or evidence of no remote effects

#### Scenario: Invalid request input
- **WHEN** a submission is malformed or names an unknown operation
- **THEN** Lets reports invalid_request and does not infer that an already issued action had no effects

#### Scenario: Unexpected adapter implementation error
- **WHEN** an unexpected post-issuance failure contains a known error-category word in its message
- **THEN** Lets preserves unknown outcome/effects unless resolved through validated reconciliation observations instead of classifying by that word

### Requirement: Completion follows confirmed merge
The contract SHALL accept completion only after the code-host boundary confirms merge of the associated pull request. A ready pull request SHALL leave the work In Progress. Completion SHALL be idempotent and reconcile provider-native closing automation with explicit updates.

#### Scenario: Pull request is ready but unmerged
- **WHEN** an associated pull request becomes ready for review without merging
- **THEN** completion is rejected and the work remains In Progress

#### Scenario: Completion update is retried
- **WHEN** merge is confirmed and completion succeeds but its response is lost
- **THEN** retrying observes Done without duplicate completion effects

### Requirement: Four-provider evidence qualifies conformance claims
The contract SHALL retain a traceable behavior inventory and primary-source
evidence matrix for GitHub, Jira Cloud, Linear and local Beads. Each profile
SHALL identify native/emulated/unsupported behavior and configuration/version
limits. Conformance SHALL distinguish policy, translation, submitted-output
validation and live acceptance. Offline fixtures SHALL NOT establish production
support; each production configuration SHALL require its own automated checks
and real end-to-end evidence before support is claimed.

#### Scenario: Four profiles are checked
- **WHEN** offline conformance runs
- **THEN** it reports the four profiles' metadata, scoped identity, optional URLs, relationships, claims, recovery and completion cases
- **AND** the evidence matrix separates documented facts, assumptions and outstanding live qualification

#### Scenario: Fake violates a required guarantee
- **WHEN** a fixture ignores a blocker, accepts a bare success assertion without required operation data or duplicates an uncertain creation
- **THEN** conformance identifies the violated guarantee

### Requirement: Discovery establishes backlog selection
Backlog discovery and creation SHALL accept repository/provider context without an already selected backlog. Other item operations SHALL require a selected backlog and SHALL confine reads and enumeration to its provider, backlog and repository scope.

#### Scenario: No backlog selected yet
- **WHEN** a caller lists or creates backlogs without a backlog identity
- **THEN** the operation returns discovered or created backlog identities that can establish selection

#### Scenario: Another scope shares local storage
- **WHEN** another repository or backlog uses the same fake storage directory
- **THEN** item reads and enumeration do not expose items outside the selected scope

### Requirement: Runtime releases exclude unused conformance payloads
The runtime release SHALL contain consumed core runtime and production provider
definitions while excluding unused conformance source, fixtures and contract
documentation. It SHALL exclude obsolete adapter-executable bundles and declare
backend-tool dependencies separately. Offline conformance SHALL remain runnable
from the repository.

#### Scenario: Runtime release is inspected
- **WHEN** a maintainer builds the migrated release
- **THEN** it contains the consumed runtime and definitions without obsolete adapter executable bundles or unused conformance payloads

### Requirement: Required remote facts use validated submitted tool observations
The agent SHALL submit tool output to `lets backlog submit`, translated by the
selected adapter's provider definition, without independently retrieved capture.
Lets SHALL derive normalized facts through that definition's inert projections.
The submission SHALL identify its action, tool or server, arguments, backend,
scope, actor context and execution outcome. Output SHALL be accepted inline or
through explicitly referenced bounded local files, read as untrusted input.
Lets SHALL stamp issuance and receipt times rather than require agent-invented
collection times. Optional normalized facts SHALL agree with the derived facts.
Lets SHALL validate these bindings,
output-to-contract mappings, freshness, complete pagination/blocker coverage,
current ownership and exact associated merge facts as required by the operation.
Bare assertions SHALL NOT replace required observations. The contract SHALL
state that it trusts submissions and cannot independently authenticate output
or detect convincingly fabricated observations. Shipped and custom definitions
SHALL use the same validation path without strengthening native atomicity.

#### Scenario: Complete tool output has no capture receipt
- **WHEN** a submission contains all required matching tool observations and normalized facts but no independently retrievable receipt
- **THEN** Lets accepts it if its structural and operation-specific checks pass

#### Scenario: Submission belongs to another call
- **WHEN** submitted output or normalized data names another action, tool, input, actor or scope
- **THEN** Lets rejects it and authorizes no progression

#### Scenario: Output omits required data
- **WHEN** submitted output is truncated or lacks required pages or merge fields
- **THEN** Lets reports insufficient evidence rather than inferring missing facts

#### Scenario: Agent initiates a fresh verification read
- **WHEN** the same agent submits a fresh read with all required bindings, output and coverage
- **THEN** the observation qualifies under the submitted-output trust model

#### Scenario: Normalized facts contradict output
- **WHEN** normalized data reports sole ownership but submitted tool output contains another owner
- **THEN** Lets rejects the inconsistent mapping and starts no work

#### Scenario: Required observations are unavailable
- **WHEN** a submission lacks the facts needed to reconcile an issued mutation
- **THEN** Lets pauses automatic retry/progression and explains the action, known/unknown effects, missing facts and bounded reconciliation or stop choices
- **AND** user approval alone does not replace the required operation data

#### Scenario: Output is supplied through a local file
- **WHEN** a matching submission references a readable bounded local output file containing all required data
- **THEN** Lets reads the file and derives normalized facts without requiring the agent to transcribe its contents
- **AND** the file does not establish independent provenance

#### Scenario: Output file exceeds its bound
- **WHEN** a referenced output file exceeds the issued action's result limit
- **THEN** Lets rejects the submission and does not infer no effects

#### Scenario: Exact tool timestamps are unavailable
- **WHEN** a result arrives within its action window without exact tool timestamps or an MCP server version that the definition does not require
- **THEN** Lets uses its issuance and receipt times and does not reject merely because those optional fields are unavailable

### Requirement: Rejected submissions preserve operation safety
Lets SHALL record each submission attempt using its original continuation
supplied separately from the submission body, including malformed submissions.
A rejected read submission SHALL have
at most two correction attempts within its original deadline; another actual
tool read SHALL require a new action. Rejection of a write submission after
issuance SHALL mark its effects unknown and require reconciliation before any
new write or progression. Corrected output SHALL NOT reactivate write permission.

#### Scenario: Read submission has malformed JSON
- **WHEN** a read's first submission is malformed but a correction arrives within its deadline and correction limit
- **THEN** Lets validates the correction and retains both submission attempts

#### Scenario: Assignment succeeds but its submission is malformed
- **WHEN** an issued assignment is followed by a rejected submission
- **THEN** Lets records unknown effects and requests reconciliation instead of allowing the assignment to be executed again

### Requirement: Host prerequisites fail before action issuance
Lets SHALL check required tool availability, login, execution and output bounds,
and private-state write and locking access before issuing backend actions.
Missing prerequisites SHALL return an actionable typed failure without tool
substitution or automatic store relocation. Backend-dependent login/permission
checks SHALL use separately bounded preflight read actions after local safety
checks; these reads SHALL NOT require the condition they are checking. A missing
backend prerequisite SHALL issue no affected mutation and have no write effects.

#### Scenario: Private-state directory is unwritable
- **WHEN** the configured state directory cannot support private durable writes and locking
- **THEN** Lets issues no action and names the path and machine-local access or configuration remedy

#### Scenario: Host provides a command timeout
- **WHEN** the configured host provides the declared finite command timeout and output limits for gh
- **THEN** Lets accepts that bound without requiring a gh timeout flag or GNU timeout
- **AND** expiry after issuance does not establish rollback or no effects

### Requirement: Outstanding item mutations are shared across local worktrees
Private recovery SHALL key outstanding item mutations by backend endpoint,
provider, repository, backlog and item in one user-configured machine store.
Worker and worktree provenance SHALL be fields, not isolation keys for blocking.
Every new item operation SHALL check outstanding mutations before permitting
work or writes. Original-operation reconciliation reads SHALL remain available.
The store SHALL NOT claim cross-machine or cross-account visibility.

#### Scenario: Another local session uses a new operation ID
- **WHEN** an item has an outstanding mutation in one worktree and another worktree requests a new write for that item
- **THEN** Lets reports the original pending mutation and issues no new write until its effects are reconciled

#### Scenario: Same actor has two worker sessions
- **WHEN** two local worker sessions use the same authenticated backend account and configured store
- **THEN** both see the item's pending mutation while retaining their distinct provenance
- **AND** the backend guarantee remains actor-level best-effort ownership

### Requirement: One GitHub definition covers repository and PR actions
The selected GitHub definition SHALL translate repository.read,
pull-request.read, pull-request.create, pull-request.update and
pull-request.ready through the same bounded action and submission path as issue
and Project actions. These operations SHALL bind exact repository and PR scope,
inputs, effects and recovery. Commands and configuration SHALL remain under
backlog and lets.backlog without a separate code-host adapter selection.
Repository and PR facts SHALL retain their GitHub code-host provenance and SHALL
NOT substitute for Project status. Git branch operations SHALL remain local Git
and merging SHALL remain user-owned. Other providers SHALL retain their offline
contracts without a claim of production mixed-provider PR support.

#### Scenario: Repository and backlog use GitHub
- **WHEN** the workflow reads an issue, its selected Project and the associated GitHub PR
- **THEN** each operation uses the same selected GitHub definition without a second adapter or configuration

#### Scenario: GitHub reference is already in the PR
- **WHEN** reference.write receives an existing GitHub PR association
- **THEN** it validates the supplied relationship without editing GitHub or introducing a runner association step

#### Scenario: PR write loses its result
- **WHEN** a bounded PR create, update or ready action has an uncertain result
- **THEN** the original scoped operation requires reconciliation before retry without changing the workflow's owning step

### Requirement: Repository writes reserve their scoped resources
Before issuing a PR create, the core SHALL reserve its endpoint, provider,
target repository, head repository and head ref in the shared private store.
An update or ready action SHALL reserve endpoint, provider, repository and PR ID.
Known issue scope SHALL also be bound as an alias. Every new write SHALL check
the same resource keys regardless of worker, worktree or operation ID. Unknown
effects SHALL block another write for that resource until reconciliation.

A new operation without context.session SHALL receive a core-allocated worker
ID before action issuance and expose it as workerId in the operation response.
Returned worker identity SHALL be reused within that invocation. Each delegated
step SHALL own its worker context; conflict blocking
SHALL NOT depend on inheriting the runner's ID. A failed step SHALL include its
original uncertain operation ID and recovery command in the existing reason
string without changing the step-report schema.

#### Scenario: New step retries a lost PR creation
- **WHEN** one plan session's PR create has unknown effects and a later session requests a create for the same repository and head
- **THEN** the later call receives the continuation and issues no new create until reconciliation

#### Scenario: Reconciliation cannot settle a lost create
- **WHEN** a complete reconciliation read finds no PR for an uncertain create
- **THEN** Lets reports the result as unresolved with that observation and releases the reservation
- **AND** a later create starts a new operation with a fresh preflight read, not a write

#### Scenario: PR is updated from another worktree
- **WHEN** one worktree has an uncertain PR update and another requests ready for that same PR
- **THEN** the second call finds the pending resource record and requests no ready write

#### Scenario: Failed step reports an uncertain write
- **WHEN** the step cannot establish a PR write's outcome
- **THEN** its failed reason carries the operation ID and resume remedy so the runner can report recovery without inventing new report fields

### Requirement: Connection choice is explicit for each operation
Machine settings SHALL define named tool connections under `backlog.connections`
and a default name under `backlog.connection`. A new operation SHALL accept an
explicit `--connection <name>` that selects only a compatible tool binding of the
repository-selected definition. It SHALL NOT change provider, definition,
backlog or mappings. Core SHALL record the chosen connection in the operation.
Submit and resume SHALL use that recorded connection without default fallback.
Delegated steps SHALL validate their selected tools independently before actions.

Without `backlog.connections`, the implicit default SHALL be the shipped
definition's gh CLI binding. A sole configured connection SHALL be selected
when no default name is set. Several entries without `backlog.connection` SHALL
fail preflight with a remedy. Invalid explicit selection SHALL NOT fall back.
Lets-go and its steps SHALL use the configured default, with no new runner
request syntax. Only direct backlog callers SHALL accept `--connection`.
Bindings SHALL be declared by the repository-selected definition; a connection
SHALL NOT add bindings absent from that shared definition.

#### Scenario: Existing user has no connection configuration
- **WHEN** no backlog.connections or backlog.connection is configured
- **THEN** preflight selects the implicit shipped gh CLI binding, subject to normal tool and login checks

#### Scenario: Several connections have no default
- **WHEN** several connections exist but backlog.connection is absent
- **THEN** preflight requests an explicit default and issues no backend action

#### Scenario: One connection has no default name
- **WHEN** exactly one valid connection exists and backlog.connection is absent
- **THEN** it is the configured default without host detection

#### Scenario: Hosts on one machine choose different tools
- **WHEN** direct backlog callers in T3 and a standalone CLI explicitly select different compatible named connections
- **THEN** they use the same repository provider and policy without implicit host detection or tool fallback

#### Scenario: A delegated step lacks the selected tools
- **WHEN** a step session cannot access its explicitly selected connection's required tool
- **THEN** it reports the missing prerequisite before issuing any affected action

#### Scenario: Default changes while a mutation is uncertain
- **WHEN** the configured default connection changes after a write becomes uncertain
- **THEN** reconciliation remains bound to its original connection or reports that prerequisite as unavailable instead of using the new default

### Requirement: Continuations survive scratch loss
A blocked or needs-reconciliation result SHALL include the original durable
operation ID and a continuation rebuilt from that operation's recovery record.
Resume SHALL accept the operation ID without a scratch file and validate its
original scope and provenance before requesting reconciliation reads. Callers
SHALL isolate continuations by operation. Reconstructing a continuation SHALL NOT
transfer claim-release authority or authorize a new mutation.

#### Scenario: Another worktree reconciles the original operation
- **WHEN** one worktree records an uncertain mutation and another finds it by scoped item identity
- **THEN** the second receives the original operation ID and can resume its reconciliation without the first worktree's scratch file

#### Scenario: Scratch files have been removed
- **WHEN** all workspace scratch files are lost but the private recovery record survives
- **THEN** resume by original operation ID reconstructs the continuation without deleting state or issuing the write again

#### Scenario: A runner read follows an uncertain step write
- **WHEN** a step has an uncertain write and the runner issues a separate claim.read
- **THEN** their operation-specific continuations remain distinct and the write can still be reconciled

### Requirement: Item reads expose complete thread facts
item.read SHALL accept includeThread, defaulting to false. Packet and brainstorm
checks SHALL set includeThread to true; parent-body reads need not fetch comments.
For those thread checks, item.read SHALL provide the issue's lastEditedAt
and every comment's URL, author login, author type, author association, createdAt,
lastEditedAt and body. Deleted authors and never-edited timestamps SHALL be
explicitly null where applicable. Thread enumeration SHALL prove all required
pages complete before watermark or read-marker policy can authorize progression.
Labels and read-marker interpretation SHALL remain shared policy.

#### Scenario: Unread comment is on a later page
- **WHEN** an unread or edited comment appears after the first thread page
- **THEN** item.read includes it before the caller computes freshness or fails with incomplete coverage without authorizing a claim

#### Scenario: Parent body does not request comments
- **WHEN** item.read requests a parent body without includeThread
- **THEN** it returns required item facts without requesting complete comment pages

#### Scenario: Deleted author and bot have different provenance
- **WHEN** the thread includes a deleted account and a GitHub App
- **THEN** the result retains the nullable author facts and bot type needed for the existing ghost and outside labels

### Requirement: PR creation preserves the planning draft
pull-request.create SHALL always request a draft PR. Confirmed creation SHALL
require isDraft: true. A result without that confirmation SHALL report partial
effects and require reconciliation of the existing resource before further writes.

#### Scenario: Creation returns a ready PR
- **WHEN** a create submission identifies a PR but lacks isDraft: true
- **THEN** Lets reports partial effects, does not confirm creation and blocks duplicate creation pending reconciliation
