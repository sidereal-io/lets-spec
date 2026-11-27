<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#353 one-delegate-command — lets delegate step starts every session, a reviewer included, https://github.com/sidereal-io/lets-spec/issues/353

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Until #354 and #355 ship, how does `lets-go` start a review step's own session, now that `--for review-plan` and `--for review-build` start the read-only reviewer? | With `--for plan` (review plan) or `--for build` (review build), keeping the session name `<name>-review-plan` or `<name>-review-build`. `--for review-plan` and `--for review-build` always mean the reviewer and read their own guidance keys, so the temporary #307 mapping leaves the code. Cost: until #355, that session's record line says `for: plan` or `for: build`. | Assumption |
| D2 | What shape does a reviewer's report take on stdout? | lets wraps the reviewer's final message whole as a done report: one JSON line with `outcome: done`, `findings` holding the final message, and `date`. The reviewer writes no step-report block, so the three review prompts keep their finding formats and the `Read: <checkout> <head>` line. A reviewer cannot report needs-input. | User |
| D3 | How is a reviewer session that goes wrong reported? | With the step's exit codes only. A failed session, an empty final message, or a change outside `.workspace/` each exit 0 with a failed report whose reason says what happened. The session is kept for a person to read. Exits 3, 4 and 6 keep their meaning; exits 5 and 7 go away. | Assumption |
| D4 | How long does a reviewer session have? | 30 minutes, or 45 at effort high, for `--for review-plan` and `--for review-build`, unless `--timeout-minutes` says otherwise. Other steps keep 120 minutes, and a story keeps 600. | Assumption |
| D5 | Which `--for` values take `--source-family`? | It is required for `--for review-plan` and `--for review-build`, and any other `--for` value given it exits 2. The reviewer's record line keeps `independent`, `checkout`, `commit` and `gitClean`; other record lines stay as they are. | Assumption |
| D6 | Where do the nine `delegate-review` requirements go? | The three command requirements (the record's `for`, its `checkout` and `commit`, and the time limit) move into `delegate-step`, rewritten for `step run`. The six skill requirements stay in `delegate-review`, whose purpose becomes what the review skills do. | Assumption |
| D7 | How does the glossary describe the reviewer and the review step's sessions? | A new Reviewer entry: the read-only session that reviews a plan or a branch's code, for a review step or a review skill run alone, started by `lets delegate step run --for review-plan` or `--for review-build`, changing no file outside `.workspace/`, its final message returned whole as a done report's findings. The Step entry says `--for review-plan` and `--for review-build` start the review step's reviewer, and the step's own session starts with `--for plan` or `--for build`. The Step and Story run entries drop the words "delegate strategy". No sentence says a reviewer is not a step, since #354 makes it one. Written to `openspec/glossary.md`. | User |

## Changes from the story

- **Changed: the two specs do not become one** (D6). Only the command requirements move into `delegate-step`. Reason: six of `delegate-review`'s requirements are rules for the review skills, not for the command, and would not belong in a command spec.
- **Added: `lets-go` changes in this story** (D1). Its review steps start their own session with `--for plan` or `--for build`. Who starts the reviewer in a `lets-go` run stays out of scope, as the story says. Reason: otherwise `--for review-plan` would mean the reviewer in one place and the review step's own session in another.
- **Added: exit codes 5 and 7 are removed** (D3). Reason: one command has one set of exit codes, and the step's report already carries a failure's reason.
- **Not split.** The work fits one story: the delegate code and its help, the removal of `lets delegate review`, four skills, two specs, the README, `docs/resolvers.md`, a decision record and the tests.

Confirmed by user: yes
