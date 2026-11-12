# ADR Review Manifest

- Status: completed
- Review date: 2026-11-11

## Review Summary

ADR review completed for this change. No decision in design.md needs a record. Decision 1, a process group for each command, could be undone by an engineer who did not know why, but undoing it is not costly: it is one option in one function, and the new tests in `tests/lets/resolvers/kit/io.test.ts` fail at once. Decisions 2 to 4 set a grace period, when the promise settles and which signals are passed on. Each lives in the same function and costs little to change. The change follows the in-force records: the kit's `Io` stays the code inside `lets` that runs outside commands (ADR-010, ADR-021), and the time limits stay where the review and step commands set them (ADR-016, ADR-022).

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
- [ADR-016: Review and handoff stay their own strategies, apart from step](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md)
- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020: lets-go is the only runner, and lets-build is the build step](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)
- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022: A step reports through its final message, and exit 0 means a report](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024: The tree check keeps a review read-only, not the session mode](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
