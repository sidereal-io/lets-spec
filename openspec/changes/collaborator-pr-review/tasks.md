## 1. Standalone collaborator review

- [ ] 1.1 [medium] Accept an explicit PR identity through `lets-review-pr`, ask when identity is ambiguous, and keep the review outside author workflow gates, contributor edits and automatic verdicts; add contract checks before the entry-point instructions. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.2 [complex] Bind every pass and code citation to captured head, base and merge-base objects without switching the user's checkout; cover advancing heads, missing objects, incomplete diffs and fresh repeat invocations in the skill contract. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.3 [complex] Delegate examiner and challenger roles through existing read-only review intents, preferring an available model different from the known implementer's; cover unknown provenance, required source-family compatibility, metadata limits, refusals and unavailable fresh sessions. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.4 [medium] Assess ADR need, rationale, accepted constraints and consequence coverage before implementation, using the Nygard, AWS and GDS sources without replacing target ADR structure; cover justified early exit and missing-ADR continuation. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.5 [medium] Require the full implementation pass unless the verified decision-pass stopping rule applies, covering correctness, structure, connections and integration without depending on inline contributor fixes. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.6 [medium] Bound each pass to one challenge and examiner response plus at most one targeted mediator verification; allow up to two evidence-selected focused passes after both full passes and report uncertainty at the trial limit. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.7 [complex] Require evidence-led mediation and proportionate verification, drop refuted concerns and nitpicks, and separate consequential unresolved questions from verified findings; cover supported uncertain risks without claiming proven defects. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.8 [medium] Carry captured target vocabulary and bounded review criteria into each role prompt, treating files, comments and research as evidence and restricting execution of untrusted target code; add injection and verification-limit contract checks. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.9 [medium] Publish one consolidated advisory comment with full reviewed SHA, completed passes, stopping reason, criticality-ranked concerns, separate confidence, evidence and next steps; cover clean results, newer commits, failed publication and duplicate-safe unknown-outcome handling. (verify: bats tests/skill-interfaces.bats --filter 'collaborator review')
- [ ] 1.10 [medium] Make the independent entry point available in both release flows with resolvable references, a README invocation example and the five planned trial exercises; test release materialization and preserve the distinction between contract checks and unrun behavioral trials. (verify: bats tests/skill-interfaces.bats tests/release-build.bats)

## 2. Integration [depends-on: 1]

- [ ] 2.1 [medium] Verify the complete skill contract and both release outputs with the repository checks; record actual results and material limitations before pushing, including `nix flake check`. (verify: pnpm test)

## Deviations Ledger

None.
