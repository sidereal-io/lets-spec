## Context

- Discovery is all skill prose. `lets-shape` writes the map, and `lets-go`'s `references/shape.md` checks and commits it. No code in `lets/` reads a discovery map, so this change edits only skills, templates, docs, specs and tests.
- `openspec/discovery.md` is written as a literal path in `lets-shape` (*The map*, *Locate the discovery*, the phase checkpoints, *Shape one issue* step 5, *Revision mode*'s stale-link command) and in `lets-go` (*Run the shape step* step 1, the stop note, *Commit the discovery map*, the shape prompt's clean-tree exception).
- `tests/skill-interfaces.bats` pins skill wording with `skill_says` and `skill_does_not_say`. Specs name the sentences it checks.
- Open story #231 (shape-checkpoints) rewrites parts of `skills/lets-shape/SKILL.md`, chiefly the phase checkpoints and the glossary sections.

## Goals / Non-Goals

**Goals:**

- One rule for finding the run's map, written once in `lets-shape` and used by every mode.
- A single-product repository reads exactly the same skill path as today, with one extra check that finds no table of contents.
- Keep edits to sections #231 touches small, so a rebase is mechanical.

**Non-Goals:**

- No `lets` command or config key that resolves a map path.
- No automatic split of an existing monorepo's map: the move happens only when a run brings a second product.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. New tests pin the sentences, paths and commands the specs name, in `lets-shape`, its templates and `lets-go`'s `references/shape.md`.
- **Existing seams reused:** the `skill_says`, `skill_does_not_say` and section helpers in that file. `mise run check` validates the change's specs.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `lets-shape` (every mode), its templates, `lets-go`'s shape reference and shape prompt, `docs/monorepo.md`, `README.md`. It changes where user repositories keep files, but only for a repository that gets a second product.

## Decisions

1. **The root map's `## Products` heading marks a monorepo.** The table-of-contents template opens with `## Products`, a table with the columns Product, Covers and Map. `lets-shape` reads `openspec/discovery.md`. With no `## Products` heading, the repository has one product and that file is its map. Alternatives: the existence of `openspec/discovery/`, which a stray folder could fake; or a config key, which OpenSpec's config does not have (D12). A heading is visible to the person reading the file, and costs one grep.
2. **One new section, *Pick the map*, in `lets-shape`, after *Locate the discovery*.** It holds D7's rule, D8's move (as a subsection, *Add a second product*) and D6's `Map:` default. Ingest, Resume mode, Revision mode and Shape one issue each link to it instead of naming `openspec/discovery.md`. Every mode then uses one rule. Putting the move in a new section keeps it out of the phase text that #231 rewrites. In the existing sections, "`discovery.md`" becomes "the run's map".
3. **New template `skills/lets-shape/templates/discovery-root-template.md`.** It has `# Discovery: <repository name>`, `## Products`, and `## Shared personas` with the same audience groups and `####` entries as the discovery template. It has no `## Journey Map`. Links are relative, such as `discovery/web-shop.md`, so they work on GitHub and locally.
4. **A shared persona in a product's map is a one-line entry.** Under its audience group: `#### <Persona name> — shared`, then `See [<Persona name>](../discovery.md#<anchor>) in the root map.` The discovery template gets this as an optional example. The Personas checkpoint moves an entry to the root when a second product adopts it (D5), and leaves the link line behind.
5. **The parent template gets `> Map: <path>` as its second quoted line,** under `> Input:`. Finalize already keeps `Input:`, and keeps `Map:` the same way. The path is repository-relative.
6. **The stale-link check reads every map with one command.** `grep -rhoE 'issues/[0-9]+' <root>/openspec/discovery.md <root>/openspec/discovery 2>/dev/null` replaces the single-file grep. The rest of the pipeline is unchanged. With one product, the missing folder adds no output.
7. **`lets-go` uses the two map paths as a pathspec.** The dirty check is `git status --porcelain -- openspec/discovery.md openspec/discovery`. The commit is `git add -A -- openspec/discovery.md openspec/discovery` and then `git commit -m "docs: the discovery map from #<parent>" -- openspec/discovery.md openspec/discovery`. `-A` takes the new files of a move. The pathspec still commits no other path.
8. **ADR.** Each product's map is at `openspec/discovery/<product>.md`, and the root map is the list of products. This is costly to reverse, because users' repositories will hold these files. The ADR step records it.

## Risks / Trade-offs

- [#231 and this change both edit `skills/lets-shape/SKILL.md`] → Keep the new rules in new sections (Decision 2), and keep the edits to existing lines to path wording. Whichever merges second rebases.
- [An agent puts an idea in the wrong product] → D7 says to name the chosen map to the user every time, and to ask when it is unclear. The Ingest confirmation is where the user catches it.
- [A parent filed before this change, in a monorepo made later, points nowhere] → D8 adds `Map:` lines to open parents at the move. A closed parent needs none, because nothing resumes it.
- [A product name changes later] → Out of scope. Renaming is a file move plus a table edit, which a person can do by hand.

## Migration & Rollback

N/A for existing repositories: a single-product repository changes nothing, and none has product maps yet. This repository keeps its one `openspec/discovery.md`. Rollback is a revert of the change's commits. A repository that already split its map would keep its files, and a person would merge them back by hand.
