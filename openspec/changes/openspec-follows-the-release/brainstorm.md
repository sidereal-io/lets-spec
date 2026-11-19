## Story

#273 openspec-follows-the-release — mise projects run the OpenSpec CLI their lets-spec release records, with no pin of their own. https://github.com/sidereal-io/lets-spec/issues/273

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Should the release's `openspec` launcher set `OPENSPEC_NO_UPDATE_CHECK=1`, as the Nix wrapper does, so OpenSpec's newer-version notice stops prompting agents to ask about upgrading? | Yes. The launcher sets `OPENSPEC_NO_UPDATE_CHECK=1`. | User |
| D2 | On a tarball install, when another `openspec` comes first on PATH with a different version, what does the `lets sync` warning say? | `the OpenSpec CLI on PATH is <found>, but this release's openspec-* skills were generated from <pinned>. Remove the "npm:@fission-ai/openspec" line from mise.toml, or any other openspec that comes before this release's on PATH.` Nix installs keep today's wording, which ends `Pin the CLI to <pinned>.` | User |
| D3 | When a mise project keeps its old `npm:@fission-ai/openspec` pin at the same version the release records, does `lets sync` warn? | No. It says nothing. The README's *Updating* section tells users to drop the pin, and the warning returns once the versions differ. | User |
| D4 | Does this change need to close or update #26, which this story supersedes? | No. #26 is already closed. | Evidence: `gh issue view 26` (state CLOSED) |

## Changes from the story

- Added: the launcher turns off OpenSpec's update check (D1). The packet did not mention it.
- Specified: the tarball-install warning wording (D2) and the silent same-version case (D3). The packet named the topic but not the text.
- Nothing cut, and nothing split out.

Confirmed by user: yes
