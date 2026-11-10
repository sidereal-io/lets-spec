# ADR Review Manifest

- Status: completed
- Review date: 2026-11-10

## Review Summary

One design decision qualifies: Decision 8, where a call to an outside tool runs. It is a system boundary, and reversing it would rework every adapter and the skills that call them. The other decisions are recoverable from code: the file layout, the per-command Project lookup, the error mapping, the shape of `ready` and `find`, and the removal of the old kit.

ADR-021 supersedes ADR-015 entirely, for delegation and backlogs. A first version superseded it only for backlogs and kept its delegation part, which ADR-021's own reasoning rules out. ADR-015's notes on ADR-005, ADR-010 and ADR-011 described that withdrawn target, so they are removed, and ADR-010 now notes that ADR-021 confirms it.

## In-Force ADRs Reviewed

- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): the resolver chain and the user config; their ADR-015 notes are removed, and their decisions are unchanged.
- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md), [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md), [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md), [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): delegation; unaffected.
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): built-in resolvers; confirmed by ADR-021, and its ADR-015 note is replaced.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md), [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments; the thread read stays in the skills.
- [ADR-014 (step reports)](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md), [ADR-015 (step asks)](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md), [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): steps; unaffected.
- [ADR-015 (execution hybrid)](../../../docs/decisions/ADR-015-lets-requests-actions-and-validates-results.md): superseded by ADR-021, for delegation and backlogs.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` reads records from Git and GitHub; unchanged, since pull request reads stay as `gh`, as ADR-021's rule puts single calls on one tool.
- [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md), [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): unaffected.

## New Durable ADRs Created

- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
