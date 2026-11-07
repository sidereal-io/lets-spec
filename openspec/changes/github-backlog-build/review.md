## Review Metadata

- Review round: 3
- Prior round: REVISE; no concrete capture implementation selected
- Reviewer context: fresh-context subagent, same family
- Reviewer model: gpt-6.1-sol
- Independent model family: no; configured resolver returned no options
- Reviewed base commit: 4deabdb5; concrete design appendix was uncommitted
- Tool restrictions: read-only, no scripts/backend calls/writes

## Findings and disposition

1. **Moderate — stale-lock takeover race. CONFIRMED, fixed in plan.**
   Required corrections mandate OS-released exclusive flock serialization,
   no stale unlink, explicit missing-tool failure and race tests.
2. **Moderate — uncertain reservation blocks reconciliation reads.
   CONFIRMED, fixed in plan.** A reconciling state retains original write
   identity but can request separately identified captured reads. It cannot
   issue another write until independently resolved.
3. **Moderate — historical replay versus freshness. CONFIRMED, fixed in
   plan.** Replay uses stored descriptors/outcomes without treating them as
   current evidence; new submissions and required fresh checkpoints remain
   subject to freshness. Add distinct delayed replay and stale ownership cases.
4. **Moderate — imprecise GraphQL read/write classifier. CONFIRMED, fixed
   in plan.** Parse the actual document; support one operation only and no
   operationName override. Check operation kind, rejecting multi-operation
   documents before execution.

## Verdict

VERDICT: APPROVE_WITH_CHANGES
CHANGES_APPLIED: yes

The listed unambiguous changes are applied in the design's Required review
corrections. The reviewer permits safe implementation after those edits;
no new review is required for them. This is not independent-family approval,
and it does not qualify a deployed trust channel or live GitHub support.

## Delivery gates

Prepare core, generic runner, inert definitions, offline validation and
protected deployment artifacts. Installing a system service requires operator
approval of the completed artifact. Demonstrated separate-account isolation,
pinned real tools/authentication and new live claim/merge evidence remain
mandatory before support/readiness. Earlier executable reviews and acceptance
remain historical under history/executable-boundary.

## Port code review

Reviewed: main 6524fbff..f2f92d81

Gemini gemini-4-argon-high reviewed the committed range in a fresh read-only
T3 session. The tool identifies the Gemini family, independent of the GPT and
Claude authors. Its first command recorded f2f92d81 as HEAD. No REVIEW.md
exists, so there were no additional repository review rules.

1. **Critical — incomplete Project items block reads. CONFIRMED.** Fixed in
   5f3689e1. Read packets preserve missing or unrelated values and expose Project
   membership; mutations and immutable binding retain strict checks.
2. **Critical — unexecuted writes strand recovery. CONFIRMED.** Fixed in
   d5d44ea4, with recovery documentation in 610baa19. Protected settlement atomically records non-dispatch and prevents
   later execution of that action ID. Only that evidence permits rollback of
   an entirely unexecuted workflow. Unknown/partial writes remain reserved.
   Fresh read-only reconciliation can continue beyond the original day bound.
   The subclaim that any late successful submission should be accepted is
   **REFUTED**: new submissions intentionally retain the documented three-minute
   window. Historical replay and protected non-dispatch have separate rules.
3. **High — failed reads are reported as uncertain writes. CONFIRMED.** Fixed in
   77043ded. Captured read failures classify permission/not-found errors and
   finish read-only workflows. Errors after issued writes retain original
   workflow correlation and uncertain effects.
4. **High — glossary import precedes identity binding; section parsing rejects
   labels. CONFIRMED.** Fixed in d78eae76 and 1b9d52f3. Before planning binds a
   change, the original verified private claim identifies the update. Markdown
   boundaries respect heading depth, fenced text and bold labels with values.
5. **High — early lock-helper exit hangs cleanup. CONFIRMED.** Fixed in
   290557d4. Cleanup detects an exited helper and reports uncertain effects.
   The macOS support subclaim is **REFUTED** as a support requirement: the
   approved port and proposed capture deployment explicitly qualify Linux
   initially. This review and the automated run do not qualify Darwin support.
6. **Medium — repository version/migration errors and external definition paths.
   CONFIRMED.** Fixed in dcf281e8. Explicit selection requires repository version
   1, obsolete executables name the file/key and migration, empty YAML keeps the
   default, and definition sources resolve to regular files inside the repo.
7. **Medium — stacked/deleted merged branches have incorrect routing.
   CONFIRMED.** Fixed in 42cb39a0. Closed packets route to original archived
   identity/continuation without a new claim. Stacked PR association remains
   pending until retargeting exposes native closing links. A feature-branch
   merge alone still cannot authorize Done.

The listed fix commits address the findings; this is not a second clean review
or deployed/live acceptance. Protected deployment and fresh scoped evidence
remain open, and the PR stays draft.
