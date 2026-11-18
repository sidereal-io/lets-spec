## Story

#260 repo-lets-config — a repository sets its lets settings in a file of lets's own, which wins over the user's lets config
https://github.com/sidereal-io/lets-spec/issues/260

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where does the repository's lets config live? | `.lets/config.yaml` at the repository root, mirroring the user's `~/.config/lets/config.yaml`. | User |
| D2 | How does lets find the repository root? | `git rev-parse --show-toplevel` from the working folder, as `lets sync` does. Outside a Git repository, only the user's lets config applies. | Evidence: `lets/src/sync/main.ts` |
| D3 | Which keys may the repository's lets config set? | Every key the user's lets config takes: `version`, `delegate` (resolvers and guidance), `go.questions` and `backlog.provider`, with the same checks. | User |
| D4 | How deep does "the repository wins, key by key" go? | Leaf by leaf. Mappings merge all the way down. A value that is not a mapping, such as a string or the `delegate.resolvers` list, replaces the user's whole. | User |
| D5 | What does a `null` or absent key in the repository's lets config mean? | The repository does not set it, so the user's value applies. Every reader already treats `null` as unset. | User |
| D6 | Does the repository's lets config need `version: 3`? | Yes, the same rule as the user's. A file without it is an error that names `.lets/config.yaml`. | User |
| D7 | What does a bad repository's lets config do? | It stops the command as a bad user's lets config does, and the error names the file the bad value came from. | Evidence: #260 Scope |
| D8 | Which commands read both files? | Every reader of the user's lets config: `lets backlog`, `lets go questions` and `lets delegate` (`review`, `handoff`, `step`, `instructions`). | Evidence: #260 Scope |
| D9 | What proves the story is done? | Node tests for the merge rules, for each reader seeing the repository's value, for errors that name `.lets/config.yaml`, and for no repository or no file. README and help text name both files. A live `lets backlog help` in a scratch repository whose `.lets/config.yaml` sets the provider. | User |
| D10 | How does the glossary name the two files? | "User's lets config" stays. A new term, "repository's lets config", names `.lets/config.yaml`. "Backlog provider" says either file selects it, the repository's first. | User |

## Changes from the story

None. The story said the brainstorm picks the file's name and place: `.lets/config.yaml` (D1).

Confirmed by user: yes
