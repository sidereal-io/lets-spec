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
- **WHEN** the config lists a resolver that runs no step, then `subagent`, and the user runs `lets delegate step run --for plan` with every required option
- **THEN** the first resolver is not asked for a session, and the default answers

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

### Requirement: step start runs a step in the background
`lets delegate step start` SHALL take every option of `lets delegate step run`, plus `--report-file <path>` and `--meta-file <path>`, which are required, and `--checkout <path>`, which is optional. It SHALL start, in the background, the session that `lets delegate step run` would run with the same options, and return at once. The background step SHALL pick its resolver as `lets delegate step run` would in the process where `step start` ran: the first resolver in `delegate.resolvers` that answers. A resolver that would answer `step run` there, `t3` included, SHALL answer the background step too, except that `t3` declines once the T3 server that was an ancestor of `step start` has stopped. The session SHALL run with the repository root of `--checkout` as its working directory, or the repository root of the working directory when `--checkout` is not given. Every relative path SHALL be read from the working directory `step start` ran in. When the background step ends, the report file SHALL hold what `lets delegate step run` would have printed on stdout, and the meta file what it would have printed on stderr. Once the step has started, `step start` SHALL print one JSON line, `{"name":"<name>","pid":<pid>}`, with the normalized `--name` and the background process's id, and exit 0. The name SHALL be normalized as a session's name is, but SHALL NOT be cut to that name's 32 characters. It SHALL keep what it needs to know about the run under `.workspace/` in the repository root where it ran.

#### Scenario: A story run in a worktree
- **WHEN** the user runs `lets delegate step start --for story --name Fix X --checkout .workspace/lets-go/worktrees/fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --effort high --model gpt/gpt-6-luna`
- **THEN** the command exits 0 at once, prints one JSON line starting `{"name":"fix-x","pid":`, and the resolver is asked for a `step` session named `fix-x` whose working directory is the root of `.workspace/lets-go/worktrees/fix-x`

#### Scenario: A story run started inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, the running T3 server is an ancestor of the process, and the user runs `lets delegate step start --for story --name fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --effort high --model claude/claude-opus-5-5`, then exits that process before the background step picks its resolver
- **THEN** `t3` is asked for the `step` session, and `subagent` is not asked

#### Scenario: A resolver listed before t3 inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[cli, t3]`, `claude` is on `PATH`, the running T3 server is an ancestor of the process, and the user runs `lets delegate step start --for build` with every required option and `--model claude`
- **THEN** `cli` is asked for the `step` session, as `lets delegate step run` with the same options would ask it, and no T3 thread is created

#### Scenario: A name longer than 32 characters
- **WHEN** the user runs `lets delegate step start --name openspec-cli-is-the-projects-own-story` with the other options
- **THEN** the command prints one JSON line starting `{"name":"openspec-cli-is-the-projects-own-story","pid":`, and `lets delegate step wait --name openspec-cli-is-the-projects-own-story` names the step by that same name once it ends

#### Scenario: Paths for a step in a worktree
- **WHEN** the user runs `lets delegate step start --for story --name Fix X --checkout .workspace/lets-go/worktrees/fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --model gpt/gpt-6-luna` in the repository root `/repo`
- **THEN** the background `lets delegate step run` is given `--prompt-file /repo/p.md` and `--exit-file /repo/.workspace/lets-delegate/fix-x.exit.json`, and none of `--checkout`, `--report-file` and `--meta-file`

#### Scenario: The report once the step ends
- **WHEN** a step started with `--report-file r.json --meta-file m.txt` ends with a `done` report
- **THEN** `r.json` holds one JSON line starting `{"outcome":"done",`, and `m.txt` holds the record line that `lets delegate step run` prints on stderr

#### Scenario: A usage error starts nothing
- **WHEN** the user runs `lets delegate step start` with no `--report-file`
- **THEN** the command exits 2, prints nothing on stdout, and starts no background process

#### Scenario: A prompt file that cannot be read
- **WHEN** `--prompt-file` names a file that does not exist
- **THEN** the command exits 2, its stderr names the file, and no background process starts

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step start --help`
- **THEN** the output names `--checkout`, `--report-file` and `--meta-file`, lists exit codes 0 and 2, and says that `lets delegate step wait` tells when the step ends

### Requirement: step start refuses a name that is still running
`lets delegate step start` SHALL exit 2, and start nothing, when a background step that it started with the same normalized `--name`, from the same repository root, has not ended yet. Its stderr SHALL name the step and the id of the process that runs it, so the user can find or stop that process. Once that step has ended, `step start` SHALL accept the name again, and the new run SHALL replace the old one.

#### Scenario: A name that runs
- **WHEN** a background step named `fix-x-story` runs, and the user runs `lets delegate step start --name fix-x-story` again
- **THEN** the command exits 2, stderr names `fix-x-story` and the id of its running process, and no second process starts

#### Scenario: A name that has ended
- **WHEN** the background step named `fix-x-story` has ended with a `needs-input` report, and the user runs `lets delegate step start --name fix-x-story --answers-file a.yaml` with the other options
- **THEN** the command exits 0, and a new background step starts with the answers

### Requirement: step wait names the next background step to end
`lets delegate step wait` SHALL take one or more `--name <name>`, each the name of a background step that `lets delegate step start` started from the same repository root. It SHALL wait until one of them has ended, print one JSON line, `{"name":"<name>","exit":<code>}`, and exit 0. `<code>` SHALL be the exit code that `lets delegate step run` gave for that step: 0 when a report is in its report file, whatever its outcome, or 2, 3, 4 or 6. When several of the named steps have ended, it SHALL name the one that ended first. A named step that ended before `step wait` started SHALL be named at once. `step wait` SHALL change neither the report file nor the meta file of a step that ended with an exit code.

#### Scenario: The first of two to end
- **WHEN** the background steps `a-story` and `b-story` run, and `b-story` ends first with a report
- **THEN** `lets delegate step wait --name a-story --name b-story` prints `{"name":"b-story","exit":0}` and exits 0

#### Scenario: A step that ended earlier
- **WHEN** the background step `a-story` ended with exit 3 before the user runs `lets delegate step wait --name a-story`
- **THEN** the command prints `{"name":"a-story","exit":3}` at once and exits 0

#### Scenario: Two ended steps
- **WHEN** `a-story` ended at 10:00 and `b-story` at 10:05, and the user runs `lets delegate step wait --name b-story --name a-story`
- **THEN** the command prints `{"name":"a-story","exit":0}`

### Requirement: step wait reports a background step that ended without an exit code
When the process of a named background step has ended without recording an exit code, such as a process that was killed, `lets delegate step wait` SHALL count the step as ended with exit 4, the code for an unknown outcome. It SHALL append one line to that step's meta file, `lets delegate: the background step ended without an exit code`, so the caller reads a reason there, as for any other exit 4.

#### Scenario: A killed process
- **WHEN** the process of the background step `a-story` was killed, and the step recorded no exit code
- **THEN** `lets delegate step wait --name a-story` prints `{"name":"a-story","exit":4}`, and the meta file ends with `lets delegate: the background step ended without an exit code`

### Requirement: step wait's exit codes
`lets delegate step wait` SHALL exit 0 when it names a step that ended. It SHALL exit 2 on a usage error, such as no `--name`, or a name that no `lets delegate step start` started from this repository root, and its stderr SHALL name that name. It SHALL wait with no time limit, unless `--timeout-minutes` gives a whole number of minutes. When that time passes and none of the named steps has ended, it SHALL exit 6, and leave every named step running. On every code but 0, stdout SHALL be empty. The help text of `lets delegate step wait` SHALL list these codes.

#### Scenario: An unknown name
- **WHEN** no background step named `c-story` was started here, and the user runs `lets delegate step wait --name c-story`
- **THEN** the command exits 2, stdout is empty, and stderr names `c-story`

#### Scenario: A time limit that passes
- **WHEN** the background step `a-story` runs for longer than 5 minutes, and the user runs `lets delegate step wait --name a-story --timeout-minutes 5`
- **THEN** the command exits 6 after 5 minutes, stdout is empty, and `a-story` still runs

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step wait --help`
- **THEN** the output lists exit codes 0, 2 and 6, and says that the step's report is in the report file `lets delegate step start` was given
