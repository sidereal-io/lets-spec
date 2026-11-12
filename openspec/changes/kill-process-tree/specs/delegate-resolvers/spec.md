## ADDED Requirements

### Requirement: A timed-out cli session stops every process it started
When a review or a step that `cli` answers runs past its time limit, `cli` SHALL stop the CLI and every process the CLI started that is still in the CLI's process group. It SHALL send them `SIGTERM`, and SHALL send `SIGKILL` 5 seconds later to any that is still running. The command SHALL exit 6 within 10 seconds of the time limit, even when a process outside the group still holds the CLI's output.

#### Scenario: A step whose CLI started a child
- **WHEN** `cli` answers a step with `--timeout-minutes 3`, and after 3 minutes the CLI and a child process it started are both still running
- **THEN** neither the CLI nor the child is running when the command exits, the command exits 6, and stdout is empty

#### Scenario: A review whose CLI started a child
- **WHEN** `cli` answers a review, and after the review's time limit the CLI and a child process it started are both still running
- **THEN** neither the CLI nor the child is running when `lets delegate review run` exits, and it exits 6

#### Scenario: A child that ignores SIGTERM
- **WHEN** `cli` answers a step, and the CLI's child ignores `SIGTERM` and is still running after the step's time limit
- **THEN** the command exits 6 no sooner than 5 seconds and no later than 10 seconds after the time limit, and the child is no longer running when it exits

#### Scenario: A process outside the group holds the output
- **WHEN** `cli` answers a step, the CLI has started a process in a new session that holds the CLI's stdout open, and the CLI is still running after the step's time limit
- **THEN** the command exits 6 within 10 seconds of the time limit

### Requirement: A signal to lets reaches every process a cli session started
While a review or a step that `cli` answers is running, when `lets` gets `SIGINT`, `SIGTERM` or `SIGHUP`, it SHALL send the same signal to the CLI and every process the CLI started that is still in the CLI's process group. Then `lets` SHALL end as that signal ends it when no session runs.

#### Scenario: Ctrl-C during a step
- **WHEN** `cli` answers a step, the CLI has started a child process, and `lets` gets `SIGINT`
- **THEN** the CLI and the child each get `SIGINT`, and `lets` ends by `SIGINT`

#### Scenario: lets is told to stop during a review
- **WHEN** `cli` answers a review, the CLI has started a child process, and `lets` gets `SIGTERM`
- **THEN** the CLI and the child each get `SIGTERM`, and `lets` ends by `SIGTERM`
