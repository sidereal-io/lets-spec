## Why

Specs and glossaries already work in a monorepo (`docs/monorepo.md`). Discovery doesn't: `lets-shape` and `lets-go` both write to one fixed path, `openspec/discovery.md`, so a repository with several products mixes all their personas and journeys in one map (#238).

## What Changes

- A repository with one product keeps `openspec/discovery.md` exactly as today, and is asked nothing new (D3).
- With two or more products, each product has its own map at `openspec/discovery/<product>.md`. The root `openspec/discovery.md` becomes a table of contents. It lists each product, what it covers and the path to its map, and holds the personas that more than one product shares (D2, D5). A product's map links to a shared persona instead of copying it, and keeps every journey, a shared persona's too (D4).
- `lets-shape` picks a discovery run's map from the root's table of contents. It asks which product only when it can't tell (D7).
- When a second product arrives, `lets-shape` proposes names for both products, and asks for a yes. Then it moves the existing map to `openspec/discovery/<first-product>.md`, writes the table of contents, and points each open parent issue whose map is the root at the first product's map (D8). A later product adds a row and a map, and moves nothing. A parent whose map is missing is repaired with the user on its next Resume or Finalize.
- Every new parent issue names its map with a `Map:` line beside `Input:`. A parent with no `Map:` line means `openspec/discovery.md` (D6). Resume mode and Revision mode read it.
- Revision mode's stale-link check covers every map. Thread reads and re-annotation cover the run's map only (D9). Shape one issue reads its product's map and the root's shared personas, and edits neither (D11).
- `lets-go` checks for uncommitted edits to `openspec/discovery.md` and `openspec/discovery/` before the shape step. After Claim, it commits every changed map in its one discovery-map commit (D10).
- A new template for the root's table of contents. `docs/monorepo.md` and the README's *Monorepos* section explain discovery maps.
- The glossary defines Product and Discovery map (D1, D2). Both entries are already committed on this branch.

Out of scope: maps keyed by spec domain or nested under `openspec/specs/`, and products declared in `openspec/config.yaml` (D12).

## Capabilities

### New Capabilities
- `discovery-maps`: where a discovery run's map lives, how `lets-shape` picks it, what the root map holds, how a repository gets its second product, and how parent issues name their map.

### Modified Capabilities
- `lets-go`: *lets-go commits the discovery map on the story's branch* checks and commits every discovery map path, not only `openspec/discovery.md`. *The shape step shapes an idea or an unshaped issue* lets the shape step end with any discovery map changed, not only `openspec/discovery.md`.
- `issue-comments`: *Revision mode reads the thread of each open story the map links* reads the stories that the run's map links, not those that every map links.

## Impact

- `skills/lets-shape/SKILL.md`: *The map*, *Locate the discovery*, Ingest and the phase checkpoints, *Shape one issue*, *Resume mode* and *Revision mode*. Open story #231 (shape-checkpoints) edits the same file, so whichever merges second must rebase.
- `skills/lets-shape/templates/`: a new table-of-contents template, the discovery template's shared-persona link, and the parent issue's `Map:` line.
- `skills/lets-go/references/shape.md` and the lines of `skills/lets-go/SKILL.md` that name `openspec/discovery.md`.
- `docs/monorepo.md` and `README.md`.
- `tests/skill-interfaces.bats`, which pins the skills' wording.
- No code in `lets/` changes, and nothing new is added to `openspec/config.yaml`.
