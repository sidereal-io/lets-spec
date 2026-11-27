## MODIFIED Requirements

### Requirement: A step runs in a session that may write files
`lets delegate step run --for <intent>`, for every intent but `review-plan` and `review-build`, SHALL ask the resolver that answers for a `step` session: one that may write files in the repository, and whose final message the resolver waits for. It SHALL send the normalized `--name`, the prompt, the repository root as the working directory, the family and model of `--model`, and `--effort`. It SHALL NOT compare the tree before and after the session, and SHALL NOT fail because the session changed files. An adapter without `step` declines every such intent, and the next resolver in the chain answers. *A reviewer runs in a read-only session* says what `--for review-plan` and `--for review-build` ask for.

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
For every intent but `review-plan` and `review-build`, the session's final message SHALL end with a step report. A reviewer writes none, as *A reviewer's final message is its findings* says. A step report SHALL be a fenced code block tagged `step-report`, holding one YAML mapping, at the end of the session's final message. The block SHALL open with a line of three or more backticks followed by `step-report`. It SHALL close with a line of at least as many backticks and nothing else, so a shorter fence inside the block does not close it. The mapping SHALL hold `outcome`, one of `done`, `needs-input` or `failed`. A `done` report SHALL hold `evidence`, a non-empty list of strings. A `needs-input` report SHALL hold `questions`, a non-empty list of mappings, each with a string `question`, an optional string `recommendation` and an optional boolean `ask`. `ask: true` marks a question that the caller asks the user whatever its question mode. A `failed` report SHALL hold a string `reason`. `lets delegate step run` SHALL read the last such block in the final message. It SHALL ignore the text before the block and after it.

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

### Requirement: A session that gives no valid report is a failed report
For every intent but `review-plan` and `review-build`, a final message can hold no `step-report` block, a block that is not YAML, an `outcome` that is not one of the three, or a report that lacks a field its outcome requires. In each case `lets delegate step run` SHALL exit 0 and print a `failed` report. Its `reason` SHALL say what is missing or wrong, and its `message` SHALL hold the session's final message. When the resolver reports that the session failed, for any intent, the command SHALL exit 0 and print a `failed` report whose `reason` is the resolver's message. The resolver gives no handle in that case, so the command SHALL ask no resolver to finish the session, and the record's `handle` SHALL be `null`.

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
`lets delegate step run` SHALL exit 0 when a report is on stdout. It SHALL exit 2 on a usage error, a bad config, or when every resolver declines. It SHALL exit 3 when every `--model` is refused, with one line per model on stderr. It SHALL exit 4 when the outcome is unknown, such as a tree check that `git` cannot run after a reviewer, and 6 when the session does not finish in time. These SHALL be its only exit codes, for every intent: a failed session and a reviewer that changed files are `failed` reports at exit 0, and `lets delegate step run` SHALL never exit 5 or 7. On every code but 0, stdout SHALL be empty. The help text of `lets delegate step run` SHALL list these codes and say that exit 0 carries a report whatever its outcome.

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
- **THEN** the output lists exit codes 0, 2, 3, 4 and 6, lists neither 5 nor 7, and says exit 0 carries a report whatever its outcome

### Requirement: The step's time limit
`lets delegate step run` SHALL give the session 120 minutes at every effort for `--for shape`, `--for plan` and `--for build`, and 600 minutes for `--for story`, unless `--timeout-minutes` gives another whole number of minutes. *A reviewer has time to finish* gives the time for `--for review-plan` and `--for review-build`.

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
- **THEN** the output says a step has 120 minutes, a story 600, and a reviewer 30, or 45 at effort `high`, unless `--timeout-minutes` says otherwise

### Requirement: The step record names the session that ran it
When `lets delegate step run` exits 0, for every intent but `review-plan` and `review-build`, it SHALL print one JSON line on stderr that holds `for`, the intent `--for` gives, as its first field, then `resolver`, `family`, `model`, `handle` and `durationSeconds`, and nothing else. *The reviewer's record says what the review was for* gives a reviewer's record. `model` SHALL be the model the resolver ran, or the `--model` value when that value names only a family. `handle` SHALL be the session's handle, or `null` when the resolver reported the session failed without one.

#### Scenario: The record
- **WHEN** `t3` answers `lets delegate step run --for plan --model claude/claude-opus-5-5` with handle `thread t-1` and a valid report
- **THEN** stderr ends with one JSON line that starts `{"for":"plan",` and holds `"resolver":"t3"`, `"family":"claude"`, `"model":"claude-opus-5-5"`, the handle and `durationSeconds`

## ADDED Requirements

### Requirement: A reviewer runs in a read-only session
`lets delegate step run --for review-plan` and `--for review-build` SHALL start a reviewer: they SHALL ask the resolver that answers for a read-only session, whose final message the resolver waits for. They SHALL send the normalized `--name`, the prompt, the repository root as the working directory, the family and model of `--model`, and `--effort`. A resolver that runs no `step` session SHALL still answer a reviewer. Before the session starts, the command SHALL note each file that `git status` shows as changed. After the session, it SHALL compare the tree again. A file the session changed outside `.workspace/`, that was not already changed before it started, SHALL make the report `failed`, with a `reason` that says the session changed files outside `.workspace/` and names the session's handle. The command SHALL then ask the resolver to finish the session without ok, so it is kept for a person to read.

#### Scenario: The resolver is asked for a read-only session
- **WHEN** the config lists `t3`, and the user runs `lets delegate step run --for review-plan --name X Plan Review --prompt-file p.md --source-family claude --effort medium --model gpt/gpt-6-luna`
- **THEN** `t3` is asked for a read-only session named `x-plan-review`, with the prompt, the repository root, the family `gpt`, the model `gpt-6-luna` and the effort `medium`, and is not asked for a `step` session

#### Scenario: A reviewer that changed a file
- **WHEN** the reviewer's session ends with a final message, and `git status` shows `src/a.ts` changed, which was not changed before it started
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that says the session changed files outside `.workspace/`, and the resolver is asked to finish the session without ok

#### Scenario: A scratch file and the user's own change
- **WHEN** `src/b.ts` was changed before the reviewer started, and the session writes only `.workspace/notes.md`
- **THEN** the command exits 0 with a `done` report

#### Scenario: The tree cannot be checked
- **WHEN** the reviewer's session ends with a final message, and `git status` fails afterwards
- **THEN** the command exits 4, stdout is empty, stderr says the tree could not be checked and names the session's handle, and the resolver is asked to finish the session without ok

### Requirement: A reviewer's final message is its findings
For `--for review-plan` and `--for review-build`, the command SHALL NOT look for a `step-report` block. When the session ends with a final message that holds more than white space, and the tree check passes, the command SHALL exit 0 and print one JSON line on stdout, `{"outcome":"done","findings":<final message>,"date":<date>}`. `findings` SHALL be the whole final message, unchanged, a `step-report` block included. `date` SHALL be the time `lets` printed it, in ISO 8601 UTC, as for a step's `done` report. When the final message is empty or only white space, the report SHALL be `failed`, with a `reason` that says the session gave an empty final message and names the session's handle. A reviewer's report SHALL never be `needs-input`.

#### Scenario: Findings come back whole
- **WHEN** the reviewer's final message is three paragraphs of findings that end with the line `Read: /r 0123456789abcdef0123456789abcdef01234567`, and the clock reads `2026-11-04T09:30:00Z`
- **THEN** the command exits 0, and stdout is one JSON line that starts `{"outcome":"done",`, whose `findings` is the final message unchanged, and whose `date` is `2026-11-04T09:30:00Z`

#### Scenario: A reviewer that writes a step report
- **WHEN** the reviewer's final message ends with a `step-report` block holding `outcome: needs-input`
- **THEN** the command exits 0 with a `done` report, and its `findings` holds the block as text

#### Scenario: An empty final message
- **WHEN** the reviewer's final message is empty
- **THEN** the command exits 0, stdout is one JSON line with `"outcome":"failed"` and a `reason` that says the final message was empty, and the resolver is asked to finish the session without ok

### Requirement: The reviewer's record says what the review was for
When `lets delegate step run --for review-plan` or `--for review-build` exits 0, it SHALL print one JSON line on stderr that holds `for`, the intent `--for` gives, as its first field, then `resolver`, `family`, `model`, `independent`, `handle`, `checkout`, `commit`, `gitClean` and `durationSeconds`. `independent` SHALL be true when the family that answered is not the `--source-family`. `gitClean` SHALL be true when the session changed no file outside `.workspace/`, and false when it did. When the resolver reported the session failed without a handle, `handle`, `checkout` and `commit` SHALL be `null`.

#### Scenario: A code review
- **WHEN** a resolver answers `lets delegate step run --for review-build --source-family claude --model gpt` with a clean tree
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"review-build",` and holds `"family":"gpt"`, `"independent":true`, `handle`, `checkout`, `commit`, `"gitClean":true` and `durationSeconds`

#### Scenario: A plan review by the author's family
- **WHEN** a resolver answers `lets delegate step run --for review-plan --source-family gpt --model gpt` with a clean tree
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"review-plan",` and holds `"independent":false`

#### Scenario: A reviewer that changed the tree
- **WHEN** the reviewer's session changed `src/a.ts`
- **THEN** the record on stderr holds `"gitClean":false`

### Requirement: The reviewer's record names the checkout and commit the session read
The reviewer's record SHALL hold `checkout` and `commit`, for every resolver that runs a reviewer:
- `checkout` SHALL be the absolute path of the top level of the git checkout the session ran in, as the resolver reports it.
- `commit` SHALL be the full hash at that checkout's `HEAD`, read after the session ended.

When `lets` cannot tell the checkout, or cannot read its `HEAD`, the field SHALL be `null`, and the command SHALL still exit 0 and print the report.

#### Scenario: A review through the cli resolver
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate step run --for review-build` with every required option in the checkout `/r`, and `/r`'s `HEAD` is `0123456789abcdef0123456789abcdef01234567` when the session ends
- **THEN** the command exits 0, and its JSON line on stderr has `"checkout":"/r"` and `"commit":"0123456789abcdef0123456789abcdef01234567"`

#### Scenario: A reviewer that commits
- **WHEN** a resolver answers a reviewer in `/r`, whose `HEAD` is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` when the command starts, and the session makes the commit `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` and leaves the tree clean
- **THEN** the command exits 0, and its JSON line on stderr has `"commit":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"`

#### Scenario: The checkout's HEAD cannot be read
- **WHEN** a resolver answers a reviewer and reports the checkout `/gone`, where `git rev-parse HEAD` fails
- **THEN** the command exits 0, prints a `done` report, and its JSON line on stderr has `"checkout":"/gone"` and `"commit":null`

### Requirement: A reviewer has time to finish
`lets delegate step run --for review-plan` and `--for review-build` SHALL give the session 30 minutes at effort `low` and `medium`, and 45 minutes at effort `high`, unless `--timeout-minutes` gives another whole number of minutes. This SHALL hold for every resolver. When the session has not finished in that time, the command SHALL exit 6.

#### Scenario: A medium review
- **WHEN** the user runs `lets delegate step run --for review-build --effort medium` with every other required option, and no `--timeout-minutes`
- **THEN** the resolver is given 30 minutes

#### Scenario: A low review
- **WHEN** the user runs `lets delegate step run --for review-plan --effort low` with no `--timeout-minutes`
- **THEN** the resolver is given 30 minutes

#### Scenario: A high review
- **WHEN** the user runs `lets delegate step run --for review-build --effort high` with no `--timeout-minutes`
- **THEN** the resolver is given 45 minutes

#### Scenario: The user sets the limit
- **WHEN** the user runs `lets delegate step run --for review-build --effort medium --timeout-minutes 7`
- **THEN** the resolver is given 7 minutes

#### Scenario: The session runs past the limit
- **WHEN** the user runs `lets delegate step run --for review-build --effort medium` with no `--timeout-minutes`
- **AND** the session has not finished after 30 minutes
- **THEN** the command exits 6, stdout is empty, and stderr says that no result came in time

### Requirement: Only a reviewer takes a source family
`lets delegate step run` and `lets delegate step start` SHALL require `--source-family <family>` for `--for review-plan` and `--for review-build`, where the family is `gpt`, `claude` or `gemini`: the family that wrote the work under review. For every other intent, `--source-family` SHALL be a usage error. In each case the command SHALL exit 2, name `--source-family` on stderr, and ask no resolver.

#### Scenario: A reviewer without a source family
- **WHEN** the user runs `lets delegate step run --for review-build` with every other required option and no `--source-family`
- **THEN** the command exits 2, stderr names `--source-family`, and no resolver is asked

#### Scenario: A step with a source family
- **WHEN** the user runs `lets delegate step run --for build --source-family claude` with every other required option
- **THEN** the command exits 2, stderr names `--source-family`, and no resolver is asked

#### Scenario: A background reviewer
- **WHEN** the user runs `lets delegate step start --for review-plan --source-family claude` with every other required option
- **THEN** the command exits 0, and the background `lets delegate step run` is given `--source-family claude`

### Requirement: A reviewer takes no answers
A reviewer never reports `needs-input`, so `lets delegate step run` and `lets delegate step start` SHALL treat `--answers-file` with `--for review-plan` or `--for review-build` as a usage error: exit 2, name `--answers-file` on stderr, and ask no resolver.

#### Scenario: Answers for a reviewer
- **WHEN** the user runs `lets delegate step run --for review-plan --answers-file a.yaml` with every other required option, and `a.yaml` holds one valid pair
- **THEN** the command exits 2, stderr names `--answers-file`, and no resolver is asked

## REMOVED Requirements

### Requirement: The step takes no source family
**Reason**: A reviewer now runs through `lets delegate step run`, and needs the family that wrote the work, to report whether the review was independent.
**Migration**: Pass `--source-family` only with `--for review-plan` or `--for review-build`. *Only a reviewer takes a source family* holds the new behavior.
