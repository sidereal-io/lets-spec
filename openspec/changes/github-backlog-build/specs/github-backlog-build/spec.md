## Purpose

Carry an existing GitHub story through the shared backlog workflow while
preserving native ownership, safe recovery and completion after verified merge.

## ADDED Requirements

### Requirement: Explicit configuration supports both agent environments
The GitHub backlog workflow SHALL work from both unchanged T3 and standalone
coding-agent CLIs using explicitly configured compatible integrations. Its
support SHALL NOT depend on T3 code changes, requests to T3 maintainers or a
T3-only initial support boundary. Both environments SHALL enforce the same
core operation and evidence guarantees.

#### Scenario: Agent runs in a standalone CLI
- **WHEN** a standalone coding-agent CLI has the explicitly selected compatible tools and qualified evidence channel
- **THEN** the full existing-story GitHub workflow is available without T3

#### Scenario: Agent runs in unchanged T3
- **WHEN** an agent in unchanged T3 has the explicitly selected compatible tools and qualified evidence channel
- **THEN** the same GitHub workflow is available without a T3 patch or upstream request

#### Scenario: Configured tools differ by environment
- **WHEN** users explicitly select different compatible tool connections in the two environments
- **THEN** Lets applies the same operation, policy and evidence validation without switching backlog provider or relaxing guarantees

### Requirement: GitHub selection is explicit and validated
Lets SHALL select one GitHub backlog for item operations using validated release
defaults or explicit repository provider/definition and scope settings.
Lets SHALL reject invalid selection, incompatible versions and ambiguous field
mappings before requesting writes, without falling back to another provider.

#### Scenario: Multiple linked Projects
- **WHEN** discovery returns two eligible linked Projects and none is selected
- **THEN** Lets reports the ambiguity and requests no item mutation

#### Scenario: Invalid explicit definition
- **WHEN** the selected definition is missing or incompatible
- **THEN** Lets names the selection problem and does not use the default instead

### Requirement: Candidate enumeration proves its coverage
Lets SHALL require complete repository/Project-scoped candidate, metadata,
ownership and directional blocker evidence before selecting ready work.

#### Scenario: A page is missing
- **WHEN** the submitted capture ends before the backend's final candidate page
- **THEN** Lets reports incomplete enumeration and authorizes no claim

#### Scenario: A blocker cannot be read
- **WHEN** candidate data is present but required blocker coverage is unavailable
- **THEN** Lets reports the capability or permission gap instead of treating the item as unblocked

### Requirement: Ready work uses shared policy
Lets SHALL exclude Epics, Wont items, owned items and work with open blockers.
Lets SHALL rank remaining ready items by Must, Should, Could and the shared
contract's deterministic tie-break, retaining packet and glossary prerequisites.

#### Scenario: Mixed candidates
- **WHEN** complete candidate evidence contains eligible Must and Should stories plus an owned Must and a blocked Must
- **THEN** Lets selects the eligible Must and does not claim either excluded item

### Requirement: Claiming preserves GitHub's actual guarantee
Lets SHALL treat GitHub claiming as best-effort at the authenticated actor level.
Fresh independently captured sole ownership and In Progress status SHALL be
required before work starts or resumes. Local recovery state SHALL NOT establish
current remote ownership or distinguish remote sessions using the same actor.

#### Scenario: Ownership changes during claim
- **WHEN** assignment is followed by a captured read showing another owner
- **THEN** Lets reports conflict and does not authorize work

#### Scenario: Assignment succeeds but status fails
- **WHEN** captured evidence establishes assignment but not the requested status transition
- **THEN** Lets exposes the partial claim and requires safe recovery before work

### Requirement: Work identity survives sessions
Lets SHALL retain immutable provider, backlog, repository and item identity
through branch creation, planning, resume, PR association and completion.
Private continuation SHALL remain separate from committed identity and SHALL
NOT be reconstructed from an item number as authority to adopt a session.

#### Scenario: Resume has a conflicting identity
- **WHEN** the change identity names a different Project or item from the requested continuation
- **THEN** Lets reports disagreement and requests no mutation

#### Scenario: Private continuation is unavailable
- **WHEN** a caller has committed item identity but lacks the original private continuation
- **THEN** Lets does not silently adopt the original session or authorize its release

### Requirement: Release preserves other workers
Lets SHALL verify current ownership before each release step and SHALL NOT
clear another worker's ownership or status. Branch-creation failure SHALL
trigger bounded release or an explicit unresolved recovery result.

#### Scenario: Branch creation fails
- **WHEN** a valid claim is acquired but the local branch cannot be created
- **THEN** Lets requests safe release of that claim and reports any unresolved effects

#### Scenario: Another actor takes ownership before cleanup
- **WHEN** a fresh captured read shows a competing actor before release
- **THEN** Lets does not clear that actor or reset their status

### Requirement: Uncertain writes retain their original identity
Lets SHALL retain the original mutation input, scope and identity when a result
is missing, expired or uncertain. Retry and progression SHALL remain blocked
until independent captured evidence resolves effects under core policy.

#### Scenario: Claim response is lost
- **WHEN** a claim may have reached GitHub but its response is unavailable
- **THEN** Lets requests reconciliation of the original claim instead of issuing another claim

#### Scenario: A late response arrives
- **WHEN** a result arrives after its action expires
- **THEN** Lets can retain it for reconciliation but does not accept it as permission to progress

### Requirement: Completion requires the exact associated merge
Lets SHALL verify the exact associated PR's native closing relationship and
merge evidence through independent captured tool results before authorizing
completion. Readiness or an unrelated PR merge SHALL NOT authorize Done.

#### Scenario: Ready PR is unmerged
- **WHEN** the associated PR is ready for review but has not merged
- **THEN** Lets leaves the item In Progress and rejects completion

#### Scenario: A feature branch merges in a stack
- **WHEN** a PR merges into a feature branch without the required native closing relationship
- **THEN** Lets does not infer completion of the associated item

#### Scenario: GitHub already completed the item
- **WHEN** exact merge is established and native automation has already produced the required completed state
- **THEN** Lets accepts completion without repeating the remote update

### Requirement: Evidence capability is checked before mutation
Lets SHALL require a qualified independent capture channel before requesting
GitHub writes whose effects or prerequisites require remote verification.
Unavailable capture SHALL name the missing capability and pause the workflow.

#### Scenario: Only agent-saved output is available
- **WHEN** the agent supplies valid JSON copied from a GitHub read without independently retrievable original capture
- **THEN** Lets rejects it as independent proof and requests no claim mutation

#### Scenario: Capture becomes unavailable after dispatch
- **WHEN** a mutation was issued but its original capture cannot be retrieved
- **THEN** Lets retains uncertainty and offers reconciliation or stopping without another write

### Requirement: Live support needs fresh scoped acceptance
The GitHub path SHALL require automated behavior checks and a fresh end-to-end
acceptance run through its actual evidence channel before support is claimed.
Offline doubles and historical prototype acceptance SHALL NOT qualify it.

#### Scenario: Offline suite passes without a qualified channel
- **WHEN** policy and capture-double tests pass but no real channel has been demonstrated
- **THEN** the release evidence identifies live support as unqualified
