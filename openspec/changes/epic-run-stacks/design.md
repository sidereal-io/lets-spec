<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

An epic run picks each story with `lets backlog ready --only … --exclude …`
(`skills/lets-go/references/epic-run.md`, *Pick the next story*).
`ready` lists only issues with no open blocker: the GitHub adapter's one
search is `is:open no:assignee -is:blocked`
(`lets/src/backlog/github.ts`, `listCandidates`), and `policy.ts` keeps
only candidates whose `free` flag is set. The user owns the merge, so a
blocker built earlier in the run stays open, and its dependent story is
never listed. Under today's rules that story ends as
`not built, blocked by #<blocker>`.

So the brainstorm's D1 ("blockers are built first") holds, but the epic
run would never pick a stacked story such as #280. Stacking therefore
needs a change to `ready`, not only to the skill text.

Other facts the approach relies on:

- *Check the issue* step 3 (`skills/lets-go/SKILL.md`) stops on an open
  blocker when the change's branch does not exist.
- *Claim* step 4 creates the branch off the default branch. *Glossary
  preflight* checks the checkpoint against the "proposed base".
- The draft pull request is opened by the brainstorm artifact's
  instruction in `schemas/lets-standard/schema.yaml` and
  `schemas/lets-minimal/schema.yaml`. The step that runs it has only its
  prompt (`skills/lets-go/references/step-prompt.md`), none of the epic
  run's conversation.
- `lets-review-plan` and `lets-review-build` already take the review base
  from `gh pr view --json baseRefName` (D5).
- `gh issue list --json` offers `blockedBy` (checked with `gh` 2.102.0).

## Goals / Non-Goals

**Goals:**

- A stacked story ranks with the other ready stories, by the one ranking
  rule in `policy.ts`.
- The epic run decides met-ness and the stack base from Git and GitHub
  reads it already makes, plus one `gh pr list` per pick.
- The step that opens the draft pull request learns the base from its
  prompt alone.

**Non-Goals:**

- Stacking outside an epic run (D3).
- Restacking or rebasing a branch after its blocker changes (D4).
- Teaching `records.md`'s hand fixes about stacks. A user who opens a
  missing pull request by hand chooses its base.
- Resuming an in-progress story in a rerun of the epic: a claimed story
  is assigned, so `ready` never lists it. That is #282.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads the
  skill, reference and schema text. It covers every `lets-go` and
  schema requirement in this change, as earlier epic-run changes did.
- **Existing seams reused:** `tests/lets/backlog/ready.test.ts` drives
  `lets backlog ready` through `run([...], deps)` with the fake `gh` rows
  of `tests/lets/backlog/fixtures/fake-gh.ts`. It covers the
  `--met-blockers` requirement. `tests/lets/backlog/policy.test.ts`
  covers the filter in `ready()` directly when the command test cannot
  reach a case, such as a blocker in another repository.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the `lets-go` skill's epic-run path (`SKILL.md`
  *Check the issue* and *Claim*, `references/epic-run.md`,
  `references/step-prompt.md`), the brainstorm instruction of both
  schemas, and `lets backlog ready` (one new option; its output shape is
  unchanged). A run outside an epic run, and `ready` without the new
  option, behave as before.

## Decisions

### 1. `ready` takes `--met-blockers <keys>`; the skill decides what is met

The epic run computes the met stories and passes their keys; `ready`
treats an issue whose every open blocker is named there as passing the
blocker filter.

- *Alternative: rank stacked stories in the skill.* On `nothing-ready`,
  read each story with `lets backlog item` and pick one whose blockers
  are met. No CLI change, but it would rank stacked stories after every
  unblocked one, whatever their Priority, and write a second ranking rule
  in prose.
- *Alternative: let `ready` decide met-ness.* The backlog adapter knows
  issues, not pull requests or branches, and D6 is a pull-request rule.

Why: one ranking rule, testable in Node, and the backlog stays ignorant
of Git.

### 2. The adapter reads blocked candidates only when asked

`listCandidates` gains an option, such as `{ blocked: true }`, that
`ready` sets only when `--met-blockers` is given. Then the GitHub adapter
runs a second search,
`gh issue list --search 'is:open no:assignee is:blocked' --limit <FREE_LIMIT> --json number,createdAt,blockedBy`,
and gives each such candidate its open blockers. `Candidate` gains a
field, such as `blockers: string[] | null`: the keys of the open
blockers when every one is in this repository, and `null` when any is in
another repository, so a foreign blocker is never met. `free` keeps its
meaning. `ready()` keeps a candidate when it is `free`, or when its
`blockers` is non-null and every key is in `met`; every other filter
still applies.

- *Alternative: one search without `-is:blocked`.* Changes the default
  call that `ready.test.ts` pins, and fetches blocked issues on every
  run.

Why: without the option, the calls and the result are byte-for-byte
today's. The fake Jira provider in `fake-provider.ts` needs only the new
field on its candidates.

### 3. Met stories come from one `gh pr list` per pick

Before each `lets backlog ready`, the epic run runs
`gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName`.
A story of the epic, in this repository, is met when an entry's
`headRefName` is the story's change name (title before ` — `) and
`isDraft` is false. The epic run keeps each met story's branch and pull
request number for the stack decision.

- *Alternative: `gh pr list --head <name>` per story.* Up to one call per
  story per pick, for the same answer.

Why: one read, and the repository rule that a change's branch is its
name makes `headRefName` the key.

### 4. The stack decision lives in `references/epic-run.md`

*Check the issue* step 3 gets one epic-run case: when the branch does not
exist, in an epic run, run a new section *Stack the story* in
`references/epic-run.md` instead of stopping. That section follows the
spec's four steps. Its results:

- `stacked`: carries `<blocker>`, `<blocker-branch>` and `<blocker-pr>`.
  The run prints the `Stacks on` line and goes on with *Check the issue*
  step 4.
- `settled`: the story got its `not built` line. Go back to
  *Run the epic*, which picks again, as a lost claim does.

The ancestry test is
`git merge-base --is-ancestor origin/<other-branch> origin/<blocker-branch>`,
after `git fetch origin <blocker-branch>` for each open blocker. Keeping
the steps in the reference matches the existing rule that epic-run steps
live there and a story run loads none of them.

### 5. *Claim* branches off the blocker with `--no-track`

For a stacked story, *Claim* step 4 runs
`git switch --no-track -c <name> origin/<blocker-branch>`. Without
`--no-track`, Git would set `origin/<blocker-branch>` as the new
branch's upstream, and a plain `git push` from a later step could push
to the blocker's branch. *Claim* step 2 says the proposed base for
*Glossary preflight* is `origin/<blocker-branch>` for a stacked story.

### 6. The step prompt carries a `## Stack` section

`references/step-prompt.md` adds a section that goes between
`## What to run` and `## Writing`, only for a stacked story:

```text
## Stack

This change is stacked on #<blocker>: its branch starts from
`<blocker-branch>`, the branch of pull request #<blocker-pr>. Open the
draft pull request with `--base <blocker-branch>`, and put the line
`Stacked on #<blocker-pr>; merge that first.` beside `Closes #<i>` in
its description. If the pull request exists with another base, fix it
with `gh pr edit <name> --base <blocker-branch>`.
```

Every step of the story gets it, so a step resumed after `needs-input`
still sees it. Both schemas' brainstorm instruction adds one sentence:
when the step prompt has a `## Stack` section, follow it where you open
the draft pull request.

### 7. Lines

*Settle a story* gains the stacked built line,
`#<story> <story-name>: <pr-url>, stacked on #<blocker>`, and the reason
`blocked by #<a> and #<b>, on different branches`. *Settle the story
whose walk ended* (step 2 of *Run the epic*) uses the stacked form while
the story is stacked. `README.md`'s epic-run paragraph replaces
"It leaves a blocked story out" with a sentence that a story blocked by
another story of the epic stacks on its branch; the matching bats test
changes with it.

No decision here is costly to reverse: the option is additive and the
skill text is versioned with the release.

## Risks / Trade-offs

- [`is:blocked` search may also match an issue whose blockers are all
  closed] → `ready()` uses only open blockers from `blockedBy`, and an
  issue with none is `free` from the first search anyway.
- [`gh issue list --json blockedBy` changes shape in a later `gh`] →
  today it returns `{ nodes: [{ number, state, title, url }], totalCount }`,
  the same shape `readItem` reads from `gh issue view` (checked against
  this repository, 2026-11-19). The adapter reuses `readItem`'s `nodes()`
  reading, and the fake `gh` row pins that shape.
- [A met blocker's pull request turns draft between `ready` and *Check
  the issue*] → *Check the issue* reads the blockers again, and the stack
  decision settles the story with `blocked by #<blocker>` (spec scenario
  *A blocker that stopped being met*).
- [A stacked branch built on a blocker that later changes in review] →
  out of scope (D4). The `Stacked on` line and the `stacked on` printed
  line tell the user the merge order.
- [More than 1000 open pull requests] → a met story may be missed and
  reported `not built, blocked by`. Acceptable: the run says why.

## Migration & Rollback

N/A. Nothing changes shape. Rolling back means reverting the change's
commits; a stacked pull request already open keeps its base.
