## 1. Shared runtime

- [x] 1.1 [medium] Return validated protocol-1 responses through the production no-shell executable transport, preserving structured failures and uncertain mutation outcomes; promote the shared validators with stable kit re-exports (✓ node --test tests/lets/backlog/transport.test.ts and adapter-kit suite passed: 128 tests; mise exec -- pnpm check passed)
- [x] 1.2 [medium] Resolve implicit GitHub or explicit repository backlog configuration without fallback, rejecting invalid executable paths and mappings before effects (✓ mise exec -- node --test tests/lets/backlog/config.test.ts passed: 10 tests; full-suite typecheck passed)

## 2. GitHub build operations [depends-on: 1]

- [x] 2.1 [complex] Read complete repository-scoped GitHub packets through the executable, including linked Project discovery/checking, native mappings, capability gaps, parents, comments and directional blocker pagination (✓ mise exec -- node --test tests/lets/backlog/github-read.test.ts passed: 12 tests; typecheck passed; read-only discovery and mappings verified against the designated live fixture)
- [x] 2.2 [medium] Select eligible named or next work using shared ranking and complete readiness evidence, preserving numeric GitHub order and rejecting owned or blocked items (✓ mise exec -- node --test tests/lets/backlog/selection.test.ts tests/backlog-adapter-kit/capabilities.test.ts passed: 11 tests)
- [x] 2.3 [complex] Acquire a verified best-effort GitHub claim with Project provenance, a fresh explicit continuation handle and durable mutation state; reject competing sessions and assignment-only progress (✓ mise exec -- node --test tests/lets/backlog/claim.test.ts passed: 5 tests)
- [x] 2.4 [complex] Reconcile interrupted claim mutations before allowing progression or replay, checking current provenance rather than trusting journal history (✓ mise exec -- node --test tests/lets/backlog/recovery.test.ts passed: 4 tests)
- [x] 2.5 [complex] Restore Todo after branch failure only for the original current claim, preserving another worker's ownership during partial release (✓ mise exec -- node --test tests/lets/backlog/release.test.ts passed: 4 tests)

## 3. Lifecycle integration [depends-on: 2]

- [x] 3.1 [medium] Bind immutable versioned change identity and resume it only with matching selection and an explicit continuation handle; preserve identity through archive and reject automatic legacy adoption (✓ mise exec -- node --test tests/lets/backlog/identity.test.ts passed: 3 tests; typecheck passed)
- [x] 3.2 [complex] Complete only the recorded item's associated merged PR, with idempotent reference and Done reconciliation that leave unmerged work In Progress (✓ mise exec -- node --test tests/lets/backlog/completion.test.ts passed: 4 tests; typecheck passed)
- [x] 3.3 [medium] Route both source flows through documented callable backlog commands and explicit handoff handles, retaining packet/comment/glossary policy and targeted glossary body updates (✓ mise exec -- bats tests/skill-interfaces.bats passed: 36 checks; CLI lifecycle and targeted glossary tests passed: 3 tests; typecheck passed)
- [x] 3.4 [complex] Run the default adapter and standalone conformance kit from packaged releases, shipping executable permissions and the complete promoted validator import closure in tarballs and Nix (✓ nix flake check passed on x86_64-linux, including isolated complete kit conformance and both executable bundles; full pnpm test passed)

## 4. Acceptance [depends-on: 3]

- [x] 4.1 [complex] Demonstrate the implemented CLI lifecycle in mstelz/test-repo-pls-ignore with Project https://github.com/users/mstelz/projects/7, recording commit/item/PR/merge evidence, negative paths, fault injection and owned-fixture cleanup; keep completion pending until the user merges the test PR and run repository checks (✓ pnpm test passed: 567 Node tests, typecheck, 133 Bats checks; nix flake check passed on rerun; live merge fef1ac4c162fb0edb840b6489f0b5aae480b7227 verified, Done and idempotent completion passed, owned-fixture cleanup complete; see live-acceptance.md)

Live evidence: [live-acceptance.md](live-acceptance.md). Selection, claim, bind, resume, release, reference, unmerged rejection and archive retention passed against the designated fixture. The user merged test PR https://github.com/mstelz/test-repo-pls-ignore/pull/7; merge-gated completion, idempotent replay and owned-fixture cleanup passed.

Live acceptance evidence is a required supplement to task 4.1's automated command. Fixture preparation alone never satisfies that task. Revised fixture preparation uses only native assignees, Status and closing links; do not create machine-state fields. Use the built runtime for selection, claim, bind, resume, release, reference and completion. Do not mark task 4.1 complete while merge or any required live case remains pending. Run both `pnpm test` and `nix flake check` before pushing implementation.

## Deviations Ledger

- Ship the promoted validator import closure with task 1.1 rather than waiting for 3.4: the existing isolated distribution smoke check failed immediately after promotion. Adapter executable packaging and full packaged conformance remain in 3.4.

## 5. Native reconciliation revision

- [x] 5.1 [complex] Replace remote claim provenance with native assignees/Status and local intent, preserving unknown-outcome guards and explicit continuation; test assignment-only partial state, replay, release and same-actor limits. (✓ pnpm test passed: 569 Node tests, typecheck, 133 Bats checks)
- [ ] 5.2 [complex] Replace Project PR association fields with fully paginated native closing links and exact merge gating; test mismatch and interrupted operations.
- [ ] 5.3 [medium] Reconcile contract, kit expectations, capabilities, source instructions and fixtures with actor-level native limits; remove machine-state field prerequisites.
- [ ] 5.4 [complex] Run required repository checks, new independent review, revised live acceptance and verification before archiving and marking ready. Prior evidence covers only the old implementation.
