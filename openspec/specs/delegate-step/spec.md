# delegate-step Specification

## Purpose
Says what `lets delegate step run` does: the kind of session it asks a resolver for, the step report it reads from that session and prints, its exit codes, and how a caller resumes a step with answers.

## Requirements

### Requirement: A step runs in a session that may write files
`lets delegate step run --for <step>` SHALL ask the resolver that answers for a `step` session: one that may write files in the repository, and whose final message the resolver waits for. It SHALL send the normalized `--name`, the prompt, the repository root as the working directory, the family and model of `--model`, and `--effort`. It SHALL NOT compare the tree before and after the session, and SHALL NOT fail because the session changed files. An adapter without `step` declines every step, and the next resolver in the chain answers.

#### Scenario: The resolver is asked for a step session
- **WHEN** the config lists `t3`, which runs steps, and the user runs `lets delegate step run --for build --name Build X --prompt-file p.md --effort high --model gpt/gpt-6-luna`
- **THEN** `t3` is asked for a `step` session named `build-x`, with the prompt, the repository root, the family `gpt`, the model `gpt-6-luna` and the effort `high`

#### Scenario: The session changed files
- **WHEN** the resolver's step session ends with a `done` report, and `git status` shows files changed outside `.workspace/`
- **THEN** `lets delegate step run` exits 0 and prints the report

#### Scenario: A resolver that runs no step
- **WHEN** the config lists `t3`, which runs no step, then `subagent`, and the user runs `lets delegate step run --for plan` with every required option
- **THEN** `t3` is not asked for a session, and the default answers

### Requirement: The step's session ends its final message with a step report
A step report SHALL be a fenced code block tagged `step-report`, holding one YAML mapping, at the end of the session's final message. The block SHALL open with a line of three or more backticks followed by `step-report`. It SHALL close with a line of at least as many backticks and nothing else, so a shorter fence inside the block does not close it. The mapping SHALL hold `outcome`, one of `done`, `needs-input` or `failed`. A `done` report SHALL hold `evidence`, a non-empty list of strings. A `needs-input` report SHALL hold `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report SHALL hold a string `reason`. `lets delegate step run` SHALL read the last such block in the final message. It SHALL ignore the text before the block and after it.

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

### Requirement: The command prints the report as one JSON line
When the session ends with a valid step report, `lets delegate step run` SHALL exit 0 and print the report on stdout as one JSON line whose first field is `outcome`. A `done` report SHALL also carry `date`: the time `lets` printed it, in ISO 8601 UTC, such as `2026-11-04T09:30:00Z`. A `needs-input` report's `questions` SHALL keep their order and each `recommendation` given. Exit 0 SHALL mean that a report is on stdout, whatever its outcome.

#### Scenario: A done report with its date
- **WHEN** the session ends with a `done` report, and the clock reads `2026-11-04T09:30:00Z`
- **THEN** stdout is one JSON line starting `{"outcome":"done",` that holds `"evidence"` and `"date":"2026-11-04T09:30:00Z"`

#### Scenario: A needs-input report
- **WHEN** the session ends with a `needs-input` report holding two questions, the second with a recommendation
- **THEN** the command exits 0, and stdout is one JSON line starting `{"outcome":"needs-input",` whose `questions` has the two questions in order, the second with its `recommendation`

#### Scenario: A failed report from the session
- **WHEN** the session ends with a `failed` report whose reason is `tests fail on main`
- **THEN** the command exits 0, and stdout is one JSON line starting `{"outcome":"failed",` with `"reason":"tests fail on main"`

### Requirement: A session that gives no valid report is a failed report
A final message can hold no `step-report` block, a block that is not YAML, an `outcome` that is not one of the three, or a report that lacks a field its outcome requires. In each case `lets delegate step run` SHALL exit 0 and print a `failed` report. Its `reason` SHALL say what is missing or wrong, and its `message` SHALL hold the session's final message. When the resolver reports that the session failed, the command SHALL exit 0 and print a `failed` report whose `reason` is the resolver's message. The resolver gives no handle in that case, so the command SHALL ask no resolver to finish the session, and the record's `handle` SHALL be `null`.

#### Scenario: No block
- **WHEN** the session's final message is prose with no `step-report` block
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"`, a `reason` that names `step-report`, and a `message` holding the final message

#### Scenario: A done report with no evidence
- **WHEN** the block holds `outcome: done` and no `evidence`
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"` and a `reason` that names `evidence`

#### Scenario: An unknown outcome
- **WHEN** the block holds `outcome: partial`
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"` and a `reason` that names `partial`

#### Scenario: The session failed
- **WHEN** the resolver reports that the session stopped to ask
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that says the session stopped to ask, no resolver is asked to finish a session, and the record on stderr has `"handle":null`

### Requirement: The step's exit codes
`lets delegate step run` SHALL exit 0 when a report is on stdout. It SHALL exit 2 on a usage error, a bad config, or when every resolver declines. It SHALL exit 3 when every `--model` is refused, with one line per model on stderr. It SHALL exit 4 when the outcome is unknown, and 6 when the session does not finish in time. On every code but 0, stdout SHALL be empty. The help text of `lets delegate step run` SHALL list these codes and say that exit 0 carries a report whatever its outcome.

#### Scenario: Every model refused
- **WHEN** the resolver refuses `gpt/gpt-6-astra` and `gemini`
- **THEN** the command exits 3, stdout is empty, and stderr has a line starting `gpt/gpt-6-astra: ` and a line starting `gemini: `

#### Scenario: Timeout
- **WHEN** the resolver reports that the session did not finish in time
- **THEN** the command exits 6 and stdout is empty

#### Scenario: A resolver that breaks
- **WHEN** the resolver that answers a step fails with the message `boom`
- **THEN** the command exits 4, stdout is empty, and stderr contains `boom`

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step run --help`
- **THEN** the output lists exit codes 0, 2, 3, 4 and 6, and says exit 0 carries a report whatever its outcome

### Requirement: The step's time limit
`lets delegate step run` SHALL give the session 120 minutes at every effort, unless `--timeout-minutes` gives another whole number of minutes.

#### Scenario: The default
- **WHEN** the user runs `lets delegate step run --for build --effort low` with the other required options
- **THEN** the resolver is asked for a session with a time limit of 120 minutes

#### Scenario: An override
- **WHEN** the user adds `--timeout-minutes 30`
- **THEN** the resolver is asked for a session with a time limit of 30 minutes

### Requirement: The step hands its session back to the resolver that made it
After the session gives its final message, `lets delegate step run` SHALL ask the resolver that made it to finish it. It SHALL finish with ok when the report's outcome is `done`, and without ok otherwise. So a session that needs input or failed is kept for a person to read. When finishing fails, the report SHALL stand, and stderr SHALL say the session could not be finished, naming its handle.

#### Scenario: A done step
- **WHEN** `t3` answers a step with handle `thread t-1`, and the session ends with a `done` report
- **THEN** `t3` is asked to finish `thread t-1` with ok

#### Scenario: A step that needs input
- **WHEN** the session ends with a `needs-input` report
- **THEN** the resolver is asked to finish the session without ok

#### Scenario: Finishing fails
- **WHEN** the session ends with a `done` report, and finishing `thread t-1` fails
- **THEN** the command exits 0, prints the report, and stderr says it could not finish `thread t-1`

### Requirement: The step record names the session that ran it
When `lets delegate step run` exits 0, it SHALL print one JSON line on stderr that holds `for`, the step `--for` gives, as its first field, then `resolver`, `family`, `model`, `handle` and `durationSeconds`. `model` SHALL be the model the resolver ran, or the `--model` value when that value names only a family. `handle` SHALL be the session's handle, or `null` when the resolver reported the session failed without one.

#### Scenario: The record
- **WHEN** `t3` answers `lets delegate step run --for plan --model claude/claude-opus-5-5` with handle `thread t-1` and a valid report
- **THEN** stderr ends with one JSON line that starts `{"for":"plan",` and holds `"resolver":"t3"`, `"family":"claude"`, `"model":"claude-opus-5-5"`, the handle and `durationSeconds`

### Requirement: Answers resume a step
`lets delegate step run` MAY take `--answers-file <path>`. The file SHALL be a YAML list of mappings, each with a string `question` and a string `answer`, and SHALL hold at least one. Each `question` and `answer` SHALL hold text other than white space. `lets` SHALL send the resolver the prompt file's text followed by one section that names each question and its answer, in order, and says those questions are settled and must not be asked again. A question or answer of several lines SHALL stay inside its own entry of that section. The caller SHALL be able to give the same `--prompt-file` as the run that reported `needs-input`. When the file cannot be read, is not such a list, is empty, or holds a blank question or answer, the command SHALL exit 2, name `--answers-file` on stderr, and ask no resolver.

#### Scenario: A resumed step
- **WHEN** `p.md` holds `PROMPT TEXT`, `a.yaml` holds one pair, question `Which schema?` and answer `lets-minimal`, and the user runs `lets delegate step run --for plan --prompt-file p.md --answers-file a.yaml` with the other required options
- **THEN** the prompt sent to the resolver starts with `PROMPT TEXT` and ends with a section that holds `Which schema?`, `lets-minimal`, and says the questions are settled

#### Scenario: The answers are in order
- **WHEN** `a.yaml` holds two pairs
- **THEN** the first question comes before the second in the prompt sent

#### Scenario: A multi-line answer
- **WHEN** `a.yaml` holds one pair whose answer is three lines, the second starting `- Q:`
- **THEN** the prompt sent holds all three lines under that pair's entry, and the section has one question

#### Scenario: A blank answer
- **WHEN** `a.yaml` holds one pair whose answer is `"  "`
- **THEN** the command exits 2, stderr names `--answers-file`, and no resolver is asked

#### Scenario: A malformed answers file
- **WHEN** `a.yaml` holds a mapping rather than a list
- **THEN** the command exits 2, stderr names `--answers-file`, and no resolver is asked

#### Scenario: An empty answers file
- **WHEN** `a.yaml` holds `[]`
- **THEN** the command exits 2, stderr names `--answers-file`, and no resolver is asked

#### Scenario: No answers file
- **WHEN** the user runs `lets delegate step run` without `--answers-file`
- **THEN** the prompt sent to the resolver is the prompt file's text, unchanged

### Requirement: The step takes no source family
`lets delegate step run` SHALL NOT take `--source-family`, and SHALL NOT report whether the session's family differs from the caller's.

#### Scenario: The option is unknown
- **WHEN** the user runs `lets delegate step run --source-family claude` with every required option
- **THEN** the command exits 2 and names `--source-family` as unknown
