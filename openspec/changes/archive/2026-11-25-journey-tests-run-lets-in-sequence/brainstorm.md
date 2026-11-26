## Story

#321 journey-tests-run-lets-in-sequence — one or two journey tests run
several `lets` commands in sequence, each using what the one before
printed.
https://github.com/sidereal-io/lets-spec/issues/321

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story: the helper
module and stand-ins in `tests/support/`, and `lets` does not change.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is a journey test? | A Node test that runs several `lets` commands in one temporary repository, in the order `lets-go` runs them, and takes each value the next command needs from what the last one printed. "Journey" here names a test, not a persona's journey on the discovery map, so it gets no glossary entry. | Evidence: #321 packet, *What a journey test is* |
| D2 | Which journeys do the tests follow? | Two tests. The story journey: `lets sync`, `lets sync --check` (exit 0), `lets backlog ready` (first key), `lets backlog item <key>`, `lets backlog claim <key>` (keep the token), `lets delegate step instructions --for plan` (models from `options`), `lets delegate step run --for plan` with one `--model` per option and a stand-in harness. The epic-wave journey: `lets backlog item <parent>` (story keys), `lets backlog waves --only <keys>`, `lets delegate step start --for story` for each story of the first wave, then `lets delegate step wait` with those names, reading each report file. | Assumption |
| D3 | Do the journeys run `lets backlog complete`? | No. No skill in `skills/` runs it, so no path `lets-go` takes reaches it. `tests/backlog/complete.test.ts` still covers it. | Assumption |
| D4 | What does each test check at the end? | Story journey: the stand-in issue has the user's assignment, the In Progress Status, and one claim comment holding the token `claim` printed; each model from `instructions` reached the stand-in harness, in order; the report on stdout has outcome `done`. Epic-wave journey: `step wait` printed exit 0 for each story, each story's report file holds its report, and no step process still runs. Neither test checks again what a single-command test already checks. | Assumption |
| D5 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D6 | May the change add a stand-in? | No. It may add small parts to the helper module that a sequence of commands needs. | Evidence: #321 packet, *Scope* |
| D7 | Are the tests Node tests? | Yes, run by `node --test`, in a file of their own. No bats test is added. | Evidence: #308 title and *Shared decisions*; #321 packet, *Scope* |
| D8 | How are the tests built? | By `skills/lets-verify-contracts/SKILL.md` in this checkout, not test-first, as #319 was. | Assumption |

## Changes from the story

- **Cut: `lets backlog complete`,** the packet's step 6. No `lets-go`
  path runs it (D3).
- **Changed: the story journey runs `step instructions` and `step run`
  for the plan step,** as `lets-go` runs one story, in place of
  `step start` and `step wait` for build (D2).
- **Added: a second journey, the epic wave,** which runs
  `lets backlog item`, `lets backlog waves`, `lets delegate step start`
  and `lets delegate step wait`. The packet's `step start` and
  `step wait` move here, so a background step process is still tested
  (D2).

Confirmed by user: yes
