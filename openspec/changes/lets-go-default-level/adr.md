# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. The design's six decisions are each recoverable from the code or the skill: where the key is parsed, how the parser splits, the error prefix, when the skill runs the command, and what the line says. None is a fork that is costly to reverse. The one durable decision this change leans on already has a record: ADR-011 says a new setting goes in the section named after the command group that reads it, at the path of that command. `go.level` and `lets go level` follow it.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) to [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): read for context; none bears on this change.
- [ADR-011: lets has one config file, shaped like its commands](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): the record this change applies. It puts `go.level` in a `go` section, read by `lets go level`.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) to [ADR-014](../../../docs/decisions/ADR-014-a-step-reports-through-its-final-message.md): read for context; none bears on this change.
- [ADR-015: A step asks through its report](../../../docs/decisions/ADR-015-a-step-asks-through-its-report.md): the caller owns the level. This change moves only where the caller's default comes from.
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md) and [ADR-018](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md): read for context; neither bears on this change.
- [ADR-017: lets-go reads where a run stands from Git and GitHub](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` keeps no state of its own. The level still holds for one run only; the config is the user's, not a record of a run.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
