# ADR Review Manifest

- Status: completed
- Review date: 2026-11-11

## Review Summary

The design clarifies skill policy within the existing delegation architecture. No decision is costly to reverse or needs a new ADR.

## In-Force ADRs Reviewed

- [ADR-006: A resolver reports the models it can run, and the caller chooses one](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md)
- [ADR-008: The skill ranks the models, and lets tries them in order](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md)
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-023: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md)

## New Durable ADRs Created

None. Model-selection policy is a requirement; the CLI and resolver contracts stay unchanged.
