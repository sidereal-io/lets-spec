## ADDED Requirements

### Requirement: step read prints the step report from a final message
`lets delegate step read --message-file <path>` SHALL read the file at `<path>` as a session's final message, such as the final message of a subagent that ran a step. It SHALL print the report that `lets delegate step run` would print for a session that ended with that final message, by the rules of *The step's session ends its final message with a step report*, *The command prints the report as one JSON line* and *A session that gives no valid report is a failed report*. So a `done` report SHALL carry `date`, the time `lets` printed it, and a final message with no valid report SHALL be a `failed` report whose `reason` says what is wrong and whose `message` holds the final message. A relative `<path>` SHALL be read from the working directory. `step read` SHALL start no session, ask no resolver and read no lets config, so it runs wherever `step run` exited 3. At exit 0, it SHALL print nothing on stderr.

#### Scenario: A done report with its date
- **WHEN** `m.md` holds two paragraphs of prose, then a `step-report` block with `outcome: done` and `evidence` listing `commit 3f2a1c0`, the clock reads `2026-11-04T09:30:00Z`, and the user runs `lets delegate step read --message-file m.md`
- **THEN** the command exits 0, stdout is one JSON line starting `{"outcome":"done",` that holds `"evidence":["commit 3f2a1c0"]` and `"date":"2026-11-04T09:30:00Z"`, and stderr is empty

#### Scenario: A needs-input report with marked questions
- **WHEN** `m.md` ends with a `needs-input` report holding two questions, the first with `ask: true` and the recommendation `lets-minimal`, the second with `ask: false`
- **THEN** the command exits 0, and stdout is one JSON line starting `{"outcome":"needs-input",` whose first question holds `"recommendation":"lets-minimal"` and `"ask":true`, and whose second question holds no `ask`

#### Scenario: A failed report from the subagent
- **WHEN** `m.md` ends with a `failed` report whose reason is `tests fail on main`
- **THEN** the command exits 0, and stdout is `{"outcome":"failed","reason":"tests fail on main"}`

#### Scenario: No block
- **WHEN** `m.md` holds prose and no `step-report` block
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"`, a `reason` that names `step-report`, and a `message` holding the text of `m.md`

#### Scenario: A done report with no evidence
- **WHEN** `m.md` ends with a `step-report` block holding `outcome: done` and no `evidence`
- **THEN** the command exits 0, and stdout is one JSON line with `"outcome":"failed"` and a `reason` that names `evidence`

#### Scenario: The same report as step run
- **WHEN** a resolver's step session ends with the final message that `m.md` holds, and the clock reads the same time for both commands
- **THEN** `lets delegate step read --message-file m.md` prints the same line on stdout as `lets delegate step run` does for that session

#### Scenario: A config that is not valid
- **WHEN** the repository's `.lets/config.yaml` is not valid YAML, and `m.md` ends with a valid `done` report
- **THEN** `lets delegate step read --message-file m.md` exits 0 and prints the report

### Requirement: step read's exit codes
`lets delegate step read` SHALL exit 0 when a report is on stdout, whatever its outcome. It SHALL exit 2 on a usage error: no `--message-file`, or a file it cannot read. At exit 2, stdout SHALL be empty, and stderr SHALL name `--message-file`. The help text of `lets delegate step read` SHALL list these codes, say that exit 0 carries a report whatever its outcome, and say that it reads the report by the rules `lets delegate step run` uses.

#### Scenario: No message file
- **WHEN** the user runs `lets delegate step read` with no `--message-file`
- **THEN** the command exits 2, stdout is empty, and stderr names `--message-file`

#### Scenario: A file that cannot be read
- **WHEN** the user runs `lets delegate step read --message-file missing.md`, and `missing.md` does not exist
- **THEN** the command exits 2, stdout is empty, and stderr names `--message-file` and `missing.md`

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step read --help`
- **THEN** the output names `--message-file`, lists exit codes 0 and 2, says exit 0 carries a report whatever its outcome, and names `lets delegate step run`

## MODIFIED Requirements

### Requirement: The step's exit codes
`lets delegate step run` SHALL exit 0 when a report is on stdout. It SHALL exit 2 on a usage error, a bad config, or when every resolver declines. It SHALL exit 3 when every `--model` is refused, with one line per model on stderr. It SHALL exit 4 when the outcome is unknown, and 6 when the session does not finish in time. On every code but 0, stdout SHALL be empty. The help text of `lets delegate step run` SHALL list these codes and say that exit 0 carries a report whatever its outcome. Its entry for exit 3 SHALL say that, when no resolver started a session, the step can run in a subagent with the saved prompt, and that `lets delegate step read` reads the subagent's step report.

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

#### Scenario: The help text names step read at exit 3
- **WHEN** the user runs `lets delegate step run --help`
- **THEN** the entry for exit 3 says `subagent` and names `lets delegate step read`
