## Context

- `lets/src/backlog/commands.ts` always builds the GitHub adapter (`createGithub` is the default `makeAdapter`). `createGithub` runs the Project lookup before it returns, so every command needs a linked Project.
- `Adapter`, `Candidate`, `Item`, `Ref` and `Related` in `adapter.ts` name items by `number: number`. `commands.ts` parses every argument with `issueNumber`, a whole number above zero. `policy.ts` ranks ties by `a.number - b.number`.
- `lets/src/sync/config.ts` reads `openspec/config.yaml` line by line, because Node has no YAML parser. It reads only the top-level `schema:` line. Nothing reads a `lets:` block yet.
- The GitHub adapter's free-issue search (`gh issue list --search "is:open no:assignee -is:blocked" --json number`) already decides which candidates are `free`, and only free candidates can be ready.
- `lets-go` decides "number or idea" in its own prose (`SKILL.md`, *Read the request*). It writes `#<i>` in about 24 lines it prints, and its spec quotes those lines in 22 requirements.

## Goals / Non-Goals

**Goals:**
- One place decides the backlog provider, and one place lists the backlog providers this release ships.
- `policy.ts` and `commands.ts` never assume a key's form.
- GitHub keeps the same `gh` commands, writes and results, apart from the field names and the one `--json` field D4 needs.

**Non-Goals:**
- A second backlog provider, or settings beyond `provider` under `lets.backlog`.
- The pull request reference and completion (#258).
- The `gh` calls `lets-go` keeps until #137: the comment thread read, `gh issue view <i> --json createdAt`, the in-progress parent query and the glossary-handoff body edit.
- Rewriting every `#<i>` line in the `lets-go` spec (Decision 7).

## Test Seams

- **Primary test seam:** `run(argv, deps)` in `lets/src/backlog/commands.ts`, driven by a fake `Io`. Today the fake `Io` answers `gh` calls from a table keyed by their arguments. This change adds:
  - `readFile` for `openspec/config.yaml`;
  - `git rev-parse --show-toplevel` for the repository root;
  - a fake backlog provider registered in place of the shipped list, whose keys look like Jira's.

  The Node tests in `tests/lets/backlog/` assert the printed JSON, the exit code and the backend calls made.
- **Existing seams reused:**
  - `tests/lets/backlog/fixtures/` for the GitHub `gh` tables;
  - `tests/skill-interfaces.bats` for the `lets-go` and `lets-plan` prose;
  - the live run on `mstelz/test-repo-pls-ignore` that #136 used.

## Scrutiny Tier & Blast Radius

- **Tier:** high. It changes a CLI contract the skills depend on (`key`, `label`, `backend-failed`), adds the first reader of the project config's `lets:` block, and changes how `lets-go` reads a request.
- **Blast radius:**
  - code and tests: `lets/src/backlog/`, `tests/lets/backlog/`;
  - skills: `skills/lets-go/`, `skills/lets-plan/SKILL.md`, `tests/skill-interfaces.bats`;
  - specs: `lets-backlog` and `lets-go`.

  A wrong key mapping could claim or release the wrong GitHub issue.

## Decisions

1. **A registry of backlog providers.** A new `providers.ts` maps each shipped name to two functions:
   - `parseKey(text)`, which returns `{ key, label } | null` and calls no backend;
   - `create(io, cwd)`, which builds the adapter.

   GitHub is the only entry. `commands.ts` takes the registry through its deps, so tests register a fake backlog provider. `key` calls only `parseKey`, so it needs no Project (D10). `item`, `claim` and `release` also run `parseKey` on their argument before they build the adapter: `null` is `not-found` with no backend call, and a key is passed on in its parsed form, so `#149` and `149` name the same issue. `--only` and `--exclude` run each key through `parseKey` too, and leave out one that gives `null`.

   *Alternative:* a `parseKey` method on `Adapter`. Rejected: building the GitHub adapter runs the Project lookup, so `key` would need a Project and a network call.

2. **Reading the backlog provider.** `backlogProvider(text)` sits in `lets/src/backlog/config.ts`, next to `schemaOf`'s line rules (it reuses `withoutComment` and `unquote`, exported from `sync/config.ts`). It finds a top-level `lets:` line, then `backlog:` indented under it, then `provider:` indented under that, and returns the value or `null`.
   - The file is `openspec/config.yaml` at `git rev-parse --show-toplevel`, or `cwd` when that command fails, which matches how `gh` finds the repository.
   - `null` means `github`, but only when the file has no top-level `lets:` line, or the `lets:` block holds no `backlog:` or no `provider:`.
   - A top-level `lets:` line with a value on it (flow style), or a `provider:` line the reader cannot unquote, throws `BacklogError('unknown-backlog-provider')`, whose message says only block style is read. An explicit setting is never taken for absence.
   - A name not in the registry throws `BacklogError('unknown-backlog-provider')` before any backend call.

   *Alternative:* add a YAML parser dependency. Rejected: lets has no runtime dependencies for config, and #23's `lets:` block will need the same line reader for `flow` and `skills`.

3. **Keys are opaque strings.**
   - In the types: `number: number` becomes `key: string` and `label: string` in `Candidate`, `Item`, `Ref` and `Related`. Every `Adapter` method takes `key: string`.
   - In `commands.ts`: `issueNumber` becomes `itemKey`, which rejects only an empty string. `issueList` splits on commas into keys.
   - A key never holds a comma, so `--only` and `--exclude` keep comma lists. This is a rule on every backlog provider's key form: GitHub numbers, Jira and Linear `ABC-12`, and Beads `bd-a1b2` all keep it. A backlog provider whose keys could hold a comma would need repeated flags instead.
   - In the GitHub adapter: `parseKey` accepts `^#?[1-9][0-9]*$` and drops the `#`. Its label is `#<n>`, or `owner/repo#<n>` for an item in another repository, taken from its URL.

   This is the costly-to-reverse decision; see the ADR step.

4. **Ranking by creation time.**
   - `Candidate` gains `created: string`, an ISO 8601 time.
   - `ready` sorts ties by `created`, with a stable sort, so equal times keep the order the adapter returned. It never compares keys (ADR-025).
   - The GitHub adapter returns candidates in issue-number order, so equal `createdAt` values keep today's lowest-number order.
   - The GitHub adapter adds `createdAt` to the free-issue search it already runs (`--json number,createdAt`). Only free candidates can be ready, so no extra call is needed. A candidate that is not free gets `created: ''`, and it is filtered out before the sort.

   *Alternative:* a separate `gh issue list --json number,createdAt` over the Project items. Rejected: an extra call for issues that can never rank.

5. **`backend-failed`.** `ErrorCode` drops `gh-failed` and gains `backend-failed` and `unknown-backlog-provider`. The GitHub adapter's messages stay `gh`'s own. The help text's first paragraph names the backlog provider in use, from the registry entry's description.

6. **`lets-go` asks `lets backlog key`.**
   - In *Read the request*, the "A number" bullet becomes: when what is left is one word, run `lets backlog key -- '<word>'`, with each `'` written as `'\''`, as the idea search already does. A `key` makes it `<i>`; `null` makes it words.
   - The command runs before the discovery query and the title search, and an error stops the run as *Backlog errors* says.
   - `lets-plan` takes `<i>` as a key from its caller and changes no rule.

7. **Labels through one placeholder rule, not 22 rewrites.** The `## Placeholders` intro in `lets-go` says that `#<i>`, `#<parent>` and `#<story>` are written as the item's `label` in anything shown to a person, and that `<i>`, `<parent>` and `<story>` are the `key` in commands. `<i>`'s row says "key", not "number". The printed lines keep their text, so the 22 spec requirements that quote them stay as they are. The new `lets-go` requirement states the rule once.

   *Alternative:* replace `#<i>` with a new `<label>` placeholder in every printed line and in every spec requirement that quotes one. Rejected for this change: GitHub output is byte-identical either way, and the delta would be about 600 lines of copied requirements. The first non-GitHub backlog provider story can make that rewrite if the rule proves hard to follow.

## Risks / Trade-offs

- [An agent reads `#<i>` literally and prints `#PROJ-12`] → The placeholder rule sits in the section every placeholder is defined in. A bats check asserts the rule is there. It matters only once a second backlog provider ships, and that story's live run will show it.
- [The line reader meets a `lets:` block it cannot read, such as flow style `lets: {backlog: {provider: jira}}`] → It stops with `unknown-backlog-provider` and runs no backend command, so a backlog provider set in another style never falls back to GitHub. A command test pins it.
- [Renaming `number` to `key` misses a reader in the skills] → The bats checks search the `lets-go` and `lets-plan` prose for `.number` and `"number"` on `lets backlog` output, and the live run exercises `ready`, `item`, `claim` and `release`.
- [`created: ''` for a candidate that is not free reaches the sort] → `ready` filters on `free` before it sorts, and a policy test pins it.
- [`git rev-parse` adds a process to every command] → It is local and fast. The fallback to `cwd` keeps a checkout without git working.

## Migration & Rollback

- No data changes shape: assignees, Status and claim comments are written as today.
- Repositories without a `lets:` block keep GitHub.
- Skills and `lets` ship together through `lets sync`, so nothing outside the release reads the renamed fields.
- To roll back, revert the merge commit.

## Open Questions

- None that change the specs or the tasks.
