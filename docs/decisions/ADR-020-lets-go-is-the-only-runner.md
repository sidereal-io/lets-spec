---
id: adr-020
date: 2026-11-04
status: accepted
title: 'ADR-020: lets-go is the only runner, and lets-build is the build step'
description: Architecture decision record (ADR) for one runner, lets-go, with one skill of its own name for each step, and lets-build as the build step alone
---

# ADR-020: lets-go is the only runner, and lets-build is the build step

> Supersedes [ADR-018](ADR-018-lets-build-stays-and-loses-its-handoff.md): that record kept `lets-build` as the skill for one session's share of the workflow, beside `lets-go`.

## Context

The workflow has five steps: shape, plan, review plan, build and review build. `lets-go` runs them for one issue, each in a fresh session, and reads from Git and GitHub which ones are done. Until now `lets-build` was a second runner. In one session it found the issue, confirmed its packet, routed it, claimed it, planned it, built it and finished it. `lets-go` named six of its sections by name, and its step prompts ran `lets-build` on the change's branch. So the sections that start a change lived in a skill that also built, and the plan step had no skill of its own: `lets-go`'s prompt named `openspec-propose` directly. Two runners meant two places to keep the same rules, and a step table that could not say one skill per row.

## Decision

`lets-go` is the only runner. Each step has one skill of its own name: `lets-shape`, `lets-plan`, `lets-review-plan`, `lets-build` and `lets-review-build`. A step skill does its step and stops, and calls OpenSpec's skills when it needs them. `lets-build` is the build step: it runs the apply step test-first and stops when every task is ticked. The sections that find, confirm, route and claim an issue belong to `lets-go`.

## Consequences

- Easier: one skill starts work, and one skill carries a change on. The routing table has one answer for both, and a person or `lets-go` can run any step by its name.
- Easier: a step row in `lets-go` names one skill. Moving a gate, such as the plan review, between steps edits a row, not a skill's internals.
- Easier: the `handoff` strategy has no caller left, so a chore can remove it.
- Harder: `lets-go` grows by the sections it took in, and is the one place to fix them.
- Harder: a person used to running `lets-build` on the default branch gets a message instead, and runs `lets-go`.
- Harder: `lets-review-build` has to ship in both flows, because it is now the only skill that finishes a change.

## Alternatives Considered

### Alternative 1: Keep `lets-build` as the in-session runner beside `lets-go`
- **Pros**: no move, and a session can run the whole workflow by hand without step reports.
- **Cons**: two runners share six sections by name, the plan step has no skill, and a step row cannot name one skill per step.
- **Why not**: this was ADR-018's choice. Then review plan and review build became skills of their own. That left plan as the one step without a skill, and `lets-build` as the one skill with two jobs.

### Alternative 2: Retire `lets-build`, and put apply in `lets-go`'s build prompt
- **Pros**: one skill fewer, and no name shared with the old runner.
- **Cons**: the build step would be prose in a prompt row, not a skill a person can run by name. The step table would have four skills and one inline recipe.
- **Why not**: each step has one skill of its own name, and build is a step.

### Alternative 3: Keep both runners, and let `lets-build` call `lets-go`'s sections
- **Pros**: `lets-build` keeps working on the default branch.
- **Cons**: the dependency only turns around. The rules still live in one skill and are named from another, and the build step still has two jobs.
- **Why not**: it keeps two ways to start an issue, which is what the one-runner decision removes.
