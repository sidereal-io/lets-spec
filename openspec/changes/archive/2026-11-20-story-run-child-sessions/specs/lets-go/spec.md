## ADDED Requirements

### Requirement: An epic run runs each story in a child session
After *Set the question mode* has set `<mode>` for the story the epic run picked, on the story's branch `<name>`, `lets-go` SHALL run the story's run in a child `lets-go` session, in this order:

1. Write the story prompt to `.workspace/lets-go/<name>-story-prompt.md`. Its first line SHALL be `You run a story run of a lets-go epic run: #<i>, for the change <name>, under #<parent>.` It SHALL name the issue and its URL, the branch `<name>`, `<schema>` and the route line, and SHALL say that the question mode is `<mode>`. It SHALL say that the epic run has already claimed the issue, routed it and entered the branch `<name>`, so the child claims nothing, routes nothing and stays on `<name>`. It SHALL tell the child to invoke the `lets-go` skill, and to end with one step report. For a stacked story it SHALL hold the `## Stack` section that the story's step prompts hold, with the same `<blocker>`, `<blocker-branch>` and `<blocker-pr>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section.
2. Remove `.workspace/lets-go/<name>-story-answers.yaml` and each `.workspace/lets-go/<name>-<step>-rounds.txt`, so the story run starts with no answers and no counted rounds. Do this only before the story's first child session in this run, never when relaying its questions.
3. Run `lets delegate step instructions --for story`, and rank its `options` as *Run a step* ranks a step's: the guidance first, then the order the options came in. When `options` is empty, pass its own family as the one model.
4. Run `lets delegate step run --for story --name <name>-story --prompt-file .workspace/lets-go/<name>-story-prompt.md --effort high`, with one `--model` per ranked option, best first, writing stdout to `.workspace/lets-go/<name>-story-report.json` and stderr to `.workspace/lets-go/<name>-story-meta.txt`.

While a child runs, the epic run SHALL print only its own lines: the `Picked` or `Resumed` line, the `Stacks on` line, the `Questions` line, the questions it relays and their answers, and the story's line. It SHALL NOT print the child's `Skipped`, `Done` or `Failed` lines.

#### Scenario: The story prompt
- **WHEN** an epic run on #278 has entered the branch `story-run-child-sessions` for #284, on `lets-standard`, at the question mode `auto`, stacked on #282, whose pull request #293 is from `epic-run-resume`
- **THEN** `.workspace/lets-go/story-run-child-sessions-story-prompt.md` starts with `You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.`, names `lets-standard` and the question mode `auto`, says that the epic run has already claimed #284, routed it and entered the branch, and holds a `## Stack` section with `--base epic-run-resume` and `Stacked on #293; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** the epic run writes the story prompt for #279, which has no open blocker
- **THEN** the story prompt holds no `## Stack` section

#### Scenario: The child's command
- **WHEN** `lets delegate step instructions --for story` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and its guidance is `null`
- **THEN** the epic run runs `lets delegate step run --for story --name story-run-child-sessions-story --prompt-file .workspace/lets-go/story-run-child-sessions-story-prompt.md --effort high --model claude/claude-opus-5-5 --model gpt/gpt-6-luna`

#### Scenario: Story guidance ranks the models
- **WHEN** `options` lists `claude/claude-opus-5-5` then `gpt/gpt-6-luna`, and the guidance is `Prefer gpt.`
- **THEN** the first `--model` is `gpt/gpt-6-luna`

#### Scenario: The story starts with no answers
- **WHEN** an earlier epic run left `.workspace/lets-go/story-run-child-sessions-story-answers.yaml` and `.workspace/lets-go/story-run-child-sessions-plan-rounds.txt`
- **THEN** the epic run removes both before the story's first `lets delegate step run --for story`

#### Scenario: The child's step lines stay in the child
- **WHEN** the child skips plan and runs build, which reports `done`
- **THEN** the epic run prints neither `Skipped plan:` nor `Done build:`

### Requirement: A story run's child walks only the step table
When the request starts with `You run a story run of a lets-go epic run:`, `lets-go` SHALL run as a story run's child. It SHALL take `<i>`, `<name>`, `<parent>`, `<schema>`, the route line, `<mode>` and any stack from the story prompt. When the current branch is not `<name>`, it SHALL end with a `failed` report whose reason is `stopped: the story run is on <branch>, not <name>`. Otherwise it SHALL run none of *Read the request*, *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, and SHALL claim nothing. It SHALL walk *The step table* from its top row on the branch `<name>`, as *Walk the step table* says, and run each step that is not done as *Run a step* says, the subagent step on exit 3 included. Each step's prompt SHALL hold `<mode>` from the story prompt, and the story prompt's `## Stack` section when it has one.

The child's part SHALL be written in `skills/lets-go/references/story-run.md`, whose first lines say to read it only in a story run's child session. *Read the request* in `SKILL.md` SHALL link it for a request that starts with the story prompt's first line.

#### Scenario: A child on its branch
- **WHEN** a child session starts on the branch `story-run-child-sessions` with a story prompt for #284
- **THEN** it runs no `lets backlog claim`, no *Route* and no *Set the question mode*, and reads the walk's three records first

#### Scenario: A child on another branch
- **WHEN** a child session starts on the branch `main` with a story prompt for the change `story-run-child-sessions`
- **THEN** it runs no step, and ends with a `failed` report whose reason is `stopped: the story run is on main, not story-run-child-sessions`

#### Scenario: A step prompt in a child
- **WHEN** the child writes the prompt for the plan step, and the story prompt says the question mode is `ask` and holds a `## Stack` section
- **THEN** the plan step's prompt says the question mode is `ask`, and holds the same `## Stack` section

#### Scenario: The child's part is in a reference file
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/story-run.md` and *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** the reference file says to read it only in a story run's child session, and *Read the request* links `references/story-run.md` beside the text `You run a story run of a lets-go epic run:`

### Requirement: A story run's child ends with one step report
A story run's child SHALL end its session with one step report, as the story prompt says, and SHALL print no pull request URL and no epic line in place of it:

- When the walk ends with every row done, it SHALL end with a `done` report whose first evidence line is `pull request #<pr>: <pr-url>`, the change's pull request.
- When a step fails, including a `done` report that its record does not bear out, it SHALL end with a `failed` report whose reason is `failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- At any other stop of the walk, such as records that disagree, a pull request that is merged or closed, a settled question asked again, or a `lets delegate step run` exit code that stops the walk, it SHALL end with a `failed` report whose reason is `stopped: <reason>`, where the reason is what the stop says.

#### Scenario: Every step done
- **WHEN** the child's review build step reports `done`, and its record shows the pull request #301 ready for review
- **THEN** the child ends with a `done` report whose first evidence line is `pull request #301: <pr-url>`

#### Scenario: Every step done before the child started
- **WHEN** every row of the walk is done when the child reads it
- **THEN** the child prints the four `Skipped` lines, and ends with a `done` report whose first evidence line names the pull request

#### Scenario: A failed build
- **WHEN** the build step reports `failed` with the reason `tests fail on main`
- **THEN** the child ends with a `failed` report whose reason is `failed at build: tests fail on main`

#### Scenario: Records that disagree
- **WHEN** the child finds an archive folder and `openspec/changes/<name>/` both present
- **THEN** the child ends with a `failed` report whose reason starts `stopped: `

### Requirement: A story run's child passes its steps' questions up
A story run's child SHALL answer no step's question, at either question mode. When a step reports `needs-input`, the child SHALL first apply the settled-question stop of *Relay the questions*. Otherwise it SHALL append one line to `.workspace/lets-go/<session>-rounds.txt`, and count the step's rounds in this story run as the lines in that file. It SHALL end with a `needs-input` report that holds the step's questions, in the step's order, each with the step's `recommendation` when it has one. From the step's sixth round, each question SHALL also hold `ask: true`.

When the story prompt ends with an `## Answers` section, the child SHALL give those answers to the step they answer: at the first row of the walk that is not done, when that step's `.workspace/lets-go/<session>-report.json` holds a `needs-input` report, it SHALL append each answer pair whose question is one of that report's questions to `.workspace/lets-go/<session>-answers.yaml`, as *Relay the questions* writes pairs, then run the step with `--answers-file` that file, in place of the row's *Not done* action, and read its report. Before it writes any pair, it SHALL check that report. When the report is not `needs-input`, or a pair matches no question of that report, the child SHALL write nothing, run no step, and end with a `failed` report whose reason is `stopped: the answers match no question the <step name> step asked`.

#### Scenario: A question with a recommendation at auto
- **WHEN** the story prompt says the question mode is `auto`, and the plan step reports `needs-input` with one question that has a recommendation
- **THEN** the child answers nothing, appends a line to `.workspace/lets-go/<name>-plan-rounds.txt`, and ends with a `needs-input` report holding that question and its recommendation, with no `ask`

#### Scenario: The sixth round
- **WHEN** `.workspace/lets-go/<name>-plan-rounds.txt` holds five lines, and the plan step reports `needs-input` again
- **THEN** the child ends with a `needs-input` report each of whose questions holds `ask: true`

#### Scenario: The answers reach the step
- **WHEN** the child starts with a story prompt whose `## Answers` section holds the answer to `Which schema?`, plan is the first row not done, and `.workspace/lets-go/<name>-plan-report.json` holds a `needs-input` report asking `Which schema?`
- **THEN** the child appends that pair to `.workspace/lets-go/<name>-plan-answers.yaml`, and runs the plan step with `--answers-file .workspace/lets-go/<name>-plan-answers.yaml`

#### Scenario: Answers to no open question
- **WHEN** the story prompt's `## Answers` section answers `Which schema?`, and the plan step's last report asked only `Do you confirm the ledger?`
- **THEN** the child runs no step, and ends with a `failed` report whose reason is `stopped: the answers match no question the plan step asked`

#### Scenario: A settled question asked again
- **WHEN** the plan step's `needs-input` report asks a question whose exact text is in `.workspace/lets-go/<name>-plan-answers.yaml`
- **THEN** the child ends with a `failed` report whose reason starts `stopped: `, and passes no question up

### Requirement: The epic run relays a story run's questions
When the child's report is `needs-input`, the epic run SHALL go through its questions in the report's order:

- A question that holds `ask` true SHALL go to the user, with its `recommendation` as the suggested answer, whatever `<mode>` is, and its answer SHALL be written as the user gave it, with no marker. Before the first such question of a report, the epic run SHALL print `Questions: ask for the rest of this step, because it asked for input five times.`
- Every other question SHALL go as `<mode>` says, as *Relay the questions* does: at `auto`, a question with a `recommendation` takes it as the answer, with the marker ` (lets-go accepted the step's recommendation; the user did not decide)`, and one without goes to the user; at `ask`, every question goes to the user.

The epic run SHALL then write this report's pairs, in order, to `.workspace/lets-go/<name>-story-answers.yaml`, replacing what it held, and run the child again with steps 3 and 4 of *An epic run runs each story in a child session*, with the same prompt file and `--answers-file .workspace/lets-go/<name>-story-answers.yaml`. It SHALL ask for the options again, and rank them again. It SHALL NOT write the story prompt again, and SHALL NOT remove the story's answers file or rounds files.

#### Scenario: Auto with a recommendation
- **WHEN** `<mode>` is `auto`, and the child's report asks `Which schema?` with the recommendation `lets-minimal`
- **THEN** the epic run says it answered `Which schema?` with `lets-minimal`, writes the answer `lets-minimal (lets-go accepted the step's recommendation; the user did not decide)`, and runs the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`

#### Scenario: A marked question at auto
- **WHEN** `<mode>` is `auto`, and the child's report asks one question with a recommendation and `ask` true
- **THEN** the epic run prints `Questions: ask for the rest of this step, because it asked for input five times.`, asks the user that question with the recommendation as the suggested answer, and writes the user's answer with no marker

#### Scenario: Each round replaces the answers file
- **WHEN** the epic run relays a second `needs-input` report from the same story
- **THEN** `.workspace/lets-go/<name>-story-answers.yaml` holds only the second report's pairs

#### Scenario: A relay keeps the counted rounds
- **WHEN** `.workspace/lets-go/<name>-plan-rounds.txt` holds two lines, and the epic run relays the child's `needs-input` report
- **THEN** the epic run runs the child again with `--answers-file .workspace/lets-go/<name>-story-answers.yaml`, and `.workspace/lets-go/<name>-plan-rounds.txt` still holds its two lines

### Requirement: The epic run settles a story from its child's report
When `lets delegate step run --for story` ends, the epic run SHALL settle the story, as *Settle a story* says, from its exit code and the report:

- **Exit 0, `done`:** it SHALL read the pull request with `gh pr view <name> --json url,state,isDraft`. When the pull request is open and not a draft, it SHALL settle the story with its built line, or with its stacked line while the story is stacked. Otherwise the line SHALL be `stopped: the story run reported done, but <what the record holds>`, such as `the pull request is a draft` or `the branch has no pull request`.
- **Exit 0, `failed`:** a reason that starts `failed at <step name>: ` or `stopped: ` SHALL be the text after the story's name in its line. Any other reason, including one that `lets` wrote because the child gave no valid report, SHALL give `stopped: <reason>`.
- **Exit 2, 4 or 6:** the line SHALL be `stopped: <reason>`, where the reason is the error `lets delegate` printed on stderr. A child that did not finish in time is one.
- **Exit 3:** nothing is settled from the child. The epic run SHALL go on as *With no child session, the epic run walks the story itself* says, and settle the story when that walk ends.

Every line but a built or stacked line is a stop in a story run: after settling the story, the epic run SHALL go on as *A failure or a stop skips only the stories that depend on it* says, from its third action. The epic run SHALL NOT start the child again for that story in this run.

#### Scenario: A built story
- **WHEN** the child for #284 ends with a `done` report, and `gh pr view story-run-child-sessions` shows the pull request open and not a draft
- **THEN** the epic run settles #284 with `#284 story-run-child-sessions: <pr-url>`, or with `, stacked on #<blocker>` after it while #284 is stacked

#### Scenario: Done, but the pull request is a draft
- **WHEN** the child ends with a `done` report, and the pull request is a draft
- **THEN** the story's line is `#<story> <story-name>: stopped: the story run reported done, but the pull request is a draft`

#### Scenario: A failed step in the child
- **WHEN** the child ends with a `failed` report whose reason is `failed at review build: the review found two blockers`
- **THEN** the story's line is `#<story> <story-name>: failed at review build: the review found two blockers`, and the stories that depend on it get their `depends on` lines

#### Scenario: A report lets could not read
- **WHEN** `lets delegate step run --for story` prints a `failed` report whose reason is `the final message has no step-report block`
- **THEN** the story's line is `#<story> <story-name>: stopped: the final message has no step-report block`

#### Scenario: The child times out
- **WHEN** `lets delegate step run --for story` exits 6
- **THEN** the story's line starts `#<story> <story-name>: stopped: `, the epic run checks the checkout, and picks the next story when it is clean

### Requirement: With no child session, the epic run walks the story itself
When `lets delegate step run --for story` exits 3, the epic run SHALL print `No child session could start for #<i>, so this session walks its steps.` It SHALL then walk the story's step table in its own session, as *Walk the step table* says, with each step in a fresh session or a subagent, as *Run a step* says, and settle the story as *Run the epic* does today. It SHALL NOT run the story prompt in a subagent, even when the meta file names a saved prompt.

When the child exits 3 after the epic run relayed its questions, the epic run SHALL first give the pairs of `.workspace/lets-go/<name>-story-answers.yaml` to the step that asked, as the child does with an `## Answers` section: at the first row that is not done, it SHALL check the step's last report and append the pairs to `.workspace/lets-go/<session>-answers.yaml`, or stop the story's run when a pair matches none of its questions. That step's count of `needs-input` reports SHALL start from the lines in its `.workspace/lets-go/<session>-rounds.txt`.

#### Scenario: Only the default resolver
- **WHEN** the config lists only `subagent`, and the epic run starts the child for #279
- **THEN** `lets delegate step run --for story` exits 3, the epic run prints `No child session could start for #279, so this session walks its steps.`, runs #279's plan step with `lets delegate step run --for plan`, and starts no subagent with the story prompt

#### Scenario: Exit 3 after a relay keeps the answers
- **WHEN** the epic run relays the plan step's question `Which schema?`, writes its answer to `.workspace/lets-go/<name>-story-answers.yaml`, and the child's next run exits 3
- **THEN** the epic run appends that pair to `.workspace/lets-go/<name>-plan-answers.yaml`, and runs the plan step in its own walk with `--answers-file .workspace/lets-go/<name>-plan-answers.yaml`

## MODIFIED Requirements

### Requirement: An epic run starts on an epic with open stories
When *Confirm the packet* returns `epic` for the run's issue, and the run started on the default branch, `lets-go` SHALL start an epic run on that epic, `#<parent>`. On a change's branch it SHALL say that an epic run needs the default branch, and stop: an epic has no change's branch. The epic's stories SHALL be the open sub-issues that `lets backlog item <parent>` printed in *Check the issue*, in the order it printed them. They SHALL stay the same set for the whole epic run: a sub-issue added or closed during the run does not change it. `lets-go` SHALL claim nothing on the epic, and create no branch for it: it claims each story it builds, as for any picked issue. Before the epic run starts, *Check the issue* SHALL run only these checks on the epic:

- the blocker read and the open-blocker decision, as for any issue. An epic has no change's branch, so `lets-go` SHALL not look for one. An open blocker on the epic SHALL stop the run, as for an issue with no branch;
- *Confirm the packet*, which returns `epic` from the Kind alone.

It SHALL not run *Find the source of demand* or *Check the prerequisite* on the epic. Each story's own *Check the prerequisite* runs when the epic run ranks it.

Each story run SHALL run in a child `lets-go` session, as *An epic run runs each story in a child session* says. This change does not shape an empty epic, though the glossary's *Epic run* entry names it. An epic with no open stories SHALL go as *An epic with no open stories points to lets-shape* says; #283 shapes it.

#### Scenario: An epic with open stories
- **WHEN** the user runs `lets-go #278` on the default branch, #278's Kind is Epic, it has no open blocker, and it has the open sub-issues #279 to #287
- **THEN** `lets-go` starts an epic run whose stories are #279 to #287, in that order, and claims nothing on #278

#### Scenario: An epic with an open blocker
- **WHEN** the user runs `lets-go #278` on the default branch, and #278 is blocked by the open issue #263
- **THEN** `lets-go` says that #263 blocks #278, starts no epic run, and claims nothing

#### Scenario: The epic's own glossary handoff is not checked
- **WHEN** #278's body has a **Glossary handoff** that names #279 as the owner of its definitions, and #279's pull request has not merged
- **THEN** `lets-go` runs no *Check the prerequisite* on #278, and starts the epic run

#### Scenario: The checks on the epic come before the epic run
- **WHEN** the skill-interfaces test reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it says that an epic has no change's branch to look for, and that *Find the source of demand* does not run for an epic, and its `epic` case links `#run-the-epic`

### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*. The candidates SHALL be the epic's stories that are in this repository and not yet settled, and no other issue. `lets-go` SHALL pass the epic's stories in this repository to `lets backlog ready` as `--only`, every story already settled as `--exclude`, every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, and every story not settled yet that has its change's branch as `--started`, as *An epic run resumes the stories this user started* says, such as `lets backlog ready --only 279,280,281 --exclude 279 --met-blockers 279 --started 281`. With no story settled it SHALL pass no `--exclude`, with no met story no `--met-blockers`, and with no such branch no `--started`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.`, or the `Resumed` line for a story passed in `--started`. It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, in this session. It SHALL then run the story's run in a child session, as *An epic run runs each story in a child session* says. When the story's run has ended with its pull request ready for review, `lets-go` SHALL settle the story with its line, as *The epic run settles a story from its child's report* says, run `git switch <default>`, and pick again. It SHALL rank the stories again for every pick, because a story built in this run can change what is ready.

When the case returns `nothing-ready`, every story not yet settled SHALL get its `not built` line, in the epic's order, and the epic run SHALL end as *An epic run ends with one line per story* says.

#### Scenario: The first pick
- **WHEN** an epic run on #278 starts, #279 is the only story that `lets backlog ready --only 279,280,281,282,283,284,285,286,287` lists, and its prerequisite and packet pass
- **THEN** `lets-go` prints `Picked #279: epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story, the next ready story under #278.`, reads #279's blockers, and runs *Claim* for it

#### Scenario: The next pick leaves out the settled stories
- **WHEN** the epic run has built #279, and settles it with its line
- **THEN** `lets-go` runs `git switch` to the default branch, then `lets backlog ready` with `--only` naming the epic's stories, `--exclude 279`, and `--met-blockers 279` when #279's pull request is open and ready for review

#### Scenario: A started story in the pick
- **WHEN** an epic run on #278 starts, nothing is settled at the start, and only #282's change's branch `epic-run-resume` exists, on `origin`
- **THEN** the first pick runs `lets backlog ready --only 279,280,281,282,283,284,285,286,287 --started 282`

#### Scenario: A candidate whose packet is not complete
- **WHEN** `lets backlog ready` lists #281 and #282, and *Confirm the packet* returns `needs-shape` for #281
- **THEN** `lets-go` picks #282, runs no shape step for #281, and #281 is not settled yet

#### Scenario: A sub-issue in another repository
- **WHEN** the epic's open sub-issues are #279 and `other-org/tools#5`
- **THEN** `lets-go` passes `--only 279`, and `other-org/tools#5` gets `not built, in another repository`

#### Scenario: The story runs in a child session
- **WHEN** the epic run has claimed #279 and entered its branch `epic-run-skeleton`
- **THEN** `lets-go` runs `lets delegate step run --for story` for #279, and walks none of #279's steps in its own session

#### Scenario: No child session
- **WHEN** the epic run builds #279, and `lets delegate step run --for story` exits 3
- **THEN** the epic run walks #279's step table in its own session, and runs each step as *Run a step* says, as *With no child session, the epic run walks the story itself* says

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea*, *Run the shape step* and *Pick the first ready story*, *Commit the discovery map*, the `<shape-name>` and `<slug>` rules of *The change's name*, and *What shape runs* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the four parts. *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the three shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** it finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *What shape runs* and *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`

#### Scenario: A part whose steps moved
- **WHEN** the skill-interfaces test reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** the skill-interfaces test reads the *Run the epic* section of `SKILL.md`
- **THEN** it links `references/epic-run.md#run-the-epic`, its last paragraph starts `Next:`, `references/epic-run.md` has a heading `Run the epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run

#### Scenario: The prompt frame is one block to copy
- **WHEN** the skill-interfaces test reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a heading `Records that disagree`
- **THEN** the check fails, and its output names `Records that disagree`

#### Scenario: The child's part is in its file
- **WHEN** the skill-interfaces test lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session. It SHALL follow the saved prompt, work only in this repository, on the branch `<name>` or, for shape, on the default branch, and make only the changes that the step calls for. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question`, an optional string `recommendation` and an optional boolean `ask`, by the rule `lets` uses: `ask: true` is kept, `ask: false` is dropped, and any other value breaks the report, which names `questions[<i>].ask`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<session>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: What the subagent may change
- **WHEN** the skill-interfaces test reads *Run a step in a subagent*
- **THEN** it says that the subagent follows the saved prompt, works only in this repository on the branch `<name>`, and makes only the changes that the step calls for, and it does not say `may write files`

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

#### Scenario: A subagent's marked question
- **WHEN** the subagent's block holds `outcome: needs-input` and one question with `ask: true`
- **THEN** `.workspace/lets-go/<session>-report.json` holds that question with `"ask":true`
