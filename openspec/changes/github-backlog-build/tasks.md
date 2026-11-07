## Architecture port status

The original 20 completed tasks are historical under
history/executable-boundary/tasks.md. They do not qualify this port.
The concrete capture design requires review before implementation. Deployment
and live qualification remain gated. Never count a test double as live
independent evidence.

## 1. Request/result contract

- [ ] 1.1 [complex] Reject malformed, mismatched, replayed, expired and oversized action submissions before progression; retain issued action identity and conservative effects after a missing result. Serialize durable outstanding reservations and atomic acceptance across two callers and crash/restart. (verify: pnpm test)
- [ ] 1.2 [complex] Select versioned shipped/custom definitions as data through one validation path; reject obsolete executable keys, invalid scope/mappings and unavailable required tools without fallback. (verify: pnpm test)

## 2. Independent capture [depends-on: 1]

- [ ] 2.1 [complex] [parallel] Establish a concrete trusted channel outside the agent's editable report and demonstrate actual action/tool/scope/authentication/time/result correlation. Reject editable, forged, stale, incomplete and unavailable capture. (verify: pnpm test)
- [ ] 2.2 [complex] [parallel] Pause routine progression and automatic retry when required remote facts lack independently retrieved capture; retain original mutation provenance for reconciliation. (verify: pnpm test)

## 3. GitHub lifecycle [depends-on: 2]

- [ ] 3.1 [complex] Read and rank complete scoped GitHub packets through agent-executed definition actions, preserving comments, parents, blockers, metadata, numeric ordering and capability failures. (verify: pnpm test)
- [ ] 3.2 [complex] Request explicit bounded claim/release steps with native ownership checks, partial-effect recovery, fresh captured verification and original private continuation. (verify: pnpm test)
- [ ] 3.3 [complex] Preserve immutable identity through planning/archive; associate exact native closing links and require captured exact PR merge/commit before idempotent Done. (verify: pnpm test)

## 4. Workflow and release [depends-on: 3]

- [ ] 4.1 [complex] Integrate explicit private continuation into lets-go, lets-plan, lets-build and lets-review-build while preserving their current step ownership; document callable actions/submissions and error handling. (verify: pnpm test)
- [ ] 4.2 [complex] Replace executable transport conformance/packaging with offline request/result and capture cases and production-consumed definitions. Preserve behavioral coverage and exclude unused kit payloads. (verify: nix flake check)
- [ ] 4.3 [complex] Run automated repository checks and fresh scoped live equivalence acceptance, including independent claim and exact merge evidence. Historical mutations must not be repeated. (verify: pnpm test)

Task 2.1's command verifies offline validation only. Completing that task
also requires recorded evidence of the actual deployed trust boundary and
its real tool/authentication provenance. An offline pass cannot establish
that prerequisite. Task 4.3 also requires nix flake check. Plan approval precedes apply. After
all apply tasks are complete, lets-review-build owns independent code review,
strict validation, verification, archive and PR readiness. Those finishing
gates are not apply tasks and must not depend on checking themselves off.
A live merge requires the user;
keep completion pending if merge or independent evidence is unavailable.

## Deviations Ledger

- 2026-11-07: user authorized porting #172 to ADR-015 rather than retaining
  its executable design. The PR is draft and its archive was reverted.
