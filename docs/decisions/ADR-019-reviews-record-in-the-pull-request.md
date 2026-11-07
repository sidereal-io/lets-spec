---
id: adr-019
date: 2026-11-04
status: accepted
title: 'ADR-019: Reviews record in the pull request, and the schema holds only the plan'
description: Architecture decision record (ADR) for keeping both reviews out of the OpenSpec schema, as sections of the pull request description that start with a Reviewed line
---

# ADR-019: Reviews record in the pull request, and the schema holds only the plan

> Builds on [ADR-017](ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): the workflow's state is read from the records Git and GitHub already keep, and a review section is one of them.

## Context

Let's Spec has two independent reviews. The code review runs once every task is built, and writes a **Code review** section in the pull request description. Its first line, `Reviewed: <base> <base-sha>..<head-sha>`, lets a later session tell whether the review still covers the branch. The plan review started as an artifact of the `lets-standard` schema: a `review.md` file, written between the design and the tasks, with a verdict line the tasks step read. So one review was a record in the pull request and the other was a file in the plan. The plan review could not run as a step of its own while it was an artifact, because the skill that writes the plan wrote the review too. And the schema's artifacts are OpenSpec's. A review among them makes the plan's shape depend on a review the project might switch off.

## Decision

Both reviews record in the pull request description, each under its own heading, **Plan review** and **Code review**, with a `Reviewed:` line first. The OpenSpec schema holds only the plan's artifacts, and ends at the tasks. A review is a gate a Let's Spec skill runs between two stages, not an artifact a stage produces.

## Consequences

- Easier: both reviews have one shape, and one kind of check tells whether an earlier review still holds. A reader of the pull request sees the whole plan review where they see the code review.
- Easier: the planning skill builds the plan in one pass. A review can become a step of its own, with its own session and report, without touching the schema.
- Easier: switching a review on or off, or moving where it runs, changes a skill or a rule, never the schema or a project's changes in flight.
- Harder: the record leaves the repository's history. Anyone with write access can edit a pull request description, and a project that moves off GitHub loses the record. The `Reviewed:` line names a commit, so the plan the review covered is still in Git.
- Harder: nothing in the schema stops a build that skipped the review. The skill that builds is the gate, and the apply instruction says to start from it.
- Harder: the review runs after the tasks are written, so a verdict that sends the plan back costs a tasks rewrite too.

## Alternatives Considered

### Alternative 1: Keep the plan review as a schema artifact
- **Pros**: the record is a file in Git, with its own commit; the schema enforces the order, so no build can skip it.
- **Cons**: the skill that writes the plan writes the review in the middle of it, so the review cannot be a step of its own. The two reviews keep two shapes. A project that turns the review off needs another schema.
- **Why not**: the workflow runs each step in its own session, and a review inside the plan's artifact chain cannot be one of them.

### Alternative 2: Record both reviews as files in the change folder
- **Pros**: one shape, in Git, carried into the archive with the plan.
- **Cons**: the code review runs after every task is done, when the change is about to be archived, so its file would be written and moved in the same breath. A file in the change folder is still an artifact to OpenSpec's tooling, and `openspec status` would list it as missing or extra.
- **Why not**: the code review already records in the pull request, and that record is the one the person who merges reads.

### Alternative 3: Record both reviews as issue comments
- **Pros**: travels with the issue; survives a rebase; no file.
- **Cons**: the workflow treats issue comments as evidence a person confirms, never as records it trusts. A review verdict that gates a build would have to be trusted.
- **Why not**: a comment cannot be the record a build waits on without breaking the rule that comments are evidence.
