# discovery-maps Specification

## Purpose
Says where each product's discovery map lives, what the root map holds in a repository with several products, how `lets-shape` picks a run's map, and how a repository gets its second product.

## Requirements

### Requirement: A repository with one product keeps one map
A repository whose `openspec/discovery.md` has no `## Products` heading SHALL have one product. Its map SHALL be `openspec/discovery.md`, written from the discovery template as today. `lets-shape` SHALL create no `openspec/discovery/` folder for it. It SHALL ask no question about products, unless the idea is a separate thing the repository delivers, apart from the map's product. A new persona or a new journey of the same product SHALL NOT count.

#### Scenario: A discovery run with one product
- **WHEN** `openspec/discovery.md` has personas and journeys and no table of contents, and a discovery run's idea extends a journey the map already has
- **THEN** the run writes its phases to `openspec/discovery.md`, asks no question about products, and creates no `openspec/discovery/` folder

#### Scenario: A new persona of the same product
- **WHEN** `openspec/discovery.md` is titled `Discovery: Web shop`, and the idea adds a gift-card journey for a new persona, a shop's accountant, in the same web shop
- **THEN** the run writes its phases to `openspec/discovery.md`, and asks no question about products

#### Scenario: A known persona on a new product's journey
- **WHEN** `openspec/discovery.md` is titled `Discovery: Web shop` and has the persona Mo, and the idea is a warehouse app that Mo would use, on a journey the map does not have
- **THEN** `lets-shape` asks whether the idea belongs to the web shop or to a new product, and writes no map before the answer

#### Scenario: A first discovery
- **WHEN** no `openspec/discovery.md` exists and a discovery run starts
- **THEN** the Ingest checkpoint creates `openspec/discovery.md` from the discovery template, with no `## Products` heading, in the same step that writes the parent's `Map: openspec/discovery.md`

#### Scenario: A first discovery resumes at Personas
- **WHEN** a first discovery stopped after Ingest, and Resume mode picks up its parent, which says `Map: openspec/discovery.md` and `next phase: personas`
- **THEN** `openspec/discovery.md` exists, and Resume mode writes the Personas section to it and does not stop

### Requirement: Each product has a map of its own when there are several
In a repository with two or more products, each product's map SHALL be `openspec/discovery/<product>.md`, where `<product>` is the product's kebab-case name. Each product's map SHALL use the discovery template, and SHALL hold every journey of that product, including the journeys of personas it shares.

#### Scenario: Two products
- **WHEN** the root map lists the products `web-shop` and `warehouse`
- **THEN** their maps are `openspec/discovery/web-shop.md` and `openspec/discovery/warehouse.md`, and each holds its own `## Journey Map`

### Requirement: The root map lists the products
In a repository with two or more products, `openspec/discovery.md` SHALL be the root map, written from the table-of-contents template. Its `## Products` heading SHALL mark the repository as one with several products. Under that heading, it SHALL list each product with what it covers and a link to its map. It SHALL hold the personas that more than one product shares, and SHALL hold no journey.

#### Scenario: The root of two products
- **WHEN** a repository has the products `web-shop` and `warehouse`
- **THEN** `openspec/discovery.md` has a `## Products` heading, a row for each product that links `discovery/web-shop.md` and `discovery/warehouse.md`, and has no `## Journey Map` section

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
A discovery run SHALL pick its map in Ingest, before it writes a phase. Revision mode SHALL pick its map from what the user brings, before its step 1: before it reads a thread or re-annotates a stage. When the root map has a table of contents and the idea clearly fits one product, `lets-shape` SHALL use that product's map and tell the user which one. When it cannot tell, it SHALL ask the user, offering each listed product and a new product, and SHALL write no map until the user answers. The question about products SHALL be a confirmation question, with no recommendation, so that `lets-go` at `auto` puts it to the user.

#### Scenario: The idea fits one product
- **WHEN** the root lists `web-shop` and `warehouse`, and the idea is about the checkout page that `web-shop` covers
- **THEN** `lets-shape` says the run uses `openspec/discovery/web-shop.md`, and asks no question about products

#### Scenario: The idea fits no product clearly
- **WHEN** the root lists `web-shop` and `warehouse`, and the idea is about stock alerts that both could cover
- **THEN** `lets-shape` asks which product the idea belongs to, offering `web-shop`, `warehouse` and a new product, and writes no map before the answer

#### Scenario: Revision mode picks before it reconciles
- **WHEN** a Revision mode run starts in a repository whose root lists `web-shop` and `warehouse`, and the user brings changed priorities for stock alerts
- **THEN** `lets-shape` settles the run's map before it fetches the thread of any issue the map links, and before it changes any stage

### Requirement: A second product moves the map with the user's yes
When a run's idea belongs to a new product, and the repository has one product, `lets-shape` SHALL propose kebab-case names for both products. It SHALL take them from the map's title and the idea. It SHALL show the user the move: the existing map's new path, `openspec/discovery/<first-product>.md`, and the root's table of contents. The move question SHALL be a confirmation question, with no recommendation. On a no, the run SHALL keep using `openspec/discovery.md`, and SHALL move nothing.

On a yes, `lets-shape` SHALL write the files first. It SHALL move the map to `openspec/discovery/<first-product>.md`, and write `openspec/discovery.md` from the table-of-contents template. It SHALL create `openspec/discovery/<new-product>.md` from the discovery template. Then it SHALL retarget each open parent issue whose map is the root. It SHALL find the parents with `gh issue list --state open --search '"Input:" in:body' --json number,title,body`, and keep each whose body has no `Map:` line or says `Map: openspec/discovery.md`. Each gets `Map: openspec/discovery/<first-product>.md`. When an issue update fails, `lets-shape` SHALL stop, and name each parent it has not retargeted.

#### Scenario: The user says yes
- **WHEN** `openspec/discovery.md` is titled `Discovery: Web shop`, the idea is a warehouse app for staff, and the user says yes to the names `web-shop` and `warehouse`
- **THEN** the old map's content is at `openspec/discovery/web-shop.md`, `openspec/discovery.md` lists `web-shop` and `warehouse`, `openspec/discovery/warehouse.md` exists, and the run writes its phases to it

#### Scenario: The new product's discovery resumes at Personas
- **WHEN** the move was made at Ingest, the run stopped, and Resume mode picks up its parent, which says `Map: openspec/discovery/warehouse.md` and `next phase: personas`
- **THEN** `openspec/discovery/warehouse.md` exists, and Resume mode writes the Personas section to it and does not stop

#### Scenario: The move at auto
- **WHEN** the user ran `lets-go auto` with a warehouse idea, and the shape step asks the move question
- **THEN** the question carries no recommendation, `lets-go` puts it to the user, and no file moves before the user answers

#### Scenario: An open parent with no Map line
- **WHEN** the user says yes to the move, and the open parent `Epic: checkout` has `Input:` and no `Map:` line
- **THEN** `Epic: checkout` then holds `Map: openspec/discovery/web-shop.md`

#### Scenario: An open parent that names the root
- **WHEN** the user says yes to the move, and the open parent `Epic: returns` says `Discovery status: in-progress` and `Map: openspec/discovery.md`
- **THEN** `Epic: returns` then holds `Map: openspec/discovery/web-shop.md`, and no longer holds `Map: openspec/discovery.md`

#### Scenario: An issue update fails
- **WHEN** the files are written, `Epic: checkout` is retargeted, and the update of `Epic: returns` fails
- **THEN** `lets-shape` stops, and says that `Epic: returns` still points at the root

#### Scenario: The user says no
- **WHEN** the user says no to the move
- **THEN** no file moves, no `openspec/discovery/` folder exists, and the run writes its phases to `openspec/discovery.md`

### Requirement: A later product gets a map of its own
When a run's idea belongs to a new product, and the root map already lists two or more products, `lets-shape` SHALL propose a kebab-case name for it. It SHALL refuse a name whose map path, `openspec/discovery/<product>.md`, already exists, and ask for another. On the user's yes, it SHALL add the product's row to the root's table of contents, and create its map from the discovery template. It SHALL change no other product's map.

#### Scenario: A third product
- **WHEN** the root lists `web-shop` and `warehouse`, and the user says yes to the name `supplier-portal`
- **THEN** the root has a third row that links `discovery/supplier-portal.md`, the file exists with the discovery template's headings, and `openspec/discovery/web-shop.md` and `openspec/discovery/warehouse.md` are unchanged

#### Scenario: A name that is taken
- **WHEN** the user proposes the name `warehouse` for a new product, and `openspec/discovery/warehouse.md` exists
- **THEN** `lets-shape` says the name is taken, asks for another, and writes no file

### Requirement: A parent whose map file is missing stops the run
This holds in every repository, whatever the root map holds. When Resume mode or Finalize reads a parent whose `Map:` line names a file that does not exist, `lets-shape` SHALL write no map and create no file. It SHALL say the file is missing. It SHALL say that the map may be on a branch this checkout does not have yet, or may have been discarded. It SHALL say to bring the map into this checkout, or to correct the parent's `Map:` line. Then it SHALL stop.

#### Scenario: A map this checkout does not have
- **WHEN** a parent says `Map: openspec/discovery/warehouse.md`, the checkout's `openspec/discovery.md` has no table of contents, and `openspec/discovery/warehouse.md` does not exist
- **THEN** `lets-shape` says `openspec/discovery/warehouse.md` is missing, writes and creates no file, and stops

### Requirement: A parent that points at the root is repaired with the user when there are several products
In a repository whose root map lists products, a parent points at the root when it has no `Map:` line or says `Map: openspec/discovery.md`. When Resume mode or Finalize reads such a parent, `lets-shape` SHALL write no map. It SHALL ask the user which product the parent belongs to. On the answer, it SHALL write that product's `Map:` line to the parent, and go on with that map.

#### Scenario: A parent the move did not retarget
- **WHEN** the root lists `web-shop` and `warehouse`, and Resume mode picks up `Epic: returns`, which says `Map: openspec/discovery.md`
- **THEN** `lets-shape` asks which product `Epic: returns` belongs to, writes nothing to `openspec/discovery.md`, and on the answer `web-shop` writes `Map: openspec/discovery/web-shop.md` to `Epic: returns`

### Requirement: A parent issue names its map
Every parent issue that a discovery run creates SHALL hold a `Map: <path>` line beside its `Input:` line, with the path of the run's map from the repository root. Finalize SHALL keep the line, and so SHALL the body replacement when the whole run fits one story. In a repository with one product, a parent issue with no `Map:` line SHALL mean `openspec/discovery.md`. Resume mode SHALL read the parent's map from that line, and SHALL write its phases there. The one edit it SHALL make to another product's map is the link that replaces a persona's entry when the persona moves to the root.

#### Scenario: A parent that becomes one story
- **WHEN** Phase 5 finds the whole run fits one story, and the parent says `Map: openspec/discovery/warehouse.md`
- **THEN** the story's new body still holds `Map: openspec/discovery/warehouse.md`

#### Scenario: A new parent with one product
- **WHEN** a discovery run creates its parent issue in a repository with one product
- **THEN** the parent holds `Map: openspec/discovery.md`

#### Scenario: Resume reads the Map line
- **WHEN** Resume mode picks up a parent that says `Map: openspec/discovery/warehouse.md`
- **THEN** it writes its phases to `openspec/discovery/warehouse.md`, and edits no other product's map

#### Scenario: A resumed run that adopts a shared persona
- **WHEN** Resume mode picks up a parent that says `Map: openspec/discovery/warehouse.md` and `next phase: personas`, and the user agrees that warehouse serves Mo, whose entry is in `openspec/discovery/web-shop.md`
- **THEN** Mo's entry is in `openspec/discovery.md`, and the only change to `openspec/discovery/web-shop.md` is that Mo's entry became a link to the root

#### Scenario: An older parent
- **WHEN** Resume mode picks up a parent that has `Input:` and no `Map:` line, in a repository with one product
- **THEN** it reads and writes `openspec/discovery.md`

### Requirement: Revision mode checks links in every map
Revision mode's stale-link check SHALL cover the root map and every product's map. Its thread reads, its re-annotation of stages and its freshness line SHALL cover only the run's map.

#### Scenario: A closed link in another product's map
- **WHEN** a Revision mode run uses `openspec/discovery/web-shop.md`, and `openspec/discovery/warehouse.md` links the closed issue #40
- **THEN** the run re-checks #40's stage and fixes the link, and does not change the freshness line or re-annotate any other stage of `openspec/discovery/warehouse.md`

### Requirement: Shape one issue reads its product's map
When Shape one issue uses persona and journey names, it SHALL read the map of the issue's product and the shared personas in the root map. It SHALL pick the product from the listed products only, and SHALL never offer a new one. When no listed product fits, it SHALL use no map's names. It SHALL edit no map.

#### Scenario: A story with a shared persona
- **WHEN** Shape one issue shapes a story for `warehouse`, and its persona Mo is shared
- **THEN** the packet's **Persona served** names Mo, and no map file changes

#### Scenario: A story no product fits
- **WHEN** the root lists `web-shop` and `warehouse`, and Shape one issue shapes a story that fits neither
- **THEN** it offers no new product, the packet names no persona or journey from a map, and no map file changes
