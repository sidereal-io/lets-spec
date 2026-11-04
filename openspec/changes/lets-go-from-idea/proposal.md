## Why

`lets-go` needs an issue number. Most work starts as an idea in words, and the shape step is the only step that runs before an issue exists. Today that step has no place in a `lets-go` run, so the user shapes by hand and then runs `lets-go` with the number.

## What Changes

- `lets-go` takes an idea in words on the default branch: a request that names no issue. A leading or trailing `ask` or `recommend` names the level and is not part of the idea (D1). On a change's branch, words stop the run: an idea needs the default branch (D2).
- Start searches for an existing issue first, by naming `lets-build`'s *Find the source of demand* case 2, and asks the user whether a match is the same work. A yes makes that issue `<i>`. A no, or no match, sends the idea to the shape step. The "run `lets-shape`" stop in that case is set aside (D3).
- The shape step also runs for an issue that exists but is not shaped. Every stop in *Confirm the packet* whose remedy is "run `lets-shape` on #<i>" sends the issue to the shape step instead. The Epic stop stands (D4).
- A fourth step, `shape`, runs `lets-shape`'s *Shape one issue* to its end through `lets delegate step run --for shape`, with the same prompt frame, relay and subagent fallback as the other steps. It runs on the default branch, before any branch or change exists, and ends there with a clean tree (D5). Its prompt says the search has run, or names the issue to shape (D6). It runs at most once per run (D4).
- The shape step runs at the user's level when named, else at `ask`. Start prints `Interactivity: ask, because shape has not run yet.` After shape, the level is picked again from the packet's Kind (D7).
- The shape step's `done` report names the issue in its first evidence line, `issue #<n>: <title>`, and `lets-go` reads `<n>` from it. A report without that line is `failed` (D8). Start then goes on from its step 3 with `<i>`, and the shape line is `Done shape: <date>. <evidence>` (D9).
- The shape step's scratch files are named `issue-<i>` or `idea-<slug>`, since there is no change name yet. `lets-go` removes its answers file once the step reports `done` or `failed` (D10).
- An idea too large for one issue ends the shape step with a `failed` report, and `lets-go` says to run `lets-shape` on the idea. #154 adds the discovery path (D11).
- The prompt frame's first lines change for shape: no schema, the default branch, and the idea or the issue number (D12).
- The `lets-go` routing row in `overlays/AGENTS.md` and the README becomes `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run`. The README's `lets-go` section and the skill's description say it takes an idea (D14).

Nothing in `lets-build`, `lets-shape` or `flows.json` changes (D13, D15).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: what the request may hold, and what an idea is; the search for an existing issue and the stops Start sets aside; the shape step, its prompt, its level, its report and what runs after it; the `Done shape` and `Failed shape` lines; the routing row text; the fixed strings the tests check.

## Impact

- `skills/lets-go/SKILL.md`: the description, Start step 2 and the new shape path, steps 5 and 10, *Find the first unfinished step*, the step list, the prompt frame, *Read the report*, the subagent fallback and *End of the run*.
- `openspec/specs/lets-go/spec.md`: the modified requirements, one new requirement for the shape step, and its `## Purpose`, which a delta cannot change.
- `tests/skill-interfaces.bats`: the new fixed strings and the new routing row text.
- `overlays/AGENTS.md` and `README.md`: the routing row and the `lets-go` section.
- No code in `lets/` changes. The pinned `lets` 0.7.0 has no `step` command, so the tests check the skill's prose, as in #149, #150 and #152 (D17).
