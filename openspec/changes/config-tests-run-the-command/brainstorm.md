<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#320 config-tests-run-the-command — the rules of the lets config are
tested through the commands that read it.
https://github.com/sidereal-io/lets-spec/issues/320

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#319 (pull request #334), whose branch holds the helper module
`tests/support/lets.ts` and the black-box tests of `lets delegate`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | How is this story built and tested? | By the `lets-verify-contracts` skill in `skills/`, not test-first. Every test it adds or keeps is a Node test, run by `node --test`. It writes no bats test. | User |
| D2 | Which tests does this story move? | `tests/lets/delegate/config.test.ts` (46 tests), `tests/lets/go/questions.test.ts` (11) and `tests/lets/config-dir.test.ts` (2). | Evidence: #320 packet, *Relevant code*; counted in the files |
| D3 | Does this story move `tests/lets/backlog/config.test.ts` (4) and test `lets backlog --help`? | No. Pull request #330 deletes that file and tests the choice of backlog provider through `lets backlog` in `tests/backlog/provider.test.ts` and `tests/backlog/help.test.ts`. This branch is not stacked on #330, so tests here would repeat those once both reach `main`. | Assumption |
| D4 | Which commands do the black-box tests run? | `lets go questions` for where each file is, what a file must be (YAML, a mapping, version 3), how the two files merge and `go.questions`. `lets delegate <strategy> instructions` for the `delegate` section: the chain, its entries, and the `review`, `handoff` and `step` entries left unchecked. | Evidence: #320 packet, *Scope* and *What the plan needs to know*; `lets/src/go/questions.ts` reads only `version` and `go` |
| D5 | How are the places of the user's lets config tested? | With real files: under `XDG_CONFIG_HOME` when it is set, and under `$HOME/.config` when it is unset or empty, with `HOME` pointed at a temporary folder. | Evidence: #320 packet, *What the plan needs to know*; `lets/src/config-dir.ts` |
| D6 | Which unit tests stay? | None. Every behavior the 59 tests check is reachable with one or two config files and one run of `lets`, which is not a far larger setup. The one check no command can show, that `fileOf` names the user's file for a key neither file sets, is deleted without cover. The pull request says so. | Assumption |
| D7 | Do `lets` or the config's keys change? | No. | Evidence: #308 *Shared decisions*; #320 packet, *Scope: out* |
| D8 | Does the T3 token file, which also sits in the lets config folder, get tests here? | No. The T3 resolver's tests stay as they are. | Evidence: #320 packet, *Scope: out*; #308 *Shared decisions* |
| D9 | Do `tests/lets/delegate/fixtures/command-deps.ts` and `fake-io.ts` go? | No. Other kept tests still import them. | Evidence: `git grep fixtures/command-deps tests` |
| D10 | Do the `lets go` tests already in `tests/lets/delegate/cli.test.ts`, which run `lets` as a program, move? | No. They are black-box already. A later story may move that file onto the helper module, as #317 decided for the delegate tests in it. | Assumption |

## Changes from the story

- **Cut: the backlog provider and `lets backlog --help`.** The story's
  scope names them, but pull request #330 already moves those tests to
  the command, on another stack (D3).
- **Cut: the unit tests the packet expected to stay.** The packet says
  the tests of `parseDocument`, `checkConfig` and `mergeDocuments` are
  the likely ones to stay. Each of their cases needs only a config file
  and one run, so by #308's rule they move too (D6).

Confirmed by user: no
