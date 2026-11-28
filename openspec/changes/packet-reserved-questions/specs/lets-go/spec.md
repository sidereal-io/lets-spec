## MODIFIED Requirements

### Requirement: The step prompt says what to run, the question mode, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch, the schema and the route line. For the shape step, the issue is `#<i>`, or `none yet` with the idea word for word, and the branch is the default branch. Its schema and route are left out, because *Route* has not run. For an idea whose open issue titles *Start from an idea* searched, the header SHALL also say that the search ran and no open issue is the same work. It SHALL say what to run in one sentence. For every step but shape: invoke the step's skill, as the step table names it, for the change and the issue, and stop where that skill stops. The skills are `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. For shape, the sentence is ``Invoke the `lets-shape` skill for issue #<i>, and stop where it stops.`` for an issue, and ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.`` for an idea. The prompt SHALL name no other skill, and no section of a skill, for any step. How `lets-shape` picks its path, resumes a discovery and asks its questions is `lets-shape`'s own, as the `discovery-checkpoints` capability says. `lets-plan` takes the route line from the prompt for the proposal's commit message. The prompt SHALL say the question mode, and what the `lets-go` session does with it. At `auto`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same in both modes. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, SHALL carry no recommendation. A question that the story's packet leaves to the user SHALL carry no recommendation either, as the `brainstorm-questions` capability says. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it. For shape, the issue comes first, as `issue #<i>: <title>`, or the parent and the stories, as `epic #<parent>: <title>` and `story #<story>: <title>` lines. For review plan, the verdict and the reviewed commit come first, as `Plan review: <verdict> for <sha>`.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `auto`
- **THEN** the file names `lets-plan`, `lets-go-chore`, `#149`, the route line, `auto`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`, and does not name `openspec-propose`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the plan prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the question mode is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-standard`
- **THEN** the file names the `lets-build` skill, says to stop where it stops, and names neither `lets-review-plan` nor `lets-review-build`

#### Scenario: The build prompt on lets-minimal
- **WHEN** `lets-go` writes the build prompt for a change whose schema is `lets-minimal`
- **THEN** the file names `lets-build` and does not name `lets-review-plan`

#### Scenario: The review build prompt
- **WHEN** `lets-go` writes the review build prompt
- **THEN** the file names the `lets-review-build` skill for the change, and names no section of `lets-build`

#### Scenario: The review plan prompt
- **WHEN** `lets-go` writes the review plan prompt for change `lets-go-story`, issue `#152`
- **THEN** the file names the `lets-review-plan` skill for `lets-go-story`, names `#152` and the route line, says the first evidence line is `Plan review: <verdict> for <sha>`, and names no `lets-build`

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: The prompt names a question the packet leaves to the user
- **WHEN** `lets-go` writes the plan prompt, at `auto` or at `ask`
- **THEN** its `## Questions` section says to give no recommendation for a question that asks the user to confirm something, and none for a question the packet leaves to the user

#### Scenario: A phase confirmation
- **WHEN** the shape step's discovery needs the user to confirm the journey map
- **THEN** its `needs-input` report lists that confirmation with no `recommendation`, and `lets-go` asks the user in either mode

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema and no route, and keeps the `## Questions` and report rules of the other prompts

#### Scenario: The shape prompt for an issue
- **WHEN** `lets-go` writes the shape prompt for `#180`
- **THEN** its `## What to run` section holds only ``Invoke the `lets-shape` skill for issue #180, and stop where it stops.``

#### Scenario: The shape prompt names no part of lets-shape
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file names no section of `lets-shape`, such as *Resume mode* or *Shape one issue*, and does not hold `Discovery status: in-progress` or `Run discovery on it?`
