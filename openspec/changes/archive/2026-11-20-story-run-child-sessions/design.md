## Context

- **The step strategy already does most of the work.**
  `lets delegate step run` starts a session that may write files, waits
  for its final message, reads the step report it ends with, and keeps a
  session that did not finish (`lets/src/delegate/step.ts`). No resolver
  reads the intent: `--for` only picks the guidance, the time limit and
  the record line. So a child `lets-go` session needs no new resolver
  code.
- **A child shares the epic run's checkout.** The T3 resolver opens its
  session in the checkout that asked for it, and the `cli` resolver runs
  in the repository root. The child sees the same branch and the same
  `.workspace/lets-go/` files as the epic run. The epic run waits for the
  child, so the two never write at the same time.
- **The `subagent` resolver cannot start a child.** It saves the prompt
  and exits 3. A Claude subagent cannot start another subagent, so a
  child run in a subagent could not give each step a fresh session (D4).
- **The epic run's own walk stays.** It is the fallback on exit 3, and
  the only path where no resolver can start a session.
- **`epic-run-resume` (#282) is not archived.** Its delta replaces
  *An epic run picks each story as next picks it*. This change's delta
  of that requirement starts from #282's text, so it holds after both
  archive, bottom-up.
- **OpenSpec keeps every scenario of a modified requirement.** The
  scenario *No child session* keeps its name, and now tests the
  fallback.

## Goals / Non-Goals

**Goals:**

- The epic run's context grows by a few lines per story, not by every
  step's report.
- The child reuses *Walk the step table*, *Run a step*, *Read the
  report* and the subagent step as they are. Only *Relay the questions*
  and the end of the run act differently in a child.
- Every fact the child needs travels in its prompt or in the shared
  checkout. Neither session keeps state of its own.

**Non-Goals:**

- Running children in parallel (#S8).
- A child that claims, routes or stacks. The epic run does those (D3).
- Changing the five steps, their prompts or their reports, beyond the
  optional `ask` field.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads the
  `lets-go` skill's files as one text and checks its fixed lines, links
  and sections. It covers the story prompt, the child's part, the relay
  and the settle rules.
- **Existing seams reused:** `tests/lets/delegate/` —
  `strategies.test.ts` and `cli.test.ts` for the `story` intent and the
  help, `step.test.ts` for the 600-minute default,
  `instructions.test.ts` for `delegate.step.story.guidance`, and
  `report.test.ts` for the `ask` field.

## Scrutiny Tier & Blast Radius

- **Tier:** high. It adds a field to the step report contract and a
  new intent, and it nests one `lets-go` session inside another, in the
  same checkout.
- **Blast radius:** `lets delegate step` (`strategies.ts`, `step.ts`,
  `report.ts`, `main.ts`); `skills/lets-go/` (`SKILL.md`,
  `references/epic-run.md`, `references/subagent.md`, and the new
  `references/story-run.md`); `README.md` and `docs/resolvers.md`. A run
  that is not an epic run reads none of the new text, and its steps'
  reports never hold `ask`.

## Decisions

### D-1. `story` is a strategy intent, not a step

`STEP_INTENTS` keeps the five steps, in order. A new list,
`STEP_STRATEGY_INTENTS`, adds `story`, and `STRATEGIES.step.intents`
uses it. `StepOptions.for` takes either.

- *Alternative:* add `story` to `STEP_INTENTS`. Rejected: code and tests
  read that list as "the five steps", and the glossary says a story run
  is not a step (D10).

### D-2. The time limit depends on the intent

`step.ts` exports `STORY_TIMEOUT_MINUTES = 600` beside
`STEP_TIMEOUT_MINUTES = 120`, and picks one by `--for` when
`--timeout-minutes` is absent (D6). The help text of
`--timeout-minutes` names both defaults.

### D-3. A question marked for the user holds `ask: true`

A child marks each question of a step's sixth and later rounds (D5).
`lets` parses the child's report into JSON, and drops any field it does
not know, so the mark has to be a field the parser keeps. `report.ts`
reads an optional boolean `ask` on each question. It keeps `ask: true`,
drops `ask: false`, and treats any other value as an unreadable report
that names `questions[<i>].ask`. `subagent.md` gets the same rule.

- *Alternative:* a prefix in the question's text. Rejected: the
  settled-question check matches exact text, and the answer would carry
  the prefix into the step.
- *Alternative:* the epic run counts the rounds. Rejected: it cannot
  tell which step asked.

### D-4. The child counts a step's rounds in a file

On each `needs-input` report of a step, the child appends one line to
`.workspace/lets-go/<session>-rounds.txt`. The count is the number of
lines. The epic run removes the story's four rounds files before the
story's first child round, so the count is per story run, as the count
is per run today.

- *Alternative:* count the pairs in the step's answers file. Rejected:
  one round can ask several questions.

### D-5. Answers go through the story's answers file, one round at a time

The epic run writes only the latest report's pairs to
`.workspace/lets-go/<name>-story-answers.yaml`, replacing the file.
`lets` adds them to the story prompt as the `## Answers` section. The
child finds the first row that is not done. When its step's last report
is `needs-input`, the child appends each pair that answers one of its
questions to that step's answers file, then runs the step with
`--answers-file`. From there, *Relay the questions* and *Run a step*
work as they do today.

- *Alternative:* the epic run writes straight to the step's answers
  file. Rejected: the epic run would have to find out which step asked,
  from files the child owns.
- *Alternative:* one story answers file for the whole story run.
  Rejected: two steps can ask the same text, and the child would have to
  filter out earlier rounds.

### D-6. The story prompt is written by the epic run; the child's part has its own file

`references/epic-run.md` holds the story prompt's frame, as one fenced
block, and the rules that fill it. A new `references/story-run.md` holds
the child's part: take the values from the prompt, check the branch,
walk the step table, pass the questions up, and end with one report.
*Read the request* in `SKILL.md` sends a request that starts with
`You run a story run of a lets-go epic run:` to that file. *Read the
settings* still runs first, so the child knows the default branch.

- *Alternative:* put the child's rules in `SKILL.md`, under each part
  they change. Rejected: every run would read them, and the spec keeps
  text that only some runs need in reference files.

### D-7. The child turns every stop into a `failed` report

In the child, a failed step, records that disagree, a merged or closed
pull request and every other stop of the walk end the session with a
`failed` report: `failed at <step name>: <reason>` or
`stopped: <reason>` (D9). The child runs none of *A stop in an epic
run*. The epic run settles the story from the report, then goes on from
that rule's third action: the checkout check, the dependents and
`git switch <default>`.

### D-8. The epic run trusts no `done` it has not read

The child's `done` report's first evidence line is
`pull request #<pr>: <pr-url>`. The epic run still reads
`gh pr view <name> --json url,state,isDraft` and builds the line from
that, so a `done` with a draft or missing pull request settles as
`stopped: the story run reported done, but …` (D9).

### D-9. A record of the decision to run stories in child sessions

Running a `lets-go` session inside another, through the step strategy,
in the same checkout, is costly to reverse: #S8's parallel waves will
build on it. The ADR step records it.

## Risks / Trade-offs

- [A child claims, routes or switches branch by mistake] → The story
  prompt says the epic run did those. The child checks the branch first
  and stops when it differs. The skill-interfaces test checks that
  `story-run.md` runs none of those parts.
- [A child leaves uncommitted changes, or times out mid-step] → The
  epic run's checkout check in *A stop in an epic run* ends the epic run
  and leaves the changes as they are.
- [A long child session hides progress from the user] → By design (D8).
  The child session is kept when it does not finish, so the user can
  read its step lines there.
- [Answers reach the wrong step] → The child gives a pair only to the
  step whose last report asked that exact question, and stops when a
  pair matches none.
- [A child gets exit 3 for a step] → It takes the subagent step itself,
  as any run does. Only the epic run's exit 3 for the story falls back to
  the epic run's own walk.
- [Context saving silently lost on the fallback] → The epic run prints
  `No child session could start for #<i>, so this session walks its
  steps.`

## Migration & Rollback

N/A. `story` and `ask` are additions. A run that is not an epic run
behaves as before. To roll back, revert the change: the epic run then
walks every story in its own session again.
