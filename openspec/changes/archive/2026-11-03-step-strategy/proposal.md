## Why

`lets-go` (#148) runs the workflow as five steps, each in its own session, and needs to know how each step ended. Today `lets delegate` has only `review`, a read-only session, and `handoff`, which returns at once and never reports back. Nothing runs a session that can write files, waits for it, and returns a result. This change adds that, and defines the step report once, before any skill depends on its shape.

## What Changes

- A new strategy, `step`, with `lets delegate step instructions --for <step>` and `lets delegate step run --for <step>`. The intents are the five steps (D2).
- A new kind of session in the adapter contract, `step`, beside `run` and `start`: it may write files and is waited for. An adapter without it declines every step. `t3` and `cli` get none here (D9, D14).
- The step report: `done`, `needs-input` or `failed`, read from a fenced block at the end of the session's final message and printed as one JSON line (D3, D4). Exit 0 means a report is on stdout, whatever its outcome (D5).
- No tree check after a step. A step may write files (D6).
- `step run` takes `--for`, `--name`, `--prompt-file`, `--effort`, `--model` (repeatable), `--timeout-minutes` and `--answers-file`. The default timeout is 120 minutes (D7, D8).
- Resuming a step: `--answers-file` gives a YAML list of question and answer pairs, which `lets` appends to the prompt in one fixed form (D11).
- The default `subagent` resolver saves the composed prompt to `.workspace/lets-delegate/<name>.prompt.md` and refuses, so `step run` exits 3 and the caller runs the step as a subagent with that file (D10).
- A new guidance key, `delegate.step.<step>.guidance`, read only by `step instructions` (D12).
- A JSON line on stderr after exit 0, naming the session that ran the step (D13).
- Docs: `docs/resolvers.md`, the README's delegation section, the command help, and the bats checks that list the strategies.

No breaking change. `review` and `handoff` are unchanged (D14). `lets` neither reads nor sets the interactivity level (D15).

## Capabilities

### New Capabilities
- `delegate-step`: what `lets delegate step run` does: the session it asks for, the step report it prints, its exit codes, and how answers resume a step.

### Modified Capabilities
- `delegate-config`: the config gains `delegate.step`; the strategies are three; `step` has its own intents; `--model` and the ranked-model rules cover `step run`.
- `delegate-default`: the default answers a step by saving the composed prompt and refusing.
- `delegate-instructions`: `step instructions` exists, probes for the `step` kind of session, and reads `delegate.step.<step>.guidance`.
- `delegate-resolvers`: `t3` and `cli` decline every step, and its instructions, until later changes extend them.

## Impact

- `lets/src/delegate/`: `strategies.ts`, `config.ts`, `instructions.ts`, `lookup.ts`, a new `step.ts` and a new report module; `lets/src/main.ts` for the commands and help.
- `lets/src/resolvers/kit/adapter.ts`: the `step` method and its input. `lets/src/resolvers/subagent/subagent.ts`: the step answer.
- `tests/lets/delegate/`, `tests/lets/resolvers/subagent/`, `tests/skill-interfaces.bats`.
- `docs/resolvers.md`, `README.md`.
- `openspec/glossary.md` already defines *step*, *step report* and *interactivity level* (D1).
- No new dependency: `yaml` already parses the config.
