# ADR Review Manifest

- Status: completed
- Review date: 2026-11-05

## Review Summary

Reviewed the existing records and the design's decisions. This change adds a reversible skill and uses existing delegation and publication tools. It changes no resolver contract, execution architecture, persistent data model or author's build gate.

ADR-019 concerns reviews that gate the author's workflow and record their result in the PR description. This collaborator review produces advisory feedback in a comment and never supplies that gate. It neither replaces nor weakens ADR-019.

ADR-015's provider-definition architecture is a target with a separate delegation migration still outstanding. This change uses the current read-only delegation surface without claiming that migration is complete or introducing a second provider implementation.

## In-Force ADRs Reviewed

- [ADR-001](../../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md), as amended.
- [ADR-002](../../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), surviving config ownership.
- [ADR-005](../../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), as reconciled.
- [ADR-006](../../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md).
- [ADR-007](../../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md).
- [ADR-008](../../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md).
- [ADR-010](../../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), surviving explicit selection and current runtime context.
- [ADR-011](../../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md), as scoped.
- [ADR-012](../../../../docs/decisions/ADR-012-issue-comments-are-evidence.md).
- [ADR-013](../../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md).
- [ADR-022, step reports](../../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md).
- [ADR-023, step questions](../../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md).
- [ADR-015, bounded actions and results](../../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md).
- [ADR-016](../../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md).
- [ADR-017](../../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md).
- [ADR-019](../../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md).
- [ADR-020](../../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md).

Also read superseded ADR-003, ADR-004, ADR-009, the executable-boundary ADR-014 and ADR-018 for history. The repository already has duplicate 014 and 015 numbers; this change does not renumber them.

## New Durable ADRs Created

None. The design reuses accepted boundaries. Pass prompts, trial limits, model preferences and comment presentation are reversible skill policy, so none passes the skill's test for a new costly architectural fork.
