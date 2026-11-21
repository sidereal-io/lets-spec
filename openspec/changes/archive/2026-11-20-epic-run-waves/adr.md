<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-20

## Review Summary

Reviewed every record in `docs/decisions/`, ADR-001 through ADR-027, with their supersession notes. The design's decisions follow the records in force, and none is a costly fork of its own:

- Placement joins several reads and decides something, so it runs in lets code, behind `lets backlog waves`, and works for every backlog provider through the adapter's `readItem`. The skill only runs the command and prints its result, as [ADR-021: An outside command runs in lets code or in the skill](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md) says.
- The command compares a blocker's `key` and `label` with a named item's, and orders items by the order `--only` gives, never by their keys, as [ADR-025: A backlog item is named by an opaque key](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md) requires.
- The waves file under `.workspace/lets-go/` is scratch for one epic run. A new run computes the waves again from GitHub, as [ADR-017: lets-go reads where a run stands from Git and GitHub](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) says.

## In-Force ADRs Reviewed

ADR-001, ADR-002, ADR-005 through ADR-008, ADR-010 through ADR-013, ADR-016, ADR-017, ADR-019, ADR-020, both ADR-021 records, and ADR-022 through ADR-027, in `docs/decisions/`. ADR-003, ADR-004, ADR-009, ADR-014, ADR-015 and ADR-018 are superseded.

## New Durable ADRs Created

None. The command is new and read-only, only the epic run reads it, and the skill text is versioned with each release, so every decision in `design.md` is cheap to reverse. The choice to sort by **Relevant code** rather than affected specs is a shared decision of epic #278.
