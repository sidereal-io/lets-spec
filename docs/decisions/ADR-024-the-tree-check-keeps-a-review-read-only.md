---
id: adr-024
date: 2026-11-11
status: accepted
title: 'ADR-024: The tree check keeps a review read-only, not the session mode'
description: Architecture decision record (ADR) for letting a resolver run a review in a session mode that can write files, with the tree check after the session as the read-only guarantee
---

# ADR-024: The tree check keeps a review read-only, not the session mode

> Builds on [ADR-016](ADR-016-review-and-handoff-stay-apart-from-step.md): a review keeps its guarantees, and `lets` prints a review only after it checks that the session changed no file.

## Context

A review must not change the code it reviews. `lets` checks this after every review: it compares `git status` before and after the session, and exits 7 when a file outside `.workspace/` changed. Each resolver also picks a session mode in its harness. Some harnesses have a read-only mode that still answers headless with a final message, such as `codex exec` with its read-only sandbox. Others do not. In T3 Code, plan mode makes the model stop to ask a question, or answer with a plan for work it will do later, instead of the findings. `lets` then exits 5, or exits 0 with a plan that looks like a review. A reviewer also needs to run commands, such as the tests, to check its findings.

## Decision

A resolver runs a review in the harness mode that ends with the reviewer's answer. It uses a read-only mode only where that mode still does. Where it does not, as in T3 Code, the review runs in the harness's default mode. The read-only guarantee for every resolver is the tree check after the session, not the mode.

## Consequences

- Easier: a review in T3 Code ends with findings, and the reviewer can run the tests and read the diff.
- Easier: one guarantee holds for every resolver, so a new resolver needs no read-only mode to run reviews.
- Harder: a reviewer can write while it runs. The tree check sees it only afterwards, and only in the checkout `lets` watches. A write in another checkout, or a commit that leaves the tree clean, needs another check, such as comparing the commit the review ran on with the caller's.
- Harder: anyone who sees a review run in a mode that can write may switch it back to a read-only mode, and bring the stalled reviews back. This record says why not to.

## Alternatives Considered

### Alternative 1: Always use the harness's read-only mode
- **Pros**: the harness blocks a write before it happens.
- **Cons**: in T3 Code, the read-only mode is plan mode. Its sessions stop to ask, or return a plan, and the review never gives findings.
- **Why not**: a review that never ends with findings is worse than one checked for writes afterwards.

### Alternative 2: The default mode with an approval for each command
- **Pros**: the harness asks before each command that could write.
- **Cons**: every command waits for an approval that no one gives, because the caller waits headless for the final message.
- **Why not**: `lets` reads a session that waits for input as one that stopped to ask, so every review would fail.
