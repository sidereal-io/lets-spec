# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default delegate starts no session. Unchanged: a resumed step meets exit 3 as before.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): the config and the chain. This change touches no config.
- [ADR-003](../../../docs/decisions/ADR-003-one-resolver-per-harness.md), [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md), [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md), [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): resolvers, models, strategies and intents. A resumed step runs through the same `step` strategy and ranking.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) and [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments are evidence. ADR-017 rejects a completion marker in the issue thread for this reason.
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md) and [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md): the step report and the relay. The reused answers file (design D-5) feeds the same relay.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): three strategies. Unchanged.
- ADR-004 and ADR-009 are superseded and were read for history only.

## New Durable ADRs Created

- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` reads where a run stands from Git and GitHub, keeps no log of its own, and stops on a disagreement instead of repairing it. Design decisions D-1, D-2 and D-4, and the epic's shared decision on skip dates.

The other design decisions are recoverable from the skill's text: finding the branch and the issue (D-3), reusing the answers file (D-5), the skip line form (D-6) and the dated propose review line (D-7). None gets a record.
