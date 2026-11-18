## Why

lets reads its settings only from the user's lets config, which each person writes on each machine. So a team cannot set its backlog provider once for every contributor and clone, and two people on one repository can differ. This matters now, before the Jira, Linear and Beads providers ship (#138, #140, #142): a team on one of them needs the repository to choose it.

## What Changes

- A repository can commit a repository's lets config, `.lets/config.yaml` at its root (D1). lets finds the root with Git, and outside a Git repository reads only the user's lets config (D2).
- The repository's lets config takes the same keys as the user's lets config, with the same checks and the same `version: 3` (D3, D6).
- lets merges the two files leaf by leaf, and the repository's value wins. A `null` or absent key leaves the user's value in place (D4, D5).
- Every command that reads the user's lets config reads both: `lets backlog`, `lets go questions`, and `lets delegate review`, `handoff` and `step`, with their `instructions` and `run` (D8).
- An error about a bad value names the file the value came from (D7).
- The help text of `lets backlog` and `lets go questions` names both files, and the README's *Set up delegation* section explains the repository's lets config (D9).
- The glossary defines the user's lets config and the repository's lets config (D10). That commit is already on the branch.

Nothing changes for a repository without `.lets/config.yaml`. `openspec/config.yaml` stays OpenSpec's file, and lets still reads no settings from it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-config`: the config is now two files, the user's lets config and the repository's lets config, merged leaf by leaf with the repository's value winning. Errors name the file a bad value came from.
- `go-questions`: `lets go questions` reads `go.questions` from both files, and its help names both.
- `lets-backlog`: the backlog provider comes from both files, the repository's first. Its errors name the file that holds the bad value, and the help text says which file set the provider.

## Impact

- Code: `lets/src/delegate/config.ts` (`configPath`, `readConfig`, `parseDocument`), `lets/src/config-dir.ts`, `lets/src/backlog/config.ts` (`selectProvider`), `lets/src/backlog/commands.ts` (help text), `lets/src/go/questions.ts`, `lets/src/delegate/instructions.ts`, `review.ts`, `handoff.ts`, `step.ts` and `lookup.ts`.
- Each reader now needs the working folder, to find the repository root. It runs `git rev-parse --show-toplevel` once per command.
- Tests: the Node tests for each reader and for the config module.
- Docs: `README.md` (*Set up delegation*), and the help text above.
- No new dependency. The `yaml` package already parses the user's lets config.
