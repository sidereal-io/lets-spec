# ADR Review Manifest

- Status: completed
- Review date: 2026-11-27

## Review Summary

ADR review completed for this change. Each decision in design.md was
tested against the `lets-write-adrs` rule: could a reader reverse it
without knowing why, and would that be costly? None qualifies.

- Decision 1, where each procedure result is described, and Decision 3,
  where a one-section placeholder is explained, are rules about the
  skill's text. The `lets-go` spec states both, in *Each lets-go
  procedure returns a result*, *Each part names the action for each
  result* and *Each placeholder in lets-go names one thing*. A reader
  who repeats a result's description breaks a requirement they can
  read; undoing it is a text edit.
- Decision 2, moving *Run the epic* into `references/epic-run.md`, is
  a file layout that the spec names and the link check enforces. Moving
  it back costs one edit.
- Decisions 4, 5 and 6 are one-off checks and a record in the pull
  request. They leave nothing to reverse.

## In-Force ADRs Reviewed

- [ADR-027: An epic run runs each story in a child lets-go session, started as a step](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md)
- [ADR-028: Each story run of an epic run works in a git worktree of its own](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md)
- [ADR-029: A step skill owns its rules, and the step prompt only names it](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md)

This change rewords text that describes these decisions, in *Run the
epic*, *Take up a started story* and *Stack the story*, and changes
none of them. The other in-force records cover delegation, config,
issue comments, discovery maps, step reports, backlog providers and the
records command, which this change does not touch.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
