<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

`lets-go`'s shape step does not just invoke `lets-shape`. Its prompt
carries *What shape runs* from `skills/lets-go/references/shape.md`:
about 60 lines that tell `lets-shape` where to start, how to resume a
discovery, when to ask about discovery and how to report. That is a
second copy of `lets-shape`'s own rules. When `lets-shape` changes,
`lets-go`'s resume breaks without warning. This story is the walking
skeleton of #263: once shape runs with one sentence, the other moves
can follow the same pattern.

## What Changes

- The shape prompt says what to run in one sentence, like every other
  step (D6). For an issue: ``Invoke the `lets-shape` skill for issue
  #<i>, and stop where it stops.`` For an idea: ``Invoke the
  `lets-shape` skill for the idea above, and stop where it stops.``
- *What shape runs* is removed from `references/shape.md`. Its rules
  move into `lets-shape`, each stated as `lets-shape`'s own rule for
  every caller (D1). The shape prompt's header lines carry only what
  `lets-go` alone knows (D1, D4).
- `lets-shape`'s *Locate the discovery* picks its mode in a new order
  (D2):
  1. An open parent whose `Input:` line names this input: *Resume mode*
     if it is in progress, or finish Finalize if it has no status line
     and the `## Answers` section confirmed its Phase 5 story table.
  2. The `## Answers` section says yes to the discovery question:
     discovery from Ingest.
  3. Any other idea or issue: *Shape one issue*.
  4. No input: today's rules.

  For direct use, this means an input the user brings now wins over an
  unrelated in-progress discovery.
- *Resume mode* treats phases that an `## Answers` section confirmed as
  settled. It skips the restatement's confirmation and goes straight to
  the recorded next phase.
- `lets-shape` asks the discovery question itself, for every caller,
  with the recommendation yes. On yes it runs discovery from Ingest. On
  anything else it stops, says the work is too large and discovery was
  declined, and shapes nothing (D3). This replaces *Shape one issue*
  step 6's offer-and-stop.
- *Find or create the issue* skips its title search when its input says
  the search already ran and no issue matched (D4). Until #267 lands,
  the idea's header line in the shape prompt says this.
- `lets-shape` names its own confirmation questions, which get no
  recommendation. When the glossary handoff asks who carries the edits,
  it recommends the first story in dependency order (D5).
- `lets-shape` states the end state once, beside its rule that it never
  creates a change: no change, the default branch, and a clean tree
  except the discovery maps (D6).
- The `lets-go` requirements and bats checks that this touches assert
  behaviour, not the prompt's wording (D7). The done report's evidence
  format stays where it is, in the step prompt's report section (D10).
- The pull request records `wc -l` for `lets-go`'s `SKILL.md` and the
  whole skill, and walks through the four ways a round can start (D8).

Out of scope: `lets-go`'s own discovery query and title search in
*Start from an idea* (#267), and the shape step's name (D9).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `discovery-checkpoints`: adds how `lets-shape` picks its mode from its
  input, resumes a discovery or finishes Finalize from an `## Answers`
  section, asks the discovery question, skips a search that already
  ran, names its confirmation questions and the glossary owner it
  recommends, and the state it ends in.
- `lets-go`: rewrites *The shape step shapes an idea or an unshaped
  issue*, *The shape step asks before it runs discovery* and *The step
  prompt says what to run, the question mode, and how to report* to
  describe what the run does, and to give shape its one sentence. It
  also updates *lets-go refers to no step by its number* (the shape
  prompt no longer names `lets-shape`'s steps) and *lets-go keeps what
  only some runs need in reference files* (`shape.md` no longer holds
  *What shape runs*).

## Impact

- `skills/lets-shape/SKILL.md`: *Locate the discovery*, *Shape one
  issue* (steps 1, 6 and 7), *Resume mode*, *Phase 6: Finalize*, the
  glossary handoff's owner question, and the rule that discovery never
  creates a change.
- `skills/lets-go/references/shape.md`: *What shape runs* is removed.
- `skills/lets-go/references/step-prompt.md`: the shape sentence and
  the idea's header line.
- `skills/lets-go/SKILL.md`: three links to *What shape runs*.
- `tests/skill-interfaces.bats`: the checks that read *What shape runs*
  or the shape prompt's wording move to `lets-shape`, or assert the one
  sentence.
- `openspec/specs/discovery-checkpoints/spec.md` and
  `openspec/specs/lets-go/spec.md`.
- No code, CLI or dependency changes. Users who run `lets-shape`
  directly see the three small changes the ledger lists under *Changes
  from the story*.
