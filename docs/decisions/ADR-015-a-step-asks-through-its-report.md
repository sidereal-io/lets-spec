---
id: adr-015
date: 2026-11-04
status: accepted
title: 'ADR-015: A step asks the user through its report, never in its session'
description: Architecture decision record (ADR) for where a step's questions reach the user, and who answers a question that has a recommendation
---

# ADR-015: A step asks the user through its report, never in its session

> Builds on [ADR-014](ADR-014-a-step-reports-through-its-final-message.md): the report is the step's one channel back, and this record puts the step's questions on it.

## Context

A workflow run starts in one conversation, and the user expects to answer every question there. Each step runs in its own session: a subagent, or a thread in another harness. A subagent has no user. A thread that stops to ask is reported as a failed session, because the caller waits for a final message. The steps include a brainstorm, which has questions by design and needs the user to confirm its ledger. The caller sets an interactivity level: `recommend` asks the user only where there is no recommendation, and `ask` puts every question to the user.

## Decision

A step never asks the user in its session. When it needs a decision, it ends with a `needs-input` report that lists every open question, with a recommendation where it has one and none for a confirmation. The caller answers a recommended question itself at `recommend`, says so, asks the user the rest one at a time, and resumes the step with every answer so far. The step itself never decides a question.

## Consequences

- Easier: one prompt serves both levels. The step reports its questions the same way; only the caller's relay changes.
- Easier: a step runs the same in a subagent, a thread or a terminal, because none of them needs a user.
- Easier: the user sees every decision made for them, in the conversation they started.
- Harder: a step that needs an answer stops and runs again from the start with the answers, so a brainstorm with several rounds costs several sessions.
- Harder: a step must list every open question before it stops, or the next round stops again for the one it missed.

## Alternatives Considered

### Alternative 1: The step takes its own recommendations at `recommend`
- **Pros**: fewer rounds; the step reports only what it could not decide.
- **Cons**: the level would live in two places, the step and the caller; the user would not see what was decided for them; the prompt would differ by level.
- **Why not**: the caller owns the level, and the user must see each decision.

### Alternative 2: A step that has a user asks directly
- **Pros**: no round trip when the step runs in a thread the user can see.
- **Cons**: a subagent has no user, so two paths would exist for one thing; a thread that stops to ask is a failed session to the caller, which waits for a final message.
- **Why not**: one path works everywhere; the second works in one harness.
