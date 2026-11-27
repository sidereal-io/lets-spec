---
id: adr-032
date: 2026-11-26
status: accepted
title: 'ADR-032: One delegate command starts every session, and its --for value decides the kind'
description: Architecture decision record (ADR) for folding lets delegate review into lets delegate step, so that the --for value alone decides whether a session is a read-only reviewer or one that may write
---

# ADR-032: One delegate command starts every session, and its --for value decides the kind

> Supersedes [ADR-016](ADR-016-review-and-handoff-stay-apart-from-step.md): `review` no longer stays a strategy of its own. ADR-016's adapter contract, one method per kind of session, still holds.

## Context

`lets delegate` had two command groups that start a session. `review` started a read-only session, checked afterwards that it changed no file outside `.workspace/`, printed the final message as it was, and used exit 5 for a failed session and 7 for a changed tree. `step` started a session that may write, read the step report its final message ends with, and printed that report as one JSON line, with every outcome at exit 0. They were kept apart because the kind of session, its output and its exit codes followed the command, and the `--for` value, the intent, only picked the user's guidance.

That premise no longer holds. Each guidance key now names the workflow step it steers, and `--for` names that step, so `--for review-plan` and `--for review-build` already say the session is a reviewer. The two commands left callers with two sets of `--for` values, options, outputs and exit codes, for one idea: start a fresh session for this step.

## Decision

`lets delegate step` is the only command group that starts a session, and `lets delegate review` is removed. The `--for` value decides the kind of session: `review-plan` and `review-build` start a read-only reviewer, checked by the same tree comparison, and every other value starts a session that may write. Every outcome, a reviewer's included, comes back as a report on stdout at exit 0: a reviewer's final message is returned whole as the findings of a `done` report, and a failed or empty session or a changed tree is a `failed` report. The command has one set of exit codes, 0, 2, 3, 4 and 6; exits 5 and 7 are gone.

## Consequences

- Easier: a caller learns one command, one report shape and one set of exit codes, and branches on `outcome` for every session.
- Easier: the workflow runner can start a reviewer the way it starts every other step, with no second code path.
- Easier: `lets` keeps one module that looks up a resolver, tries the ranked models, finishes the session and prints the result, so a fix lands once.
- Easier: each `--for` value reads the guidance key of the same name; no step shares another step's key in code.
- Harder: options and limits now vary by `--for` value inside one command. `--source-family` is required for a reviewer and refused for every other value; `--answers-file` is refused for a reviewer; a reviewer has 30 or 45 minutes, a step 120 and a story 600. The help text has to say which applies when.
- Harder: a reviewer's findings arrive inside JSON, so a caller reads the `findings` field instead of printing stdout.
- Harder: a script that called `lets delegate review`, read the old `strategy` field of `instructions`, or acted on exit 5 or 7 breaks, and must move to `step` and read the report.
- Still true: the adapter keeps one method per kind of session, `run` for a read-only session and an optional `step` for one that may write. `lets` picks the method from the `--for` value, so a resolver that runs no step still answers a reviewer.

## Alternatives Considered

### Alternative 1: Keep `review` as its own command
- **Pros**: no breaking change; a review's output stays the plain final message, which a skill can print as it is.
- **Cons**: two `--for` value sets where one names the same steps as the other, two option sets, and two exit-code tables that differ for the same event, a failed session.
- **Why not**: a workflow runner that starts every session would need a second path for reviewers, and every caller would keep learning both tables.

### Alternative 2: Fold `review` into `step`, and make the reviewer write a step-report block
- **Pros**: one report reader for every session; findings could become structured fields, and a reviewer could ask questions through `needs-input`.
- **Cons**: every review prompt would have to change its finding format and end with a block, and a reviewer that forgets the block would turn a good review into a `failed` report.
- **Why not**: the review skills already parse the reviewer's text, including its `Read: <checkout> <commit>` line. Returning the text whole keeps them working, and structure can be added later without changing the command again.

### Alternative 3: Fold `review` into `step`, but keep exits 5 and 7 for reviewers
- **Pros**: a caller that branched on those exits keeps working.
- **Cons**: one command would report a failed session as a `failed` report for one `--for` value and as exit 5 for another.
- **Why not**: the point of one command is that a caller reads every outcome in one place, as steps already do.
