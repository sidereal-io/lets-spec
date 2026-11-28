<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#342 plan-records-its-author — the plan step records its model family, so review plan picks another family on evidence.
https://github.com/sidereal-io/lets-spec/issues/342

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What is in scope? | In: a plan step that `lets-go` runs records its model family where review plan reads it, and review plan reads it. Out: plans written by hand, and the build and review build steps. | Evidence: #342 body, Scope |
| D2 | Where does the plan step leave the record? | A `Co-Authored-By` trailer on every commit the plan step makes, naming its family and model. Review plan already reads these trailers, and a resumed round on another family records itself too. A line in the pull request body was ruled out: lets-go would start writing the body, and a round that stops before the draft pull request exists has nowhere to put it. | Assumption |
| D3 | Where does the trailer's family and model come from? | The plan step session's own model identity. `lets delegate step run` and the delegate-step spec do not change. | Assumption |
| D4 | After a plan step reports done, does lets-go compare the trailers' families with the family on the step's meta line? | No. Review plan reads the trailers either way, and a check would add a stop with no agreed fix. | Assumption |
| D5 | What does review plan do when no plan commit carries a trailer? | It keeps its current fallback: a session that cannot ask takes its own family, and the report says the author was not recorded. Plans written by hand still reach it. | Evidence: #342 body, Scope; skills/lets-review-plan/SKILL.md, Find the author |

## Changes from the story

None

Confirmed by user: no
