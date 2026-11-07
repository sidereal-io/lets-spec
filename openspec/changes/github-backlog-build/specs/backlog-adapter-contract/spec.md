## MODIFIED Requirements

### Requirement: Contract validation leaves production integrations unchanged
The backlog adapter contract SHALL provide versioned bounded-action and result
definitions and an offline conformance harness. Conformance SHALL exercise core
policy, agent/tool translation and independently retrieved evidence validation
without credentials, network access, production mutation or workflow migration.

#### Scenario: Contract work ships
- **WHEN** a maintainer runs conformance without provider credentials or network access
- **THEN** local simulated action, result and capture cases execute successfully
- **AND** no production calls or migration occur

### Requirement: Executable boundary separates responsibilities
The contract SHALL replace executable-adapter process transport with bounded
action requests and structured result submissions. Lets SHALL own policy,
sequencing, private recovery and validation; inert provider definitions SHALL
describe tool usage and translation; agents SHALL execute the requested actions;
the code host SHALL own branches, pull requests and merge observations.

Each action SHALL bind unique action/attempt identity, operation, exact input,
provider/definition version, actor/session, scope, allowed effects, required
capabilities, finite deadline and declared tool/output limits. A result SHALL
carry matching identity, normalized outcome or typed error, timing, effect
certainty and attributed evidence. An action SHALL NOT authorize additional
writes, later steps or retries. Multi-write operations SHALL use explicit bounded
steps and partial-effect recovery.

#### Scenario: Fake adapter handles a request
- **WHEN** a simulated agent executes a supported bounded action and submits a matching result with required independently retrievable capture
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
- **WHEN** a captured tool call returns response bytes but terminates by signal without establishing the requested outcome
- **THEN** Lets rejects those bytes as proof of success and retains unknown effects until independent reconciliation

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
- **WHEN** independently retrieved evidence establishes a denied update
- **THEN** Lets identifies the permission failure without switching provider

#### Scenario: Unsupported request protocol
- **WHEN** a submission names an unsupported operation-contract version
- **THEN** Lets reports unsupported and does not accept it as permission to progress or evidence of no remote effects

#### Scenario: Invalid request input
- **WHEN** a submission is malformed or names an unknown operation
- **THEN** Lets reports invalid_request and does not infer that an already issued action had no effects

#### Scenario: Unexpected adapter implementation error
- **WHEN** an unexpected post-issuance failure contains a known error-category word in its message
- **THEN** Lets preserves unknown outcome/effects unless independently resolved instead of classifying by that word

### Requirement: Four-provider evidence qualifies conformance claims
The contract SHALL retain a traceable behavior inventory and primary-source
evidence matrix for GitHub, Jira Cloud, Linear and local Beads. Each profile
SHALL identify native/emulated/unsupported behavior and configuration/version
limits. Conformance SHALL distinguish policy, translation, independent evidence
validation and live acceptance. Offline fixtures SHALL NOT establish production
support; each production configuration SHALL require its own automated checks
and real end-to-end evidence before support is claimed.

#### Scenario: Four profiles are checked
- **WHEN** offline conformance runs
- **THEN** it reports the four profiles' metadata, scoped identity, optional URLs, relationships, claims, recovery and completion cases
- **AND** the evidence matrix separates documented facts, assumptions and outstanding live qualification

#### Scenario: Fake violates a required guarantee
- **WHEN** a fixture ignores a blocker, accepts an agent-written receipt as independent proof or duplicates an uncertain creation
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

### Requirement: Required remote facts use independently retrieved original capture
Lets SHALL retrieve authoritative tool request/response records through a trusted
capture channel outside the agent's editable report. Runtime setup SHALL establish
tool/channel trust independently of provider definition claims. Records SHALL bind
action, actual tool/server identity, arguments, backend/scope, authenticated
context, collection time, response and execution outcome. Lets SHALL check
freshness, complete pagination/blocker coverage, current ownership and exact
merge evidence where the operation requires them. Capture SHALL NOT imply
stronger remote atomicity or exclusive ownership than the backend supplies.

#### Scenario: Report contains a plausible receipt body
- **WHEN** an agent submits a receipt body without a trustworthy independent retrieval reference
- **THEN** Lets treats it as attributed evidence and rejects it as proof of required remote facts

#### Scenario: Capture belongs to another call
- **WHEN** a retrieved record names another action, tool, input, actor or scope
- **THEN** Lets rejects it and authorizes no progression

#### Scenario: Display record omits output
- **WHEN** the available host record is truncated, normalized without the required original fields or incomplete for the requested fact
- **THEN** Lets reports insufficient evidence rather than accepting its display as a complete original result

#### Scenario: Agent initiates a fresh verification read
- **WHEN** Lets independently retrieves that read's original trusted result and validates all required bindings and coverage
- **THEN** the fact can qualify even though the same agent initiated the read

#### Scenario: Trusted channel is unavailable
- **WHEN** required evidence cannot be independently retrieved
- **THEN** Lets pauses automatic retry/progression and explains the action, known/unknown effects, missing evidence and reconciliation or stop choices
- **AND** user approval alone does not replace the missing remote facts
