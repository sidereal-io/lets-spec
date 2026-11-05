## ADDED Requirements

### Requirement: The default's step saves the prompt and refuses
When the default answers `lets delegate step run`, it SHALL save the prompt `lets` composed, with any answers appended, to `.workspace/lets-delegate/<name>.prompt.md` in the repository, then refuse. Asked again for the next `--model`, it SHALL write the same file again and refuse again. The command SHALL exit 3, print nothing on stdout, and start no process. Stderr SHALL say that no resolver started a session, that the step runs in a subagent, and the path of the saved prompt. It SHALL NOT say that no resolver is installed.

#### Scenario: A step with no resolver that runs steps
- **WHEN** the default answers `lets delegate step run --for propose --name plan-x --prompt-file p.md --effort high --model claude`, and `p.md` holds `Run propose on x`
- **THEN** the command exits 3, stdout is empty, `.workspace/lets-delegate/plan-x.prompt.md` holds `Run propose on x`, and stderr contains "no resolver", "subagent", `.workspace/lets-delegate/plan-x.prompt.md`, and not "installed"

#### Scenario: A resumed step
- **WHEN** the default answers the same command with `--answers-file a.yaml`, which holds the question `Which schema?` and the answer `lets-minimal`
- **THEN** `.workspace/lets-delegate/plan-x.prompt.md` starts with `Run propose on x` and holds `Which schema?` and `lets-minimal`

#### Scenario: A family CLI is on PATH
- **WHEN** the default answers a step, and `codex`, `claude` and `agy` are all on `PATH`
- **THEN** the command exits 3, and none of them is run

### Requirement: The default lists no models for a step
When the default answers `lets delegate step instructions`, the JSON line SHALL have `"resolver":"subagent"` and `"options":[]`.

#### Scenario: Step instructions with no config
- **WHEN** no config file exists, and the user runs `lets delegate step instructions --for apply`
- **THEN** it exits 0 and prints one JSON line with `"strategy":"step"`, `"for":"apply"`, `"resolver":"subagent"` and `"options":[]`
