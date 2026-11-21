<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

`lets-go` looks for an idea's discovery with an older query than `lets-shape`: it finds only parents that say `Discovery status: in-progress`. Since #264, `lets-shape` matches parents by their `Input:` line, and also finishes a Finalize that an earlier round started. So when a run stops during Finalize and the user runs `lets-go` with the same input again, `lets-go` misses the parent. It stops on the uncommitted discovery maps with "commit or discard", or, with a clean tree, asks the title search's question again. `lets-shape` would have finished Finalize. #264 left this gap for #267.

## What Changes

- `lets-go`'s discovery lookup lists parents with `lets-shape`'s query, `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and keeps each whose `Input:` line names this input (D2).
- A kept parent is this input's discovery when it says `Discovery status: in-progress`, as today. It is also this input's discovery when it has no status line and an earlier shape round of this input left answers in its answers file. That is the state a stop during Finalize leaves (D4).
- After a stop during Finalize, a new run with the same input runs no title search and does not stop on the uncommitted maps. It runs the shape step, which finishes Finalize (D4).
- The lookup serves both inputs, as today: an idea, before the title search and in the dirty-map check, and an issue `#<i>`, in the dirty-map check (D5).
- Kept as they are: the title search, the idea header's note `Open issues were searched, and none is the same work.` and `lets-shape`'s rule that skips its own search (D1).
- `lets-go` still keeps its own copy of the lookup. #137's `lets backlog` discovery command replaces it, and #137's packet now says so (D3).
- No change to `lets-shape`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: the requirements *A stopped discovery resumes from its parent issue* and *lets-go commits the discovery map on the story's branch* match parents by their `Input:` line and cover a stop during Finalize. *The prose holds the fixed lines the tests check* names the new query instead of the in-progress-only one.

## Impact

- `skills/lets-go/references/shape.md`: *Start from an idea* step 1 and *Run the shape step* step 1.
- `skills/lets-go/SKILL.md`: only if a line there names the old query or the in-progress-only match.
- `tests/skill-interfaces.bats`: the checks that name the old query assert the new lookup, including the Finalize case (D6).
- `openspec/specs/lets-go/spec.md`, through this change's delta.
- No code under `lets/`, and no change to `lets-shape`, `step-prompt.md` or the `discovery-checkpoints` capability.
- The pull request records `wc -l` for each changed skill file, before and after (D6).
