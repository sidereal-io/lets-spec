<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#340 epic-run-from-a-worktree — lets-go runs from a clean checkout at the default branch's commit, as a T3 worktree is.
https://github.com/sidereal-io/lets-spec/issues/340

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What must `lets-go` do in a clean checkout whose HEAD is `origin/<default>`, on a branch of its own? | Act as on the default branch: the entry table's default-branch row, the `epic` case of *Check the issue*, and *Claim* create branches and worktrees from the default branch as today. | Evidence: #340 packet, **Expected** |
| D2 | The rule also matches a change's branch just after *Claim* creates it. Should a branch that names an open issue still count as the default branch? | No. The checkout counts only when its branch is the default branch, or when the rule holds and `lets backlog find <branch>` finds no open issue whose title starts with `<branch> — `. | Assumption |
| D3 | Should `lets-plan` and `lets-build` take the rule too? | No. They stay as they are; the change touches only `lets-go` and its references (`epic-run.md`, `shape.md`, `story-run.md`, `terms.md`). Taking it there would stop every plan step on a just-claimed branch. | Assumption |
| D4 | What is the case called, and when is it decided? | "A checkout at the default branch", defined in `openspec/glossary.md` and copied to `skills/lets-go/references/terms.md`. `lets-go` decides it once, in *Read the settings*, and keeps it for the whole run, so a shape step's map edits do not change it. | User |
| D5 | How do the sentences that say an epic run's checkout "stays on `<default>`" change? | Each one says the checkout "stays where it is". | User |
| D6 | Are a resumed discovery with uncommitted map edits from a T3 worktree, and `lets-shape`'s glossary holding branch on a T3 branch, in scope? | No. Both stay out, as #340's scope says, and the design records them as known limits. | Assumption |

## Changes from the story

- Cut: `lets-plan` and `lets-build`, which #340 lists only "if they carry the same check" (D3).
- Added: a branch that names an open issue never counts as the default branch, so a change's branch stays a change's branch (D2).

Confirmed by user: no
