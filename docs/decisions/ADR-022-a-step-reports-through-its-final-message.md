---
id: adr-022
date: 2026-11-04
status: accepted
title: 'ADR-022: A step reports through its final message, and exit 0 means a report'
description: Architecture decision record (ADR) for how a step session returns its step report to lets delegate, and what the command's exit codes mean
---

# ADR-022: A step reports through its final message, and exit 0 means a report

> Builds on [ADR-007](ADR-007-delegations-by-strategy-and-intent.md): `step` is a third strategy, with its own options, output and exit codes.

## Context

A step is one stage of the workflow, run in its own session that may write files. Its caller needs one answer when the session ends: the step is done, it needs input, or it failed. The session may run in any harness a resolver supports, or as a subagent of the caller when no resolver can run it. Harnesses differ in what they expose, but every one returns the session's final message. The caller is a skill, which reads JSON well and guesses badly.

## Decision

A step session ends its final message with a fenced code block tagged `step-report`, holding a YAML mapping with `outcome` and the fields that outcome needs. `lets delegate step run` reads the last such block, checks it, and prints the report as one JSON line on stdout. Exit 0 means a report is on stdout, whatever its outcome. A session that fails after it starts, or ends without a valid block, is a `failed` report at exit 0. Non-zero exit codes are reserved for cases where `lets` has no report: usage, every model refused, an unknown outcome, or a timeout.

## Consequences

- Easier: every resolver and the subagent fallback use the same channel, the final message, so the report format is defined once and a skill can read it with or without `lets`.
- Easier: a caller reads one place for how the step went. It branches on `outcome`, not on exit codes and stderr together.
- Easier: a session that forgets the block, or writes it badly, still produces a report with a reason, instead of a guess.
- Harder: a model must write the block exactly. The docs show it, and a wrong block costs a retry.
- Harder: a `failed` report that carries the whole final message makes one long line of JSON. Callers write it to a file.
- Harder: a failed session and a session that reported `failed` look the same to the caller, except for the reason text.

## Alternatives Considered

### Alternative 1: The session writes a report file under `.workspace/`
- **Pros**: no parsing of prose; the file is the report.
- **Cons**: a harness that runs elsewhere cannot write it; a stale file from an earlier run can be read as this run's report; a subagent fallback needs the same file discipline.
- **Why not**: the final message is the one channel every harness already returns, and it cannot be stale.

### Alternative 2: Exit codes carry the outcome, as a review's do
- **Pros**: matches `lets delegate review run`, where a failed session is exit 5.
- **Cons**: the caller would read `done` and `needs-input` from stdout but `failed` from an exit code and stderr. A session that ended with a well-formed `failed` report would also need a code.
- **Why not**: the report is the contract the later stories read. One place to read it is worth the difference from `review`.

### Alternative 3: `lets` prints the raw final message and the caller reads the block
- **Pros**: `lets` stays simple, as it is for a review.
- **Cons**: every caller, and every later resolver change, parses the block on its own, and a malformed block is each caller's problem.
- **Why not**: the format would have as many readers as callers, and none would be tested in `lets`.
