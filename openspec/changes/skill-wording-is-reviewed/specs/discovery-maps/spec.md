<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The root map lists the products
In a repository with two or more products, `openspec/discovery.md` SHALL be the root map, written from the table-of-contents template. Its `## Products` heading SHALL mark the repository as one with several products. Under that heading, it SHALL list each product with what it covers and a link to its map. It SHALL hold the personas that more than one product shares, and SHALL hold no journey.

#### Scenario: The root of two products
- **WHEN** a repository has the products `web-shop` and `warehouse`
- **THEN** `openspec/discovery.md` has a `## Products` heading, a row for each product that links `discovery/web-shop.md` and `discovery/warehouse.md`, and has no `## Journey Map` section

#### Scenario: The template exists
- **WHEN** a reader reads `skills/lets-shape/templates/`
- **THEN** the reader finds a table-of-contents template that the skill links
