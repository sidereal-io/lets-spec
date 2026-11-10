## Context

- `lets-go` holds the backlog `gh` calls as prose: the Project GraphQL query in *Read the settings*, the title search, the blocker read, the `next` pair (`gh project item-list` and the `is:open no:assignee -is:blocked` search), the packet read with its Project fields, the parent's body, and the claim and release writes. `lets-plan` repeats the title search.
- `lets` already runs outside commands through `Io.execFile` (`lets/src/io.ts`), and its tests pass a fake `Io`. `lets go questions` shows the command shape: `run(deps)` prints one JSON line and returns an exit code; a usage error exits 2.
- `lets/src/backlog/` and `tests/lets/backlog/` hold #135's executable kit, which nothing in production imports.
- `gh` 2.102 supports `gh project item-edit <n> --owner <o> --url <issue-url> --field Status --value <option>`, the form the skills use today, so the adapter needs no field or option IDs.

## Goals / Non-Goals

**Goals:**
- Each `lets backlog` command makes the same `gh` calls the skill makes today, and decides the same way.
- The adapter is only the part another provider would do differently. Ready filtering, ranking and the claim sequence are written once, outside it.

**Non-Goals:**
- Caching the Project between commands, batching, or speeding up `gh`.
- A provider selection key, config-file adapters (#236) or any second provider.
- Moving the comment thread read, the discovery query or pull request calls (D10, D12).

## Test Seams

- **Primary test seam:** each command's `run(deps)` in `lets/src/backlog/`, driven by a fake `Io` whose `execFile` answers `gh` calls from a table keyed by their arguments and records the calls. Node tests in `tests/lets/backlog/` assert the JSON printed, the exit code and the `gh` calls made, including the writes not made.
- **Existing seams reused:** `tests/lets/delegate/fixtures/command-deps.ts` for `deps`; `tests/skill-interfaces.bats` for the `lets-go` and `lets-plan` prose rules.

## Scrutiny Tier & Blast Radius

- **Tier:** high. It changes the architecture decision for backlogs, adds a CLI contract the skills depend on, and rewrites how `lets-go` claims work.
- **Blast radius:** `lets/src/backlog/`, `lets/src/main.ts`, `skills/lets-go/`, `skills/lets-plan/SKILL.md`, the shared glossary, `docs/decisions/`, the `lets-go` and `lets-backlog` specs, and their tests. A wrong claim affects shared backlog state: assignees and Status on the real Project.

## Decisions

1. **Layout.** `lets/src/backlog/` is replaced by four files: `adapter.ts` (the interface), `github.ts` (the only adapter), `policy.ts` (ready filter, rank, claim and release sequence) and `commands.ts` (argument parsing, JSON output, error mapping). `main.ts` registers a `backlog` command group. *Alternative:* one file per command. Rejected: the policy is shared by `ready` and `claim`, and one adapter object is what #236 implements.

2. **The adapter interface is the primitives today's calls need, and no more:**
   - `listCandidates()`: the open items of this repository on the Project, each with number, title, URL, Kind, Priority, Size, Status, and whether it is unassigned and unblocked. GitHub: `gh project item-list` plus the `is:open no:assignee -is:blocked` search, joined on number.
   - `readItem(i)`: the fields `item` returns. GitHub: `gh issue view <i> --json number,title,body,url,state,assignees,parent,blockedBy,subIssues`, the Project fields from `gh project item-list` for that number, and `gh issue view <parent> --json number,title,body` when there is a parent.
   - `searchTitles(words)`: GitHub: `gh issue list --state open --search "<words> in:title" --json number,title`.
   - `assignees(i)`, `assignSelf(i)`, `unassignSelf(i)`, `setStatus(i, status)`: GitHub: `gh issue view --json assignees`, `gh issue edit --add-assignee @me`, `--remove-assignee @me`, `gh project item-edit … --field Status --value`.

   Each primitive returns data or throws a typed `gh` failure. It never decides readiness or ordering. *Alternative:* #135's 17 workflow-shaped operations with tokens and guarantees. Rejected by D4 and D5.

3. **The backlog lookup runs on every command.** The GitHub adapter runs today's GraphQL query, unchanged, when it is created, and keeps `number`, `owner` and `repo` for that command. None or several Projects become `no-backlog` or `several-backlogs` before any other call. *Alternative:* cache it in `.workspace/`. Rejected: one more call per command is cheap, and a cache can go stale when a Project is relinked.

4. **Errors.** A `gh` call that cannot start, exits non-zero on a read, or times out on a read becomes `gh-failed`, with `gh`'s stderr as the message. `gh issue view` on a missing issue becomes `not-found`. A failed write in `claim` or `release` is a result, `failed`, with exit code 0, not an error (D8). Every read gets a finite `timeoutMs`; so does every write, and a write that times out is `failed` with the message `timed out; the write may have happened`.

5. **`ready` returns the whole ranked list.** `lets-go` runs *Check the prerequisite* and *Confirm the packet* on each candidate in rank order, so returning only the first would break that. `--only` and `--exclude` replace the narrowing the skill does by hand today.

6. **`find` returns matches unfiltered.** The `<branch> — ` title-prefix rule stays in `lets-go` and `lets-plan`, because it is about change names, not the backlog.

7. **No `ref` command.** `Closes #<n>` is written by the schemas and `lets-review-build`. It is not a `gh` call, so D4 leaves it as it is. A provider whose reference differs adds it with that provider.

8. **The ADR.** A new ADR records that backlog adapters are code in `lets` that runs the backend's commands itself and returns typed results. It supersedes ADR-015 for backlogs, and leaves ADR-015's delegation part alone. ADR-015 gets a note saying so. It names #236 as the way to a config-file adapter. The ADR step writes it.

9. **Removing #135's kit.** Delete `lets/src/backlog/*` and `tests/lets/backlog/*` before adding the new files, `docs/backlog-adapter-contract.md`, and the flake's dist check for that doc. Keep the `test:backlog` script, pointing at the new tests. Remove README mentions of the executable contract.

## Risks / Trade-offs

- [The `--url`/`--field`/`--value` form of `gh project item-edit` needs a recent `gh`] → It is the form the skills already run. `gh-failed` shows `gh`'s own error, and the README's requirements name the `gh` version mise pins.
- [The `lets-go` spec and its bats checks pin many exact strings; moving to `lets backlog` touches many of them] → Change the prose and the checks together, one requirement at a time, and run the bats suite after each.
- [A timed-out write may still have landed, and lets reports `failed` without checking] → Accepted by D8. The message says the write may have happened, and `lets-go` says what the issue may be left holding.
- [One GraphQL query per command adds a second or so to each call] → Accepted (Decision 3). A `lets-go` run makes about five backlog calls.
- [Today's queries are bounded: 500 Project items, 500 unassigned and unblocked issues, and 100 Projects per connection in the lookup. A ready issue past the window is not listed, and a second Project past it is not seen] → Kept as today's bounds (D4). The `lets-backlog` tests pin these limits, so a change to them is deliberate. This backlog holds about 240 issues.
- [A Project relinked between `claim` and `release` in one run makes `release` write to the new Project] → Accepted: the window is the seconds between claiming and creating the branch, and relinking a Project is an admin action.
- [Agents on an older `lets` release read skills that call `lets backlog`] → Skills and `lets` ship in the same release, and `lets sync` installs both together.

## Migration & Rollback

No data changes shape: assignees and Status are written as today. Projects pinned to an earlier release keep the `gh` prose until they bump. To roll back, revert the merge commit. The old kit had no users, so nothing depends on it.

## Open Questions

- The live run (D9) uses `mstelz/test-repo-pls-ignore`, which exists. Check that its Project still has the Kind, Priority, Size and Status fields before the acceptance task, and run `lets-setup-backlog` there if not.
