**Why:** The `step` strategy exists, but `t3` and `cli` cannot run a step until the adapter contract is settled; deciding now whether `review` and `handoff` fold into `step` lets each resolver change once.

## Story

#158 strategies-after-step — decide whether review and handoff fold into step, in a decision record, https://github.com/sidereal-io/lets-spec/issues/158

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does this chore deliver? | One decision record, ADR-016 in `docs/decisions/`, that builds on ADR-007. No code, spec or skill changes, so the change sets `skip_specs: true`. | Evidence: #158 packet; `skills/lets-write-adrs/SKILL.md` |
| D2 | Does `review` fold into `step`? | No. A review session is read-only: the resolver opens it in plan mode and `lets` checks the tree after. It prints the reviewer's text raw and records independence. A step may write files and must end with a step report. One strategy would need options that vary by intent, which ADR-007 rules out. | Assumption |
| D3 | Does `handoff` fold into `step`? | No. A handoff starts an interactive session and returns at once; a step is waited for. Its one caller is `lets-build`'s offer after propose. Whether handoff is retired is the `lets-build` decision (#157), not this one. | Assumption |
| D4 | What adapter contract do the resolver stories bind to? | The one that exists: one method per kind of session, `run`, `start?` and `step?`. An adapter declines a kind by leaving its method out, as `pick` reads today. #155 and #156 add `step` to `t3` and `cli`, and change nothing in `lets/src/delegate/`. | Assumption |
| D5 | Is anything in `lets` refactored onto `step`? | No. `review.ts` and `step.ts` already share `lookup.ts`, `guarded.ts`, `prompt-file.ts` and `config.ts`. What they do not share differs on purpose: the tree check, the output and the exit codes. | Evidence: `lets/src/delegate/review.ts`, `step.ts`, `lookup.ts` |
| D6 | May a resolver share code between `run` and `step`? | Yes. In `t3` the two differ by the thread's interaction mode; in `cli` by the CLI's permission flags. A private function with a read-only switch is each story's own call, not part of the contract. | Evidence: `lets/src/resolvers/t3/t3.ts` (`launchThread`); `lets/src/resolvers/cli/cli.ts` (`runCommand`) |
| D7 | Which existing records change? | None. ADR-007 already names the cost of a third strategy under *Consequences*, and the new record accepts it. No amendment, no status change. | Evidence: `docs/decisions/ADR-007-delegations-by-strategy-and-intent.md` |
| D8 | Do `docs/resolvers.md` or the README change? | No. Neither says the strategies will fold, so nothing there is wrong once the decision is recorded. | Evidence: `docs/resolvers.md`, `README.md` |
| D9 | Any new glossary terms? | None. *Strategy* and *resolver* keep the meanings ADR-007 and ADR-010 give them, and the record uses them the same way. | Assumption |

## Changes from the story

None.

Confirmed by user: no
