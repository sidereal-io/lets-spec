---
id: adr-026
date: 2026-11-13
status: accepted
title: 'ADR-026: A repository''s own lets settings live in a lets block of openspec/config.yaml'
description: Architecture decision record (ADR) for keeping settings that belong to one repository, such as its backlog provider, in a namespaced lets block of the project's openspec/config.yaml, while settings that belong to a person stay in the user config file
---

# ADR-026: A repository's own lets settings live in a `lets:` block of `openspec/config.yaml`

> Builds on [ADR-011](ADR-011-one-config-file-shaped-like-the-commands.md), which keeps every setting that belongs to a person in one user file, `~/.config/lets/config.yaml`. This record covers settings that belong to a repository instead.

## Context

Some settings are the same for everyone who works in a repository, whoever they are and whatever machine they use. The backlog provider is one: a repository's backlog is on GitHub, or in Jira, for the whole team. The user file in ADR-011 is per person and per machine, so a setting there would have to be copied by every contributor, and would differ when one of them forgot. Every project that uses lets already has `openspec/config.yaml`, which is committed, read by every clone and owned by the project. OpenSpec reads only the keys it knows from that file and ignores the rest.

## Decision

A setting that belongs to the repository lives in `openspec/config.yaml`, under one top-level `lets:` block. Within it, each setting sits at the path of the command group that reads it, as in ADR-011: the backlog provider is `lets.backlog.provider`. A setting that belongs to a person, such as which model or harness to delegate to, stays in the user file. An absent project setting has a default that keeps today's behavior.

## Consequences

- Easier: one commit sets the backlog provider for every contributor and every clone, and code review sees the change.
- Easier: a new repository setting has an obvious home: a key in the `lets:` block, at its command's path.
- Easier: no new file is added to the repository.
- Harder: lets now reads two config files, and each setting has to be put in the right one: whether it belongs to the repository or to a person.
- Harder: lets reads `openspec/config.yaml` with a line reader, not a YAML parser, so it understands only block style. A flow-style `lets:` block is not read.
- Harder: a person cannot override a repository setting from their user file.

## Alternatives Considered

### Alternative 1: Put the backlog provider in the user file
- **Pros**: one config file, as ADR-011 has it, and no second reader.
- **Cons**: every contributor must set it on every machine, and nothing stops two people in one repository from using different backlog providers.
- **Why not**: the backlog provider is a fact about the repository. A per-person file cannot hold a fact that must be the same for everyone.

### Alternative 2: A file of lets's own in the repository, such as `.lets.yaml`
- **Pros**: lets owns the whole file and can use any shape, and OpenSpec never sees it.
- **Cons**: one more file at the root of every project, beside a config file the project already commits.
- **Why not**: `openspec/config.yaml` already belongs to the planning setup lets manages, OpenSpec ignores keys it does not know, and `lets sync` already reads and checks the file.
