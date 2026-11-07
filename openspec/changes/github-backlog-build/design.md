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
operations, native ownership and conservative recovery across sessions; work
from both unchanged T3 and standalone coding-agent CLIs through explicit
integration configuration.

**Non-Goals:** a new runner, stronger GitHub locking, setup/shaping migration,
delegation migration, another backend, automatic merges or selection of the
withdrawn service as a prerequisite. T3 modifications, requests to its
maintainers and a T3-only initial support boundary are explicitly outside scope.

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

### Select integrations explicitly across agent environments

Use the existing ownership boundaries: user configuration names the delegation
resolver chain and machine tool/connection options; repository `lets.backlog`
selects the backlog provider/definition, scope and mappings. A resolver is a
delegation adapter; the GitHub backlog integration uses a provider definition.
Do not treat T3 as a backlog provider or require T3 merely because the agent
runs there. These are uses of existing vocabulary, not new glossary definitions.

Both host environments must use the same supported backlog operations, core
policy and definition validation. Their configured backend tools may differ.
Validate the explicitly selected tools and evidence capabilities; do not detect
a host and silently substitute a backend, resolver or evidence guarantee. Exact
new machine option keys remain undesigned and are not presented as working
configuration. A configurable definition describes tool usage; it does not
make an unavailable independent evidence channel available.

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
trusted tool/backend context and independent retrieval ADR-015 requires from
both required host environments. Investigate existing configurable tool/channel
capabilities that work without T3 changes. T3-only support and host enhancement
are not pending options. Configuration is the integration selection mechanism;
it is not proof of independently retrievable evidence. This remains a design
blocker, not an implementation task or a deferrable open question.
Do not claim this design ready, write implementation tasks around an invented
channel, or change an ADR to bypass the blocker.

## Candidate awaiting discussion

The portable investigation now distinguishes a new generic capture tool,
packaged with Lets and started as an ordinary stdio MCP integration, from the
rejected operating-system service. MCP configuration is supported by the checked
CLI clients and preserved by the checked T3 Codex integration. No new host API
is assumed. This candidate is permitted in principle by ADR-015's generic capture
runner, but it is not selected or qualified. It needs a concrete authoritative
process, trust boundary and safe cross-session recovery design. See
[Portable channel investigation](research.md#portable-channel-investigation).

If the user expects only existing ordinary tool calls and no added capture
capability, the independent-evidence clause is the unresolved conflict. Trusting
agent-submitted output would require explicit reconsideration of that clause;
configuration alone cannot satisfy it. No such change has been authorized.
