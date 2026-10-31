# ADR Review Manifest

- Status: completed
- Review date: 2026-10-31

## Review Summary

ADR review completed for this change. Design decisions 1, 2, 4 and 6 are recoverable from the skill text and get no record. Decisions 3 and 5 pass the test: an engineer reading only the skill could reverse them, and reversing them would open the trust boundary or strand the skills that match the reply.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md) to [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): all about `lets delegate` and its config. None touches issues or comments.

## New Durable ADRs Created

- [ADR-012: Issue comments are evidence, and only a fold makes them instructions](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md)
- [ADR-013: One reply comment records that a thread was read, and its first line is fixed](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md)
