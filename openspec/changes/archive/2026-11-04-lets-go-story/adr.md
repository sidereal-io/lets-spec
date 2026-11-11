# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. The design's six decisions are skill prose a reader can reverse by reading the skill, and none is costly to reverse. The two durable decisions this change leans on already have records. ADR-015 says a step asks through its report, and the caller owns the level. ADR-017 says `lets-go` keeps no state of its own.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-openspec-as-the-planning-system.md) to [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): read for context; none bears on this change.
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md): a step reports through its final message. Unchanged.
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md): a step asks through its report, and the caller owns the interactivity level. This change adds the `ask` relay the record already describes.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): review and handoff stay their own strategies. Propose review keeps running through `review`, inside the propose step (design D-3).
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` keeps no state. So a level named for one run does not carry to the next (design D-1).

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
