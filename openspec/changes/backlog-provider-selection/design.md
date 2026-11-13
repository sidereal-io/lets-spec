## Context

- `lets/src/backlog/commands.ts` always builds the GitHub adapter (`createGithub` is the default `makeAdapter`). `createGithub` runs the Project lookup before it returns, so every command needs a linked Project.
- `Adapter`, `Candidate`, `Item`, `Ref` and `Related` in `adapter.ts` name items by `number: number`. `commands.ts` parses every argument with `issueNumber`, a whole number above zero. `policy.ts` ranks ties by `a.number - b.number`.
- The user's lets config, `$XDG_CONFIG_HOME/lets/config.yaml` or `~/.config/lets/config.yaml`, is parsed with the `yaml` package. `parseDocument` in `lets/src/delegate/config.ts` checks that it is YAML, a mapping and `version: 3`, and each command group reads its own section: `questionModeFor` reads `go.questions`. ADR-011 lays the file out as one section per command group.
- `openspec/config.yaml` is OpenSpec's file. lets reads only its `schema:` line, in `lets sync`, and keeps its own settings out of it.
- The GitHub adapter's free-issue search (`gh issue list --search "is:open no:assignee -is:blocked" --json number`) already decides which candidates are `free`, and only free candidates can be ready.
- `lets-go` decides "number or idea" in its own prose (`SKILL.md`, *Read the request*). It writes `#<i>` in about 24 lines it prints, and its spec quotes those lines in 22 requirements.

## Goals / Non-Goals

**Goals:**
- One place decides the backlog provider, and one place lists the backlog providers this release ships.
- `policy.ts` and `commands.ts` never assume a key's form.
- GitHub keeps the same `gh` commands, writes and results, apart from the field names and the one `--json` field D4 needs.

**Non-Goals:**
- A second backlog provider, or settings beyond `provider` under `backlog`.
- A repository setting for the backlog provider. A new story adds a file of lets's own in the repository, which wins over the user's config.
- The pull request reference and completion (#258).
- The `gh` calls `lets-go` keeps until #137: the comment thread read, `gh issue view <i> --json createdAt`, the in-progress parent query and the glossary-handoff body edit.
- Rewriting every `#<i>` line in the `lets-go` spec (Decision 7).

## Test Seams

- **Primary test seam:** `run(argv, deps)` in `lets/src/backlog/commands.ts`, driven by a fake `Io`. Today the fake `Io` answers `gh` calls from a table keyed by their arguments. This change adds:
  - `readFile` for the user's lets config, at the path `configPath` gives for the fake `env` and home folder;
  - a fake backlog provider registered in place of the shipped list, whose keys look like Jira's.

  The Node tests in `tests/lets/backlog/` assert the printed JSON, the exit code and the backend calls made.
- **Existing seams reused:**
  - `tests/lets/backlog/fixtures/` for the GitHub `gh` tables;
  - the live run on `mstelz/test-repo-pls-ignore` that #136 used.

## Scrutiny Tier & Blast Radius

- **Tier:** high. It changes a CLI contract the skills depend on (`key`, `label`, `backend-failed`), adds a `backlog` section to the user's lets config, and changes how `lets-go` reads a request.
- **Blast radius:**
  - code and tests: `lets/src/backlog/`, `tests/lets/backlog/`;
  - skills: `skills/lets-go/`, `skills/lets-plan/SKILL.md`;
  - specs: `lets-backlog` and `lets-go`.

  A wrong key mapping could claim or release the wrong GitHub issue.

## Decisions

1. **A registry of backlog providers.** A new `providers.ts` maps each shipped name to two functions:
   - `parseKey(text)`, which returns `{ key, label } | null` and calls no backend;
   - `create(io, cwd)`, which builds the adapter.

   GitHub is the only entry. `commands.ts` takes the registry through its deps, so tests register a fake backlog provider. `key` calls only `parseKey`, so it needs no Project (D10). `item`, `claim` and `release` also run `parseKey` on their argument before they build the adapter: `null` is `not-found` with no backend call, and a key is passed on in its parsed form, so `#149` and `149` name the same issue. `--only` and `--exclude` run each key through `parseKey` too, and leave out one that gives `null`.

   *Alternative:* a `parseKey` method on `Adapter`. Rejected: building the GitHub adapter runs the Project lookup, so `key` would need a Project and a network call.

2. **Reading the backlog provider.** `backlogProviderFor(document, path)` sits in `lets/src/backlog/config.ts`, beside `questionModeFor`'s pattern. `selectProvider` reads the user's lets config at `configPath`, checks it with `parseDocument`, and reads `backlog.provider`.
   - No file, no `backlog`, or no `provider` (absent or null) means `github`.
   - A file `parseDocument` rejects, a `backlog` that is not a mapping, or a `provider` that is not a string throws `BacklogError('unknown-backlog-provider')`, whose message names the file and what is wrong. A setting that is there is never taken for absence.
   - A name not in the registry throws `BacklogError('unknown-backlog-provider')` before any backend call.
   - lets never reads the backlog provider from `openspec/config.yaml`, and needs no repository root to find the setting.

   *Alternative:* a `lets:` block in `openspec/config.yaml`. Rejected: it is OpenSpec's file, and lets settings stay out of it, even though OpenSpec ignores keys it does not know.
   *Alternative:* a file of lets's own in the repository, which a whole team shares. Deferred to a new story: it is a second config file and a precedence rule, and this change keeps to the setting's first home.

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
- [Each person sets the backlog provider on each machine, so two people on one repository can differ] → Until the repository setting story ships, the default, GitHub, is the only backlog provider, so nobody needs to set it. The pull request names the gap.
- [Renaming `number` to `key` misses a reader in the skills] → The bats checks search the `lets-go` and `lets-plan` prose for `.number` and `"number"` on `lets backlog` output, and the live run exercises `ready`, `item`, `claim` and `release`.
- [`created: ''` for a candidate that is not free reaches the sort] → `ready` filters on `free` before it sorts, and a policy test pins it.

## Migration & Rollback

- No data changes shape: assignees, Status and claim comments are written as today.
- A user config without a `backlog` section keeps GitHub.
- Skills and `lets` ship together through `lets sync`, so nothing outside the release reads the renamed fields.
- To roll back, revert the merge commit.

## Open Questions

- None that change the specs or the tasks.
