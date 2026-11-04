# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. The design's seven decisions are skill prose: a reader reverses any of them by editing the skill, and nothing else binds to them. The two durable decisions this change leans on already have records. ADR-015 says a step asks through its report, which is why the discovery offer is a `needs-input` question and each phase confirmation reaches the user through the relay. ADR-017 says `lets-go` keeps no state, which is why a resumed round finds the discovery in `lets-shape`'s own records, the parent issue and the map. The map commit (design D-5) is a workflow rule in one skill, not an architectural fork: no consumer binds to where the map's commit lands.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) to [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): read for context; none bears on this change. ADR-012 and ADR-013 govern how `lets-shape` reads comments, which discovery's Ingest phase inherits unchanged.
- [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md): a step reports through its final message. The parent and the stories travel in that report's evidence (design D-3).
- [ADR-015](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md): a step asks through its report, and the caller owns the interactivity level. The discovery offer and every phase confirmation follow that rule (design D-1, D-2).
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): review and handoff stay their own strategies. Unchanged.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` keeps no state. Where a discovery stands is read from the parent issue and the map (design D-2), and the map must be committed before the tree is read (design D-5).

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
