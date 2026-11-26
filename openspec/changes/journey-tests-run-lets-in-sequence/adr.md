# ADR Review Manifest

- Status: completed
- Review date: 2026-11-25

## Review Summary

ADR review completed for this change. Six in-force records shape the
journeys, and the change follows each of them without changing it:

- [ADR-008: The skill ranks the models, and lets tries them in order](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md)
  is what the story journey's last check relies on: the first two
  models are refused and the third answers, so all three calls show
  the order (design decision 3).
- [ADR-006: A resolver reports the models it can run, and the caller chooses one](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md)
  is the join the story journey tests between `step instructions`,
  whose `options` it reads, and `step run`, which gets them as
  `--model` values.
- [ADR-022: A step reports through its final message, and exit 0 means a report](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md)
  is why both journeys read the step report as one JSON line, on stdout
  or in the report file, with exit 0.
- [ADR-025: A backlog item is named by an opaque key that only its backlog provider reads](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
  is why each journey passes a `key` from one `lets backlog` command to
  the next unchanged, and never builds one.
- [ADR-027: An epic run runs each story in a child lets-go session, started as a step](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md)
  is the path the epic-wave journey follows: `step start --for story`
  for each story of a wave, then `step wait`.
- [ADR-028: Each story run of an epic run works in a git worktree of its own](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md)
  is a rule for `lets-go`, which makes the worktrees. The epic-wave
  journey runs its stories in the repository root, as design.md's
  trade-off says, and leaves `--checkout` to `background.test.ts`.

## In-Force ADRs Reviewed

Every accepted record in `docs/decisions/`, ADR-001 to ADR-030, was
read. Those not named above do not bear on this change: they govern the
delegate config, review and handoff, the backlog adapters, issue
comments, discovery maps and the OpenSpec CLI, none of which the
journeys change.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
  Each of design.md's decisions lives in one test file, and a later
  change can reverse it cheaply: the file's place, which fixtures it
  imports, and the stand-ins' data. Black-box tests through `lets`, one
  helper module and no change to `lets` are #308's Shared decisions,
  not this change's.
