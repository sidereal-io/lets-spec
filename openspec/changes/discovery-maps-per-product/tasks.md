<!-- Every new test in tests/skill-interfaces.bats is named "discovery maps: <topic>", so each task's verify runs only its own tests.
     Run each verify through the deli, with a long timeout. Edit skills in skills/, never in .agents/skills/. -->

## 1. Templates

- [x] 1.1 [easy] A table-of-contents template, `skills/lets-shape/templates/discovery-root-template.md`, has `# Discovery: <repository name>`, a `## Products` table with the columns Product, Covers and Map, and `## Shared personas` with the discovery template's audience groups, and no `## Journey Map`. The tests read the template file directly (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: root template') (✓ deli -- mise exec -- bats tests/skill-interfaces.bats --filter 'discovery maps: root template' passed)
- [x] 1.2 [easy] The parent issue template holds `> Map: <path>` under `> Input:`, and its finalize note says Finalize and the one-story body replacement keep it. The discovery template shows a shared persona as `#### <Persona name> — shared` with a link line to the root map (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: templates') (✓ deli -- mise exec -- bats tests/skill-interfaces.bats --filter 'discovery maps: templates' passed)

## 2. lets-shape [depends-on: 1]

- [ ] 2.1 [medium] A new *Pick the map* section, after *Locate the discovery*, says that a root with no `## Products` heading is one product, picks a listed product when the idea clearly fits one, and names the map to the user. It asks a confirmation question with no recommendation when it can't tell. A new persona or journey of the same product asks nothing. The Ingest checkpoint creates the run's map file when it writes the parent's `Map:` line. *The map*, Ingest and the Personas and Journey Map checkpoints say "the run's map" instead of `discovery.md` (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: pick the map')
- [ ] 2.2 [medium] An *Add a second product* subsection proposes both names, shows the move and asks a confirmation question with no recommendation. On a yes, it moves the map to `openspec/discovery/<first-product>.md`, writes the root from the template and creates the new product's map. Then it finds parents with `gh issue list --state open --search '"Input:" in:body' --json number,title,body` and retargets each with no `Map:` line or with `Map: openspec/discovery.md`. On a failed update it stops and names the parents left (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: second product')
- [ ] 2.3 [easy] A later product, when the root already lists two or more, refuses a name whose `openspec/discovery/<product>.md` exists, adds its row and creates its map, and changes no other map (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: later product')
- [ ] 2.4 [medium] Resume mode and Finalize read the parent's `Map:` line. A missing named file stops the run, in any repository, and creates no file. With several products, a parent with no `Map:` line or `Map: openspec/discovery.md` makes `lets-shape` ask which product, then write the `Map:` line. Phase 5's one-story body keeps `Map:`. Promoting a shared persona moves its entry to the root and leaves the link in the other map (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: parent map line')
- [ ] 2.5 [medium] Revision mode picks its map before step 1. The stale-link grep reads `<root.path>/openspec/discovery.md` and `<root.path>/openspec/discovery`, and the thread reads, re-annotation and freshness line cover only the run's map, keeping the sentence `Read the thread of each open issue the map links` (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: revision')
- [ ] 2.6 [easy] Shape one issue reads its product's map and the root's shared personas, offers only listed products, uses no map's names when none fits, and edits no map (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: shape one issue')

## 3. lets-go

- [ ] 3.1 [parallel] [medium] A behavior test runs `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, `git add -- <paths>` and `git commit -- <paths>` in a temporary repository, with only `openspec/discovery.md` changed and no folder, then after a move, and checks that each commit holds exactly the listed paths. `references/shape.md`'s dirty check, stop note and *Commit the discovery map* use those commands, name each dirty path, and never pass `openspec/discovery` to `git add` (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: lets-go commit')
- [ ] 3.2 [parallel] [easy] The shape prompt in `references/shape.md` names `openspec/discovery/` in its clean-tree exception. It says the product question and the move question are confirmation questions with no recommendation (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: shape prompt')

## 4. Docs and integration [depends-on: 2]

- [ ] 4.1 [easy] `docs/monorepo.md` has a section on discovery maps: one map per product, the root's `## Products` table and shared personas, and that a repository with several domains can still be one product. The README's *Monorepos* section links it, and every README line that names the map's path covers both layouts (verify: deli -- bats tests/skill-interfaces.bats --filter 'discovery maps: docs')
- [ ] 4.2 [medium] The whole project passes its checks, with no change to `.agents/skills/` or `openspec/schemas/` (verify: deli -- sh -c 'pnpm test && nix flake check && mise run check')

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
