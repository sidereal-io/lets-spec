## Context

- `lets backlog ready` keeps only unassigned issues in Todo. In the GitHub
  adapter, `listCandidates` builds each candidate from two searches:
  `is:open no:assignee -is:blocked` for free issues, and, with
  `--met-blockers`, `is:open no:assignee is:blocked` for their blockers
  and creation times. An assigned issue gets no creation time and no
  blockers, so nothing can rank it today.
- `ready()` in `lets/src/backlog/policy.ts` treats a candidate as
  unblocked when it is `free`, or when every open blocker is met. Today
  only unassigned issues ever carry `blockers`, so the assignee filter is
  hidden inside `free`.
- *Run the epic* in `skills/lets-go/references/epic-run.md` already reads
  the open pull requests before each pick to find the met stories, and
  settles stories in another repository at the start.
- *Check the issue* in `SKILL.md` already handles a story whose branch
  exists: it skips *Claim*, and *Enter the branch* switches to the branch
  and fast-forwards it. The walk then goes on from the first unfinished
  step. So a resumed story needs no new walk logic.
- `lets backlog item <parent>` prints only the open sub-issues. The run
  cannot list the epic's closed stories (D4).

## Goals / Non-Goals

**Goals:**

- Rank started stories with the code that ranks every other candidate,
  so one rule decides the order (D5).
- Read the epic's progress from Git and GitHub alone. `lets-go` keeps no
  state of its own, and `.workspace/` stays scratch.
- Keep the new text in `references/epic-run.md`, so a run that is not an
  epic run loads none of it.

**Non-Goals:**

- Rebasing or restacking a branch. A base edit changes only the pull
  request's target.
- Changing the walk, the step table or any record a step reads.
- Changing `lets backlog item` to print closed sub-issues (D4).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads the
  skill and reference text. It covers every `lets-go` requirement in this
  change, as the earlier epic-run changes did.
- **Existing seams reused:** `tests/lets/backlog/ready.test.ts` drives
  `lets backlog ready --started` through `run([...], deps)` with the fake
  `gh` rows of `tests/lets/backlog/fixtures/fake-gh.ts`, including the new
  `assignee:@me` search. `tests/lets/backlog/policy.test.ts` covers the
  started filter in `ready()` on `Candidate` values.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the epic-run path of `lets-go`
  (`references/epic-run.md`, the epic-run case of *Check the issue* in
  `SKILL.md`, the resume paragraph and the placeholders table), and
  `lets backlog ready` (one new option; its output shape is unchanged).
  `ready` without `--started`, and a run that is not an epic run, behave
  as before. One new write reaches GitHub: `gh pr edit --base` on a
  story's pull request whose blocker has merged.

## Decisions

### D-A: `lets backlog ready --started` ranks the started stories

The pick passes the started stories to `lets backlog ready` as
`--started <keys>`. The CLI lists them with the other candidates, in one
ranked list.

- *Alternative:* the skill runs `ready` for unstarted stories, reads each
  started story with `lets backlog item`, and merges the two lists
  itself. That puts a second copy of the rank rule in prose, and
  `item` has no creation time to break ties.

### D-B: The CLI checks the assignee, the skill checks the branch

The skill passes every story not settled yet whose change's branch
exists here or on `origin`. The CLI keeps those assigned to the signed-in
user. Each side checks what it can see: Git is outside the CLI, and the
signed-in user is inside the adapter already, for `claim`.

- *Alternative:* the skill reads the login with `gh api user` and checks
  each story's `assignees` itself. That adds a `gh` call to the skill
  for a fact the backlog provider owns.

A story with a branch that is assigned to someone else is passed, is not
listed, and gets `not built, assigned to <login>` from the existing
`nothing-ready` reasons.

### D-C: The GitHub adapter reads the signed-in user's open issues

With `--started`, `listCandidates` also runs
`gh issue list --search 'is:open assignee:@me'` with
`number,createdAt,blockedBy`, at the existing 500-item limit. Each
`Candidate` gains `mine: boolean`. A mine candidate carries its open
blockers, `[]` when it has none, or `null` when one is in another
repository, as the blocked search does.

`ready()` then has two paths:

- **Unstarted:** `!c.mine`, Status Todo, and unblocked as today.
- **Started:** `c.mine`, named in `started`, Status Todo or In Progress,
  and `blockers` not `null` with every one met.

Both paths need Kind not Epic and a Must, Should or Could priority. The
`!c.mine` guard keeps an assigned issue off the unstarted path once it
carries `blockers`. Without `--started`, no search runs and no candidate
is mine. The fake provider in `fixtures/fake-provider.ts` returns its
candidates as given, so it needs only the new field.

### D-D: One pull request read per story at the start

At the start, for each story of the epic in this repository, the run
reads:

```bash
gh pr list --head <name> --state all --limit 100 --json number,url,state,isDraft,baseRefName,isCrossRepository,createdAt
```

It drops the entries whose `isCrossRepository` is true. The story's pull
request is the open one, else the merged one, else the closed one with
the latest `createdAt`.

- *Alternative:* one `gh pr list --state all --limit 1000` for the whole
  repository. In a busy repository, an old story's pull request can fall
  past the limit. The open-only read before each pick stays as it is: it
  finds met stories, and open pull requests are few.

### D-E: Read a pull request's base in one place

The ready stories at the start (D2, D10) and the resumed stories (D7)
both ask what a pull request's base means. `references/epic-run.md`
gains one section, *Read a pull request's base*, that both use. In this
order, first match wins:

1. The default branch: not stacked.
2. The head branch of a pull request of this repository that merged
   into the default branch, read with
   `gh pr list --head <pr-base> --state merged --limit 100 --json number,isCrossRepository,baseRefName`,
   keeping the entries whose `isCrossRepository` is false and whose
   `baseRefName` is `<default>`: the blocker has merged. Run `gh pr edit <story-pr> --base <default>`, by the pull request's number. Not
   stacked.
3. The change's branch of an open story of the epic, in this
   repository: stacked on that story.
4. Anything else: leave it. Not stacked.

The merged pull request stands in for "the blocker's issue is closed",
because the run cannot see closed sub-issues. It comes before the open
story's branch because the epic's stories are the set read at the start:
a blocker whose pull request merges during the epic run is still in that
set, but its work is on the default branch. A blocker whose pull
request merged into another story's branch still has an open issue, and
rule 2 does not match it, so rule 3 does, and it still stacks (D8). A base whose pull
request merged into a branch other than the default branch falls to
rule 4: moving the base to the default branch would put commits that
are not on it into the story's pull request.

For a resumed story, rule 3 stacks the story only when that story is
met, as the spec says. A draft or missing pull request on the base's
story leaves the base alone, and the story is not stacked.

### D-F: A resumed story with a pull request keeps the base it was built on

A started story with a pull request takes its stack from that pull
request's base, through D-E. Only a started story without one runs
*Stack the story* (D9). The branch already holds commits made on its
base. *Stack the story* could choose a different blocker's branch and
point the pull request at a branch that does not contain them.

### D-G: The branches are read once, at the start

The run looks for each story's branch at the start, with the same two
commands *Check the issue* uses. The started set holds for the whole run,
less the stories settled so far. A branch created during the run belongs
to a story this run claimed, and that story is settled before the next
pick.

### D-H: The `Resumed` line comes from `--started`

The pick prints `Resumed` when the picked story was passed in
`--started`, and `Picked` otherwise. The branch exists in both cases
that reach `Resumed`, so "started in an earlier run" holds.

### D-I: Where the text goes

- `references/epic-run.md`: the start reads and settles in *Run the
  epic* step 1, `--started` and the `Resumed` line in steps 3 and 4,
  the `merged` and `closed` lines in *Settle a story*, the new section
  *Read a pull request's base*, and a new procedure, *Take up a started
  story*, which *Check the issue* runs.
- `SKILL.md`: *Check the issue* step 3 gains the epic-run case for a
  story whose branch exists, linking *Take up a started story*. The case
  comes first in step 3 and runs whether or not the story has an open
  blocker: a resumed story whose only blockers have closed still needs
  its base read, so its pull request leaves a merged blocker's branch. The
  resume paragraph gains the epic case. The placeholders table gains
  `<pr-base>`, the base branch of a story's pull request.

*Take up a started story* returns `stacked`, with `<blocker>`,
`<blocker-branch>` and `<blocker-pr>`; `not-stacked`; or the results of
*Stack the story* when it ran. A failed `gh pr edit` is a stop in the
story run, as *A stop in an epic run* says.

## Risks / Trade-offs

- [A base edit without a rebase can show the merged blocker's commits
  again, after a squash merge] → The pull request stays open for review,
  and restacking stays out of scope. GitHub makes the same base change
  itself when it deletes a merged head branch.
- [The run edits the base of a pull request it did not open, in this
  repository] → Only the base changes, only after its blocker merged, and
  GitHub records the change on the pull request. A pull request from a
  fork is never read.
- [An unassigned story in Todo with a branch is passed in `--started`,
  ranks on the unstarted path, and prints `Resumed` with no claim] →
  This is today's rule for an existing branch: *Enter the branch* does
  not claim. The line is accurate, since the branch exists.
- [Nine stories at the start mean about thirty `git` and `gh` reads] →
  Each is a read, and the epic run takes hours. No cache is needed.

## Migration & Rollback

N/A. `--started` is a new option, and nothing stored changes shape.
Reverting the change restores today's behavior.
