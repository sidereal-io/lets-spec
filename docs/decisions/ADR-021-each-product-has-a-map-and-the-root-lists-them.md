---
id: adr-021
date: 2026-11-10
status: accepted
title: 'ADR-021: Each product has a discovery map of its own, and the root map lists them'
description: Architecture decision record (ADR) for where a monorepo keeps its discovery maps
---

# ADR-021: Each product has a discovery map of its own, and the root map lists them

## Context

A discovery map records the personas a product serves and the journeys they walk. A repository with one product keeps it at `openspec/discovery.md`. A monorepo can hold several products, each with people and journeys of its own, and one map mixes them. Specs in a monorepo are already grouped by domain under `openspec/specs/`, but a domain often follows a code layer, such as `backend`, and one product's journey can cross several layers. OpenSpec's `config.yaml` has no key that lists products.

## Decision

With two or more products, each product's map is `openspec/discovery/<product>.md`. The root `openspec/discovery.md` becomes the list of products: a `## Products` table that gives each product, what it covers and the path to its map. It also holds the personas more than one product shares, and no journeys. A repository with one product keeps its single `openspec/discovery.md` unchanged.

## Consequences

- Easier: each product's map stays the size of its own personas and journeys. A reader finds every map from one file. A single-product repository sees no change.
- Easier: no config or tool has to know the products. The file a person reads is also the list the skills read.
- Harder: the skills must pick the right map for each run and ask when they cannot tell. A wrong pick puts personas in the wrong file.
- Harder: moving to this layout rewrites `openspec/discovery.md` and creates new files in users' repositories. Undoing it later means merging maps back by hand, and finding every parent issue that names a product's map.

## Alternatives Considered

### Alternative 1: One map for each spec domain, under `openspec/specs/`
- **Pros**: reuses the folders monorepos already have, and needs no new list.
- **Cons**: a domain is often a code layer, so one product's journey would be split across the `backend` and `frontend` maps.
- **Why not**: a journey must show a persona's full path in one place, and domains cut that path apart.

### Alternative 2: Declare the products in `openspec/config.yaml`
- **Pros**: tools could read the list without parsing Markdown.
- **Cons**: OpenSpec's config has no such key, so the list would go into free-text `context`, which nothing validates. The list and the map files could drift.
- **Why not**: no tool needs the list, and a second source of truth beside the root map would drift from it.

### Alternative 3: Keep one map, with a section for each product
- **Pros**: no new files and no move.
- **Cons**: the file grows with every product, and personas, journeys and stage annotations of unrelated products sit side by side.
- **Why not**: it is the problem this decision exists to solve.
