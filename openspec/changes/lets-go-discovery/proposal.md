## Why

An idea too large for one issue ends a `lets-go` run today: the shape step fails and tells the user to run `lets-shape` discovery by hand. The epic says a large idea runs discovery, then `lets-go` carries on with the first ready story in the same run. This change adds that path.

## What Changes

- The shape step tells a large idea from a single issue, as `lets-shape` does: by sizing the work, or by seeing that the input holds a large idea (D1). Instead of failing, it asks whether to run discovery, with the recommendation `yes`. On yes, the resumed step runs `lets-shape`'s discovery, every phase from Ingest to Finalize, with the idea or the issue as its input (D2, D4). On any other answer the step fails, as before.
- Discovery is a path inside the `shape` step, not a step of its own. The step keeps its name, its answers file and its once-per-run bound (D3). A resumed round finds the discovery through `lets-shape`'s own checkpoints: the parent issue's status line and `discovery.md` (D5).
- The done report names the parent and the stories: `epic #<p>: <title>` first, then `story #<n>: <title>` per story, in the order created. One issue keeps `issue #<n>: <title>`, which a discovery that collapses to one story also uses (D6).
- `lets-go` picks the first ready story by naming `lets-build`'s `next` case, with its candidates narrowed to the report's stories: the two commands, the Must, Should, Could rank, and *Check the prerequisite* run as written (D7). It prints `Picked #<n>: <title>, the first ready story under #<p>.` and goes on from Start's step 3 with that story (D8). When no story is ready, it says so, names each story and why, and stops with no branch (D9).
- `lets-go` commits the discovery map. The shape step ends on the default branch with the tree clean except `openspec/discovery.md`. After *Claim* creates the story's branch, `lets-go` commits that file alone there as `docs:`, before it reads the tree. When the run stops before *Claim*, it says the map is uncommitted (D10).
- Glossary edits made in discovery go through `lets-shape`'s handoff, relayed to the user; the prompt recommends the first story as the owner (D11). The level is the shape step's, and is set again from the picked story's Kind (D12). An existing issue that holds a large idea takes the same path (D13).
- The README's `lets-go` section says what happens to a large idea, in place of the sentence that sends it to `lets-shape` (D15).

Nothing in `lets-build`, `lets-shape`, `flows.json` or `overlays/AGENTS.md` changes (D14, D15).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: what the shape step does with work too large for one issue; the discovery question and its answers; the `epic` and `story` evidence lines; the pick of the first ready story, its line and the none-ready stop; the discovery map commit; the fixed strings the tests check.

## Impact

- `skills/lets-go/SKILL.md`: the description, the `shape` row, *Run the shape step*, *Read the report*.
- `openspec/specs/lets-go/spec.md`: the shape step and step prompt requirements, one new requirement for discovery and the pick, the fixed strings, and its `## Purpose`, edited directly.
- `tests/skill-interfaces.bats`: the new fixed strings, and the too-large phrase that must go.
- `README.md`: the `lets-go` section.
- No code in `lets/` changes. The pinned `lets` 0.7.0 has no `step` command, so the tests check the skill's prose, as in #149, #150, #152 and #153 (D17).
