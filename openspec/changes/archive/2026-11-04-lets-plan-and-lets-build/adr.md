# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. Of the eleven decisions in design.md, one passes the skill's test: where the runner lives. ADR-018 recorded that `lets-build` stays as a second runner, so an engineer reading only the skills could put the sections back and run the workflow from two places again. Reversing it would touch five skills, both schemas, the routing tables and the specs. This change records the new decision as ADR-020 and marks ADR-018 superseded. The other ten decisions are prose in skills, schemas, tests and the README, and another edit undoes each.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) The default delegate starts no session
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md) lets owns the delegate config
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md) The config lists the chain
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) The caller chooses the model
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md) Delegations by strategy and intent
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md) lets tries the ranked models
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md) The resolvers are built into lets
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md) One config file shaped like the commands
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) Issue comments are evidence. The thread read moves into `lets-go` unchanged.
- [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md) The reply is the read marker
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md) A step reports through its final message
- [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md) A step asks through its report
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) Review and handoff stay apart from step. The `handoff` strategy loses its last caller here and stays, as that record said it would until a change removes it.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) lets-go reads where a run stands from Git and GitHub. The reads do not change.
- [ADR-018](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md) lets-build stays and loses its handoff. Superseded by this change's ADR-020.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md) Reviews record in the pull request, and the schema holds only the plan. Both gates keep their records there.

ADR-010 supersedes ADR-003, ADR-004 and ADR-009, so this review skipped them.

## New Durable ADRs Created

- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md) lets-go is the only runner, and lets-build is the build step. Supersedes ADR-018.
