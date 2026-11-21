<!-- Plain language: Make each record link identify the decision so a reader can find its rationale. Keep this manifest separate from the records themselves. -->

# ADR Review Manifest

- Status: completed
- Review date: 2026-11-21

## Review Summary

ADR review completed for this change. The design's decisions DS1 to DS5 are prose in one `lets-go` reference file and its tests. Each is reversed by editing that file, and #137 replaces the lookup with a `lets backlog` command. None is a costly fork, so this change creates no record.

## In-Force ADRs Reviewed

The titles and statuses of all 31 records in `docs/decisions/` were checked. These four bear on this change:

- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): DS3 reads the shape step's answers file, which is scratch under `.workspace/`. design.md says why that adds no state.
- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md): the lookup stays a `gh` read in the skill until #137 moves it behind `lets backlog`.
- [ADR-023: A step asks the user through its report, never in its session](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md): the answers file DS3 reads is the one this record set up.
- [ADR-029: A step skill owns its rules, and the step prompt only names it](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md): `lets-go` copies none of `lets-shape`'s Finalize rule (DS3).

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
