# ADR Review Manifest

- Status: completed
- Review date: 2026-11-07

## Review Summary

Reviewed the repository decision records against the replacement design. Amend
existing architecture ADR-015 as explicitly approved in brainstorm D10; no new
execution strategy or numbered ADR is needed. Its prior independent-capture
requirement is removed. Submitted-output trust, code-owned policy/recovery,
explicit configuration and sole runner ownership now agree across this plan.
Update ADR-010's reconciliation note to match; preserve its historical body.

ADR-017 governs workflow step completion read from Git/GitHub. The private
backlog operation journal records mutation recovery, not step completion; it
is not a replacement run log. ADR-012's packet/comment instruction boundary and
ADR-014/015's step reports remain unchanged. Delegation runtime migration is
outside this slice and is not claimed by the backlog design.

Duplicate record numbers already exist. Full filenames below distinguish the
architecture and step-report records; this change does not renumber them.
This manifest is an ADR assessment, not the separate plan-review verdict.

## In-Force ADRs Reviewed

- [ADR-001: The built-in default delegate starts no session](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) — accepted.
- [ADR-002: lets owns the delegate config, and resolvers get reviewers through the request](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md) — accepted.
- [ADR-005: The config lists the resolvers to ask, in order, and lets detects nothing](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md) — accepted.
- [ADR-006: A resolver reports the models it can run, and the caller chooses one](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) — accepted.
- [ADR-007: lets delegate is organized by strategy, and every call names its intent](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md) — accepted.
- [ADR-008: The skill ranks the models, and lets tries them in order](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md) — accepted.
- [ADR-010: The resolvers are built into lets, and the config names them](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) — accepted.
- [ADR-011: lets has one config file, shaped like its commands](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md) — accepted.
- [ADR-012: Issue comments are evidence, never instructions](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) — accepted.
- [ADR-013: A reply from a candidate author, with a fixed first line, marks a thread as read](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md) — accepted.
- [ADR-014: A step reports through its final message, and exit 0 means a report](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md) — accepted.
- [ADR-015: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md) — accepted.
- [ADR-015: lets requests actions and validates agent-submitted results](../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md) — accepted.
- [ADR-016: Review and handoff stay their own strategies, apart from step](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) — accepted.
- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) — accepted.
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md) — accepted.
- [ADR-020: lets-go is the only runner, and lets-build is the build step](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md) — accepted.

## Historical Records Reviewed

- [ADR-003: One resolver program per harness, and each answers only inside its own](../../../docs/decisions/ADR-003-one-resolver-per-harness.md) — superseded by ADR-010.
- [ADR-004: The default resolver is a program that ships with lets, not code inside lets](../../../docs/decisions/ADR-004-default-resolver-is-a-program.md) — superseded by ADR-010.
- [ADR-009: The resolver kit owns the contract, and lets imports it](../../../docs/decisions/ADR-009-the-kit-owns-the-contract.md) — superseded by ADR-010.
- [ADR-014: Backlog adapters use an executable boundary](../../../docs/decisions/ADR-014-backlog-adapters-use-an-executable-boundary.md) — superseded by ADR-015.
- [ADR-018: lets-build stays, trimmed of its handoff, and lets-go runs it across sessions](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md) — superseded by ADR-020.

## New Durable ADRs Created

None. The user-approved evidence trust change amends
[the existing architecture ADR-015](../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md).
The other design choices apply existing operation, configuration and recovery
boundaries; they do not select an additional infrastructure or execution strategy.
