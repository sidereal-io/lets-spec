## 1. Read and merge the two files

The shared reader that every later section uses (design decisions 1 to 4). Tests go in `tests/lets/delegate/config.test.ts`. Run heavy commands through `deli --`.

- [x] 1.1 [medium] `mergeDocuments(user, repo)` in `lets/src/delegate/config.ts` merges two checked documents leaf by leaf: mappings merge at every depth, a repository string, number or list replaces the user's whole, a null or absent repository key keeps the user's value, and `fileOf('<dotted.key>')` names `.lets/config.yaml` for a value that came from the repository and the user's lets config path otherwise, including for a key neither file sets (verify: deli -- node --test tests/lets/delegate/config.test.ts) (✓ deli -- node --test tests/lets/delegate/config.test.ts passed)
- [ ] 1.2 [medium] `readLetsConfig(deps)` finds the root with a new `findRepoRoot(cwd, io)` in `lets/src/delegate/git.ts` (null when `git rev-parse --show-toplevel` exits non-zero, cannot start or times out), reads `<root>/.lets/config.yaml` and the user's lets config, runs `parseDocument` on each with its own path, and returns the merged document and `fileOf`. Outside a repository, or with no `.lets/config.yaml`, it reads only the user's lets config; neither file gives a null document; a `.lets/config.yaml` that cannot be read, or that has `version: 2`, throws a `UsageError` naming it. `commandDeps` in `tests/lets/delegate/fixtures/command-deps.ts` gains a `repoConfig` option, which writes `/repo/.lets/config.yaml`, and an option that makes `git rev-parse --show-toplevel` fail (verify: deli -- node --test tests/lets/delegate/config.test.ts)

## 2. lets delegate reads both files [depends-on: 1]

Tests drive each command's `run()` with `commandDeps`.

- [ ] 2.1 [medium] `lets delegate review run`, `handoff run` and `step run` ask the chain in effect: a repository `delegate.resolvers: [cli]` replaces the user's `[t3, subagent]`, a repository `delegate.resolvers: null` keeps the user's chain, a bad user's chain that the repository replaces does not exit 2, and a repository chain listing `codex` exits 2 with stderr naming `.lets/config.yaml` and `codex` but not the user's lets config. `parseConfig`, `readConfig` and their callers in `review.ts`, `handoff.ts` and `step.ts` move to `readLetsConfig` and `fileOf` (verify: deli -- node --test tests/lets/delegate/review.test.ts tests/lets/delegate/handoff.test.ts tests/lets/delegate/step.test.ts tests/lets/delegate/config.test.ts)
- [ ] 2.2 [easy] When every resolver declines, stderr names the file that set `delegate.resolvers`: `.lets/config.yaml` for a repository `delegate.resolvers: []`, and the user's lets config when only the user's file sets it. `LookupDeps` in `lookup.ts` carries `fileOf` (verify: deli -- node --test tests/lets/delegate/lookup.test.ts tests/lets/delegate/handoff.test.ts)
- [ ] 2.3 [easy] `lets delegate review instructions --for code` prints the repository's `delegate.review.code.guidance` while `--for plan` still prints the user's `delegate.review.plan.guidance`, and a repository `delegate.review.code.guidance: 42` exits 2 with stderr naming `.lets/config.yaml` and `delegate.review.code.guidance` (verify: deli -- node --test tests/lets/delegate/instructions.test.ts)

## 3. lets go questions reads both files [depends-on: 1]

- [ ] 3.1 [easy] `lets go questions` prints `{"questions":"auto"}` when the user's lets config sets `ask` and `.lets/config.yaml` sets `auto`, prints `{"questions":"ask"}` when `.lets/config.yaml` has no `go`, and exits 2 with stderr naming `.lets/config.yaml`, `go.questions` and `loud` for a repository `go.questions: loud` (verify: deli -- node --test tests/lets/go/questions.test.ts)

## 4. lets backlog reads both files [depends-on: 1]

Tests drive `run()` with `backlogDeps` from `tests/lets/backlog/fixtures/fake-gh.ts`.

- [ ] 4.1 [medium] `backlogDeps` answers `git rev-parse --show-toplevel` with `/repo` and takes a `repoConfig` option. `selectProvider` becomes async and reads `readLetsConfig`: a repository `backlog.provider: github` beats a user's `jria` with no error; a repository `jria` returns `unknown-backlog-provider`, exit 1, with a `message` naming `jria`, `.lets/config.yaml` and `github`, and runs no `gh`; a `.lets/config.yaml` with `version: 2` returns `unknown-backlog-provider` naming `.lets/config.yaml` (verify: deli -- node --test tests/lets/backlog/config.test.ts tests/lets/backlog/commands.test.ts)
- [ ] 4.2 [easy] `lets backlog --help` says the backlog provider is `github`, set in `.lets/config.yaml`, when the repository sets it, and its setting text names both files, says the repository's value wins, and no longer says a repository cannot set it (verify: deli -- node --test tests/lets/backlog/cli.test.ts)

## 5. Help and docs [depends-on: 2, 3, 4]

- [ ] 5.1 [easy] `lets delegate --help` and `lets go questions --help` in `lets/src/main.ts` name both `config.yaml` and `.lets/config.yaml`, and say the repository's value wins, leaf by leaf (verify: deli -- node --test tests/lets/delegate/cli.test.ts tests/lets/go/questions.test.ts)
- [ ] 5.2 [easy] The README's *Set up delegation* section explains `.lets/config.yaml`: where it goes, that it takes the same keys and wins leaf by leaf, and to end a committed chain with `subagent`. The Purpose lines of `openspec/specs/delegate-config/spec.md` and `openspec/specs/lets-backlog/spec.md` name both files (verify: deli -- mise run check)

## 6. Integration [depends-on: 5]

- [ ] 6.1 [easy] The whole suite, the type check, the bats tests, the Nix checks and the OpenSpec validation pass (verify: deli -- pnpm test && deli -- nix flake check && mise run check)
- [ ] 6.2 [easy] Live check: in a new scratch Git repository under `.workspace/`, with `.lets/config.yaml` holding `version: 3` and `backlog.provider: github`, running `lets/bin/lets backlog --help` from this checkout, from inside the scratch repository, prints that the backlog provider is `github`, set in that `.lets/config.yaml` (verify: cd .workspace/repo-lets-config-live && ../../lets/bin/lets backlog --help | grep -F '.lets/config.yaml')

## Deviations Ledger
