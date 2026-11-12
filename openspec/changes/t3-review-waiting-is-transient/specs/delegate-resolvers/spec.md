## ADDED Requirements

### Requirement: A T3 review stops to ask only with a pending request
When `t3` answers `lets delegate review run`, it SHALL treat the session as stopped to ask only when T3 holds a pending request for the thread. Then the command SHALL exit 5 at once, print nothing on stdout, and say `the session stopped to ask` on stderr, followed by the thread's id. A run that T3 shows as `waiting` with no pending request SHALL NOT end the review. `t3` SHALL keep waiting for that run to end, until the review's time limit.

#### Scenario: The run shows waiting for a moment, then completes
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with every required option inside T3 Code
- **AND** T3 shows the thread's run as `waiting`, with no pending request, and then as completed with a final message
- **THEN** the command exits 0 and prints the final message

#### Scenario: The session asks a question
- **WHEN** the same review's run is `waiting` or running, and T3 holds a pending request for the thread
- **THEN** the command exits 5, stdout is empty, and stderr says `the session stopped to ask (thread <id>)`

#### Scenario: The run stays waiting
- **WHEN** the same review's run stays `waiting`, with no pending request, past the review's time limit
- **THEN** the command exits 6, stdout is empty, and stderr names the thread
