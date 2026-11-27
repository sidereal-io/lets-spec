## 1. `lets delegate step read`

- [x] 1.1 [easy] A step report is printed by one function in `lets/src/delegate/report.ts`: it adds `date`, as ISO 8601 UTC to the second, to a `done` report only, and returns the one JSON line with `outcome` first. `lets delegate step run` prints through it and its output does not change (design D-1) (verify: node --test tests/lets/delegate/report.test.ts tests/lets/delegate/step.test.ts tests/delegate/step.test.ts) (✓ node --test tests/lets/delegate/report.test.ts tests/lets/delegate/step.test.ts tests/delegate/step.test.ts passed)
- [x] 1.2 [medium] `lets delegate step read --message-file <path>` reads the file, relative to the working directory, and prints the report as `step run` would: a `done` report with `date`, a `needs-input` report with `"ask":true` kept and `ask: false` dropped, a `failed` report as written, and a `failed` report with `reason` and `message` for no block or no `evidence`. It exits 0, prints nothing on stderr, and works with a `.lets/config.yaml` that is not valid YAML (design D-2; new `tests/delegate/read.test.ts`) (verify: node --test tests/delegate/read.test.ts) (✓ node --test tests/delegate/read.test.ts passed)
- [x] 1.3 [easy] `lets delegate step read` with no `--message-file`, with a file that does not exist, or with a path that is a directory, exits 2 with empty stdout, and stderr names `--message-file` (and the path, for a missing file or a directory) (design D-2, D-3) (verify: node --test tests/delegate/read.test.ts) (✓ node --test tests/delegate/read.test.ts passed)
- [x] 1.4 [easy] `lets delegate step read --help` names `--message-file`, lists exit codes 0 and 2, says exit 0 carries a report whatever its outcome, and names `lets delegate step run` (design D-4) (verify: node --test tests/lets/delegate/cli.test.ts) (✓ node --test tests/lets/delegate/cli.test.ts passed)
- [x] 1.5 [easy] The exit 3 entry of `lets delegate step run --help` says the step can run in a subagent with the saved prompt, and names `lets delegate step read` (design D-4) (verify: node --test tests/lets/delegate/cli.test.ts) (✓ node --test tests/lets/delegate/cli.test.ts passed)
- [ ] 1.6 [parallel] [easy] When the default refuses a step, stderr still names "no resolver", "subagent" and the saved prompt's path, and now also names `lets delegate step read` (design D-4) (verify: node --test tests/lets/resolvers/subagent/subagent.test.ts tests/delegate/step.test.ts)
- [ ] 1.7 [easy] With the same clock, `lets delegate step read` on a message file prints the same line as `lets delegate step run` does for a fake resolver's session that ends with that message, for a `done` report and for a message with no block (design, Test Seams; new `tests/lets/delegate/read.test.ts`) (verify: node --test tests/lets/delegate/read.test.ts)

## 2. lets-go and the glossary [depends-on: 1]

- [ ] 2.1 [parallel] [medium] `skills/lets-go/references/subagent.md` says how to run the subagent, as today, then to save its final message unchanged to `.workspace/lets-go/<session>-message.md` with the file tool, run `lets delegate step read --message-file .workspace/lets-go/<session>-message.md > .workspace/lets-go/<session>-report.json`, and, at any exit but 0, show stderr, name the step and stop. The old steps 2 to 5 and their report rules are gone (design D-5) (verify: node --test tests/contracts/commands.test.ts tests/contracts/links.test.ts)
- [ ] 2.2 [parallel] [easy] The *Step report* entry in `openspec/glossary.md` says that `lets delegate step run` and `lets delegate step read` each print it as one JSON line, and `skills/lets-go/references/terms.md` copies the entry word for word, in the same commit (design D-6) (verify: node --test tests/contracts/terms.test.ts tests/contracts/commands.test.ts)

## 3. The subagent journey [depends-on: 1]

- [ ] 3.1 [parallel] [medium] A journey test in `tests/journey/journeys.test.ts`: with no lets config, `lets delegate step run --for build` exits 3, and its stderr names the saved prompt and `lets delegate step read`; a message file that ends with a `done` report then goes through `lets delegate step read --message-file`, which exits 0 and prints that report with its `date` (verify: node --test tests/journey/journeys.test.ts)

## 4. Finish [depends-on: 2, 3]

- [ ] 4.1 [easy] The pull request description records `wc -l` for `skills/lets-go/SKILL.md` and for every file of `skills/lets-go/`, on `main` and on this branch (D11) (verify: gh pr view subagent-report-in-lets --json body --jq .body | grep -q 'wc -l')
- [ ] 4.2 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger
