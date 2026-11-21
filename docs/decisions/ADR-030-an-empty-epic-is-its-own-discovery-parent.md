---
id: adr-030
date: 2026-11-21
status: accepted
title: 'ADR-030: An empty epic is its own discovery parent'
description: Architecture decision record (ADR) for shaping an epic with no sub-issues in place, writing discovery's parent into the epic's own body, and keeping its original text in the body
---

# ADR-030: An empty epic is its own discovery parent

## Context

Discovery in `lets-shape` records its work in a parent issue: the
status line, the `Input:` line that a later run matches, the scope, the
priorities and the stories as sub-issues. Its stance is that the input
is read-only: discovery reads the PRD, issue or idea it starts from,
and never edits it. An empty epic is an issue whose Kind is already
Epic and that has no sub-issues. A user who makes one has already
decided that the work splits into stories. If discovery treats the
epic as an ordinary input, it files a second parent beside it, and the
backlog holds two epics for one piece of work, one of them with no
stories.

## Decision

When the input is an empty epic, the epic is discovery's parent. Ingest
writes the parent template into the epic's own body, keeps its title,
and writes `Input: #<epic>`, naming the epic itself. The body ends with
a `## Original description` section that holds the epic's earlier body
word for word, so nothing of the input is lost. This is the one case
where discovery writes to its input.

## Consequences

- Easier: one epic per piece of work. The stories are sub-issues of the
  epic the user made, so a `lets-go` epic run on that epic builds them.
- Easier: a later run finds the discovery from the epic alone, because
  the epic's `Input:` line names the epic.
- Harder: the read-only rule has an exception, and `lets-shape`'s
  stance must name it, or a reader may "fix" the exception and bring
  back the second parent.
- Harder: the epic's body changes shape, so anyone who reads the epic's
  first text has to look in `## Original description`, or in GitHub's
  edit history.
- Harder: epics shaped this way name themselves in `Input:`. Going back
  to a separate parent would leave those epics matching themselves, and
  each would need its `Input:` line rewritten by hand.

## Alternatives Considered

### Alternative 1: File a second parent, and leave the epic as it is

- **Pros**: the input stays read-only, with no exception.
- **Cons**: two epics for one piece of work; the user's epic stays
  empty, and a run on it finds nothing to build.
- **Why not**: the user's epic is the issue they will run `lets-go` on,
  and it would never get stories.

### Alternative 2: Keep the original text in a comment, or in GitHub's edit history

- **Pros**: the parent body holds only the parent template.
- **Cons**: a comment is evidence that `lets-shape` reads and judges,
  not packet text; edit history is not where agents read a packet.
- **Why not**: agents read the issue body. Text kept anywhere else is
  text they miss.
