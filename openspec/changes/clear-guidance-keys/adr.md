<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. One decision in design.md
qualifies: naming each guidance key after the step it steers. It breaks
every user's and every repository's lets config, and an engineer reading
only the code could fold the keys back into command paths without
knowing why they left. The other decisions (where the version message is
written, the single mapping table in code, the README test, the bulk
fixture update) can be read from the code and are cheap to change.

The new record supersedes part of ADR-011. ADR-011 and ADR-007 each got
a note that points to it.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default delegate starts no session
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md): only `lets` reads the delegate config
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md): the config lists the resolvers to ask, in order
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md): the caller chooses the model
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md): delegations by strategy and intent; amended again by ADR-031
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): the skill ranks the models, and `lets` tries them in order
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): the resolvers are built into `lets`
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): one config file, shaped like the commands; partly superseded by ADR-031
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) and [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): review stays its own strategy, apart from step; unchanged, since the commands do not change
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md), [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md) and [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): how `lets-go` runs and records steps
- [ADR-021](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md) and [ADR-021](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md): where an outside command runs; discovery maps
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md), [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md) and [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md): step reports, step questions, the review tree check
- [ADR-025](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md): a backlog item key is opaque
- [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md): a repository's lets config wins, leaf by leaf; the new keys merge the same way
- [ADR-027](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md), [ADR-027](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md) and [ADR-028](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md): story runs; the OpenSpec CLI
- [ADR-029](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md) and [ADR-030](../../../docs/decisions/ADR-030-an-empty-epic-is-its-own-discovery-parent.md): step skills own their rules; empty epics

## New Durable ADRs Created

- [ADR-031: Each guidance key names the step it steers](../../../docs/decisions/ADR-031-each-guidance-key-names-the-step-it-steers.md)
