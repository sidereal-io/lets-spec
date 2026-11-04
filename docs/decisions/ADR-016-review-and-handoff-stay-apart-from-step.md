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

## Consequences

- Easier: a resolver gains steps by adding one method. No command, option or exit code changes, and no other resolver is touched.
- Easier: a review keeps its guarantees: the session runs read-only, and `lets` proves after that the tree is clean.
- Easier: a resolver may share one private function between `run` and `step`, with a read-only switch. The contract does not see it.
- Harder: `lets` keeps three command modules that look much alike: each looks up a resolver, tries the ranked models and prints a result. A fix to one may be needed in the others.
- Harder: `handoff` is kept for one caller, the offer to build a planned change in a new session. If that caller goes, `handoff` goes with it, and `start` leaves the contract.

## Alternatives Considered

### Alternative 1: Fold `review` into `step`
- **Pros**: one strategy and one command module for every session that `lets` waits for.
- **Cons**: a review must not write and prints the reviewer's text as it is; a step may write and must end with a step report. One strategy would need its tree check, output and exit codes to change with the intent.
- **Why not**: ADR-007 makes the strategy fix those things and the intent pick only the guidance. Folding would break that rule.

### Alternative 2: Fold `handoff` into `step`
- **Pros**: one fewer strategy, and one fewer adapter method.
- **Cons**: a handoff returns at once with a handle, and the user drives the session; a step blocks until its report. One command would print either a handle or a report.
- **Why not**: a caller could not tell from the command what it gets back, and the one handoff caller needs no report.

### Alternative 3: One adapter method with a read-only switch, in place of `run` and `step`
- **Pros**: a shorter contract, and resolvers already share most of the code.
- **Cons**: a resolver that can run reviews but not steps would accept the call and refuse it at run time. Today `lets` skips that resolver because it has no `step` method.
- **Why not**: a missing method is a check `lets` makes before it starts a session; a switch moves the check into every resolver.
