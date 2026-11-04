# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. The design's nine decisions are skill prose a reader can reverse by reading the skill, and none is costly to reverse. The two durable decisions this change leans on already have records. ADR-015 says a step asks through its report, which is why the shape step relays `lets-shape`'s questions instead of asking. ADR-017 says `lets-go` keeps no state, which is why a shape that stops before an issue exists has nothing to resume from but its answers file.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) to [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): read for context; none bears on this change. ADR-012 and ADR-013 govern how `lets-shape` reads comments, which the shape step inherits unchanged.
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md): a step reports through its final message. The shape step's issue number travels in that report's evidence (design D-5).
- [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md): a step asks through its report, and the caller owns the interactivity level. The shape step runs `lets-shape` under that rule (design D-1, D-4).
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): review and handoff stay their own strategies. Unchanged.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` keeps no state. Shape's scratch files are named by the input, and losing them costs only the answers (design D-6).

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
