## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (gpt/gpt-6-astra, through the t3 resolver)
- **Independent**: yes
- **Tool restrictions**: read-only; the session left the tree clean
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, ADR-021 and the ADR-015 note, relevant source files, at commit 400f18d8

## Findings

### 🔴 Critical (blocking)

1. **The Glossary handoff import writes the issue body, and no `lets backlog` command covers that write.** `skills/lets-go/references/glossary-handoff.md:143`. Check: Scope / Contradictions. **CONFIRMED.**
2. **`item` returns neither assignees nor open sub-issues**, so `lets-go` cannot say why a shaped story is not ready, or list an epic's sub-issues (`openspec/specs/lets-go/spec.md:1213`). Check: Behavior parity. **CONFIRMED.**

### 🟡 Moderate

3. **The ban on `gh api graphql` contradicts the comment thread read, which is a GraphQL query** (`skills/lets-shape/references/issue-comments.md:16`). Check: Contradictions. **CONFIRMED.**
4. **`claim-failed` is missing from the procedure-result table** in the unchanged requirement *Each lets-go procedure returns a result*. Check: Contradictions. **CONFIRMED.**
5. **A Project relinked between `claim` and `release` makes `release` write to the other Project**, because each command looks the Project up again. Check: Scope / where it stops working. **CONFIRMED, accepted risk.**
6. **"The whole ranked list" overstates what today's bounded queries return** (500 items, 100 Projects per connection). Check: Behavior parity. **CONFIRMED.**
7. **ADR-021 says lets knows what each write did**, but a write that times out can still land, as design.md Decision 4 says. Check: Contradictions. **CONFIRMED.**

### 📌 Suggestions

8. **Split long sentences**: the ready filters in `lets-backlog`, and the nothing-ready instruction in *lets-go picks the first ready story*. Check: Plain language. **Partly taken.**

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

The reviewer suggested REVISE. Each Critical finding is fixed by a small, unambiguous edit listed below, so no finding stays open after them.

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. `lets-go` delta, *lets-go reads and claims the backlog only through lets backlog*: keep the **Glossary handoff** body edit as `gh` beside the other shaping-side calls. Record it in D12.
2. `lets-backlog` *item*: return `assignees` and open `subIssues`, with scenarios. `lets-go` delta: scenarios for explaining an assigned story and listing an epic's sub-issues from `item`. design.md Decision 2: add the fields to the `gh issue view` call.
3. `lets-go` delta: forbid `gh project` and the Project query, not all GraphQL. Its test scenario looks for `projectsV2`, `--add-assignee` and `--remove-assignee` instead of `gh api graphql`.
4. `lets-go` delta: MODIFY *Each lets-go procedure returns a result*, adding `claim-failed` to *Claim*'s results, with a scenario.
5. design.md Risks: record the inherited query bounds and the relink window.
6. ADR-021 Consequences: say lets sees each write's own response, and that a timed-out write can still land.
7. `lets-backlog` *ready*: list the filters as bullets.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed by required change 1. The record belongs to the Glossary handoff that `lets-shape` writes, so it moves with the shaping side (#137), as D12 already does for the thread read.
2. Fixed by required change 2.
3. Fixed by required change 3.
4. Fixed by required change 4.
5. Rebutted and recorded as a risk (required change 5). The window is the few seconds between claiming and creating the branch, and only an admin can relink a Project. Passing the Project from `claim` to `release` would add an argument and a check for that case alone, against D5.
6. Fixed by required change 5. D4 keeps today's bounds; the tests will pin them.
7. Fixed by required change 6.
8. Taken for the `lets-backlog` filters (required change 7). Declined for *lets-go picks the first ready story*: that sentence is unchanged main-spec text, outside this change.
