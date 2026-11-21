<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-19

## Review Summary

ADR review completed for this change. Design decision 6, that each project installs the OpenSpec CLI and `lets sync` checks only that it is there and not older, qualifies. Projects will drop their pins and Nix projects will add their own CLI, so a later return to exact pinning would break them, and the code alone does not say why the check is so loose. Decisions 1 to 5 are how the check, the comparison, the flake checks, the test fake and the docs are built. They are recoverable from the code, and the specs hold the behavior. No in-force record covers how projects get the OpenSpec CLI, so the new record supersedes and builds on none.

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
- [ADR-021: each product has a map](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
- [ADR-021: where an outside command runs](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)
- [ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md)

## New Durable ADRs Created

- [ADR-027: The project installs the OpenSpec CLI, and lets sync checks only that it is there and not older](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md)
