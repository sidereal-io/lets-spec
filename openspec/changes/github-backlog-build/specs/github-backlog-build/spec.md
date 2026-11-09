## Purpose

Carry an existing GitHub story through the shared backlog workflow while
preserving existing ownership, recovery, PR and finishing behavior.

## ADDED Requirements

### Requirement: Explicit configuration supports both agent environments
The GitHub backlog workflow SHALL work from both unchanged T3 and standalone
coding-agent CLIs using explicitly configured compatible integrations. Its
support SHALL NOT depend on T3 code changes, requests to T3 maintainers or a
T3-only initial support boundary. Both environments SHALL enforce the same
core operation and evidence guarantees.

#### Scenario: Agent runs in a standalone CLI
- **WHEN** a standalone coding-agent CLI has the explicitly selected compatible tools and result-submission support
- **THEN** the full existing-story GitHub workflow is available without T3

#### Scenario: Agent runs in unchanged T3
- **WHEN** an agent in unchanged T3 has the explicitly selected compatible tools and result-submission support
- **THEN** the same GitHub workflow is available without a T3 patch or upstream request

#### Scenario: Configured tools differ by environment
- **WHEN** T3 and a standalone CLI run lets-go with a compatible configured default connection, changed explicitly in configuration when a different binding is needed
- **THEN** Lets applies the same operation, policy and evidence validation without switching backlog provider or relaxing guarantees

### Requirement: GitHub selection is explicit and validated
Lets SHALL select one GitHub backlog for item operations using validated release
defaults or explicit repository provider/definition and scope settings.
Lets SHALL reject invalid selection, incompatible versions, ambiguous projected
fields and configured field/status mappings before requesting writes, without
falling back to another provider.

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
- **WHEN** the submitted output ends before the backend's final candidate page
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
Fresh validated submitted sole ownership and In Progress status SHALL be
required before work starts or resumes. Local recovery state SHALL NOT establish
current remote ownership or distinguish remote sessions using the same actor.

#### Scenario: Ownership changes during claim
- **WHEN** assignment is followed by a validated submitted read showing another owner
- **THEN** Lets reports conflict and does not authorize work

#### Scenario: Assignment succeeds but status fails
- **WHEN** validated submitted output establishes assignment but not the requested status transition
- **THEN** Lets exposes the partial claim and requires safe recovery before work

### Requirement: Work identity survives sessions
Lets SHALL resolve the scoped provider, backlog, repository and item identity
on each invocation and bind it into every request, including any explicit
association or completion request. It SHALL NOT add a committed identity file.
Lets-go SHALL use its existing scoped branch/issue lookup plus fresh native ownership/status
observations for ordinary resume, without requiring the original
recovery record or making another claim. Legacy branches SHALL be able to bind a
uniquely scoped issue through the same fresh read. Private recovery SHALL
remain separate and SHALL be required for original-operation uncertainty
reconciliation and claim release; public identity alone SHALL NOT grant those
authorities.

#### Scenario: Resume has a conflicting identity
- **WHEN** the request's bound Project or item differs from the issue resolved from the branch
- **THEN** Lets reports disagreement and requests no mutation

#### Scenario: Recovery record is unavailable
- **WHEN** a caller resolves the issue by its existing branch lookup but lacks the original recovery record
- **THEN** Lets permits ordinary resume after fresh sole-owner/In Progress verification when no known uncertainty blocks it
- **AND** it does not adopt the original worker's private claim or authorize its release

#### Scenario: Legacy claim has no journal
- **WHEN** an in-progress branch predates private journals and uniquely resolves to the selected issue with the authenticated actor as sole owner and In Progress
- **THEN** lets-go resumes the existing work without a new claim or fabricated recovery record

### Requirement: Release preserves other workers
Lets SHALL verify current ownership before each release step and SHALL NOT
clear another worker's ownership or status. Branch-creation failure SHALL
trigger bounded release or an explicit unresolved recovery result.

#### Scenario: Branch creation fails
- **WHEN** a valid claim is acquired but the local branch cannot be created
- **THEN** Lets requests safe release of that claim and reports any unresolved effects

#### Scenario: Another actor takes ownership before cleanup
- **WHEN** a fresh validated submitted read shows a competing actor before release
- **THEN** Lets does not clear that actor or reset their status

### Requirement: Uncertain writes retain their original identity
Lets SHALL retain the original mutation input, scope and identity when a result
is missing, expired or uncertain. Retry and progression SHALL remain blocked
until a complete validated reconciliation read. That read ends the block
whatever it shows; an unresolved result is reported, not retained.

#### Scenario: Claim response is lost
- **WHEN** a claim may have reached GitHub but its response is unavailable
- **THEN** Lets requests reconciliation of the original claim instead of issuing another claim

#### Scenario: A late response arrives
- **WHEN** a result arrives after its action expires
- **THEN** Lets can retain it for reconciliation but does not accept it as permission to progress

#### Scenario: Uncertain write exists in another local worktree
- **WHEN** worktree A records an uncertain write for an item and worktree B attempts to continue that item using the same user-configured store
- **THEN** Lets finds the original operation by scoped item identity and requires reconciliation before more work or writes

#### Scenario: Resume occurs on another machine
- **WHEN** the issue is uniquely resolved on another machine without the original private recovery store
- **THEN** Lets uses fresh native reads for ordinary resume and does not claim to know unseen outstanding writes
- **AND** known unresolved effects or incomplete observations pause the affected work without granting release authority

### Requirement: Completion requires the exact associated merge
Lets SHALL verify the exact associated PR's native closing relationship and
merge evidence through validated submitted tool output before authorizing
completion. The existing merged-PR stop SHALL NOT invoke a completion update;
this requirement governs explicit completion requests in shared conformance.
The GitHub definition SHALL NOT choose a new workflow transition. Readiness or
an unrelated PR merge SHALL NOT authorize Done.

#### Scenario: Ready PR is unmerged
- **WHEN** the associated PR is ready for review but has not merged
- **THEN** Lets leaves the item In Progress and rejects completion

#### Scenario: A feature branch merges in a stack
- **WHEN** a PR merges into a feature branch without the required native closing relationship
- **THEN** Lets does not infer completion of the associated item

#### Scenario: GitHub already completed the item
- **WHEN** exact merge is established and native automation has already produced the required completed state
- **THEN** Lets accepts completion without repeating the remote update

### Requirement: Required observation support is checked before mutation
Lets SHALL validate selected tool capabilities and output mappings before
requesting GitHub writes. Definitions SHALL cover the reads required for claim,
read-only resume, recovery and any explicit exact associated merge checks. Missing required output SHALL pause
progression without requiring a capture service or host modification.

#### Scenario: Ordinary configured tool supplies complete output
- **WHEN** an agent submits complete scoped GitHub tool output using the selected compatible definition
- **THEN** Lets applies the contract checks without requiring an independent receipt

#### Scenario: Mutation result is missing after dispatch
- **WHEN** a mutation was issued but its result is unavailable
- **THEN** Lets retains uncertainty and offers bounded reconciliation reads or stopping without another write

### Requirement: Live support needs fresh scoped acceptance
The GitHub path SHALL require automated behavior checks and a fresh end-to-end
acceptance run through its actual configured tools and result contract before support is claimed.
Offline doubles and historical prototype acceptance SHALL NOT qualify it.

#### Scenario: Offline suite passes without a live run
- **WHEN** policy and translation-double tests pass but no fresh live workflow has been demonstrated
- **THEN** the release evidence identifies live support as unqualified

### Requirement: Shipped GitHub translation handles actual structured output
The shipped definition SHALL use structured GitHub API responses through
`gh api graphql`, including scoped Project selection, union and null fields,
required nested connection coverage and structured error types. It SHALL NOT
infer complete enumeration from a high-level command's item limit or classify
errors by stderr keywords.

#### Scenario: Project field values include several Projects
- **WHEN** a response contains field-value arrays for several Projects and a null union member
- **THEN** translation selects only the configured Project and either maps its required fields or reports the specific gap

#### Scenario: GraphQL returns partial mutation data
- **WHEN** a mutation response contains partial data and structured errors
- **THEN** Lets retains the partial or unknown effects instead of inferring none from the error category

### Requirement: Existing branches are checked without repair
An existing branch SHALL skip Claim. Before unfinished work, Lets SHALL check
fresh sole assignment to the authenticated actor and In Progress. On a mismatch
or unavailable facts, it SHALL report the condition and stop without acquiring
a new claim, reassigning the issue or changing status. Terminal PRs SHALL retain
the existing merged or rejected stop without updating Project status.

#### Scenario: Existing branch has no owner
- **WHEN** a branch exists but its issue is unassigned and Todo
- **THEN** Lets reports the ownership and status mismatch and performs no repair write

#### Scenario: Reopened issue has an old merged PR
- **WHEN** an issue is reopened and has no surviving change branch but an old PR once closed it
- **THEN** Lets does not select that historical PR as a completion caller or set Done from it

#### Scenario: Rejected PR branch was deleted
- **WHEN** a historical PR was closed without merge and its branch no longer exists
- **THEN** that PR does not impose a new rejected-work stop on the existing new-work path

### Requirement: Live qualification names its actual connection
The default shipped gh CLI binding SHALL NOT establish live MCP-only support.
Custom MCP compatibility SHALL remain an offline conformance claim until a
fresh live run qualifies the specific definition, connection and versions.
Both required hosts SHALL be qualified through their actual selected tools,
including an actual delegated step, without implying support for other bindings.

#### Scenario: CLI acceptance passes without an MCP run
- **WHEN** both required hosts pass fresh CLI acceptance but no MCP-only live run has passed
- **THEN** release evidence qualifies the tested CLI configurations and lists MCP-only live support as unqualified
