## Behavior parity assessment after D13

The user's latest instruction is to preserve today's functionality across the
workflow while replacing hard-coded GitHub callouts with the configured adapter.
D14 subsequently approves the read-only resume check. The added terminal
completion behavior remains rejected. The
baseline below is tracked main at `6524fbff`, not the old #172 prototype.

| Existing behavior and source | Migration constraint after D14 |
|---|---|
| `skills/lets-go/SKILL.md`, *Enter the branch*: an existing local or remote branch skips Claim. | Do not assign an unassigned item, change Todo to In Progress or acquire a new claim. D14 adds only a fresh ownership and status check; mismatch pauses hand-stacked work without repair. |
| *Walk the step table*: Git, the PR and the archive determine the next step. | Keep ADR-017's record-based resume. Do not introduce `identity.json`, an extra runner commit or a required private record for ordinary resume. |
| *Walk the step table*: merged and closed PRs stop the run when the branch survives and the issue is found. | Preserve the stop and its position after the tree check. Do not search historical PRs on deleted branches or write Done. This removes the proposed reopened-issue regression. |
| *Claim*: check assignment, acquire assignment and In Progress, then create the branch; failure releases the acquired claim. | Translate the existing acquisition and release through bounded actions. Retain accepted operation recovery guarantees and report any intentional difference explicitly. |
| *Confirm the packet*: read issue, Project fields, parent and packet prerequisites. | Adapter coverage must include these reads. Do not leave a hard-coded `gh project item-list --limit 500` dependency in the caller or impose `gh` on an MCP-selected configuration. |
| *Find the source of demand*: idea search, ready-work enumeration and ranking. | Keep the current search, packet checks, selection order and lost-claim limits. Definitions translate observations; shared policy decides. |
| `references/shape.md` and glossary handoff references: discovery search, issue dates and prerequisite PR facts. | Include these references in the callout inventory; replacing only Claim is insufficient. Keep existing discovery commits and glossary procedures. |
| Plan, build and review skills: repository facts, PR reads, review text updates and marking ready. | Map code-host operations separately from backlog operations. Keep existing skill ownership and user-owned merge. Do not assume every backlog backend supplies code-host facts. |
| Setup and shape skills: Project setup, issue and comment writes, relationships and metadata. | Preserve their current behavior and owners in the shared inventory. The current proposal excludes their production migration; that exclusion cannot justify claiming all skills are migrated. Reconcile delivery coverage before declaring the plan complete. |

Additional accepted contract constraints differ from the current callouts:
all recorded actions, including reads, need writable private recovery storage;
an unwritable sandbox fails preflight with a configuration remedy. This is a
runtime prerequisite, not evidence of a remote mutation. Multiple linked
Projects may be resolved by explicit configuration under ADR-015 rather than
forcing the user to unlink all others. Record both differences in acceptance.

Verified GitHub CLI's branch-PR lookup against upstream
`pkg/cmd/pr/shared/finder.go` on 2026-11-08: results are newest-created first,
then stably sorted to put open PRs first; the first scope/ref match is returned.
A closed historic PR plus a newer open PR must not introduce a new ambiguity
stop. Do not adopt the review's suggested several-open ambiguity rule without
evidence: the inspected source uses the same open-first newest rule there too.

This audit concerns callout coverage, not literal command equivalence. Complete
pagination and typed recovery remain accepted contract guarantees; no definition
may claim that a fixed item limit proves enumeration complete. A CLI definition
may use `gh`; the skills must not require it when a compatible MCP definition
is explicitly selected. Both unchanged T3 and standalone hosts remain required.

### Ownership discrepancy resolved by D14

Main's architecture ADR-015 requires fresh ownership verification before work.
Main's existing-branch path skips Claim and previously had no such check. The
user rejected revising the accepted ADR, then approved the read-only check:
“Ah so just check”, followed by “Cool do it” after the exact rule was stated.

The plan therefore retains the accepted rule. Before unfinished work, check
through the adapter that the authenticated actor is the sole assignee and the
item is In Progress. Otherwise report the mismatch or missing facts and stop.
Do not reassign, change status or acquire a new claim. This is the explicit
exception to D13's behavior parity; the earlier proposed ADR narrowing is not
selected. Resume still uses existing Git, issue and PR records without a new
identity file or original recovery record.

The plan's added paragraph connecting the merged-PR stop to a completion write
was an author interpretation. Remove it. Retain the shared contract's exact
associated merge gate for actual completion requests without adding a caller
in this migration. Native GitHub/Project automation retains its current role.

### Round-two review disposition after D13 and D14

Task numbers in this historical disposition refer to that revision. The current
checklist is reordered after D15; the round-three table below gives current IDs.

- **C1, stale terminal association — confirmed:** remove the added historical
  lookup and terminal completion caller. Reopened issues and deleted rejected
  branches cannot trigger those added actions. Tasks 5.8–5.11 preserve main's
  branch-scoped stops instead of inventing historical-PR heuristics.
- **M1, hand-stacked ownership — confirmed and resolved by D14:** use a fresh
  check and stop on mismatch. Do not select the recommended automatic claim.
  The success scenario now explicitly has sole assignment and In Progress;
  the unassigned Todo failure is separate. Tasks 4.2, 4.8 and 4.9 cover it.
- **M2, identity lifecycle — confirmed:** remove the identity file and its new
  commits/pushes. Keep existing branch lookup and ADR-017 unchanged. Task 4.1
  verifies the skill boundary rather than an unrelated scope validator.
- **M3, remaining gh reads — confirmed:** migrate packet and parent reads and
  related code-host callouts, with explicit commands and fields in design
  section 6. Do not impose gh on compatible MCP configurations. Tasks 5.7 and
  6.1–6.9 cover the existing-story path; setup/shaping caller migration is not
  claimed by this slice.
- **M4, unnamed terminal lookup and code-host facts — confirmed:** remove the
  new terminal lookup. Name the existing repository and branch-PR read commands
  and code-host definition. Define GitHub reference.write as validation-only in
  conformance. A new association stop is unnecessary because that caller is
  removed; existing PR authoring and review rules keep their current ownership.
- **S1, worker ID in step prompts — accepted:** keep it in the lets-go invocation
  and recovery records. Task 4.7 preserves the existing step/report contract.
- **S2, contract doc ownership — accepted:** task 5.12 owns the rewrite and its
  inventory verification.
- **S3, stack completion pending forever — resolved by caller removal:** retain
  the existing stacked merged-PR stop and native closing automation. Do not
  claim the issue completed when a PR merged into a feature branch.
- **S4, terminology — accepted:** use *recovery record* for private persisted
  operation facts and *continuation file* only for its scratch CLI handle.
  Historical research below retains its original terminology as provenance.

Both previous rounds remain REVISE. After the required user pause, D13 and D14
provide the direction for this revision. This adjudication is not an independent
approval. No implementation, backend mutation or publication follows from it.

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

## Round-three correction status before D15

Reviewed `46ff2100`: REVISE, independent fresh Claude Opus 5.5 context. The raw
report is retained locally for audit. At this checkpoint the integration choice was still pending. D15 subsequently
resolves the pause and authorizes the one-integration correction.

C1 is confirmed: operation-ID resume and reconstructed handles now survive
scratch loss and worktree changes; tasks 2.11 and 2.12 cover them. C2 is confirmed:
the issue-comments delta and explicit complete thread fields reconcile the
current query requirement, including brainstorm reads. M6 and S1 are addressed
by per-invocation identity, named read-only verdicts and the failed-check remedy.
M3's parity concern is confirmed; inspected gh source uses open-first then
newest, so the suggested multiple-open ambiguity is not adopted. S2 and the
private-state prerequisite are now explicit parity differences. S3's purpose
and unqualified-live-evidence wording are corrected. Remaining role/configuration,
step-write scope/identity, host tool selection and task-order changes depend on
the code-host decision (M1, M2, M4 and M5). The separate role is not approved.

### Alternatives presented before D15

**Option A, recommended:** keep one configured GitHub integration for this
slice. Its inert definition describes the existing issue, Project, repository
and PR actions. Name the additional supported commands under `lets backlog`,
for example `lets backlog repository.read` and `lets backlog pull-request.read`.
User settings remain under `backlog` and repository selection under
`lets.backlog`, following ADR-011 and the current ADR-015 configuration boundary.
The facts still come from GitHub's code-host APIs; their source and semantics
remain distinct from Project status. No second configured adapter or new
provider-selection role is added. This does not claim a production cross-provider
PR integration for Jira, Linear or Beads; retain their scoped offline contracts.

**Option B:** retain a separately configurable code-host adapter as currently
drafted. It requires an explicit durable architecture decision and aligned
command/configuration paths, plus defined mixed-provider facts and live support
qualification. Nothing in D14 approves this additional role.

Both options use agents to execute bounded actions, the same inert loader and
core validation/recovery, existing workflow owners and user-owned merge. Neither
option reinstates capture infrastructure or implements backend calls in Lets.
These were the alternatives at the round-three pause. The user subsequently
selected option A in D15. Option B is rejected; it is not an active plan.

## Current review disposition after D15

D15 explicitly selects one configured GitHub integration for issue, Project,
repository and PR actions. The prior separate-role draft is withdrawn. No new
code-host adapter, command group or configuration section is selected. The
existing Adapter glossary meaning applies without a new term or a new ADR.
The next fresh review must assess this revision, not the withdrawn role.

| Round-three finding | Disposition and current evidence |
|---|---|
| C1: recovery depends on scratch handles | Confirmed; durable operation-ID resume and reconstructed handles cover cross-worktree and scratch-loss recovery. Tasks 2.11–2.12. |
| C2: issue-comments contradiction and missing fields | Confirmed; four full issue-comments requirement deltas use complete item.read facts for lets-go and brainstorm, preserving shaping's query and shared marker rules. Task 3.4 covers later pages and author/edit fields. |
| M1: unapproved code-host role and config | Confirmed; D15 chooses one GitHub definition. All affected commands use lets backlog and settings stay under backlog/lets.backlog. Custom MCP compatibility is offline-only until its own actual connection is live-qualified. Tasks 1.15–1.17, 3.6–3.7 and 6.12. |
| M2: step writes lack worker/resource identity | Confirmed; core allocates worker IDs for new callers; PR writes reserve repository/head or PR resource keys independently of worker IDs. Failed report reasons carry recovery references without new fields. Tasks 1.18, 2.13–2.14, 3.8 and 6.4. |
| M3: PR lookup introduces a stop | Confirmed; inspected GitHub CLI source uses open-first then newest. Preserve that rule after repository/head qualification, including when several matches exist. Task 3.5. |
| M4: same-machine hosts and sandbox prerequisites | Confirmed; explicit named connections and --connection avoid host detection. Resume binds the original connection. Document all-action state access and qualify an actual delegated step in live acceptance. Tasks 1.14, 1.16–1.17 and 6.13. |
| M5: tasks precede dependencies | Confirmed; repository/PR action support is now section 3, resume/conformance section 5, callers and terminal checks section 6. Documentation and release finish section 7. |
| M6: removed identity file still assumed | Confirmed; resolve scope per invocation and bind each request. The conflicting-identity scenario now compares bound scope with branch-resolved issue. Tasks 1.5, 1.8 and 5.1. |
| S1: unnamed ownership check | Accepted; Check work ownership has core verdicts and an explicit caller/overview stop for every failure. It performs no claim or repair. Tasks 5.8–5.10 and 6.11. |
| S2: multiple Projects differ from old unlink rule | Accepted; the parity table records ADR-015's explicit selection and existing storage prerequisites. Tasks 1.2 and 3.2. |
| S3: purpose and unqualified support | Accepted; purpose no longer promises a production completion caller. Task 7.2 checks explicit unqualified live evidence. |
| S4: ADR history | Accepted; ADR-015 records D12/D14 and D15 provenance. GitHub caller details stay in this plan rather than a durable architecture rule. |
| S5: plain language | Accepted; active changed paragraphs are split and wrapped. Full MODIFIED spec blocks retain main's detailed baseline requirements and all original scenario names. |

The current plan remains planning-only and requires a fresh independent verdict.
No prior REVISE becomes an approval because these edits validate structurally.
Publication, implementation, live mutation and merge remain outside this restart.
