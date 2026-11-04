---
id: adr-018
date: 2026-11-04
status: accepted
title: 'ADR-018: lets-build stays, trimmed of its handoff, and lets-go runs it across sessions'
description: Architecture decision record (ADR) for keeping lets-build as the skill for one session's work, removing its offer to build in a new session, and leaving lets-go to run the workflow across sessions
---

# ADR-018: lets-build stays, trimmed of its handoff, and lets-go runs it across sessions

> Builds on [ADR-016](ADR-016-review-and-handoff-stay-apart-from-step.md): that record kept the `handoff` strategy for one caller, and said it goes if that caller goes.

## Context

`lets-go` runs the whole workflow for one issue, each step in a fresh session. It reuses `lets-build` for six of its sections: *Find the source of demand*, *Confirm the packet*, *Route*, *Claim*, *Import the glossary checkpoint* and *Finish the change*. It names each one and repeats none. Its apply steps run `lets-build` on the change's branch. `lets-build` also does three things `lets-go` does not. It takes `next`, the next ready issue in the whole backlog; `lets-go` picks only among the stories its own discovery filed. It carries a change on by hand in the current session, which is the way on that `lets-go` names after a failed step. And it finishes a change in the session that built it. Now that `lets-go` exists, `lets-build` could be retired, trimmed or left as it is. One part overlaps: after propose, `lets-build` offers to build the plan in a new session. That offer is the `handoff` strategy's one caller.

## Decision

`lets-build` stays. It is the skill that does one session's share of the workflow, and `lets-go` runs it across sessions. Its handoff offer goes: the question whether to build the plan in a new session, and the `lets delegate handoff` commands behind it. `lets-go` on the change's branch does the same job, and adds a step report, a relay for the step's questions, and a resume. When the plan is ready, `lets-build` names the two ways on: run `lets-build` on the branch to build it here, or run `lets-go` to build it in fresh sessions. The routing table keeps both skills.

## Consequences

- Easier: one way to build a plan in fresh sessions, not two. A user who wants that runs `lets-go`, and gets its reports and resume.
- Easier: `lets-go` keeps a stable base. The sections it names stay in `lets-build`, and a fix to one reaches both skills.
- Easier: the `handoff` strategy loses its one caller, so a change of its own can remove it: the `lets delegate handoff` commands, the `start` adapter method, the `delegate.handoff` config key, and their specs and tests. The adapter contract shrinks to `run` and `step`.
- Harder: the trim is its own change, and touches several files: `skills/lets-build/SKILL.md`, the README's `lets-build` section and its section on reviews in a fresh session, `docs/resolvers.md`, and the tests that pin the handoff text.
- Harder: until the `handoff` strategy is removed, it ships with no caller.
- Harder: a user who used the offer to start a session in another harness by hand loses that path. They start it themselves with `lets-build` on the branch.
