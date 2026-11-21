---
id: adr-028
date: 2026-11-20
status: accepted
title: 'ADR-028: Each story run of an epic run works in a git worktree of its own'
description: Architecture decision record (ADR) for where an epic run's story runs check out their branches, so that the stories of one wave can run at the same time
---

# ADR-028: Each story run of an epic run works in a git worktree of its own

> Builds on [ADR-027](ADR-027-a-story-run-is-a-child-lets-go-session.md): each story already runs in a child `lets-go` session; this record decides where that session works.

## Context

An epic run is a `lets-go` run on an epic. It sorts the epic's stories into waves: sets of stories that no "blocked by" link joins and whose packets name no overlapping code. Each story runs in a child `lets-go` session that walks its steps on the story's branch. While every child shares the epic run's checkout, only one can run at a time, because each needs its own branch checked out. The epic run must also switch back to the default branch after each story, and must end the whole run when a story leaves changes that are not committed, because the next story would start on top of them. A git worktree is a second checkout of the same repository, with its own branch and working files, that shares the repository's history and refs.

## Decision

In an epic run, every story run works in a git worktree of its own, even in a wave of one story. The epic run creates it under `.workspace/lets-go/worktrees/<name>/` in its own checkout, or reuses a clean worktree that already has the story's branch, and its own checkout stays on the default branch for the whole run. It removes a built story's worktree, without force, and keeps the worktree of a story that stopped or failed.

## Consequences

- Easier: the stories of one wave run at the same time, one child in each worktree.
- Easier: one way of running, whatever the size of the wave.
- Easier: a story that stops with changes that are not committed stops alone. Its changes stay in its worktree, and its line says where.
- Easier: the epic run never switches branches, so a failed switch can no longer end it.
- Harder: a new worktree has none of the files git ignores, such as dependencies, local env files and, in a project that ignores them, the lets-spec skills. The epic run runs `lets sync` for the skills; the steps prepare the rest as the project's own instructions say.
- Harder: every command on a story's branch has to name the worktree, such as `git -C <path>`, and the child's scratch files live in the worktree, not in the epic run's checkout.
- Harder: worktrees use disk space, and a kept worktree stays until the user removes it.
- Harder: children that run at the same time share the repository's refs, so two of them can briefly contend for a ref lock.

## Alternatives Considered

### Alternative 1: A worktree only for a wave of two or more stories
- **Pros**: a wave of one story needs no worktree and no `lets sync`.
- **Cons**: two ways of running a story, each with its own branch handling, stop rule and tests.
- **Why not**: the extra path buys nothing a worktree does not already do, and it keeps the shared checkout's stop on changes that are not committed.

### Alternative 2: A separate clone of the repository for each story
- **Pros**: each child is fully isolated, refs included.
- **Cons**: each clone fetches the whole history again, and a branch pushed in one clone is not visible in the others until they fetch.
- **Why not**: a stacked story branches off its blocker's branch, which a worktree sees at once and a clone has to fetch.

### Alternative 3: Worktrees next to the repository, such as `../<repo>-<name>`
- **Pros**: the worktree is not inside the epic run's checkout.
- **Cons**: the epic run writes outside the repository, where nothing ignores or cleans up its files.
- **Why not**: working files belong in `.workspace/`, which git already ignores.
