## MODIFIED Requirements

### Requirement: Executable boundary separates responsibilities
The contract SHALL define versioned JSON requests on stdin and responses on stdout for executable backlog adapters, with diagnostic stderr, supported operations, operation-specific invocation context, protocol compatibility, process exit behavior, start failures, signal termination, combined stdout/stderr byte limits and timeout handling. It SHALL assign workflow policy to the shared caller, provider translation to adapters and branch/pull request operations to the code host.

#### Scenario: Fake adapter handles a request
- **WHEN** the harness invokes a fake adapter with a supported protocol and operation
- **THEN** it validates the response against the published response definition

#### Scenario: Broken process boundary
- **WHEN** a fake adapter returns malformed JSON, an unsupported protocol, an inconsistent exit/result pair or no response before the timeout
- **THEN** the harness reports a contract failure and does not treat the operation as successful

#### Scenario: Executable cannot start
- **WHEN** the kit's configured adapter executable cannot be started
- **THEN** invocation rejects with category unknown_outcome and effects unknown
- **AND** only the supplied executable is attempted

#### Scenario: Combined diagnostic and response output exceeds its limit
- **WHEN** the kit adapter stdout and stderr together exceed the configured byte limit
- **THEN** the caller stops the adapter with SIGKILL and reports an unknown outcome
- **AND** mutation retry or progression requires reconciliation

#### Scenario: Signal interrupts an invocation
- **WHEN** an adapter prints a valid response and then terminates by signal
- **THEN** the caller rejects the invocation as an unknown outcome rather than accepting the response

#### Scenario: Adapter ignores graceful termination
- **WHEN** a kit adapter ignores SIGTERM and exceeds its deadline
- **THEN** the invocation stops the adapter with SIGKILL and reports unknown_outcome with unknown effects

#### Scenario: Production executable cannot start
- **WHEN** the production caller cannot start the selected executable
- **THEN** it reports invalid_configuration with effects none and attempts no fallback

#### Scenario: Production read exceeds its deadline
- **WHEN** a production read invocation exceeds its deadline
- **THEN** it reports transient with effects none, while an interrupted mutation remains unknown_outcome with unknown effects

