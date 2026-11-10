## REMOVED Requirements

### Requirement: Contract validation leaves production integrations unchanged
**Reason**: The executable adapter contract is retired (ADR-021 supersedes ADR-015). lets runs backlog adapters in its own code.
**Migration**: None needed: no production integration used the contract. The `lets-backlog` capability describes the backlog behavior.

### Requirement: Executable boundary separates responsibilities
**Reason**: Adapters are no longer separate programs speaking JSON over stdin and stdout.
**Migration**: Use `lets backlog`; see the `lets-backlog` capability.

### Requirement: Contract covers the full backlog workflow
**Reason**: The operation inventory is replaced by the `lets backlog` commands, which cover the build path. Setup and shaping move in #137.
**Migration**: See the `lets-backlog` capability.

### Requirement: Shared identity works without browser URLs
**Reason**: The contract is retired. Identity rules return when a provider without URLs is added.
**Migration**: None needed.

### Requirement: Shared metadata preserves current meanings
**Reason**: The contract is retired. Kind, Priority, Size and Status keep their meanings in the `lets-backlog` capability.
**Migration**: See *item reads one issue with its Project fields* in `lets-backlog`.

### Requirement: Capabilities preserve workflow outcomes
**Reason**: Capability negotiation is retired with the contract.
**Migration**: None needed.

### Requirement: Configuration separates shared settings from authentication
**Reason**: There is no backlog configuration yet: GitHub is the only provider. `gh` keeps its own sign-in.
**Migration**: None needed.

### Requirement: Claims report their actual guarantee
**Reason**: The claim tokens and guarantee levels are retired.
**Migration**: See *claim assigns the issue only when nobody has it* in `lets-backlog`.

### Requirement: Mutation errors support safe recovery
**Reason**: Mutation journals and reconciliation are retired. A failed write is reported as it happened.
**Migration**: See *A failed claim write is reported, not repaired* in `lets-backlog`.

### Requirement: Completion follows confirmed merge
**Reason**: lets writes no completion. GitHub closes the issue when the pull request merges.
**Migration**: None needed.

### Requirement: Four-provider evidence qualifies conformance claims
**Reason**: Conformance profiles are retired with the contract. Each provider's story carries its own acceptance.
**Migration**: None needed.

### Requirement: Discovery establishes backlog selection
**Reason**: The backlog is the one Project linked to the repository.
**Migration**: See *The backlog is the one Project linked to the repository* in `lets-backlog`.

### Requirement: Runtime releases exclude unused conformance payloads
**Reason**: The conformance kit is removed, so no payload is left to exclude.
**Migration**: None needed.
