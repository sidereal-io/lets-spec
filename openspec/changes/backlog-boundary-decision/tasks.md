## 1. Clarify the contract

Documentation review is the primary seam. Check meaning against ADR-014 and the
existing contract; the commands below locate or validate the affected text and
do not substitute for that review. No tests should mirror the document wording.

- [ ] 1.1 [easy] Link the contract's architecture rationale to ADR-014 and explain independent adapter releases without changing protocol guarantees (verify: rg -n 'ADR-014' docs/backlog-adapter-contract.md)
- [ ] 1.2 [easy] Clarify that separating runtime dependencies does not confine credentials, and that process isolation is not a sandbox (verify: rg -n 'sandbox|credential' docs/backlog-adapter-contract.md)
- [ ] 1.3 [easy] Review the ADR and contract together for accurate current-support limits, unchanged recovery guarantees and separation from ADR-010; retain the existing offline-only disclaimer (verify: git diff --check)

## 2. Validate and finish documentation [depends-on: 1]

- [ ] 2.1 [easy] Verify the documentation preserves the Node, type and shell checks (verify: pnpm test)
- [ ] 2.2 [easy] Verify the documentation preserves every flow and release check (verify: nix flake check)
- [ ] 2.3 [easy] Complete the repository-required code review and verification, then mark ADR-014 accepted when the change is ready for user review; leave the merge to the user (verify: openspec validate backlog-boundary-decision --strict)

## Deviations Ledger

None.
