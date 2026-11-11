## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (gpt/gpt-6-astra, through the t3 resolver)
- **Independent**: yes
- **Tool restrictions**: read-only; the session left the tree clean
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, at commit ef00a2e6

## Findings

### 🔴 Critical (blocking)

1. **The commit command fails in a single-product repository.** Design Decision 7 passed `openspec/discovery` to `git add` and `git commit`, and that folder does not exist with one product. CONFIRMED: in a scratch repository, `git add -A -- openspec/discovery.md openspec/discovery` exits 128 with `pathspec 'openspec/discovery' did not match any files`, while `git status --porcelain` accepts it.
2. **The move leaves parents that name the root map pointing at the table of contents.** D6 writes `Map: openspec/discovery.md`, but the move retargeted only parents with no `Map:` line. CONFIRMED by reading `specs/discovery-maps/spec.md`.
3. **An interrupted move has no recovery rule.** A failed issue update, or local files discarded after parents were retargeted, leaves parents pointing at the wrong or a missing map, and the second-product rule no longer applies. CONFIRMED.

### 🟡 Moderate

4. **A third product has no creation procedure.** *lets-shape picks the run's map* offers a new product when the root already lists two, but no requirement says how to add one. CONFIRMED.
5. **A resumable parent lets one session commit another session's map edits.** Session B's unfinished edits to another product's map could ride Session A's commit. Partly REFUTED: see Rebuttals.

### 📌 Suggestions

6. **Long normative sentences.** The move requirement combined several obligations in one sentence. CONFIRMED.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: REVISE

## Required Changes (if APPROVE_WITH_CHANGES)

None: the verdict is REVISE. A new round reviews the revised plan.

CHANGES_APPLIED: n/a

## Rebuttals

1. Fixed. Design Decision 7 now takes the paths from `git status --porcelain -uall` and passes only those to `git add` and `git commit`. Test Seams adds a behavior test that runs the commands in a temporary repository, with and without the folder.
2. Fixed. *A second product moves the map with the user's yes* now retargets each open parent with no `Map:` line or with `Map: openspec/discovery.md`, with the scenario *An open parent that names the root*. This widens D8, as design.md's Risks says.
3. Fixed. The move writes files before issues, and stops and names the parents left when an update fails (scenario *An issue update fails*). The new requirement *A parent whose map is missing is repaired with the user* covers a parent that points at the root or at a missing file. Design Decision 8 and Migration & Rollback explain it.
4. Fixed. New requirement *A later product gets a map of its own*, with scenarios for a third product and for a name that is taken.
5. Rebutted in part. With one map, `lets-go` already goes on when the map is dirty and a parent for this input is in progress (`openspec/specs/lets-go/spec.md:809`). This change keeps that rule and only widens the paths. Separate worktrees have separate working trees, so one checkout's uncommitted maps cannot reach another's branch. The cross-checkout case, where a retargeted parent names a map another checkout lacks, is fixed by the repair rule in 3. design.md's Risks records both.
6. Fixed. The move requirement is split into two paragraphs of short, actor-led sentences.
