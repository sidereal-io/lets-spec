# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. Of the six decisions in design.md, none passes the skill's test. Each is prose in a skill, a config overlay, a test or one function, and another edit undoes it. The one choice a reader could reverse by accident, putting the code review back into the project's config as a rule, is already covered: ADR-019 records that a review is a gate a Let's Spec skill runs between two stages, and that switching a review on or off changes a skill or a rule, never the schema. This change moves the switch from a rule to a skill, within what that record allows. No new record.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) The default delegate starts no session
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md) lets owns the delegate config
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md) The config lists the chain
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) The caller chooses the model
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md) Delegations by strategy and intent. The code review keeps the `review` strategy and the `code` intent.
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md) lets tries the ranked models
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) The resolvers are built into lets
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md) One config file shaped like the commands
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) Issue comments are evidence
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md) The reply is the read marker
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md) A step reports through its final message
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md) A step asks through its report
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) Review and handoff stay apart from step. The code review still runs through the `review` strategy, read-only.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) lets-go reads where a run stands from Git and GitHub. The **Code review** section it reads keeps its shape.
- [ADR-018](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md) lets-build stays and loses its handoff. *Finish the change* stays in `lets-build`, and invokes the new skill.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md) Reviews record in the pull request, and the schema holds only the plan. This change keeps the code review's record where that ADR puts it.

ADR-010 supersedes ADR-003, ADR-004 and ADR-009, so this review skipped them.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
