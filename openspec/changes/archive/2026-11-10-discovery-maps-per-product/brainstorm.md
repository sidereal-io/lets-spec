## Story

#238 discovery-maps-per-product — a monorepo keeps one discovery map for each product, listed by the root map. <https://github.com/sidereal-io/lets-spec/issues/238>

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does Product mean, and where is it defined? | Something a repository delivers to people of its own, who walk journeys of their own, so it gets a discovery map of its own. A repository with one product is that product. It is not a spec domain. Shared scope: `openspec/glossary.md`, committed on this branch. | User |
| D2 | Does the glossary also define Discovery map? | Yes: the file that records a product's personas and journeys. With one product it is `openspec/discovery.md`. With two or more, each product's map is `openspec/discovery/<product>.md`, and the root map lists them and holds their shared personas. Committed on this branch. | User |
| D3 | Does a single-product repository change? | No. It keeps `openspec/discovery.md` exactly as today, and gets no new question. | Evidence: #238 Scope in 1 |
| D4 | What does a product's map show for a persona that lives in the root? | Its Personas section names the persona and links to the root entry, with no copy. Every journey, a shared persona's too, stays in the product's map. The root holds no journeys. | User |
| D5 | When does a persona move to the root? | When a second product adopts it, as a glossary term does. The root starts with only the table of contents. | Evidence: #238 Scope in 1 |
| D6 | When does a parent issue carry a `Map:` line? | Every new parent issue does, beside `Input:`, even `Map: openspec/discovery.md` with one product. A parent with no `Map:` line means `openspec/discovery.md`. | User |
| D7 | When does lets-shape ask which product a run's idea belongs to? | Only when it can't tell. It picks from the root's table of contents when the idea clearly fits one product, and says which. Otherwise it offers each existing product or a new one. With one product, it asks only when the idea serves people or journeys that product doesn't. | User |
| D8 | How does the second product's arrival go? | lets-shape proposes kebab-case names for both products, from the map's title and the idea, and shows the move. On a yes it moves the map to `openspec/discovery/<first-product>.md`, writes the root's table of contents, and adds a `Map:` line to each open parent issue that names no map. On a no the run stays on the existing map. | User |
| D9 | How much does Revision mode reconcile in a monorepo? | It picks the run's map first, by D7's rule. The stale-link check covers every map and the root. Thread reads, re-annotation and the freshness line cover the run's map only. | User |
| D10 | What does lets-go check and commit? | Before the shape step, the dirty check covers `openspec/discovery.md` and `openspec/discovery/`. After Claim, it commits every one of those paths that `git status` lists, new files included, in the one `docs: the discovery map from #<parent>` commit. | User |
| D11 | Which map does Shape one issue read? | The product's map the issue belongs to, by D7's rule, plus the root's shared personas. It still never edits a map. | Assumption |
| D12 | What is out of scope? | Maps keyed by spec domain or nested under `openspec/specs/`, and declaring products in `openspec/config.yaml`. | Evidence: #238 Scope out |

## Changes from the story

- Scope in 4 is widened (D10). lets-go checks and commits every changed discovery map, not only the parent's map and the root, because Revision mode fixes stale links in every map (D9).
- Added: the second product's arrival adds a `Map:` line to open parent issues that name no map (D8), so an open discovery of the first product still resumes against its own map.
- Added: the glossary defines Discovery map as well as Product (D2).
- Open story #231 (shape-checkpoints) also edits `skills/lets-shape/SKILL.md`. It doesn't block this story, but whichever merges second must rebase over the other.

Confirmed by user: yes
