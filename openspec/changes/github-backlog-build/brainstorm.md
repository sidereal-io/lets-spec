## Story

#136 github-backlog-build — Take an existing GitHub story through the shared backlog boundary.
https://github.com/sidereal-io/lets-spec/issues/136

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | How does the build path reach the backlog? | lets runs the provider's commands itself, through a code adapter (GitHub first, calling `gh`), and returns typed results. The agent never runs backlog commands. | User |
| D2 | What happens to ADR-015? | A new ADR supersedes ADR-015 where it covers backlogs: lets runs adapters in code, with no agent between lets and the provider. Its delegation half stays unless this story contradicts it. | User |
| D3 | Can a provider be a config file? | Later, as command templates and output mappings that lets runs itself. Out of this story; filed as #236. | User |
| D4 | Which operations go behind `lets backlog`? | Today's: the backlog `gh` calls in `lets-go` and `lets-plan` move into lets and behave as now. #135's 17 operations are not implemented. | User |
| D5 | How big may an adapter get? | Lean: the adapter interface covers only what today's calls need; ranking and the claim check live once in shared code. | User |
| D6 | What happens to #135's leftovers? | Replaced: the contract spec, `docs/backlog-adapter-contract.md`, and the kit in `lets/src/backlog/` and its tests go; a short spec describes `lets backlog` as built. | User |
| D7 | How does lets pick the provider? | No config key yet; lets always uses GitHub. Selection arrives with the second provider. | User |
| D8 | What if a claim write fails partway? | `claim` returns `failed`, naming the write that failed and `gh`'s error, and `lets-go` stops. No undo, retry or journal. | User |
| D9 | What proves it works? | Node tests of each `lets backlog` command against a fake `gh`, and one live `lets-go` run in a throwaway test repository and Project. | User |
| D10 | Do pull request calls move too? | No. Pull request reads and edits are code host, not backlog, and stay as `gh` in the skills. | User |
| D11 | Does lets write completion? | No. GitHub closes the issue on merge, and the Project's automation sets Done, as today. | Evidence: `skills/lets-go/SKILL.md`, schemas' `Closes #<n>` |
| D12 | Do the comment-thread read and the discovery query move? | No. They stay as `gh` until #137, which shares them with `lets-shape`, with the `createdAt` fallback beside the thread read. The **Glossary handoff** body edit stays with them. | User |

## Changes from the story

- **Changed:** "Implement the previously agreed lifecycle contract" becomes "move today's backlog calls into a lean code adapter" (D1, D4, D5). #135's executable contract and ADR-015's execution hybrid are not built.
- **Added:** a new ADR superseding ADR-015 for backlogs (D2), and removal of #135's unused contract, doc and kit (D6).
- **Cut:** project selection per #23 (D7). Uncertain mutation outcomes narrow to one `failed` result (D8).
- **Corrected:** **Relevant code** names `skills/lets-build/SKILL.md`, but the claim now lives in `skills/lets-go/SKILL.md`, with a lookup in `skills/lets-plan/SKILL.md`.
- **Split out:** config-file adapters that lets runs itself, as #236 (Could, blocked by #136). #145 is now blocked by #236.
- **Superseded elsewhere:** #180 (move GitHub onto the execution hybrid) has no target left once D2 lands.

Confirmed by user: yes
