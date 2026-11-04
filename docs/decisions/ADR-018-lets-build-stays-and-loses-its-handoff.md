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
