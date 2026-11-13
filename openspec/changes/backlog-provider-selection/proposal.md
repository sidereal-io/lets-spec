## Why

`lets backlog` assumes one provider, GitHub, and an ID that is an issue number. Jira, Linear and Beads (#142, #140, #138) and config-file providers (#236) can't be added until a repository can choose its provider and an item's ID can be any string. Doing this once, with GitHub as the only provider, means each provider story adds only its adapter.

## What Changes

- **Choosing a provider.** `lets.backlog.provider` in `openspec/config.yaml` names the provider. Unset means `github`. An unknown value stops every `lets backlog` command with a new error, `unknown-provider` (D5, D6).
- **BREAKING** (`lets backlog` JSON; skills and lets ship together): a string `key` replaces `number` in every result, nested items included. A new `label` is how the provider writes the ID, such as `#136` or `PROJ-12` (D2, D8).
- **Arguments.** `item`, `claim`, `release`, `--only` and `--exclude` take any non-empty key (D3).
- **A new command, `lets backlog key <text>`.** It returns `{ key, label }` when the text is one of the provider's IDs, and `{ key: null }` otherwise (D10).
- **Ranking.** `ready` breaks ties within a priority by creation time, oldest first, in place of the lowest issue number. GitHub's order does not change (D4).
- **BREAKING:** the error `gh-failed` becomes `backend-failed`. The help text names the selected provider (D7).
- **`lets-go` and `lets-plan`.**
  - They show an item by its `label` and pass its `key` to commands.
  - `lets-go` asks `lets backlog key` whether a one-word request names an item (D8, D10).
- The PR reference and the `complete` step are not part of this change; they are #258 (D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-backlog`:
  - the provider selection and `unknown-provider`;
  - `key` and `label` in place of `number`;
  - the `key` command;
  - ranking by creation time;
  - `backend-failed` in place of `gh-failed`;
  - the Purpose stops saying the provider is always GitHub.
- `lets-go`:
  - it recognizes a request that names an item through `lets backlog key`;
  - it ranks by creation time;
  - it shows items by `label` in the lines it prints;
  - its error scenario names `backend-failed`.

## Impact

- **Code:**
  - `lets/src/backlog/`: `adapter.ts`, `policy.ts`, `commands.ts`, `github.ts`, and a provider lookup;
  - a reader for the `lets:` block of `openspec/config.yaml`;
  - `tests/lets/backlog/`.
- **Skills:**
  - `skills/lets-go/SKILL.md` and its references;
  - `skills/lets-plan/SKILL.md`;
  - their checks in `tests/skill-interfaces.bats`.
- **Specs:** `lets-backlog` and `lets-go`.
- **Unchanged:**
  - `gh` calls and writes;
  - `Closes #<n>` in pull requests (#258);
  - the `gh` calls `lets-go` keeps until #137.
