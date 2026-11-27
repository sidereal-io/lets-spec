## Story

#266 subagent-report-in-lets — lets reads a subagent's step report as it
reads a session's.
https://github.com/sidereal-io/lets-spec/issues/266

Parent: #263, *Epic: lets-go hands each rule to the skill or command that
owns it*. Its *Shared decisions* section applies to this story: a run looks
the same to the user, requirements and tests check behaviour rather than
wording, and the pull request records `wc -l` for the skill.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which command reads a subagent's step report? | A new `lets delegate step read`, beside `step run`, `step start` and `step wait`. The step report is the step strategy's contract (ADR-022), and the new command's output must match what `step run` prints. | Assumption |
| D2 | How does lets-go give the subagent's final message to the command, and where does the report go? | lets-go saves the final message to a file under `.workspace/` and passes it with `--message-file <path>`. The command prints the report as one JSON line on stdout, and lets-go saves that to `.workspace/lets-go/<session>-report.json`, as it does for `step run`. | Assumption |
| D3 | Does `lets` itself point to the new command? | Yes. The stderr line of the default's exit 3 and the exit 3 entry of `lets delegate step run --help` name `lets delegate step read`. lets-go's steps, stops and printed lines stay the same. | Assumption |
| D4 | Which rules does `step read` apply to the message? | The same as `step run`, from the same parser in `lets/src/delegate/report.ts`: the last `step-report` block, the three outcomes and their fields, `ask: true` kept and `ask: false` dropped, `date` added to a `done` report, and a `failed` report whose `reason` says what is wrong and whose `message` holds the final message. | Evidence: `openspec/specs/delegate-step/spec.md`; D1 |
| D5 | What do its exit codes mean? | Exit 0 means a report is on stdout, whatever its outcome, as for `step run`. A usage error, such as no `--message-file` or a file that cannot be read, is exit 2 with nothing on stdout. | Evidence: ADR-022 |
| D6 | What is left in `skills/lets-go/references/subagent.md`? | How to run the subagent: its prompt, its branch or checkout, and what it may change. Steps 2–5, the parsing rules, the date and the JSON write, become one `lets delegate step read` command. The file stays a reference for this rare path. | Evidence: #266 packet, *Scope*; #263 *Scope*, "Reference files for rare paths only" |
| D7 | Does an epic run's walk change? | No. When a step in a story's worktree `<path>` runs in a subagent, lets-go runs `step read` from `<path>`, as it runs every other walk command there. | Evidence: `skills/lets-go/references/epic-run.md`, *Wait for the wave* |
| D8 | Do the review skills' subagent paths change? | No. A review's subagent returns a final message, not a step report, and the epic leaves skills other than `lets-go` and `lets-shape` alone. | Evidence: #263 *Scope*, Out |
| D9 | How do the `lets-go` requirement *Exit 3 runs the step in a subagent* and its tests change? | They check what a run does: lets-go runs the subagent with the saved prompt, then `lets delegate step read`, and saves its stdout as the report. The rule list moves out of the `lets-go` spec, because `delegate-step` already holds it. | Evidence: #263 *Shared decisions* |
| D10 | Does the glossary change? | Yes: the *Step report* entry in `openspec/glossary.md` says that `lets delegate step run` and `lets delegate step read` each print it as one JSON line. The meaning does not change. | Assumption |
| D11 | What does the pull request record? | `wc -l` for `skills/lets-go/SKILL.md` and for the whole skill, before and after. | Evidence: #263 *Shared decisions*; #266 packet, *Scope* |

## Changes from the story

None. The packet's scope stands. The resolvers, and when exit 3 happens,
stay out, as the packet says.

Confirmed by user: yes
