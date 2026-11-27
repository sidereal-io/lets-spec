# ADR Review Manifest

- Status: completed
- Review date: 2026-11-27

## Review Summary

ADR review completed for this change. The design's three decisions are internal to `lets` and cheap to reverse: one environment variable read in one place, and one optional adapter member. None needs a record.

Two in-force records bear on the design, and it stays within both:

- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) allows no environment variable that points at a resolver. `LETS_T3_SERVER_PID` names no resolver and selects none: it only tells `t3` which T3 server a detached step came from, and the pick over `delegate.resolvers` still runs.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) keeps one adapter method per kind of session. The new optional member, `detachedEnv`, is not a kind of session, so it adds none.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default delegate starts no session.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md): `lets` owns the delegate config.
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md): the config lists the chain.
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md): the caller chooses the model.
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md): delegations by strategy and intent.
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): `lets` tries the ranked models.
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): the resolvers are built into `lets`.
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): one config file shaped like the commands.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md): issue comments are evidence.
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): the reply is the read marker.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): review and handoff stay apart from step.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` reads where a run stands from Git and GitHub.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md): reviews record in the pull request.
- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): `lets-go` is the only runner.
- [ADR-021](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md): each product has a map, and the root lists them.
- [ADR-021](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md): where an outside command runs.
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md): a step reports through its final message.
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md): a step asks through its report.
- [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md): the tree check keeps a review read-only.
- [ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md): an item key is opaque.
- [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md): a repository config wins leaf by leaf.
- [ADR-027](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md): a story run is a child `lets-go` session.
- [ADR-027](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md): the project installs the OpenSpec CLI.
- [ADR-028](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md): each story run works in its own worktree.
- [ADR-029](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md): a step skill owns its rules.
- [ADR-030](../../../docs/decisions/ADR-030-an-empty-epic-is-its-own-discovery-parent.md): an empty epic is its own discovery parent.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
