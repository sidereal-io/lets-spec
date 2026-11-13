# ADR Review Manifest

- Status: completed
- Review date: 2026-11-14

## Review Summary

ADR review completed for this change. The design's decisions follow records already in force: `complete` is a lets adapter primitive that lets runs itself ([ADR-021](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)), and it takes an opaque key ([ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)). One adapter method with one meaning is cheap to change, so none of them needs a record of its own.

## In-Force ADRs Reviewed

- [ADR-001-default-delegate-starts-no-session](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md)
- [ADR-002-lets-owns-the-delegate-config](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md)
- [ADR-005-the-config-lists-the-chain](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md)
- [ADR-006-the-caller-chooses-the-model](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md)
- [ADR-007-delegations-by-strategy-and-intent](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md)
- [ADR-008-lets-tries-the-ranked-models](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md)
- [ADR-010-the-resolvers-are-built-into-lets](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md)
- [ADR-011-one-config-file-shaped-like-the-commands](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md)
- [ADR-012-issue-comments-are-evidence](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md)
- [ADR-013-the-reply-is-the-read-marker](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md)
- [ADR-016-review-and-handoff-stay-apart-from-step](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md)
- [ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019-reviews-record-in-the-pull-request](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020-lets-go-is-the-only-runner](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)
- [ADR-021-each-product-has-a-map-and-the-root-lists-them](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
- [ADR-021-where-an-outside-command-runs](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022-a-step-reports-through-its-final-message](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023-a-step-asks-through-its-report](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024-the-tree-check-keeps-a-review-read-only](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)
- [ADR-025-an-item-key-is-opaque](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
