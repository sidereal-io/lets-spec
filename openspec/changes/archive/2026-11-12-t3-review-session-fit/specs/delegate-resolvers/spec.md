## ADDED Requirements

### Requirement: The T3 resolver runs a review in default mode
When `t3` answers `lets delegate review run`, it SHALL open the thread in T3's default interaction mode, never in plan mode, whatever `--for` says. A review that changes files outside `.workspace/` SHALL still exit 7, as for every resolver.

#### Scenario: A plan review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for plan --effort medium --model gemini/gemini-4-argon` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

#### Scenario: A code review opens in default mode
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code --model gpt/gpt-6-luna` with every required option inside T3 Code
- **THEN** the thread opens with interaction mode `default`

### Requirement: A T3 review that returns a plan exits 5
A run can end holding a proposed plan. Then `lets delegate review run` SHALL exit 5 and print nothing on stdout. Its stderr SHALL say `the session returned a plan, not a result`, followed by the thread's id. `t3` SHALL NOT archive the thread, so a person can read it. A run that holds no proposed plan SHALL be read as it is today.

#### Scenario: The run ends with a proposed plan
- **WHEN** the config's `delegate.resolvers` is `[t3]`, and the user runs `lets delegate review run --for code` with every required option inside T3 Code
- **AND** the thread's run completes holding a proposed plan and a final message
- **THEN** the command exits 5, stdout is empty, stderr says `the session returned a plan, not a result (thread <id>)`, and the thread is not archived

#### Scenario: The run ends with findings
- **WHEN** the same review's run completes with a final message and no proposed plan
- **THEN** the command exits 0 and prints the final message

### Requirement: The T3 resolver names the checkout T3 ran the review in
When `t3` answers `lets delegate review run`, the review's `checkout` SHALL be the checkout T3 records for the thread: the thread's worktree when T3 records one, or else the T3 project's root. It SHALL NOT be the checkout `t3` asked for, when T3 records another.

#### Scenario: T3 runs the review in the worktree it was asked for
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread in `/w/fix-login`
- **THEN** the JSON line on stderr has `"checkout":"/w/fix-login"`

#### Scenario: T3 runs the review in the project's root instead
- **WHEN** the user runs `lets delegate review run --for code` that `t3` answers in the linked worktree `/w/fix-login`, and T3 records the thread with no worktree, in the project whose root is `/r`
- **THEN** the JSON line on stderr has `"checkout":"/r"`
