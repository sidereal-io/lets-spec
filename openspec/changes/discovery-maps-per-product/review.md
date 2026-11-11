## Review Metadata

- **Review round**: 2
- **Prior round**: round 1, REVISE: three Critical findings (commit pathspec, parents that name the root, no recovery from a partial move), all fixed or rebutted in commit 9841c882
- **Reviewer context**: fresh context, other family (gpt/gpt-6-astra, through the t3 resolver)
- **Independent**: yes
- **Tool restrictions**: read-only; the session left the tree clean
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, review.md (round 1), relevant source files, at commit 9841c882

## Findings

### 🔴 Critical (blocking)

1. **The repair rule misses a checkout that has not received the move.** The rule applies only "in a repository whose root map lists products". A parent retargeted to `openspec/discovery/warehouse.md`, resumed in a checkout whose root is still the single-product map, gets no repair, and the confirmed phases in the other checkout are not found. CONFIRMED: `specs/discovery-maps/spec.md`, *A parent whose map is missing is repaired with the user*.

### 🟡 Moderate

2. **Revision mode needs its map before Ingest picks it.** Revision step 1 reads threads and re-annotates stages, and Ingest is step 2 (`skills/lets-shape/SKILL.md:527`). The spec picks the map in Ingest. CONFIRMED.
3. **A single-product scenario forbids a needed product question.** *A discovery run with one product* says an idea that serves an existing persona asks no question, but a new product can serve the same persona on a different journey. CONFIRMED.
4. **Resume's isolation scenario conflicts with shared-persona promotion.** *Resume reads the Map line* forbids editing another product's map, but promoting a persona to the root replaces its entry in the other product's map with a link. CONFIRMED.
5. **One working tree, two discovery sessions.** An in-progress parent does not prove that every dirty map is its own. Partly REFUTED: see Rebuttals.

### 📌 Suggestions

6. **One new sentence is 35 words.** The repair rule's first sentence. CONFIRMED.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: REVISE

## Required Changes (if APPROVE_WITH_CHANGES)

None: the verdict is REVISE. This is the second REVISE in a row, so the author stops and asks the user.

CHANGES_APPLIED: n/a

## Rebuttals

Pending the user's decision on how to go on. Proposed fixes:

1. Apply the missing-file rule in every repository: when a parent's `Map:` names a file that does not exist, `lets-shape` writes no map, says the file is missing and that the branch holding it may not be merged yet, and stops. The question about products stays for a parent that points at the root in a monorepo.
2. Revision mode picks its map before step 1, by the same rule, and the spec says so with an ordering scenario.
3. Reword the scenario so the idea fits the existing product's journeys, and add the converse: the same persona, a new product, other journeys, so `lets-shape` asks.
4. Narrow the Resume scenario: it writes phases only to its own map, except the link line that promotes a shared persona. Add a resumed Personas scenario.
5. The same exposure exists today with one map (`openspec/specs/lets-go/spec.md:809`). The change keeps the rule and records it as a known limit in design.md's Risks, not a new guard.
6. Split the sentence.
