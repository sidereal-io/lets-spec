# Implementation tasks

This checklist retains #136 / draft #172 as the existing delivery owner. It uses
small tasks rather than compressing the migration into the task-writing
skill's usual twelve-task maximum, explicitly approved by the user in brainstorm
D11. No prerequisite story or competing PR is created. Each task adds its
observable behavior case before implementation.
Nothing is implemented or checked off by this planning restart.

## 1. Shared configuration and result contract

- [ ] 1.1 [medium] Reject incompatible or conflicting inert definition sources before issuing an action. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 1.2 [medium] Resolve repository selection separately from machine tool settings without explicit-selection fallback. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 1.3 [easy] Reject obsolete executable configuration with its file/key and supported migration remedy. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 1.4 [medium] Reject optional supplied normalized operation fields that disagree with the definition's projections from submitted structured tool output. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.5 [medium] Issue a versioned action binding the exact operation/input/scope to its attempt and required effects. (verify: node --test tests/lets/backlog/scopes.test.ts)
- [ ] 1.6 [medium] Accept complete matching submitted tool observations without an independent capture receipt. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.7 [medium] Reject expired, oversized or uncertain-termination submissions as authority to progress without inferring no remote effects. (verify: node --test tests/lets/backlog/process.test.ts)

- [ ] 1.8 [medium] Reject submissions bound to another call, scope or input without authorizing progression. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.9 [easy] Reject unsupported contract versions and malformed or unknown operation inputs with their defined typed errors. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.10 [medium] Fail preflight on unavailable tools, missing login or missing execution/output bounds without fallback. (verify: node --test tests/lets/backlog/capabilities.test.ts)
- [ ] 1.11 [medium] Apply the same operation validators to an explicitly selected custom definition. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 1.12 [medium] Derive normalized facts from bounded inline or file-referenced output without agent transcription. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.13 [medium] Accept timely submissions using Lets receipt time when exact tool timestamps and optional MCP server version are unavailable. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 1.14 [medium] Fail before issuance when private state cannot support durable private writes and locking. (verify: node --test tests/lets/backlog/state.test.ts)

## 2. Private recovery [depends-on: 1]

- [ ] 2.1 [complex] Persist issued action state atomically in private per-session storage before returning control to the agent. (verify: node --test tests/lets/backlog/state.test.ts)
- [ ] 2.2 [medium] Acknowledge duplicate accepted submissions after restart without advancing the operation twice. (verify: node --test tests/lets/backlog/state.test.ts)
- [ ] 2.3 [complex] Reconcile an uncertain mutation through fresh bounded reads tied to its original identity before permitting another write. (verify: node --test tests/lets/backlog/recovery.test.ts)
- [ ] 2.4 [medium] Preserve typed error/effect classifications from validated observations instead of exception-message keywords. (verify: node --test tests/lets/backlog/failures.test.ts)
- [ ] 2.5 [medium] Stop on incompatible private journal versions without overwriting or replaying their operations. (verify: node --test tests/lets/backlog/state.test.ts)

- [ ] 2.6 [medium] Allow at most two corrections to a rejected read submission within the original deadline while recording every attempt. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 2.7 [medium] Reconcile unknown effects after rejection of a write submission without reactivating write permission. (verify: node --test tests/lets/backlog/recovery.test.ts)
- [ ] 2.8 [complex] Recover a proven stale local lock without stealing a live or ambiguous holder's lock. (verify: node --test tests/lets/backlog/state.test.ts)

## 3. GitHub reads and claim lifecycle [depends-on: 2]

- [ ] 3.0 [complex] Translate scrubbed real GitHub GraphQL output through the shipped definition, including Project array selection, unions/nulls, connection coverage and partial structured errors. (verify: node --test tests/lets/backlog/providers.test.ts)
- [ ] 3.1 [medium] Resolve one repository-linked GitHub Project from bounded submitted discovery reads or report ambiguity. (verify: node --test tests/lets/backlog/providers.test.ts)
- [ ] 3.2 [medium] Reject candidate enumeration with missing pages, required metadata or inconsistent cursor coverage. (verify: node --test tests/lets/backlog/items.test.ts)
- [ ] 3.3 [medium] Reject readiness when directional blocker observations are incomplete. (verify: node --test tests/lets/backlog/relationships.test.ts)
- [ ] 3.4 [medium] Select the first eligible GitHub candidate using shared readiness/ranking from complete submitted observations. (verify: node --test tests/lets/backlog/items.test.ts)
- [ ] 3.5 [complex] Return a partial-claim recovery result when the assignment action succeeds but the bounded status action does not. (verify: node --test tests/lets/backlog/claims.test.ts)
- [ ] 3.6 [medium] Authorize work only after a fresh sole-owner/In Progress read for the recorded claim. (verify: node --test tests/lets/backlog/claims.test.ts)
- [ ] 3.7 [complex] Release only recorded claim state after fresh ownership checks before each cleanup write. (verify: node --test tests/lets/backlog/claims.test.ts)
- [ ] 3.8 [medium] Return explicit recovery when branch-creation failure cannot safely release its newly acquired claim. (verify: node --test tests/lets/backlog/recovery.test.ts)

- [ ] 3.9 [medium] Return named uncertain/unavailable claim results and report the release outcome with branch failure. (verify: bats tests/skill-interfaces.bats)

## 4. Continuation and completion [depends-on: 3]

- [ ] 4.1 [medium] Preserve immutable item identity separately from private continuation across step context. (verify: node --test tests/lets/backlog/scopes.test.ts)
- [ ] 4.2 [medium] Stop resumed work when original private continuation or fresh ownership/status observations are missing or conflicting. (verify: node --test tests/lets/backlog/recovery.test.ts)
- [ ] 4.3 [medium] Bind the exact associated PR to the scoped issue using validated native closing relationship data. (verify: node --test tests/lets/backlog/completion.test.ts)
- [ ] 4.4 [medium] Reject completion until fresh observations identify that exact PR's merge reference/commit and required closing relationship. (verify: node --test tests/lets/backlog/completion.test.ts)
- [ ] 4.5 [medium] Return completed without a repeated status write when native automation already completed the item after the qualifying merge. (verify: node --test tests/lets/backlog/completion.test.ts)

## 5. Workflow and release integration [depends-on: 4]

- [ ] 5.1 [complex] Expose begin/submit/resume responses through the backlog CLI without directly executing provider tools. (verify: pnpm test:backlog)
- [ ] 5.2 [medium] Route lets-go's existing-story lifecycle through the shared boundary while step skills retain only their own step/report. (verify: bats tests/skill-interfaces.bats)
- [ ] 5.3 [medium] Retain the four-provider behavioral inventory through action/submission conformance without claiming offline fixtures establish live support. (verify: node --test tests/lets/backlog/inventory.test.ts)
- [ ] 5.4 [medium] Package consumed backlog runtime/definitions while excluding obsolete adapter bundles and unused conformance payloads. (verify: nix flake check)

- [ ] 5.5 [medium] Apply identical policy and result validation with different explicitly configured compatible tool connections across the two host environments. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 5.6 [medium] Check the literal backlog operation and file-argument forms in the owning lets-go procedures and shared action loop. (verify: bats tests/skill-interfaces.bats)

## Acceptance gate after implementation

Update contract/definition-authoring/setup docs alongside their owning tasks.
Before any later push, pnpm test and nix flake check must pass. Then perform fresh
acceptance through actual tools in unchanged T3 and a standalone coding-agent
CLI, only in the designated live scope. Record configuration/version evidence,
interrupted claim recovery and merge-gated completion. In both environments,
verify command timeout and output limits plus writable shared private-state
storage. Failure must name the missing prerequisite before backend issuance. A user-directed merge is
required for the merged-path acceptance; no task authorizes an automatic merge.
No support claim or PR readiness change follows from offline checks alone.

## Deviations Ledger

- 2026-11-07, planning: exceed twelve task lines to preserve the existing #136 / #172
  scope with separate verifiable behaviors, explicitly approved by the user in
  brainstorm D11. This is a task-sizing departure,
  not permission for implementation, a new architecture, remote mutation or merge.

- 2026-11-07, review corrections: add explicit tasks for rejected submissions,
  unavailable prerequisites, output files, shipped GraphQL translation and
  cross-host configuration. Task count remains within the user's D11 exception.
