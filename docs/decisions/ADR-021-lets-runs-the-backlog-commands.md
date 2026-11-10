---
id: adr-021
date: 2026-11-10
status: accepted
title: 'ADR-021: lets runs the backlog commands itself'
description: Architecture decision record (ADR) for backlog adapters as code in lets that runs the backend's commands and returns typed results, in place of agent-run provider definitions
---

# ADR-021: lets runs the backlog commands itself

## Context

The skills that pick, read and claim work drive the backlog by running `gh` from their own prose. To support backlog programs other than GitHub, those calls need one boundary that every program sits behind. ADR-015 chose an execution hybrid for that boundary: lets asks for a bounded action, the agent runs the backend's tools from a provider definition, and lets validates what the agent reports. That design has a cost it cannot avoid. Once an agent sits between lets and the backend, lets cannot know what happened, only what it was told. Proving it needs journals, evidence rules and a trusted capture channel that no host offers today. The provider definition also turns into a long document on how to use the backend's command-line tool.

## Decision

A backlog adapter is code inside lets. It runs the backend's commands itself, such as `gh` for GitHub, and returns typed results to the skills through `lets backlog` commands. Shared policy, such as which work is ready, how it ranks and how a claim checks for another owner, is written once, outside every adapter. No agent runs backlog commands. This supersedes [ADR-015](ADR-015-lets-requests-actions-and-validates-results.md) for backlogs. Its delegation part is unchanged.

## Consequences

- Easier: the same input always makes the same calls, so tests can fake the backend and check every branch, including failed writes.
- Easier: lets knows what each write did, because it ran the write. A failed write is reported as it happened, with no journal or proof step.
- Easier: an adapter holds only what differs between backends, so it stays small. The skills hold no backend commands.
- Harder: a new backlog program needs a change to lets and a release. Nobody can add one from outside. The way to change that is an adapter whose commands come from a config file that lets runs itself, still with no agent in between.
- Harder: lets must keep each adapter working as its backend's tool changes, and needs that tool installed and signed in.

## Alternatives Considered

### Alternative 1: The execution hybrid of ADR-015
- **Pros**: anyone can add a backend by writing a provider definition, with no release of lets.
- **Cons**: an agent runs every backend command, so lets must check reports it cannot trust. That needs journals, evidence provenance and a capture channel that does not exist yet. Until it exists, routine claims must stop and ask the user.
- **Why not**: the trust machinery costs more than the extension point is worth, and the definition becomes a long guide to the backend's tool.

### Alternative 2: Separately installed adapter programs
- **Pros**: authors can write an adapter in any language, and release it on their own schedule.
- **Cons**: a versioned process protocol, process supervision, packaging and a conformance kit, kept in step across releases.
- **Why not**: nobody outside this repository writes backlog adapters yet, and every backend the project plans to support ships with lets anyway.

### Alternative 3: Keep the backend commands in the skills
- **Pros**: no new code.
- **Cons**: each skill repeats the commands and the policy for each backend, and nothing tests them.
- **Why not**: adding a second backend would mean rewriting every skill that touches the backlog.
