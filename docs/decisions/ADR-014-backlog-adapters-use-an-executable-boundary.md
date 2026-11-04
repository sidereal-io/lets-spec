---
id: adr-014
date: 2026-11-03
status: proposed
title: 'ADR-014: Backlog adapters use an executable boundary'
description: Architecture decision record for independently installed backlog adapters using a versioned JSON process boundary
---

# ADR-014: Backlog adapters use an executable boundary

## Context

Let's Spec separates planning policy from the program that stores a project's
backlog. It aims to support GitHub, Jira Cloud, Linear, local Beads and adapters
written independently for other programs. The existing contract and offline kit
describe that boundary; no production backlog dispatcher is installed yet.

[ADR-010](ADR-010-the-resolvers-are-built-into-lets.md) moved delegation resolvers
into `lets` because outside resolvers were neither used nor expected. It removed
a protocol, separate bundles and installation paths whose cost had no expected
beneficiary. Independent backlog adapters are an explicit extension goal, though
third-party adoption is not yet proven. Requiring every adapter to share the
caller's runtime and release would constrain that goal.

## Decision

Backlog adapters use the existing versioned JSON executable contract: one request
on stdin and one response on stdout per invocation, with diagnostics on stderr.
The shared caller owns workflow policy, adapters translate provider operations,
and the code host owns branch and pull request operations. This decision applies
to backlog adapters; ADR-010 continues to govern delegation resolvers.

## Consequences

- Easier: an author can implement and release an adapter without loading its
  language runtime or provider dependencies into `lets`.
- Easier: the caller can validate protocol output and stop waiting for a process
  without embedding provider code in its own process.
- Easier: offline executable fixtures can check protocol and recovery behavior
  without credentials. They do not establish live provider support.
- Harder: maintainers must keep the versioned contract, validation and conformance
  checks coherent across independently released programs. Unsupported protocol
  versions must fail explicitly, rather than being guessed compatible.
- Harder: users must install and trust the selected executable. Paths and runtime
  requirements can break when installations move. The caller must follow explicit
  configuration and must not silently fall back to another provider.
- Harder: a child process is not a sandbox. It can access inherited credentials
  and local resources; separating dependencies does not confine authentication.
- Harder: process deadlines do not undo accepted provider writes. Unknown outcomes
  still require reconciliation before retry or progression. Process startup and
  serialization add cost to each operation.
- Harder: protocol and packaging costs remain even if third-party adoption is
  limited. Future maintainers must weigh that evidence before changing this
  boundary, including the migration cost for existing external adapters.

## Alternatives Considered

### Alternative 1: Build every adapter into lets

- **Pros**: one release, no external adapter installation and direct calls that
  can use in-process test doubles.
- **Cons**: each new provider requires a change and release of `lets`; its runtime
  and dependencies must fit the host package.
- **Why not**: independent authors could not add an adapter on their own release
  schedule. That extension goal supplies the beneficiary absent for resolvers.

### Alternative 2: Load third-party plugins into the lets process

- **Pros**: independently released integrations without one process per request.
- **Cons**: plugins share the caller's runtime and dependency environment and need
  discovery, loading and compatibility rules. They execute inside the caller.
- **Why not**: runtime coupling would constrain adapter authors while retaining
  the cost of a public extension interface.

### Alternative 3: Run adapters as long-running services

- **Pros**: persistent connections and state can amortize process startup.
- **Cons**: installation also requires service startup, shutdown, endpoint
  configuration and availability management, including for local backlogs.
- **Why not**: the request/response workflow does not justify those operational
  requirements. The executable contract needs no separately managed service.
