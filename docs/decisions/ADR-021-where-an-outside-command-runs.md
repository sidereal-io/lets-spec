---
id: adr-021
date: 2026-11-10
status: accepted
title: 'ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be'
description: Architecture decision record (ADR) for where a call to an outside tool such as gh or git runs, chosen by the task's complexity and portability rather than by what the call is about, with no agent between lets and a command lets runs
---

# ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be

> Supersedes [ADR-015](ADR-015-lets-requests-actions-and-validates-results.md) for delegation and backlogs.

## Context

The skills call outside tools all the time: `gh` for issues, the Project and pull requests, `git` for branches, a harness for a fresh session. Each call can run in one of two places:

- **In lets code.** An adapter inside lets runs the command and returns a typed result. The skill runs a `lets` command and reads JSON.
- **In the skill.** The skill's prose holds the command, and the agent runs it, such as `gh pr view <name> --json url`.

The project used to choose by what the call was about. Backlog calls were to go behind one boundary, and pull request calls stayed in the skills because they belong to the code host. That rule put a one-line read and a ranked, check-then-write claim in the same bucket whenever they touched the same system.

An earlier record chose a third place: an execution hybrid. lets asks for a bounded action, the agent runs the backend's tools from a provider definition, a document on how to use the tool, and lets checks what the agent reports. The aim was that anyone could add a backend or a harness without a release of lets. Its cost cannot be avoided. Once an agent sits between lets and the command, lets cannot know what happened, only what it was told. Proving it needs journals, evidence rules and a trusted capture channel that no host offers today. Until then, routine writes such as a claim must stop and ask the user.

## Decision

A call to an outside tool runs in lets code or in the skill. Which one depends on how complex the task is and how portable it must be, never on what the call is about.

| Run it in lets code when… | Run it directly in the skill when… |
|---|---|
| The task joins several calls, or decides something: it ranks, filters, or checks before it writes | It is one call, and the skill uses the output as it is |
| It writes shared state, where a write that stops halfway matters | It only reads, or one failed write is easy to see and to retry |
| It must work with more than one provider, such as GitHub now and Jira or Linear later | It is tied to one tool on purpose, with no plan to swap it |

A call moves into lets code as soon as any condition on the left holds for it. Shared rules, such as what is ready, how work ranks and how a claim checks for another owner, are written once in lets, outside every adapter. An adapter holds only what differs between providers.

When lets runs a command, no agent stands between them. lets runs it, reads its exit code and output, and returns the result. Agent-run provider definitions are not used for backlogs or for delegation. Delegation resolvers stay code inside lets.

Today this puts the backlog's reads and claims behind `lets backlog`, and fresh sessions behind `lets delegate`. Pull request reads and edits, and `git`, stay in the skills: each is a single call, and GitHub is the only code host.

Each adapter is built into lets. Loading an adapter from outside lets, such as a local module that implements the adapter interface, is not decided here. Whatever form it takes, lets must still be the one that runs it.

## Consequences

- Easier: one rule settles every new call, and it gives the reason for each place a call runs.
- Easier: a task in lets code makes the same calls for the same input, so tests can fake the tool and check every branch, failed writes included.
- Easier: lets sees each write's own response. A failed write is reported as it happened, with no journal or proof step. A write that times out can still have landed, and lets says so.
- Easier: a direct call in a skill costs no code until it needs to. The skills keep simple reads simple.
- Harder: a call can change places. When a single read grows into a check-then-write, or a second provider arrives, it moves from the skill into lets, and the skill's prose and checks change with it.
- Harder: a new provider or harness needs a change to lets and a release. Nobody can add one from outside yet.
- Harder: lets must keep each adapter working as its tool changes, and needs that tool installed and signed in.

## Alternatives Considered

### Alternative 1: The execution hybrid: an agent runs the tool from a provider definition
- **Pros**: anyone can add a backend or a harness by writing a definition, with no release of lets.
- **Cons**: lets must trust reports it cannot check. That needs journals, evidence provenance and a capture channel that does not exist. Until it does, routine claims must stop and ask the user. The definition also turns into a long guide to the tool.
- **Why not**: the trust machinery costs more than the extension point is worth, and it makes the writes that matter most the least reliable.

### Alternative 2: Choose by what the call is about
- **Pros**: easy to state: backlog calls in lets, code host calls in the skills.
- **Cons**: it ignores what makes a call risky. A ranked claim on the code host would stay in prose, and a one-line backlog read would need an adapter method.
- **Why not**: the cost of a call in prose comes from its complexity and its portability, not from the system it touches.

### Alternative 3: Every outside call goes through lets
- **Pros**: one boundary, and nothing in the skills to test by reading prose.
- **Cons**: a command and an adapter method for every single read, such as a pull request's URL, kept in step with every tool.
- **Why not**: most direct calls are single reads on one tool, where an adapter adds code and gains nothing.

### Alternative 4: Separately installed adapter programs, speaking a JSON protocol
- **Pros**: authors can write an adapter in any language, and release it on their own schedule.
- **Cons**: a versioned protocol, process supervision, packaging and a conformance kit, kept in step across releases.
- **Why not**: nobody outside this repository writes adapters yet, and the project has dropped this design twice, for resolvers and for backlogs, over these costs.
