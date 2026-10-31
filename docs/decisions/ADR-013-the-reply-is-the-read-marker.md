---
id: adr-013
date: 2026-10-31
status: accepted
title: 'ADR-013: One reply comment records that a thread was read, and its first line is fixed'
description: Architecture decision record (ADR) for recording that shaping read an issue's thread as one reply comment with a fixed first line, which later skills use as the read marker
---

# ADR-013: One reply comment records that a thread was read, and its first line is fixed

> Builds on [ADR-012](ADR-012-issue-comments-are-evidence.md): a comment reaches a plan only through a fold. This record says how the fold is recorded.

## Context

Once shaping has read a thread and folded or dismissed each comment, a later session needs to know that, so it does not stop on comments that were already judged. A fold edits the body, which GitHub dates, but a dismissal edits nothing. The marker must survive without a new Project field, work from `gh`, and be visible to the people in the thread, who should see what became of their comments.

## Decision

After reading a thread, shaping posts exactly one reply comment on the issue. Its first line is exactly `lets-shape read this thread.`, and the rest lists each comment as `Folded:` or `Dismissed:` with the author, the date and what changed or why not. A later skill treats the newest such reply, and the body's last edit, as the point up to which the thread was read.

## Consequences

- Easier: the record is in the thread, where the commenter sees it, and it needs no permission beyond posting a comment.
- Easier: a dismissal counts as read without touching the body.
- Easier: the marker is plain text, so it can be matched with `gh` and read by a person.
- Harder: the first line is a contract. Changing its wording breaks every skill that matches it, and old replies keep the old wording.
- Harder: a thread gets one more comment per shaping run, and a person can post a comment that starts with the same line.

## Alternatives Considered

### Alternative 1: A label or a reaction on each comment
- **Pros**: no extra comment; the marker sits on the comment it judges.
- **Cons**: reactions carry no reason, labels sit on the issue, not the comment, and both need write permissions beyond commenting.
- **Why not**: neither says what was folded and why, which is what the audit trail is for.

### Alternative 2: A Project field with the read date
- **Pros**: a structured value, easy to compare.
- **Cons**: invisible in the thread, one more field for `lets-setup-backlog` to create and check, and unavailable to a repository with no Project.
- **Why not**: the people in the thread would not see what became of their comments, and the backlog rule keeps Project fields to the few the skills already set.

### Alternative 3: The body's last edit alone
- **Pros**: nothing new; GitHub already dates it.
- **Cons**: a dismissal makes no edit, so a dismissed comment would stop every later build.
- **Why not**: dismissals are the common case for outside and bot comments.
