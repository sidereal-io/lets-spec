# github-backlog-build Specification

## Purpose

Build existing GitHub stories through the shared backlog boundary while preserving safe ownership, portable identity and completion after confirmed merge.

## Requirements

### Requirement: Resolve one configured backlog without fallback
The build caller SHALL resolve `lets.backlog` from repository OpenSpec configuration according to protocol 1. Missing selection SHALL use GitHub and discover exactly one open linked Project in either link direction. Explicit selection SHALL require provider, executable, backlog ID and complete unambiguous mappings. Invalid configuration, missing executable and authentication or permission failures SHALL stop without choosing another provider. GitHub mappings SHALL validate native field types, values and repository membership before mutations.

#### Scenario: Existing unconfigured GitHub repository
- **WHEN** configuration omits backlog selection and exactly one open linked Project exists
- **THEN** build selects that Project with the existing named shared fields

#### Scenario: Ambiguous discovery
- **WHEN** discovery returns zero or multiple distinct open linked Projects
- **THEN** build reports the selection problem without claiming work

#### Scenario: Explicit executable is unavailable
- **WHEN** explicit configuration names an unavailable executable
- **THEN** build reports invalid configuration without invoking the default adapter

### Requirement: Enforce the executable transport contract
The caller SHALL invoke the selected executable directly with no shell or appended arguments and one protocol-1 JSON request on stdin. It SHALL enforce request/response validation, bounded runtime and output, process exit consistency and complete pagination. Mutation interruption or malformed responses after invocation SHALL remain uncertain until reconciled. Required unsupported capabilities SHALL stop before mutation.

#### Scenario: Claim times out
- **WHEN** a claim invocation times out after the adapter could have written
- **THEN** the caller reports an unknown outcome and does not issue another acquire or authorize work without reconciliation

#### Scenario: Incomplete enumeration cannot finish
- **WHEN** a blocker enumeration repeats its cursor or cannot enumerate the remaining blockers
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
GitHub claims SHALL report actor-level best-effort guarantees and explicitly disclose that remote sessions using the same actor cannot be distinguished. No machine-state Project fields or shared coordinator SHALL be required. Acquire SHALL check unowned state, journal local continuation intent, assign, transition to In Progress and verify current ownership. Before work, including resume and replay, the caller SHALL freshly read and require matching local continuation and current native sole actor ownership and In Progress. Assignment alone SHALL NOT authorize work. Uncertain or conflicting native state SHALL require reconciliation without clearing another worker's claim.

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
The workflow SHALL verify an idempotent native closing-issue association to the exact code-host PR, preserving GitHub closing references. It SHALL leave ready and archived work In Progress. Completion SHALL require the trusted code-host caller to verify that associated PR merged and supply its nonempty merge commit. It SHALL reconcile already-Done automation after merge and reject a different PR or unmerged evidence.

#### Scenario: Ready PR is unmerged
- **WHEN** a PR is ready for review but remains unmerged
- **THEN** completion makes no Done transition

#### Scenario: Completion response was lost
- **WHEN** the associated PR has merged and a previous Done update succeeded without returning a response
- **THEN** recovery observes Done and succeeds without duplicate effects

### Requirement: Prove the production build flow
Support claims SHALL require automated adapter and workflow checks plus a live run of the implemented flow against the designated test repository and Project. Evidence SHALL identify the tested commit, selected item, PR and merge commit, outcomes and cleanup. It SHALL cover blocked/owned work, uncertain mutation outcomes and branch creation failure. Manual fixture setup and simulated provider results SHALL NOT count as proof of the production lifecycle.

#### Scenario: Live test reaches review readiness
- **WHEN** the new flow selects and builds a test story and opens its PR
- **THEN** evidence shows retained identity and In Progress until a user-authorized merge permits the completion check

#### Scenario: Merge is unavailable
- **WHEN** the test PR has not been authorized to merge
- **THEN** acceptance reports completion as pending rather than claiming a passed lifecycle
