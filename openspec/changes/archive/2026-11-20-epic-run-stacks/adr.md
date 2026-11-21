<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-19

## Review Summary

Reviewed every record in `docs/decisions/`, ADR-001 through ADR-026, with their supersession notes. The design's decisions follow the records in force, and none is a costly fork of its own:

- Ranking stays in `lets backlog ready`, written once outside the adapter, and the pull request and `git` reads that decide what is met and which branch is the base stay in the skill, as [ADR-021: An outside command runs in lets code or in the skill](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md) puts them.
- `--met-blockers` takes keys that lets passes to the adapter unchanged, and the adapter alone says when a blocker is in another repository, as [ADR-025: A backlog item is named by an opaque key](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md) requires.
- The epic run reads each stack from Git and GitHub at every pick, and keeps no record of its own, as [ADR-017: lets-go reads where a run stands from Git and GitHub](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) says.

## In-Force ADRs Reviewed

ADR-001, ADR-002, ADR-005 through ADR-008, ADR-010 through ADR-013, ADR-016, ADR-017, ADR-019, ADR-020, both ADR-021 records, and ADR-022 through ADR-026, in `docs/decisions/`. ADR-003, ADR-004, ADR-009, ADR-014, ADR-015 and ADR-018 are superseded.

## New Durable ADRs Created

None. The new option is additive and the skill text is versioned with each release, so every decision in `design.md` is cheap to reverse.
