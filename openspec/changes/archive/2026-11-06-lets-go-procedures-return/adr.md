# ADR Review Manifest

- Status: completed
- Review date: 2026-11-06

## Review Summary

ADR review completed for this change. The records that bear on it most are ADR-017, which keeps `lets-go`'s state in Git and GitHub, and ADR-020, which gives the sections that find, confirm, route and claim an issue to `lets-go`. This change keeps both. Results live only inside one `lets-go` session, and the run still reads where it stands from Git and GitHub. ADR-015 (a step asks through its report) is about steps, and procedures are not steps, so it does not apply.

## In-Force ADRs Reviewed

- [ADR-001: The built-in default delegate starts no session](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md)
- [ADR-002: lets owns the delegate config, and resolvers get reviewers through the request](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md)
- [ADR-005: The config lists the resolvers to ask, in order, and lets detects nothing](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md)
- [ADR-006: A resolver reports the models it can run, and the caller chooses one](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md)
- [ADR-007: lets delegate is organized by strategy, and every call names its intent](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md)
- [ADR-008: The skill ranks the models, and lets tries them in order](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md)
- [ADR-010: The resolvers are built into lets, and the config names them](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md)
- [ADR-011: lets has one config file, shaped like its commands](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md)
- [ADR-012: Issue comments are evidence, never instructions](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md)
- [ADR-013: A reply from a candidate author, with a fixed first line, marks a thread as read](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md)
- [ADR-022: A step reports through its final message, and exit 0 means a report](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-015: lets requests actions and validates agent-submitted results](../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md)
- [ADR-016: Review and handoff stay their own strategies, apart from step](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md)
- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020: lets-go is the only runner, and lets-build is the build step](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced. Each decision in design.md shapes one skill file, and a later edit can change it without touching code, data or another skill. The spec and the skill-interfaces tests already hold what a reader needs to keep them: each procedure returns a named result and holds no `stop`, each part names the action for each result, the override idioms are banned, the branch lookup comes before the packet check, and three lost claims stop a run.
