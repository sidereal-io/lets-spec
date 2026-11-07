## Purpose

Build existing GitHub stories through the shared backlog boundary while preserving safe ownership, portable identity and completion after confirmed merge.

## ADDED Requirements

### Requirement: Resolve one configured backlog without fallback
The build caller SHALL resolve `lets.backlog` from repository OpenSpec configuration under the versioned provider-definition and action contract. Missing selection SHALL use GitHub and discover exactly one open linked Project in either link direction. Explicit selection SHALL require repository version 1, provider/definition identity and version, backlog ID and complete unambiguous mappings. Invalid configuration, unavailable required tools or capture and authentication or permission failures SHALL stop without choosing another provider. GitHub mappings SHALL validate native field types, values and repository membership before mutations.

#### Scenario: Existing unconfigured GitHub repository
- **WHEN** configuration omits backlog selection and exactly one open linked Project exists
- **THEN** build selects that Project with the existing named shared fields

#### Scenario: Ambiguous discovery
- **WHEN** discovery returns zero or multiple distinct open linked Projects
- **THEN** build reports the selection problem without claiming work

#### Scenario: Obsolete executable selection
- **WHEN** explicit configuration still contains an adapter executable setting
- **THEN** build reports the file/key and a definition migration action without running the executable or selecting the default adapter

### Requirement: Enforce bounded action and submission contracts
Lets SHALL issue versioned bounded actions after validating policy, scope,
prerequisites and definition compatibility. Each action SHALL bind identity,
operation, immutable input, provider/definition version, actor/session, finite
expiry and output limits. The agent SHALL execute only that requested action.
Lets SHALL validate result identity, structure, sequencing and independently
retrieved capture before progression. Definitions SHALL remain integration
data and SHALL NOT authorize policy changes or certify their own trust.

#### Scenario: Expired claim submission
- **WHEN** a claim action expires after dispatch and a result arrives late
- **THEN** effects remain unknown until reconciled and the late result does not reactivate the action or authorize work

#### Scenario: Forged or missing evidence
- **WHEN** a result includes an agent-written ownership report or unavailable capture reference
- **THEN** lets pauses progression and automatic retry with the missing facts and reconciliation choices

#### Scenario: Action substitution
- **WHEN** capture describes a different tool, input, scope or attempt from the issued action
- **THEN** lets rejects it and does not advance the workflow

#### Scenario: Incomplete enumeration cannot finish
- **WHEN** captured blocker pages repeat a cursor or omit remaining pages
- **THEN** readiness fails explicitly rather than treating the item as unblocked

### Requirement: Preserve GitHub packet and readiness policy
The shared workflow SHALL retain existing packet validation, comment watermark checks, parent decisions, schema routing and glossary preflight. Candidate selection SHALL exclude other repositories, non-Todo items, Epics, Wont items, owned items and items with open blockers. It SHALL rank Must, Should, Could then GitHub numeric issue reference within the selected backlog, with the contract's opaque-ID fallback. Named items SHALL undergo the same ownership and blocker checks before claim.

#### Scenario: Candidate ranking
- **WHEN** eligible Must items #10 and #2 coexist with an assigned Must #1 and a blocked Must #3
- **THEN** selection chooses #2

#### Scenario: Named item has an owner
- **WHEN** the requested item is already assigned
- **THEN** build reports the owner and stops without replacing ownership

### Requirement: Claims reconcile native actor ownership
GitHub claims SHALL report actor-level best-effort guarantees and explicitly disclose that remote sessions using the same actor cannot be distinguished. No machine-state Project fields or shared coordinator SHALL be required. Acquire SHALL check unowned state, journal local continuation intent, assign, transition to In Progress and verify current ownership. Before work, including resume and replay, the caller SHALL require matching local continuation and independently captured fresh native sole actor ownership and In Progress. Assignment alone SHALL NOT authorize work. Uncertain or conflicting native state SHALL require reconciliation without clearing another worker's claim.

#### Scenario: Same account uses a second session
- **WHEN** a new session without original local continuation attempts to acquire or release an assigned item
- **THEN** it receives a conflict and the first session's ownership remains intact

#### Scenario: Resume requires explicit continuation
- **WHEN** two local callers address the same change, but only one supplies its original continuation handle
- **THEN** only that caller can resume the recorded session; the other cannot adopt it from shared private storage

#### Scenario: Status update fails after assignment
- **WHEN** assignment succeeds but moving to In Progress fails
- **THEN** acquire reports partial effects and build does not start

### Requirement: Release only the current worker's claim
After branch creation fails, the workflow SHALL release using the original scoped identity, actor, session and token. Release SHALL restore Todo only when current ownership proves that claim still belongs to this worker. Unknown outcomes SHALL reconcile before retry; replaced claims SHALL remain untouched.

#### Scenario: Branch creation fails
- **WHEN** branch creation fails after a verified claim and ownership still matches
- **THEN** release removes this worker's assignment and restores Todo

#### Scenario: Claim was replaced
- **WHEN** branch failure recovery finds another actor's assignment
- **THEN** it reports conflict without changing assignment or status

### Requirement: Retain immutable identity through the change lifecycle
The workflow SHALL persist provider/backlog/item identity, repository and display reference with the change. Resume, PR association and archive SHALL use that recorded identity and reject conflicting current configuration. URLs and numeric references SHALL NOT substitute for identity. Legacy changes lacking a record SHALL require explicit identity confirmation before any backlog mutation.

#### Scenario: Repository selection changes during a change
- **WHEN** a resumed change records a different backlog from current configuration
- **THEN** build stops with the mismatch and does not claim or complete a similarly numbered item elsewhere

#### Scenario: Archived change completes
- **WHEN** the change is archived before its PR merges
- **THEN** the recorded identity remains available for later completion

### Requirement: Associate PRs and complete only after merge
The workflow SHALL verify an idempotent native closing-issue association to the exact code-host PR, preserving GitHub closing references. It SHALL leave ready and archived work In Progress. Completion SHALL require the independently retrieved capture to verify that exact associated PR merged and establish its nonempty merge commit. It SHALL reconcile already-Done automation after merge and reject a different PR or unmerged evidence.

#### Scenario: Ready PR is unmerged
- **WHEN** a PR is ready for review but remains unmerged
- **THEN** completion makes no Done transition

#### Scenario: Completion response was lost
- **WHEN** the associated PR has merged and a previous Done update succeeded without returning a response
- **THEN** recovery observes Done and succeeds without duplicate effects

### Requirement: Use one extensible definition path
Shipped and custom definitions SHALL use the same action/submission and generic
capture validation path. Loading a definition SHALL execute no provider code or
install hook. Lets SHALL NOT retain a built-in provider executor or direct
provider verification reads beside the agent-executed path.

#### Scenario: Custom GitHub definition
- **WHEN** a compatible explicit custom definition supplies tool usage and mappings for supported GitHub operations
- **THEN** it uses the same action and evidence checks as the shipped definition without an adapter executable or lets release

### Requirement: Prove the production build flow
Support claims SHALL require automated action/submission, capture and workflow checks plus a live run of the implemented flow against the designated test repository and Project. Evidence SHALL identify the tested commit, selected item, PR and merge commit, outcomes and cleanup. It SHALL cover blocked/owned work, uncertain mutation outcomes and branch creation failure. Manual fixture setup and simulated provider results SHALL NOT count as proof of the production lifecycle.

#### Scenario: Live test reaches review readiness
- **WHEN** the new flow selects and builds a test story and opens its PR
- **THEN** evidence shows retained identity and In Progress until a user-authorized merge permits the completion check

#### Scenario: Merge is unavailable
- **WHEN** the test PR has not been authorized to merge
- **THEN** acceptance reports completion as pending rather than claiming a passed lifecycle
