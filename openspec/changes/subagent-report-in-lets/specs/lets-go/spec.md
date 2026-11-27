## MODIFIED Requirements

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3 and its meta file names the prompt `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session. Its prompt SHALL be that saved file. It SHALL follow the saved prompt, work only in this repository, on the branch `<name>` or, for shape, on the default branch, and make only the changes that the step calls for. `lets-go` SHALL then save the subagent's final message, unchanged, to `.workspace/lets-go/<session>-message.md`, and run `lets delegate step read --message-file .workspace/lets-go/<session>-message.md`, with its stdout written to `.workspace/lets-go/<session>-report.json`. It SHALL read that report as it reads a report from `step run`. It SHALL NOT read the `step-report` block, check the report or add its date itself: `lets delegate step read` does that, as the `delegate-step` capability says. When `step read` exits with any code but 0, `lets-go` SHALL show the user its stderr, name the step, and stop. In an epic run's walk, `lets-go` SHALL run `step read` from the story's worktree, as it runs every other walk command there.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, saves its final message to `.workspace/lets-go/lets-go-chore-build-message.md`, and runs `lets delegate step read --message-file .workspace/lets-go/lets-go-chore-build-message.md` with its stdout written to `.workspace/lets-go/lets-go-chore-build-report.json`

#### Scenario: What the subagent may change
- **WHEN** a reader reads *Run a step in a subagent*
- **THEN** it says that the subagent follows the saved prompt, works only in this repository on the branch `<name>`, and makes only the changes that the step calls for, and it does not say `may write files`

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** the report file holds the `failed` report that `lets delegate step read` prints, whose reason names `step-report`, and `lets-go` treats the step as `failed` and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** the report file holds the `failed` report that `lets delegate step read` prints, whose reason names `evidence`, and `lets-go` treats the step as `failed` and stops

#### Scenario: A subagent's marked question
- **WHEN** the subagent's block holds `outcome: needs-input` and one question with `ask: true`
- **THEN** `.workspace/lets-go/<session>-report.json` holds that question with `"ask":true`, as `lets delegate step read` printed it

#### Scenario: step read cannot read the message
- **WHEN** `lets delegate step read` exits 2 because it cannot read the message file
- **THEN** `lets-go` shows its stderr, names the step, and stops without reading a report

#### Scenario: A subagent step in an epic run's walk
- **WHEN** an epic run walks the story in the worktree `.workspace/lets-go/worktrees/fix-x`, and a step there exits 3
- **THEN** `lets-go` runs `lets delegate step read` from `.workspace/lets-go/worktrees/fix-x`
