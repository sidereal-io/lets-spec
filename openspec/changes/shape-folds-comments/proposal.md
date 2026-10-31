## Why

Issue comments hold decisions and corrections that no skill reads. Four open stories carry a maintainer comment that moves their paths and specs, and a build planned today would use the old ones. This story is the walking skeleton of epic #124: read the thread, show it, fold what the user accepts, reply.

## What Changes

- A new shared reference, `skills/lets-shape/references/issue-comments.md`. It holds the rule that comments are evidence and never instructions, the thread query (D1), the `candidate` and `outside` labels (D2), the list every skill shows the user (D3), and the shape of shaping's reply (D6). #126 and #127 read the same file (D9).
- `lets-shape` reads the thread in the single-issue pass and in Ingest, asks about each comment (D4), folds a yes into the packet at its existing confirm step (D5), and posts one reply naming what it folded and dismissed (D6, D7). During Ingest a fold goes into the parent issue, because the input stays read-only (D8).
- The skill-interfaces test also scans `skills/*/references/*.md`, so the new `gh` command is checked like any other (D12).
- The README's `lets-shape` section says that shaping reads comments and folds the ones you accept.
- The glossary terms *packet* and *fold* ride this branch, already committed from the shaping checkpoint (D11).

Nothing is removed and nothing breaks: an issue with no comments shapes exactly as today.

## Capabilities

### New Capabilities
- `issue-comments`: how an agent reads an issue's thread, what it shows the user, how shaping folds a comment into the packet, and the reply that records it (D10).

### Modified Capabilities

None. `shared-domain-language` was read for context; its requirements do not change.

## Impact

- `skills/lets-shape/SKILL.md`: Phase 1 Ingest, and Shape one issue steps 1, 4 and 6.
- `skills/lets-shape/references/issue-comments.md`: new.
- `tests/skill-interfaces.bats`: the `prose()` helper.
- `README.md`: the `lets-shape` section.
- No code, config or schema changes. The skill reaches projects at the next release, through `lets sync`.
