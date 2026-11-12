## Review Metadata

- **Review round**: 3
- **Prior round**: round 2, REVISE: one Critical finding (the repair rule missed a checkout without the move) and four Moderate ones, fixed in commit 18975a6a. The user chose to fix and run round 3 on claude-fable-5-2 at high effort.
- **Reviewer context**: fresh context, same family (claude/claude-fable-5-2, through the t3 resolver, at the user's request)
- **Independent**: no. The user picked a model from the author's family; rounds 1 and 2 were independent (gpt-6-astra).
- **Tool restrictions**: read-only; the session left the tree clean, and ran one `git status` experiment in a throwaway repository under `/tmp`
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, review.md (round 2), relevant source files, at commit 18975a6a

## Findings

The reviewer confirmed round 2's fixes 2, 4 and 6, found fix 1 closed for its case, and accepted the rebuttal of finding 5 as a known limit.

### 🔴 Critical (blocking)

1. **The missing-file rule stops every discovery that has not written its map yet.** The parent gets its `Map:` line at Ingest, but the map file was first created at the Personas checkpoint (`skills/lets-shape/SKILL.md:335-337`), and the move did not create the new product's map. CONFIRMED. A listed change fixes it.

### 🟡 Moderate

2. **At `auto`, the move can run without the user's yes.** Nothing made the product and move questions confirmation questions, and `lets-go` at `auto` answers a question that has a recommendation. CONFIRMED.
3. **The single-product trigger contradicts D3 and the glossary.** "Serves people or journeys the map's product does not" is true of any run that adds a persona or journey. CONFIRMED.
4. **Shape one issue could be offered "a new product", which it cannot create** (`skills/lets-shape/SKILL.md:455-456`). CONFIRMED. D11 was an Assumption; this narrows it.
5. **The spec and design named different status commands, and *Start finds, confirms, routes and claims the issue* still limits the commit to `openspec/discovery.md`** (`openspec/specs/lets-go/spec.md:21`). CONFIRMED.
6. **The `## Products` mark was only in the design, and "monorepo" blurred Product and domain** (`docs/monorepo.md:3-4`). CONFIRMED.
7. **The move named no query for the parents it retargets, and Phase 5's one-story body replacement dropped `Map:`** (`skills/lets-shape/SKILL.md:405-410`). CONFIRMED.

### 📌 Suggestions

- The proposal said Revision mode reads the `Map:` line; no requirement does. Accepted: the proposal now says Resume mode and Finalize.
- `skill_says` reads only `SKILL.md` and `references/`. Accepted: Test Seams says the template tests read the files directly.
- A stale-link fix in another product's map leaves its freshness line. Declined: D9 keeps the freshness line to the run's map. A link fix is not a re-check of the map's stages.
- A renamed `## Products` heading turns a repository back into one product. Declined: no current input does this, and a heading check would add a rule for a hand edit.
- #231, two worktrees making the move, retargeted parents in other checkouts. Noted in design.md's Risks; no change.
- `README.md:266` names the single path. Accepted: the proposal's Impact covers every README mention.
- Long sentences and three names for the table of contents. Partly accepted: the new sentences are short. "Table of contents" stays the name; `## Products` is its heading.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Create the run's map when its `Map:` line is written: `openspec/discovery.md` at the Ingest checkpoint of a first discovery, and `openspec/discovery/<new-product>.md` at the move. Add a scenario for Resume at `next phase: personas` in each case.
2. Make the product question and the move question confirmation questions with no recommendation, in *A second product moves the map with the user's yes*, *lets-shape picks the run's map* and the `lets-go` shape prompt sentence. Add a scenario at `auto`.
3. State the single-product trigger as a separate thing the repository delivers. Add a scenario where a new persona or journey of the same product asks nothing.
4. In *Shape one issue reads its product's map*, offer only listed products; when none fits, use no map's names and edit nothing.
5. Put design Decision 7's command in the `lets-go` delta, and add a MODIFIED delta for *Start finds, confirms, routes and claims the issue* that changes its last bullet to the discovery maps.
6. Name the `## Products` heading in *A repository with one product keeps one map* and *The root map lists the products*, and replace "monorepo" in the `discovery-maps` spec.
7. Name the query the move uses to find parents, and keep the `Map:` line in the Phase 5 one-story body replacement.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed: scenarios *A first discovery*, *A first discovery resumes at Personas* and *The new product's discovery resumes at Personas*, and the move now creates `openspec/discovery/<new-product>.md` (`specs/discovery-maps/spec.md`). design.md Decision 2 says so.
2. Fixed: *lets-shape picks the run's map* and *A second product moves the map with the user's yes* name both questions as confirmation questions with no recommendation; scenario *The move at auto*. The `lets-go` delta's shape prompt sentence names them (`specs/lets-go/spec.md`, *The shape step shapes an idea or an unshaped issue*).
3. Fixed: *A repository with one product keeps one map* now asks only when the idea is a separate thing the repository delivers; scenario *A new persona of the same product*.
4. Fixed: *Shape one issue reads its product's map* offers only listed products; scenario *A story no product fits*.
5. Fixed: *lets-go commits the discovery map on the story's branch* names `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, `git add -- <paths>` and `git commit ... -- <paths>`. *Start finds, confirms, routes and claims the issue* is in the delta with its last bullet changed.
6. Fixed: both requirements name `## Products`; the spec no longer says "monorepo".
7. Fixed: the move names `gh issue list --state open --search '"Input:" in:body' --json number,title,body` and the filter; *A parent issue names its map* keeps `Map:` in the one-story body replacement, with scenario *A parent that becomes one story*.
