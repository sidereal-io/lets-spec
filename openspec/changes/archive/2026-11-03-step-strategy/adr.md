# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default delegate starts no session. The default's step keeps this: it saves the prompt and refuses.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md): `lets` owns the delegate config.
- [ADR-003](../../../docs/decisions/ADR-003-one-resolver-per-harness.md): one resolver per harness.
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md): the config lists the chain.
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md): the caller chooses the model.
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md): delegations are grouped by strategy, and every call names its intent. `step` is a third strategy under this rule.
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): `lets` tries the ranked models.
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): the resolvers are built into `lets`.
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): one config file shaped like the commands. `delegate.step.<step>.guidance` follows it.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) and [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): read; not touched by this change.
- ADR-004 and ADR-009 are superseded and were read for history only.

## New Durable ADRs Created

- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md): a step reports through its final message, and exit 0 means a report. Design decisions D-2 and D-3.

The other design decisions are recoverable from code: a third `Kind` and adapter method (D-1), the answers section (D-4), the default's step (D-5), finish on `done` (D-6), the config key (D-7) and the stderr record (D-8). None gets a record.
