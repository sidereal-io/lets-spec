# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

Reviewed every existing record. The executable protocol is already fixed by the backlog adapter contract. The new durable fork is storage of change identity separately from private recovery state. Native assignees, Status and PR links replace Project provenance fields. Private continuation remains local; ADR-015 still governs immutable change identity.

## In-Force ADRs Reviewed

- ADR-001, ADR-002, ADR-005, ADR-006, ADR-007, ADR-008, ADR-009, ADR-010, ADR-011, ADR-012 and ADR-013 in `docs/decisions/`.
- ADR-003 and ADR-004 were read as superseded context.

## New Durable ADRs Created

- [ADR-015: Persist backlog identity with the change](../../../docs/decisions/ADR-015-persist-backlog-identity-with-the-change.md).
