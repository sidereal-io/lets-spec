## MODIFIED Requirements

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

### Requirement: The step's time limit
`lets delegate step run` SHALL give the session 120 minutes at every effort, unless `--timeout-minutes` gives another whole number of minutes.

#### Scenario: The default
- **WHEN** the user runs `lets delegate step run --for build --effort low` with the other required options
- **THEN** the resolver is asked for a session with a time limit of 120 minutes

#### Scenario: An override
- **WHEN** the user adds `--timeout-minutes 30`
- **THEN** the resolver is asked for a session with a time limit of 30 minutes

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
