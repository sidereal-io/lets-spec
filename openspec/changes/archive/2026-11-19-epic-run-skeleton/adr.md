# ADR Review Manifest

- Status: completed
- Review date: 2026-11-19

## Review Summary

ADR review completed for this change. No decision in design.md qualifies. Each one is prose in one skill: the new part, where its loop goes, the checks on the epic, the pick, the lines file, the stop rule, the placeholders and the fixed lines. Each is recoverable from `skills/lets-go/`, cheap to change, and #280 to #287 will reshape it. The behavior lives in the `lets-go` spec. The lines file in `.workspace/lets-go/` (decision 5) is scratch that no rule reads to decide what to do, so it keeps to [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md). Running each story through `lets-go`'s own parts keeps to [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md).

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
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): the lines file is scratch, as it requires.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): the epic run runs each story through `lets-go`'s own parts.
- [ADR-021: each product has a map](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
- [ADR-021: where an outside command runs](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)
- [ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md)

## New Durable ADRs Created

- None - no decision in this change is costly to reverse.
