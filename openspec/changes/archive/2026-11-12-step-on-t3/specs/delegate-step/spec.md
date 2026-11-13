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
- **WHEN** the config lists a resolver that runs no step, then `subagent`, and the user runs `lets delegate step run --for plan` with every required option
- **THEN** the first resolver is not asked for a session, and the default answers
