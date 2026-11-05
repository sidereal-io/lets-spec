# ADR Review Manifest

- Status: completed
- Review date: 2026-11-05

## Review Summary

ADR review completed for this change. None of the eleven decisions in design.md passes the skill's test. The step table, the walk and the review plan step are prose in two skills, and another edit undoes each. The two choices a reader might bind to are already recorded. ADR-017 says `lets-go` reads where a run stands from Git and GitHub. ADR-019 says the plan review records in the pull request. The walk and the covering check apply those records to one more step. No record is created.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) The default delegate starts no session
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md) lets owns the delegate config
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md) The config lists the chain
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) The caller chooses the model
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md) Delegations by strategy and intent
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md) lets tries the ranked models
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) The resolvers are built into lets
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md) One config file shaped like the commands
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) Issue comments are evidence
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md) The reply is the read marker
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md) A step reports through its final message. The review plan step reports the same way.
- [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md) A step asks through its report. The two-`REVISE` stop reaches `lets-go` as a `needs-input` report.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) Review and handoff stay apart from step
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) lets-go reads where a run stands from Git and GitHub. The walk reads each row's record, and keeps no state.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md) Reviews record in the pull request. The review plan row reads that record to tell whether the step is done.
- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md) lets-go is the only runner, and lets-build is the build step. Each row names one skill, as that record says.

ADR-010 supersedes ADR-003, ADR-004 and ADR-009, and ADR-020 supersedes ADR-018, so this review skipped them.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
