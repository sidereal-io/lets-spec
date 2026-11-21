---
id: adr-027
date: 2026-11-20
status: accepted
title: 'ADR-027: An epic run runs each story in a child lets-go session, started as a step'
description: Architecture decision record (ADR) for where an epic run's stories run, how the child session starts, and how its questions reach the user
---

# ADR-027: An epic run runs each story in a child lets-go session, started as a step

> Builds on [ADR-023](ADR-023-a-step-asks-through-its-report.md): a step asks through its report, and this record extends the same channel to a session that runs several steps.

## Context

An epic run is a `lets-go` run on an epic: it builds the epic's stories one at a time, each to a pull request ready for review. Each story has up to four steps, and each step already runs in a fresh session. But the epic run walks every story's steps itself, so its context holds every step line, every report and every relayed question of every story. A long epic can fill the session before its last story. The `step` strategy of `lets delegate` already starts a session that may write files, waits for its final message and reads the step report it ends with. No resolver reads the intent. A Claude subagent cannot start another subagent, so a session run as a subagent cannot give each of its steps a fresh session.

## Decision

The epic run picks, claims, stacks and routes each story, and enters its branch. It then starts a child `lets-go` session on that branch with `lets delegate step run --for story`, in the same checkout. The child walks only the story's step table and ends with one step report. It answers no question: it passes each one up in a `needs-input` report, and the epic run answers or asks under its own question mode, then starts the child again with the answers. When no resolver can start the child, the epic run walks the story in its own session, as before.

## Consequences

- Easier: the epic run's context grows by a few lines per story, however many stories the epic has.
- Easier: no new resolver code. The child uses the `step` strategy's session, report, time limit and kept session, with a `story` intent and a longer time limit.
- Easier: one place applies the question mode, and the user answers every question in the session they started.
- Easier: parallel children can later run the same way, each in its own checkout.
- Harder: a question takes two hops, step to child and child to epic run, and each answer round starts a new child session.
- Harder: what the child needs between sessions, such as the round count and the answers, has to live in the shared checkout's scratch files.
- Harder: on the fallback, with no resolver that starts sessions, the context saving is lost.

## Alternatives Considered

### Alternative 1: The child does everything from the issue check on
- **Pros**: the epic run only picks.
- **Cons**: a lost claim and the stack decision need the other stories, which the child cannot see. Every settle reason, such as `taken by <login>`, would come back through the child's report.
- **Why not**: the epic run already holds what those decisions need; the child would have to rebuild it.

### Alternative 2: A new `story` strategy beside `step`
- **Pros**: its own options and exit codes.
- **Cons**: it would repeat the `step` strategy's session, report reading, kept session and model ranking, line for line.
- **Why not**: the child is a session that writes files and ends with a step report, which is what `step` already runs.

### Alternative 3: Run the child in a subagent when no resolver can start it
- **Pros**: the context saving holds everywhere.
- **Cons**: a Claude subagent cannot start a subagent for each step, so every step would run inside the child's one session.
- **Why not**: fresh sessions per step matter more than the context saving; the epic run's own walk keeps them.
