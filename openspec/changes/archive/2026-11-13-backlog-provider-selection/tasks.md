## 1. Keys and the backlog provider

- [x] 1.1 [complex] Every `lets backlog` result names an item by a string `key` and a `label` in place of `number`, on the item itself and in `blockedBy`, `parent` and `subIssues`: GitHub gives `"key": "136"` and `"label": "#136"`, and `"label": "acme/lib#7"` for an item in another repository; the GitHub `gh` calls and writes do not change (verify: `deli -- pnpm test:backlog`) (✓ `deli -- pnpm test:backlog` passed, 64 tests)
- [x] 1.2 [easy] A backend read that fails or times out returns the error `backend-failed`, not `gh-failed`, with `gh`'s own message (verify: `node --test tests/lets/backlog/commands.test.ts`) (✓ `node --test tests/lets/backlog/commands.test.ts` passed)
- [x] 1.3 [medium] The backlog provider comes from `lets.backlog.provider` in `openspec/config.yaml` at the repository root. It is `github` when the file, the `lets:` block or `provider` is absent. An unknown name, or a `lets:` block in flow style, returns `unknown-backlog-provider` with a message naming the value, the file and the shipped backlog providers, and runs no `gh` command. The help text names the backlog provider in use (verify: `node --test tests/lets/backlog/config.test.ts tests/lets/backlog/commands.test.ts`) (✓ `node --test tests/lets/backlog/config.test.ts tests/lets/backlog/commands.test.ts` passed)

## 2. Keys from the backlog provider [depends-on: 1]

- [x] 2.1 [medium] `lets backlog key <text>` returns `{ key, label }` for one of the backlog provider's keys and `{ key: null, label: null }` otherwise, reads text after `--` literally, and runs no `gh` command, even with no Project linked: GitHub takes `149` and `#149` (verify: `node --test tests/lets/backlog/key.test.ts`) (✓ `node --test tests/lets/backlog/key.test.ts` passed)
- [x] 2.2 [medium] `item`, `claim` and `release` check their argument with the backlog provider's key parser before any backend call: on GitHub, `item PROJ-12` returns `not-found` with no `gh` call, and `item '#149'` reads issue 149. A fake backlog provider with Jira-style keys answers `item PROJ-12`, `claim PROJ-12` and `release PROJ-12 --claim <token>` (verify: `node --test tests/lets/backlog/item.test.ts tests/lets/backlog/claim.test.ts tests/lets/backlog/release.test.ts`) (✓ `node --test tests/lets/backlog/item.test.ts tests/lets/backlog/claim.test.ts tests/lets/backlog/release.test.ts` passed)
- [x] 2.3 [medium] `ready` breaks ties within a priority by creation time, oldest first, with a stable sort and no key comparison: GitHub reads `createdAt` from its free-issue search and keeps lowest-number order for equal times. With the fake backlog provider, `PROJ-12` created first ranks before `PROJ-9`, and `--only` and `--exclude` take its keys (verify: `node --test tests/lets/backlog/ready.test.ts tests/lets/backlog/policy.test.ts`) (✓ `node --test tests/lets/backlog/ready.test.ts tests/lets/backlog/policy.test.ts` passed)

## 3. The skills use key and label [depends-on: 2]

- [x] 3.1 [complex] `lets-go`'s *Read the request* asks `lets backlog key -- '<word>'`, with the apostrophe rule, when the request is one word. A `key` is `<i>`, `null` makes it an idea, and an error stops the run as *Backlog errors* says. The bats checks cover `lets-go PROJ-12`, `lets-go refactor` and `lets-go can't` (verify: `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'` passed)
- [x] 3.2 [medium] `lets-go`'s `## Placeholders` section says that `#<i>`, `#<parent>` and `#<story>` show the item's `label` and that commands take its `key`. `<i>`'s row says key, not number. *Pick the first ready story* and `next` describe the rank as oldest first. *Backlog errors* names `backend-failed` (verify: `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'lets-go'` passed)
- [x] 3.3 [easy] `lets-plan` takes the issue's key from its caller and says so, keeping its `lets backlog find <branch>` rule (verify: `deli -- bats tests/skill-interfaces.bats --filter 'lets-plan'`) (✓ `deli -- bats tests/skill-interfaces.bats --filter 'lets-plan'` passed)

## 4. Acceptance [depends-on: 3]

- [x] 4.1 [medium] Every project check passes: the Node tests, the type check, the bats tests, the flake and OpenSpec validation (verify: `deli -- pnpm test && deli -- nix flake check && mise run check`) (✓ all three passed: 689 Node tests and every bats test, the flake, and `openspec validate --all --strict`)
- [x] 4.2 [medium] Live run in a clone of `mstelz/test-repo-pls-ignore` with this branch's `lets`: `key`, `ready`, `item`, `find`, `claim` and `release` return `key` and `label` against its real Project, and a claim and its release still assign and set Status. The results are recorded in the pull request (verify: `lets backlog item <claimed-issue>` in the clone shows `"key"`, `"label"`, `"status": "In Progress"` and the user in `assignees`) (✓ `lets backlog item 11` showed `"key": "11"`, `"label": "#11"`, `"status": "In Progress"` and `mstelz` after the claim, and Todo with no assignee after the release; recorded in https://github.com/sidereal-io/lets-spec/pull/259#issuecomment-6858850257)

## 5. Change requests [depends-on: 4]

- [x] 5.1 [medium] The backlog provider comes from `backlog.provider` in the user's lets config, `$XDG_CONFIG_HOME/lets/config.yaml` or `~/.config/lets/config.yaml`, read with `parseDocument`. It is `github` when the file, `backlog` or `provider` is absent. An unknown name, a file `parseDocument` rejects, a `backlog` that is not a mapping, or a `provider` that is not a string returns `unknown-backlog-provider`, naming the file, and runs no `gh` command. `openspec/config.yaml` is no longer read, and the line reader and the `git rev-parse` lookup are gone (verify: `node --test tests/lets/backlog/config.test.ts tests/lets/backlog/commands.test.ts`) (✓ `node --test tests/lets/backlog/config.test.ts tests/lets/backlog/commands.test.ts` passed)
- [x] 5.2 [easy] The `tests/skill-interfaces.bats` checks this branch added are gone, and the existing ones still pass (verify: `deli -- bats tests/skill-interfaces.bats`) (✓ `deli -- bats tests/skill-interfaces.bats` passed, 333 checks; the file matches main)
- [x] 5.3 [medium] Every project check passes (verify: `deli -- pnpm test && deli -- nix flake check && mise run check`) (✓ all three passed: 686 Node tests and every bats test, the flake, and `openspec validate --all --strict`)
- [x] 5.4 [medium] Live run in the clone of `mstelz/test-repo-pls-ignore` with `backlog.provider: github` in a lets config under a scratch `XDG_CONFIG_HOME`: `claim` and `release` still assign and set Status, and `jria` there is `unknown-backlog-provider` with no `gh` call. The results are recorded in the pull request (verify: `lets backlog item <claimed-issue>` shows `"status": "In Progress"` and the user in `assignees`) (✓ `lets backlog item 11` showed `"status": "In Progress"` and `mstelz` after the claim, Todo and no assignee after the release, and `jria` was `unknown-backlog-provider` with no `gh` call; recorded in https://github.com/sidereal-io/lets-spec/pull/259#issuecomment-6859998066)

## Deviations Ledger

- 3.1: `lets-go`'s Placeholders table gains a `<word>` row, for the one
  word that `lets backlog key -- '<word>'` checks. The placeholder check
  needs a row for every placeholder, and the plan did not name it.
- Code review: two fixes beyond the tasks. A quoted key in the `lets:`
  block is read like an unquoted one (df4d5466). A label for an issue in
  another repository is read from any GitHub host's URL, not only
  `github.com` (ab3170a5).
- After the code review, the user moved the setting out of
  `openspec/config.yaml` (brainstorm D11 to D13). Task 5.1 replaces where
  1.3 reads it from; the rest of 1.3 stands. The quoted-key fix
  (df4d5466) goes with the line reader. The checks 3.1 to 3.3 added to
  `tests/skill-interfaces.bats` go in 5.2.
