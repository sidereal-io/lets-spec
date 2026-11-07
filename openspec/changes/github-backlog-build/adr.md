# ADR Review Manifest

- Status: reviewed for architecture port
- Review date: 2026-11-07

## Review Summary

ADR-015, lets requests actions and validates agent-submitted results, governs
this port. Its executable-boundary predecessor is historical. ADR-020 keeps
lets-go as the only runner. Preserve the durable separation of immutable
change identity and private continuation from the prior implementation.

## In-Force ADRs Reviewed

- ADR-005: explicit resolver order and no implicit fallback.
- ADR-011: user configuration ownership.
- ADR-012 and ADR-013: comments are evidence; shaping owns the read marker.
- ADR-015-lets-requests-actions-and-validates-results.md: execution and trust.
- ADR-020-lets-go-is-the-only-runner.md: workflow ownership.

## New Durable ADRs Created

ADR-022-protected-capture-runs-under-a-separate-account.md records the concrete
Linux capture boundary proposed for operator deployment. It builds on the
accepted request/result architecture. Offline tests verify implementation
behavior; service installation and live qualification remain gates.

## Identity record numbering

Renamed this branch's identity record from the colliding ADR-015 prefix to
ADR-021-persist-backlog-identity-with-the-change.md. Its decision is unchanged.
Main's other records retain their names. Historical plans keep their original
references as historical evidence.
