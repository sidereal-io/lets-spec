---
id: adr-025
date: 2026-11-13
status: accepted
title: 'ADR-025: A backlog item is named by an opaque key that only its backlog provider reads'
description: Architecture decision record (ADR) for naming every backlog item by a string key that lets passes through unparsed, with a separate label for people, so shared backlog code never depends on one backlog provider's ID format
---

# ADR-025: A backlog item is named by an opaque key that only its backlog provider reads

> Builds on [ADR-021](ADR-021-where-an-outside-command-runs.md): backlog calls run in lets code through an adapter, with shared rules written once outside every adapter.

## Context

`lets backlog` named every item by a GitHub issue number, an integer. The shared code depended on that: it parsed arguments as whole numbers, ranked ties by the lowest number, and the skills wrote `#<i>` in what they showed people. Other backlog providers name items differently. Jira and Linear use a project or team key and a number, such as `PROJ-12` or `ENG-42`, and the number alone repeats across projects. Beads uses a short hash, such as `bd-a1b2`, with no number at all. A Jira issue's key also changes when the issue moves to another project.

## Decision

Every backlog item is named by a `key`: a string in the backlog provider's own form, such as `"136"` or `"PROJ-12"`. lets passes it to the adapter unchanged and never takes it apart. Only the backlog provider decides whether some text is one of its keys. Each item also carries a `label`, the way the backlog provider writes the ID for people, such as `"#136"` or `"PROJ-12"`. Shared code needs an order between items, so it uses data the adapter reports, such as creation time, never the key.

## Consequences

- Easier: a new backlog provider brings its own key form, and the shared ranking, claim and release code works unchanged.
- Easier: the skills never need to know a key's form. They pass `key` to commands and show `label` to people.
- Easier: an argument the backlog provider cannot use is `not-found` from that backlog provider, with one rule for every backlog provider.
- Harder: lets cannot check a key's form before it asks the backlog provider, so a typo costs a lookup, or a call to its key parser.
- Harder: every result carries two fields for one ID, and each caller must use the right one.
- Harder: an order between items needs data each adapter must supply, such as a creation time, rather than coming free from the ID.

## Alternatives Considered

### Alternative 1: Keep a number, and add a prefix per backlog provider
- **Pros**: GitHub's results stay as they were, and numbers sort without help from the adapter.
- **Cons**: Beads IDs have no number. Jira keys change when an issue moves, so a stored prefix goes stale, and lets would have to rebuild every backlog provider's form from parts.
- **Why not**: the shared code would then hold every backlog provider's ID format. That is the coupling the adapter boundary exists to prevent.

### Alternative 2: A structured key, such as `{ project, number }`
- **Pros**: lets could sort and group items without asking the adapter.
- **Cons**: each backlog provider's form has a different shape, and the skills would have to build the text people type from those parts.
- **Why not**: no shared rule needs the parts. The only things lets does with a key are pass it back and show it, which a string and a label already cover.
