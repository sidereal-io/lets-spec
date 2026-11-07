---
id: adr-021
date: 2026-11-04
status: accepted
title: 'ADR-021: Persist backlog identity with the change'
description: Architecture decision record for retaining work-item identity through planning and archive
---

# ADR-021: Persist backlog identity with the change

## Context

A change can outlive the repository's backlog configuration and move into archive before its pull request merges. Issue numbers and titles do not uniquely identify work across providers and backlogs. Claim tokens and recovery journals must survive process restarts without becoming committed project data.

## Decision

Persist a versioned `backlog.json` beside change artifacts containing repository, provider/backlog/item identity, display reference and optional URL. Keep private sessions, tokens and mutation journals in the Git common directory, outside tracked artifacts. Resume and completion reject conflicting selection or missing ownership provenance rather than reassociating by title or number.

## Consequences

- Identity travels with planning commits and archive, so later completion can find the same work item.
- Secrets and transient ownership stay outside version control.
- Existing changes need explicit identity confirmation, and another machine without private claim state needs manual ownership reconciliation.

## Alternatives Considered

### Alternative 1: Infer identity from the branch or current configuration
- **Pros**: no new artifact format.
- **Cons**: a configuration change can redirect completion to another backlog with the same issue number.
- **Why not**: completion must address the item that started the change, regardless of later configuration edits.

### Alternative 2: Commit identity and claim state together
- **Pros**: every checkout receives the complete state.
- **Cons**: sessions and tokens become stale shared data; another worker could mistake them for current authority.
- **Why not**: claim authority requires fresh provider evidence, while durable item identity must remain useful after the claim ends.
