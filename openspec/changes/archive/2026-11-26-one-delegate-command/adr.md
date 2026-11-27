<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. One decision in design.md passes the test: folding `lets delegate review` into `lets delegate step`, so the `--for` value decides the kind of session, with one report and one set of exit codes. It reverses ADR-016, so it gets a record that supersedes it. ADR-007 and ADR-024 get notes that point to the new record.

The other decisions are recoverable from code or are requirements the specs own: the shape of the intent table, `timeoutFor`, the options a reviewer takes, the literal table of old guidance keys, and how `lets-go` maps a step to its `--for` value.

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
- [ADR-021: Each product has a discovery map of its own, and the root map lists them](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-022: A step reports through its final message, and exit 0 means a report](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
- [ADR-023: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)
- [ADR-024: The tree check keeps a review read-only, not the session mode](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)
- [ADR-025: A backlog item is named by an opaque key that only its backlog provider reads](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-026: A repository's lets config sits beside the user's and wins, leaf by leaf](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md)
- [ADR-027: An epic run runs each story in a child lets-go session, started as a step](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md)
- [ADR-027: The project installs the OpenSpec CLI, and lets sync checks only that it is there and not older](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md)
- [ADR-028: Each story run of an epic run works in a git worktree of its own](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md)
- [ADR-029: A step skill owns its rules, and the step prompt only names it](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md)
- [ADR-030: An empty epic is its own discovery parent](../../../docs/decisions/ADR-030-an-empty-epic-is-its-own-discovery-parent.md)
- [ADR-031: Each guidance key names the step it steers](../../../docs/decisions/ADR-031-each-guidance-key-names-the-step-it-steers.md)

ADR-016 was in force when this review began; this change supersedes it.

## New Durable ADRs Created

- [ADR-032: One delegate command starts every session, and its --for value decides the kind](../../../docs/decisions/ADR-032-one-delegate-command-starts-every-session.md)
