## Why

Main accepted ADR-015 after the executable implementation in #172 was
reviewed. Shipping that implementation now would activate the execution
model the decision supersedes. The user chose to port this PR (D1).

## What Changes

- Replace backlog executable dispatch with versioned bounded action requests
  and structured result submissions. Lets retains policy and sequencing (D2).
- Select a shipped or explicit custom provider definition. Validate its
  version, tool requirements, mappings and repository scope before actions.
- Require independently retrieved capture records for remote facts. Stop
  when capture is unavailable; never substitute agent assertions (D4).
- Preserve native actor-level best-effort ownership, private continuation,
  uncertainty recovery, immutable identity and exact merged PR completion (D3).
- Integrate with main's lets-go, lets-plan, lets-build and lets-review-build
  split without restoring a second workflow runner (D5).
- Replace executable-specific contract/conformance and release packaging.
  Retain old evidence as history and qualify support through fresh tests (D7).

## Capabilities

### New Capabilities

- `github-backlog-build`: Existing GitHub work crosses the request/result
  boundary with verified evidence and safe recovery.

### Modified Capabilities

- `backlog-adapter-contract`: Replace transport-specific requirements while
  retaining operation semantics, typed errors and behavioral guarantees.
- `lets-go`: Route selection and claims through the common boundary and pass
  private continuation across the existing steps.

## Impact

Touches backlog runtime, definition selection, trusted-capture integration,
CLI commands, workflow instructions, contract/conformance, packaging and
regressions. Runtime packages ship consumed core code and definitions, not
adapter executables or unused conformance sources. Existing backend CLIs
remain external dependencies. Delegation migration stays separate (D6).

## Delivery prerequisite

The capture channel is not established in this environment. Defining JSON
reports or a local file format does not resolve that prerequisite. The port
cannot claim a working GitHub build journey until independent capture proves
fresh ownership/status and exact associated merge evidence (D4).
