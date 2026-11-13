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
| D5 | Where is the backlog provider chosen, and what if it is missing or wrong? | `backlog.provider` in the user's lets config (D11). Unset, or no `backlog:` section, means `github`. An unknown value stops every `lets backlog` command with `unknown-backlog-provider`, exit 1, naming the value, the file and the shipped backlog providers. | User |
| D6 | How does lets read its config? | The user's lets config is parsed with the `yaml` package, through `parseDocument` in `lets/src/delegate/config.ts`, and each command group reads its own section, as `go.questions` does. An earlier answer said lets had no YAML parser; that was wrong. | Evidence: `lets/src/delegate/config.ts` |
| D7 | Does the error for a failed backend tool keep its GitHub name? | No. `gh-failed` becomes `backend-failed`, its message still the tool's own error. The help text names the selected backlog provider. | User |
| D8 | How do skills show an item to a person? | The adapter also returns `label`, as the backlog provider writes IDs (`"#136"`, `"PROJ-12"`). Skills show `label` to people and pass `key` to commands. | User |
| D9 | What proves the story is done? | Node tests with a fake backlog provider using Jira-style keys through every command; config tests (no file, no `backlog:`, `github`, unknown, a `provider` that is not a string, a file lets cannot read); the GitHub adapter's tests passing with only the field changes; a live `ready`, `item`, `claim` and `release` on `mstelz/test-repo-pls-ignore`. No new `tests/skill-interfaces.bats` checks (D13). | User |
| D10 | How does `lets-go` tell that a request names an item, not an idea? | It asks the adapter: a new `lets backlog key <text>` returns `{ key, label }` when the text is one of the backlog provider's IDs, or `{ key: null }`. GitHub takes `149` and `#149`. `lets-go` takes the request as an idea only when `key` is null. Raised after the first confirmation, from the `lets-go` spec's input rule. | User |
| D11 | Where does the setting live: OpenSpec's `openspec/config.yaml`, or a file of lets's own? | Not in `openspec/config.yaml`: lets settings stay out of OpenSpec's file. For this change, only the user's lets config, `$XDG_CONFIG_HOME/lets/config.yaml` or `~/.config/lets/config.yaml`, at `backlog.provider`, as ADR-011 lays it out. Raised in the pull request after the code review. | User |
| D12 | Can a repository set its backlog provider? | Not in this change. A repository setting, in a file of lets's own in the repository that wins over the user's config, is a new story. This change says that it is missing. | User |
| D13 | Does this change add checks on the skills' prose to `tests/skill-interfaces.bats`? | No. The checks it added are dropped; the existing ones stay. | User |

## Changes from the story

- Split out: the adapter-supplied pull request reference and the `complete` step, to #258. They are one concern, how a merged pull request finishes its item, and completion needs a new point in `lets-go` after the user merges.
- Added: `label` beside `key`, so GitHub output still reads `#136` (D8).
- Added: ranking ties break by creation time instead of issue number (D4).
- Added: `lets backlog key`, so `lets-go` recognizes a backlog provider's IDs without knowing their format (D10).
- Added: `gh-failed` is renamed `backend-failed`, and the help text stops naming GitHub (D7).
- Changed after the code review: the setting moves from `openspec/config.yaml` to the user's lets config (D11), and the repository setting is split out to a new story (D12).

Confirmed by user: yes
