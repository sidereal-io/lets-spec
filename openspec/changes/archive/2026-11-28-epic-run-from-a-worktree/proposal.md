<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

T3 Code gives each session a worktree on a branch of its own, such as
`t3/d0dcada9`, at the default branch's commit. The default branch is
checked out in the main repository, so the session cannot switch to it.
`lets-go` treats every branch other than the default branch as a
change's branch, so from such a worktree it stops: with an issue number
because no issue's title starts with `t3/d0dcada9 — `, and with an epic
because an epic run needs the default branch. In #308's run on
2026-11-25 the agent went on only by ignoring the skill.

## What Changes

- `lets-go` gets a rule for a **checkout at the default branch**. A
  checkout counts when its current branch is the default branch, or
  when all of these hold: no open issue's title starts with the
  branch's name and ` — `; the checkout has no changes outside
  `.workspace/`; and its HEAD is the commit of `origin/<default>` after
  `git fetch origin <default>` (D1, D2).
- *Read the settings* decides this once, when the run starts, and the
  run keeps the answer to its end. A shape step's map edits during the
  run do not change it (D4).
- Every place where `lets-go` acts "on the default branch" acts the
  same way in a checkout at the default branch: the entry table's first
  row, the `epic` case of *Check the issue*, *Enter the branch*,
  *Claim*, the shape step and the epic run. Branches and worktrees are
  still created from `<default>`, as today (D1).
- Each sentence that says an epic run's own checkout "stays on
  `<default>`" says it "stays where it is" (D5).
- `skills/lets-go/references/terms.md` copies the glossary entry
  *Checkout at the default branch*, which an earlier commit on this
  branch added to `openspec/glossary.md` (D4).
- No change to `lets-plan` or `lets-build`: they keep testing the
  branch's name (D3).
- Out of scope, recorded as known limits in the design: resuming a
  stopped discovery whose map edits are uncommitted in a T3 worktree,
  and `lets-shape`'s glossary holding branch on a T3 branch (D6).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: a checkout at the default branch counts as the default
  branch wherever the requirements say where a run starts or runs; the
  entry table's first row names it; an epic run's own checkout stays
  where it is; `terms.md` carries and `SKILL.md` links the new term.

## Impact

- `skills/lets-go/SKILL.md`: *Read the settings*, the placeholder
  table (`<branch>`), the entry table and the text after it in *Read
  the request*, *Check the issue*'s `epic` case, *Enter the branch*,
  *The story's worktree* and *Claim*.
- `skills/lets-go/references/epic-run.md`, `shape.md`, `story-run.md`
  and `terms.md`.
- `README.md`: the `lets-go` section, which says the epic run's
  checkout stays on the default branch.
- `openspec/specs/lets-go/spec.md`, through this change's delta.
- No code, command or test fixture changes. The Node terms check reads
  the headings of `terms.md`, so it checks the new entry as it is.
