---
id: adr-016
date: 2026-11-04
status: accepted
title: 'ADR-016: Review and handoff stay their own strategies, apart from step'
description: Architecture decision record (ADR) for keeping the review and handoff strategies of lets delegate separate from step, with one adapter method per kind of session
---

# ADR-016: Review and handoff stay their own strategies, apart from step

> Builds on [ADR-007](ADR-007-delegations-by-strategy-and-intent.md): a strategy fixes a session's options, output and exit codes, and this record keeps three of them.

## Context

`lets delegate` has three strategies, one for each kind of session. A `review` is read-only: `lets` waits for its final message, prints it as it is, and checks after that the session changed no file. A `handoff` starts an interactive session and returns at once. A `step` may write files, and `lets` waits for a final message that ends with a step report. Each resolver binds to one adapter contract, and the resolvers each learn to run steps next. Before they do, the contract must be settled: will `review` and `handoff` stay, or fold into `step`? If the contract changed later, every resolver would change twice.

## Decision

Neither `review` nor `handoff` folds into `step`. Each kind of session stays its own strategy, with its own options, output and exit codes. The adapter contract keeps one method per kind of session: `run`, `start` and `step`. A resolver declines a kind by leaving its method out; only `run` is required. A resolver that learns steps adds one method, `step`, and nothing in the `lets delegate` commands changes.
