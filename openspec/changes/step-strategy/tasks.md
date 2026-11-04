## 1. The shared contract

Types and lookup that every later task builds on. `Kind` and `Intent` widen, `Adapter` gains an optional `step`, and the fake adapter in `tests/lets/delegate/fixtures/command-deps.ts` gains a `step` behaviour and a switch that leaves `step` out.

- [x] 1.1 [medium] `STRATEGIES.step` serves `shape`, `propose`, `propose-review`, `apply` and `apply-review` and sends `step`, and `pick('step')` skips an adapter without `step` as it skips one without `start` (verify: node --test tests/lets/delegate/strategies.test.ts tests/lets/delegate/lookup.test.ts) (✓ node --test tests/lets/delegate/strategies.test.ts tests/lets/delegate/lookup.test.ts passed)
- [x] 1.2 [easy] `parseConfig` keeps `delegate.step`, `guidanceFor` reads `delegate.step.<step>.guidance` and nothing from `handoff`, and `step instructions` probes for the `step` kind and prints `"strategy":"step"` (verify: node --test tests/lets/delegate/config.test.ts tests/lets/delegate/instructions.test.ts) (✓ node --test tests/lets/delegate/config.test.ts tests/lets/delegate/instructions.test.ts passed)

## 2. The report [depends-on: 1]

`lets/src/delegate/report.ts`, tested on its own in `tests/lets/delegate/report.test.ts`.

- [x] 2.1 [medium] `readReport` reads the last `step-report` block by the fence rule, a shorter fence inside does not close it, text before and after is ignored, and the result is a typed `done`, `needs-input` or `failed` report with questions in order and optional recommendations (verify: node --test tests/lets/delegate/report.test.ts) (✓ node --test tests/lets/delegate/report.test.ts passed)
- [x] 2.2 [medium] `readReport` answers a `failed` report whose reason names what is wrong and whose `message` is the text, for no block, a block that is not YAML, an unknown outcome, `done` without evidence, `needs-input` without questions and `failed` without a reason (verify: node --test tests/lets/delegate/report.test.ts) (✓ node --test tests/lets/delegate/report.test.ts passed)
- [x] 2.3 [medium] `readAnswers` accepts a non-empty list of pairs with text in both fields and throws a `UsageError` naming `--answers-file` otherwise, and `withAnswers` appends the `## Answers` section with one item per pair and every further line indented (verify: node --test tests/lets/delegate/report.test.ts) (✓ node --test tests/lets/delegate/report.test.ts passed)

## 3. The command [depends-on: 2]

`lets/src/delegate/step.ts`, driven through `commandDeps` in `tests/lets/delegate/step.test.ts`.

- [x] 3.1 [medium] `step run` asks the resolver for a `step` session with the normalized name, the prompt, the repository root, the family, the model and the effort, with a 120-minute limit unless `--timeout-minutes` says otherwise, and prints a `done` report with the clock's date on stdout and the record on stderr (verify: node --test tests/lets/delegate/step.test.ts) (✓ node --test tests/lets/delegate/step.test.ts passed)
- [ ] 3.2 [medium] `step run` prints `needs-input` and `failed` reports at exit 0, turns a resolver's `SessionFailed` into a `failed` report with `"handle":null` and no finish, finishes with ok only on `done`, and reports a finish that fails without changing the outcome (verify: node --test tests/lets/delegate/step.test.ts)
- [ ] 3.3 [medium] `step run` exits 2 on a bad model, a bad config or a chain that declines, 3 naming each refused model without moving down the chain, 4 on an unexpected failure and 6 on a timeout, each with an empty stdout, and never runs `git status` (verify: node --test tests/lets/delegate/step.test.ts)
- [ ] 3.4 [easy] `step run --answers-file` sends the prompt file's text followed by the answers section, sends the text unchanged without the option, and exits 2 before any resolver is asked for a file that is missing, malformed, empty or blank (verify: node --test tests/lets/delegate/step.test.ts)

## 4. The default, the command line and the docs [depends-on: 3]

- [ ] 4.1 [easy] `subagent.step` saves the composed prompt to `.workspace/lets-delegate/<name>.prompt.md`, starts no process, and refuses with a message that names the file and says to run the step in a subagent, so `step run` exits 3 and `step instructions` lists no models (verify: node --test tests/lets/resolvers/subagent/subagent.test.ts tests/lets/delegate/step.test.ts)
- [ ] 4.2 [medium] `lets delegate step instructions|run` exist in `main.ts`: `step --help` names both commands and the five intents, `step run --help` lists exit codes 0, 2, 3, 4 and 6 and says exit 0 carries a report whatever its outcome, `--source-family` is unknown, and `delegate --help` names the three strategies (verify: node --test tests/lets/delegate/cli.test.ts)
- [ ] 4.3 [medium] `docs/resolvers.md` and the README's delegation section describe the step, the report block, `--answers-file` and `delegate.step.<step>.guidance`, the bats checks accept `lets delegate step` with `instructions` or `run`, and the whole suite passes (verify: pnpm test)

Before pushing, also run `nix flake check`, as AGENTS.md requires.

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
