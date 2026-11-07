# ADR Review Manifest

- Status: revision in progress
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

None yet. The capture channel's concrete trust boundary and deployment remain
a blocking prerequisite. Record any new durable choice after it is resolved;
do not silently treat an editable file or test double as trusted capture.

## Identity record numbering

The prior identity record is ADR-015-persist-backlog-identity-with-the-change.md.
Main has other records with that numeric prefix. Resolve this collision during
migration and update references by full filename, preserving their meanings.
