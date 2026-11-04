## Context

`lets/src/main.ts` uses Commander and injected IO for delegation and sync. YAML is already a runtime dependency. `lets/src/sync/config.ts` reads only the schema line. It must keep doing so; backlog configuration needs a separate reader. The adapter kit publishes protocol validators and simulations under `contrib/`, outside the Nix workspace source set. It supplies no production implementation.

Build currently embeds provider commands in its source skill. Both schemas use GitHub issue numbers during brainstorm and PR creation. The issue-comment and glossary rules remain shared policy. The shared glossary defines Packet as the issue body and Fold as a shaping-only operation. This change introduces no new glossary meanings.

## Goals / Non-Goals

**Goals:** ship one working GitHub existing-item lifecycle, make failures recoverable, and let another session resume without guessing identity.

**Non-Goals:** implement setup/shaping writes or another provider; promise atomic claims on GitHub; automatically merge the product or test PR; replace the contract or OpenSpec orchestration.

## Test Seams

- **Primary test seam:** CLI/process integration through `lets backlog`, using a fake executable and an injected `gh` runner with recorded structured responses. Assert requests, effects and resulting state; never rely only on prose matching.
- **Existing seams reused:** Node tests and the kit's validators/scenarios; `tests/skill-interfaces.bats` for commands shipped in instructions; release-build tests for executable layout. Live acceptance runs the built executable with real `gh`, using only test-owned items.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** repository configuration, external processes, GitHub writes, persistent claim provenance, both flows' build/resume/finishing instructions and release packaging.

## Decisions

### 1. Keep one executable boundary in production

Add `lets/src/backlog/` for configuration, protocol transport, shared selection and change identity. Add GitHub translation beneath it, with a separate `lets-backlog-github` entry. Ship that executable beside `lets` in tarballs and Nix PATH. Missing explicit executables are errors. The default name also resolves through PATH; packaging must make it available rather than bypassing the process boundary.

Promote dependency-free protocol/item validators into the production backlog module and make the contrib kit re-export them. Include them within `lets/` so Nix builds do not depend on excluded contrib files. Keep the public kit import paths stable. Do not import the simulated adapter or its journal. This shares validation while avoiding two drifting protocol copies. The standalone distribution also ships the promoted dependency-free validator modules and their complete import closure at the repository-relative paths used by the contrib re-exports. It does not require a source checkout or node_modules. Keep the existing kit round-trip smoke test, and run packaged conformance from an isolated release directory.

Use a production transport with no optional argv escape hatch, a positive timeout (default five seconds), a combined 1 MiB output bound and safe diagnostics. Treat spawn-before-execution failure as no effects; any mutation failure after execution that cannot prove effects is unknown. Preserve valid structured error categories instead of reclassifying them as parse errors. Bound read retries; never blindly retry unknown mutations. Follow pagination to completion, checking repeated cursors and scope on every page.

Alternative: in-process GitHub calls would make the default bypass the contract exercised by external adapters. Separate runtime and executable packaging are an intentional cost.

### 2. Read selection once, validate before writes

Parse repository `openspec/config.yaml` with the existing YAML dependency. Consume only `lets.backlog`, preserving unrelated configuration. Match the contract's explicit provider/executable/id/mappings/storage validation and resolve relative executable paths from the repository root. Never use shell expansion. Keep adapter-specific configuration on the adapter side; the GitHub executable reads the same repository selection and verifies it matches request context.

Without selection, discover both repository-linked and owner-linked Projects through fully paginated GraphQL, deduplicate Project node IDs and require exactly one open match. For explicit GitHub selection, verify that Project identity and repository link. Defaults map named single-select fields and options to the contract's meanings. Explicit mappings use native field/option IDs and cardinality one; unsupported native types fail explicitly. Check authenticated actor, repository membership, field types and mapped options before writes. Missing/ambiguous item values are configuration errors, not guessed priorities.

### 3. Offer normalized operations with thin workflow commands

Expose `lets backlog request` to accept a protocol request from stdin for the selected executable. Add workflow commands `select`, `claim`, `release`, `bind`, `resume`, `reference` and `complete`; document JSON inputs/outputs and exit categories with their implementation. They construct validated requests; shared policy stays in the caller. `select` supports an explicit item reference or the existing `next` route and returns normalized packet, metadata and complete blocker evidence. It does not mark malformed packets ready or skip glossary prerequisites. The skill validates packet/comments/glossary and routes before `claim`.

Implement build-required operations: backlog.list/check, capability.read, item.read/search, candidate.list, relationship.list, claim.acquire/read/release, reference.write, completion.write and mutation.read. Implement targeted item.update only for glossary handoff body changes. Declare setup/shaping mutation operations unsupported before effects. Read issue comments, parents and body edit timestamps through adapter-owned GitHub helpers exposed to build; the normalized protocol item stays unchanged. Store those extra read results in a documented caller read command, not extra protocol fields. Existing comment watermark semantics and evidence-only trust boundaries remain intact.

GitHub uses scoped Project node IDs and issue node IDs as identity; repository-qualified issue numbers remain display/closing references. Resolve named references only within the selected repository and Project. Read all owners and directional blockers; a closed issue maps to Done for blocker state, while open blockers stay blocking regardless of Project status. Shared ranking retains numeric issue order. Never silently add a missing issue to a Project during build.

### 4. Persist change identity apart from private recovery state

Write a versioned `backlog.json` beside the change's planning artifacts with repository, scoped identity, display reference and optional URL. `bind` writes it once after claim and change creation; retries accept identical content and reject replacement. Carry it with the archive folder. The record contains no claim token, credentials or transient actor/session. This is a durable schema decision recorded separately.

Store private sessions and mutation journals under the Git common directory's `lets/backlog/` area, using hashed scope keys, restrictive permissions, atomic replacement and per-scope lock files. Never stage them. A session is an opaque UUID retained across restarts for this change; another worker gets a different session. Missing private provenance does not authorize adopting an assigned item. `resume` verifies recorded selection and fresh remote ownership; it stops for manual reconciliation when original session/token state is unavailable. Legacy changes need explicit identity confirmation before binding, never title-based automatic reassociation.

Claim creates a new opaque local session handle and returns it to the caller. Bind records its association privately. Resume requires that handle explicitly; it never selects a session solely from change name, item identity or shared Git directory. A restarted caller or authorized apply handoff deliberately passes the original handle to continue that worker's claim. A new worker without the handle receives no claim authority and stops for manual reconciliation. Tokens remain private and never enter planning artifacts.

### 5. Use visible GitHub provenance with best-effort claims

Assignment cannot distinguish two sessions sharing an account. Use a pre-existing Project text field named `Lets claim` to record claim generation, actor, session and token, then assignment and Project status. Tokens are correlation values, not secrets or authorization. Validate the exact record schema and scoped identity, and authenticate the requested actor against gh before writes. Project writers are inside the provider trust boundary; a changed or malformed record invalidates the claim. A local lock serializes this machine's scope; GitHub remains best-effort across machines. Document that fresh verification is a snapshot rather than exclusive execution.

Before every provider mutation, persist operation, exact input, scope, key and intended effect. Replay keys only for identical inputs. Acquire rechecks unowned state, records provenance, assigns and changes Status, then rereads provenance record, all owners and Status. The caller always follows success or reconciliation with fresh claim.read. Any competing provenance record, owner or status change invalidates progression. A provenance-write timeout cannot prove absence: mutation.read returns unknown unless the exact provenance record and resulting state prove application. No replacement provenance record is written while unknown.

Release verifies current actor/session/token plus assignment and status, records release intent, removes only that actor and restores Todo. Recheck between writes; on any ownership change stop with partial/conflict rather than overwriting another worker. Partial acquire may be repaired or released only with proven current provenance. Store released state remotely so a stale acquire replay cannot authorize work. Recovery reports applied, absent only with conclusive pre-write evidence, or unknown; journal presence alone is not proof that ownership is current. Capability limits explain Project field permissions, visible provenance and races.

### 6. Keep completion behind verified code-host merge

`reference` writes an idempotent association in a pre-existing Project text field named `Lets reference` to the exact PR URL and preserves `Closes #n` in the PR body. `complete` reads that association, queries the code host for matching repository/PR and merged commit, and only then sends completion.write. Raw protocol merge evidence is trusted-caller input, not authentication. The GitHub adapter checks evidence matches its association; it does not accept issue-body claims of merge. Update only mapped Status to Done, preserving other fields; already Done succeeds after merge verification. Ready/archive leave In Progress.

Update source `skills/lets-build/SKILL.md`, its references, both schemas and overlay rules so commands carry recorded identity through propose, resume, archive and post-merge completion. Planning skills that read the packet use the normalized read path when a record exists. Keep Git commands and code-host PR commands outside the backlog adapter. Leave shaping/setup behavior unchanged, including GitHub closing references; do not edit generated installed copies. Both flows pass the local session handle through the existing authorized planning-to-apply handoff. Document callable command inputs for creating, binding and explicitly resuming that handle, including failure when it is unavailable.

### 7. Test the new flow against the prepared fixtures

Automated tests drive each behavior through the CLI/process seam and scripted GitHub faults. Include cursor loops, mapping errors, same-account session conflicts, lost responses, assignment-only progress, replaced ownership, branch failure release, archived identity and unmerged completion. Existing kit tests must still pass after validator promotion. Run the packaged conformance suite from an isolated release directory to prove the standalone import closure as well as the adapter executable layout.

Live acceptance uses `mstelz/test-repo-pls-ignore` and `https://github.com/users/mstelz/projects/7`. Prepare test packets with fixture commands, then perform selection/claim/bind/resume/reference/completion through the new flow. Initialize the empty repository with a minimal commit for a test PR. Prove blocked/owned exclusions using test-only items and inject a lost response at the real adapter boundary after a real mutation. Exercise branch failure through the caller's release path. Record before/after evidence and cleanup only owned fixtures. Ask the user to merge the test PR; until then completion acceptance remains pending. Fixture creation and manual `gh` calls do not substitute for lifecycle evidence.

## Risks / Trade-offs

- [Cross-machine claims can race] → Declare best-effort, use visible session provenance, reread before work and stop uncertain recovery. Do not advertise exclusivity.
- [Provenance fields are absent] → Declare the required capability unavailable before writes. Fixture setup creates `Lets claim` and `Lets reference` text fields; production setup instructions describe this prerequisite without silently creating fields during build. No lifecycle operation writes issue comments or changes comment watermarks.
- [External changes invalidate cached results] → Revalidate configuration and remote claim state; never treat a local journal as authority.
- [New executable omitted from a release] → Exercise tarball and Nix install layouts in release checks.
- [Live PR remains unmerged] → Report acceptance pending and keep the product PR draft until evidence is complete.

## Migration & Rollback

No issue migration is required. Existing repositories retain implicit GitHub selection. Existing change folders gain identity only after explicit confirmation. Release CLI, adapter and source instructions together. Roll back the release and instructions together; retain existing backlog.json records and private journals for manual reconciliation. Do not clear remote assignments or provenance during rollback.
