## MODIFIED Requirements

### Requirement: Executable boundary separates responsibilities
The contract SHALL replace executable stdin/stdout transport with versioned
bounded-action requests and structured submissions. Lets SHALL own policy,
sequencing, expiry, private recovery and validation. Provider definitions SHALL
describe tool usage/mappings; the agent SHALL execute requested actions. The
code host SHALL retain branch/PR ownership. Shipped/custom definitions SHALL
use one generic trusted-capture path without a second provider executor.

#### Scenario: Fake adapter handles a request
- **WHEN** offline conformance supplies a supported bounded action and a matching captured result
- **THEN** it validates submission structure, correlation, evidence and operation invariants before progression

#### Scenario: Broken process boundary
- **WHEN** a submission is malformed, missing, mismatched, replayed or expired
- **THEN** conformance rejects progression and preserves any unresolved issued-action effects

#### Scenario: Executable cannot start
- **WHEN** a required tool or independent capture cannot establish the requested facts
- **THEN** the workflow pauses retry/progression and explains the missing evidence and reconciliation choices without provider fallback

#### Scenario: Combined diagnostic and response output exceeds its limit
- **WHEN** captured tool output exceeds the issued action's byte limit
- **THEN** the result cannot authorize progression and effects remain unknown unless independently resolved

#### Scenario: Signal interrupts an invocation
- **WHEN** a tool terminates after it may have written but before a valid captured result
- **THEN** the mutation remains unknown pending reconciliation under the original identity

#### Scenario: Adapter ignores graceful termination
- **WHEN** a tool continues after the action expires
- **THEN** lets does not claim rollback, issue another mutation or accept late output as permission to progress


### Requirement: Contract validation leaves production integrations unchanged
The backlog adapter contract SHALL provide machine-checkable action/submission and capture
definitions and an offline conformance harness. Running conformance
SHALL require neither provider credentials nor network access and SHALL NOT
mutate production backlogs or migrate the production workflow.

#### Scenario: Contract work ships
- **WHEN** a maintainer runs the conformance suite without provider credentials or network access
- **THEN** the suite exercises local fixtures successfully
- **AND** no production provider calls or workflow migrations occur


### Requirement: Configuration separates shared settings from authentication
The contract SHALL define repository backlog selection and mappings under `lets:` in `openspec/config.yaml`, one selected backlog per repository and GitHub as the default. Authentication SHALL come from provider login tools or the environment rather than committed credentials. The contract SHALL validate versioned shipped/custom definition selection, provider context, local storage/tracking and required tool/capture prerequisites without fallback. Repository selection SHALL use lets.backlog.version 1; provider definitions SHALL declare schema version 1 and supported operation/backend versions. Machine options SHALL remain in user backlog settings and SHALL NOT override repository selection. Loading definitions SHALL execute no code or install hook. Obsolete executable settings SHALL fail with the file/key and migration action.

#### Scenario: Explicit configuration is invalid
- **WHEN** the selected definition, version or required provider mapping is invalid
- **THEN** validation names the configuration problem and performs no provider mutation or fallback

#### Scenario: Provider authentication is missing
- **WHEN** a fake provider requires unavailable authentication
- **THEN** the harness observes an authentication error without credentials appearing in the shared configuration or diagnostic fixtures


### Requirement: Mutation errors support safe recovery
The contract SHALL distinguish invalid requests/configuration, authentication, permission, missing items, unsupported capabilities, ownership conflicts, transient failures and unknown mutation outcomes. It SHALL define reconciliation and retry behavior for each mutation, including duplicate creation prevention and relationship/update retries. Unknown outcomes SHALL NOT be reported as confirmed failure with no side effects. Issued actions with missing, expired or unverifiable results SHALL block retry/progression pending independently evidenced reconciliation under the original mutation identity. Late results SHALL NOT reactivate expired actions. Local rejection before action issuance can establish effects none; an agent assertion of no dispatch after issuance cannot.

#### Scenario: Create response is lost
- **WHEN** the fake provider creates an item but its response is lost
- **THEN** reconciliation identifies the existing item before another creation is attempted

#### Scenario: Permission failure
- **WHEN** a provider denies an update
- **THEN** the error identifies the permission failure and does not trigger fallback to another provider

#### Scenario: Unsupported request protocol
- **WHEN** lets receives a request using an unsupported action-contract version before issuance
- **THEN** it returns category unsupported with effects none

#### Scenario: Invalid request input
- **WHEN** lets receives malformed JSON or an unknown operation before issuance
- **THEN** it returns category invalid_request with effects none

#### Scenario: Unexpected adapter implementation error
- **WHEN** the issued action encounters an unexpected error whose message contains a known error-category word
- **THEN** its response reports unknown_outcome with unknown effects
- **AND** it does not classify the error by matching words in the message


### Requirement: Completion follows confirmed merge
The contract SHALL accept completion only after independently retrieved trusted capture confirms merge of the exact associated pull request and its nonempty merge commit. A ready pull request SHALL leave the work In Progress. An agent report, editable file or local journal SHALL NOT establish this remote fact. Missing required capture SHALL pause retry/progression with reconciliation choices; user approval alone SHALL NOT replace the facts. Completion SHALL be idempotent and reconcile provider-native closing automation with explicit updates.

#### Scenario: Pull request is ready but unmerged
- **WHEN** an associated pull request becomes ready for review without merging
- **THEN** completion is rejected and the work remains In Progress

#### Scenario: Completion update is retried
- **WHEN** merge is confirmed and completion succeeds but its response is lost
- **THEN** retrying observes Done without duplicate completion effects


### Requirement: Four-provider evidence qualifies conformance claims
The contract SHALL include a traceable behavior inventory, rationale for the chosen integration boundary and a primary-source evidence matrix for representative GitHub, Jira Cloud, Linear and local Beads scenarios. Each scenario SHALL identify native/emulated/unsupported behavior, assumptions and configuration/version limits. The fake suite SHALL detect intentionally nonconforming behavior as well as accept conforming fixtures. Fake results SHALL NOT establish live adapter support; each production adapter still requires automated checks and a real end-to-end test before release support is claimed.

#### Scenario: Four profiles are checked
- **WHEN** the offline conformance suite runs
- **THEN** it reports named variation cases for all four profiles covering mapped metadata, identity and optional URLs
- **AND** a shared offline action/submission and capture suite checks the common relationship, claim, recovery and completion outcomes
- **AND** the evidence matrix distinguishes documented facts from assumptions and live checks still needed

#### Scenario: Fake violates a required guarantee
- **WHEN** a deliberately broken fixture silently ignores a blocker or duplicates a retried creation
- **THEN** conformance fails with the violated outcome identified


### Requirement: Runtime releases exclude unused conformance payloads
The runtime release SHALL exclude unused adapter-kit source, test fixtures and
contract documentation. Offline conformance SHALL remain runnable from the
repository independently of the runtime release. Production releases SHALL ship only consumed core code and provider definitions for the migrated path, with no obsolete backlog adapter executable or parallel provider executor.

#### Scenario: Runtime release is inspected
- **WHEN** a maintainer builds and inspects the runtime release for the migrated request/result path
- **THEN** the release contains no standalone adapter-kit source, test fixtures or copied contract document
- **AND** the repository conformance suite remains runnable
