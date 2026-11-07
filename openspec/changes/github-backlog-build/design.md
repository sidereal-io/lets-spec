## Context

This is an incomplete design under accepted ADR-015 and ADR-020. It does not
select a replacement capture system and is not ready for implementation tasks.
Main contains an executable conformance boundary; #172 contains unaccepted
request/result and capture-service prototypes. Neither defines this design.

The proposal and specs state the accepted target. The capture investigation in
[research.md](research.md) identifies real host interfaces and their gaps.
The user approved following current decisions; no new architecture is proposed.

## Goals / Non-Goals

**Goals:** preserve the existing GitHub journey through one agent-executed
request/result path; make required evidence checkable by Lets; retain bounded
operations, native ownership and conservative recovery across sessions.

**Non-Goals:** a new runner, stronger GitHub locking, setup/shaping migration,
delegation migration, another backend, automatic merges or selection of the
withdrawn service as a prerequisite.

## Test Seams

- **Primary test seam:** bounded action request and result acceptance, with
  observable policy transitions and independently retrieved tool evidence.
- **Existing seams reused:** offline contract/conformance fixtures, workflow
  interface tests and release-content checks, adapted to the target boundary.
- **Qualification boundary:** real host retrieval and rejection of substituted
  or incomplete records. A capture double cannot qualify this boundary.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** external mutations, evidence trust, configuration and
  definition formats, private recovery, workflow instructions and packaging.

## Decisions

### Follow the accepted execution and workflow boundaries

Lets validates configuration, policy, prerequisites and supported operations;
records action identity and intended effects privately; and issues a bounded
action. The agent executes it using the selected inert definition. Lets
validates the submission and independently retrieved evidence before the next
transition. No built-in executor or provider-specific verification fallback is
introduced. Lets-go remains the only runner.

Definitions share one schema/validation path, with explicit source/version and
supported operation/tool versions. They cannot grant trust, introduce operations,
decide readiness, permit retries or strengthen backend guarantees.

### Preserve semantic recovery requirements without adopting prototype storage

Persist issued action/mutation identity, original input/scope and uncertainty
before handing control away. Missing results never establish no effects.
Reconciliation reads are separately bounded actions tied to the original
uncertain operation. No new write is permitted until policy and evidence allow
it. Exact journal layout, locking and continuation interfaces remain to design
after the evidence path is known; the old replay engine is not selected.

### Reject display history as a qualified capture implementation

Upstream T3 has a real `orchestration.getTurnItem` RPC with thread/item IDs and
optional revision, returning a typed item. It is more useful than the summarized
MCP history, but is still a projected detail surface: MCP response envelopes
are normalized and input/output may be truncated. No complete original-envelope
or trusted authenticated-context contract has been established there. The
installed host's support and a direct Lets client have not been qualified.

Codex App Server provides richer native tool events. Consuming an event or
agent-exported history alone does not establish trusted retention, independent
retrieval, action binding or backend context. No bridge or collector is selected.

## Risks / Trade-offs

- [No qualified capture path] → Stop before automatic mutation/progression;
  resolve the prerequisite with evidence rather than implementing a guessed API.
- [Host display projections can omit fields] → Verify original response and
  explicit completeness; do not infer completeness from parseable JSON.
- [Agent access to records or trust configuration] → Document and verify the
  actual runtime boundary. A same-user file is not independently trustworthy
  merely because Lets reads it itself. No service account is assumed necessary.
- [Porting old code carries rejected assumptions] → Reassess each retained unit
  against accepted behavior; no prototype implementation has been imported.

## Migration & Rollback

After a capture approach is agreed and the design reviewed, reconcile the fresh
plan into existing PR #172. Keep #136 as its issue and keep the PR draft until
implementation and fresh acceptance are complete. Replace executable selection
with explicit definition selection and actionable migration errors; do not run
legacy adapter paths or silently fall back.

Exact persisted-state migration and rollback require the final action/recovery
format and therefore remain blocked. Do not reuse or replay old live fixtures.
Later acceptance is scoped to mstelz/test-repo-pls-ignore and mstelz Project 7;
merge remains a separate user action.

## Blocking design question

No examined interface is yet qualified to provide the complete original record,
trusted tool/backend context and independent retrieval ADR-015 requires. The
next decision is whether an existing host can expose these missing properties
through a supported integration, and what setup that entails. This changes what
must be built, so it is a design blocker, not a task or a deferrable open question.
Do not claim this design ready, write implementation tasks around an invented
channel, or change an ADR to bypass the blocker.
