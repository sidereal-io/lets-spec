## Behavior parity assessment after D13

The user's latest instruction is to preserve today's functionality across the
workflow while replacing hard-coded GitHub callouts with the configured adapter.
This supersedes the plan's added resume and terminal-completion behavior. The
baseline below is tracked main at `6524fbff`, not the old #172 prototype.

| Existing behavior and source | Migration constraint |
|---|---|
| `skills/lets-go/SKILL.md`, *Enter the branch*: an existing local or remote branch skips Claim. | Do not assign an unassigned item, change Todo to In Progress or add a claim requirement on that path. Preserve hand-stacked branches. |
| *Walk the step table*: Git, the PR and the archive determine the next step. | Keep ADR-017's record-based resume. Do not introduce `identity.json`, an extra runner commit or a required private record for ordinary resume. |
| *Walk the step table*: merged and closed PRs stop the run when the branch survives and the issue is found. | Preserve the stop and its position after the tree check. Do not search historical PRs on deleted branches or write Done. This removes the proposed reopened-issue regression. |
| *Claim*: check assignment, acquire assignment and In Progress, then create the branch; failure releases the acquired claim. | Translate the existing acquisition and release through bounded actions. Retain accepted operation recovery guarantees and report any intentional difference explicitly. |
| *Confirm the packet*: read issue, Project fields, parent and packet prerequisites. | Adapter coverage must include these reads. Do not leave a hard-coded `gh project item-list --limit 500` dependency in the caller or impose `gh` on an MCP-selected configuration. |
| *Find the source of demand*: idea search, ready-work enumeration and ranking. | Keep the current search, packet checks, selection order and lost-claim limits. Definitions translate observations; shared policy decides. |
| `references/shape.md` and glossary handoff references: discovery search, issue dates and prerequisite PR facts. | Include these references in the callout inventory; replacing only Claim is insufficient. Keep existing discovery commits and glossary procedures. |
| Plan, build and review skills: repository facts, PR reads, review text updates and marking ready. | Map code-host operations separately from backlog operations. Keep existing skill ownership and user-owned merge. Do not assume every backlog backend supplies code-host facts. |
| Setup and shape skills: Project setup, issue and comment writes, relationships and metadata. | Preserve their current behavior and owners in the shared inventory. The current proposal excludes their production migration; that exclusion cannot justify claiming all skills are migrated. Reconcile delivery coverage before declaring the plan complete. |

This audit concerns callout coverage, not literal command equivalence. Complete
pagination and typed recovery remain accepted contract guarantees; no definition
may claim that a fixed item limit proves enumeration complete. A CLI definition
may use `gh`; the skills must not require it when a compatible MCP definition
is explicitly selected. Both unchanged T3 and standalone hosts remain required.

### Accepted decision requiring explicit reconsideration

Main's architecture ADR-015 says: “Retain scoped mutation identity, fresh
ownership verification before work, session-safe release and partial-claim
recovery.” This requirement predates the restart's edits. Main's existing-branch
path skips Claim and has no fresh ownership gate. Exact behavior parity and a
blanket new ownership gate cannot both hold.

Proposed amendment, **not yet accepted or applied**:

> Retain scoped mutation identity, fresh ownership verification for claim
> acquisition and release, session-safe release and partial-claim recovery.
> Ordinary resume follows the existing shared runner's branch and record rules.
> It does not acquire a claim or require sole assignment and In Progress merely
> because the branch already exists. Known unresolved mutations still require
> reconciliation before retry or progression. This preserves the current
> existing-branch path and does not assert exclusive ownership for that path.

This deliberately preserves the current limitation: an existing branch is not
proof of exclusive ownership. It changes neither the submitted-output trust
choice (D10) nor the sole-runner rule. Do not amend the accepted record until
the user agrees to this specific consequence.

The plan's added ADR paragraph connecting the merged-PR stop to a completion
write was an author interpretation, not a behavior on main or a separate user
approval. Remove that extrapolation during reconciliation. Retain the contract
rule that an actual completion request requires the exact associated merge;
that rule does not require a new caller in this parity migration.

### Review disposition

Round two's stale terminal association finding is confirmed. D13 removes the
new terminal path rather than adding historical-PR heuristics. The hand-stacked
branch contradiction is confirmed; do not select the reviewer's new automatic
claim behavior. It awaits the narrow ADR decision above. The `identity.json`
lifecycle findings are addressed by removing that new metadata design, not by
adding commits or pushes to the runner. Missing callout coverage and the need
to distinguish code-host operations remain valid migration work. No third
review has been launched and neither prior REVISE verdict is an approval.

## Current disposition — 2026-11-07

The investigation below records the earlier ADR-015 capture requirement and why
it was not demonstrated across the required hosts. It is historical research,
not the current implementation prerequisite. After discussing the distinction,
the user explicitly selected option B: trust submitted configured tool output
and validate its translated contract. Brainstorm D10 and the amended ADR-015
record that decision. No capture capability is selected or required, including
the generic MCP candidate discussed below. The current design is in design.md.

The trade-off is explicit: Lets can check structure, consistency, freshness and
workflow rules but cannot independently detect convincingly fabricated output.
Both unchanged T3 and standalone coding-agent CLIs remain required. No backend
mutations, capture implementation or host changes were made by this research.

## Historical investigation before D10

# Evidence assessment for the planning restart

Checked 2026-11-07. Planning baseline: main
`6524fbff438faa0894d67bba9e5d81b034c774fd`, equal to fetched origin/main.
Prototype reference: `b2ebe6a9f5d594d3d9ad645f0a416721fcec8be6`.
No replacement design is selected.

## Outcome and practical journey

The packet asks for one existing GitHub story to cross the shared backlog
boundary through selection, claim, planning, build, review, PR reference and
merge-gated completion. The intended operator uses existing backend login
tools and available agent tools. The request/result architecture does not
itself authorize extra system installation or promise that none is needed.

The minimum journey to preserve is:

1. Select one repository/backlog and validate configuration and prerequisites.
2. Read complete candidates, metadata, ownership and directional blockers;
   apply shared packet, readiness and ranking policy.
3. Claim with the backend's actual guarantee, verify current ownership and
   Status, then start work. GitHub assignment remains best-effort, not a lock.
4. Carry scoped item identity and private recovery across workflow sessions;
   recheck ownership before resume. Handle branch failure with safe release.
5. Associate the exact PR; readiness leaves the item In Progress.
6. Complete only after independently established exact associated PR merge;
   reconcile native closing automation and lost responses idempotently.

Unknown or partial effects require reconciliation of the original operation
before retry or progression. No fallback provider, inferred empty blockers,
invented exclusive claim, or approval standing in for missing remote facts.

## Requirements versus prototype choices

| Retain from accepted decisions and packet | Reopen or discard as implementation assumptions |
|---|---|
| One bounded request/result path for shipped and custom definitions | The withdrawn Linux separate-account capture service |
| Independent original tool capture for required remote facts | Root-installed `/etc/lets/capture-client.json`, Unix socket and service credentials |
| Core validation, sequencing and private recovery | Specific continuation CLI, replay engine, lock helper and journal format |
| Native ownership/status and exact merge evidence | Linux-only qualification as an assumed product requirement |
| Limits, action correlation, conservative uncertainty and typed failures | Prototype mapping language, hard-coded mutation templates and deployment packaging |
| One lets-go runner and existing step responsibilities | Earlier branch ledger entries as approval of the replacement |

These choices require assessment against outcomes, not automatic reuse or
automatic rejection merely because the prototype implemented them.

Main still contains the executable contract and offline conformance code.
Its `backlog-adapter-contract` spec has 13 requirements; ADR-015 explicitly
describes their target migration. Accepted architecture is not evidence that
the main runtime already implements the replacement.

## Actual capture interfaces examined

### T3 Code thread activity

The exposed `t3_thread_read` API supports activity records, item IDs,
pagination and text offsets. A read of this planning thread returned a host
`command_execution` item containing command and displayed output. This is a
real history interface, not a demonstrated capture contract.

The exposed item schema does not supply dedicated fields for original tool
arguments/result, backend authentication context, resolved executable trust,
or binding to a Lets action. A formatted command transcript is insufficient
to infer these facts. The read also does not demonstrate a supported direct
client interface that Lets can use independently of the agent. Whether fuller
records exist behind the host is unresolved. The available tool catalog
exposes no explicit capture-receipt API; this is not proof no internal API exists.

### Codex App Server

The [official App Server documentation](https://learn.chatgpt.com/docs/app-server)
lists structured `mcpToolCall` items with server, tool, arguments, status,
result and error. `commandExecution` items include command, working directory,
status, optional aggregated output and exit code; output deltas are available.
This establishes a real source of execution records worth investigating.

It does not establish an installed Lets-accessible evidence channel, protected
record retention, complete output for every call, backend authenticated context,
trusted executable/server configuration, or action correlation. A local history
file or agent-saved event export cannot substitute for those properties.
A host integration could potentially supply them; neither its feasibility nor
its setup cost is established. No host modification or new collector was built.

### Agent tool output and provider tools

The tools used in this session return results to the agent. Having that output
in context is not independent retrieval by Lets. A copied GitHub response, an
agent-written JSON receipt, a second agent-reported read or a signed file whose
key the agent can use does not meet ADR-015. No current channel is qualified.

### Follow-up: source-level T3 interface assessment

Read upstream source at main revision
`25bf84ab07f53f141c20239c63e383823a9d5ea0`; main was unchanged at the end of
the source reads. These are upstream capabilities, not proof that the installed
host exposes the same contract. Source snapshots are in ignored research scratch
storage; no private host database, credentials or provider history was copied.

- [`orchestrationV2.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/packages/contracts/src/orchestrationV2.ts)
  defines `orchestration.getTurnItem`: `{threadId, itemId, revision?}` returns
  `{item: OrchestrationV2TurnItem | null}`. Items include host/provider IDs,
  timestamps and status; command items include input/output/exit code, while
  dynamic tools include toolName/input/output. This is an actual RPC candidate,
  not an invented receipt endpoint.
- [`ThreadManagementService.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/apps/server/src/orchestration-v2/ThreadManagementService.ts)
  calls `projectTurnItemForDetail` before returning the item.
- [`WireProjection.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/apps/server/src/orchestration-v2/WireProjection.ts)
  truncates command input/output and bounds dynamic-tool input/output on that
  detail path. A full native response cannot be assumed from this RPC.
- [`CodexAdapterV2.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/apps/server/src/orchestration-v2/Adapters/CodexAdapterV2.ts)
  projects MCP server/tool into a toolName and stores arguments plus normalized
  result output, rather than the complete original MCP response envelope.
  [`toolOutput.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/packages/shared/src/toolOutput.ts)
  normally selects structuredContent over content, retaining both only for
  particular image cases. The original envelope is not generally recoverable
  from that projection. Whether a specific operation retains all its required
  facts must still be checked; lossiness is not proof every response is unusable.
- [`OrchestratorMcpService.ts`](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/apps/server/src/mcp/OrchestratorMcpService.ts)
  formats command history as command/output text and dynamic history as JSON
  of toolName/input/output. It pages text but does not restore discarded native
  fields or expose a dedicated capture-trust contract.
- [MCP transport documentation](https://github.com/pingdotgg/t3code/blob/25bf84ab07f53f141c20239c63e383823a9d5ea0/docs/orchestration-v2/orchestrator-mcp-server.md)
  describes `/mcp` and provider-session-scoped credentials. This is a real
  authenticated host API. It does not establish that a child Lets process has
  independent access, a suitable read credential or a qualified evidence channel.

Conclusion: richer history retrieval exists, but the checked interfaces do not
yet demonstrate the complete original capture and trusted context required by
ADR-015. No compliant ready-to-use channel is established. This is a concrete
integration gap, not evidence that a root service or an architecture reversal
is necessary. The user subsequently ruled out T3 changes and requests to its
maintainers; a T3 enhancement is outside this plan, not a delivery option.

## Alternatives considered during clarification

The user clarified that planning should adhere to the current decisions and
introduce another only if necessary. Continue under ADR-015 and ADR-020, with
ADR-010's compatible selection/configuration principles retained. Options B
and C below are historical alternatives, not pending choices or proposed work.
No capture implementation is selected.

| Option | Practical experience and cost | Relationship to ADR-015 |
|---|---|---|
| A. Keep independent capture; assess an existing host integration first | Prefer existing host execution records and login; qualify one actual retrieval path before promising usable claims/completion. Could require host work or remain blocked. No service installation is selected. | Preserves the accepted decision if the channel is proven. Recommended investigation direction. |
| B. Explicitly reconsider the independent-evidence requirement | Use agent-submitted original output with core structural and lifecycle checks. Simpler CLI/MCP use, but Lets cannot independently distinguish a fabricated report from a real result. Ownership/merge become attributed observations. | Requires explicit reconsideration of ADR-015 and #180; a receipt format or user approval cannot silently achieve it. |
| C. Explicitly reconsider who executes backend calls | Lets executes calls and validates returned results directly. Avoids an external capture handoff, but needs a new extensibility design to preserve third-party integrations without a second provider implementation. | Changes ADR-015's agent-execution model and its prohibition on direct verification fallback; not a drop-in compliant option. |

The accepted architecture remains the planning basis. No root service is presented as the default.
There is no evidence yet that all current guarantees, agent execution and
zero host integration work can be delivered together.

## Planning and acceptance gates

The user confirmed proceeding under the current decisions. The fresh proposal
and deltas now cover `backlog-adapter-contract`, `github-backlog-build` (new)
and `lets-go`. The design remains incomplete at the capture prerequisite; no
implementation task list or new ADR is created around an unproven channel.
Do not turn this approach-changing question into a task footnote.

For any option retaining capture, the design must name actual endpoints or
protocol methods, original record fields, trust/setup ownership, availability
inside Lets, and failure/recovery behavior. Demonstrate read-only action
correlation and rejection of substituted records before live mutations.
Prove complete scoped ownership/status and exact merge evidence, not merely
that an event stream exists. Test forged/editable, wrong-action/tool/scope,
stale, replayed, incomplete and unavailable records.

After implementation, run repository checks and fresh live acceptance in the
designated scope. Historical offline test counts qualify only the prototype.
No tests, builds or live acceptance were run during this read-only investigation.

Planning validation: `openspec validate github-backlog-build --strict` passed
after retaining every existing scenario name in the modified requirements.
A separate structural comparison confirmed all modified requirement headings
exist on main and none of their original scenario names is dropped. This proves
artifact structure, not design completeness or a working capture channel.
Artifact instruction lookup is unavailable in this checkout because the ignored
`lets-standard` installation is absent; the tracked standard schema and templates
were read directly. No generated skill/schema copies were edited.

The host support boundary is now settled by the user: both unchanged T3 and
standalone coding-agent CLIs must work. Select compatible integrations through
explicit configuration, as elsewhere in the project. The earlier suggestion
to target T3 first or consider a T3 enhancement is rejected. No T3 change or
request may be planned as a dependency. No such extension was implemented or
filed. The remaining investigation concerns existing configurable tool/evidence
capabilities usable across both environments. It must demonstrate actual
capture properties; making a source configurable does not establish trust or
original-result availability.

## Discussion and ownership sources

Issue #136 has no comments (GraphQL pagination checked). PR #172 has no issue
comments, inline comments or submitted reviews at the time checked. Issue #179
and PR #181 have no issue comments; PR #181 has no inline comments. Issue #180
has no comments. The current accepted ADR text and packets are the evidence;
no absent discussion is treated as confirmation.

PR #172 remains draft. Its active plan says capture design is reopened.
Its client still unconditionally reads `/etc/lets/capture-client.json` and
requires an independent service account/socket. Withdrawing ADR-022 did not
remove that runtime dependency. It cannot qualify a live workflow without
further agreed work, and must not be presented as ready to install or test.

## Portable channel investigation

Further documentation/source review establishes the following distinction:
existing configurable MCP support is available, but an independently retrievable
capture service is not a standard feature of MCP. No config-only solution has
been demonstrated for the full ADR-015 requirement. This does not prove that no
third-party service could provide one; none has been qualified here.

### Existing capabilities

- [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp) supports
  stdio servers launched as local subprocesses and HTTP servers. This establishes
  a normal client integration mechanism, not capture behavior.
- [Claude Code MCP configuration](https://code.claude.com/docs/en/mcp) also
  supports local stdio servers through an explicitly configured command.
- The checked T3 Codex adapter overrides its own MCP entries while preserving
  other launch-configured MCP servers. This is source-level evidence for reuse
  of the existing integration mechanism without T3 changes, not a live test.
  T3 Claude also supplies MCP servers through its SDK, but complete inheritance
  of every user-configured server was not established by the checked snippets.
  Do not generalize Codex's verified merge behavior to every T3 provider.
- [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
  define discovery and calls with results. They do not define a general
  original-call receipt lookup. Stateful capture needs implementation-specific
  handles and storage; resources or tool schemas alone do not make it trusted.
- [Codex's security guidance](https://learn.chatgpt.com/docs/enterprise/security-cookbook)
  distinguishes server identity from trust in its launch context and permissions.
  A configured command alone does not protect executable/dependency integrity or
  authoritative captured state. No enterprise deployment model is adopted here.

### Concrete candidate for discussion, not selected design

Package one generic tool host with Lets and expose it as an ordinary configured
stdio MCP server. The coding agent starts it through its existing MCP support.
There is no proposed boot service, root configuration, separate account or T3
modification. This would be a new Lets capability to implement after agreement,
not an existing tool that can be enabled today.

The candidate interaction is:

1. Core policy issues a bounded action and retains its identity inside the host.
2. The agent invokes the generic capture tool for that issued action. The tool
   runs the configured backend CLI/MCP call and retains the actual invocation,
   original result and execution outcome before returning a reference.
3. Result validation retrieves that host-owned record, not a body supplied by
   the agent. Shipped/custom definitions provide translation through this one
   path; the generic host adds no provider-specific verification implementation.

ADR-015 permits a generic capture runner for agent-initiated execution, so this
candidate does not inherently require a different execution architecture.
However, that permission does not qualify this proposed implementation.

Mandatory unresolved details before selecting it:

- **Authoritative process and client:** core action issuance and evidence
  acceptance must reach the same authentic host instance. Independently started
  CLI/server instances cannot pretend to share authoritative in-memory records.
  Moving the control surface to MCP is a real product/interface choice.
- **Trust boundary:** original records must be inaccessible to report editing
  and protected against substitution via executable, environment, configuration
  or state changes. A separate process or installed package is not by itself
  proof of independence. State the supported runtime restrictions and validate
  them in both host environments before promising compliance.
- **Lifetime and recovery:** stdio servers end/restart with client sessions.
  In-memory records alone do not survive that. A mutation with lost capture
  remains uncertain; an ordinary journal is not authoritative capture. Prove
  independently captured reconciliation can safely recover required operations,
  or define a qualified durable record channel. Do not solve this by silently
  adding a daemon, accepting editable disk receipts or replaying a write.
- **Existing configuration:** establish how the supported T3 providers and
  standalone CLI clients actually load this server; custom MCP support in one
  client does not establish universal availability.

The simpler alternative is to trust agent-submitted backend results while
retaining core policy, action correlation and conservative recovery. That would
change ADR-015's independent-evidence clause and weaken its stated guarantee;
it cannot be selected as an implementation detail. Switching all execution to
built-in providers is not necessary to discuss that narrower change.

Conclusion: ordinary configured tools alone do not currently settle capture.
Either select and qualify an additional generic capture capability, or explicitly
reconsider the independent-evidence requirement. No capture code was written,
installed or configured during this investigation, and no ADR was changed.
