## Story

#162 step-strategy — lets delegate step runs a session that can write files, waits for it, and returns a step report. https://github.com/sidereal-io/lets-spec/issues/162

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What do *step*, *step report* and *interactivity level* mean? | The tentative meanings in #148, now in `openspec/glossary.md`: a step is one of the five workflow stages, run in its own session and ended by a step report; a step report is `done`, `needs-input` or `failed`; an interactivity level is `ask` or `recommend`. | User |
| D2 | Which intents does `--for` take under `step`? | `shape`, `propose`, `propose-review`, `apply`, `apply-review`. | Evidence: #162 packet |
| D3 | How does a step's session hand its report back? | The session ends its final message with a fenced ```` ```step-report ```` block holding YAML. `lets` parses it and prints the report as one JSON line on stdout. A final message with no valid block is a `failed` report whose reason says so. | Assumption |
| D4 | What does each outcome carry? | `done`: `evidence`, a non-empty list of lines, plus `date`, which `lets` stamps in ISO 8601 UTC when it prints the report. `needs-input`: `questions`, a non-empty list, each with `question` and an optional `recommendation`. `failed`: `reason`. | Assumption |
| D5 | What do the exit codes of `step run` mean? | 0: a report is on stdout, whatever its outcome. 2: usage, or every resolver declined. 3: every model refused. 4: the outcome is unknown. 6: timeout. A session that fails after it starts, or ends with no valid report, is a `failed` report at exit 0, not exit 5: the report is the one place the caller reads. | Assumption |
| D6 | Does `step run` check the tree afterwards? | No. A step may write files, so there is no tripwire and no exit 7. The caller reads git when it needs to. | Evidence: #162 packet |
| D7 | Which options does `step run` take? | `--for`, `--name`, `--prompt-file`, `--effort`, `--model` (repeatable, best first), `--timeout-minutes` and `--answers-file`. No `--source-family`: a step is not a review, so independence does not apply. | Assumption |
| D8 | What is the default timeout? | 120 minutes at every effort. A step such as apply runs far longer than a review. | Assumption |
| D9 | How does the adapter contract grow? | A new kind of session, `step`, beside `run` and `start`: an optional `step` method that may write files and is waited for. An adapter without it declines every step, as one without `start` declines every handoff. `t3` and `cli` get no `step` method in this story. | Evidence: #162 packet; `lets/src/resolvers/kit/adapter.ts` |
| D10 | What does the default `subagent` resolver do for `step run`? | It saves the prompt `lets` composed to `.workspace/lets-delegate/<name>.prompt.md`, then refuses, so the command exits 3. Stderr names that file and says to run the step in a subagent with it. | Assumption |
| D11 | How is a step resumed with answers after its session ended? | A new `step run` with the same prompt file and `--answers-file <path>`. The file is a YAML list of `question` and `answer` pairs. `lets` appends them to the prompt in one fixed form, so every resolver, and the subagent fallback through D10, sees the same text. | Assumption |
| D12 | Where does the user's guidance live for steps? | `delegate.step.<step>.guidance` in the `lets` config, read only by `step instructions`, as `review` and `handoff` do today. | Assumption |
| D13 | What does `step run` print on stderr when it exits 0? | One JSON line with `for`, `resolver`, `family`, `model`, `handle` and `durationSeconds`, so a skill can record which session ran the step. | Assumption |
| D14 | Does this story touch `review` or `handoff`? | No. Both stay as they are. #158 decides whether they fold into `step`. | Evidence: #162 packet; #158 |
| D15 | Does `lets` read or set the interactivity level? | No. The level is `lets-go`'s to set and to put in the prompt (#149). This story only agrees and records the term. | Evidence: #148 Shared decisions |

## Changes from the story

None.

Confirmed by user: yes
