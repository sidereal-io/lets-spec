# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. The seven decisions in design.md are naming and test choices. Each can be undone by another rename, so none is costly to reverse, and none changes a boundary an earlier record set.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) The default delegate starts no session
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md) lets owns the delegate config
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md) The config lists the chain
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) The caller chooses the model
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md) Delegations by strategy and intent. The step intents change value, not shape: `--for` still names an intent under a strategy.
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md) lets tries the ranked models
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) The resolvers are built into lets
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md) One config file shaped like the commands. The step guidance keys follow the new `--for` values, as this record requires.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) Issue comments are evidence
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md) The reply is the read marker
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md) A step reports through its final message
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md) A step asks through its report
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) Review and handoff stay apart from step. The `review` and `handoff` intents keep their names for the same reason.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) lets-go reads where a run stands from Git and GitHub. Its text names the old steps; it stays as a dated record (D6).
- [ADR-018](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md) lets-build stays and loses its handoff. Epic #148's revision of 2026-11-04 supersedes it in a later story, not this one.

ADR-010 supersedes ADR-003, ADR-004 and ADR-009, so this review skipped them.

## New Durable ADRs Created

- None. This change introduces no durable architectural decision.
