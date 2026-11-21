## MODIFIED Requirements

### Requirement: The step's session ends its final message with a step report
A step report SHALL be a fenced code block tagged `step-report`, holding one YAML mapping, at the end of the session's final message. The block SHALL open with a line of three or more backticks followed by `step-report`. It SHALL close with a line of at least as many backticks and nothing else, so a shorter fence inside the block does not close it. The mapping SHALL hold `outcome`, one of `done`, `needs-input` or `failed`. A `done` report SHALL hold `evidence`, a non-empty list of strings. A `needs-input` report SHALL hold `questions`, a non-empty list of mappings, each with a string `question`, an optional string `recommendation` and an optional boolean `ask`. `ask: true` marks a question that the caller asks the user whatever its question mode. A `failed` report SHALL hold a string `reason`. `lets delegate step run` SHALL read the last such block in the final message. It SHALL ignore the text before the block and after it.

#### Scenario: A done report
- **WHEN** the final message ends with a `step-report` block holding `outcome: done` and `evidence` listing `commit 3f2a1c0` and `pull request #164`
- **THEN** `lets delegate step run` reads a `done` report with those two evidence lines

#### Scenario: A needs-input report with a recommendation
- **WHEN** the block holds `outcome: needs-input` and one question `Which schema?` with the recommendation `lets-minimal`
- **THEN** the report read has one question, `Which schema?`, with the recommendation `lets-minimal`

#### Scenario: A needs-input report without a recommendation
- **WHEN** the block holds `outcome: needs-input` and one question with no `recommendation`
- **THEN** the report read has that question, and no recommendation

#### Scenario: A fence inside the block
- **WHEN** the block opens with four backticks and `step-report`, a `reason` inside it quotes three lines fenced with three backticks, and the block closes with four backticks
- **THEN** the report is read whole, and its `reason` holds the quoted lines

#### Scenario: Prose before the block
- **WHEN** the final message holds two paragraphs of prose, then a valid `step-report` block
- **THEN** the report is read from the block, and the prose is not part of it

#### Scenario: A question marked for the user
- **WHEN** the block holds `outcome: needs-input` and one question `Which schema?` with the recommendation `lets-minimal` and `ask: true`
- **THEN** the report read has that question, its recommendation, and `ask` true

#### Scenario: An ask that is not a boolean
- **WHEN** the block holds `outcome: needs-input` and one question with `ask: "yes"`
- **THEN** the report read is `failed`, and its `reason` names `questions[0].ask`

### Requirement: The command prints the report as one JSON line
When the session ends with a valid step report, `lets delegate step run` SHALL exit 0 and print the report on stdout as one JSON line whose first field is `outcome`. A `done` report SHALL also carry `date`: the time `lets` printed it, in ISO 8601 UTC, such as `2026-11-04T09:30:00Z`. A `needs-input` report's `questions` SHALL keep their order, each `recommendation` given, and `"ask":true` on each question marked `ask: true`. A question with `ask: false`, or with no `ask`, SHALL have no `ask` in the line. Exit 0 SHALL mean that a report is on stdout, whatever its outcome.

#### Scenario: A done report with its date
- **WHEN** the session ends with a `done` report, and the clock reads `2026-11-04T09:30:00Z`
- **THEN** stdout is one JSON line starting `{"outcome":"done",` that holds `"evidence"` and `"date":"2026-11-04T09:30:00Z"`

#### Scenario: A needs-input report
- **WHEN** the session ends with a `needs-input` report holding two questions, the second with a recommendation
- **THEN** the command exits 0, and stdout is one JSON line starting `{"outcome":"needs-input",` whose `questions` has the two questions in order, the second with its `recommendation`

#### Scenario: A failed report from the session
- **WHEN** the session ends with a `failed` report whose reason is `tests fail on main`
- **THEN** the command exits 0, and stdout is one JSON line starting `{"outcome":"failed",` with `"reason":"tests fail on main"`

#### Scenario: A needs-input report with a marked question
- **WHEN** the session ends with a `needs-input` report holding two questions, the first with `ask: true` and the second with `ask: false`
- **THEN** stdout is one JSON line whose first question holds `"ask":true`, and whose second question holds no `ask`

### Requirement: The step's time limit
`lets delegate step run` SHALL give the session 120 minutes at every effort for each of the five steps, and 600 minutes for `--for story`, unless `--timeout-minutes` gives another whole number of minutes.

#### Scenario: The default
- **WHEN** the user runs `lets delegate step run --for build --effort low` with the other required options
- **THEN** the resolver is asked for a session with a time limit of 120 minutes

#### Scenario: The story default
- **WHEN** the user runs `lets delegate step run --for story --effort high` with the other required options
- **THEN** the resolver is asked for a session with a time limit of 600 minutes

#### Scenario: An override
- **WHEN** the user adds `--timeout-minutes 30`
- **THEN** the resolver is asked for a session with a time limit of 30 minutes

#### Scenario: An override for a story
- **WHEN** the user runs `lets delegate step run --for story --timeout-minutes 900` with the other required options
- **THEN** the resolver is asked for a session with a time limit of 900 minutes

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step run --help`
- **THEN** the output says a step has 120 minutes and a story 600, unless `--timeout-minutes` says otherwise
