---
id: adr-026
date: 2026-11-18
status: accepted
title: "ADR-026: A repository's lets config sits beside the user's and wins, leaf by leaf"
description: Architecture decision record (ADR) for letting a repository commit .lets/config.yaml, shaped like the user's lets config, whose values win over the user's at every leaf
---

# ADR-026: A repository's lets config sits beside the user's and wins, leaf by leaf

> Builds on [ADR-011](ADR-011-one-config-file-shaped-like-the-commands.md): lets keeps its settings in one file per user, with one section per command group. This record adds a second file, committed in the repository, with the same shape.

## Context

Each person writes the user's lets config, `~/.config/lets/config.yaml`, by hand on each machine. Some settings belong to the repository, not the person: the backlog provider is the first. When only the user's file can set it, every contributor must set it on every machine, and two people on one repository can disagree. OpenSpec's `openspec/config.yaml` is committed in the repository, but it is OpenSpec's file, and lets keeps its settings out of it. Where a repository's settings live, and how they combine with the user's, is a contract with every repository that commits them. Changing either later breaks those repositories.

## Decision

A repository may commit a repository's lets config at `.lets/config.yaml` in its root, which lets finds with `git rev-parse --show-toplevel`. It takes every key the user's lets config takes, with the same `version` and the same checks. lets merges the two files: where both hold a mapping, the mappings merge, at every depth; anywhere else, a value in the repository's file replaces the user's whole, and a null or absent value leaves the user's in place. Each message about a bad value names the file that value came from.

## Consequences

- Easier: one commit sets a setting for every contributor and clone. A team that keeps its backlog outside GitHub sets the backlog provider once.
- Easier: one shape to learn. A key moves between the two files unchanged, and a new setting needs no decision about which file may hold it.
- Easier: a person keeps their own settings for everything the repository leaves unset, down to a single guidance string.
- Harder: a person cannot override a setting the repository commits. To differ, they change the repository's file or work without it.
- Harder: the repository can set personal settings too, such as `delegate.resolvers` and `go.questions`. A committed chain may name a resolver that some machines cannot run; it declines there, and lets asks the next.
- Harder: a repository's guidance reaches the prompts of agents run in it. That is the trust a repository's own agent instructions already have, and `delegate.resolvers` can name only resolvers built into lets.
- Harder: every command that reads the config runs Git once to find the root, and the readers must know which file each value came from.

## Alternatives Considered

### Alternative 1: A `lets:` block in `openspec/config.yaml`
- **Pros**: no new file; the repository already commits it.
- **Cons**: it is OpenSpec's file. Its format and checks belong to OpenSpec, which may change them or reject keys it does not know.
- **Why not**: lets would depend on another tool's file format for its own contract, and the block's shape would differ from the user's file.

### Alternative 2: Only repository settings in the repository's file
- **Pros**: a repository cannot set what is personal, such as the resolver chain or the question mode.
- **Cons**: two files with two shapes, and a list of which keys each may hold that every new setting must extend.
- **Why not**: deciding per key which file may hold it is a judgment each team makes differently. One shape lets a team commit what it agrees on.

### Alternative 3: Replace whole sections
- **Pros**: a simpler rule: a `delegate:` in the repository's file replaces the user's whole `delegate:`.
- **Cons**: setting one guidance string in the repository erases every other guidance and the chain the user wrote.
- **Why not**: a repository rarely sets a whole section, so the user would lose settings the repository never meant to touch.

### Alternative 4: The user's file wins
- **Pros**: a person always has the last word on their own machine.
- **Cons**: a stale user setting silently beats the team's choice, such as an old backlog provider.
- **Why not**: the settings that need a repository file, such as the backlog provider, must agree across everyone on the repository.
