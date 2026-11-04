## Purpose

Says what the `lets-go` skill does for a shaped chore: where it starts, what it skips and how it says so, which interactivity level it picks, how it runs each step and reads its report, how it relays a step's questions to the user, and how the run ends.

## ADDED Requirements

### Requirement: lets-go takes one issue number
`lets-go` SHALL take one issue number. When it is given none, it SHALL say that it needs an issue number, and stop. It SHALL take the issue as `lets-build`'s *Find the source of demand* takes a named issue, and SHALL name that section rather than restate it.

#### Scenario: No issue number
- **WHEN** the user runs `lets-go` with no issue number
- **THEN** `lets-go` says it needs an issue number, and claims nothing

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as `lets-build`'s *Find the source of demand* does for a named issue

### Requirement: lets-go runs on the default branch, for a Chore
`lets-go` SHALL run only on the repository's default branch. On any other branch it SHALL say that `lets-build` carries that branch's change on, say that #150 adds resuming a run, and stop. It SHALL run only for an issue whose Kind is Chore. It SHALL check the Kind where `lets-build`'s *Confirm the packet* has just read the issue's fields from the Project, before any later check of that section. For a Story or a Bug it SHALL say that #152 adds those Kinds, point to `lets-build`, and stop. A stop that `lets-build` makes earlier, such as an unresolved glossary prerequisite, SHALL stand as `lets-build` reports it.

#### Scenario: A change's branch
- **WHEN** the current branch is `lets-go-chore`, not the default branch
- **THEN** `lets-go` says to run `lets-build` on that branch, names #150, and claims nothing

#### Scenario: A Story
- **WHEN** *Confirm the packet* reads the issue's fields and its Kind is Story
- **THEN** `lets-go` names #152, says to run `lets-build`, reads no parent epic, and claims nothing

### Requirement: Start reuses lets-build
`lets-go` SHALL run `lets-build`'s *Find the source of demand*, *Confirm the packet*, *Route* and *Claim* in its own session, by naming those sections. It SHALL add no check of its own to them other than the Kind check. It SHALL add one command of its own: `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null. Start SHALL not be a step: it SHALL run no `lets delegate step` command and SHALL produce no step report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route* and *Claim* named as sections of `lets-build`, finds `gh issue view <i> --json createdAt`, and finds no `gh project item-edit` command

#### Scenario: Claim fails
- **WHEN** `lets-build`'s *Claim* finds that someone else has the issue
- **THEN** `lets-go` says who has it and stops, as `lets-build` does, and runs no step

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* passes, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.` `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* fails, `lets-go` SHALL say to run `lets-shape` on #<i>, as `lets-build` does, and stop. It SHALL not run shape as a step.

#### Scenario: An edited packet
- **WHEN** issue `#149`'s body was last edited on 2026-11-04
- **THEN** `lets-go` prints `Skipped shape: #149's packet is complete, last edited 2026-11-04.`

#### Scenario: A packet never edited
- **WHEN** the issue's `lastEditedAt` is null and `gh issue view <i> --json createdAt` says it was created on 2026-11-03
- **THEN** the skip line's date is `2026-11-03`

#### Scenario: A packet with a missing line
- **WHEN** the packet lacks its one-line outcome
- **THEN** `lets-go` says to run `lets-shape` on the issue, prints no skip line, and claims nothing

### Requirement: Propose review is reported as not in the route
When the route is `lets-minimal`, `lets-go` SHALL print `Skipped propose review: not in the lets-minimal route.` after the propose step is done, and before the apply step. That line SHALL carry no date.

#### Scenario: A chore's route
- **WHEN** the route is `lets-minimal` and the propose step reports `done`
- **THEN** `lets-go` prints `Skipped propose review: not in the lets-minimal route.` and goes on to apply

### Requirement: lets-go picks the interactivity level and says why
Before the first step, `lets-go` SHALL print `Interactivity: recommend, because #<i> is a Chore.` It SHALL put the level, and what it means for the step, into every step prompt.

#### Scenario: The level line
- **WHEN** issue `#149` is a Chore and Start has claimed it
- **THEN** `lets-go` prints `Interactivity: recommend, because #149 is a Chore.` before it runs propose

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run propose, apply and apply review, in that order. For each step it SHALL write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`. `<name>` is the change's name, and `<step>` is `propose`, `apply` or `apply-review`. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <name>-<step> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. Stdout SHALL go to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `.workspace/lets-go/<name>-<step>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for propose` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for propose --name lets-go-chore-propose` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A timeout
- **WHEN** `step run` exits 6
- **THEN** `lets-go` shows the user the meta file, names the step, and stops without running the step again

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session, and may write files. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<name>-<step>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<name>-<step>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for apply` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-apply.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch and the schema. It SHALL say what to run. For propose: the `openspec-propose` skill for the change, for the issue, with the route line. It continues the change when it already exists, and does not offer the handoff. For apply: the `lets-build` skill on the branch. It stops when every task is ticked, and does not finish the change. For apply review: the *Finish the change* section of the `lets-build` skill. The prompt SHALL say the interactivity level. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section: each answer settles its question; an answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`; an answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`
- **THEN** the file names `openspec-propose`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the apply prompt
- **THEN** the file says to stop when every task is ticked, and not to run *Finish the change*

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

### Requirement: lets-go relays a needs-input report at the recommend level
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

#### Scenario: A mixed report
- **WHEN** the propose step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for propose` again with `--answers-file .workspace/lets-go/lets-go-chore-propose-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. On a `failed` report it SHALL show the reason, name the step and the branch, say that running `lets-build` on the branch carries on, and stop. It SHALL not run a failed step again.

#### Scenario: A failed apply
- **WHEN** the apply step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `apply` and the branch, says to run `lets-build` on the branch, and runs no apply review

#### Scenario: A repeated question
- **WHEN** the resumed propose step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

### Requirement: Apply review ends the run
The apply review step SHALL run `lets-build`'s *Finish the change*: the project's finishing rules, verify, archive, and marking the pull request ready. When it reports `done`, `lets-go` SHALL print one line per step, in order. A skipped step prints `Skipped <step>: <reason>`, with its date where it has one. A done step prints `Done <step>: <date>` followed by the report's evidence. A failed step prints `Failed <step>: <reason>`. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`.

#### Scenario: A finished run
- **WHEN** apply review reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, propose, propose review, apply and apply review, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them: `Skipped shape: #<i>'s packet is complete, last edited <date>.`, `Skipped propose review: not in the lets-minimal route.`, `Interactivity: recommend, because #<i> is a Chore.`, `.workspace/lets-go/<name>-<step>-prompt.md`, `.workspace/lets-go/<name>-<step>-answers.yaml`, `--answers-file`, `.workspace/lets-delegate/<name>-<step>.prompt.md`, `step-report`, `asked a settled question again`, and `**3**: no fresh session can run here`.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists

### Requirement: lets-go ships in both flows as an entry point
Both flows in `flows.json` SHALL ship `lets-go`. The routing table in `overlays/AGENTS.md` SHALL hold a row whose request is `Take a shaped chore to a ready pull request in one run` and whose answer is `The \`lets-go\` skill`, in that table's form. The README's usage table SHALL hold a row with the same request and the answer `\`lets-go\``, in that table's form. The skill-interfaces test SHALL count `lets-go` as an entry point, which no schema, config or skill needs to name.

#### Scenario: The flows
- **WHEN** the skill-interfaces test reads `flows.json`
- **THEN** `standard` and `minimal` both list `lets-go` in `skills`

#### Scenario: The routing rows
- **WHEN** the skill-interfaces test reads `overlays/AGENTS.md` and `README.md`
- **THEN** each holds a row whose request is `Take a shaped chore to a ready pull request in one run` and whose answer names `lets-go`
