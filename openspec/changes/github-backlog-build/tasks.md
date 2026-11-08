# Implementation tasks

This checklist retains #136 / draft #172 as the existing delivery owner. It uses
small tasks rather than compressing the migration into the task-writing
skill's usual twelve-task maximum, explicitly approved by the user in brainstorm
D11. No prerequisite story or competing PR is created. Each task adds its
observable behavior case before implementation.
Nothing is implemented or checked off by this planning restart.

## 1. Shared configuration and result contract

- [x] 1.1 [medium] Reject incompatible or conflicting inert definition sources before issuing an action. (✓ node --test --test-isolation=none tests/lets/backlog/config.test.ts passed, 14 tests)
- [x] 1.2 [medium] Resolve repository selection separately from machine tool settings without explicit-selection fallback. (✓ node --test --test-isolation=none tests/lets/backlog/config.test.ts passed, 17 tests)
- [x] 1.3 [easy] Reject obsolete executable configuration with its file/key and supported migration remedy. (✓ node --test --test-isolation=none tests/lets/backlog/config.test.ts passed, 14 tests)
- [x] 1.4 [medium] Reject optional supplied normalized operation fields that disagree with the definition's projections from submitted structured tool output. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 46 tests)
- [x] 1.5 [medium] Issue a versioned action binding the exact operation/input/scope to its attempt and required effects. (✓ node --test tests/lets/backlog/scopes.test.ts passed, 9 tests)
- [x] 1.6 [medium] Accept complete matching submitted tool observations without an independent capture receipt. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 47 tests)
- [x] 1.7 [medium] Reject expired, oversized or uncertain-termination submissions as authority to progress without inferring no remote effects. (✓ node --test tests/lets/backlog/process.test.ts passed, 24 tests)
- [x] 1.8 [medium] Reject submissions bound to another call, scope or input without authorizing progression. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 55 tests)
- [x] 1.9 [easy] Reject unsupported contract versions and malformed or unknown operation inputs with their defined typed errors. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 60 tests)
- [x] 1.10 [medium] Fail preflight on unavailable tools, missing login or missing execution/output bounds without fallback. (✓ node --test tests/lets/backlog/capabilities.test.ts passed, 14 tests)
- [x] 1.11 [medium] Apply the same operation validators to an explicitly selected custom definition. (✓ node --test tests/lets/backlog/config.test.ts passed, 16 tests)
- [x] 1.12 [medium] Derive normalized facts from bounded inline or file-referenced output without agent transcription. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 64 tests)
- [x] 1.13 [medium] Accept timely submissions using Lets receipt time when exact tool timestamps and optional MCP server version are unavailable. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 66 tests)
- [x] 1.14 [medium] Fail before issuance when private state cannot support durable private writes and locking. (✓ node --test tests/lets/backlog/state.test.ts passed, 9 tests)
- [x] 1.15 [medium] Validate the repository and PR operation input/result fields under the same selected GitHub definition. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 74 tests; tsc --noEmit passed)
- [x] 1.16 [medium] Resolve implicit gh, sole-entry and named-default connections, rejecting several entries without a default or invalid explicit selection. (✓ node --test tests/lets/backlog/config.test.ts passed, 24 tests)
- [x] 1.17 [medium] Reject a default-connection change as a replacement for an uncertain operation's recorded connection. (✓ node --test tests/lets/backlog/config.test.ts passed, 27 tests)
- [x] 1.18 [medium] Allocate and return a worker ID before action issuance when a new caller supplies none. (✓ node --test tests/lets/backlog/scopes.test.ts passed, 11 tests)

## 2. Private recovery [depends-on: 1]

- [x] 2.1 [complex] Persist issued action state atomically under ordered per-resource-key locks in the shared private store before returning control to the agent. (✓ node --test tests/lets/backlog/state.test.ts passed, 11 tests)
- [x] 2.2 [medium] Acknowledge duplicate accepted submissions after restart without advancing the operation twice. (✓ node --test tests/lets/backlog/state.test.ts passed, 12 tests)
- [x] 2.3 [complex] Reconcile an uncertain mutation through fresh bounded reads tied to its original identity before permitting another write. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 8 tests; tsc --noEmit passed)
- [x] 2.4 [medium] Preserve typed error/effect classifications from validated observations instead of exception-message keywords. (✓ node --test tests/lets/backlog/failures.test.ts passed, 22 tests)
- [x] 2.5 [medium] Stop on incompatible private journal versions without overwriting or replaying their operations. (✓ node --test tests/lets/backlog/state.test.ts passed, 13 tests)
- [x] 2.6 [medium] Allow at most two corrections to a rejected read submission within the original deadline while recording every attempt. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 76 tests)
- [x] 2.7 [medium] Reconcile unknown effects after rejection of a write submission without reactivating write permission. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 9 tests)
- [x] 2.8 [complex] Recover a proven stale local lock without stealing a live or ambiguous holder's lock. (✓ node --test tests/lets/backlog/state.test.ts passed, 17 tests)
- [x] 2.9 [complex] Block work and new writes for an outstanding item mutation across local worktrees using the same configured store, regardless of a new operation or worker ID. (✓ node --test tests/lets/backlog/state.test.ts passed, 18 tests)
- [x] 2.10 [medium] Preserve original operation provenance for uncertain-write reconciliation and release without requiring it for ordinary resume on another machine. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 10 tests)
- [x] 2.11 [medium] Reconstruct the original continuation in another worktree or after scratch loss without repeating the write. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 11 tests; covered by operation-ID resume from 2.3 and shared lookup from 2.9)
- [x] 2.12 [medium] Keep uncertain step-write continuations distinct from subsequent runner reads. (✓ node --test tests/lets/backlog/state.test.ts passed, 19 tests; per-operation records from 2.1 preserve blocked-read recovery)
- [x] 2.13 [medium] Reserve PR creation by endpoint, repository and head identity across worktrees and worker IDs. (✓ node --test tests/lets/backlog/state.test.ts passed, 20 tests)
- [x] 2.14 [medium] Block ready or update while an uncertain operation reserves the same PR ID. (✓ node --test tests/lets/backlog/state.test.ts passed, 21 tests; tsc --noEmit passed)

## 3. GitHub observations and PR actions [depends-on: 2]

- [x] 3.0 [complex] Expose operation, submit and resume responses through the backlog CLI without directly executing provider tools. (✓ pnpm test:backlog passed, 240 tests; tsc --noEmit passed)
- [x] 3.1 [complex] Translate scrubbed real GitHub GraphQL output through the shipped definition, including Project array selection, unions/nulls, connection coverage and partial structured errors. (✓ node --test tests/lets/backlog/providers.test.ts passed, 17 tests; tsc --noEmit passed)
- [x] 3.2 [medium] Resolve one repository-linked GitHub Project from bounded submitted discovery reads or report ambiguity. (✓ node --test tests/lets/backlog/providers.test.ts passed, 24 tests; tsc --noEmit passed)
- [x] 3.3 [medium] Reject candidate enumeration with missing pages, required metadata or inconsistent cursor coverage. (✓ node --test tests/lets/backlog/items.test.ts tests/lets/backlog/providers.test.ts passed, 45 tests; tsc --noEmit passed)
- [x] 3.4 [medium] Read complete thread facts only when includeThread is true, including later-page unread comments, while parent-body reads avoid thread fetching and fixed Project scan limits. (✓ node --test tests/lets/backlog/items.test.ts tests/lets/backlog/providers.test.ts tests/lets/backlog/protocol.test.ts tests/lets/backlog/cli.test.ts passed, 126 tests; tsc --noEmit passed)
- [x] 3.5 [medium] Select a branch PR open-first then newest after repository/head qualification, preserving lookup parity with the GitHub CLI. (✓ node --test tests/lets/backlog/protocol.test.ts passed, 83 tests; tsc --noEmit passed)
- [x] 3.6 [medium] Translate scrubbed repository and PR output through the same GitHub definition, requiring draft creation and classifying missing isDraft confirmation as partial effects. (✓ node --test tests/lets/backlog/providers.test.ts passed, 30 tests; tsc --noEmit passed)
- [x] 3.7 [complex] Expose repository and PR operation commands with the shared action/submission engine under lets backlog. (✓ pnpm test:backlog passed, 286 tests; tsc --noEmit passed)
- [x] 3.8 [medium] Return the continuation when a new step requests PR creation for an uncertain repository/head resource. (✓ node --test tests/lets/backlog/recovery.test.ts tests/lets/backlog/state.test.ts tests/lets/backlog/cli.test.ts passed, 44 tests; tsc --noEmit passed)
- [x] 3.9 [medium] Reconcile uncertain prepared PR-body updates while preserving unrelated sections and closing text. (✓ node --test tests/lets/backlog/recovery.test.ts tests/lets/backlog/cli.test.ts passed, 26 tests; tsc --noEmit passed)
- [x] 3.10 [medium] Confirm the existing ready transition through bounded action results without merging. (✓ node --test tests/lets/backlog/protocol.test.ts tests/lets/backlog/recovery.test.ts passed, 108 tests; tsc --noEmit passed)

## 4. GitHub claim lifecycle [depends-on: 3]

- [x] 4.1 [medium] Reject readiness when directional blocker observations are incomplete. (✓ node --test tests/lets/backlog/relationships.test.ts tests/lets/backlog/providers.test.ts passed, 42 tests; tsc --noEmit passed)
- [x] 4.2 [medium] Select the first eligible GitHub candidate using shared readiness/ranking from complete submitted observations. (✓ node --test tests/lets/backlog/items.test.ts tests/lets/backlog/providers.test.ts passed, 64 tests; pnpm test:backlog passed, 309 tests before added boundary cases; tsc --noEmit passed)
- [x] 4.3 [complex] Return a partial-claim recovery result when the assignment action succeeds but the bounded status action does not. (✓ node --test tests/lets/backlog/claims.test.ts tests/lets/backlog/cli.test.ts tests/lets/backlog/state.test.ts tests/lets/backlog/recovery.test.ts passed, 54 tests; tsc --noEmit passed)
- [x] 4.4 [medium] Authorize work only after a fresh sole-owner/In Progress read for the recorded claim. (✓ node --test tests/lets/backlog/claims.test.ts tests/lets/backlog/recovery.test.ts tests/lets/backlog/state.test.ts tests/lets/backlog/cli.test.ts passed, 60 tests; tsc --noEmit passed)
- [x] 4.5 [complex] Release only recorded claim state after fresh ownership checks before each cleanup write. (✓ node --test tests/lets/backlog/claims.test.ts tests/lets/backlog/cli.test.ts tests/lets/backlog/recovery.test.ts tests/lets/backlog/state.test.ts passed, 66 tests; pnpm test:backlog passed, 329 tests; tsc --noEmit passed)
- [x] 4.6 [medium] Return explicit recovery when branch-creation failure cannot safely release its newly acquired claim. (✓ node --test tests/lets/backlog/recovery.test.ts tests/lets/backlog/claims.test.ts passed, 39 tests; tsc --noEmit passed)
- [x] 4.7 [medium] Return named uncertain/unavailable claim results and report the release outcome with branch failure. (✓ bats tests/skill-interfaces.bats passed, 271 tests)

## 5. Resume and retained completion contract [depends-on: 4]

- [x] 5.1 [medium] Resolve the existing branch's scoped issue through title or explicit issue lookup without an identity file or runner metadata commit. (✓ bats tests/skill-interfaces.bats passed, 272 tests; node --test tests/lets/backlog/providers.test.ts passed, 36 tests; tsc --noEmit passed)
- [x] 5.2 [medium] Continue ordinary resume only after a fresh read shows the authenticated actor as sole assignee and In Progress. (✓ node --test tests/lets/backlog/recovery.test.ts tests/lets/backlog/claims.test.ts tests/lets/backlog/protocol.test.ts passed, 126 tests; tsc --noEmit passed)
- [x] 5.3 [medium] Validate the exact PR association without a GitHub remote write in reference.write conformance. (✓ node --test tests/lets/backlog/completion.test.ts passed, 11 tests; tsc --noEmit passed)
- [x] 5.4 [medium] Reject explicit contract completion requests until the GitHub code-host observations prove the exact associated merge and closing relationship. (✓ node --test tests/lets/backlog/completion.test.ts tests/lets/backlog/recovery.test.ts tests/lets/backlog/state.test.ts passed, 64 tests; tsc --noEmit passed)
- [x] 5.5 [medium] Return completed without a repeated explicit contract status write when native automation already completed the item. (✓ pnpm test:backlog passed, 350 tests; tsc --noEmit passed)
- [x] 5.6 [medium] Resume a uniquely resolved legacy branch without a recovery record or invented original release authority. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 26 tests; tsc --noEmit passed; branch uniqueness retained by 5.1)
- [x] 5.7 [medium] Keep the runner and each step's worker context separate without changing delegated step-report fields. (✓ bats tests/skill-interfaces.bats passed, 273 tests)
- [x] 5.8 [medium] Stop an existing-branch run for unassigned Todo, another status, multiple assignees or unavailable facts without issuing assignment or status writes. (✓ node --test tests/lets/backlog/recovery.test.ts passed, 32 tests)
- [x] 5.9 [medium] Refresh ownership before each later unfinished step and stop after an intervening ownership change. (✓ bats tests/skill-interfaces.bats: 274 behavior tests passed; corrected wrapping verified by focused rerun)
- [x] 5.10 [medium] Return each named read-only ownership verdict without acquiring or releasing a claim. (✓ node --test tests/lets/backlog/claims.test.ts passed, 24 tests; recovery/protocol combined passed, 140 tests; tsc --noEmit passed)

- [x] 5.11 [medium] Drive read-only resume from the walk's pending-mutation result and recheck ownership only after resolved effects and reservation clearance. (✓ bats tests/skill-interfaces.bats: 275 behavior tests passed; corrected wrapping verified by focused rerun)
- [ ] 5.12 [medium] Validate complete assignee sets and actor-only resume verdicts, including multiple assignees and changed historic tokens. (verify: node --test tests/lets/backlog/protocol.test.ts)
- [ ] 5.13 [medium] Drive uncertain claim reconciliation in Enter the branch without repeating acquisition, continuing only for confirmed applied ownership. (verify: bats tests/skill-interfaces.bats)

## 6. Workflow integration [depends-on: 5]

- [ ] 6.1 [medium] Carry the configured default connection into delegated step prompts without adding runner request tokens, report fields or resolver selection. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.2 [medium] Route lets-go's existing-story backlog lifecycle through the shared boundary while steps retain their own work and reports. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.3 [medium] Replace existing-story callouts in runner, plan, brainstorm, build, reviews, draft-PR schemas and the shared issue-comments fetch reference through the same GitHub definition, asserting the reference routes runner and brainstorm to item.read. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.4 [medium] Include original uncertain-operation ID and recovery command in a failed step's existing reason string. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.5 [medium] Preserve the clean-tree check followed by the existing merged-PR stop without ownership checks or a completion write. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.6 [medium] Ignore historical merged or rejected PRs when the branch no longer exists instead of adding a terminal lookup or Done update. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.7 [medium] Preserve the existing stop for a surviving stacked branch's merged PR without claiming the issue is completed. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.8 [easy] Preserve the surviving branch's rejected-PR stop without claiming, completion or build actions. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.9 [medium] Retain the four-provider inventory with attributed code-host fixture facts, marking pull-request.* outside non-GitHub production profiles pending a routing decision. (verify: node --test tests/lets/backlog/inventory.test.ts)
- [ ] 6.10 [medium] Apply identical policy with explicitly configured compatible tool connections in both required hosts. (verify: node --test tests/lets/backlog/config.test.ts)
- [ ] 6.11 [medium] Check the literal operation and file-argument forms in the owning procedures and shared action loop. (verify: bats tests/skill-interfaces.bats)
- [ ] 6.12 [medium] Exercise the existing-story callout inventory with a compatible custom GitHub MCP definition and no gh executable, without claiming live MCP support. (verify: node --test tests/lets/backlog/inventory.test.ts)
- [ ] 6.13 [medium] Fail a delegated step before backend issuance when its selected connection's required tool is unavailable. (verify: bats tests/skill-interfaces.bats)

- [ ] 6.14 [medium] Drive a step's blocked PR write through read-only resume, re-read after resolution and return failed with recovery context if uncertainty remains. (verify: bats tests/skill-interfaces.bats)

## 7. Documentation and release [depends-on: 6]

- [ ] 7.1 [medium] Rewrite the contract docs for submitted output, recorded reads and retained completion conformance, replacing session/token work gates with actor-only ordinary resume and release-specific provenance checks. (verify: node --test tests/lets/backlog/inventory.test.ts)
- [ ] 7.2 [medium] Report unqualified live support for configurations without fresh acceptance, keeping offline compatibility separate. (verify: node --test tests/lets/backlog/inventory.test.ts)
- [ ] 7.3 [medium] Document connection defaults and shared-definition binding limits, the private state path and actionable writable-state sandbox remedies. (verify: node --test tests/lets/backlog/inventory.test.ts)

- [ ] 7.4 [medium] Package consumed runtime and definitions while excluding obsolete adapter bundles and unused conformance payloads. (verify: nix flake check)

## Acceptance gate after implementation

Update contract/definition-authoring/setup docs alongside their owning tasks.
Before any later push, pnpm test and nix flake check must pass. Then perform fresh
acceptance through actual tools in unchanged T3 and a standalone coding-agent
CLI, only in the designated live scope. Record configuration/version evidence,
interrupted claim recovery, read-only existing-branch resume, PR/review writes
and existing terminal stops. Exact-merge completion remains a shared offline
contract check; no new terminal completion caller is implied. In both environments,
verify command timeout and output limits plus writable shared private-state
storage, including the selected tools and writable-state access from an actual
delegated step session. Failure must name the missing prerequisite before
backend issuance. A user-directed merge is required for the merged-path acceptance; no task authorizes an automatic merge.
No support claim or PR readiness change follows from offline checks alone.
Record the actual definition and connection for each host. CLI acceptance does
not qualify an MCP binding: MCP-only live support remains unqualified until its
own actual configured workflow passes. A missing tool in a delegated step must
produce preflight failure; no implicit fallback is allowed.
Release documentation must identify live support as unqualified until the
required real configurations have passed acceptance.

## Deviations Ledger

- 2026-11-07, planning: exceed twelve task lines to preserve the existing #136 / #172
  scope with separate verifiable behaviors, explicitly approved by the user in
  brainstorm D11. This is a task-sizing departure,
  not permission for implementation, a new architecture, remote mutation or merge.

- 2026-11-07, review corrections: add explicit tasks for rejected submissions,
  unavailable prerequisites, output files, shipped GraphQL translation and
  cross-host configuration. Task count remains within the user's D11 exception.

- 2026-11-08, D13 and D14: remove committed identity and terminal-completion
  caller tasks. Preserve the current workflow through adapters, with the
  explicitly approved read-only resume check. Include related code-host callers
  so an MCP-selected existing-story journey has no hidden gh dependency.

- 2026-11-08, D15: retain one GitHub definition and the backlog command/config
  boundary. Remove the proposed separate code-host role. Reorder task groups so
  repository/PR observations and action support precede their callers and
  completion conformance; documentation and release packaging finish the list.
