# ADR Review Manifest

- Status: completed
- Review date: 2026-11-20

## Review Summary

ADR review completed for this change. Of design.md's decisions, only D-9 qualifies: running a `lets-go` session inside another, through the `step` strategy and in the same checkout, is a fork that later work will build on. The other decisions are recoverable from code or are details of that one.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md)
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md)
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md)
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md)
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md)
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md)
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md)
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md)
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md)
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md)
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md)
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)
- [ADR-021: discovery maps](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
- [ADR-021: outside commands](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)
- [ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md)

## New Durable ADRs Created

- [ADR-027: An epic run runs each story in a child lets-go session, started as a step](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md)
