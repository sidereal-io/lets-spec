## Context

`lets-go` is a skill: Markdown instructions an agent follows, not code.
An epic run's rules live in `skills/lets-go/references/epic-run.md`.
Its section *A stop in an epic run* holds the one rule for a stop while
the run is on a story. Today that rule ends the epic run. Nine sentences
link it, each saying the stop "also ends the epic run at its story": the
overview, *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk
the step table*, *Run a step*, *Read the report* and *Relay the
questions* in `SKILL.md`, and *Records that disagree* in
`references/records.md`. The `fetch-failed` case in *Check the issue*
links it too.

`tests/skill-interfaces.bats` checks this text: that the stop lines
appear once, under *A stop in an epic run*, in text blocks, and that
every section in `stop_sections` links the rule.

An epic run builds every story in one checkout, in the epic run's own
session. A story's blockers come from `lets backlog item <story>`, whose
`blockedBy` lists each blocker with its `key` and `state`.

## Goals / Non-Goals

**Goals:**

- Rewrite *A stop in an epic run* as the five ordered actions the spec
  gives, so the agent ends one story's run and goes back to the pick.
- Keep the rule in one place, and keep every stop's link to it.
- Reword the nine linking sentences so none says the epic run ends.

**Non-Goals:**

- No change to any stop's own text, or to the lost claim.
- No change to stops between stories, or to runs that are not epic runs.
- No retry, no count line, no repair of the checkout.
- No change to the `lets` CLI, the schemas or `step-prompt.md`.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads the
  skill's Markdown and asserts its sections, lines and links.
- **Existing seams reused:** the helpers `skill_section`,
  `skill_says_once`, `text_block_lines`, `has_heading`, `part_section`
  and `stop_links`, and the tests *an epic run's stop rule is written
  once* and *an epic run settles a stopped story in a text block*.

No test runs an agent through an epic run. The behavior is checked as
text, like every other `lets-go` rule.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill, on the pattern #279 and #280 set. It
  changes how far a failure reaches, which the user relies on.
- **Blast radius:** `skills/lets-go/SKILL.md`,
  `skills/lets-go/references/epic-run.md`,
  `skills/lets-go/references/records.md` and
  `tests/skill-interfaces.bats`. No runtime code, data or contract.

## Decisions

### D-A: The rule is a numbered procedure in *A stop in an epic run*

The section becomes five numbered actions, in the spec's order: do what
the stop says; settle the story; check the checkout; settle the
dependents; switch and pick. Each branch sits beside the action it
controls. The checkout check comes before the dependents, because a
dirty checkout settles every story left with the `stopped at` line, and
the dependent lines would be wrong then.

The step that ends the epic run (dirty checkout) keeps today's text
block, `#<story> <story-name>: not built, the epic run stopped at
#<stopped-story>`, and today's last action: print every line as *End of
the run* does, and stop.

*Alternative:* a separate section for "go on" beside the old "end"
section. Rejected: two rules for one stop would invite the agent to pick
the wrong one, and the tests check that the lines appear once.

### D-B: The checkout check is one `git status` command

```bash
git status --porcelain --untracked-files=all -- . ':(exclude).workspace'
```

Any output means uncommitted changes outside `.workspace/`: staged,
unstaged or untracked. Ignored files print nothing, so build output that
the project ignores does not count. The pathspec excludes `.workspace/`
even in a repository that does not ignore it.

*Alternative:* `git diff --quiet` and `git diff --cached --quiet`. Rejected:
they miss untracked files.

### D-C: Dependents come from one `lets backlog item` read per story

For each story of the epic, in this repository and not settled yet, run
`lets backlog item <story>` and keep the keys in its `blockedBy` whose
`state` is `OPEN` and whose `url` is the `url` of a story of the epic in
this repository. A blocker in another repository can share its key with
a story here, so a key alone never makes a story a dependent (ADR-025). Then mark dependents to a fixed point: start with
`<failed>`; a story is a dependent when an open blocker of it is
`<failed>` or a dependent; repeat until no new story is marked. Settle
the dependents in the epic's order.

The read happens after `<failed>` has its line, so the epic run is
between stories. A `lets backlog` error there ends the epic run, as
*Backlog errors* says for a stop between stories (D2).

*Alternative:* use the `blockedBy` already read in *Check the issue*.
Rejected: that read covers only the picked story, not the others.

### D-D: The skipped line always names one story

All dependents of `<failed>` settle at once, at that stop. A later stop
can then never reach a story that an earlier stop already skipped. So
the line `not built, it depends on #<failed>, which did not finish`
always names one story. The ledger's form for several stories (D5) does
not arise, and the rule writes no `#<a> and #<b>` variant.

### D-E: A new placeholder, `<failed>`

`<failed>` is the story whose run failed or stopped, in a skipped
story's line. It joins the placeholder table in `SKILL.md`, beside
`<stopped-story>`, and the list of placeholders shown by `label`.
`<stopped-story>` keeps its meaning: the story an epic run stopped at.
In the dirty-checkout case they are the same story.

### D-F: The return goes through *Run the epic*'s step 2

*Run the epic*'s step 2 already has a case for a lost claim: the run
comes back with the story settled, and goes on to the next step. Add the
same case for a stop: the run comes back from *A stop in an epic run*,
which has settled the story and its dependents and switched to the
default branch. It goes on to step 3, the pick.

The parts table's *Next* column for *Check the issue*, *Walk the step
table* and *Enter the branch* adds *Run the epic* after a stop in an
epic run.

### D-G: The linking sentences say "ends only its story's run"

Each of the nine sentences becomes, with its own subject:

```text
In an epic run, each stop in this part ends only its story's run, as
[A stop in an epic run](references/epic-run.md#a-stop-in-an-epic-run)
says.
```

The overview's sentence also says that a stop between stories still
ends the epic run. *Backlog errors* says the same: in a story run its
stop ends only that story's run; in a pick, it ends the epic run.

No ADR: the rule is text in one skill, and a later release can change it
without migrating anything.

## Risks / Trade-offs

- [The agent goes on after a stop that left the checkout on the failed
  branch with a half-done state the check cannot see, such as a stash or
  a commit that was not pushed.] → The epic run switches with `git switch
  <default>`, which leaves commits on the failed branch. Running
  `lets-go` again on that branch carries on, as today.
- [`git switch <default>` fails after a clean check.] → It is the same
  command as *Run the epic*'s step 2 after a built story, which has no
  case of its own. Say Git's error, and end the epic run as the dirty
  checkout does: the rest get `the epic run stopped at #<stopped-story>`.
- [A broken backlog makes every later story stop too.] → The next pick's
  `lets backlog ready` call returns the same error, and that is a stop
  between stories, so the epic run ends (D1, D2).
- [The skill grows longer.] → The rule stays in one section of
  `epic-run.md`, which only an epic run reads.

## Migration & Rollback

N/A. The change is skill text and its tests. Rolling back is reverting
the commits; nothing else changes shape.
