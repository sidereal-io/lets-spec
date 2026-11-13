## Story

#257 backlog-provider-selection — choose the backlog provider in config, with provider-neutral item keys
https://github.com/sidereal-io/lets-spec/issues/257

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Do the pull request reference and the `complete` step stay in this story? | No. They move to #258, which is blocked by this story. This story keeps the backlog provider key and string item keys. | User |
| D2 | How does `lets backlog` name a work item? | A string field `key` replaces `number` everywhere: in `ready`, `item`, `find`, and `blockedBy`, `parent` and `subIssues`. It holds the whole ID as typed (`"136"`, `"PROJ-12"`, `"bd-a1b2"`), and lets never takes it apart. | User |
| D3 | Which arguments take a key? | `item`, `claim`, `release`, `--only` and `--exclude` accept any non-empty key. A key the backlog provider cannot find is `not-found`, not a usage error. | User |
| D4 | How does `ready` break ties within a priority? | Creation time, oldest first. Each adapter reports it for each candidate. On GitHub this gives today's lowest-number order. | User |
| D5 | Where is the backlog provider chosen, and what if it is missing or wrong? | `lets.backlog.provider` in `openspec/config.yaml`. Unset, or no `lets:` block, means `github`. An unknown value stops every `lets backlog` command with `unknown-backlog-provider`, exit 1, naming the value, the file and the shipped backlog providers. | User |
| D6 | Does lets read a `lets:` block today? | No. `lets/src/sync/config.ts` reads only the `schema:` line, line by line. This story adds the first reader of `lets:`. | Evidence: `lets/src/sync/config.ts` |
| D7 | Does the error for a failed backend tool keep its GitHub name? | No. `gh-failed` becomes `backend-failed`, its message still the tool's own error. The help text names the selected backlog provider. | User |
| D8 | How do skills show an item to a person? | The adapter also returns `label`, as the backlog provider writes IDs (`"#136"`, `"PROJ-12"`). Skills show `label` to people and pass `key` to commands. | User |
| D9 | What proves the story is done? | Node tests with a fake backlog provider using Jira-style keys through every command; config tests (unset, `github`, unknown, `lets:` without `provider`); the GitHub adapter's tests passing with only the field changes; a live `ready`, `item`, `claim` and `release` on `mstelz/test-repo-pls-ignore`; updated `lets-go` and `lets-plan` checks in `tests/skill-interfaces.bats`. | User |
| D10 | How does `lets-go` tell that a request names an item, not an idea? | It asks the adapter: a new `lets backlog key <text>` returns `{ key, label }` when the text is one of the backlog provider's IDs, or `{ key: null }`. GitHub takes `149` and `#149`. `lets-go` takes the request as an idea only when `key` is null. Raised after the first confirmation, from the `lets-go` spec's input rule. | User |

## Changes from the story

- Split out: the adapter-supplied pull request reference and the `complete` step, to #258. They are one concern, how a merged pull request finishes its item, and completion needs a new point in `lets-go` after the user merges.
- Added: `label` beside `key`, so GitHub output still reads `#136` (D8).
- Added: ranking ties break by creation time instead of issue number (D4).
- Added: `lets backlog key`, so `lets-go` recognizes a backlog provider's IDs without knowing their format (D10).
- Added: `gh-failed` is renamed `backend-failed`, and the help text stops naming GitHub (D7).

Confirmed by user: yes
