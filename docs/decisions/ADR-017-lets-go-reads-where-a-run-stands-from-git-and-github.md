---
id: adr-017
date: 2026-11-04
status: accepted
title: 'ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own'
description: Architecture decision record (ADR) for how the workflow entry point finds the first unfinished step and dates the steps it skips
---

# ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own

## Context

`lets-go` runs a workflow of steps: shape, propose, propose review, apply and apply review. A run can stop at any point: a session dies, a laptop closes, a step fails. The user restarts the same command, and `lets-go` must skip the steps already done, say why it skipped each one, and say when it was completed. The steps already leave records: the issue's packet and its last edit on GitHub, one commit per planning artifact, one commit per task tick, a `Code review` section in the pull request, and an archive commit. Each step may run in a different session, harness or machine, so a file one session writes is not there for the next.

## Decision

`lets-go` keeps no log, state file or marker of its own. It finds the first unfinished step from the records the workflow already leaves in Git and GitHub, and dates each skipped step from the commit or edit that completed it. Its only files are scratch under `.workspace/`, and a run reaches the same step without them. When the records disagree, `lets-go` stops and says what it found, and repairs nothing.

## Consequences

- Easier: a run restarts from any machine or session that has the branch, because the records travel with the branch and the pull request.
- Easier: a step can run in any harness. It owes `lets-go` nothing but its ordinary commits and its report.
- Easier: the skip lines are checkable by hand. Each names a commit or a pull request a person can open.
- Harder: each step's completion must leave a record the next run can read. A step that completes without a commit, such as a brainstorm that is confirmed but not yet committed, is not done to `lets-go`.
- Harder: `lets-go` cannot tell apart an unfinished step and a step whose record was lost, so it stops on a disagreement instead of guessing.
- Harder: a change to the commit layout, such as the name of the last planning artifact, changes where `lets-go` reads a date.

## Alternatives Considered

### Alternative 1: A step log under `.workspace/` or in the repository
- **Pros**: one file says where the run stands; the dates are exact; no `git log` reads.
- **Cons**: a file under `.workspace/` is on one machine and gone after a clean checkout; a file in the repository adds a commit to every step and can disagree with the commits it describes.
- **Why not**: the log would be a second record of what Git already records, and the two could drift.

### Alternative 2: Record each step's completion as an issue comment
- **Pros**: travels with the issue, readable by a person, no file.
- **Cons**: comments are evidence a human confirms, not instructions the workflow trusts; every step would need `gh` access and the issue thread would fill with machine lines.
- **Why not**: the workflow treats issue comments as untrusted evidence, and a completion marker would have to be trusted.

### Alternative 3: Repair a disagreement automatically
- **Pros**: the user is never stopped by a half-finished state.
- **Cons**: each repair picks which record is right, such as deleting an archive folder or re-marking a pull request as a draft, and a wrong pick destroys work.
- **Why not**: the records disagree only after something went wrong, and that is the moment to show a person, not to guess.
