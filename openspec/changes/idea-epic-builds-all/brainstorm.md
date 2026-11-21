<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#287 idea-epic-builds-all — an idea that discovery turns into an epic goes on to build all of its stories.
https://github.com/sidereal-io/lets-spec/issues/287

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which runs go on as an epic run after the shape step files a parent and its stories? | Every run where the parent is not the run's issue: an idea, and an issue that discovery turned into a new parent with `Input: #<i>`. Nothing then calls *Pick the first ready story*, so this story removes it, its `Picked #<i>: <title>, the first ready story under #<parent>.` line, its spec requirement and its tests, and updates `README.md:279`. | Assumption |
| D2 | Does this story close the gap that pull request #302 left (*Known gap, left for #287*)? | Yes. *Find the input's discovery* also looks for answers under the shape name of the input that the epic's `Input:` line names (`idea-<slug>`, whose prompt file holds that idea, or `issue-<n>`), and the shape step that finishes Finalize reuses those answers. It works only on the machine whose `.workspace/lets-go/` holds that answers file. | Assumption |
| D3 | Should `lets-go` ask before it builds every story that discovery filed from an idea? | No. It goes straight on to the epic run, as `lets-go #<epic>` and a shaped empty epic do: the user already confirmed the story table in discovery's Phase 5. | Assumption |
| D4 | Should the glossary's *Epic run* cover a run that was not given an epic? | Yes: "A `lets-go` run that builds the stories of one epic: the epic it was given, or the epic its shape step filed." The rest of the entry stays. Committed as 791e1fb6. | Assumption |
| D5 | Does this story change how an idea that becomes one issue runs? | No. That run still builds its one issue. | Evidence: #287 Scope |
| D6 | Does this story fix a stale answers file sending a finished epic back into `lets-shape`? | No. That is #137's, which replaces lets-go's copy of the lookup with `lets-shape`'s own. | Evidence: #302 body, code review finding 2 |
| D7 | Does the lookup for discovery get a new query? | No. The gap fix extends *Find the input's discovery* in `skills/lets-go/references/shape.md` and reuses the `epic` case 3 of *Check the issue*. | Evidence: #302 body, handoff from #283 |

## Changes from the story

- **Added: closing the gap that #302 left (D2).** An epic that an idea's discovery filed, and that stopped during Finalize, is now found by `lets-go #<epic>`. It is the resume path for the same runs this story changes, so it stays in this story.
- **Widened: an issue that discovery split also goes on as an epic run (D1).** The story's Scope, "when the shape step files a parent and its stories", covers both inputs. So *Pick the first ready story* goes away instead of staying for one input.
- **Added: the *Epic run* glossary entry now names the epic a shape step filed (D4).**

Confirmed by user: yes
