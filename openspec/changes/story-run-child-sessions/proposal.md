## Why

An epic run walks every story's steps in its own session today. Its
context grows with each story: every step line, every report and every
relayed question stays in it. A long epic can fill the session before
the last story runs. Running each story in a child `lets-go` session
keeps the epic run's context small, however many stories it builds. The
parallel waves of #S8 need the same split.

## What Changes

- **`lets delegate step` takes a `story` intent.**
  `lets delegate step run --for story` and
  `lets delegate step instructions --for story` start and probe a child
  `lets-go` session through the `step` strategy, and read the step
  report the child ends with (D1, D10). `story` is not a step: the five
  steps keep their names and order.
- **A story run gets 600 minutes.** `--for story` defaults to 600
  minutes; `--timeout-minutes` still overrides it. The five steps keep
  120 (D6).
- **The `story` intent takes guidance.** `delegate.step.story.guidance`
  in the lets config ranks the models for the child, as
  `delegate.step.<step>.guidance` does for a step (D11).
- **A step report's question may be marked for the user.** A
  `needs-input` question may hold `ask: true`. `lets` keeps it in the
  JSON line it prints. A child marks each question from a step's sixth
  round with it, so the epic run asks the user that question whatever
  its question mode (D5).
- **The epic run hands each story to a child session.** The epic run
  still picks the story, reads its blockers, stacks it, routes it and
  enters its branch: the claim, the branch and any glossary import. It
  then starts the child on that branch with
  `lets delegate step run --for story`. The child's prompt carries the
  issue, the schema, the route line, the question mode and the stack
  (D3).
- **The child walks only the step table.** It runs each step as
  *Run a step* says, in a fresh session or a subagent. It ends with one
  step report:
  - `done`, whose first evidence line is the pull request (D9);
  - `needs-input`, with the questions of the step that asked, and their
    recommendations. The child answers none itself (D2);
  - `failed`, whose reason starts `failed at <step name>: ` for a failed
    step, or `stopped: ` for any other stop (D9).
- **The epic run relays the child's questions.** It answers or asks
  each question under its own question mode, then starts the child again
  with the answers. The child gives them to the step that asked, and
  goes on (D2, D5).
- **The epic run settles the story from the child's report.** The story
  lines keep their forms. A `done` report needs the pull request to be
  ready for review: a draft or a missing pull request gives
  `stopped: the story run reported done, but <what the record holds>`.
  A failed reason in neither form, an exit 4 or an exit 6 gives
  `stopped: <reason>`. Each of these stops only that story, and
  *A stop in an epic run* goes on as today (D6, D7, D9).
- **The epic run prints only its own lines.** The user sees the
  `Picked` or `Resumed` line, the `Stacks on` line, the relayed
  questions and answers, and the story's line. The child's `Skipped`,
  `Done` and `Failed` lines stay in the child session, which is kept
  when it does not finish (D8).
- **No child session falls back to the epic run's own session.** When
  `lets delegate step run --for story` exits 3, the epic run prints one
  line saying no child session could start, and walks the story in its
  own session, as it does today (D4).
- Out of scope: running children in parallel (#S8) (D1).

No change is breaking. `story` is a new intent, `ask` is a new optional
field, and a run that is not an epic run behaves as before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-config`: *Every delegation names its intent* adds `story`
  to the intents of the `step` strategy.
- `delegate-instructions`: *The guidance comes from the config* reads
  `delegate.step.story.guidance` for `--for story`.
- `delegate-step`: the time limit is 600 minutes for `--for story`; a
  `needs-input` question may hold `ask: true`, which the printed report
  keeps.
- `lets-go`: an epic run starts each story run in a child session, and
  falls back to its own session on exit 3; a child `lets-go` session
  walks only the step table and ends with a step report; the epic run
  relays the child's questions and settles the story from its report.

## Impact

- **Code:** `lets/src/delegate/strategies.ts` (the `story` intent),
  `lets/src/delegate/step.ts` (its time limit),
  `lets/src/delegate/report.ts` (the `ask` field), and the help text in
  `lets/src/main.ts`. No resolver changes: the resolvers do not read the
  intent.
- **Skills:** `skills/lets-go/` — `SKILL.md`,
  `references/epic-run.md`, `references/step-prompt.md`,
  `references/subagent.md`, and a new reference file for the child's
  side of a story run.
- **Tests:** `tests/lets/delegate/` for the intent, the time limit and
  the field; `tests/skill-interfaces.bats` for the new prose.
- **Docs:** `README.md` (*What a step returns*, the config example and
  the epic paragraph) and `docs/resolvers.md`.
- **Glossary:** none further. Commit `385b2b3d` already says how an epic
  run starts a story run (D10).
- **Stack:** this change stacks on `epic-run-resume` (#282). Its
  `lets-go` deltas carry the text that change leaves in
  *An epic run picks each story as next picks it*.
