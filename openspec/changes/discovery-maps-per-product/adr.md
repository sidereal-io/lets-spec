# ADR Review Manifest

- Status: completed
- Review date: 2026-11-10

## Review Summary

ADR review completed for this change. Of design.md's decisions, only Decision 8 qualifies: the map layout is written into users' repositories, so it is costly to reverse. The others, such as the `## Products` heading, the template's shape and the commands, can be read from the skills and changed cheaply.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md), [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md), [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md), [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md), [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): delegation and config. None touches discovery.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md), [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments. Revision mode's thread reads keep both.
- [ADR-014 (step reports)](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md), [ADR-015 (step asks)](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md), [ADR-015 (lets validates results)](../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md), [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): steps and backlog adapters. The shape step's question about products goes through its report, as ADR-015 says.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md), [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md), [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): lets-go reads Git and GitHub, reviews live in the pull request, and lets-go is the only runner. The `Map:` line keeps the run's state in the parent issue, as ADR-017 says.

## New Durable ADRs Created

- [ADR-021: Each product has a discovery map of its own, and the root map lists them](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
