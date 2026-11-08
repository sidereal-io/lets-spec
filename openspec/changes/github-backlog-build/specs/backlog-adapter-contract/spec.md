## RENAMED Requirements

- FROM: `### Requirement: Executable boundary separates responsibilities`
- TO: `### Requirement: Bounded action boundary separates responsibilities`

## MODIFIED Requirements

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

### Requirement: Configuration separates shared settings from authentication
The contract SHALL place repository provider/definition selection, backlog
scope, mappings and local storage/tracking policy under `lets.backlog` in
`openspec/config.yaml`, with repository version 1 for this contract. Machine
connection/tool options and private paths SHALL live under the backlog command
group of Lets' existing user configuration, without overriding repository
selection. Credentials SHALL remain with backend login tools, private credential
stores or environment variables and SHALL NOT enter committed definitions.

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
- **WHEN** the selected definition or required mapping is invalid
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

### Requirement: Mutation errors support safe recovery
The contract SHALL distinguish invalid_request, invalid_configuration,
authentication, permission, not_found, unsupported, conflict, transient and
unknown_outcome with effects none, partial or unknown. Classifications SHALL
derive from validated facts rather than error-message keywords. Unknown or
partial mutation outcomes SHALL block retry and progression until reconciliation
of the original mutation identity, input and scope. A missing result or an
agent assertion of no dispatch SHALL NOT establish effects none.

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

### Requirement: Runtime releases exclude unused conformance payloads
The runtime release SHALL contain consumed core runtime and production provider
definitions while excluding unused conformance source, fixtures and contract
documentation. It SHALL exclude obsolete adapter-executable bundles and declare
backend-tool dependencies separately. Offline conformance SHALL remain runnable
from the repository.

#### Scenario: Runtime release is inspected
- **WHEN** a maintainer builds the migrated release
- **THEN** it contains the consumed runtime and definitions without obsolete adapter executable bundles or unused conformance payloads

## ADDED Requirements

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
