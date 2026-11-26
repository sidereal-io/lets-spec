<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. Every record in `docs/decisions/`
was read. Three bear on the design, and the design follows each:

- `lets go shape-name` moves a fixed rule from the skill into `lets`
  code, as ADR-021 says for a task that decides something.
- `--issue` passes the key unchanged and checks nothing about its form,
  as ADR-025 says.
- The command keeps no state: the name comes from the input alone, and
  the answers file stays scratch under `.workspace/`, as ADR-017 says.

## In-Force ADRs Reviewed

- [ADR-017: lets-go reads where a run stands from Git and GitHub](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-021: Where an outside command runs](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-025: An item key is opaque](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-029: A step skill owns its rules](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md)

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced. The
  name format and the hash are cheap to change: a later change costs one
  lost answers file per stopped idea run, the same cost this change
  pays, and the rule now sits in one function and its tests.
