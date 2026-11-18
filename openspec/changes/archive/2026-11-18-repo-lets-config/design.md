## Context

- Every reader of the user's lets config gets one path from `configPath` in `lets/src/delegate/config.ts`, reads the text with `deps.io.readFile`, and checks it with `parseDocument`, which checks YAML, mapping and `version: 3`. Each command group then checks its own section: `parseConfig` and `guidanceFor` for `lets delegate`, `questionModeFor` for `lets go questions`, `backlogProviderFor` for `lets backlog`. Each check takes the `path` it names in errors.
- The readers are `lets/src/delegate/review.ts`, `handoff.ts`, `step.ts`, `instructions.ts` (through `readConfig`), `lookup.ts` (names the path when every resolver declines), `lets/src/go/questions.ts` and `lets/src/backlog/config.ts` (`selectProvider`). All read the config synchronously today. Every command that calls them is already async.
- Every command's `Deps` already carries `cwd`. `lets/src/delegate/git.ts` has `repoRoot`, which runs `git rev-parse --show-toplevel` but throws outside a repository. `lets sync` runs the same Git command.
- Test fakes: `tests/lets/delegate/fixtures/command-deps.ts` answers every `git rev-parse` but `HEAD` with `/repo`. `tests/lets/backlog/fixtures/fake-gh.ts` throws for any program but `gh`, so every backlog test breaks once `lets backlog` runs Git.
- Help text naming the user's lets config: `lets/src/main.ts` (the `lets delegate` and `lets go questions` help) and `lets/src/backlog/commands.ts` (`SETTING`, which says "A repository cannot set it yet."). The README's *Set up delegation* section names one file.

## Goals / Non-Goals

**Goals:**

- One place reads both files, merges them and knows which file each value in effect came from.
- The section checks that exist stay as they are, and name the right file.

**Non-Goals:**

- No change to any section's keys or meaning.
- No command that prints the merged config.
- No change to `lets sync`, which reads `openspec/config.yaml` for other reasons.

## Test Seams

- **Primary test seam:** each command's `run(…, deps)` with fake `Deps`, as the existing tests drive `lets go questions`, `lets delegate` and `lets backlog`. A test writes the user's lets config and `/repo/.lets/config.yaml` into the fake files, and asserts stdout, stderr and the exit code.
- **Existing seams reused:** `commandDeps` (gains a `repoConfig` option that writes `/repo/.lets/config.yaml`, and an option for Git to fail), `backlogDeps` (answers `git rev-parse --show-toplevel` with `/repo`). The merge itself gets a small unit test in `tests/lets/delegate/config.test.ts` for the rules that are tedious to reach through a command: deep merge, a list replaced whole, null kept, and the source of each value.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the config module and its seven readers across `lets delegate`, `lets go` and `lets backlog`. It adds a new file contract in every repository, `.lets/config.yaml`, but changes nothing for a repository without one.

## Decisions

1. **One reader, `readLetsConfig`, returns the merged document and a way to name each value's file.** It lives in `lets/src/delegate/config.ts`, beside `parseDocument`, and is async: `readLetsConfig(deps: ConfigDeps & { cwd }) → { document, fileOf(key) }`. `document` is the merged mapping, or null when neither file exists. `fileOf('delegate.resolvers')` returns the path of the file that holds the value in effect at that dotted key. It looks up the longest key prefix whose value came from the repository's lets config, and otherwise answers the user's lets config path, which also covers a value neither file sets. `readConfig` becomes `readLetsConfig` followed by `parseConfig`, and each section check takes `fileOf` in place of `path`.
   *Alternative:* merge the texts, then parse once. Rejected: errors could not name the file a value came from.
   *Alternative:* each reader reads both files itself. Rejected: seven copies of the merge and the source rule.

2. **Each file is checked whole before the merge, and each section only after it.** `parseDocument` runs on each file's text with that file's path, so a file that is not YAML, not a mapping or not `version: 3` always fails and names itself (spec: *The config file*). The section checks run on the merged document, so a bad user's value that the repository replaces never stops a command (spec: *The repository's value wins, leaf by leaf*).

3. **The merge.** `mergeDocuments(user, repo)`: start from the user's mapping; for each key in the repository's mapping, a null value is skipped; where both values are plain mappings, recurse; otherwise the repository's value replaces the user's. While merging, record every dotted key path whose value came from the repository. `fileOf` reads that record.

4. **Finding the repository's lets config.** A new `findRepoRoot(cwd, io)` in `lets/src/delegate/git.ts` runs `git rev-parse --show-toplevel` with `cwd` and a short timeout. It returns the root, or null when Git exits non-zero, cannot start or times out. The repository's lets config is `<root>/.lets/config.yaml`, read with `io.readFile`. Messages name it by its absolute path, as they name the user's lets config. A read that throws, such as a folder, is a config error that names the file, as `selectProvider` already does for the user's lets config.
   *Alternative:* walk up from `cwd` looking for `.lets/`. Rejected: Git already knows the root, including in a worktree, and `lets sync` uses it.

5. **Errors keep each command group's own form.** `lets delegate` and `lets go questions` throw `UsageError` (exit 2). `selectProvider` turns any config error into `unknown-backlog-provider` (exit 1), as now. Only the path in the message changes.

6. **`lookup.ts` names `fileOf('delegate.resolvers')`** when every resolver declines. `LookupDeps` carries `fileOf` beside `config`.

7. **Help and docs.** `lets delegate --help`, `lets go questions --help` and the `lets backlog` help (`SETTING`) name both files and say the repository's value wins, leaf by leaf. The `lets backlog` help line already says `set in <path>`, and now gets the file from `fileOf('backlog.provider')`. The README's *Set up delegation* gets a short part on `.lets/config.yaml`. The main specs' Purpose lines for `delegate-config` and `lets-backlog` name both files; a delta cannot change a Purpose, so the build edits them directly.

8. **ADR candidate:** the repository's lets config lives at `.lets/config.yaml`, takes every key of the user's lets config, and wins leaf by leaf. It is a contract with every repository that commits one, and it extends ADR-011's one-file rule to two files.

## Risks / Trade-offs

- [A repository's `delegate.*.guidance` reaches the prompts of agents run in it, so a hostile repository can steer them] → It is the same trust a repository's own `AGENTS.md` and skills already get. `delegate.resolvers` can only name the three resolvers built into lets, so no repository can make lets run a program of its choosing.
- [A committed `delegate.resolvers` may name a resolver missing on a contributor's machine] → A resolver that cannot run here declines, and the next is asked. The README says to end a committed chain with `subagent`.
- [Every command now runs Git once more] → One `git rev-parse` per command, with a timeout. `lets delegate review` and `step` already run it.
- [Moving the config read from sync to async touches every reader] → The readers' callers are already async. The command tests cover each one.
- [A Git failure is taken as no repository, so a broken repository's lets config is silently ignored] → Only when Git itself cannot answer. Any file Git finds is read and checked.

## Migration & Rollback

N/A for users: nothing reads `.lets/config.yaml` until a repository adds one, and the user's lets config keeps its meaning. Rollback is reverting the change; a committed `.lets/config.yaml` is then ignored.
