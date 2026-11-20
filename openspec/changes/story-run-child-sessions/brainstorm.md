<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#284 story-run-child-sessions — each story run is a child lets-go session, and its questions reach the user through the epic run.
https://github.com/sidereal-io/lets-spec/issues/284

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is in and out of scope? | In: a `story` intent for `lets delegate step`; `lets-go` run as a child ends with a step report (done with the pull request, needs-input or failed); the child passes its steps' questions up, and the epic run relays them and sends the answers back. Out: running children in parallel (#S8). | Evidence: #284 packet, Scope |
| D2 | Who applies the question mode to a story's questions? | The epic run, under its own question mode. The child answers no question itself: it passes each one up, with the step's recommendation. | Evidence: #284 packet, Scope |
| D3 | Where does the epic run hand a story to its child session? | The epic run picks the story, reads its blockers, stacks it, routes it and enters the branch (claim, branch, glossary import). It then starts the child on that branch, and the child only walks the step table. The child's prompt carries the stack (blocker, branch, pull request) for its step prompts' `## Stack` section. A lost claim and the stack decision stay in the epic run. | Assumption |
| D4 | What does the epic run do when no resolver can start the child (`lets delegate step run --for story` exits 3)? | It walks that story in its own session, as it does today, and prints one line saying that no child session could start. Each step still gets a fresh session or a subagent; only the context saving is lost. | Assumption |
| D5 | Does the limit of five needs-input rounds per step still hold inside a story run? | Yes, per step, as today. The child works out the count from what the shared checkout holds. From that step's sixth round it marks the questions it passes up, and the epic run asks the user each marked question, with the recommendation as the suggested answer. | Assumption |
| D6 | How long may a story run's child session take? | 600 minutes by default for `--for story`; `--timeout-minutes` still overrides it. A timeout stops only that story, whose line is `stopped: <reason>`. | Assumption |
| D7 | What does any other stop of the child, such as exit 4 or 6, do to the epic run? | It ends only that story's run, as any stop in a story run does today, and the story's line is `stopped: <reason>`. | Evidence: skills/lets-go/references/epic-run.md, A stop in an epic run |
| D8 | What does the user see in the epic run while a child runs? | Only the epic run's own lines: the Picked or Resumed line, the Stacks on line, the relayed questions and answers, and the story's line. The child's Skip, Done and Failed lines stay in the child session, which is kept when it does not finish. | Assumption |
| D9 | How does the epic run build a story's line from the child's report? | The lines stay as they are now. A failed reason that starts `failed at <step name>: ` or `stopped: ` is used as the text after the story's name. Any other failed reason, including a report `lets` could not read, gives `stopped: <reason>`. A done report whose pull request is a draft or missing gives `stopped: the story run reported done, but <what the record holds>`. The epic run reads the pull request's URL itself, so the child's done evidence needs only the pull request as its first line. | Assumption |
| D10 | How does the glossary describe `--for story`? | In *Story run*: an epic run starts each story run with `lets delegate step run --for story`, which uses the `step` delegate strategy and reads the step report the child ends with; the `story` intent names no step. In *Step*: `--for` also takes `story`, which runs a story run, not a step. Written to `openspec/glossary.md` in commit `385b2b3d`. | Assumption |
| D11 | Does the user's lets config take guidance for the `story` intent? | Yes, as `delegate.step.story.guidance`, the same as the five step intents. The epic run ranks the models for the child the way *Run a step* does, with `--effort high`. | Assumption |

## Changes from the story

None. The story stands as written. D4 settles the packet's open question on how far delegation can nest.

Confirmed by user: yes
