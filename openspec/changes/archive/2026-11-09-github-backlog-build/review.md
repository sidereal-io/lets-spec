## Review Metadata

- **Review round**: 5
- **Prior round**: round 4 gave APPROVE_WITH_CHANGES at `da4fccdb`; its required changes landed in `7c7d5d5a`. Two later code-review fixes edited design.md (`4b98e59a`, `ae5a9dfe`), which voided that verdict.
- **Reviewer context**: fresh context, other family (claude/claude-opus-5-5 through the T3 resolver; Gemini was ranked first and did not run)
- **Independent**: yes for the GPT-authored plan; no for the two Claude-authored design.md edits
- **Tool restrictions**: read-only
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, tasks.md and the ADRs adr.md lists, at `2aa4ebb7`, checked against lets/src/backlog/, skills/, docs/ and tests/
- **Vocabulary inputs**: `openspec/glossary.md`, the domain-language method and the plain-language method; no capability glossaries exist

## Findings

### 🔴 Critical (blocking)

1. **C1: an unresolved reconciliation held its reservation forever.** After a write was issued, PR and claim reconciliation never returned absent, so `pending` stayed set and no command cleared it. One lost response, such as a 502 on a draft create, blocked that issue or PR on the machine for good. CONFIRMED. Check: operation-store.ts kept `pending = !resolved`; recovery.test.ts asserted it.

### 🟡 Moderate

1. **M1: the live check of every operation was incomplete and predated the second code review's fixes.** `pull-request.update` was missing, the hosts were not named, and the list of unmapped operations was short. CONFIRMED. Check: acceptance.md against the commit times of the #19 run and the fixes.
2. **M2: configured mappings were rejected, but the specs and ADR-015 still gave them a home.** CONFIRMED. Check: the contract spec, the GitHub spec and ADR-015's configuration table.
3. **M3: the ownership remedy told the user to take over another person's assignment.** For `other` or `multiple`, "assign only themselves" meant removing a co-worker. CONFIRMED. Check: lets-go SKILL.md and the lets-go delta spec.
4. **M4: the deleted-branch scenarios promised more than the branch lookup delivers.** A recreated branch with an old PR's name finds that PR and stops, as on main. CONFIRMED. Check: the GitHub spec scenarios and lets-go's branch PR read.
5. **M5: the adapter contract doc still called the gh hosts unqualified.** CONFIRMED. Check: docs/backlog-adapter-contract.md against acceptance.md.

### 📌 Suggestions

1. **S1:** design §1 omits `--host-file`, and it lists checks for literals no test asserts.
2. **S2:** the GitHub completion requirement reads like GitHub support, though the shipped definition maps no completion or reference write.
3. **S3:** the default 60-second acceptance window and `acceptanceMs` are undocumented.
4. **S4:** "worker session" is used in the spec without a definition there.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. C1: give an unresolved reconciliation a way out, so no operation stays blocked for good.
2. M1: in acceptance.md, add `pull-request.update`, name the build and host of each live check, say which fixes are checked offline only, and complete the unmapped list.
3. M2: make the specs, proposal, ADR-015 and adr.md say that configured field/status mappings are reserved and rejected.
4. M3: ask for self-assignment only for `unassigned` or `status-mismatch`; for `other` or `multiple`, ask the user to agree ownership first, and never suggest removing another person's assignment.
5. M4: add a scenario recording that a recreated branch with an old PR's name gets the existing terminal stop.
6. M5: update the gh rows of the adapter contract's live qualification table.

CHANGES_APPLIED: yes

## Rebuttals

1. C1: fixed in `0b648b34` (code, tests and skill) and `cfb333ad` (plan). The reviewer offered a user-confirmed resolution command. The user chose instead to release the reservation after one complete reconciliation read, whatever it shows. An unresolved result is still reported and still ends the run, and the next run starts a new operation whose own preflight reads GitHub again. A read with missing facts keeps the block.
2. M1: fixed in `ad4310df`. The final build `625244e9` re-ran PR create, read, update and ready on PR #21 and read #19; PR #21 was closed without merging.
3. M2: fixed in `1a459c19`.
4. M3: fixed in `15baa991` (skill and test) and `91deacb4` (plan).
5. M4: fixed in `4f86849e` (skill) and `625244e9` (plan).
6. M5: fixed in `df971b47`.
7. S1: declined for this change. `--host-file` is documented in the action loop and the adapter contract doc; the design's check list is a follow-up.
8. S2: declined. D13 keeps completion in shared conformance only, and the shipped definition rejects an unmapped write as unsupported before any action.
9. S3: declined for this change; a follow-up can document the acceptance window.
10. S4: declined. design.md defines "worker session", and the spec uses it in that sense.
11. Found by verification after this round, not by the reviewer: the lets-go delta spec named a Claim result `backlog-unavailable`, while the skill and its tests use `claim-unavailable`. Fixed in the commit that adds this line, which renames the result in the spec only.
