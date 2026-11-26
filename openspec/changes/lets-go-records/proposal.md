## Why

On every resumed run, `lets-go` dates each Skip line by hand. *Read the records* in `references/records.md` gives the agent four `git log` formats and a rule for cutting the **Plan review** section out of the pull request's body. An agent that gets one of them wrong prints a wrong date, commit or verdict, and nothing checks it. This is the first half of moving the walk's reads into `lets`, beside `lets go questions`. The walk's done tests, in #268, build on it.

## What Changes

- **New command `lets go records <name>`.** It prints one JSON line: an object keyed `plan`, `review-plan`, `build` and `review-build`, each holding that step's record or null (D2). A record holds the commit and its author date. Review plan's record adds the pull request number and the verdict, and review build's adds the pull request number. The command reads only the **Plan review** section of the pull request's body (D3). It does not read the flow's schema (D4), and it does not decide which steps are done (D1).
- **`lets-go` fills every Skip line from the command.** Each row that prints a `Skipped` line runs `lets go records <name>` when the walk reaches it, and fills `<date>`, `<sha>`, `<pr>` and `<verdict>` from that row's record. The Skip lines keep their wording. The fixed line for review plan on `lets-minimal` stays as it is (D4).
- **A null record is a disagreement.** Where the agent used to stop because a `git log` read printed nothing, it now stops because the command printed null for a step it would skip. The fix by hand is the same.
- **`references/records.md` keeps only *Records that disagree*.** *Read the records* leaves it, and so do the `git log` commands and the section rule that only that part used. The links to it move to the command.
- **Tests.** Node tests run the command against a fixture repository, with a stand-in `gh`, in `tests/go/`. The contract tests check `lets-go`'s new text (D7, and *Changes from the story* in the brainstorm).
- No glossary entry for "record" (D5).

## Capabilities

### New Capabilities

- `go-records`: what `lets go records <name>` reads from Git and the pull request, the JSON it prints, when a record or one of its fields is null, its exit codes, and its help (D6).

### Modified Capabilities

- `lets-go`: the Skip lines are filled from `lets go records <name>`, not from `git log` and the pull request's body. This changes *A skipped step's line carries its evidence and date*, the Skip-line part of *Review plan runs as a step, or is not in the route*, the list of commands `lets-go` runs in *Start finds, confirms, routes and claims the issue*, the fixed strings in *The prose holds the fixed lines the tests check*, the null-record case in *Records that disagree stop the run*, and the `records.md` row of *lets-go keeps what only some runs need in reference files* (D6).

## Impact

- **Code:** a new `lets/src/go/records.ts`, and its command and help in `lets/src/main.ts`. The `lets go` group's description changes from settings only to settings and records.
- **Skills:** `skills/lets-go/SKILL.md` (*Placeholders*, *Walk the step table*, *The step table*, *The step lines*) and `skills/lets-go/references/records.md`. The pull request records `wc -l` for each changed skill file, before and after (D7).
- **Tests:** a new `tests/go/records.test.ts`. The contract tests that read `lets-go`'s text and `lets` command names, in `tests/contracts/`, pick up the new command and the moved text.
- **Outside tools:** `lets` now runs `git log` and `gh pr view` for this command. This follows ADR-021: the task joins several reads and parses a section, so it belongs in `lets` code. The skill still runs its own `gh pr view` for the walk's done tests.
- **Contract:** the JSON shape is the one #268 extends with the done state. A later change to the shape is a breaking change.
