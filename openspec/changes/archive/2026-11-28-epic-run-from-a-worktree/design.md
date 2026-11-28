<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

`lets-go` is skill prose, not code. *Read the settings* in
`skills/lets-go/SKILL.md` runs `git branch --show-current`, and every
later part compares that name with `<default>`. The phrase "on the
default branch" carries two meanings in the skill today:

- **Where the run is:** the entry table's first row, *Check the
  issue*'s `epic` case, *Enter the branch* step 1, the shape step in
  `references/shape.md`, and the epic run's "own checkout stays on
  `<default>`".
- **The branch itself:** the base that *Claim* creates a branch from,
  `git worktree add ... <default>`, a pull request's base, and "merged
  into the default branch".

Only the first meaning changes. The glossary entry *Checkout at the
default branch* is already in `openspec/glossary.md` (commit
561121f8). The Node terms check, `tests/contracts/terms.test.ts`, reads
the `##` headings of `skills/lets-go/references/terms.md` and compares
each entry with the glossary's.

## Goals / Non-Goals

**Goals:**

- One place, *Read the settings*, decides whether the run is in a
  checkout at the default branch. Every other part reads that answer
  and never tests the branch name again.
- A run on a change's branch runs exactly the commands it runs today:
  one `lets backlog find <branch>`, and no fetch.

**Non-Goals:**

- No change to `lets-plan`, `lets-build` or `lets-shape` (D3, D6).
- No change to the `lets` CLI. The checks are Git commands and one
  existing `lets backlog` command.
- No change to where branches and worktrees start: `<default>`, as
  today (D1).

## Test Seams

- **Primary test seam:** the contract tests in `tests/contracts/`,
  through `pnpm test`. `terms.test.ts` checks that the new `terms.md`
  entry matches the glossary word for word. `links.test.ts` checks the
  new links to `references/terms.md#checkout-at-the-default-branch`.
  `fields.test.ts` checks any `lets backlog` field or value span the
  new prose writes.
- **Existing seams reused:** all three tests as they are; no new test
  file. The rest of the behavior is prose that the plan review and the
  build review check against the spec's scenarios, as for every other
  `lets-go` requirement.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill and its reference files, on established
  patterns, but the change sits at the start of every `lets-go` run.
- **Blast radius:** `skills/lets-go/SKILL.md`, the reference files
  `epic-run.md`, `shape.md`, `story-run.md` and `terms.md`, and the
  `lets-go` section of `README.md`. Released projects get it at the
  next `lets sync`.

## Decisions

### 1. Decide once, in Read the settings

*Read the settings* gets a new last paragraph, after
`git branch --show-current`. It runs the checks and says whether the
run is in a checkout at the default branch. The run keeps that answer
to its end (D4), so the discovery-map edits of a shape step during the
run do not turn it into "another branch".

A story run's child, whose request starts with
`You run a story run of a lets-go epic run:`, runs none of the
checks. It needs no answer, because it checks only that its branch is
`<name>`, and the checks would add a backlog call, and a way to fail,
to every child of a wave.

Alternative: test at each place that reads the branch today. That
repeats the rule in five places, breaks *Each lets-go rule is written
once*, and lets a shape step's edits change the answer halfway.

### 2. Run the issue search first

On a branch other than `<default>`, the checks run in this order, and
stop at the first that fails:

1. `lets backlog find <branch>`, keeping the issues whose title starts
   with `<branch> — `. A match means a change's branch.
2. The clean check:

   ```bash
   git status --porcelain -- . ':(exclude).workspace'
   ```

   Any output means changes. Ignored files print nothing, so they do
   not count.
3. The commit check:

   ```bash
   git fetch origin <default>
   git rev-parse HEAD origin/<default>
   ```

   The two lines must be the same commit.

The search comes first so that a change's branch never fetches: its run
is the same as today, and the matches are the ones the entry table
reads, so the skill still searches once. The answer that settled D2
described the order the other way round, clean check first. The result
is the same for every checkout; only the cost differs.

Alternative: filter the lines of a plain `git status --porcelain`. The
pathspec form needs no line parsing, so there is nothing for an agent
to misread, such as a rename line.

### 3. A failed fetch stops the run

When `git fetch origin <default>` fails, `lets-go` shows Git's error
and stops, claiming nothing. Without the fetch it cannot tell whether
the checkout is at the default branch, and either guess sends the run
to the wrong row of the entry table, with a message that does not name
the real cause. This is an assumption the brainstorm did not settle; it
is a minor detail of D1's rule.

### 4. Rename where the run is, keep the branch itself

The entry table's first row becomes "A checkout at the default branch".
Prose that says where the run is says "in a checkout at the default
branch". Prose that means the branch `<default>` stays as it is. The
`<branch>` placeholder becomes "the branch the run started on, when the
checkout is not at the default branch". Each "stays on `<default>`"
becomes "stays where it is" (D5): in `SKILL.md` (*Enter the branch*,
*The story's worktree*, *Claim*), `epic-run.md` (its opening and the
end of *A stop in an epic run*), and `shape.md` (*Commit the map in an
epic run*, step 4, "stays clean on `<default>`" becomes "stays clean").
"Uncommitted on the default branch" in `shape.md` and `epic-run.md`
becomes "uncommitted in this checkout".

Alternative: one sentence saying that a checkout at the default branch
counts as the default branch, and no other edits. It is shorter, but a
reader cannot tell which "default branch" it covers, and "stays on
`<default>`" would be false in a T3 worktree.

### 5. The term travels with the skill

`terms.md` gets a `## Checkout at the default branch` entry, copied
word for word from the glossary, so the terms check covers it. The
first mention in `SKILL.md` is in the opening resume bullets, and links
it. *Read the settings*, which decides the answer, links it too. No
other file repeats the definition.

### 6. Branches start from `<default>`, as today

*Claim* outside an epic run creates `<name>` off `<default>` and
switches this checkout to it, which leaves the starting branch, such as
`t3/d0dcada9`, where it was. In an epic run, `git worktree add -b
<name> .workspace/lets-go/worktrees/<name> <default>` is unchanged
(D1).

Alternative: start from `HEAD` in a checkout at the default branch,
which the commit check proved equals `origin/<default>`. It would be
fresher than a stale local `<default>`, but it makes two start points
for one rule, and D1 says "as today".

## Risks / Trade-offs

- [In a T3 worktree, the local `<default>` lives in the main
  repository and may lag `origin/<default>`, so a new branch can start
  behind it.] → The same happens today on a stale default-branch
  checkout. The plan step pushes the branch, and the pull request shows
  any conflict. Out of #340's scope.
- [A stopped discovery leaves its map edits uncommitted. From a T3
  worktree, the rerun that should resume it fails the clean check and
  stops, with "the issue and the branch do not match" or "an idea needs
  the default branch". On a default-branch checkout the same rerun
  resumes.] → Known limit (D6). The user can commit the edits on a
  branch of their own or rerun from the main checkout. Record it in
  the README's `lets-go` section beside the worktree text.
- [`lets-shape`'s glossary checkpoint rule, "from the default branch,
  first create a holding branch", treats a T3 branch as a change's
  branch and commits its checkpoints there.] → Known limit (D6). It
  still works, because the T3 branch holds no other history.
- [Every run on a branch other than `<default>` that is not a change's
  branch now costs a `git fetch`.] → Only those runs pay it, and they
  stopped before this change.

## Migration & Rollback

N/A. The skills reach this repository and released projects at the
next release and `lets sync`. To roll back, revert the change's
commits.
