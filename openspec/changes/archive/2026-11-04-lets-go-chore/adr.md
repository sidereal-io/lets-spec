# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default delegate starts no session. `lets-go` meets exit 3 from the default's step by running the step in a subagent.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): the config and the chain. `lets-go` reads `delegate.step.<step>.guidance` through `step instructions` and touches no config.
- [ADR-003](../../../docs/decisions/ADR-003-one-resolver-per-harness.md): one resolver per harness. Which resolver runs a step is not `lets-go`'s concern.
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md) and [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): the caller chooses and ranks the models. `lets-go` ranks as the handoff does.
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md): strategy and intent. `lets-go` names `step` and each of its three intents.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) and [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): `lets-go` reuses `lets-build`'s packet check, which follows them.
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md): a step reports through its final message. `lets-go` reads that report, and reads the block itself on exit 3 by the same rules.
- ADR-004 and ADR-009 are superseded and were read for history only.

## New Durable ADRs Created

- [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md): a step asks the user through its report, never in its session, and the caller answers a recommended question at `recommend`. Design decision D-3.

The other design decisions are recoverable from the skill's text. They are naming `lets-build`'s sections (D-1), one prompt frame (D-2), the growing answers file and the repeated-question stop (D-4), reading the block on exit 3 (D-5), the effort (D-6) and the checkout (D-7). None gets a record.
