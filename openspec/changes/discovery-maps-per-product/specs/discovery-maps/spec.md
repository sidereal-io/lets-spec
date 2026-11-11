## Purpose

Says where each product's discovery map lives, what the root map holds in a repository with several products, how `lets-shape` picks a run's map, and how a repository gets its second product.

## ADDED Requirements

### Requirement: A repository with one product keeps one map
A repository whose root map has no table of contents SHALL have one product. Its map SHALL be `openspec/discovery.md`, written from the discovery template as today. `lets-shape` SHALL create no `openspec/discovery/` folder for it, and SHALL ask no question about products unless the run's idea serves people or journeys that the map's product does not.

#### Scenario: A discovery run with one product
- **WHEN** `openspec/discovery.md` has personas and journeys and no table of contents, and a discovery run's idea serves a persona the map already has
- **THEN** the run writes its phases to `openspec/discovery.md`, asks no question about products, and creates no `openspec/discovery/` folder

#### Scenario: A first discovery
- **WHEN** no `openspec/discovery.md` exists and a discovery run starts
- **THEN** the run creates `openspec/discovery.md` from the discovery template, with no table of contents

### Requirement: Each product of a monorepo has a map of its own
In a repository with two or more products, each product's map SHALL be `openspec/discovery/<product>.md`, where `<product>` is the product's kebab-case name. Each product's map SHALL use the discovery template, and SHALL hold every journey of that product, including the journeys of personas it shares.

#### Scenario: Two products
- **WHEN** the root map lists the products `web-shop` and `warehouse`
- **THEN** their maps are `openspec/discovery/web-shop.md` and `openspec/discovery/warehouse.md`, and each holds its own `## Journey Map`

### Requirement: The root map lists the products
In a repository with two or more products, `openspec/discovery.md` SHALL be the root map, written from the table-of-contents template. It SHALL list each product with what it covers and a link to its map. It SHALL hold the personas that more than one product shares, and SHALL hold no journey.

#### Scenario: The root of two products
- **WHEN** a repository has the products `web-shop` and `warehouse`
- **THEN** `openspec/discovery.md` has a row for each product that links `discovery/web-shop.md` and `discovery/warehouse.md`, and has no `## Journey Map` section

#### Scenario: The template exists
- **WHEN** the skill-interfaces test reads `skills/lets-shape/templates/`
- **THEN** it finds a table-of-contents template that the skill links

### Requirement: A shared persona lives in the root
When a second product adopts a persona that one product's map holds, `lets-shape` SHALL move the persona's entry to the root map. Each product map that serves the persona SHALL then name it with a link to the root entry and hold no copy of the entry. A persona that only one product serves SHALL stay in that product's map.

#### Scenario: A second product adopts a persona
- **WHEN** the `warehouse` run reuses the persona Mo, whose entry is in `openspec/discovery/web-shop.md`
- **THEN** Mo's entry is in `openspec/discovery.md`, and both product maps name Mo with a link to that entry and hold none of its **Who**, **Goal**, **Pain today** or **Success looks like** lines

#### Scenario: A persona one product serves
- **WHEN** only `web-shop` serves the persona Ada
- **THEN** Ada's entry stays in `openspec/discovery/web-shop.md`, and the root map does not name Ada

### Requirement: lets-shape picks the run's map
A discovery run and a Revision mode run SHALL pick their map in Ingest, before they write a phase. When the root map has a table of contents and the idea clearly fits one product, `lets-shape` SHALL use that product's map and tell the user which one. When it cannot tell, it SHALL ask the user, offering each listed product and a new product, and SHALL write no map until the user answers.

#### Scenario: The idea fits one product
- **WHEN** the root lists `web-shop` and `warehouse`, and the idea is about the checkout page that `web-shop` covers
- **THEN** `lets-shape` says the run uses `openspec/discovery/web-shop.md`, and asks no question about products

#### Scenario: The idea fits no product clearly
- **WHEN** the root lists `web-shop` and `warehouse`, and the idea is about stock alerts that both could cover
- **THEN** `lets-shape` asks which product the idea belongs to, offering `web-shop`, `warehouse` and a new product, and writes no map before the answer

### Requirement: A second product moves the map with the user's yes
When a run's idea belongs to a new product, and the repository has one product, `lets-shape` SHALL propose kebab-case names for both products, taken from the map's title and the idea. It SHALL show the move: the existing map's new path, `openspec/discovery/<first-product>.md`, and the root's table of contents. On the user's yes, it SHALL move the map, write the root from the table-of-contents template, and add `Map: openspec/discovery/<first-product>.md` to each open parent issue that has no `Map:` line. On a no, the run SHALL keep using `openspec/discovery.md`, and SHALL move nothing.

#### Scenario: The user says yes
- **WHEN** `openspec/discovery.md` is titled `Discovery: Web shop`, the idea is a warehouse app for staff, and the user says yes to the names `web-shop` and `warehouse`
- **THEN** the old map's content is at `openspec/discovery/web-shop.md`, `openspec/discovery.md` lists `web-shop` and `warehouse`, and the run writes its phases to `openspec/discovery/warehouse.md`

#### Scenario: An open parent with no Map line
- **WHEN** the user says yes to the move, and the open parent `Epic: checkout` has `Input:` and no `Map:` line
- **THEN** `Epic: checkout` then holds `Map: openspec/discovery/web-shop.md`

#### Scenario: The user says no
- **WHEN** the user says no to the move
- **THEN** no file moves, no `openspec/discovery/` folder exists, and the run writes its phases to `openspec/discovery.md`

### Requirement: A parent issue names its map
Every parent issue that a discovery run creates SHALL hold a `Map: <path>` line beside its `Input:` line, with the path of the run's map from the repository root. Finalize SHALL keep the line. A parent issue with no `Map:` line SHALL mean `openspec/discovery.md`. Resume mode SHALL read the parent's map from that line, and SHALL write its phases there.

#### Scenario: A new parent with one product
- **WHEN** a discovery run creates its parent issue in a repository with one product
- **THEN** the parent holds `Map: openspec/discovery.md`

#### Scenario: Resume reads the Map line
- **WHEN** Resume mode picks up a parent that says `Map: openspec/discovery/warehouse.md`
- **THEN** it reads and writes `openspec/discovery/warehouse.md`, and does not edit another product's map

#### Scenario: An older parent
- **WHEN** Resume mode picks up a parent that has `Input:` and no `Map:` line, in a repository with one product
- **THEN** it reads and writes `openspec/discovery.md`

### Requirement: Revision mode checks links in every map
Revision mode's stale-link check SHALL cover the root map and every product's map. Its thread reads, its re-annotation of stages and its freshness line SHALL cover only the run's map.

#### Scenario: A closed link in another product's map
- **WHEN** a Revision mode run uses `openspec/discovery/web-shop.md`, and `openspec/discovery/warehouse.md` links the closed issue #40
- **THEN** the run re-checks #40's stage and fixes the link, and does not change the freshness line or re-annotate any other stage of `openspec/discovery/warehouse.md`

### Requirement: Shape one issue reads its product's map
When Shape one issue uses persona and journey names, it SHALL read the map of the issue's product, picked as a discovery run picks it, and the shared personas in the root map. It SHALL edit neither.

#### Scenario: A story in a monorepo
- **WHEN** Shape one issue shapes a story for `warehouse`, and its persona Mo is shared
- **THEN** the packet's **Persona served** names Mo, and no map file changes
