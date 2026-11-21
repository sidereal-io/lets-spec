<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-20

## Review Summary

Reviewed every record in `docs/decisions/`, ADR-001 through ADR-027, with their supersession notes. One decision of `design.md` is a costly fork, and gets a record: D-D, a worktree for every story run. The others follow the records in force:

- `lets delegate step start` and `step wait` start, check and wait on processes, and work on every agent host, so they run in `lets` code, not in the skill's prose, as [ADR-021: An outside command runs in lets code or in the skill](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md) says (D-A to D-C).
- The two commands wrap the `step` strategy's `step run` and add no strategy, as [ADR-027: An epic run runs each story in a child lets-go session, started as a step](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md) chose for the story run.
- The children file and the run records under `.workspace/` are scratch. A new epic run reads where each story stands from Git and GitHub, including `git worktree list`, as [ADR-017: lets-go reads where a run stands from Git and GitHub](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) says.

## In-Force ADRs Reviewed

ADR-001, ADR-002, ADR-005 through ADR-008, ADR-010 through ADR-013, ADR-016, ADR-017, ADR-019, ADR-020, both ADR-021 records, and ADR-022 through ADR-027, in `docs/decisions/`. ADR-003, ADR-004, ADR-009, ADR-014, ADR-015 and ADR-018 are superseded.

## New Durable ADRs Created

- [ADR-028: Each story run of an epic run works in a git worktree of its own](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md), which builds on ADR-027.
